import { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  // --- PERSISTENCIA DE DATOS (Mantenemos tu lógica de LocalStorage) ---
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('tf_notifications');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
      return [];
    }
  });

  // Efecto para sincronizar con el almacenamiento local
  useEffect(() => {
    localStorage.setItem('tf_notifications', JSON.stringify(notifications));
  }, [notifications]);

  /* -----------------------------------------------------------
     LÓGICA DE GESTIÓN DE ALERTAS (RF-05)
     ----------------------------------------------------------- */

  // Función para añadir notificaciones desde cualquier parte de la App
  const addNotification = (type, message, taskId = null) => {
    const newNotif = {
      id: Date.now(),
      type, // 'SYSTEM', 'ASSIGNMENT', 'STATUS_CHANGE', 'COMMENT'
      message,
      taskId,
      createdAt: new Date().toISOString(),
      isRead: false // Sincronizado con NotificationsPage.jsx
    };
    
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Marcar una notificación individual como leída
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  // Marcar todo el historial como procesado (Acción masiva)
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Purgar el historial completo (RF-05.3)
  const clearNotifications = () => {
    // Mantenemos la confirmación de seguridad para evitar pérdida de datos
    if (window.confirm("¿PROCEDER CON LA PURGA TOTAL DEL HISTORIAL DE ALERTAS?")) {
      setNotifications([]);
    }
  };

  /* -----------------------------------------------------------
     MÉTRICAS Y ESTADOS DERIVADOS
     ----------------------------------------------------------- */

  // Contador dinámico para la burbuja de la campana (NotificationBell)
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        addNotification, 
        markAsRead, 
        markAllAsRead, 
        clearNotifications, 
        unreadCount 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

/* -----------------------------------------------------------
   HOOK DE CONSUMO (Solución al error de exportación de Vite)
   ----------------------------------------------------------- */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications debe usarse dentro de un NotificationProvider");
  }
  return context;
};