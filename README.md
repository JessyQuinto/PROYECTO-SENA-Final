# Tesoros Chocó - Marketplace de Artesanías

## 📋 Descripción General

**Tesoros Chocó** es una plataforma de comercio electrónico diseñada para conectar artesanos del departamento del Chocó, Colombia, con compradores que valoran productos únicos y auténticos hechos a mano. La plataforma facilita la comercialización de artesanías tradicionales, promoviendo la economía local y preservando las técnicas ancestrales de la región.

## 🎯 Objetivos del Proyecto

- **Digitalización del Comercio Artesanal**: Llevar las artesanías del Chocó al comercio digital
- **Empoderamiento Económico**: Generar ingresos sostenibles para los artesanos locales
- **Preservación Cultural**: Mantener vivas las técnicas y tradiciones artesanales
- **Conectividad Regional**: Eliminar barreras geográficas para la comercialización
- **Educación del Consumidor**: Informar sobre el origen, materiales y técnicas de cada pieza

## 🏗️ Arquitectura del Sistema

El proyecto está estructurado como una aplicación web moderna con arquitectura cliente-servidor:

- **Frontend**: Aplicación React con TypeScript, Vite y Tailwind CSS
- **Backend**: API REST con Express.js y TypeScript
- **Base de Datos**: PostgreSQL gestionado por Supabase
- **Autenticación**: Sistema de roles con JWT (admin, vendedor, comprador)
- **Almacenamiento**: Supabase Storage para imágenes de productos

## 🚀 Instalación Rápida

### Prerrequisitos

- Node.js >= 20.0.0
- Bun (recomendado) o npm
- Cuenta de Supabase

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd PROYECTO-SENA-main-main
```

### 2. Instalar Dependencias

```bash
# Instalar dependencias del workspace
bun install

# O con npm
npm install
```

### 3. Configurar Variables de Entorno

#### Frontend (.env.local)
```bash
cd Frontend
cp env.example .env.local
```

Editar `.env.local`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_BACKEND_URL=http://localhost:3001
```

#### Backend (.env)
```bash
cd Backend
cp .env.example .env
```

Editar `.env`:
```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
FRONTEND_ORIGINS=http://localhost:3000
```

### 4. Ejecutar en Desarrollo

#### Terminal 1 - Backend
```bash
cd Backend
bun run dev
# El backend estará en http://localhost:3001
```

#### Terminal 2 - Frontend
```bash
cd Frontend
bun run dev
# El frontend estará en http://localhost:3000
```

### 5. Acceder a la Aplicación

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Supabase Dashboard**: https://app.supabase.com

## 🧪 Testing

```bash
# Frontend
cd Frontend
bun run test
bun run test:coverage

# Backend
cd Backend
bun run test
```

## 📚 Documentación Adicional

- [Arquitectura del Sistema](Docs/ARQUITECTURA.md)
- [Diseño del Sistema](Docs/DISEÑO_SISTEMA.md)
- [Documentación Frontend](Docs/FRONTEND.md)
- [Documentación Backend](Docs/BACKEND.md)
- [API Reference](Docs/API.md)
- [Guía de Despliegue](Docs/DEPLOYMENT.md)
- [Seguridad y Buenas Prácticas](Docs/SECURITY.md)
- [Configuración de Supabase](Docs/SUPABASE.md)
- [Guía de Testing](Docs/TESTING.md)


## 🤝 Contribución

Este es un proyecto educativo del SENA. Para contribuir:

1. Crear una rama para tu feature
2. Implementar cambios siguiendo las convenciones del proyecto
3. Ejecutar tests antes de hacer commit
4. Crear un Pull Request con descripción clara

## 📄 Licencia

Proyecto educativo del SENA - Todos los derechos reservados.

## 🆘 Soporte

Para soporte técnico o preguntas sobre el proyecto, contactar al equipo de desarrollo del SENA.

---

**Desarrollado con ❤️ para preservar y promover las artesanías del Chocó**
