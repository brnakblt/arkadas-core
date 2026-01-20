import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { requireAuth } from "@/lib/cookieAuth";

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check
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

        // 2. Buffer conversion
        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = `${path}${path.endsWith('/') ? '' : '/'}${file.name}`;

        // 3. Upload to SFTPGo
        await storage.uploadFile(filePath, buffer);

        return NextResponse.json({ success: true, path: filePath });
    } catch (error) {
        console.error("Storage upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        // 1. Auth Check
        const { authorized } = requireAuth(req);
        if (!authorized) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const path = searchParams.get("path") || "/";
        const action = searchParams.get("action"); // 'list' or 'download'

        if (action === 'download') {
            const fileBuffer = await storage.getFile(path);

            // Return file stream
            return new NextResponse(fileBuffer as any, {
                headers: {
                    "Content-Disposition": `attachment; filename="${path.split('/').pop()}"`,
                    "Content-Type": "application/octet-stream"
                }
            });
        }

        if (action === 'stats') {
            const files = await storage.listFiles("/");
            const totalSize = files.reduce((acc, file) => acc + (file.size || 0), 0);
            const fileCount = files.filter(f => f.type === 'file').length;

            return NextResponse.json({
                used: totalSize,
                count: fileCount,
                limit: 10 * 1024 * 1024 * 1024 // 10 GB limit for UI
            });
        }

        // ... list logic
        const files = await storage.listFiles(path);

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

        await storage.deleteFile(path);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Storage delete error:", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
