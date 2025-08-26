import React from 'react';
import { useParams } from 'react-router-dom';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Detalle del Producto</h1>
      <div className="bg-card rounded-lg p-6 border border-border">
        <p className="text-muted-foreground">
          Detalle del producto {id} en desarrollo.
        </p>
      </div>
    </div>
  );
};

export default ProductDetail;