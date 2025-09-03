# 🌿 Tesoros Chocó – Marketplace de Artesanías (Proyecto SENA)

<div align="center">
  <img src="Frontend/public/logo.svg" alt="Logo Tesoros Chocó" width="140" />
  <h2>Conectando artesanos del Chocó con el mundo 🌍</h2>
  <p><em>Comercio justo · Identidad cultural · Tecnología abierta</em></p>

  <p>
    <a href="https://ambitious-ground-03b86cf10.2.azurestaticapps.net">
      <img alt="Visitar Marketplace" src="https://img.shields.io/badge/Visitar-Marketplace-1e90ff?logo=azure-static-web-apps&logoColor=white&style=for-the-badge" />
    </a>
    <a href="https://www.postman.com/bold-zodiac-382577/proyecto-sena/collection/oq8k6ot/proyecto-sena-api?action=share&creator=13226867">
      <img alt="Postman" src="https://img.shields.io/badge/API%20Interactiva-Postman-FF6C37?logo=postman&logoColor=white&style=for-the-badge" />
    </a>
    <a href="./LICENSE">
      <img alt="Licencia" src="https://img.shields.io/badge/Licencia-Educativa-lightgray?style=for-the-badge" />
    </a>
  </p>
</div>

---

## 🧭 Tabla de Contenidos

<details open>
<summary>Ver secciones</summary>

