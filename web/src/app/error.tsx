'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Frontend Error:', error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-red-50 p-6 rounded-full mb-6 animate-pulse">
                <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Bir şeyler ters gitti
            </h2>

            <p className="text-gray-600 max-w-md mb-8">
                Beklenmedik bir hata oluştu. Teknik ekibimiz bilgilendirildi.
                Lütfen sayfayı yenilemeyi deneyin veya ana sayfaya dönün.
            </p>

            {process.env.NODE_ENV === 'development' && (
                <div className="mb-8 p-4 bg-gray-100 rounded-lg text-left w-full max-w-lg overflow-auto text-sm font-mono text-red-600 border border-red-200">
                    {error.message}
                </div>
            )}

            <div className="flex gap-4">
                <button
                    onClick={() => reset()}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                >
                    <RefreshCw className="w-4 h-4" />
                    Tekrar Dene
                </button>

                <Link
                    href="/"
                    className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                    <Home className="w-4 h-4" />
                    Ana Sayfa
                </Link>
            </div>
        </div>
    );
}
