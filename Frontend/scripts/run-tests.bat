@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM Script para ejecutar todas las pruebas del frontend
REM Proyecto Tesoros Chocó

echo 🧪 Ejecutando pruebas unitarias del Frontend - Tesoros Chocó
echo ==========================================================

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo ❌ Error: No se encontró package.json. Asegúrate de estar en el directorio Frontend/
    pause
    exit /b 1
)

REM Verificar que las dependencias estén instaladas
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    npm install
)

:menu
echo.
echo Selecciona una opción:
echo 1) Ejecutar todas las pruebas
echo 2) Ejecutar pruebas en modo watch
echo 3) Ejecutar pruebas con interfaz gráfica
echo 4) Generar reporte de cobertura
echo 5) Ejecutar pruebas específicas
echo 6) Limpiar caché de pruebas
echo 7) Salir
echo.

set /p choice="Selecciona una opción (1-7): "

if "%choice%"=="1" (
    echo 🧪 Ejecutando todas las pruebas...
    npm run test:run
    goto continue
)

if "%choice%"=="2" (
    echo 👀 Ejecutando pruebas en modo watch...
    npm test
    goto continue
)

if "%choice%"=="3" (
    echo 🖥️  Abriendo interfaz gráfica de pruebas...
    npm run test:ui
    goto continue
)

if "%choice%"=="4" (
    echo 📊 Generando reporte de cobertura...
    npm run test:coverage
    echo ✅ Reporte generado en coverage/
    goto continue
)

if "%choice%"=="5" (
    call :run_specific_tests
    goto continue
)

if "%choice%"=="6" (
    call :clean_cache
    goto continue
)

if "%choice%"=="7" (
    echo 👋 ¡Hasta luego!
    pause
    exit /b 0
)

echo ❌ Opción inválida. Por favor selecciona 1-7.
goto continue

:run_specific_tests
echo.
echo 📁 Directorios disponibles:
echo - components/ (Componentes React)
echo - hooks/ (Hooks personalizados)
echo - lib/ (Funciones utilitarias)
echo.
set /p test_path="Ingresa el directorio o archivo específico: "

if defined test_path (
    echo 🧪 Ejecutando pruebas en: !test_path!
    npm test -- --run "!test_path!"
) else (
    echo ❌ No se especificó una ruta válida
)
goto :eof

:clean_cache
echo 🧹 Limpiando caché de pruebas...
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"
if exist "coverage" rmdir /s /q "coverage"
echo ✅ Caché limpiado
goto :eof

:continue
echo.
set /p continue="Presiona Enter para continuar..."
goto menu
