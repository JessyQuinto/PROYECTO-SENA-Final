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
    shimmer:
      'animate-pulse before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent',
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={{ animationDelay: `${delay}ms` }}
      {...props}
    />
  );
};

// Configuration interfaces for different layout types
interface SkeletonConfig {
  layout: 'card' | 'table' | 'form' | 'dashboard' | 'navigation' | 'list' | 'grid';
  variant?: 'default' | 'shimmer' | 'pulse';
  showImage?: boolean;
  showRating?: boolean;
  showBadge?: boolean;
  showChart?: boolean;
  showAvatar?: boolean;
  columns?: number;
  fields?: number;
  items?: number;
  className?: string;
}

// Card layout skeleton
const CardSkeleton: React.FC<SkeletonConfig> = ({
  showRating = true,
  showBadge = false,
  showImage = true,
  variant = 'shimmer',
  className,
}) => (
  <div className={cn('space-y-3 p-4 border rounded-lg', className)}>
    {showImage && (
      <div className='relative'>
        <Skeleton
          className='aspect-[3/2] w-full rounded-lg'
          variant={variant}
        />
        {showBadge && (
          <div className='absolute top-2 left-2'>
            <Skeleton className='h-5 w-12 rounded-full' delay={200} variant={variant} />
          </div>
        )}
      </div>
    )}

    <div className='space-y-2'>
      <Skeleton className='h-5 w-4/5' delay={100} variant={variant} />
      <Skeleton className='h-4 w-3/5' delay={150} variant={variant} />

      <div className='flex items-center justify-between mt-3'>
        <Skeleton className='h-6 w-1/3' delay={200} variant={variant} />
        {showRating && (
          <div className='flex items-center gap-1'>
            <Skeleton className='h-3 w-3 rounded-full' delay={250} variant={variant} />
            <Skeleton className='h-3 w-8' delay={280} variant={variant} />
          </div>
        )}
      </div>

      <div className='flex items-center justify-between mt-4'>
        <Skeleton className='h-4 w-16' delay={300} variant={variant} />
        <div className='flex gap-2'>
          <Skeleton className='h-8 w-12' delay={350} variant={variant} />
          <Skeleton className='h-8 w-16' delay={380} variant={variant} />
        </div>
      </div>
    </div>
  </div>
);

// Table layout skeleton
const TableSkeleton: React.FC<SkeletonConfig> = ({
  columns = 4,
  items = 5,
  variant = 'shimmer',
  className,
}) => (
  <div className={cn('space-y-3', className)}>
    {/* Table header */}
    <div className='flex space-x-4 p-4 border-b'>
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton 
          key={`header-${index}`}
          className='h-4 flex-1' 
          delay={index * 50}
          variant={variant}
        />
      ))}
    </div>
    
    {/* Table rows */}
    {Array.from({ length: items }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className='flex space-x-4 p-4'>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={`cell-${rowIndex}-${colIndex}`}
            className='h-4 flex-1'
            delay={rowIndex * 100 + colIndex * 25}
            variant={variant}
          />
        ))}
      </div>
    ))}
  </div>
);

// Form layout skeleton
const FormSkeleton: React.FC<SkeletonConfig> = ({
  fields = 3,
  variant = 'shimmer',
  className,
}) => (
  <div className={cn('space-y-6', className)}>
    {Array.from({ length: fields }).map((_, index) => (
      <div key={`field-${index}`} className='space-y-2'>
        <Skeleton className='h-4 w-20' delay={index * 100} variant={variant} />
        <Skeleton className='h-10 w-full' delay={index * 100 + 50} variant={variant} />
      </div>
    ))}
    <Skeleton className='h-10 w-32' delay={fields * 100 + 100} variant={variant} />
  </div>
);

// Dashboard layout skeleton
const DashboardSkeleton: React.FC<SkeletonConfig> = ({
  showChart = false,
  variant = 'shimmer',
  className,
}) => (
  <div className={cn('rounded-lg border bg-card p-6 shadow-sm', className)}>
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-24' variant={variant} />
          <Skeleton className='h-8 w-32' delay={100} variant={variant} />
        </div>
        <Skeleton className='h-8 w-8 rounded-lg' delay={150} variant={variant} />
      </div>

      {showChart ? (
        <Skeleton className='h-40 w-full' delay={200} variant={variant} />
      ) : (
        <div className='space-y-2'>
          <Skeleton className='h-4 w-full' delay={200} variant={variant} />
          <Skeleton className='h-4 w-4/5' delay={250} variant={variant} />
          <Skeleton className='h-4 w-3/5' delay={300} variant={variant} />
        </div>
      )}

      <div className='flex justify-between items-center pt-4 border-t'>
        <Skeleton className='h-4 w-20' delay={350} variant={variant} />
        <Skeleton className='h-6 w-16' delay={400} variant={variant} />
      </div>
    </div>
  </div>
);

