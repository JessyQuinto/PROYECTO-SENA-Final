// Script simple para probar la API de Tesoros Chocó
const https = require('http');
const fs = require('fs');

const baseUrl = 'http://localhost:4000';

// Función helper para hacer requests HTTP
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method: method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Tesoros-Choco-API-Test/1.0'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Función para generar UUID simple
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Tests
async function runTests() {
  console.log('🚀 Iniciando pruebas de la API Tesoros Chocó');
  console.log('==========================================\n');

  const testResults = [];

  try {
    // Test 1: Health Check
    console.log('📋 Test 1: Health Check');
    const healthResponse = await makeRequest('GET', '/health');
    console.log(`Status: ${healthResponse.status}`);
    console.log(`Response:`, healthResponse.data);
    
    if (healthResponse.status === 200 && healthResponse.data.ok === true) {
      console.log('✅ PASSED: Health check successful\n');
      testResults.push({ test: 'Health Check', status: 'PASSED' });
    } else {
      console.log('❌ FAILED: Health check failed\n');
      testResults.push({ test: 'Health Check', status: 'FAILED' });
    }

    // Test 2: Root Redirect
    console.log('📋 Test 2: Root Redirect');
    const rootResponse = await makeRequest('GET', '/');
    console.log(`Status: ${rootResponse.status}`);
    if (rootResponse.status === 302) {
      console.log('✅ PASSED: Root redirect working\n');
      testResults.push({ test: 'Root Redirect', status: 'PASSED' });
    } else {
      console.log('❌ FAILED: Root redirect not working\n');
      testResults.push({ test: 'Root Redirect', status: 'FAILED' });
    }

    // Test 3: Auth - Create User (Valid)
    console.log('📋 Test 3: Auth - Create User (Valid Data)');
    const userData = {
      user_id: generateUUID(),
      email: `test-${Date.now()}@tesoroschoco.com`,
      role: 'comprador',
      nombre: 'Test User - API Tests'
    };
    const authResponse = await makeRequest('POST', '/auth/post-signup', userData);
    console.log(`Status: ${authResponse.status}`);
    console.log(`Response:`, authResponse.data);
    
    if (authResponse.status === 200 && authResponse.data.ok === true) {
      console.log('✅ PASSED: User creation successful\n');
      testResults.push({ test: 'Auth - Create User (Valid)', status: 'PASSED' });
    } else {
      console.log('❌ FAILED: User creation failed\n');
      testResults.push({ test: 'Auth - Create User (Valid)', status: 'FAILED' });
    }

    // Test 4: Auth - Create User (Invalid Data)
    console.log('📋 Test 4: Auth - Create User (Invalid Data)');
    const invalidData = {
      user_id: 'invalid-uuid',
      email: 'not-an-email',
      role: 'invalid-role'
    };
    const invalidResponse = await makeRequest('POST', '/auth/post-signup', invalidData);
    console.log(`Status: ${invalidResponse.status}`);
    console.log(`Response:`, invalidResponse.data);
    
    if (invalidResponse.status === 400 && invalidResponse.data.error === 'Payload inválido') {
      console.log('✅ PASSED: Validation working correctly\n');
      testResults.push({ test: 'Auth - Create User (Invalid)', status: 'PASSED' });
    } else {
      console.log('❌ FAILED: Validation not working\n');
      testResults.push({ test: 'Auth - Create User (Invalid)', status: 'FAILED' });
    }

    // Test 5: Demo Order Creation
    console.log('📋 Test 5: Demo Order Creation');
    const orderData = {
      items: [
        {
          producto_id: "228eddbe-8f20-43f4-a8aa-bb699a9f7b9b", // Real product ID
          cantidad: 2
        }
      ]
    };
    const orderResponse = await makeRequest('POST', '/rpc/crear_pedido_demo', orderData);
    console.log(`Status: ${orderResponse.status}`);
    console.log(`Response:`, orderResponse.data);
    
    if (orderResponse.status === 200) {
      console.log('✅ PASSED: Demo order creation successful\n');
      testResults.push({ test: 'Demo Order Creation', status: 'PASSED' });
    } else if (orderResponse.status >= 400 && orderResponse.status < 500) {
      console.log('⚠️  WARNING: Expected client error (may be due to auth requirements)\n');
      testResults.push({ test: 'Demo Order Creation', status: 'WARNING' });
    } else {
      console.log('❌ FAILED: Unexpected server error\n');
      testResults.push({ test: 'Demo Order Creation', status: 'FAILED' });
    }

    // Test 6: Payment Simulation (Invalid Data)
    console.log('📋 Test 6: Payment Simulation (Invalid Data)');
    const invalidPayment = {
      order_id: 'not-a-uuid',
      approved: 'not-a-boolean'
    };
    const paymentResponse = await makeRequest('POST', '/payments/simulate', invalidPayment);
    console.log(`Status: ${paymentResponse.status}`);
    console.log(`Response:`, paymentResponse.data);
    
    if (paymentResponse.status === 400) {
      console.log('✅ PASSED: Payment validation working\n');
      testResults.push({ test: 'Payment Simulation (Invalid)', status: 'PASSED' });
    } else {
      console.log('❌ FAILED: Payment validation not working\n');
      testResults.push({ test: 'Payment Simulation (Invalid)', status: 'FAILED' });
    }

    // Test 7: Non-existent Endpoint
    console.log('📋 Test 7: Non-existent Endpoint (404 Test)');
    const notFoundResponse = await makeRequest('GET', '/this-does-not-exist');
    console.log(`Status: ${notFoundResponse.status}`);
    
    if (notFoundResponse.status === 404) {
      console.log('✅ PASSED: 404 handling working\n');
      testResults.push({ test: '404 Handling', status: 'PASSED' });
    } else {
      console.log('❌ FAILED: 404 handling not working\n');
      testResults.push({ test: '404 Handling', status: 'FAILED' });
    }

  } catch (error) {
    console.error('❌ ERROR during tests:', error.message);
    testResults.push({ test: 'General Error', status: 'ERROR', error: error.message });
  }

  // Summary
  console.log('\n🏁 RESUMEN DE PRUEBAS');
  console.log('====================');
  
  const passed = testResults.filter(r => r.status === 'PASSED').length;
  const failed = testResults.filter(r => r.status === 'FAILED').length;
  const warnings = testResults.filter(r => r.status === 'WARNING').length;
  const errors = testResults.filter(r => r.status === 'ERROR').length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`🔥 Errors: ${errors}`);
  console.log(`📊 Total: ${testResults.length}\n`);

  testResults.forEach(result => {
    const icon = result.status === 'PASSED' ? '✅' : 
                 result.status === 'FAILED' ? '❌' : 
                 result.status === 'WARNING' ? '⚠️' : '🔥';
    console.log(`${icon} ${result.test}: ${result.status}`);
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  });

  // Save results
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: { passed, failed, warnings, errors, total: testResults.length },
    results: testResults
  };

  fs.writeFileSync('api-test-results.json', JSON.stringify(reportData, null, 2));
  console.log('\n💾 Resultados guardados en: api-test-results.json');
}

// Execute tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { makeRequest, runTests };
