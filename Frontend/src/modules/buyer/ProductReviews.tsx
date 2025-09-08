import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Icon from '@/components/ui/Icon';

interface Evaluation {
  id: string;
  puntuacion: number;
  comentario: string | null;
  created_at: string;
  comprador_nombre: string;
}

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvaluations();
  }, [productId]);

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/productos/${productId}/evaluaciones`);
      
      if (!response.ok) {
        throw new Error('Error al cargar las evaluaciones');
      }
      
      const data = await response.json();
      setEvaluations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Icon
          category="Estados y Feedback"
          name="HugeiconsReload"
          className="w-6 h-6 animate-spin"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Icon
          category="Catálogo y producto"
          name="LucideHeart"
          className="w-12 h-12 mx-auto mb-3 text-gray-300"
        />
        <p>No hay evaluaciones para este producto aún.</p>
        <p className="text-sm mt-1">Sé el primero en compartir tu experiencia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Reseñas de Clientes
        </h3>
        <span className="text-sm text-gray-500">
          {evaluations.length} {evaluations.length === 1 ? 'reseña' : 'reseñas'}
        </span>
      </div>

      <div className="space-y-4">
        {evaluations.map((evaluacion) => (
          <div key={evaluacion.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-900">
                    {evaluacion.comprador_nombre}
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Icon
                        key={star}
                        category="Catálogo y producto"
                        name={star <= evaluacion.puntuacion ? "MdiStar" : "MdiStarOutline"}
                        className={`w-5 h-5 ${star <= evaluacion.puntuacion ? 'text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                {evaluacion.comentario && (
                  <p className="text-gray-700">{evaluacion.comentario}</p>
                )}
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {new Date(evaluacion.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductReviews;