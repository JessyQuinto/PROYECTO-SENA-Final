# AUDIT_RETENTION.md (v1.1.0)
Cross-links: `SECURITY.md`, `modelado_datos.md`.
Versión: 1.0.0 | Última actualización: 2025-08-08

## Tabla: audit_log

| Campo | Descripción |
|-------|-------------|
| id | PK |
| actor_id | Usuario que ejecuta |
| action | Código acción (ENUM / texto controlado) |
| entity | Nombre tabla |
| entity_id | UUID entidad |
| old_values | jsonb previo |
| new_values | jsonb nuevo |
| created_at | timestamptz |

## Retención
- Mantener 365 días
- Job mensual: `DELETE FROM audit_log WHERE created_at < now() - interval '365 days';`

## Acciones (catálogo mínimo)
- UPDATE_PEDIDO_ESTADO
- UPDATE_VENDEDOR_ESTADO
- UPDATE_PRODUCTO_ESTADO
- CREATE_PEDIDO
- CREATE_PRODUCTO

Expandir según necesidad.
