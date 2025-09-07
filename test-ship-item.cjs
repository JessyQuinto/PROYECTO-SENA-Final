const axios = require('axios');

async function testShipItem() {
  try {
    console.log('=== Tesoros Chocó API - Prueba de Marcar Order Item como Enviado ===\n');
    
    // Usamos el token de acceso que obtuvimos anteriormente
    const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWV4ZmF3bWV0bWZhYnB3bGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzAzMTYsImV4cCI6MjA3MDIwNjMxNn0.nb6WPz87vBq5CjZuL4LB8ZV45jeD-B-a4qzJh0j4J6g';
    
    // Usamos el order_item_id del environment
    const orderItemId = '2bf88230-147b-47d0-b99a-b5274ca7e35d';
    
    console.log('Marcando order item como enviado...');
    console.log('Order Item ID:', orderItemId);
    
    const response = await axios.post(
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
    console.log('   Respuesta:', response.data);
    
  } catch (error) {
    console.error('\n❌ Error al marcar order item como enviado:', error.response ? error.response.data : error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
    }
  }
}

testShipItem();