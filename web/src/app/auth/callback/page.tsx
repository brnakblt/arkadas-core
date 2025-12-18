"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const jwt = searchParams.get('jwt');
        const id = searchParams.get('id');
        const username = searchParams.get('username');
        const email = searchParams.get('email');
        const errorParam = searchParams.get('error');

        if (errorParam) {
            setError(errorParam);
            return;
        }

        if (jwt) {
            // Save to localStorage
            localStorage.setItem('jwt', jwt);
            localStorage.setItem('user', JSON.stringify({ id, username, email }));

            // Redirect to dashboard or home
            router.push('/dashboard');
        } else {
            console.error("No JWT found in URL");
        }
    }, [searchParams, router]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
                <h1 className="text-2xl font-bold">Login Failed</h1>
                <p>{error}</p>
                <button onClick={() => router.push('/')} className="mt-4 text-blue-500 hover:underline">
                    Go Home
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Authenticating...</h2>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthCallbackContent />
        </Suspense>
    );
}
