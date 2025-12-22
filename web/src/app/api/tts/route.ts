import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_TTS_URL = 'https://translate.google.com/translate_tts';

// SECURITY FIX #7: Maximum text length to prevent DoS
const MAX_TEXT_LENGTH = 1000;

export async function POST(request: NextRequest) {
    try {
        const { text, lang = 'tr' } = await request.json();

        if (!text || typeof text !== 'string') {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        // SECURITY: Enforce character limit to prevent DoS
        if (text.length > MAX_TEXT_LENGTH) {
            return NextResponse.json(
                { error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters` },
                { status: 400 }
            );
        }

        // Split text into chunks (Google TTS has ~200 char limit)
        const chunks = splitTextIntoChunks(text, 200);
        const audioBuffers: ArrayBuffer[] = [];

        for (const chunk of chunks) {
            const params = new URLSearchParams({
                ie: 'UTF-8',
                q: chunk,
                tl: lang,
                client: 'tw-ob',
            });

            const response = await fetch(`${GOOGLE_TTS_URL}?${params.toString()}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
            });

            if (!response.ok) {
                console.error('Google TTS Error:', response.status);
                return NextResponse.json(
                    { error: `Google TTS Error: ${response.status}` },
                    { status: response.status }
                );
            }

            const buffer = await response.arrayBuffer();
            audioBuffers.push(buffer);
        }

        // Combine audio buffers
        const totalLength = audioBuffers.reduce((acc, buf) => acc + buf.byteLength, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const buf of audioBuffers) {
            combined.set(new Uint8Array(buf), offset);
            offset += buf.byteLength;
        }

        return new NextResponse(combined.buffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'public, max-age=86400',
            },
        });
    } catch (error) {
        console.error('TTS API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

function splitTextIntoChunks(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
        if (remaining.length <= maxLength) {
            chunks.push(remaining);
            break;
        }

        let splitIndex = remaining.lastIndexOf(' ', maxLength);
        if (splitIndex === -1 || splitIndex < maxLength / 2) {
            splitIndex = remaining.lastIndexOf('.', maxLength);
        }
        if (splitIndex === -1 || splitIndex < maxLength / 2) {
            splitIndex = maxLength;
        }

        chunks.push(remaining.substring(0, splitIndex).trim());
        remaining = remaining.substring(splitIndex).trim();
    }

    return chunks;
}
