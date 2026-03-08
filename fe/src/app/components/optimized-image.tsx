import React from 'react';

interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    loading?: 'lazy' | 'eager';
    priority?: boolean;
}

/**
 * Optimized image component with:
 * - Lazy loading by default
 * - WebP fallback support
 * - Fixed dimensions to prevent CLS
 * - Fade-in animation on load
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
    src,
    alt,
    width,
    height,
    className = '',
    loading = 'lazy',
    priority = false,
}) => {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [error, setError] = React.useState(false);

    // Convert to WebP if available
    const webpSrc = src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    const hasWebp = webpSrc !== src;

    // Use eager loading for priority images
    const loadingAttr = priority ? 'eager' : loading;

    return (
        <div
            className={`relative overflow-hidden ${className}`}
            style={{
                width: width ? `${width}px` : undefined,
                height: height ? `${height}px` : undefined,
            }}
        >
            {/* Placeholder skeleton */}
            {!isLoaded && !error && (
                <div
                    className="absolute inset-0 bg-gradient-to-r from-muted/50 to-muted/30 animate-pulse"
                    style={{
                        width: width ? `${width}px` : '100%',
                        height: height ? `${height}px` : '100%',
                    }}
                />
            )}

            <picture>
                {hasWebp && <source srcSet={webpSrc} type="image/webp" />}
                <img
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    loading={loadingAttr}
                    decoding="async"
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setError(true)}
                    className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'
                        } ${className}`}
                    style={{
                        width: width ? `${width}px` : '100%',
                        height: height ? `${height}px` : 'auto',
                        objectFit: 'cover',
                    }}
                />
            </picture>
        </div>
    );
};

/**
 * Preload an image to improve LCP
 */
export const preloadImage = (src: string) => {
    if (typeof window !== 'undefined') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    }
};

/**
 * Create low-quality image placeholder (LQIP) data URL
 */
export const createLQIP = (width: number, height: number, color = '#1a1a2e'): string => {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Crect fill='${encodeURIComponent(color)}' width='${width}' height='${height}'/%3E%3C/svg%3E`;
};
