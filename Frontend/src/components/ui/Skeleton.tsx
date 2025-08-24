import React from 'react';
import { cn } from '@/lib/utils';

// Base Skeleton component with shimmer animation
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'default' | 'shimmer' | 'pulse';
  delay?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  variant = 'shimmer',
  delay = 0,
  ...props 
}) => {
  const baseClasses = 'rounded-md bg-muted relative overflow-hidden';
  
  const variantClasses = {
    default: 'animate-pulse',
    pulse: 'animate-pulse',
    shimmer: 'animate-pulse before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent'
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
      {...props}
    />
  );
};

// Enhanced Product Card Skeleton with realistic proportions
interface ProductCardSkeletonProps {
  showRating?: boolean;
  showBadge?: boolean;
  className?: string;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ 
  showRating = true,
  showBadge = false,
  className 
}) => {
  return (
    <div className={cn("space-y-3 p-4 border rounded-lg", className)}>
      {/* Image skeleton with aspect ratio */}
      <div className="relative">
        <Skeleton className="aspect-[3/2] w-full rounded-lg" variant="shimmer" />
        {showBadge && (
          <div className="absolute top-2 left-2">
            <Skeleton className="h-5 w-12 rounded-full" delay={200} />
          </div>
        )}
      </div>
      
      {/* Content skeleton */}
      <div className="space-y-2">
        {/* Product title */}
        <Skeleton className="h-5 w-4/5" delay={100} />
        <Skeleton className="h-4 w-3/5" delay={150} />
        
        {/* Price and rating row */}
        <div className="flex items-center justify-between mt-3">
          <Skeleton className="h-6 w-1/3" delay={200} />
          {showRating && (
            <div className="flex items-center gap-1">
              <Skeleton className="h-3 w-3 rounded-full" delay={250} />
              <Skeleton className="h-3 w-8" delay={280} />
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center justify-between mt-4">
          <Skeleton className="h-4 w-16" delay={300} />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-12" delay={350} />
            <Skeleton className="h-8 w-16" delay={380} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Table Row Skeleton
interface TableRowSkeletonProps {
  columns?: number;
  className?: string;
}

export const TableRowSkeleton: React.FC<TableRowSkeletonProps> = ({ 
  columns = 4, 
  className 
}) => {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="p-4">
          <Skeleton 
            className="h-4 w-full" 
            delay={index * 50}
          />
        </td>
      ))}
    </tr>
  );
};

// Form Skeleton
interface FormSkeletonProps {
  fields?: number;
  showSubmitButton?: boolean;
  className?: string;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({ 
  fields = 3, 
  showSubmitButton = true,
  className 
}) => {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-20" delay={index * 100} />
          <Skeleton className="h-10 w-full" delay={index * 100 + 50} />
        </div>
      ))}
      {showSubmitButton && (
        <Skeleton className="h-10 w-32" delay={fields * 100 + 100} />
      )}
    </div>
  );
};

// Navigation Skeleton
export const NavigationSkeleton: React.FC = () => {
  return (
    <nav className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Skeleton className="h-8 w-32" />
        
        {/* Navigation items */}
        <div className="hidden md:flex items-center space-x-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton 
              key={index} 
              className="h-4 w-16" 
              delay={index * 100}
            />
          ))}
        </div>
        
        {/* User menu */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" delay={400} />
          <Skeleton className="h-8 w-20" delay={450} />
        </div>
      </div>
    </nav>
  );
};

// Dashboard Card Skeleton
interface DashboardCardSkeletonProps {
  showChart?: boolean;
  className?: string;
}

export const DashboardCardSkeleton: React.FC<DashboardCardSkeletonProps> = ({ 
  showChart = false,
  className 
}) => {
  return (
    <div className={cn("rounded-lg border bg-card p-6 shadow-sm", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" delay={100} />
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" delay={150} />
        </div>
        
        {/* Chart or content area */}
        {showChart ? (
          <Skeleton className="h-40 w-full" delay={200} />
        ) : (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" delay={200} />
            <Skeleton className="h-4 w-4/5" delay={250} />
            <Skeleton className="h-4 w-3/5" delay={300} />
          </div>
        )}
        
        {/* Footer action */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Skeleton className="h-4 w-20" delay={350} />
          <Skeleton className="h-6 w-16" delay={400} />
        </div>
      </div>
    </div>
  );
};

// Text Skeleton with realistic text patterns
interface TextSkeletonProps {
  lines?: number;
  className?: string;
  variant?: 'paragraph' | 'title' | 'list';
}

export const TextSkeleton: React.FC<TextSkeletonProps> = ({ 
  lines = 3, 
  className,
  variant = 'paragraph'
}) => {
  const getLineWidth = (index: number, total: number) => {
    switch (variant) {
      case 'title':
        return index === 0 ? 'w-3/4' : 'w-1/2';
      case 'list':
        return 'w-4/5';
      case 'paragraph':
      default:
        // Last line is shorter for natural text flow
        if (index === total - 1) return 'w-2/3';
        if (index === 0) return 'w-full';
        return Math.random() > 0.5 ? 'w-full' : 'w-5/6';
    }
  };

  const getLineHeight = () => {
    switch (variant) {
      case 'title':
        return 'h-6';
      case 'list':
        return 'h-4';
      case 'paragraph':
      default:
        return 'h-4';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton 
          key={index} 
          className={cn(
            getLineHeight(),
            getLineWidth(index, lines)
          )} 
          delay={index * 100}
        />
      ))}
    </div>
  );
};

// Enhanced Card Skeleton
interface CardSkeletonProps {
  showImage?: boolean;
  showActions?: boolean;
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ 
  showImage = false,
  showActions = true,
  className 
}) => {
  return (
    <div className={cn("rounded-lg border bg-card p-6 shadow-sm", className)}>
      <div className="space-y-4">
        {/* Image if requested */}
        {showImage && (
          <Skeleton className="h-32 w-full rounded-md" />
        )}
        
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3" delay={100} />
        </div>
        
        {/* Content */}
        <TextSkeleton lines={3} className="" />
        
        {/* Actions */}
        {showActions && (
          <div className="flex items-center space-x-2 pt-4">
            <Skeleton className="h-9 w-20" delay={400} />
            <Skeleton className="h-9 w-16" delay={450} />
          </div>
        )}
      </div>
    </div>
  );
};

// Loading Page Skeleton - Composite skeleton for full page loading
interface LoadingPageSkeletonProps {
  showNavigation?: boolean;
  layout?: 'grid' | 'list' | 'dashboard';
  itemCount?: number;
}

export const LoadingPageSkeleton: React.FC<LoadingPageSkeletonProps> = ({
  showNavigation = true,
  layout = 'grid',
  itemCount = 8
}) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      {showNavigation && <NavigationSkeleton />}
      
      {/* Main content */}
      <main className="container py-8">
        {/* Page header */}
        <div className="mb-8">
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" delay={100} />
        </div>
        
        {/* Content based on layout */}
        {layout === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: itemCount }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        )}
        
        {layout === 'list' && (
          <div className="space-y-4">
            {Array.from({ length: itemCount }).map((_, index) => (
              <CardSkeleton key={index} showImage className="" />
            ))}
          </div>
        )}
        
        {layout === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: itemCount }).map((_, index) => (
              <DashboardCardSkeleton 
                key={index} 
                showChart={index % 3 === 0}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Skeleton;