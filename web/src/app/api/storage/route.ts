import { NextRequest, NextResponse } from "next/server";
import storage, { FileInfo } from "@/services/storageService";
import { requireAuth } from "@/lib/cookieAuth";

// Initialize storage with env vars (should be already done or we ensure it here)
// Better to have a singleton in service that self-initializes or lazily initializes.
// Looking at storageService.ts, it needs init().
// We should probably ensure it's initialized.
const SFTPGO_URL = process.env.SFTPGO_URL || "http://localhost:8088";
const SFTPGO_USER = process.env.SFTPGO_ADMIN_USER || "admin";
const SFTPGO_PASS = process.env.SFTPGO_ADMIN_PASSWORD || "password";

// Lazy init wrapper
const getStorage = () => {
    try {
        storage.getWebDAVUrl();
    } catch {
        storage.init({
            baseUrl: `${SFTPGO_URL}/webdav`,
            username: SFTPGO_USER,
            password: SFTPGO_PASS
        });
    }
    return storage;
};

export async function POST(req: NextRequest) {
    try {
        const { authorized } = requireAuth(req);
        if (!authorized) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const path = formData.get("path") as string || "/";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        // Fix path concatenation
        const safePath = path.endsWith('/') ? path : `${path}/`;
        const filePath = `${safePath}${file.name}`;

        await getStorage().uploadFile(filePath, buffer);

        return NextResponse.json({ success: true, path: filePath });
    } catch (error) {
        console.error("Storage upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { authorized } = requireAuth(req);
        if (!authorized) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const path = searchParams.get("path") || "/";
        const action = searchParams.get("action");

        const store = getStorage();

        if (action === 'download') {
            const fileBuffer = await store.downloadFile(path);

            return new NextResponse(new Blob([new Uint8Array(fileBuffer)]), {
                headers: {
                    "Content-Disposition": `attachment; filename="${path.split('/').pop()}"`,
                    "Content-Type": "application/octet-stream"
                }
            });
        }

        if (action === 'stats') {
            // Expensive recursive calc not supported by basic WebDAV typically without recurse
            // For now just list root
            const files = await store.listDirectory("/");
            // This stat logic was simplistic in previous code, mostly broken.
            // Let's just return what we can.
            const totalSize = files.reduce((acc: number, file: FileInfo) => acc + (file.size || 0), 0);

            return NextResponse.json({
                used: totalSize,
                count: files.length,
                limit: 10 * 1024 * 1024 * 1024
            });
        }

        const files = await store.listDirectory(path);

        return NextResponse.json({ files });
    } catch (error) {
        console.error("Storage list error:", error);
        return NextResponse.json({ error: "List failed" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { authorized } = requireAuth(req);
        if (!authorized) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const path = searchParams.get("path");

        if (!path) {
            return NextResponse.json({ error: "Path required" }, { status: 400 });
        }

        await getStorage().delete(path);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Storage delete error:", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
