"use client";

import React from 'react';

import Link from 'next/link';

/**
 * App Router Error Page
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
            padding: '20px'
        }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Beklenmedik Bir Hata
            </h1>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
                {error.message || 'Sistemde geçici bir sorun oluştu.'}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button
                    onClick={() => reset()}
                    style={{
                        backgroundColor: '#7CB342',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Tekrar Dene
                </button>
                <Link 
                    href="/" 
                    style={{
                        backgroundColor: '#eee',
                        color: '#333',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: 'bold'
                    }}
                >
                    Ana Sayfa
                </Link>
            </div>
        </div>
    );
}
