-- Bootstrap Schema Version: 1.1.0
-- =========================
CREATE TYPE user_role AS ENUM ('admin','vendedor','comprador');
CREATE TYPE vendedor_estado AS ENUM ('pendiente','aprobado','rechazado');
CREATE TYPE producto_estado AS ENUM ('activo','inactivo','bloqueado');
CREATE TYPE pedido_estado AS ENUM ('pendiente','procesando','enviado','entregado','cancelado');

-- NOTA: Cambios futuros en ENUMs deben gestionarse con migraciones ALTER TYPE y documentarse en MIGRATIONS.md

-- =========================
-- TABLES
-- =========================
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'comprador',
  vendedor_estado vendedor_estado DEFAULT 'pendiente',
  nombre_completo text,
  bloqueado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  slug text NOT NULL UNIQUE,
  descripcion text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  categoria_id uuid REFERENCES categorias(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  descripcion text,
  precio numeric(12,2) NOT NULL CHECK (precio > 0),
  stock integer NOT NULL CHECK (stock >= 0),
  imagen_url text,
  estado producto_estado NOT NULL DEFAULT 'activo',
  archivado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comprador_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  estado pedido_estado NOT NULL DEFAULT 'pendiente',
  total numeric(14,2) NOT NULL DEFAULT 0,
  moneda text NOT NULL DEFAULT 'COP',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  invoice_number text UNIQUE
);

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  vendedor_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(12,2) NOT NULL CHECK (precio_unitario > 0),
  subtotal numeric(14,2) NOT NULL,
  producto_nombre text NOT NULL,
  producto_imagen_url text,
  enviado boolean NOT NULL DEFAULT false
);

CREATE TABLE evaluaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comprador_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  producto_id uuid NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
  puntuacion integer NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comprador_id, order_item_id)
);

CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  actor_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- App config (clave/valor JSON) para ajustes administrativos
CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================
-- INDEXES
-- =========================
CREATE INDEX idx_productos_estado_categoria ON productos(estado, categoria_id, created_at DESC);
CREATE INDEX idx_productos_search ON productos USING GIN (to_tsvector('spanish', nombre || ' ' || coalesce(descripcion,'')));
CREATE INDEX idx_order_items_vendedor ON order_items(vendedor_id);
CREATE INDEX idx_evaluaciones_producto ON evaluaciones(producto_id);
CREATE INDEX idx_orders_comprador ON orders(comprador_id, created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- =========================
-- SHIPPING INFO (pedido)
-- =========================
CREATE TABLE IF NOT EXISTS order_shipping (
  order_id uuid PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  direccion text NOT NULL,
  ciudad text NOT NULL,
  telefono text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_order_shipping_updated BEFORE UPDATE ON order_shipping
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================
-- TRIGGERS (updated_at + order total + prevent delete product with evaluations)
-- =========================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_productos_updated BEFORE UPDATE ON productos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- auto update updated_at en app_config
CREATE TRIGGER IF NOT EXISTS trg_app_config_updated BEFORE UPDATE ON app_config
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================
-- INVOICE SUPPORT (invoice_counters + auto-assign)
-- =========================
-- Contador por año para generar consecutivos de factura tipo YYYY-000001
CREATE TABLE IF NOT EXISTS invoice_counters (
  year integer PRIMARY KEY,
  last_number integer NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION next_invoice_number(p_year integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new integer;
  v_txt text;
BEGIN
  -- asegurar fila del año
  PERFORM 1 FROM invoice_counters WHERE year = p_year;
  IF NOT FOUND THEN
    BEGIN
      INSERT INTO invoice_counters(year, last_number) VALUES (p_year, 0);
    EXCEPTION WHEN unique_violation THEN
      -- otro proceso la creó; continuar
    END;
  END IF;
  -- incrementar con bloqueo de fila
  UPDATE invoice_counters SET last_number = last_number + 1 WHERE year = p_year RETURNING last_number INTO v_new;
  v_txt := lpad(v_new::text, 6, '0');
  RETURN p_year::text || '-' || v_txt;
END;$$;

-- Asignar invoice_number al cambiar a estados operativos (si aún no tiene)
CREATE OR REPLACE FUNCTION orders_assign_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.invoice_number IS NULL AND NEW.estado IN ('procesando','enviado','entregado') THEN
    NEW.invoice_number := next_invoice_number(EXTRACT(YEAR FROM now())::int);
  END IF;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_orders_assign_invoice ON orders;
CREATE TRIGGER trg_orders_assign_invoice
BEFORE UPDATE OF estado ON orders
FOR EACH ROW
EXECUTE FUNCTION orders_assign_invoice_number();

CREATE OR REPLACE FUNCTION order_recalc_total()
RETURNS trigger AS $$
BEGIN
  UPDATE orders o SET total = (
    SELECT COALESCE(sum(subtotal),0) FROM order_items WHERE order_id = o.id
  ), updated_at = now() WHERE o.id = NEW.order_id;
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_items_after_ins AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION order_recalc_total();

CREATE OR REPLACE FUNCTION prevent_delete_product_with_evals()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM evaluaciones WHERE producto_id = OLD.id) THEN
    RAISE EXCEPTION 'No se puede eliminar producto con evaluaciones';
  END IF;
  RETURN OLD;
END;$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_delete_product_with_evals BEFORE DELETE ON productos
FOR EACH ROW EXECUTE FUNCTION prevent_delete_product_with_evals();

-- =========================
-- AUDIT (generic helper)
-- =========================
CREATE OR REPLACE FUNCTION audit_generic()
RETURNS trigger AS $$
DECLARE
  act text;
BEGIN
  IF TG_OP = 'UPDATE' THEN act := 'UPDATE_'||upper(TG_TABLE_NAME); END IF;
  IF TG_OP = 'INSERT' THEN act := 'CREATE_'||upper(TG_TABLE_NAME); END IF;
  IF TG_OP = 'DELETE' THEN act := 'DELETE_'||upper(TG_TABLE_NAME); END IF;
  INSERT INTO audit_log(actor_id, action, entity, entity_id, old_values, new_values)
  VALUES (current_setting('request.jwt.claim.sub', true)::uuid, act, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), to_jsonb(OLD), to_jsonb(NEW));
  RETURN COALESCE(NEW, OLD);
END;$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_orders AFTER UPDATE OF estado ON orders
FOR EACH ROW EXECUTE FUNCTION audit_generic();
CREATE TRIGGER trg_audit_users AFTER UPDATE OF vendedor_estado, bloqueado ON users
FOR EACH ROW EXECUTE FUNCTION audit_generic();
CREATE TRIGGER trg_audit_productos AFTER UPDATE OF estado ON productos
FOR EACH ROW EXECUTE FUNCTION audit_generic();

-- =========================
-- RPC: crear_pedido(items jsonb)
-- items: [{"producto_id": "uuid", "cantidad": n}]
-- =========================
CREATE OR REPLACE FUNCTION crear_pedido(items jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid := gen_random_uuid();
  v_user uuid := current_setting('request.jwt.claim.sub', true)::uuid;
  rec jsonb;
  prod_ids uuid[] := ARRAY(SELECT (value ->> 'producto_id')::uuid FROM jsonb_array_elements(items) value);
  sorted uuid[];
  v_producto RECORD;
BEGIN
  IF jsonb_array_length(items) = 0 THEN RAISE EXCEPTION 'Carrito vacío'; END IF;
  -- Ordenar para evitar deadlocks (lock en orden alfabético UUID)
  SELECT array_agg(p ORDER BY p)::uuid[] INTO sorted FROM unnest(prod_ids) p;

  -- Bloqueo y validación stock
  FOR v_producto IN SELECT * FROM productos WHERE id = ANY(sorted) FOR UPDATE LOOP
    NULL; -- locking pass
  END LOOP;

  INSERT INTO orders(id, comprador_id) VALUES (v_order_id, v_user);

  FOR rec IN SELECT * FROM jsonb_array_elements(items) LOOP
    INSERT INTO order_items(
      order_id, producto_id, vendedor_id, cantidad, precio_unitario, subtotal,
      producto_nombre, producto_imagen_url
    )
    SELECT v_order_id, p.id, p.vendedor_id,
           (rec->>'cantidad')::int AS cantidad,
           p.precio,
           p.precio * (rec->>'cantidad')::int AS subtotal,
           p.nombre, p.imagen_url
    FROM productos p
    WHERE p.id = (rec->>'producto_id')::uuid
      AND p.estado = 'activo'
      AND p.stock >= (rec->>'cantidad')::int;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto % sin stock suficiente o inactivo', (rec->>'producto_id');
    END IF;

    UPDATE productos SET stock = stock - (rec->>'cantidad')::int WHERE id = (rec->>'producto_id')::uuid;
  END LOOP;

  -- Recalcular total (trigger ya lo hace, redundancia defensiva)
  UPDATE orders SET total = (SELECT COALESCE(sum(subtotal),0) FROM order_items WHERE order_id = v_order_id) WHERE id = v_order_id;

  INSERT INTO audit_log(actor_id, action, entity, entity_id, new_values)
  VALUES (v_user, 'CREATE_PEDIDO', 'orders', v_order_id, jsonb_build_object('order_id', v_order_id));

  RETURN v_order_id;
END;$$;

-- =========================
-- RPC: guardar_envio (datos de envío por pedido)
-- =========================
CREATE OR REPLACE FUNCTION guardar_envio(
  p_order_id uuid,
  p_nombre text,
  p_direccion text,
  p_ciudad text,
  p_telefono text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user uuid := current_setting('request.jwt.claim.sub', true)::uuid;
  v_comprador uuid;
BEGIN
  SELECT comprador_id INTO v_comprador FROM orders WHERE id = p_order_id;
  IF v_comprador IS NULL THEN
    RAISE EXCEPTION 'Pedido no existe';
  END IF;
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  -- Permitir solo al comprador dueño del pedido o admin por rol en JWT app_metadata
  IF v_comprador <> v_user AND coalesce((auth.jwt() -> 'app_metadata' ->> 'role')::text, '') <> 'admin' THEN
    RAISE EXCEPTION 'No autorizado para guardar envío';
  END IF;

  INSERT INTO order_shipping(order_id, nombre, direccion, ciudad, telefono)
  VALUES (p_order_id, p_nombre, p_direccion, p_ciudad, p_telefono)
  ON CONFLICT (order_id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    direccion = EXCLUDED.direccion,
    ciudad = EXCLUDED.ciudad,
    telefono = EXCLUDED.telefono,
    updated_at = now();
  RETURN true;
END;$$;

-- =========================
-- RPCs: KPIs y Top Productos
-- =========================
-- KPIs por periodo global (admin dashboard)
CREATE OR REPLACE FUNCTION kpi_periodo(
  inicio timestamptz,
  fin timestamptz
)
RETURNS TABLE(total_ventas numeric, pedidos integer, ticket_promedio numeric)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(sum(o.total),0)::numeric AS total_ventas,
    COALESCE(count(o.id),0)::int AS pedidos,
    CASE WHEN count(o.id) > 0 THEN (sum(o.total)/count(o.id)) ELSE 0 END::numeric AS ticket_promedio
  FROM orders o
  WHERE o.created_at >= inicio AND o.created_at < fin
    AND o.estado IN ('procesando','enviado','entregado');
END;$$;

-- Top productos por ventas en periodo (admin dashboard)
CREATE OR REPLACE FUNCTION top_productos_periodo(
  inicio timestamptz,
  fin timestamptz,
  limite integer DEFAULT 10,
  desplazamiento integer DEFAULT 0
)
RETURNS TABLE(producto_id uuid, total_vendido numeric)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT oi.producto_id,
         COALESCE(sum(oi.subtotal),0)::numeric AS total_vendido
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.created_at >= inicio AND o.created_at < fin
    AND o.estado IN ('procesando','enviado','entregado')
  GROUP BY oi.producto_id
  ORDER BY total_vendido DESC
  LIMIT limite OFFSET desplazamiento;
END;$$;

-- KPIs del vendedor (usando auth.uid())
CREATE OR REPLACE FUNCTION kpi_mes_vendedor(inicio timestamptz)
RETURNS TABLE(total_ventas numeric, pedidos integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_vendedor uuid := current_setting('request.jwt.claim.sub', true)::uuid;
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(sum(oi.subtotal),0)::numeric AS total_ventas,
    COALESCE(count(DISTINCT oi.order_id),0)::int AS pedidos
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE oi.vendedor_id = v_vendedor
    AND o.created_at >= inicio
    AND o.estado IN ('procesando','enviado','entregado');
END;$$;

-- =========================
-- RPC: pedido_cambiar_estado
-- =========================
CREATE OR REPLACE FUNCTION pedido_cambiar_estado(p_order_id uuid, nuevo_estado pedido_estado)
RETURNS pedido_estado
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actual pedido_estado;
  v_user uuid := current_setting('request.jwt.claim.sub', true)::uuid;
  v_comprador uuid;
BEGIN
  SELECT estado, comprador_id INTO v_actual, v_comprador FROM orders WHERE id = p_order_id;
  IF v_actual IS NULL THEN RAISE EXCEPTION 'Pedido no existe'; END IF;

  -- Transiciones válidas
  IF v_actual = 'pendiente' AND nuevo_estado = 'procesando' THEN
    NULL; -- OK
  ELSIF v_actual = 'pendiente' AND nuevo_estado = 'cancelado' THEN
    IF v_comprador <> v_user THEN RAISE EXCEPTION 'Solo comprador puede cancelar'; END IF;
  ELSIF v_actual = 'procesando' AND nuevo_estado = 'enviado' THEN
    -- validar todos ítems enviados
    IF EXISTS (SELECT 1 FROM order_items WHERE order_id = p_order_id AND enviado = false) THEN
      RAISE EXCEPTION 'No todos los ítems enviados';
    END IF;
  ELSIF v_actual = 'enviado' AND nuevo_estado = 'entregado' THEN
    IF v_comprador <> v_user THEN RAISE EXCEPTION 'Solo comprador confirma entrega'; END IF;
  ELSE
    RAISE EXCEPTION 'Transición inválida % -> %', v_actual, nuevo_estado;
  END IF;

  UPDATE orders SET estado = nuevo_estado WHERE id = p_order_id;
  RETURN nuevo_estado;
END;$$;

-- =========================
-- RPC: marcar_item_enviado
-- =========================
CREATE OR REPLACE FUNCTION marcar_item_enviado(p_order_item_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_vendedor uuid := current_setting('request.jwt.claim.sub', true)::uuid;
  v_order uuid;
BEGIN
  UPDATE order_items SET enviado = true
  WHERE id = p_order_item_id AND vendedor_id = v_vendedor AND enviado = false;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ítem no encontrado o ya enviado'; END IF;
  SELECT order_id INTO v_order FROM order_items WHERE id = p_order_item_id;
  -- Si todos enviados y estado procesando -> enviar
  IF NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = v_order AND enviado = false) THEN
    UPDATE orders SET estado = 'enviado' WHERE id = v_order AND estado = 'procesando';
  END IF;
  RETURN true;
END;$$;

-- =========================
-- RLS ENABLE
-- =========================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY; -- opcional (solo admin lectura)
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- =========================
-- POLICIES (Ejemplos clave; completar con DENY ALL implícito)
-- =========================
-- USERS
CREATE POLICY users_self_select ON users FOR SELECT USING (
  id = (select auth.uid()) OR ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
);
CREATE POLICY users_self_update ON users FOR UPDATE USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);
CREATE POLICY users_admin_update ON users FOR UPDATE USING ((auth.jwt() -> 'app_metadata' ->> 'role')='admin');

-- CATEGORIAS
CREATE POLICY categorias_public_select ON categorias FOR SELECT USING (true);
CREATE POLICY categorias_admin_all ON categorias FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role')='admin');

-- PRODUCTOS
CREATE POLICY productos_public_select ON productos FOR SELECT USING (estado='activo' AND archivado = false);
CREATE POLICY productos_owner_select ON productos FOR SELECT USING (vendedor_id = (select auth.uid()));
CREATE POLICY productos_admin_select ON productos FOR SELECT USING ((auth.jwt() -> 'app_metadata' ->> 'role')='admin');
CREATE POLICY productos_insert_vendedor ON productos FOR INSERT WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role')='vendedor' AND
  (SELECT vendedor_estado FROM users WHERE id = (select auth.uid()))='aprobado'
);
CREATE POLICY productos_update_owner ON productos FOR UPDATE USING (vendedor_id = (select auth.uid()));
CREATE POLICY productos_update_admin ON productos FOR UPDATE USING ((auth.jwt() -> 'app_metadata' ->> 'role')='admin');

-- ORDERS
CREATE POLICY orders_select_owner ON orders FOR SELECT USING (comprador_id = (select auth.uid()));
CREATE POLICY orders_select_admin ON orders FOR SELECT USING ((auth.jwt() -> 'app_metadata' ->> 'role')='admin');
CREATE POLICY orders_insert_comprador ON orders FOR INSERT WITH CHECK (comprador_id = auth.uid()); -- aunque normalmente vía RPC

-- ORDER_ITEMS
CREATE POLICY order_items_select_comprador ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.comprador_id = (select auth.uid()))
);
CREATE POLICY order_items_select_vendedor ON order_items FOR SELECT USING (vendedor_id = (select auth.uid()));
CREATE POLICY order_items_select_admin ON order_items FOR SELECT USING ((auth.jwt() -> 'app_metadata' ->> 'role')='admin');

-- EVALUACIONES
CREATE POLICY evaluaciones_public_select ON evaluaciones FOR SELECT USING (true);
-- Solo comprador dueño del pedido y si el pedido está enviado/entregado y una sola vez por item
DROP POLICY IF EXISTS evaluaciones_insert_comprador ON evaluaciones;
CREATE POLICY evaluaciones_insert_comprador ON evaluaciones
FOR INSERT TO authenticated
WITH CHECK (
  comprador_id = (select auth.uid()) AND
  EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.id = evaluaciones.order_item_id
      AND o.comprador_id = (select auth.uid())
      AND o.estado IN ('enviado','entregado')
  )
);

-- AUDIT_LOG (solo admin lectura)
CREATE POLICY audit_log_select_admin ON audit_log FOR SELECT USING ((auth.jwt() -> 'app_metadata' ->> 'role')='admin');

-- APP_CONFIG (admin puede leer y escribir)
DROP POLICY IF EXISTS app_config_admin_all ON app_config;
CREATE POLICY app_config_admin_all ON app_config
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role')='admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role')='admin');

-- NOTE: Añadir REVOKE ALL en caso de roles personalizados fuera de anon/authenticated.

-- =========================
-- MATERIALIZED VIEW (ejemplo calificaciones)
-- =========================
CREATE MATERIALIZED VIEW mv_promedio_calificaciones AS
  SELECT producto_id, avg(puntuacion)::numeric(4,2) promedio, count(*) total
  FROM evaluaciones
  GROUP BY producto_id;

-- REFRESH comando (externo / cron):
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_promedio_calificaciones;

-- =========================
-- FIN
-- =========================

-- =========================
-- STORAGE: product-images bucket + políticas
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'product-images') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('product-images','product-images', true);
  END IF;
END $$;

-- Lectura pública (MVP). Evaluar migrar a signed URLs en producción.
CREATE POLICY IF NOT EXISTS "product-images public read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'product-images');

-- Subidas sólo autenticados a carpeta <uid>/
CREATE POLICY IF NOT EXISTS "product-images user folder insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Update/Delete sólo dueño del objeto dentro del bucket
CREATE POLICY IF NOT EXISTS "product-images owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images' AND owner = (select auth.uid()::text)
  ) WITH CHECK (
    bucket_id = 'product-images'
  );

CREATE POLICY IF NOT EXISTS "product-images owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images' AND owner = (select auth.uid()::text)
  );
