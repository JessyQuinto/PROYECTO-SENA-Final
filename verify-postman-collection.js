#!/usr/bin/env node

/**
 * Script de Verificación de la Colección Postman
 * Tesoros Chocó API
 * 
 * Valida que todos los endpoints estén funcionando correctamente
 * y que los datos coincidan entre la colección y la base de datos.
 */

import https from 'https';
import http from 'http';

// Configuración
const CONFIG = {
  BACKEND_URL: 'http://localhost:4000',
  SUPABASE_URL: 'https://jdmexfawmetmfabpwlfs.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWV4ZmF3bWV0bWZhYnB3bGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzAzMTYsImV4cCI6MjA3MDIwNjMxNn0.nb6WPz87vBq5CjZuL4LB8ZV45jeD-B-a4qzJh0j4J6g',
  ADMIN_EMAIL: 'admin@tesoros-choco.com',
  ADMIN_PASSWORD: 'admin123',
  DEMO_PRODUCTO_ID: '228eddbe-8f20-43f4-a8aa-bb699a9f7b9b'
};

// Colores para consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Función helper para hacer requests HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const lib = options.protocol === 'https:' ? https : http;
    
    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonData = body ? JSON.parse(body) : {};
          resolve({ 
            statusCode: res.statusCode, 
            data: jsonData,
            headers: res.headers 
          });
        } catch (e) {
          resolve({ 
            statusCode: res.statusCode, 
            data: body,
            headers: res.headers 
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Tests de verificación
class PostmanCollectionVerifier {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async test(name, testFn) {
    try {
      log(`\n🧪 Testing: ${name}`, 'blue');
      await testFn();
      this.results.passed++;
      log(`✅ PASSED: ${name}`, 'green');
    } catch (error) {
      this.results.failed++;
      this.results.errors.push({ test: name, error: error.message });
      log(`❌ FAILED: ${name} - ${error.message}`, 'red');
    }
  }

  async verifyHealthCheck() {
    await this.test('Health Check', async () => {
      const url = new URL(`${CONFIG.BACKEND_URL}/health`);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      };

      const response = await makeRequest(options);
      
      if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
      }
      
      if (!response.data.ok || response.data.service !== 'backend-demo') {
        throw new Error(`Invalid health check response: ${JSON.stringify(response.data)}`);
      }
    });
  }

  async verifySupabaseAuth() {
    await this.test('Supabase Authentication', async () => {
      const url = new URL(`${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=password`);
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'POST',
        protocol: 'https:',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.SUPABASE_ANON_KEY
        }
      };

      const data = {
        email: CONFIG.ADMIN_EMAIL,
        password: CONFIG.ADMIN_PASSWORD
      };

      const response = await makeRequest(options, data);
      
      if (response.statusCode !== 200) {
        throw new Error(`Authentication failed: ${response.statusCode} - ${JSON.stringify(response.data)}`);
      }
      
      if (!response.data.access_token || !response.data.user) {
        throw new Error(`Invalid auth response: ${JSON.stringify(response.data)}`);
      }

      // Guardar token para tests posteriores
      this.authToken = response.data.access_token;
      this.userId = response.data.user.id;
    });
  }

  async verifyPostSignup() {
    await this.test('Backend Post-Signup', async () => {
      if (!this.userId) {
        throw new Error('No user ID available from auth test');
      }

      const url = new URL(`${CONFIG.BACKEND_URL}/auth/post-signup`);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      };

      const data = {
        user_id: this.userId,
        email: CONFIG.ADMIN_EMAIL,
        role: 'admin'
      };

      const response = await makeRequest(options, data);
      
      if (response.statusCode !== 200) {
        throw new Error(`Post-signup failed: ${response.statusCode} - ${JSON.stringify(response.data)}`);
      }
      
      if (!response.data.ok) {
        throw new Error(`Post-signup response invalid: ${JSON.stringify(response.data)}`);
      }
    });
  }

  async verifyCreateOrder() {
    await this.test('Create Order', async () => {
      if (!this.authToken) {
        throw new Error('No auth token available');
      }

      const url = new URL(`${CONFIG.BACKEND_URL}/rpc/crear_pedido`);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        }
      };

      const data = {
        items: [{
          producto_id: CONFIG.DEMO_PRODUCTO_ID,
          cantidad: 1
        }]
      };

      const response = await makeRequest(options, data);
      
      if (response.statusCode !== 200) {
        throw new Error(`Order creation failed: ${response.statusCode} - ${JSON.stringify(response.data)}`);
      }
      
      if (!response.data.order_id) {
        throw new Error(`No order ID returned: ${JSON.stringify(response.data)}`);
      }

      // Guardar order ID para tests posteriores
      this.orderId = response.data.order_id;
    });
  }

  async verifyPaymentSimulation() {
    await this.test('Payment Simulation', async () => {
      if (!this.orderId) {
        throw new Error('No order ID available');
      }

      const url = new URL(`${CONFIG.BACKEND_URL}/payments/simulate`);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      };

      const data = {
        order_id: this.orderId,
        approved: true
      };

      const response = await makeRequest(options, data);
      
      if (response.statusCode !== 200) {
        throw new Error(`Payment simulation failed: ${response.statusCode} - ${JSON.stringify(response.data)}`);
      }
      
      if (!response.data.ok) {
        throw new Error(`Payment simulation response invalid: ${JSON.stringify(response.data)}`);
      }
    });
  }

  async verifyDataConsistency() {
    await this.test('Data Consistency Check', async () => {
      // Verificar que el producto demo existe
      const url = new URL(`${CONFIG.SUPABASE_URL}/rest/v1/productos?id=eq.${CONFIG.DEMO_PRODUCTO_ID}`);
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: 'GET',
        protocol: 'https:',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.SUPABASE_ANON_KEY
        }
      };

      const response = await makeRequest(options);
      
      if (response.statusCode !== 200) {
        throw new Error(`Failed to query products: ${response.statusCode}`);
      }
      
      if (!Array.isArray(response.data) || response.data.length === 0) {
        throw new Error(`Demo product ${CONFIG.DEMO_PRODUCTO_ID} not found in database`);
      }

      const product = response.data[0];
      if (product.estado !== 'activo' || product.stock <= 0) {
        throw new Error(`Demo product is not available: estado=${product.estado}, stock=${product.stock}`);
      }
    });
  }

  async runAllTests() {
    log('\n🚀 Iniciando verificación de la Colección Postman', 'bold');
    log('================================================', 'blue');

    // Ejecutar tests en orden
    await this.verifyHealthCheck();
    await this.verifySupabaseAuth();
    await this.verifyPostSignup();
    await this.verifyDataConsistency();
    await this.verifyCreateOrder();
    await this.verifyPaymentSimulation();

    // Mostrar resultados
    this.showResults();
  }

  showResults() {
    log('\n📊 RESULTADOS DE LA VERIFICACIÓN', 'bold');
    log('================================', 'blue');
    
    log(`✅ Tests pasados: ${this.results.passed}`, 'green');
    log(`❌ Tests fallidos: ${this.results.failed}`, 'red');
    
    if (this.results.errors.length > 0) {
      log('\n🔍 ERRORES ENCONTRADOS:', 'red');
      this.results.errors.forEach((error, index) => {
        log(`${index + 1}. ${error.test}: ${error.error}`, 'red');
      });
    }

    const totalTests = this.results.passed + this.results.failed;
    const successRate = (this.results.passed / totalTests * 100).toFixed(1);
    
    log(`\n📈 Tasa de éxito: ${successRate}%`, successRate === '100.0' ? 'green' : 'yellow');
    
    if (this.results.failed === 0) {
      log('\n🎉 ¡TODAS LAS VERIFICACIONES PASARON!', 'green');
      log('La colección Postman está funcionando correctamente.', 'green');
    } else {
      log('\n⚠️  ALGUNAS VERIFICACIONES FALLARON', 'yellow');
      log('Revisa los errores y corrige la configuración.', 'yellow');
    }
  }
}

// Ejecutar verificaciones
async function main() {
  const verifier = new PostmanCollectionVerifier();
  
  try {
    await verifier.runAllTests();
  } catch (error) {
    log(`\n💥 Error crítico durante la verificación: ${error.message}`, 'red');
    process.exit(1);
  }
  
  // Exit code basado en resultados
  process.exit(verifier.results.failed > 0 ? 1 : 0);
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(`\n💥 Error inesperado: ${error.message}`, 'red');
    process.exit(1);
  });
}

export default PostmanCollectionVerifier;