'use client';

import NextImage from 'next/image';

/**
 * Simple Document Embed Fallback
 * Uses browser's native file viewer for common formats (PDF, images)
 * Falls back to Google Docs Viewer for other formats
 */
export default function DocumentEmbed({
    url,
    title = 'Belge',
    height = 600,
    className = '',
}: {
    url: string;
    title?: string;
    height?: number;
    className?: string;
}) {
    const ext = url.split('.').pop()?.toLowerCase();
    const isPdf = ext === 'pdf';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');

    if (isImage) {
        return (
            <div className={`rounded-xl overflow-hidden ${className}`}>
                <NextImage
                    src={url}
                    alt={title}
                    className="max-w-full h-auto"
                    width={800}
                    height={600}
                    unoptimized
                />
            </div>
        );
    }

    if (isPdf) {
        return (
            <iframe
                src={url}
                title={title}
                className={`w-full rounded-xl border-0 ${className}`}
                style={{ height }}
            />
        );
    }

    // Fallback: Use Google Docs Viewer for other formats
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

    return (
        <iframe
            src={googleViewerUrl}
            title={title}
            className={`w-full rounded-xl border-0 ${className}`}
            style={{ height }}
        />
    );
}
