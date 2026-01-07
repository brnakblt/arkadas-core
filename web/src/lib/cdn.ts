/**
 * Cloudflare CDN Configuration
 * CDN headers, cache rules, and asset optimization
 */

// ============================================================
// CDN Cache Headers
// ============================================================

export const cdnHeaders = {
    /**
     * Static assets (images, fonts, CSS, JS)
     * Cache for 1 year, immutable
     */
    static: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'max-age=31536000',
    },

    /**
     * Dynamic pages
     * Cache for 1 minute, revalidate in background
     */
    dynamic: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'CDN-Cache-Control': 'max-age=60',
    },

    /**
     * API responses
     * Short cache with revalidation
     */
    api: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'max-age=30',
    },

    /**
     * No cache (user-specific content)
     */
    noCache: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'CDN-Cache-Control': 'no-store',
    },
};

// ============================================================
// Cloudflare Page Rules (for reference)
// ============================================================

export const cloudflarePageRules = `
# Cloudflare Page Rules Configuration
# Apply these rules in Cloudflare Dashboard > Rules > Page Rules

# 1. Static Assets
# Pattern: *arkadasozelegitim.com/_next/static/*
# Settings:
#   - Cache Level: Cache Everything
#   - Edge Cache TTL: 1 month
#   - Browser Cache TTL: 1 year

# 2. Image Optimization
# Pattern: *arkadasozelegitim.com/uploads/*
# Settings:
#   - Cache Level: Cache Everything
#   - Edge Cache TTL: 1 week
#   - Polish: Lossy (for image optimization)
#   - Mirage: On (for mobile image optimization)

# 3. API Routes
# Pattern: *arkadasozelegitim.com/api/*
# Settings:
#   - Cache Level: Standard
#   - Edge Cache TTL: 30 seconds
#   - Browser Cache TTL: 30 seconds

# 4. Admin Panel
# Pattern: *arkadasozelegitim.com/admin/*
# Settings:
#   - Cache Level: Bypass
#   - Security Level: High
#   - Disable Apps: On

# 5. Main Site
# Pattern: *arkadasozelegitim.com/*
# Settings:
#   - SSL: Full (Strict)
#   - Auto Minify: JavaScript, CSS, HTML
#   - Rocket Loader: On
#   - Always Use HTTPS: On
`;

// ============================================================
// Cloudflare Workers Script (for custom caching)
// ============================================================

export const cloudflareWorkerScript = `
// Cloudflare Workers Script
// Deploy this to Cloudflare Workers for custom cache control

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Static assets - cache aggressively
  if (url.pathname.startsWith('/_next/static/') || 
      url.pathname.startsWith('/fonts/') ||
      url.pathname.match(/\\.(js|css|woff2?|ttf|eot|ico|svg|png|jpg|jpeg|webp|avif)$/)) {
    const response = await fetch(request);
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    return new Response(response.body, { ...response, headers });
  }
  
  // API routes - short cache with stale-while-revalidate
  if (url.pathname.startsWith('/api/')) {
    const cacheKey = new Request(url.toString(), request);
    const cache = caches.default;
    
    // Check cache first
    let response = await cache.match(cacheKey);
    if (response) {
      // Add cache status header
      const headers = new Headers(response.headers);
      headers.set('X-Cache-Status', 'HIT');
      return new Response(response.body, { ...response, headers });
    }
    
    // Fetch from origin
    response = await fetch(request);
    
    // Cache successful GET requests
    if (request.method === 'GET' && response.status === 200) {
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
      headers.set('X-Cache-Status', 'MISS');
      
      const responseToCache = new Response(response.clone().body, {
        ...response,
        headers,
      });
      event.waitUntil(cache.put(cacheKey, responseToCache));
    }
    
    return response;
  }
  
  // Default - pass through
  return fetch(request);
}
`;

// ============================================================
// Next.js CDN Configuration
// ============================================================

export const nextCdnConfig = {
    // Add to next.config.js
    images: {
        loader: 'default',
        domains: ['arkadasozelegitim.com', 'cdn.arkadasozelegitim.com'],
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60 * 60 * 24, // 1 day
    },

    headers: async () => [
        {
            source: '/:all*(svg|jpg|png|webp|avif|woff2)',
            headers: [
                { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
            ],
        },
        {
            source: '/_next/static/:path*',
            headers: [
                { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
            ],
        },
    ],
};

// ============================================================
// Cloudflare DNS Setup Guide
// ============================================================

export const cloudflareDnsSetup = `
# Cloudflare DNS Setup for arkadasozelegitim.com

## 1. Add Domain to Cloudflare
- Go to cloudflare.com and add your domain
- Update nameservers at your registrar to Cloudflare's

## 2. DNS Records
| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| A | @ | YOUR_SERVER_IP | ✅ | Auto |
| A | api | YOUR_SERVER_IP | ✅ | Auto |
| CNAME | www | arkadasozelegitim.com | ✅ | Auto |
| CNAME | cdn | arkadasozelegitim.com | ✅ | Auto |

## 3. SSL/TLS Settings
- SSL Mode: Full (Strict)
- Always Use HTTPS: On
- Automatic HTTPS Rewrites: On
- Minimum TLS Version: 1.2

## 4. Speed Optimizations
- Auto Minify: JS, CSS, HTML
- Brotli: On
- Early Hints: On
- Rocket Loader: On (test first)
- HTTP/3: On

## 5. Security
- Security Level: Medium
- Bot Fight Mode: On
- Browser Integrity Check: On
- Hotlink Protection: On

## 6. Caching
- Caching Level: Standard
- Browser Cache TTL: 4 hours
- Always Online: On
`;

// ============================================================
// Asset URL Helper
// ============================================================

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

export function getCdnUrl(path: string): string {
    if (!CDN_URL) return path;
    return `${CDN_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getOptimizedImageUrl(
    src: string,
    options: { width?: number; quality?: number; format?: 'webp' | 'avif' } = {}
): string {
    const { width = 800, quality = 80, format = 'webp' } = options;

    // If using Cloudflare Image Resizing
    if (CDN_URL && CDN_URL.includes('cloudflare')) {
        const params = new URLSearchParams({
            width: String(width),
            quality: String(quality),
            format,
            fit: 'cover',
        });
        return `${CDN_URL}/cdn-cgi/image/${params.toString()}/${src}`;
    }

    return src;
}