* [Visión General](#visión-general)
* [Características](#características)
* [Stack Tecnológico](#stack-tecnológico)
* [Demo & API](#demo--api)
* [Arquitectura](#arquitectura)
* [Instalación](#instalación)
* [Variables de Entorno](#variables-de-entorno)
* [Roles y Permisos](#roles-y-permisos)
* [Testing](#testing)
* [Documentación](#documentación)
* [Contribuir](#contribuir)
* [Roadmap](#roadmap)
* [Licencia](#licencia)
* [Soporte](#soporte)

</details>

---

## 📋 Visión General

**Tesoros Chocó** es un marketplace que impulsa la comercialización de artesanías tradicionales del Chocó (Colombia).

🎯 **Objetivos principales**:

* Aumentar ingresos de los artesanos locales
* Difundir técnicas ancestrales y materiales nativos
* Simplificar ventas digitales con herramientas modernas
* Romper barreras geográficas y tecnológicas

---

## ✨ Características

<div align="center">

| 💡 Área          | 🚀 Funcionalidades            | 📌 Estado      |
| ---------------- | ----------------------------- | -------------- |
| **Auth**         | Registro, Login, Roles        | ✅              |
| **Productos**    | CRUD + imágenes               | ✅              |
| **Roles**        | Admin · Vendedor · Comprador  | ✅              |
| **Seguridad**    | JWT · CORS configurado        | ✅              |
| **Storage**      | Supabase Storage              | ✅              |
| **Emails**       | Notificaciones pedidos/estado | 🔄 Parcial     |
| **Optimización** | Caché selectiva               | 🧪 Planificado |

</div>

---

## 🛠 Stack Tecnológico

<div align="center">

| Capa         | Tecnología                                                                                                                                                                                                                                                   | Notas                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| **Frontend** | ![React](https://img.shields.io/badge/React-20232A?logo=react\&logoColor=61DAFB) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite\&logoColor=white) ![Tailwind](https://img.shields.io/badge/TailwindCSS-38B2AC?logo=tailwindcss\&logoColor=white) | SPA modular                 |
| **Backend**  | ![Express](https://img.shields.io/badge/Express.js-000000?logo=express\&logoColor=white) + TypeScript                                                                                                                                                        | API REST                    |
| **DB/Auth**  | ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase\&logoColor=white)                                                                                                                                                                     | PostgreSQL + Auth + Storage |
| **Infra**    | ![Azure](https://img.shields.io/badge/Azure%20Static%20Web%20Apps-0089D6?logo=microsoft-azure\&logoColor=white)                                                                                                                                              | Deploy continuo             |
| **Testing**  | Vitest                                                                                                                                                                                                                                                       | Backend pendiente           |

</div>

---

## 🔥 Demo & API

* 🌐 **Producción:** [Marketplace](https://ambitious-ground-03b86cf10.2.azurestaticapps.net)
* 🧪 **Colección Postman:** [API interactiva](https://www.postman.com/bold-zodiac-382577/proyecto-sena/collection/oq8k6ot/proyecto-sena-api?action=share&creator=13226867)

Test rápido:

```bash
curl -s https://ambitious-ground-03b86cf10.2.azurestaticapps.net/api/health
```

Endpoints básicos:

```http
GET  /products
GET  /products/:id
POST /auth/login
POST /vendors/register
```

---

## 🧱 Arquitectura

```
 React (Vite)  --->  Express API  --->  Supabase (PostgreSQL)
                           |---- Storage (imágenes)
                           |---- Auth (roles y permisos)
```

📄 Detalles: [`Docs/ARQUITECTURA.md`](Docs/ARQUITECTURA.md)

---

git clone <url>
## ⚙️ Instalación

```bash
# 1. Clonar
git clone <url-del-repositorio>
cd PROYECTO-SENA-main-main   # Ajusta si el nombre del folder difiere

# 2. Instalar dependencias (workspace)
bun install   # o: npm install

# 3. Variables de entorno
cp Frontend/.env.example Frontend/.env.local
cp Backend/.env.example Backend/.env
```

Inicia servicios (usar dos terminales):

Terminal 1 (Backend):
```bash
cd Backend
bun run dev
```

Terminal 2 (Frontend):
```bash
cd Frontend
bun run dev
```

PowerShell (opcional con Start-Job):
```powershell
Start-Job { cd Backend; bun run dev }
Start-Job { cd Frontend; bun run dev }
```

🌍 Frontend: http://localhost:3000  
🔌 Backend:  http://localhost:3001

---

## 🔐 Variables de Entorno

| Área | Variable                    | Descripción                  |
| ---- | --------------------------- | ---------------------------- |
| FE   | `VITE_SUPABASE_URL`         | URL Supabase                 |
| FE   | `VITE_SUPABASE_ANON_KEY`    | Clave pública anon           |
| FE   | `VITE_BACKEND_URL`          | URL backend                  |
| BE   | `SUPABASE_URL`              | URL Supabase                 |
| BE   | `SUPABASE_SERVICE_ROLE_KEY` | Clave service role (privada, NO subir a git) |
| BE   | `FRONTEND_ORIGINS`          | Orígenes CORS                |

---

## 🧾 Roles y Permisos

| Acción             | Admin | Vendedor | Comprador |
| ------------------ | ----- | -------- | --------- |
| Crear producto     | ✅     | ✅        | ❌         |
| Editar propio      | ✅     | ✅        | ❌         |
| Ver catálogo       | ✅     | ✅        | ✅         |
| Aprobar vendedores | ✅     | ❌        | ❌         |
| Comprar            | ✅     | ✅        | ✅         |

---

## 🧪 Testing

Frontend:

```bash
cd Frontend
bun run test
bun run test:coverage
```

Backend (en construcción — si no existen tests este comando puede fallar):

```bash
cd Backend
bun run test
```

---

## 📚 Documentación

📌 Disponible en la carpeta `Docs/`:

* [ARQUITECTURA](Docs/ARQUITECTURA.md)
* [DISEÑO DEL SISTEMA](Docs/DISEÑO_SISTEMA.md)
* [FRONTEND](Docs/FRONTEND.md)
* [BACKEND](Docs/BACKEND.md)
* [API](Docs/API.md)
* [DEPLOYMENT](Docs/DEPLOYMENT.md)
* [SECURITY](Docs/SECURITY.md)
* [SUPABASE](Docs/SUPABASE.md)
* [TESTING](Docs/TESTING.md)

---

## 🤝 Contribuir

1. Crear rama: `feat/nombre-feature`
2. Añadir/actualizar tests
3. Ejecutar linters y pruebas
4. Crear PR con descripción + screenshots (si UI)

✅ Checklist PR:

* [ ] Tests verdes
* [ ] Docs/README actualizados
* [ ] Sin credenciales expuestas

---

## 🗺 Roadmap

| Fase | Elemento               | Estado |
| ---- | ---------------------- | ------ |
| 1    | CRUD Productos Básico  | ✅      |
| 1    | Autenticación Roles    | ✅      |
| 2    | Emails transaccionales | 🔄     |
| 2    | Optimización caché     | 🧪     |
| 3    | Panel analytics        | ⏳      |
| 3    | Internacionalización   | ⏳      |
| 4    | Pasarela de pagos      | ⏳      |

---

## 📄 Licencia

Proyecto educativo del SENA bajo [Licencia Educativa](./LICENSE). (Licencia personalizada; revisar antes de reutilizar código en contextos comerciales.)

> Para usos comerciales: contactar institucionalmente.

---

## 🆘 Soporte

📩 Abrir issue o contactar al equipo académico SENA.

---
### ✅ Notas de Revisión / Calidad
- Anchors de la tabla de contenidos corregidos (sin guion extra).
- Instalación separada por terminales para mayor claridad (Windows / Unix friendly).
- Advertencia añadida sobre `SUPABASE_SERVICE_ROLE_KEY`.
- Ajustado alt del logo para accesibilidad.
- Placeholder de tests backend clarificado.

---

<div align="center">

💛 **Desarrollado para preservar y promover las artesanías del Chocó**

</div>

---
