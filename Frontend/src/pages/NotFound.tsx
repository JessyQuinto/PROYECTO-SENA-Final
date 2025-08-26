import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-4">Página no encontrada</h2>
        <p className="text-muted-foreground mb-6">
          Lo sentimos, la página que buscas no existe.
        </p>
        <Link
          to="/"
          className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default NotFound;