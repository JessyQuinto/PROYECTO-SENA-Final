# 🌿 Tesoros Chocó – Marketplace de Artesanías (Proyecto SENA)

<div align="center">
	<img src="Frontend/public/logo.svg" alt="Logo" width="120" />
	<h3>Plataforma para conectar artesanos del Chocó con el mundo 🌍</h3>
	<p>Comercio justo · Identidad cultural · Tecnología abierta</p>

	<a href="https://ambitious-ground-03b86cf10.2.azurestaticapps.net"><img alt="Visitar Marketplace" src="https://img.shields.io/badge/Visitar-Marketplace-1e90ff?logo=azure-static-web-apps&logoColor=white" /></a>
	<a href="https://www.postman.com/bold-zodiac-382577/proyecto-sena/collection/oq8k6ot/proyecto-sena-api?action=share&creator=13226867"><img alt="Postman" src="https://img.shields.io/badge/API%20Interactiva-Postman-FF6C37?logo=postman&logoColor=white" /></a>
	<img alt="Estado" src="https://img.shields.io/badge/API-Health_OK-success" />
	<a href="./LICENSE"><img alt="Licencia" src="https://img.shields.io/badge/Licencia-Educativa-lightgray" /></a>
</div>

---

## 🧭 Tabla de Contenidos
<details open>
<summary>Ver secciones</summary>