// Navigation layout skeleton
const NavigationSkeleton: React.FC<SkeletonConfig> = ({
  variant = 'shimmer',
  className,
}) => (
  <nav className={cn('border-b bg-background', className)}>
    <div className='container flex h-16 items-center justify-between'>
      <Skeleton className='h-8 w-32' variant={variant} />

      <div className='hidden md:flex items-center space-x-6'>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`nav-${index}`} className='h-4 w-16' delay={index * 100} variant={variant} />
        ))}
      </div>

      <div className='flex items-center gap-4'>
        <Skeleton className='h-8 w-8 rounded-full' delay={400} variant={variant} />
        <Skeleton className='h-8 w-20' delay={450} variant={variant} />
      </div>
    </div>
  </nav>
);

// List layout skeleton
const ListSkeleton: React.FC<SkeletonConfig> = ({
  items = 5,
  showAvatar = true,
  variant = 'shimmer',
  className,
}) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={`list-item-${index}`} className='flex items-center space-x-3 p-3 border rounded-lg'>
        {showAvatar && (
          <Skeleton className='h-10 w-10 rounded-full' delay={index * 100} variant={variant} />
        )}
        <div className='flex-1 space-y-2'>
          <Skeleton className='h-4 w-3/4' delay={index * 100 + 50} variant={variant} />
          <Skeleton className='h-3 w-1/2' delay={index * 100 + 100} variant={variant} />
        </div>
        <Skeleton className='h-6 w-16' delay={index * 100 + 150} variant={variant} />
      </div>
    ))}
  </div>
);

// Grid layout skeleton
const GridSkeleton: React.FC<SkeletonConfig> = ({
  items = 8,
  showImage = true,
  showRating = true,
  variant = 'shimmer',
  className,
}) => (
  <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4', className)}>
    {Array.from({ length: items }).map((_, index) => (
      <CardSkeleton
        key={`grid-item-${index}`}
        layout='card'
        showImage={showImage}
        showRating={showRating}
        variant={variant}
      />
    ))}
  </div>
);

// Main generic skeleton component
export const GenericSkeleton: React.FC<SkeletonConfig> = (config) => {
  const { layout, className, ...props } = config;

  switch (layout) {
    case 'card':
      return <CardSkeleton {...config} />;
    case 'table':
      return <TableSkeleton {...config} />;
    case 'form':
      return <FormSkeleton {...config} />;
    case 'dashboard':
      return <DashboardSkeleton {...config} />;
    case 'navigation':
      return <NavigationSkeleton {...config} />;
    case 'list':
      return <ListSkeleton {...config} />;
    case 'grid':
      return <GridSkeleton {...config} />;
    default:
      return <Skeleton className={className} {...props} />;
  }
};

// Convenience components with preset configurations
export const ProductCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <GenericSkeleton
    layout='card'
    showImage={true}
    showRating={true}
    showBadge={false}
    className={className}
  />
);

export const ProductGridSkeleton: React.FC<{ 
  items?: number; 
  className?: string; 
}> = ({ items = 8, className }) => (
  <GenericSkeleton
    layout='grid'
    items={items}
    showImage={true}
    showRating={true}
    className={className}
  />
);

export const DataTableSkeleton: React.FC<{
  columns?: number;
  rows?: number;
  className?: string;
}> = ({ columns = 4, rows = 5, className }) => (
  <GenericSkeleton
    layout='table'
    columns={columns}
    items={rows}
    className={className}
  />
);

export const UserListSkeleton: React.FC<{
  items?: number;
  className?: string;
}> = ({ items = 5, className }) => (
  <GenericSkeleton
    layout='list'
    items={items}
    showAvatar={true}
    className={className}
  />
);

export const DashboardCardSkeleton: React.FC<{
  showChart?: boolean;
  className?: string;
}> = ({ showChart = false, className }) => (
  <GenericSkeleton
    layout='dashboard'
    showChart={showChart}
    className={className}
  />
);

// Loading page skeleton for full page states
export const LoadingPageSkeleton: React.FC<{
  showNavigation?: boolean;
  layout: 'grid' | 'list' | 'dashboard';
  itemCount?: number;
  className?: string;
}> = ({ 
  showNavigation = true, 
  layout, 
  itemCount = 6,
  className 
}) => (
  <div className={cn('min-h-screen', className)}>
    {showNavigation && (
      <GenericSkeleton layout='navigation' />
    )}
    <div className='container py-8'>
      <div className='mb-6 space-y-2'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-4 w-64' />
      </div>
      <GenericSkeleton
        layout={layout}
        items={itemCount}
        className='mt-6'
      />
    </div>
  </div>
);

export type { SkeletonConfig, SkeletonProps };