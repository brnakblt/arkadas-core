"use client";

import React from 'react';

import Link from 'next/link';

/**
 * Standard Error Page
 * Decoupled from all providers to avoid prerendering issues
 */
export default function ErrorPage() {
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
                Bir Hata Oluştu
            </h1>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
                Üzgünüz, bir şeyler ters gitti. Lütfen sayfayı yenilemeyi deneyin.
            </p>
            <Link 
                href="/" 
                style={{
                    backgroundColor: '#7CB342',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 'bold'
                }}
            >
                Ana Sayfaya Dön
            </Link>
        </div>
    );
}
