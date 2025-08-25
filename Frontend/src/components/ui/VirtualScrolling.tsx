import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { FixedSizeGrid as Grid, VariableSizeGrid } from 'react-window';
import { useResizeObserver } from '@/hooks/useResizeObserver';

interface Product {
  id: string;
  nombre: string;
  precio: number;
  imagen_url?: string;
  vendedor_id: string;
  categoria_id?: string;
}

interface VirtualProductGridProps {
  products: Product[];
  onProductClick?: (product: Product) => void;
  itemHeight?: number;
  gap?: number;
  minItemWidth?: number;
  className?: string;
}

interface GridItemProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    products: Product[];
    columnCount: number;
    itemWidth: number;
    gap: number;
    onProductClick?: (product: Product) => void;
  };
}

// Individual grid item component
const GridItem: React.FC<GridItemProps> = ({ columnIndex, rowIndex, style, data }) => {
  const { products, columnCount, itemWidth, gap, onProductClick } = data;
  const index = rowIndex * columnCount + columnIndex;
  const product = products[index];

  if (!product) {
    return <div style={style} />;
  }

  return (
    <div
      style={{
        ...style,
        padding: gap / 2,
      }}
    >
      <ProductCard
        product={product}
        onClick={() => onProductClick?.(product)}
        width={itemWidth - gap}
      />
    </div>
  );
};

// Optimized product card component
const ProductCard: React.FC<{
  product: Product;
  onClick?: () => void;
  width: number;
}> = React.memo(({ product, onClick, width }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
      onClick={onClick}
      style={{ width }}
    >
      {/* Image container with fixed aspect ratio */}
      <div className="relative aspect-[3/2] bg-gray-100 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        
        {product.imagen_url && !imageError ? (
          <img
            src={product.imagen_url}
            alt={product.nombre}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <svg
              className="w-8 h-8 text-gray-400"
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
      </div>

      {/* Product details */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
          {product.nombre}
        </h3>
        <p className="text-lg font-bold text-green-600">
          ${Number(product.precio).toLocaleString('es-CO')}
        </p>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

// Custom hook for responsive grid calculations
const useResponsiveGrid = (
  containerWidth: number,
  minItemWidth: number,
  gap: number
) => {
  return useMemo(() => {
    const availableWidth = containerWidth - gap;
    const columnCount = Math.max(1, Math.floor(availableWidth / (minItemWidth + gap)));
    const itemWidth = (availableWidth - (columnCount - 1) * gap) / columnCount;
    
    return { columnCount, itemWidth };
  }, [containerWidth, minItemWidth, gap]);
};

// Main virtual scrolling grid component
export const VirtualProductGrid: React.FC<VirtualProductGridProps> = ({
  products,
  onProductClick,
  itemHeight = 280,
  gap = 16,
  minItemWidth = 250,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 600 });

  // Resize observer to track container dimensions
  useResizeObserver(containerRef, (entry) => {
    setContainerSize({
      width: entry.contentRect.width,
      height: Math.max(600, entry.contentRect.height),
    });
  });

  // Calculate responsive grid layout
  const { columnCount, itemWidth } = useResponsiveGrid(
    containerSize.width,
    minItemWidth,
    gap
  );

  // Calculate grid dimensions
  const rowCount = Math.ceil(products.length / columnCount);
  const totalHeight = rowCount * (itemHeight + gap) - gap;

  // Memoized grid data to prevent unnecessary re-renders
  const gridData = useMemo(() => ({
    products,
    columnCount,
    itemWidth,
    gap,
    onProductClick,
  }), [products, columnCount, itemWidth, gap, onProductClick]);

  // Don't render grid until we have container dimensions
  if (containerSize.width === 0) {
    return (
      <div ref={containerRef} className={`w-full h-96 ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  // For small number of products, don't use virtualization
  if (products.length <= 20) {
    return (
      <div ref={containerRef} className={`w-full ${className}`}>
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
          }}
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => onProductClick?.(product)}
              width={itemWidth}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <Grid
        columnCount={columnCount}
        columnWidth={itemWidth + gap}
        height={Math.min(containerSize.height, totalHeight)}
        rowCount={rowCount}
        rowHeight={itemHeight + gap}
        width={containerSize.width}
        itemData={gridData}
        overscanRowCount={2}
        overscanColumnCount={1}
      >
        {GridItem}
      </Grid>
    </div>
  );
};

// Alternative infinite scroll implementation using Intersection Observer
export const InfiniteScrollProductGrid: React.FC<{
  products: Product[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  onProductClick?: (product: Product) => void;
  className?: string;
}> = ({
  products,
  onLoadMore,
  hasMore = false,
  loading = false,
  onProductClick,
  className = '',
}) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  // Track container width for responsive grid
  useResizeObserver(containerRef, (entry) => {
    setContainerWidth(entry.contentRect.width);
  });

  const { columnCount, itemWidth } = useResponsiveGrid(containerWidth, 250, 16);

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        }}
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => onProductClick?.(product)}
            width={itemWidth}
          />
        ))}
      </div>

      {/* Load more trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
              <span className="text-gray-600">Cargando más productos...</span>
            </div>
          ) : (
            <div className="h-10" />
          )}
        </div>
      )}
    </div>
  );
};

export default VirtualProductGrid;