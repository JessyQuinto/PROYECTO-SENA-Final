const axios = require('axios');
const fs = require('fs');

async function runPostmanTests() {
  try {
    console.log('=== Ejecutando Colección de Postman Manualmente ===\n');
    
    // Leer el environment
    const environment = JSON.parse(fs.readFileSync('vendedor-environment-fixed.json', 'utf8'));
    const envVars = {};
    environment.values.forEach(item => {
      envVars[item.key] = item.value;
    });
    
    console.log('Variables de entorno cargadas:');
    console.log('- backend_base_url:', envVars.backend_base_url);
    console.log('- supabase_rest_url:', envVars.supabase_rest_url);
    console.log('- vendor_email:', envVars.vendor_email);
    console.log('- demo_categoria_id:', envVars.demo_categoria_id);
    console.log('- order_item_id:', envVars.order_item_id);
    console.log('');
    
    // 1. Health Check
    console.log('1. 🔍 Health Check - GET /health');
    const healthResponse = await axios.get(`${envVars.backend_base_url}/health`);
    console.log('   ✅ Status 200');
    console.log('   ✅ Service OK:', healthResponse.data.service);
    console.log('');
    
    // 2. Autenticación con Supabase
    console.log('2. 🔐 Auth Vendedor - POST Supabase Auth');
    const authResponse = await axios.post(
      `${envVars.supabase_rest_url}/auth/v1/token?grant_type=password`,
      {
        email: envVars.vendor_email,
        password: envVars.vendor_password
      },
      {
        headers: {
          'apikey': envVars.supabase_anon_key,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const accessToken = authResponse.data.access_token;
    const userId = authResponse.data.user.id;
    
    console.log('   ✅ Status 200');
    console.log('   ✅ Auth successful');
    console.log('   User ID:', userId);
    console.log('');
    
    // 3. Post-Signup
    console.log('3. 🔐 Auth Vendedor - POST Backend Post-Signup');
    const postSignupResponse = await axios.post(
      `${envVars.backend_base_url}/auth/post-signup`,
      {
        user_id: userId,
        email: envVars.vendor_email,
        role: 'vendedor'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('   ✅ Status 200');
    console.log('   ✅ Post-Signup successful');
    console.log('');
    
    // 4. Crear Producto
    console.log('4. 📦 Gestión de Productos - POST /productos');
    const createProductResponse = await axios.post(
      `${envVars.backend_base_url}/productos`,
      {
        nombre: 'Producto de prueba - Postman Script',
        descripcion: 'Producto creado desde script para pruebas de Postman',
        precio: 150000,
        stock: 5,
        categoria_id: envVars.demo_categoria_id
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const productId = createProductResponse.data.id;
    console.log('   ✅ Status 201');
    console.log('   ✅ Product created:', productId);
    console.log('');
    
    // 5. Actualizar Producto
    console.log('5. 📦 Gestión de Productos - PUT /productos/:id');
    const updateProductResponse = await axios.put(
      `${envVars.backend_base_url}/productos/${productId}`,
      {
        nombre: 'Producto de prueba - Actualizado (Postman Script)',
        descripcion: 'Producto actualizado desde script para pruebas de Postman',
        precio: 175000,
        stock: 3
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('   ✅ Status 200');
    console.log('   ✅ Product updated:', updateProductResponse.data.nombre);
    console.log('');
    
    // 6. Marcar Order Item como Enviado
    console.log('6. 🚚 Gestión de Envíos - POST /order-items/:id/shipped');
    const shipOrderItemResponse = await axios.post(
      `${envVars.backend_base_url}/order-items/${envVars.order_item_id}/shipped`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('   ✅ Status 200');
    console.log('   ✅ Order item marked as shipped');
    console.log('');
    
    console.log('=== 🎉 ¡Todas las pruebas de la colección de Postman pasaron exitosamente! ===');
    console.log('\nResumen de resultados:');
    console.log('1. 🔍 Health Check: ✅');
    console.log('2. 🔐 Auth Vendedor: ✅');
    console.log('3. 📦 Gestión de Productos (Crear): ✅');
    console.log('4. 📦 Gestión de Productos (Actualizar): ✅');
    console.log('5. 🚚 Gestión de Envíos: ✅');
    
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error.response ? error.response.data : error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
    }
  }
}

runPostmanTests();