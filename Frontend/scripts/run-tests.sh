#!/bin/bash

# Script para ejecutar todas las pruebas del frontend
# Proyecto Tesoros Chocó

echo "🧪 Ejecutando pruebas unitarias del Frontend - Tesoros Chocó"
echo "=========================================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio Frontend/"
    exit 1
fi

# Verificar que las dependencias estén instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Función para mostrar el menú de opciones
show_menu() {
    echo ""
    echo "Selecciona una opción:"
    echo "1) Ejecutar todas las pruebas"
    echo "2) Ejecutar pruebas en modo watch"
    echo "3) Ejecutar pruebas con interfaz gráfica"
    echo "4) Generar reporte de cobertura"
    echo "5) Ejecutar pruebas específicas"
    echo "6) Limpiar caché de pruebas"
    echo "7) Salir"
    echo ""
}

# Función para ejecutar pruebas específicas
run_specific_tests() {
    echo ""
    echo "📁 Directorios disponibles:"
    echo "- components/ (Componentes React)"
    echo "- hooks/ (Hooks personalizados)"
    echo "- lib/ (Funciones utilitarias)"
    echo ""
    read -p "Ingresa el directorio o archivo específico: " test_path
    
    if [ -n "$test_path" ]; then
        echo "🧪 Ejecutando pruebas en: $test_path"
        npm test -- --run "$test_path"
    else
        echo "❌ No se especificó una ruta válida"
    fi
}

# Función para limpiar caché
clean_cache() {
    echo "🧹 Limpiando caché de pruebas..."
    rm -rf node_modules/.vite
    rm -rf coverage/
    echo "✅ Caché limpiado"
}

# Bucle principal del menú
while true; do
    show_menu
    read -p "Selecciona una opción (1-7): " choice
    
    case $choice in
        1)
            echo "🧪 Ejecutando todas las pruebas..."
            npm run test:run
            ;;
        2)
            echo "👀 Ejecutando pruebas en modo watch..."
            npm test
            ;;
        3)
            echo "🖥️  Abriendo interfaz gráfica de pruebas..."
            npm run test:ui
            ;;
        4)
            echo "📊 Generando reporte de cobertura..."
            npm run test:coverage
            echo "✅ Reporte generado en coverage/"
            ;;
        5)
            run_specific_tests
            ;;
        6)
            clean_cache
            ;;
        7)
            echo "👋 ¡Hasta luego!"
            exit 0
            ;;
        *)
            echo "❌ Opción inválida. Por favor selecciona 1-7."
            ;;
    esac
    
    echo ""
    read -p "Presiona Enter para continuar..."
done
