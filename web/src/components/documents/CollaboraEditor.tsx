'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface CollaboraEditorProps {
    /** Base64url-encoded file ID */
    fileId: string;
    /** WOPI access token for authentication */
    accessToken: string;
    /** Full Collabora editor URL (from API) */
    editorUrl: string;
    /** Document title for display */
    title?: string;
    /** Callback when editor is ready */
    onReady?: () => void;
    /** Callback on error */
    onError?: (error: string) => void;
    /** CSS class for the container */
    className?: string;
}

/**
 * Collabora Online Document Editor Component
 * Embeds Collabora via WOPI protocol in an iframe
 * License: MPL-2.0 (commercially free)
 */
export default function CollaboraEditor({
    fileId,
    accessToken,
    editorUrl,
    title = 'Belge',
    onReady,
    onError,
    className = '',
}: CollaboraEditorProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // eslint-disable-next-line no-undef
    const formRef = useRef<HTMLFormElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [submitted, setSubmitted] = useState(false);

    // Collabora WOPI requires POST form submission to load the editor
    useEffect(() => {
        if (formRef.current && !submitted) {
            formRef.current.submit();
            setSubmitted(true);
        }
    }, [editorUrl, submitted]);

    const handleLoad = useCallback(() => {
        setIsLoading(false);
        onReady?.();
    }, [onReady]);

    const handleError = useCallback(() => {
        setIsLoading(false);
        const errorMsg = 'Collabora yüklenemedi. Sunucu erişilebilir olduğundan emin olun.';
        setError(errorMsg);
        onError?.(errorMsg);
    }, [onError]);

    // Listen for PostMessage from Collabora
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

                if (data.MessageId === 'App_LoadingStatus' && data.Values?.Status === 'Document_Loaded') {
                    setIsLoading(false);
                    onReady?.();
                }

                if (data.MessageId === 'Action_Save_Resp' && data.Values?.success) {
                    // Document saved successfully via Collabora
                }
            } catch {
                // Not a JSON message, ignore
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onReady]);

    if (error) {
        return (
            <div className={`bg-white rounded-xl shadow-sm p-8 text-center ${className}`}>
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl">📄</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Belge Yüklenemedi</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <button
                    onClick={() => {
                        setError(null);
                        setIsLoading(true);
                        setSubmitted(false);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Tekrar Dene
                </button>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 bg-gray-100 rounded-xl flex items-center justify-center z-10">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">Belge yükleniyor...</p>
                    </div>
                </div>
            )}

            {/* Collabora requires POST form submission with access_token */}
            <form
                ref={formRef}
                action={editorUrl}
                method="POST"
                target={`collabora-frame-${fileId}`}
                style={{ display: 'none' }}
            >
                <input name="access_token" value={accessToken} type="hidden" readOnly />
            </form>

            <iframe
                ref={iframeRef}
                name={`collabora-frame-${fileId}`}
                title={title}
                onLoad={handleLoad}
                onError={handleError}
                className="w-full h-full min-h-[700px] rounded-xl border-0"
                allow="fullscreen"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
            />
        </div>
    );
}

/**
 * Collabora Viewer – Read-only document preview
 */
export function CollaboraViewer({
    fileId,
    accessToken,
    editorUrl,
    title,
    className = '',
}: Omit<CollaboraEditorProps, 'onReady' | 'onError'>) {
    return (
        <CollaboraEditor
            fileId={fileId}
            accessToken={accessToken}
            editorUrl={editorUrl}
            title={title}
            className={className}
        />
    );
}
