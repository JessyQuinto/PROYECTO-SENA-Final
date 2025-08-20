# 🔐 rls_policies.md (v1.1.0)
Cross-links: `modelado_datos.md`, `diseño_sistema.md`, `SECURITY.md`, `TEST_STRATEGY.md`.
Versión: 1.1.0 | Última actualización: 2025-08-08

Complementa: [Modelo de Datos](modelado_datos.md) · [Seguridad](SECURITY.md) · [Transiciones](TRANSITIONS.md)

Resumen de políticas RLS (versión abreviada).

## Principios
- Mínimo privilegio.
- Productos activos visibles públicamente.
- Operaciones sensibles restringidas por rol y propiedad.

## Contexto
- auth.uid() → id usuario
- (auth.jwt() ->> 'role') → rol

## productos
- SELECT público: estado = 'activo'.
- SELECT dueño/admin: vendedor_id = uid OR role=admin.
- INSERT: role=vendedor AND vendedor_estado='aprobado'.
- UPDATE: dueño (excluyendo cambios de estado a 'bloqueado') o admin.
- DELETE: sólo admin Y no existan order_items NI evaluaciones (enforzado también por trigger preventivo).

## orders
- SELECT: comprador_id = uid OR role=admin.
- INSERT: role=comprador.
- UPDATE estado: prohibido directo; usar RPC `pedido_cambiar_estado` (se ejecuta con SECURITY DEFINER y valida transición).

## order_items
- SELECT: comprador dueño del order OR vendedor_id = uid OR role=admin.
- UPDATE: sólo vía RPC controlada (marcar enviado). No UPDATE directo.

## evaluaciones
- SELECT: público (decisión MVP; posible restricción a productos activos más adelante).
- INSERT: role=comprador AND pedido estado IN (enviado, entregado) AND no exista evaluación previa.
	(Validación adicional: puntuación 1..5 CHECK nivel tabla.)

## categorias
- SELECT: público.
- ALL: sólo admin.

## users
- SELECT: id = uid OR role=admin.
- UPDATE: usuario sólo puede actualizar campos propios no sensibles (nombre). Cambios `vendedor_estado`, `bloqueado`, `role` sólo admin (policy separada + trigger audit).

## Storage (bucket product-images)
- SELECT: público sólo si producto activo (enforce vía path convención + signed URL opcional). Alternativa simple MVP: público read; evaluar restricción futura.
- INSERT/UPDATE/DELETE: role=vendedor AND vendedor_estado='aprobado' limitando a su carpeta `<uid>/`.

## Vista vw_pedidos_vendedor
Se expone SELECT restringido a vendedor_id = uid OR role=admin.

## Transiciones Pedido (FSM)
Permitidas:
- pendiente → procesando
- procesando → enviado (cuando todos items enviados)
- enviado → entregado (sólo comprador)
- pendiente → cancelado (comprador antes de procesar)
Bloqueado cualquier otro salto. Lógica en RPC + validación extra (raise exception si inválido).

## Checklist (Verificación Pre-Release)
- [ ] RLS activado todas las tablas + Storage.
- [ ] Policies revisadas para least privilege.
- [ ] Tests negación acceso cruzado.
- [ ] Auditoría operativa en `audit_log` confirmada.
- [ ] Revisión periódica de políticas (cada release).
