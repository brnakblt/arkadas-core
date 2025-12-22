import Image, { ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
    src: string;
    fallback?: string;
}

/**
 * Optimized Image Component
 * Wrapper around next/image with:
 * - Automatic WebP conversion
 * - Lazy loading by default
 * - Blur placeholder support
 * - Error fallback
 */
export function OptimizedImage({
    src,
    alt,
    fallback = '/images/placeholder.png',
    className = '',
    ...props
}: OptimizedImageProps) {
    // Check if src is external
    // const isExternal = src.startsWith('http') || src.startsWith('//');

    // For Strapi images
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
    const imageSrc = src.startsWith('/uploads')
        ? `${strapiUrl}${src}`
        : src;

    // Force unoptimized for localhost Strapi images to avoid Next.js build errors
    // "resolved to private ip"
    const isLocalhost = imageSrc.includes('localhost') || imageSrc.includes('127.0.0.1');
    const shouldUnoptimize = props.unoptimized || isLocalhost;

    return (
        <Image
            src={imageSrc}
            alt={alt}
            className={className}
            loading="lazy"
            quality={85}
            placeholder={props.blurDataURL ? 'blur' : 'empty'}
            onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (img.src !== fallback) {
                    img.src = fallback;
                }
            }}
            {...props}
            unoptimized={shouldUnoptimize}
        />
    );
}

/**
 * Avatar Image with initials fallback
 */
export function Avatar({
    src,
    name,
    size = 40,
    className = '',
}: {
    src?: string;
    name: string;
    size?: number;
    className?: string;
}) {
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const colors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-indigo-500',
        'bg-yellow-500',
        'bg-red-500',
        'bg-teal-500',
    ];

    // Consistent color based on name
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const bgColor = colors[colorIndex];

    if (src) {
        return (
            <Image
                src={src}
                alt={name}
                width={size}
                height={size}
                className={`rounded-full object-cover ${className}`}
                onError={(e) => {
                    // Hide broken image
                    (e.target as HTMLImageElement).style.display = 'none';
                }}
            />
        );
    }

    return (
        <div
            className={`${bgColor} rounded-full flex items-center justify-center text-white font-semibold ${className}`}
            style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
            {initials}
        </div>
    );
}

/**
 * Responsive Background Image
 */
export function BackgroundImage({
    src,
    alt,
    children,
    className = '',
    overlay = true,
}: {
    src: string;
    alt: string;
    children?: React.ReactNode;
    className?: string;
    overlay?: boolean;
}) {
    return (
        <div className={`relative overflow-hidden ${className}`}>
            <Image
                src={src}
                alt={alt}
                fill
                className="object-cover"
                priority
                sizes="100vw"
            />
            {overlay && (
                <div className="absolute inset-0 bg-black/40" />
            )}
            <div className="relative z-10">{children}</div>
        </div>
    );
}

/**
 * Image Gallery with lightbox support
 */
export function ImageGallery({
    images,
    columns = 3,
    className = '',
}: {
    images: { src: string; alt: string }[];
    columns?: number;
    className?: string;
}) {
    return (
        <div
            className={`grid gap-4 ${className}`}
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
            {images.map((image, index) => (
                <div key={index} className="relative aspect-square group cursor-pointer">
                    <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        className="object-cover rounded-lg transition-transform group-hover:scale-105"
                        sizes={`(max-width: 768px) 100vw, ${100 / columns}vw`}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
                </div>
            ))}
        </div>
    );
}
