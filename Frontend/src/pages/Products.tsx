import React from 'react';

const Products: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Productos</h1>
      <div className="bg-card rounded-lg p-6 border border-border">
        <p className="text-muted-foreground">
          Catálogo de productos en desarrollo.
        </p>
      </div>
    </div>
  );
};

export default Products;