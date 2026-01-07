/**
 * TTS Worker using local API proxy (bypasses CORS)
 * Backend uses Google Translate TTS for Turkish
 */

async function synthesize(text) {
    const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, lang: 'tr' }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    return await response.arrayBuffer();
}

self.addEventListener('message', async (event) => {
    const { text } = event.data;

    try {
        self.postMessage({ status: 'progress', data: { status: 'progress', loaded: 10, total: 100 } });

        const audioBuffer = await synthesize(text);

        self.postMessage({ status: 'progress', data: { status: 'progress', loaded: 100, total: 100 } });

        self.postMessage({
            status: 'complete',
            audioBuffer: audioBuffer,
        }, [audioBuffer]);
    } catch (error) {
        console.error('TTS Error:', error);
        self.postMessage({ status: 'error', error: error.message });
    }
});
