import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  aspectRatio?: 'square' | 'video' | '3/2' | '4/3' | '16/9' | string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  priority?: boolean;
  lazy?: boolean;
  placeholder?: 'blur' | 'skeleton' | 'none';
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
  quality?: number;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  aspectRatio,
  objectFit = 'cover',
  priority = false,
  lazy = true,
  placeholder = 'skeleton',
  fallback,
  onLoad,
  onError,
  sizes,
  quality = 75,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image enters viewport
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority, isInView]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  // Generate responsive srcSet for better performance
  const generateSrcSet = useCallback((baseSrc: string): string => {
    if (!baseSrc) return '';
    
    // This is a simplified version - in a real app you'd use a CDN like Cloudinary
    const widths = [320, 480, 768, 1024, 1280, 1920];
    return widths
      .map(w => `${baseSrc}?w=${w}&q=${quality} ${w}w`)
      .join(', ');
  }, [quality]);

  // Aspect ratio classes
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    '3/2': 'aspect-[3/2]',
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-[16/9]',
  };

  const containerClassName = cn(
    'relative overflow-hidden bg-gray-100',
    aspectRatio && (aspectRatioClasses[aspectRatio as keyof typeof aspectRatioClasses] || aspectRatio),
    className
  );

  const imageClassName = cn(
    'transition-all duration-300',
    objectFit === 'cover' && 'object-cover',
    objectFit === 'contain' && 'object-contain',
    objectFit === 'fill' && 'object-fill',
    objectFit === 'none' && 'object-none',
    objectFit === 'scale-down' && 'object-scale-down',
    isLoading && 'opacity-0',
    !isLoading && 'opacity-100',
    hasError && 'opacity-50'
  );

  const shouldShowImage = isInView && !hasError;
  const shouldShowPlaceholder = isLoading && placeholder !== 'none';
  const shouldShowFallback = hasError && fallback;

  return (
    <div ref={containerRef} className={containerClassName}>
      {/* Skeleton placeholder */}
      {shouldShowPlaceholder && placeholder === 'skeleton' && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Blur placeholder */}
      {shouldShowPlaceholder && placeholder === 'blur' && (
        <div 
          className="absolute inset-0 bg-gray-200 filter blur-sm"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100' height='100' fill='%23f3f4f6'/%3e%3c/svg%3e")`,
            backgroundSize: 'cover',
          }}
        />
      )}

      {/* Main image */}
      {shouldShowImage && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          srcSet={generateSrcSet(src)}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={cn(imageClassName, 'absolute inset-0 w-full h-full')}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Fallback image */}
      {shouldShowFallback && (
        <img
          src={fallback}
          alt={alt}
          className={cn(imageClassName, 'absolute inset-0 w-full h-full')}
          onLoad={handleLoad}
        />
      )}

      {/* Error state */}
      {hasError && !fallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && isInView && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

// Higher-order component for existing img tags
export const withImageOptimization = <P extends React.ImgHTMLAttributes<HTMLImageElement>>(
  Component: React.ComponentType<P>
) => {
  return React.forwardRef<HTMLImageElement, P>((props, ref) => {
    const { src, alt, className, width, height, ...rest } = props;
    
    if (!src || !alt) {
      return <Component {...(props as P)} ref={ref} />;
    }

    return (
      <OptimizedImage
        src={src}
        alt={alt}
        className={className}
        width={typeof width === 'number' ? width : undefined}
        height={typeof height === 'number' ? height : undefined}
        lazy={true}
        placeholder="skeleton"
        {...(rest as any)}
      />
    );
  });
};

// Pre-configured variants for common use cases
export const ProductImage: React.FC<Omit<OptimizedImageProps, 'aspectRatio' | 'objectFit'>> = (props) => (
  <OptimizedImage {...props} aspectRatio="3/2" objectFit="cover" />
);

export const AvatarImage: React.FC<Omit<OptimizedImageProps, 'aspectRatio' | 'objectFit'>> = (props) => (
  <OptimizedImage {...props} aspectRatio="square" objectFit="cover" />
);

export const HeroImage: React.FC<Omit<OptimizedImageProps, 'aspectRatio' | 'priority'>> = (props) => (
  <OptimizedImage {...props} aspectRatio="16/9" priority={true} />
);

export const ThumbnailImage: React.FC<Omit<OptimizedImageProps, 'aspectRatio' | 'lazy'>> = (props) => (
  <OptimizedImage {...props} aspectRatio="square" lazy={false} />
);

export default OptimizedImage;