import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { setup2FA, verify2FA } from "@/lib/twoFactorAuth";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

/**
 * POST /api/auth/2fa/setup
 * 2FA kurulumu başlatır, QR kod ve yedek kodları döndürür
 */
export async function POST(_request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("strapi_jwt")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get current user
        const userResponse = await fetch(`${STRAPI_URL}/api/users/me?populate=tenant`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!userResponse.ok) {
            return NextResponse.json({ error: "Failed to get user" }, { status: 401 });
        }

        const user = await userResponse.json();

        // Check if 2FA already exists
        const existingResponse = await fetch(
            `${STRAPI_URL}/api/two-factor-auths?filters[user][id][$eq]=${user.id}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            }
        );

        const existingData = await existingResponse.json();
        if (existingData.data && existingData.data.length > 0 && existingData.data[0].isEnabled) {
            return NextResponse.json(
                { error: "2FA zaten aktif. Önce devre dışı bırakın." },
                { status: 400 }
            );
        }

        // Setup 2FA
        const setupData = setup2FA(user.email, "Arkadaş ERP");

        // Save to database (not enabled yet, needs verification)
        const saveResponse = await fetch(`${STRAPI_URL}/api/two-factor-auths`, {
            method: existingData.data?.length > 0 ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                data: {
                    user: user.id,
                    secret: setupData.secret,
                    backupCodes: setupData.backupCodes,
                    isEnabled: false,
                    isVerified: false,
                    failedAttempts: 0,
                    tenant: user.tenant?.id,
                },
            }),
        });

        if (!saveResponse.ok) {
            const errorData = await saveResponse.json();
            console.error("Failed to save 2FA:", errorData);
            return NextResponse.json({ error: "2FA kaydedilemedi" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            qrCodeUrl: setupData.qrCodeUrl,
            backupCodes: setupData.backupCodes,
            message: "QR kodu tarayın ve doğrulama kodunu girin",
        });
    } catch (error) {
        console.error("2FA setup error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * GET /api/auth/2fa/setup
 * 2FA durumunu kontrol eder
 */
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("strapi_jwt")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userResponse = await fetch(`${STRAPI_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!userResponse.ok) {
            return NextResponse.json({ error: "Failed to get user" }, { status: 401 });
        }

        const user = await userResponse.json();

        const twoFaResponse = await fetch(
            `${STRAPI_URL}/api/two-factor-auths?filters[user][id][$eq]=${user.id}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            }
        );

        const twoFaData = await twoFaResponse.json();
        const twoFa = twoFaData.data?.[0];

        return NextResponse.json({
            isEnabled: twoFa?.isEnabled || false,
            isVerified: twoFa?.isVerified || false,
            hasBackupCodes: (twoFa?.backupCodes?.length || 0) > 0,
            backupCodesCount: twoFa?.backupCodes?.length || 0,
            trustedDevicesCount: twoFa?.trustedDevices?.length || 0,
        });
    } catch (error) {
        console.error("2FA status error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * DELETE /api/auth/2fa/setup
 * 2FA'yı devre dışı bırakır
 */
export async function DELETE(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("strapi_jwt")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { verificationCode, password } = body;

        if (!verificationCode || !password) {
            return NextResponse.json(
                { error: "Doğrulama kodu ve şifre gerekli" },
                { status: 400 }
            );
        }

        const userResponse = await fetch(`${STRAPI_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        const user = await userResponse.json();

        // Verify password by trying to login
        const passwordCheck = await fetch(`${STRAPI_URL}/api/auth/local`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                identifier: user.email,
                password,
            }),
        });

        if (!passwordCheck.ok) {
            return NextResponse.json({ error: "Geçersiz şifre" }, { status: 401 });
        }

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

        // Verify 2FA code
        const verification = verify2FA(
            twoFa.secret,
            verificationCode,
            twoFa.backupCodes || [],
            twoFa.failedAttempts || 0,
            twoFa.lockedUntil ? new Date(twoFa.lockedUntil) : null
        );

        if (!verification.valid) {
            return NextResponse.json({ error: verification.error }, { status: 401 });
        }

        // Disable 2FA
        await fetch(`${STRAPI_URL}/api/two-factor-auths/${twoFa.documentId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });

        return NextResponse.json({
            success: true,
            message: "2FA devre dışı bırakıldı",
        });
    } catch (error) {
        console.error("2FA disable error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
