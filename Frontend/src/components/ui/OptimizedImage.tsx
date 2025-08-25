import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
  formats?: ('webp' | 'avif' | 'original')[];
  progressive?: boolean;
}

// Modern format support detection
const getFormatSupport = () => {
  if (typeof window === 'undefined') return { webp: false, avif: false };
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return {
    webp: canvas.toDataURL('image/webp').startsWith('data:image/webp'),
    avif: canvas.toDataURL('image/avif').startsWith('data:image/avif')
  };
};

const formatSupport = getFormatSupport();

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
  formats = ['avif', 'webp', 'original'],
  progressive = true,
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [isInView, setIsInView] = useState(!lazy || priority);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Memoized aspect ratio classes
  const aspectRatioClasses = useMemo(
    () => ({
      square: 'aspect-square',
      video: 'aspect-video',
      '3/2': 'aspect-[3/2]',
      '4/3': 'aspect-[4/3]',
      '16/9': 'aspect-[16/9]',
    }),
    []
  );

  // Determine the best format to use
  const getBestFormat = useCallback(() => {
    for (const format of formats) {
      if (format === 'avif' && formatSupport.avif) return 'avif';
      if (format === 'webp' && formatSupport.webp) return 'webp';
      if (format === 'original') return 'original';
    }
    return 'original';
  }, [formats]);

  // Generate optimized source URLs
  const generateSources = useCallback(() => {
    if (!src) return [];

    const widths = [320, 480, 768, 1024, 1280, 1920];
    const bestFormat = getBestFormat();
    
    const sources = [];
    
    // AVIF sources (if supported and requested)
    if (formats.includes('avif') && formatSupport.avif) {
      sources.push({
        type: 'image/avif',
        srcSet: widths.map(w => `${src}?w=${w}&q=${quality}&fmt=avif ${w}w`).join(', ')
      });
    }
    
    // WebP sources (if supported and requested)
    if (formats.includes('webp') && formatSupport.webp) {
      sources.push({
        type: 'image/webp',
        srcSet: widths.map(w => `${src}?w=${w}&q=${quality}&fmt=webp ${w}w`).join(', ')
      });
    }
    
    // Original format fallback
    sources.push({
      type: '',
      srcSet: widths.map(w => `${src}?w=${w}&q=${quality} ${w}w`).join(', ')
    });
    
    return sources;
  }, [src, quality, formats, getBestFormat]);

  // Progressive loading implementation
  const loadProgressively = useCallback(async () => {
    if (!progressive || !src) return;
    
    try {
      // Load a low-quality placeholder first
      const lowQualityUrl = `${src}?w=50&q=20&blur=5`;
      setCurrentSrc(lowQualityUrl);
      
      // Then load the full quality image
      const img = new Image();
      const bestFormat = getBestFormat();
      const fullQualityUrl = bestFormat === 'original' 
        ? src 
        : `${src}?q=${quality}&fmt=${bestFormat}`;
        
      img.onload = () => {
        setCurrentSrc(fullQualityUrl);
        setImageState('loaded');
        onLoad?.();
      };
      
      img.onerror = () => {
        setImageState('error');
        onError?.();
      };
      
      img.src = fullQualityUrl;
    } catch (error) {
      setImageState('error');
      onError?.();
    }
  }, [src, quality, progressive, getBestFormat, onLoad, onError]);

  // Memoized container class name
  const containerClassName = useMemo(
    () =>
      cn(
        'relative overflow-hidden bg-gray-100',
        aspectRatio &&
          (aspectRatioClasses[aspectRatio as keyof typeof aspectRatioClasses] ||
            aspectRatio),
        className
      ),
    [aspectRatio, aspectRatioClasses, className]
  );

  // Memoized image class name
  const imageClassName = useMemo(
    () =>
      cn(
        'transition-all duration-500 ease-out',
        objectFit === 'cover' && 'object-cover',
        objectFit === 'contain' && 'object-contain',
        objectFit === 'fill' && 'object-fill',
        objectFit === 'none' && 'object-none',
        objectFit === 'scale-down' && 'object-scale-down',
        imageState === 'loading' && 'opacity-0 scale-105',
        imageState === 'loaded' && 'opacity-100 scale-100',
        imageState === 'error' && 'opacity-50'
      ),
    [objectFit, imageState]
  );

  // Standard event handlers
  const handleLoad = useCallback(() => {
    if (!progressive) {
      setImageState('loaded');
      onLoad?.();
    }
  }, [progressive, onLoad]);

  const handleError = useCallback(() => {
    setImageState('error');
    onError?.();
  }, [onError]);

  // Intersection Observer setup
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
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    observerRef.current = observer;

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [lazy, priority, isInView]);

  // Load image when in view
  useEffect(() => {
    if (isInView && imageState === 'loading') {
      if (progressive) {
        loadProgressively();
      } else {
        setCurrentSrc(src);
      }
    }
  }, [isInView, imageState, progressive, loadProgressively, src]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  const shouldShowImage = isInView && currentSrc && imageState !== 'error';
  const shouldShowPlaceholder = imageState === 'loading' && placeholder !== 'none';
  const shouldShowFallback = imageState === 'error' && fallback;
  const sources = useMemo(() => generateSources(), [generateSources]);

  return (
    <div ref={containerRef} className={containerClassName}>
      {/* Skeleton placeholder */}
      {shouldShowPlaceholder && placeholder === 'skeleton' && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
        </div>
      )}

      {/* Blur placeholder */}
      {shouldShowPlaceholder && placeholder === 'blur' && (
        <div
          className="absolute inset-0 bg-gray-200 filter blur-sm transition-opacity duration-300"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100' height='100' fill='%23f3f4f6'/%3e%3c/svg%3e")`,
            backgroundSize: 'cover',
          }}
        />
      )}

      {/* Modern picture element with format optimization */}
      {shouldShowImage && (
        <picture className="absolute inset-0 w-full h-full">
          {sources.map((source, index) => (
            <source
              key={index}
              type={source.type}
              srcSet={source.srcSet}
              sizes={sizes}
            />
          ))}
          <img
            ref={imgRef}
            src={currentSrc}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            fetchPriority={priority ? 'high' : 'auto'}
            className={cn(imageClassName, 'absolute inset-0 w-full h-full')}
            onLoad={handleLoad}
            onError={handleError}
          />
        </picture>
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
      {imageState === 'error' && !fallback && (
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
      {imageState === 'loading' && isInView && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

// Higher-order component for existing img tags
export const withImageOptimization = <
  P extends React.ImgHTMLAttributes<HTMLImageElement>,
>(
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
        placeholder='skeleton'
        {...(rest as any)}
      />
    );
  });
};

// Pre-configured variants for common use cases
export const ProductImage: React.FC<
  Omit<OptimizedImageProps, 'aspectRatio' | 'objectFit'>
> = props => <OptimizedImage {...props} aspectRatio='3/2' objectFit='cover' />;

export const AvatarImage: React.FC<
  Omit<OptimizedImageProps, 'aspectRatio' | 'objectFit'>
> = props => (
  <OptimizedImage {...props} aspectRatio='square' objectFit='cover' />
);

export const HeroImage: React.FC<
  Omit<OptimizedImageProps, 'aspectRatio' | 'priority'>
> = props => <OptimizedImage {...props} aspectRatio='16/9' priority={true} />;

export const ThumbnailImage: React.FC<
  Omit<OptimizedImageProps, 'aspectRatio' | 'lazy'>
> = props => <OptimizedImage {...props} aspectRatio='square' lazy={false} />;

export default OptimizedImage;
