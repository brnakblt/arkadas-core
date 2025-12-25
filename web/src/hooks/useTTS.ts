import { useState, useEffect, useRef, useCallback } from 'react';

interface TTSState {
    isLoading: boolean;
    isSpeaking: boolean;
    error: string | null;
    progress: number | null;
}

export function useTTS() {
    const [state, setState] = useState<TTSState>({
        isLoading: false,
        isSpeaking: false,
        error: null,
        progress: null,
    });

    const workerRef = useRef<Worker | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

    // Stop current audio playback
    const stop = useCallback(() => {
        // Stop current audio source
        if (currentSourceRef.current) {
            try {
                currentSourceRef.current.stop();
                currentSourceRef.current.disconnect();
            } catch {
                // Already stopped
            }
            currentSourceRef.current = null;
        }
        setState(prev => ({ ...prev, isLoading: false, isSpeaking: false }));
    }, []);

    // Decode and play audio from ArrayBuffer
    const playAudioBuffer = useCallback(async (arrayBuffer: ArrayBuffer) => {
        try {
            // Stop any currently playing audio
            if (currentSourceRef.current) {
                try {
                    currentSourceRef.current.stop();
                    currentSourceRef.current.disconnect();
                } catch {
                    // Already stopped
                }
            }

            if (!audioContextRef.current) {
                const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                audioContextRef.current = new AudioContextClass();
            }
            const audioContext = audioContextRef.current;

            // Decode the audio data (supports flac, wav, mp3, etc.)
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            const source = audioContext.createBufferSource();
            currentSourceRef.current = source;
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.onended = () => {
                currentSourceRef.current = null;
                setState(prev => ({ ...prev, isSpeaking: false }));
            };
            source.start();
            setState(prev => ({ ...prev, isLoading: false, isSpeaking: true, progress: null }));
        } catch (err) {
            console.error('Audio decode error:', err);
            setState(prev => ({ ...prev, isLoading: false, error: 'Ses çözümlenemedi.' }));
        }
    }, []);

    // Legacy playAudio for backwards compatibility (Float32Array format)
    const playAudio = useCallback((audioData: Float32Array, sampleRate: number) => {
        // Stop any currently playing audio
        if (currentSourceRef.current) {
            try {
                currentSourceRef.current.stop();
                currentSourceRef.current.disconnect();
            } catch {
                // Already stopped
            }
        }

        if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
        }
        const audioContext = audioContextRef.current;
        const buffer = audioContext.createBuffer(1, audioData.length, sampleRate);
        buffer.copyToChannel(new Float32Array(audioData), 0);

        const source = audioContext.createBufferSource();
        currentSourceRef.current = source;
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.onended = () => {
            currentSourceRef.current = null;
            setState(prev => ({ ...prev, isSpeaking: false }));
        };
        source.start();
    }, []);

    useEffect(() => {
        // Initialize Worker
        if (!workerRef.current) {
            workerRef.current = new Worker('/tts-worker.js');

            workerRef.current.onmessage = (event) => {
                const { status, data, audio, sampling_rate, audioBuffer, error } = event.data;

                if (status === 'progress') {
                    if (data?.status === 'progress') {
                        setState(prev => ({ ...prev, isLoading: true, progress: (data.loaded / data.total) * 100 }));
                    }
                } else if (status === 'complete') {
                    if (audioBuffer) {
                        playAudioBuffer(audioBuffer);
                    } else if (audio && sampling_rate) {
                        playAudio(audio, sampling_rate);
                        setState(prev => ({ ...prev, isLoading: false, isSpeaking: true, progress: null }));
                    }
                } else if (status === 'error') {
                    console.error("TTS Worker Error:", error);
                    setState(prev => ({ ...prev, isLoading: false, error: "TTS hatası: " + error }));
                }
            };

            workerRef.current.onerror = (err) => {
                console.error("TTS Worker Global Error:", err);
                setState(prev => ({ ...prev, isLoading: false, error: "TTS Servisi başlatılamadı." }));
            };
        }

        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, [playAudio, playAudioBuffer]);

    const speak = useCallback((text: string) => {
        if (!workerRef.current) return;

        // Stop any currently playing audio before starting new
        if (currentSourceRef.current) {
            try {
                currentSourceRef.current.stop();
                currentSourceRef.current.disconnect();
            } catch {
                // Already stopped
            }
            currentSourceRef.current = null;
        }

        setState(prev => ({ ...prev, isLoading: true, isSpeaking: false, error: null }));
        workerRef.current.postMessage({ text });
    }, []);

    return { speak, stop, ...state };
}
