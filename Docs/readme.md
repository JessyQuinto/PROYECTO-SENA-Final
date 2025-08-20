# 🛍️ Tesoros Chocó (v1.1.0)
Versión documentación base: 1.1.0 | Última actualización: 2025-08-08 | Ver ADRs en `Docs/adr/`.

**Tesoros Chocó** es un proyecto de desarrollo de software cuyo propósito es construir un **marketplace de productos artesanales** elaborados por campesinos del departamento del Chocó (Colombia), facilitando su comercialización a través de una plataforma digital accesible, segura y funcional.

---

## 🎯 Propósito del proyecto

Este sistema busca:

- **Impulsar la economía local campesina** del Chocó mediante la venta directa de productos artesanales.
- **Reducir barreras tecnológicas** para pequeños productores.
- **Ofrecer un canal digital** donde compradores puedan apoyar la producción local con trazabilidad y transparencia.
- **Desarrollar una plataforma realista y escalable**, como parte del proceso formativo del programa **Tecnólogo en Análisis y Desarrollo de Software del SENA**.

---

## 👥 Roles de usuarios

La aplicación está diseñada con 3 tipos de usuarios:

| Rol         | Funciones principales                                                  |
|-------------|------------------------------------------------------------------------|
| **Comprador**  | Navegar, buscar productos, realizar pedidos, calificar compras          |
| **Vendedor**   | Publicar productos, gestionar pedidos, consultar métricas               |
| **Administrador** | Aprobar vendedores, gestionar contenidos, monitorear actividad        |

---

## 🧱 Arquitectura tecnológica (consolidada)

| Dominio                | Tecnología / Servicio                        | Justificación |
|------------------------|----------------------------------------------|---------------|
| Frontend               | React + Vite (demo scaffold)                 | Rapidez DX |
| Backend (BaaS)         | Supabase (Auth + Postgres + REST + Storage)  | Unifica capa de datos |
| Backend App (opcional) | Express (gateway demo)                       | Orquestación futura |
| Base de datos          | Postgres (Supabase)                          | Evita duplicidades |
| Autenticación / Roles  | Supabase Auth (JWT + claim `role`)           | Integrado |
| Imágenes (MVP)         | Supabase Storage (`product-images`)          | Menos dependencias externas |
| Emails                 | Brevo (Edge Function segura)                 | Simplicidad |
| Pagos (MVP)            | Simulado                                    | Validar flujo negocio |
| Panel Admin            | React Admin                                  | CRUD rápido |

---

## 📦 Módulos del sistema

- Autenticación y autorización por rol (RLS + claims JWT)
- Catálogo de productos con imágenes (Storage + políticas + restricciones path)
- Gestión de vendedores (registro, aprobación, auditoría)
- Carrito de compras y pedidos (RPC transaccional `crear_pedido`)
- Sistema de calificaciones (una por order_item)
- Notificaciones por email (Edge Function multi‑vendedor)
- Panel de administración (vistas métricas / auditoría)
- Backend Express opcional para extensiones / webhooks
- Auditoría de cambios críticos (`audit_log`)

---

## 🎓 Contexto académico

Este proyecto forma parte del proceso formativo del programa:

- 🏫 **Tecnólogo en Análisis y Desarrollo de Software**  
- 🏢 **SENA - Servicio Nacional de Aprendizaje (Colombia)**  
- 🧑‍💻 Proyecto de tipo **semi-profesional**, enfocado en aplicabilidad real y buenas prácticas.

---

## 🗂️ Tabla de Contenidos Rápida
- Arquitectura: `Docs/arquitectura.md`
- Diseño detallado: `Docs/diseño_sistema.md`
- Modelo de datos: `Docs/modelado_datos.md`
- Políticas RLS: `Docs/rls_policies.md`
- Transiciones FSM: `Docs/TRANSITIONS.md`
- Seguridad: `Docs/SECURITY.md`
- Auditoría / Retención: `Docs/AUDIT_RETENTION.md`
- Bootstrap SQL: `Docs/sql_bootstrap.sql`
- Estrategia Tests: `Docs/TEST_STRATEGY.md`
- Convenciones Naming: `Docs/NAMING_CONVENTIONS.md`
- Glosario: `Docs/GLOSSARY.md`
- ADRs: `Docs/adr/`

## 🚀 Estado actual

- [x] Arquitectura alineada (Supabase única fuente de datos)
- [x] Reglas de negocio base
- [x] Diseño RLS + vistas métricas
- [x] Estrategia auditoría documentada
- [ ] Modelo normalizado aplicado (pendiente ejecutar SQL bootstrap)
- [ ] Políticas RLS creadas en proyecto
- [ ] CRUD productos + flujo auth
- [ ] Carrito y checkout transaccional (RPC)
- [ ] Evaluaciones condicionadas a estado
- [ ] Tests (RLS / integridad / UI)

---

## 🤝 Contribuciones

Prioridades:
1. Seguridad (no exponer `service_role`, RLS testeada)
2. Consistencia de stock y pedidos multi‑vendedor
3. Auditoría y métricas (materialized views)
4. Preparar capa de pagos real futura

Ver `Docs/SECURITY.md`, `Docs/TRANSITIONS.md`, `Docs/AUDIT_RETENTION.md` y `Docs/sql_bootstrap.sql`.

---

## 📄 Licencia

MIT - Uso educativo y social.
