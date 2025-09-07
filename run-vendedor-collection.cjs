#!/usr/bin/env node

/**
 * Script para ejecutar la colección "Tesoros Chocó API - Flujo Vendedor" con el orden correcto
 * Este script asegura que las variables se establezcan correctamente antes de ejecutar cada solicitud
 */

const newman = require('newman');

// ID de la colección y environment en Postman MCP
const COLLECTION_ID = '6fdc9403-3498-4864-b2b7-04ebdbe0976b';
const ENVIRONMENT_ID = '2f97c816-8784-4cef-ac97-dbcc076a02a7';

console.log('🚀 Iniciando ejecución de la colección "Tesoros Chocó API - Flujo Vendedor"');

// Ejecutar la colección con newman
newman.run({
    collection: COLLECTION_ID,
    environment: ENVIRONMENT_ID,
    reporters: ['cli', 'json'],
    reporter: {
        json: {
            export: 'vendedor-collection-results.json'
        }
    }
}, function (err, summary) {
    if (err) {
        console.error('❌ Error al ejecutar la colección:', err);
        process.exit(1);
    }

    // Verificar si hubo fallos en las pruebas
    const failures = summary.run.failures;
    if (failures && failures.length > 0) {
        console.log('⚠️  Se encontraron fallos en la ejecución:');
        failures.forEach((failure, index) => {
            console.log(`  ${index + 1}. ${failure.error.test} - ${failure.error.message}`);
        });
        process.exit(1);
    } else {
        console.log('✅ Colección ejecutada exitosamente sin fallos');
        console.log('📄 Resultados guardados en: vendedor-collection-results.json');
    }
});