const axios = require('axios');

async function testPostmanAPI() {
  try {
    console.log('=== Tesoros Chocó API - Pruebas de Postman ===\n');
    
    // 1. Health Check
    console.log('1. Probando Health Check...');
    const healthResponse = await axios.get('http://localhost:4000/health');
    console.log('   ✅ Health Check exitoso:', healthResponse.data);
    
    // 2. Autenticación con Supabase
    console.log('\n2. Probando autenticación con Supabase...');
    const authResponse = await axios.post(
      'https://jdmexfawmetmfabpwlfs.supabase.co/auth/v1/token?grant_type=password',
      {
        email: 'quintojessy2222@gmail.com',
        password: 'Rulexi700.'
      },
      {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWV4ZmF3bWV0bWZhYnB3bGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzAzMTYsImV4cCI6MjA3MDIwNjMxNn0.nb6WPz87vBq5CjZuL4LB8ZV45jeD-B-a4qzJh0j4J6g',
          'Content-Type': 'application/json'
        }
      }
    );
    
    const accessToken = authResponse.data.access_token;
    const userId = authResponse.data.user.id;
    console.log('   ✅ Autenticación exitosa');
    console.log('   User ID:', userId);
    
    // 3. Post-Signup
    console.log('\n3. Probando Post-Signup...');
    const postSignupResponse = await axios.post(
      'http://localhost:4000/auth/post-signup',
      {
        user_id: userId,
        email: 'quintojessy2222@gmail.com',
        role: 'vendedor'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('   ✅ Post-Signup exitoso:', postSignupResponse.data);
    
    // 4. Crear Producto
    console.log('\n4. Probando creación de producto...');
    const createProductResponse = await axios.post(
      'http://localhost:4000/productos',
      {
        nombre: 'Producto de prueba - Node.js',
        descripcion: 'Producto creado desde Node.js para pruebas de Postman',
        precio: 150000,
        stock: 5,
        categoria_id: 'a7114981-678c-412e-8648-017f02548872'
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const productId = createProductResponse.data.id;
    console.log('   ✅ Producto creado exitosamente');
    console.log('   Product ID:', productId);
    
    // 5. Actualizar Producto
    console.log('\n5. Probando actualización de producto...');
    const updateProductResponse = await axios.put(
      `http://localhost:4000/productos/${productId}`,
      {
        nombre: 'Producto de prueba - Actualizado desde Node.js',
        descripcion: 'Producto actualizado desde Node.js para pruebas de Postman',
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
    
    console.log('   ✅ Producto actualizado exitosamente:', updateProductResponse.data.nombre);
    
    // 6. Marcar Order Item como Enviado
    console.log('\n6. Probando marca de order item como enviado...');
    // Primero obtenemos un order_item_id válido
    const supabaseResponse = await axios.post(
      'https://jdmexfawmetmfabpwlfs.supabase.co/rest/v1/rpc/order_items_list',
      {},
      {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWV4ZmF3bWV0bWZhYnB3bGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzAzMTYsImV4cCI6MjA3MDIwNjMxNn0.nb6WPz87vBq5CjZuL4LB8ZV45jeD-B-a4qzJh0j4J6g',
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Usamos el order_item_id que ya tenemos del environment
    const orderItemId = '2bf88230-147b-47d0-b99a-b5274ca7e35d';
    
    const shipOrderItemResponse = await axios.post(
      `http://localhost:4000/order-items/${orderItemId}/shipped`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('   ✅ Order item marcado como enviado exitosamente');
    
    console.log('\n=== Todas las pruebas pasaron exitosamente ===');
    
  } catch (error) {
    console.error('\n❌ Error en la prueba:', error.response ? error.response.data : error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Headers:', error.response.headers);
    }
  }
}

testPostmanAPI();