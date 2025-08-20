# TEST_STRATEGY.md

## Niveles
1. Unitario (frontend hooks/utils, funciones SQL puras si aplica).
2. Integración (RPCs con Postgres local / Supabase test project).
3. End‑to‑End (flujos comprador: browse → add → checkout → calificar; flujos vendedor: publicar producto → recibir pedido → marcar enviado).
4. Seguridad (RLS: accesos denegados esperados; escalada de estados inválida rechazada).
5. Performance básico (tiempo RPC crear_pedido < 150ms p95 en dataset de prueba).

## Herramientas
- Frontend: Vitest + Testing Library.
- E2E: Playwright.
- DB: pgTap (opcional) o asserts en scripts SQL.

## Estrategia Datos de Prueba
- Semillas mínimas: 2 compradores, 2 vendedores (1 aprobado, 1 pendiente), 5 productos variados.
- Dataset extendido para stress: script generador (100 vendedores, 1000 productos, 300 pedidos).

## Casos Clave RPC crear_pedido
- Stock insuficiente → error controlado.
- Producto inactivo → rechazo.
- Precio cambiado entre carrito y checkout → usar precio vigente (verificado en snapshot).

## RLS Tests
- Usuario A no lee pedido de Usuario B.
- Vendedor solo ve ítems de sus productos.
- Cambio de estado fuera de FSM → falla.

## Auditoría
- Crear pedido genera entradas (INSERT order, INSERT items).
- Cambio estado registra old_state/new_state.

## Automatización
- Pipeline CI: lint → unit → integración DB → e2e (headless) → reporte cobertura.
- Umbral cobertura global inicial: 60%, crecer progresivo.

## Riesgos / Mitigación
- Flakiness e2e: usar IDs de test estables, aislar datos por test.
- Carrera en stock: test concurrente (2 transacciones). Esperar 1 success / 1 fail.

Actualizar a medida que se agregan módulos.
