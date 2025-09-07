const axios = require('axios');

async function testAPI() {
  try {
    // Health check
    console.log('Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:4000/health');
    console.log('Health check response:', healthResponse.data);
    
    // Vendor authentication
    console.log('\nTesting vendor authentication...');
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
    
    console.log('Authentication successful!');
    console.log('Access token:', authResponse.data.access_token);
    
    // Test creating a product
    console.log('\nTesting product creation...');
    const productResponse = await axios.post(
      'http://localhost:4000/productos',
      {
        nombre: 'Producto de prueba - Node.js',
        descripcion: 'Producto creado desde Node.js para pruebas',
        precio: 150000,
        stock: 5,
        categoria_id: 'a7114981-678c-412e-8648-017f02548872'
      },
      {
        headers: {
          'Authorization': `Bearer ${authResponse.data.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Product created successfully!');
    console.log('Product ID:', productResponse.data.id);
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testAPI();