import Link from 'next/link';

export default function NotFound() {
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
                Sayfa Bulunamadı (404)
            </h1>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
                Aradığınız sayfa mevcut değil veya taşınmış olabilir.
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
