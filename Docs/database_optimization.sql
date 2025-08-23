-- Database Query Optimization and Indexing Strategy
-- Version: 1.0.0
-- Purpose: Enhance database performance through strategic indexing and query optimization

-- =========================
-- PERFORMANCE ANALYSIS HELPERS
-- =========================

-- Function to analyze slow queries
CREATE OR REPLACE FUNCTION analyze_slow_queries()
RETURNS TABLE(
  query text,
  total_time numeric,
  mean_time numeric,
  calls bigint,
  rows bigint,
  hit_percent numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    query,
    total_exec_time as total_time,
    mean_exec_time as mean_time,
    calls,
    rows,
    (shared_blks_hit::numeric / (shared_blks_hit + shared_blks_read)::numeric * 100) as hit_percent
  FROM pg_stat_statements 
  WHERE calls > 10 -- Only queries called more than 10 times
  ORDER BY total_exec_time DESC 
  LIMIT 20;
$$;

-- Function to analyze table sizes and usage
CREATE OR REPLACE FUNCTION table_size_analysis()
RETURNS TABLE(
  table_name text,
  size_mb numeric,
  tuple_count bigint,
  live_tuples bigint,
  dead_tuples bigint,
  last_vacuum timestamp with time zone,
  last_analyze timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    schemaname||'.'||tablename as table_name,
    pg_total_relation_size(schemaname||'.'||tablename)::numeric / 1024 / 1024 as size_mb,
    n_tup_ins + n_tup_upd + n_tup_del as tuple_count,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_analyze
  FROM pg_stat_user_tables 
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
$$;

-- =========================
-- ADDITIONAL STRATEGIC INDEXES
-- =========================

-- Composite index for product search with filtering
DROP INDEX IF EXISTS idx_productos_search_composite;
CREATE INDEX CONCURRENTLY idx_productos_search_composite 
ON productos(estado, archivado, categoria_id, created_at DESC) 
WHERE estado = 'activo' AND archivado = false;

-- Index for user dashboard queries (seller products)
DROP INDEX IF EXISTS idx_productos_vendedor_estado;
CREATE INDEX CONCURRENTLY idx_productos_vendedor_estado 
ON productos(vendedor_id, estado, created_at DESC);

-- Index for order analytics and reporting
DROP INDEX IF EXISTS idx_orders_analytics;
CREATE INDEX CONCURRENTLY idx_orders_analytics 
ON orders(estado, created_at, total) 
WHERE estado IN ('procesando', 'enviado', 'entregado');

-- Index for order items by product for analytics
DROP INDEX IF EXISTS idx_order_items_analytics;
CREATE INDEX CONCURRENTLY idx_order_items_analytics 
ON order_items(producto_id, created_at)
INCLUDE (cantidad, precio_unitario, subtotal);

-- Index for evaluations with product info
DROP INDEX IF EXISTS idx_evaluaciones_composite;
CREATE INDEX CONCURRENTLY idx_evaluaciones_composite 
ON evaluaciones(producto_id, created_at DESC)
INCLUDE (puntuacion, comprador_id);

-- Index for audit log queries by admin
DROP INDEX IF EXISTS idx_audit_log_admin;
CREATE INDEX CONCURRENTLY idx_audit_log_admin 
ON audit_log(created_at DESC, action, entity)
INCLUDE (actor_id, entity_id);

-- Index for user role and status queries
DROP INDEX IF EXISTS idx_users_role_status;
CREATE INDEX CONCURRENTLY idx_users_role_status 
ON users(role, vendedor_estado, bloqueado, created_at);

-- Index for order shipping lookup
DROP INDEX IF EXISTS idx_order_shipping_lookup;
CREATE INDEX CONCURRENTLY idx_order_shipping_lookup 
ON order_shipping(order_id);

-- Partial index for active products only (memory efficient)
DROP INDEX IF EXISTS idx_productos_active_only;
CREATE INDEX CONCURRENTLY idx_productos_active_only 
ON productos(categoria_id, precio, created_at DESC)
WHERE estado = 'activo' AND archivado = false;

-- Index for order processing workflow
DROP INDEX IF EXISTS idx_orders_processing;
CREATE INDEX CONCURRENTLY idx_orders_processing 
ON orders(estado, updated_at)
WHERE estado IN ('pendiente', 'procesando');

-- =========================
-- QUERY OPTIMIZATION FUNCTIONS
-- =========================

-- Optimized product search with full-text search and filters
CREATE OR REPLACE FUNCTION search_productos_optimized(
  search_term text DEFAULT NULL,
  categoria_filter uuid DEFAULT NULL,
  precio_min numeric DEFAULT NULL,
  precio_max numeric DEFAULT NULL,
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  nombre text,
  descripcion text,
  precio numeric,
  imagen_url text,
  vendedor_nombre text,
  categoria_nombre text,
  promedio_calificacion numeric,
  total_calificaciones bigint,
  rank_score real
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.nombre,
    p.descripcion,
    p.precio,
    p.imagen_url,
    u.nombre_completo as vendedor_nombre,
    c.nombre as categoria_nombre,
    COALESCE(mv.promedio, 0) as promedio_calificacion,
    COALESCE(mv.total, 0) as total_calificaciones,
    CASE 
      WHEN search_term IS NOT NULL THEN 
        ts_rank(to_tsvector('spanish', p.nombre || ' ' || COALESCE(p.descripcion, '')), 
                plainto_tsquery('spanish', search_term))
      ELSE 1.0
    END as rank_score
  FROM productos p
  JOIN users u ON u.id = p.vendedor_id
  LEFT JOIN categorias c ON c.id = p.categoria_id
  LEFT JOIN mv_promedio_calificaciones mv ON mv.producto_id = p.id
  WHERE p.estado = 'activo' 
    AND p.archivado = false
    AND (search_term IS NULL OR 
         to_tsvector('spanish', p.nombre || ' ' || COALESCE(p.descripcion, '')) @@ plainto_tsquery('spanish', search_term))
    AND (categoria_filter IS NULL OR p.categoria_id = categoria_filter)
    AND (precio_min IS NULL OR p.precio >= precio_min)
    AND (precio_max IS NULL OR p.precio <= precio_max)
  ORDER BY 
    CASE WHEN search_term IS NOT NULL THEN rank_score ELSE 0 END DESC,
    p.created_at DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$;

-- Optimized seller dashboard analytics
CREATE OR REPLACE FUNCTION seller_dashboard_stats(
  vendedor_uuid uuid DEFAULT NULL,
  periodo_dias integer DEFAULT 30
)
RETURNS TABLE(
  total_productos bigint,
  productos_activos bigint,
  ventas_periodo numeric,
  pedidos_periodo bigint,
  items_enviados bigint,
  items_pendientes bigint,
  promedio_calificaciones numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_vendedor uuid := COALESCE(vendedor_uuid, current_setting('request.jwt.claim.sub', true)::uuid);
  fecha_inicio timestamptz := now() - (periodo_dias || ' days')::interval;
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT count(*) FROM productos WHERE vendedor_id = v_vendedor) as total_productos,
    (SELECT count(*) FROM productos WHERE vendedor_id = v_vendedor AND estado = 'activo' AND archivado = false) as productos_activos,
    COALESCE((
      SELECT sum(oi.subtotal) 
      FROM order_items oi 
      JOIN orders o ON o.id = oi.order_id 
      WHERE oi.vendedor_id = v_vendedor 
        AND o.created_at >= fecha_inicio 
        AND o.estado IN ('procesando', 'enviado', 'entregado')
    ), 0) as ventas_periodo,
    COALESCE((
      SELECT count(DISTINCT oi.order_id) 
      FROM order_items oi 
      JOIN orders o ON o.id = oi.order_id 
      WHERE oi.vendedor_id = v_vendedor 
        AND o.created_at >= fecha_inicio 
        AND o.estado IN ('procesando', 'enviado', 'entregado')
    ), 0) as pedidos_periodo,
    (SELECT count(*) FROM order_items WHERE vendedor_id = v_vendedor AND enviado = true) as items_enviados,
    (SELECT count(*) FROM order_items WHERE vendedor_id = v_vendedor AND enviado = false) as items_pendientes,
    COALESCE((
      SELECT avg(e.puntuacion) 
      FROM evaluaciones e 
      JOIN productos p ON p.id = e.producto_id 
      WHERE p.vendedor_id = v_vendedor
    ), 0) as promedio_calificaciones;
END;
$$;

-- Optimized buyer order history
CREATE OR REPLACE FUNCTION buyer_order_history(
  comprador_uuid uuid DEFAULT NULL,
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  order_id uuid,
  estado pedido_estado,
  total numeric,
  created_at timestamptz,
  invoice_number text,
  items_count bigint,
  all_items_shipped boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_comprador uuid := COALESCE(comprador_uuid, current_setting('request.jwt.claim.sub', true)::uuid);
BEGIN
  RETURN QUERY
  SELECT 
    o.id as order_id,
    o.estado,
    o.total,
    o.created_at,
    o.invoice_number,
    (SELECT count(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count,
    NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.enviado = false) as all_items_shipped
  FROM orders o
  WHERE o.comprador_id = v_comprador
  ORDER BY o.created_at DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$;

-- =========================
-- MATERIALIZED VIEW REFRESH FUNCTIONS
-- =========================

-- Function to refresh materialized views efficiently
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh product ratings materialized view
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_promedio_calificaciones;
  
  -- Log the refresh
  INSERT INTO audit_log(action, entity, new_values)
  VALUES ('REFRESH_MATERIALIZED_VIEWS', 'system', jsonb_build_object('timestamp', now()));
END;
$$;

-- =========================
-- DATABASE MAINTENANCE FUNCTIONS
-- =========================

-- Function to analyze database performance and suggest optimizations
CREATE OR REPLACE FUNCTION database_health_check()
RETURNS TABLE(
  metric text,
  value text,
  status text,
  recommendation text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  
  -- Check cache hit ratio
  SELECT 
    'Cache Hit Ratio'::text as metric,
    (round((sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100)::numeric, 2)||'%')::text as value,
    CASE 
      WHEN (sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100) > 95 THEN 'GOOD'
      WHEN (sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100) > 90 THEN 'OK'
      ELSE 'POOR'
    END as status,
    CASE 
      WHEN (sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100) <= 90 THEN 'Consider increasing shared_buffers'
      ELSE 'Cache performance is good'
    END as recommendation
  FROM pg_statio_user_tables
  
  UNION ALL
  
  -- Check for unused indexes
  SELECT 
    'Unused Indexes'::text as metric,
    count(*)::text as value,
    CASE WHEN count(*) = 0 THEN 'GOOD' WHEN count(*) < 5 THEN 'OK' ELSE 'POOR' END as status,
    CASE WHEN count(*) > 0 THEN 'Consider dropping unused indexes' ELSE 'All indexes are being used' END as recommendation
  FROM pg_stat_user_indexes
  WHERE idx_scan = 0
  
  UNION ALL
  
  -- Check for tables needing vacuum
  SELECT 
    'Tables Needing Vacuum'::text as metric,
    count(*)::text as value,
    CASE WHEN count(*) = 0 THEN 'GOOD' WHEN count(*) < 3 THEN 'OK' ELSE 'POOR' END as status,
    CASE WHEN count(*) > 0 THEN 'Run VACUUM on high-traffic tables' ELSE 'Vacuum status is good' END as recommendation
  FROM pg_stat_user_tables
  WHERE n_dead_tup > n_live_tup * 0.1 -- More than 10% dead tuples
  
  UNION ALL
  
  -- Check for long-running queries
  SELECT 
    'Long Running Queries'::text as metric,
    count(*)::text as value,
    CASE WHEN count(*) = 0 THEN 'GOOD' WHEN count(*) < 3 THEN 'OK' ELSE 'POOR' END as status,
    CASE WHEN count(*) > 0 THEN 'Investigate and optimize slow queries' ELSE 'No long-running queries detected' END as recommendation
  FROM pg_stat_activity
  WHERE state = 'active' AND query_start < now() - interval '5 minutes';
END;
$$;

-- =========================
-- QUERY PERFORMANCE MONITORING
-- =========================

-- Function to track query performance
CREATE OR REPLACE FUNCTION log_query_performance(
  query_name text,
  execution_time_ms numeric,
  rows_affected bigint DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_log(action, entity, new_values)
  VALUES (
    'QUERY_PERFORMANCE',
    'system',
    jsonb_build_object(
      'query_name', query_name,
      'execution_time_ms', execution_time_ms,
      'rows_affected', rows_affected,
      'timestamp', now()
    )
  );
END;
$$;

-- =========================
-- INDEX MAINTENANCE
-- =========================

-- Function to rebuild fragmented indexes
CREATE OR REPLACE FUNCTION reindex_fragmented_indexes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  index_record RECORD;
BEGIN
  -- Find and rebuild indexes with low efficiency
  FOR index_record IN 
    SELECT schemaname, tablename, indexname 
    FROM pg_stat_user_indexes 
    WHERE idx_scan > 0 AND idx_tup_read > idx_tup_fetch * 1.5
  LOOP
    EXECUTE format('REINDEX INDEX CONCURRENTLY %I.%I', index_record.schemaname, index_record.indexname);
  END LOOP;
  
  -- Log the maintenance
  INSERT INTO audit_log(action, entity, new_values)
  VALUES ('REINDEX_MAINTENANCE', 'system', jsonb_build_object('timestamp', now()));
END;
$$;

-- =========================
-- PERFORMANCE CONFIGURATION RECOMMENDATIONS
-- =========================

-- Function to get configuration recommendations
CREATE OR REPLACE FUNCTION get_performance_recommendations()
RETURNS TABLE(
  parameter text,
  current_value text,
  recommended_value text,
  impact text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'work_mem'::text as parameter,
    current_setting('work_mem') as current_value,
    '16MB'::text as recommended_value,
    'Improves sorting and hash operations'::text as impact
  
  UNION ALL
  
  SELECT 
    'effective_cache_size'::text as parameter,
    current_setting('effective_cache_size') as current_value,
    '1GB'::text as recommended_value,
    'Helps query planner make better decisions'::text as impact
  
  UNION ALL
  
  SELECT 
    'random_page_cost'::text as parameter,
    current_setting('random_page_cost') as current_value,
    '1.1'::text as recommended_value,
    'Optimizes for SSD storage'::text as impact;
END;
$$;