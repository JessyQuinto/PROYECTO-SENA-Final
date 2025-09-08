import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/auth/AuthContext';
import Icon from '@/components/ui/Icon';

interface AddReviewFormProps {
  orderItemId: string;
  productId: string;
  productName: string;
  onReviewAdded: () => void;
}

const AddReviewForm: React.FC<AddReviewFormProps> = ({ 
  orderItemId, 
  productId,
  productName,
  onReviewAdded 
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Debes iniciar sesión para dejar una reseña');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await fetch('/api/evaluaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await supabase.auth.getSession().then((result: { data: { session: any } }) => result.data.session?.access_token)}`
        },
        body: JSON.stringify({
          order_item_id: orderItemId,
          puntuacion: rating,
          comentario: comment || null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar la reseña');
      }
      
      // Success
      setRating(5);
      setComment('');
      onReviewAdded();
      
      // Show success message
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast?.success('Reseña enviada con éxito', {
          role: 'comprador',
          action: 'update'
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Calificar {productName}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tu calificación
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none"
              >
                <Icon
                  category="Catálogo y producto"
                  name={star <= rating ? "MdiStar" : "MdiStarOutline"}
                  className={`w-8 h-8 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500">
              {rating} de 5 estrellas
            </span>
          </div>
        </div>
        
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Comentario (opcional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="Comparte tu experiencia con este producto..."
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Icon
                  category="Estados y Feedback"
                  name="HugeiconsReload"
                  className="w-4 h-4 mr-2 animate-spin"
                />
                Enviando...
              </>
            ) : (
              <>
                <Icon
                  category="Catálogo y producto"
                  name="LucideHeart"
                  className="w-4 h-4 mr-2"
                />
                Enviar reseña
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddReviewForm;