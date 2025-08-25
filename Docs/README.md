# README - Marketplace de Artesanías

## 1. Descripción General

Este proyecto es una plataforma de e-commerce (Marketplace) diseñada para conectar a artesanos con compradores interesados en productos únicos y hechos a mano. La aplicación permite a los vendedores registrarse, gestionar su inventario y vender sus productos, mientras que los compradores pueden explorar catálogos, realizar compras y seguir sus pedidos.

El sistema está compuesto por un frontend moderno y reactivo, un backend basado en servicios en la nube (BaaS), y un sistema de despliegue continuo automatizado.

## 2. Objetivos del Proyecto

*   **Crear una comunidad:** Ofrecer un espacio digital para que los artesanos puedan mostrar y vender su trabajo.
*   **Facilitar el comercio:** Simplificar el proceso de compra y venta de artesanías.
*   **Experiencia de usuario fluida:** Proporcionar una interfaz intuitiva y agradable tanto para compradores como para vendedores.
*   **Plataforma escalable:** Construir una base técnica que permita el crecimiento futuro en usuarios y funcionalidades.

## 3. Tecnologías Principales

*   **Frontend:** React, Vite, TypeScript, Tailwind CSS
*   **Backend:** Node.js, TypeScript, Supabase (Base de Datos, Autenticación, Funciones Serverless)
*   **Despliegue:** GitHub Actions para CI/CD, Azure Static Web Apps

## 4. Instalación y Ejecución Rápida

### Requisitos Previos

*   Node.js (versión especificada en `.nvmrc`)
*   Bun (gestor de paquetes)
*   Git

### Pasos para Ejecución Local

1.  **Clonar el repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd PROYECTO-SENA-main-main
    ```

2.  **Instalar dependencias del Frontend:**
    ```bash
    cd Frontend
    bun install
    ```

3.  **Instalar dependencias del Backend:**
    ```bash
    cd ../Backend
    bun install
    ```

4.  **Configurar variables de entorno:**
    *   En la carpeta `Frontend`, renombra `env.example` a `.env` y añade las credenciales de Supabase (URL y Anon Key).

5.  **Ejecutar el Frontend:**
    ```bash
    cd ../Frontend
    bun run dev
    ```

6.  **Ejecutar el Backend (Funciones de Supabase):**
    *   El backend se basa en Supabase Functions. Para un entorno de desarrollo local, se recomienda usar la CLI de Supabase.
    ```bash
    # (Desde la raíz del proyecto)
    supabase start
    supabase functions serve
    ```
