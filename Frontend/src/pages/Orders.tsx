import React from 'react';

const Orders: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mis Pedidos</h1>
      <div className="bg-card rounded-lg p-6 border border-border">
        <p className="text-muted-foreground">
          Historial de pedidos en desarrollo.
        </p>
      </div>
    </div>
  );
};

export default Orders;