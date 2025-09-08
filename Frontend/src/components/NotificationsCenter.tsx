import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from './ui/Icon';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  link?: string;
}

const NotificationsCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload: any) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          if (!newNotification.read) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter((n: Notification) => !n.read).length || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.read ? n : { ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getIconAndColor = (type: string) => {
    switch (type) {
      case 'success':
        return { 
          icon: 'MdiCheckCircle', 
          color: 'text-green-500',
          bg: 'bg-green-50'
        };
      case 'warning':
        return { 
          icon: 'MdiAlert', 
          color: 'text-yellow-500',
          bg: 'bg-yellow-50'
        };
      case 'error':
        return { 
          icon: 'MdiAlertCircle', 
          color: 'text-red-500',
          bg: 'bg-red-50'
        };
      default:
        return { 
          icon: 'MdiInformation', 
          color: 'text-blue-500',
          bg: 'bg-blue-50'
        };
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex justify-center">
          <div className="loading loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Centro de Notificaciones</h2>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="btn btn-sm btn-outline"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Icon 
            category="Estados y Feedback" 
            name="MdiBellOff" 
            className="w-16 h-16 mx-auto text-gray-300 mb-4"
          />
          <p className="text-gray-500">No tienes notificaciones</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const { icon, color, bg } = getIconAndColor(notification.type);
            const date = new Date(notification.created_at);
            const timeAgo = getTimeAgo(date);
            
            return (
              <div 
                key={notification.id}
                className={`p-4 rounded-lg border transition-all ${
                  notification.read 
                    ? 'bg-white border-gray-200' 
                    : `${bg} border-${color.replace('text-', '')} border-opacity-30`
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${bg}`}>
                    <Icon 
                      category="Estados y Feedback" 
                      name={icon} 
                      className={`w-5 h-5 ${color}`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-semibold">{notification.title}</h3>
                      <span className="text-xs text-gray-500">{timeAgo}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    {notification.link && (
                      <a 
                        href={notification.link} 
                        className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.hash = notification.link || '';
                        }}
                      >
                        Ver detalles
                      </a>
                    )}
                  </div>
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="btn btn-xs btn-ghost"
                      title="Marcar como leída"
                    >
                      <Icon 
                        category="Interface" 
                        name="MdiCheck" 
                        className="w-4 h-4"
                      />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'ahora';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d`;
  
  return date.toLocaleDateString();
}

export default NotificationsCenter;