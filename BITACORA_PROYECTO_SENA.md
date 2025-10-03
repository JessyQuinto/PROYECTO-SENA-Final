# BITÁCORA - PROYECTO SENA FINAL: TESOROS CHOCÓ

## 📘 Introducción

Este documento constituye una bitácora del proyecto **Tesoros Chocó**, desarrollado como proyecto final para el SENA. La bitácora registra los procesos documentales, avances y resultados preliminares del proyecto de desarrollo de software.

## 📋 Descripción General del Proyecto

**Tesoros Chocó** es una plataforma educativa desarrollada para el SENA con el fin de digitalizar y promover las artesanías tradicionales del departamento del Chocó, Colombia. Se trata de un marketplace que conecta artesanos (vendedores) con compradores interesados en adquirir productos artesanales únicos.

### Objetivos del Proyecto
- Preservar y promover las artesanías tradicionales del Chocó
- Crear una plataforma digital que conecte artesanos con compradores
- Facilitar el comercio electrónico para pequeños artesanos
- Implementar buenas prácticas de calidad de software

## 🔗 Enlaces Importantes del Proyecto

### URLs de Despliegue
- **Frontend (Azure Static Web Apps)**: https://ambitious-ground-03b86cf10.2.azurestaticapps.net
- **Backend (Azure App Service)**: https://marketplace-backend-prod.azurewebsites.net

### Documentación del Proyecto
- [Arquitectura del Sistema](Docs/ARQUITECTURA.md)
- [Diseño del Sistema](Docs/DISEÑO_SISTEMA.md)
- [Documentación Frontend](Docs/FRONTEND.md)
- [Documentación Backend](Docs/BACKEND.md)
- [Guía de Pruebas con Postman](Docs/POSTMAN_TESTING.md)
- [Guía de Despliegue](Docs/DEPLOYMENT.md)
- [Documentación de Supabase](Docs/SUPABASE.md)

### Recursos Adicionales
- [Videos de Funcionamiento de Módulos y Pruebas](https://drive.google.com/drive/folders/1TzaoRomnwRZKkUAKr17rV5evDqHJ74l6?usp=sharing)

### Colecciones de Postman
- **Administrador**: [Tesoros Chocó - Administrador](https://www.postman.com/bold-zodiac-382577/workspace/tesoros-choco/collection/13226867-e1af0bd7-a37c-4674-9089-be540313cdf1?action=share&source=copy-link&creator=13226867)
- **Vendedor**: [Tesoros Chocó - Vendedor](https://www.postman.com/bold-zodiac-382577/workspace/tesoros-choco/collection/13226867-b84cdda9-e50f-4590-89ee-4e8febd921a8?action=share&source=copy-link&creator=13226867)
- **Comprador**: [Tesoros Chocó - Comprador](https://www.postman.com/bold-zodiac-382577/workspace/tesoros-choco/collection/13226867-1355fb2b-b951-4c75-8d65-53222eb089ec?action=share&source=copy-link&creator=13226867)

## 🏗️ Arquitectura del Sistema

El proyecto implementa una arquitectura moderna de cliente-servidor con separación clara de responsabilidades:

### Tecnologías Principales
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript
- **Base de Datos**: PostgreSQL gestionado por Supabase
- **Autenticación**: Supabase Auth con JWT
- **Almacenamiento**: Supabase Storage para imágenes

### Patrones Arquitectónicos
1. Arquitectura en capas
2. Patrón de componentes modulares
3. Patrón de contexto para estado global
4. Seguridad basada en roles (RBAC)

## 👥 Roles de Usuario

El sistema contempla tres roles principales:

1. **Administrador**: Gestiona usuarios, aprueba vendedores, accede a métricas
2. **Vendedor**: Publica productos, gestiona inventario, visualiza ventas
3. **Comprador**: Navega productos, realiza compras, deja reseñas

## 🔐 Seguridad y Calidad

### Características de Seguridad
- Autenticación multi-factor con JWT
- Row Level Security (RLS) en la base de datos
- Validación de datos con Zod
- Headers de seguridad (CSP, CORS)
- Rate limiting para prevenir abusos

### Buenas Práticas de Calidad
- Validación de esquemas con Zod
- Manejo de errores estructurado
- Testing automatizado con Vitest
- Code splitting para optimización
- Documentación completa del código

## 📊 Procesos de Desarrollo Documentados

### 1. Configuración del Entorno
- Instalación de dependencias con Bun o npm
- Configuración de variables de entorno
- Conexión con Supabase

### 2. Desarrollo Local
- Ejecución del backend en modo desarrollo
- Ejecución del frontend en modo desarrollo
- Solución de problemas comunes (CORS, etc.)

### 3. Testing
- Pruebas unitarias con Vitest
- Pruebas de cobertura de código
- Pruebas de API con Postman

### 4. Despliegue
- Configuración de producción
- Despliegue en Azure
- Configuración de dominios y SSL

## 🧪 Pruebas y Validación

### Pruebas Unitarias
- Framework: Vitest
- Cobertura mínima requerida: 70%
- Reportes HTML disponibles

### Pruebas de API
- Colecciones de Postman por rol
- Autenticación automática
- Validaciones completas
- Variables dinámicas

### Pruebas de Integración
- Flujos completos por rol
- Validación de datos
- Verificación de políticas de seguridad

## 🚀 Características Destacadas

### Rendimiento
- Lazy loading de componentes
- Optimización de imágenes
- Caching inteligente
- Code splitting

### Experiencia de Usuario
- Diseño responsive mobile-first
- Accesibilidad WCAG 2.1
- Navegación intuitiva
- Indicadores de carga

### Monitoreo
- Web Vitals para métricas de rendimiento
- Sistema de logging estructurado
- Dashboard de seguridad
- Manejo de errores centralizado

## 📈 Resultados Preliminares

### Logros Alcanzados
1. Implementación completa de los tres roles de usuario
2. Funcionalidad de marketplace operativa
3. Sistema de autenticación y autorización robusto
4. Pruebas automatizadas con cobertura adecuada
5. Despliegue exitoso en la nube (Azure)

### Desafíos Superados
1. Configuración compleja de CORS
2. Implementación de políticas RLS en Supabase
3. Optimización del rendimiento del frontend
4. Manejo de estados globales en React

## 🎯 Conclusiones

El proyecto **Tesoros Chocó** demuestra la aplicación exitosa de principios modernos de desarrollo de software, incluyendo:

- Arquitectura limpia y mantenible
- Buenas prácticas de seguridad
- Enfoque en la calidad del código
- Documentación completa
- Pruebas automatizadas

La plataforma representa una solución tecnológica efectiva para promover las artesanías del Chocó, combinando funcionalidad técnica con un propósito social importante.

## 📅 Registro de Cambios

- **Versión 1.0**: Documento inicial de bitácora
- **Fecha**: 18 de septiembre de 2025

---

**Desarrollado con ❤️ para preservar y promover las artesanías del Chocó**