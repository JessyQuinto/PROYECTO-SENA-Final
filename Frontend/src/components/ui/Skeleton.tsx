import React from 'react';
import { cn } from '@/lib/utils';

// Base Skeleton component
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
      {...props}
    />
  );
};

// Product Card Skeleton
export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className=\"space-y-3\">
      <Skeleton className=\"aspect-square w-full rounded-lg\" />
      <div className=\"space-y-2\">
        <Skeleton className=\"h-4 w-3/4\" />
        <Skeleton className=\"h-4 w-1/2\" />
        <Skeleton className=\"h-6 w-1/3\" />
      </div>
    </div>
  );
};

// Text Skeleton
interface TextSkeletonProps {
  lines?: number;
  className?: string;
}

export const TextSkeleton: React.FC<TextSkeletonProps> = ({ 
  lines = 3, 
  className 
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => {
        const isLastLine = index === lines - 1;
        return (
          <Skeleton 
            key={index} 
            className={cn(
              'h-4',
              isLastLine ? 'w-2/3' : 'w-full'
            )} 
          />
        );
      })}
    </div>
  );
};

// Card Skeleton
export const CardSkeleton: React.FC = () => {
  return (
    <div className=\"rounded-lg border bg-card p-6 shadow-sm\">
      <div className=\"space-y-4\">
        <div className=\"space-y-2\">
          <Skeleton className=\"h-6 w-1/3\" />
          <Skeleton className=\"h-4 w-2/3\" />
        </div>
        <TextSkeleton lines={3} />
        <div className=\"flex items-center space-x-2\">
          <Skeleton className=\"h-9 w-20\" />
          <Skeleton className=\"h-9 w-16\" />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;