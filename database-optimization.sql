-- Database Performance Optimization Scripts for Tesoros Chocó
-- Execute these in your Supabase SQL Editor

-- ==================================================
-- 1. ENHANCED INDEXES FOR BETTER QUERY PERFORMANCE
-- ==================================================

-- Products table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_productos_estado_stock_activo 
ON productos (estado, stock) 
WHERE estado = 'activo' AND stock > 0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_productos_categoria_precio_activo 
ON productos (categoria_id, precio DESC) 
WHERE estado = 'activo';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_productos_vendedor_estado 
ON productos (vendedor_id, estado, created_at DESC) 
WHERE estado = 'activo';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_productos_created_at_desc 
ON productos (created_at DESC) 
WHERE estado = 'activo' AND stock > 0;

-- Full-text search index for product names and descriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_productos_search 
ON productos USING GIN (to_tsvector('spanish', nombre || ' ' || COALESCE(descripcion, '')))
WHERE estado = 'activo';

-- Orders table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_created_desc 
ON orders (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_estado_created 
ON orders (estado, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_vendedor_estado 
ON orders (vendedor_id, estado, created_at DESC)
WHERE vendedor_id IS NOT NULL;

-- Order items optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_producto_created 
ON order_items (producto_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_order_producto 
ON order_items (order_id, producto_id);

-- Categories optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categorias_nombre 
ON categorias (nombre);

-- Users table optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_role 
ON users (email, role);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_created 
ON users (role, created_at DESC);

-- ==================================================
-- 2. MATERIALIZED VIEWS FOR EXPENSIVE AGGREGATIONS
-- ==================================================

-- Product ratings materialized view (if not exists)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_metrics AS
SELECT 
    p.id as producto_id,
    p.nombre,
    p.precio,
    p.stock,
    p.categoria_id,
    p.vendedor_id,
    COALESCE(ratings.promedio_calificacion, 0) as promedio_calificacion,
    COALESCE(ratings.total_calificaciones, 0) as total_calificaciones,
    COALESCE(sales.total_vendido, 0) as total_vendido,
    COALESCE(sales.ingresos_totales, 0) as ingresos_totales,
    p.created_at,
    p.updated_at
FROM productos p
LEFT JOIN (
    SELECT 
        producto_id,
        AVG(calificacion::numeric) as promedio_calificacion,
        COUNT(*) as total_calificaciones
    FROM calificaciones 
    GROUP BY producto_id
) ratings ON p.id = ratings.producto_id
LEFT JOIN (
    SELECT 
        oi.producto_id,
        SUM(oi.cantidad) as total_vendido,
        SUM(oi.cantidad * oi.precio_unitario) as ingresos_totales
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.estado IN ('completado', 'entregado')
    GROUP BY oi.producto_id
) sales ON p.id = sales.producto_id
WHERE p.estado = 'activo';

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_product_metrics_producto_id 
ON mv_product_metrics (producto_id);

-- Additional indexes on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_product_metrics_categoria_promedio 
ON mv_product_metrics (categoria_id, promedio_calificacion DESC);

CREATE INDEX IF NOT EXISTS idx_mv_product_metrics_vendedor_ingresos 
ON mv_product_metrics (vendedor_id, ingresos_totales DESC);

CREATE INDEX IF NOT EXISTS idx_mv_product_metrics_total_vendido 
ON mv_product_metrics (total_vendido DESC);

-- ==================================================
-- 3. OPTIMIZED STORED PROCEDURES
-- ==================================================

-- Enhanced product search with better performance
CREATE OR REPLACE FUNCTION search_products_optimized(
    p_search_term TEXT DEFAULT NULL,
    p_categoria_id UUID DEFAULT NULL,
    p_precio_min NUMERIC DEFAULT NULL,
    p_precio_max NUMERIC DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'newest',
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    nombre TEXT,
    descripcion TEXT,
    precio NUMERIC,
    stock INTEGER,
    imagen_url TEXT,
    categoria_nombre TEXT,
    vendedor_nombre TEXT,
    promedio_calificacion NUMERIC,
    total_calificaciones BIGINT,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nombre,
        p.descripcion,
        p.precio,
        p.stock,
        p.imagen_url,
        c.nombre as categoria_nombre,
        u.nombre_completo as vendedor_nombre,
        COALESCE(pm.promedio_calificacion, 0) as promedio_calificacion,
        COALESCE(pm.total_calificaciones, 0) as total_calificaciones,
        p.created_at
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    LEFT JOIN users u ON p.vendedor_id = u.id
    LEFT JOIN mv_product_metrics pm ON p.id = pm.producto_id
    WHERE 
        p.estado = 'activo' 
        AND p.stock > 0
        AND (p_search_term IS NULL OR p.nombre ILIKE '%' || p_search_term || '%')
        AND (p_categoria_id IS NULL OR p.categoria_id = p_categoria_id)
        AND (p_precio_min IS NULL OR p.precio >= p_precio_min)
        AND (p_precio_max IS NULL OR p.precio <= p_precio_max)
    ORDER BY 
        CASE 
            WHEN p_sort_by = 'price_asc' THEN p.precio
            END ASC,
        CASE 
            WHEN p_sort_by = 'price_desc' THEN p.precio
            END DESC,
        CASE 
            WHEN p_sort_by = 'name' THEN p.nombre
            END ASC,
        CASE 
            WHEN p_sort_by = 'rating' THEN COALESCE(pm.promedio_calificacion, 0)
            END DESC,
        CASE 
            WHEN p_sort_by = 'popular' THEN COALESCE(pm.total_vendido, 0)
            END DESC,
        CASE 
            WHEN p_sort_by = 'newest' OR p_sort_by IS NULL THEN p.created_at
            END DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Batch product details function
CREATE OR REPLACE FUNCTION get_products_batch(product_ids UUID[])
RETURNS TABLE (
    id UUID,
    nombre TEXT,
    precio NUMERIC,
    stock INTEGER,
    imagen_url TEXT,
    categoria_nombre TEXT,
    promedio_calificacion NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nombre,
        p.precio,
        p.stock,
        p.imagen_url,
        c.nombre as categoria_nombre,
        COALESCE(pm.promedio_calificacion, 0) as promedio_calificacion
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    LEFT JOIN mv_product_metrics pm ON p.id = pm.producto_id
    WHERE p.id = ANY(product_ids)
        AND p.estado = 'activo';
END;
$$;

-- Optimized order creation with better error handling
CREATE OR REPLACE FUNCTION crear_pedido_optimized(
    p_user_id UUID,
    p_items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_product RECORD;
    v_total NUMERIC := 0;
BEGIN
    -- Start transaction
    BEGIN
        -- Create order
        INSERT INTO orders (user_id, estado, total)
        VALUES (p_user_id, 'pendiente', 0)
        RETURNING id INTO v_order_id;

        -- Process each item
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            -- Get product details with lock
            SELECT id, precio, stock, vendedor_id 
            INTO v_product
            FROM productos 
            WHERE id = (v_item->>'producto_id')::UUID
                AND estado = 'activo'
            FOR UPDATE;

            -- Check if product exists and has enough stock
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Product not found: %', v_item->>'producto_id';
            END IF;

            IF v_product.stock < (v_item->>'cantidad')::INTEGER THEN
                RAISE EXCEPTION 'Insufficient stock for product: %', v_item->>'producto_id';
            END IF;

            -- Insert order item
            INSERT INTO order_items (
                order_id, 
                producto_id, 
                cantidad, 
                precio_unitario,
                vendedor_id
            )
            VALUES (
                v_order_id,
                v_product.id,
                (v_item->>'cantidad')::INTEGER,
                v_product.precio,
                v_product.vendedor_id
            );

            -- Update stock
            UPDATE productos 
            SET stock = stock - (v_item->>'cantidad')::INTEGER,
                updated_at = NOW()
            WHERE id = v_product.id;

            -- Add to total
            v_total := v_total + (v_product.precio * (v_item->>'cantidad')::INTEGER);
        END LOOP;

        -- Update order total
        UPDATE orders 
        SET total = v_total, updated_at = NOW()
        WHERE id = v_order_id;

        RETURN v_order_id;

    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback will happen automatically
            RAISE;
    END;
END;
$$;

-- ==================================================
-- 4. REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- ==================================================

-- Function to refresh product metrics
CREATE OR REPLACE FUNCTION refresh_product_metrics()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_metrics;
END;
$$;

-- ==================================================
-- 5. AUTOMATED REFRESH SCHEDULE (Using pg_cron if available)
-- ==================================================

-- Note: This requires pg_cron extension which may not be available in Supabase
-- If available, uncomment and schedule:
-- SELECT cron.schedule('refresh-product-metrics', '*/15 * * * *', 'SELECT refresh_product_metrics();');

-- ==================================================
-- 6. PERFORMANCE MONITORING VIEWS
-- ==================================================

-- View for monitoring slow queries
CREATE OR REPLACE VIEW v_query_performance AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    stddev_time,
    rows
FROM pg_stat_statements 
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_time DESC;

-- View for monitoring table sizes
CREATE OR REPLACE VIEW v_table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- View for monitoring index usage
CREATE OR REPLACE VIEW v_index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- ==================================================
-- 7. CLEANUP AND MAINTENANCE
-- ==================================================

-- Function to clean up old logs (if you have logging tables)
CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Example: Delete old audit logs
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- Function to update table statistics
CREATE OR REPLACE FUNCTION update_table_stats()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Analyze key tables for better query planning
    ANALYZE productos;
    ANALYZE orders;
    ANALYZE order_items;
    ANALYZE users;
    ANALYZE categorias;
    ANALYZE calificaciones;
END;
$$;

-- ==================================================
-- 8. PERFORMANCE TESTING HELPERS
-- ==================================================

-- Function to generate test data for performance testing
CREATE OR REPLACE FUNCTION generate_test_products(count INTEGER DEFAULT 1000)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    i INTEGER;
    random_categoria UUID;
    random_vendedor UUID;
BEGIN
    -- Get random category and vendor IDs
    SELECT id INTO random_categoria FROM categorias ORDER BY RANDOM() LIMIT 1;
    SELECT id INTO random_vendedor FROM users WHERE role = 'vendedor' ORDER BY RANDOM() LIMIT 1;
    
    FOR i IN 1..count LOOP
        INSERT INTO productos (
            nombre,
            descripcion,
            precio,
            stock,
            categoria_id,
            vendedor_id,
            estado
        ) VALUES (
            'Producto Test ' || i,
            'Descripción del producto de prueba número ' || i,
            (RANDOM() * 500000 + 10000)::NUMERIC(10,2),
            (RANDOM() * 100 + 1)::INTEGER,
            random_categoria,
            random_vendedor,
            'activo'
        );
    END LOOP;
END;
$$;

-- Performance benchmark function
CREATE OR REPLACE FUNCTION benchmark_product_search()
RETURNS TABLE (
    test_name TEXT,
    execution_time_ms NUMERIC,
    rows_returned BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    row_count BIGINT;
BEGIN
    -- Test 1: Simple product search
    start_time := clock_timestamp();
    SELECT COUNT(*) INTO row_count
    FROM productos 
    WHERE estado = 'activo' AND stock > 0;
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        'Simple active products count'::TEXT,
        EXTRACT(EPOCH FROM (end_time - start_time)) * 1000,
        row_count;
    
    -- Test 2: Complex search with joins
    start_time := clock_timestamp();
    SELECT COUNT(*) INTO row_count
    FROM search_products_optimized('artesanía', NULL, 10000, 100000, 'newest', 50, 0);
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        'Complex search with filters'::TEXT,
        EXTRACT(EPOCH FROM (end_time - start_time)) * 1000,
        row_count;
    
    -- Test 3: Materialized view query
    start_time := clock_timestamp();
    SELECT COUNT(*) INTO row_count
    FROM mv_product_metrics 
    WHERE promedio_calificacion > 4;
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        'Materialized view query'::TEXT,
        EXTRACT(EPOCH FROM (end_time - start_time)) * 1000,
        row_count;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION search_products_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION get_products_batch TO authenticated;
GRANT EXECUTE ON FUNCTION crear_pedido_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_product_metrics TO service_role;
GRANT SELECT ON mv_product_metrics TO authenticated;

-- Final message
DO $$
BEGIN
    RAISE NOTICE 'Database optimization scripts executed successfully!';
    RAISE NOTICE 'Remember to refresh materialized views regularly: SELECT refresh_product_metrics();';
    RAISE NOTICE 'Monitor performance with: SELECT * FROM v_query_performance LIMIT 10;';
END $$;