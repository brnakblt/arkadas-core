import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verify2FA, createTrustedDevice } from "@/lib/twoFactorAuth";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

/**
 * POST /api/auth/2fa/verify
 * 2FA kodunu doğrular (giriş veya kurulum onayı için)
 */
export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("strapi_jwt")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { code, action = "login", trustDevice = false } = body;

        if (!code) {
            return NextResponse.json({ error: "Doğrulama kodu gerekli" }, { status: 400 });
        }

        // Get user
        const userResponse = await fetch(`${STRAPI_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!userResponse.ok) {
            return NextResponse.json({ error: "Failed to get user" }, { status: 401 });
        }

        const user = await userResponse.json();

        // Get 2FA record
        const twoFaResponse = await fetch(
            `${STRAPI_URL}/api/two-factor-auths?filters[user][id][$eq]=${user.id}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            }
        );

        const twoFaData = await twoFaResponse.json();
        const twoFa = twoFaData.data?.[0];

        if (!twoFa) {
            return NextResponse.json({ error: "2FA kaydı bulunamadı" }, { status: 404 });
        }

        // Verify the code
        const verification = verify2FA(
            twoFa.secret,
            code,
            twoFa.backupCodes || [],
            twoFa.failedAttempts || 0,
            twoFa.lockedUntil ? new Date(twoFa.lockedUntil) : null
        );

        if (!verification.valid) {
            // Update failed attempts
            await fetch(`${STRAPI_URL}/api/two-factor-auths/${twoFa.documentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    data: {
                        failedAttempts: (twoFa.failedAttempts || 0) + 1,
                        lockedUntil: verification.remainingAttempts === 0
                            ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
                            : null,
                    },
                }),
            });

            return NextResponse.json(
                {
                    error: verification.error,
                    remainingAttempts: verification.remainingAttempts,
                },
                { status: 401 }
            );
        }

        // Prepare update data
        const updateData: Record<string, unknown> = {
            failedAttempts: 0,
            lockedUntil: null,
            lastUsedAt: new Date().toISOString(),
        };

        // Update backup codes if one was used
        if (verification.updatedBackupCodes) {
            updateData.backupCodes = verification.updatedBackupCodes;
        }

        // Handle setup verification
        if (action === "setup" && !twoFa.isVerified) {
            updateData.isVerified = true;
            updateData.isEnabled = true;
        }

        // Handle trusted device
        let deviceId: string | undefined;
        if (trustDevice) {
            const userAgent = request.headers.get("user-agent") || "Unknown";
            const ip = request.headers.get("x-forwarded-for") ||
                request.headers.get("x-real-ip") ||
                "Unknown";

            const device = createTrustedDevice(userAgent, ip);
            deviceId = device.id;

            const trustedDevices = twoFa.trustedDevices || [];
            trustedDevices.push(device);

            // Keep max 5 devices
            if (trustedDevices.length > 5) {
                trustedDevices.shift();
            }

            updateData.trustedDevices = trustedDevices;
        }

        // Update 2FA record
        await fetch(`${STRAPI_URL}/api/two-factor-auths/${twoFa.documentId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ data: updateData }),
        });

        const response: Record<string, unknown> = {
            success: true,
            message: action === "setup" ? "2FA başarıyla aktifleştirildi" : "Doğrulama başarılı",
        };

        if (deviceId) {
            response.deviceId = deviceId;
        }

        if (verification.updatedBackupCodes) {
            response.backupCodesRemaining = verification.updatedBackupCodes.length;
            response.warning = verification.updatedBackupCodes.length <= 2
                ? "Yedek kodlarınız azalıyor, yeni kodlar oluşturun."
                : undefined;
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error("2FA verify error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