1. [Visión General](#-visión-general)
2. [Características Clave](#-características-clave)
3. [Stack Tecnológico](#-stack-tecnológico)
4. [Demo y API Rápida](#-demo-y-api-rápida)
5. [Arquitectura](#-arquitectura)
6. [Guía de Instalación](#-guía-de-instalación)
7. [Variables de Entorno](#-variables-de-entorno)
8. [Roles y Permisos](#-roles-y-permisos)
9. [Testing](#-testing)
10. [Documentación](#-documentación)
11. [Contribuir](#-contribuir)
12. [Roadmap](#-roadmap)
13. [Licencia](#-licencia)
14. [Soporte](#-soporte)
</details>

---

## 📋 Visión General
**Tesoros Chocó** es un marketplace que impulsa la comercialización de artesanías tradicionales del Chocó (Colombia), facilitando el acceso a compradores nacionales e internacionales y preservando el patrimonio cultural.

Beneficios clave:
- Fomenta ingresos sostenibles para artesanos locales
- Difunde técnicas ancestrales y materiales nativos
- Simplifica la venta digital con herramientas modernas
- Reduce barreras geográficas y tecnológicas

## ✨ Características Clave
| Categoría | Funcionalidades | Estado |
|-----------|-----------------|--------|
| Autenticación | Registro / Login / Roles | ✅ |
| Gestión Productos | Crear, listar, detalles, imágenes | ✅ |
| Roles | Admin · Vendedor · Comprador | ✅ |
| Seguridad | JWT, CORS configurado, control acceso | ✅ |
| Storage | Imágenes en Supabase Storage | ✅ |
| Emails | Notificaciones (pedidos / estado vendedor) | 🔄 Parcial |
| Optimización | Caché selectiva (por implementar) | 🧪 Planificado |

## 🛠 Stack Tecnológico
| Capa | Tecnología | Notas |
|------|-----------|-------|
| Frontend | React + TypeScript + Vite + TailwindCSS | SPA rápida y modular |
| Backend | Express + TypeScript | API REST limpia |
| BBDD | PostgreSQL (Supabase) | Relacional + Auth + Storage |
| Auth | Supabase + JWT Roles | Seguridad basada en claims |
| Infra | Azure Static Web Apps | Deploy continuo |
| Testing | Vitest / (Pendiente backend) | Cobertura frontend |

## 🔥 Demo y API Rápida
**Frontend Producción:** https://ambitious-ground-03b86cf10.2.azurestaticapps.net  
**Colección Postman:** https://www.postman.com/bold-zodiac-382577/proyecto-sena/collection/oq8k6ot/proyecto-sena-api?action=share&creator=13226867

Prueba instantánea (Health):
```bash
curl -s https://ambitious-ground-03b86cf10.2.azurestaticapps.net/api/health
```
Endpoints iniciales:
```text
GET  /products          # Productos públicos
GET  /products/:id      # Detalle
POST /auth/login        # Login
POST /vendors/register  # Registro de vendedor
```

> La colección Postman incluye variables y bodies listos.

## 🧱 Arquitectura
Simplificada (cliente ←→ API ←→ Supabase):
```
React (Vite) --fetch--> Express API --SQL--> Supabase (PostgreSQL)
													 |-- Storage (imágenes)
													 |-- Auth (roles)
```
Detalles ampliados en `Docs/ARQUITECTURA.md`.

## ⚙️ Guía de Instalación
```bash
# 1. Clonar
git clone <url-del-repositorio>
cd PROYECTO-SENA-main-main

# 2. Instalar (workspace completo)
bun install   # o npm install

# 3. Frontend env
cd Frontend && cp env.example .env.local && cd ..

# 4. Backend env
cd Backend && cp .env.example .env && cd ..

# 5. Ejecutar
cd Backend && bun run dev & cd ../Frontend && bun run dev
```
Frontend: http://localhost:3000  |  Backend: http://localhost:3001

## 🔐 Variables de Entorno
| Área | Variable | Descripción |
|------|----------|-------------|
| Frontend | VITE_SUPABASE_URL | URL del proyecto Supabase |
| Frontend | VITE_SUPABASE_ANON_KEY | Clave pública anon |
| Frontend | VITE_BACKEND_URL | URL del backend local/prod |
| Backend | SUPABASE_URL | URL Supabase |
| Backend | SUPABASE_SERVICE_ROLE_KEY | Clave service role (no exponer) |
| Backend | FRONTEND_ORIGINS | Orígenes permitidos CORS |

## 🧾 Roles y Permisos
| Acción | Admin | Vendedor | Comprador |
|--------|-------|----------|-----------|
| Crear producto | ✅ | ✅ | ❌ |
| Editar producto propio | ✅ | ✅ | ❌ |
| Ver catálogo | ✅ | ✅ | ✅ |
| Aprobar vendedores | ✅ | ❌ | ❌ |
| Comprar | ✅ | ✅ | ✅ |

## 🧪 Testing
Frontend:
```bash
cd Frontend
bun run test
bun run test:coverage
```
Backend (placeholder si se añaden tests):
```bash
cd Backend
bun run test
```

## 📚 Documentación
| Tema | Archivo |
|------|---------|
| Arquitectura | Docs/ARQUITECTURA.md |
| Diseño Sistema | Docs/DISEÑO_SISTEMA.md |
| Frontend | Docs/FRONTEND.md |
| Backend | Docs/BACKEND.md |
| API | Docs/API.md |
| Deploy | Docs/DEPLOYMENT.md |
| Seguridad | Docs/SECURITY.md |
| Supabase | Docs/SUPABASE.md |
| Testing | Docs/TESTING.md |

## 🤝 Contribuir
1. Crear rama: `feat/nombre-feature`  
2. Añadir tests o actualizar existentes  
3. Ejecutar linters y pruebas  
4. PR con descripción y screenshots (si UI)  

Checklist PR:
- [ ] Tests verdes
- [ ] README o Docs actualizados (si aplica)
- [ ] No credenciales expuestas

## 🗺 Roadmap
| Fase | Elemento | Estado |
|------|----------|--------|
| 1 | CRUD Productos Básico | ✅ |
| 1 | Autenticación Roles | ✅ |
| 2 | Emails transaccionales completos | 🔄 |
| 2 | Mejora caché y rendimiento | 🧪 |
| 3 | Panel analytics básico | ⏳ |
| 3 | Internacionalización (i18n) | ⏳ |
| 4 | Pasarela de pagos | ⏳ |

## 📄 Licencia
Proyecto educativo del SENA bajo [Licencia Educativa](./LICENSE). Para usos comerciales: contactar institucionalmente.

## 🆘 Soporte
Abrir issue o contactar al equipo académico SENA.

---
<div align="center"><strong>Desarrollado con ❤️ para preservar y promover las artesanías del Chocó</strong></div>
