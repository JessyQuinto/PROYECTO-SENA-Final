import { supabase } from '../lib/supabaseClient';

interface NotificationPayload {
  type: 'vendor_status' | 'low_stock' | 'evaluation' | 'order';
  payload: any;
}

class NotificationService {
  private supabaseUrl: string;
  private projectRef: string;

  constructor() {
    const supaUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
    this.supabaseUrl = supaUrl || '';
    this.projectRef = supaUrl ? new URL(supaUrl).host.split('.')[0] : '';
  }

  /**
   * Envía una notificación a través del servicio unificado
   * @param type Tipo de notificación
   * @param payload Datos específicos de la notificación
   * @returns Promise con el resultado de la operación
   */
  async sendNotification(type: NotificationPayload['type'], payload: any) {
    try {
      // Obtener token de autenticación
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      
      if (!token || !this.projectRef) {
        throw new Error('No se pudo obtener la información de autenticación');
      }

      // Enviar notificación a través del servicio unificado
      const response = await fetch(
        `https://${this.projectRef}.functions.supabase.co/notification-service`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type,
            payload
          }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar la notificación');
      }

      return result;
    } catch (error) {
      console.error('[NotificationService] Error:', error);
      throw error;
    }
  }

  /**
   * Envía una notificación de estado de vendedor
   * @param email Email del vendedor
   * @param action Acción realizada (aprobado, rechazado, etc.)
   * @param nombre Nombre del vendedor (opcional)
   * @param from Remitente personalizado (opcional)
   */
  async sendVendorStatusNotification(
    email: string,
    action: 'aprobado' | 'rechazado' | 'bloqueado' | 'reactivado' | 'eliminado',
    nombre?: string,
    from?: string
  ) {
    return this.sendNotification('vendor_status', {
      email,
      action,
      nombre,
      from
    });
  }

  /**
   * Envía una notificación de stock bajo
   * @param producto_id ID del producto
   * @param stock_actual Stock actual del producto
   * @param umbral Umbral de stock configurado
   */
  async sendLowStockNotification(
    producto_id: string,
    stock_actual: number,
    umbral: number
  ) {
    return this.sendNotification('low_stock', {
      producto_id,
      stock_actual,
      umbral
    });
  }

  /**
   * Envía una notificación de evaluación de producto
   * @param producto_id ID del producto evaluado
   * @param puntuacion Puntuación de 1 a 5
   * @param comentario Comentario opcional
   */
  async sendEvaluationNotification(
    producto_id: string,
    puntuacion: number,
    comentario?: string
  ) {
    return this.sendNotification('evaluation', {
      producto_id,
      puntuacion,
      comentario
    });
  }

  /**
   * Envía una notificación de pedido
   * @param action Tipo de notificación (receipt, shipped)
   * @param email Email del destinatario
   * @param order_id ID del pedido
   * @param nombre Nombre del destinatario (opcional)
   * @param from Remitente personalizado (opcional)
   */
  async sendOrderNotification(
    action: 'receipt' | 'shipped',
    email: string,
    order_id: string,
    nombre?: string,
    from?: string
  ) {
    return this.sendNotification('order', {
      action,
      email,
      order_id,
      nombre,
      from
    });
  }

  /**
   * Envía una notificación personalizada a la tabla de notificaciones
   * @param title Título de la notificación
   * @param message Mensaje de la notificación
   * @param type Tipo de notificación
   * @param link Enlace opcional
   */
  async sendCustomNotification(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    link?: string
  ) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            title,
            message,
            type,
            link,
            read: false
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[NotificationService] Error sending custom notification:', error);
      throw error;
    }
  }
}

// Exportar una instancia singleton del servicio
export const notificationService = new NotificationService();

// Exportar también la clase por si se necesita crear múltiples instancias
export default NotificationService;