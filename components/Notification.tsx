import React, { useState, useEffect } from 'react';
import { useNotification, NotificationType } from '../contexts/NotificationContext';
import { InfoIcon, CheckCircleIcon, AlertTriangleIcon } from './Icons';

interface NotificationItemProps {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  onDismiss: (id: string) => void;
}

const NOTIFICATION_ICONS: Record<NotificationType, React.ElementType> = {
  info: InfoIcon,
  success: CheckCircleIcon,
  warning: AlertTriangleIcon,
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  info: 'text-cyan-400',
  success: 'text-green-400',
  warning: 'text-yellow-400',
};

const NotificationItem: React.FC<NotificationItemProps> = ({ id, title, message, type, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(id), 300); // Animation duration
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timerId);
  }, [id, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(id), 300);
  };

  const Icon = NOTIFICATION_ICONS[type];
  const color = NOTIFICATION_COLORS[type];

  return (
    <div
      className={`relative w-full bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 rounded-lg shadow-2xl shadow-cyan-500/10 p-4 flex items-start space-x-4 overflow-hidden ${isExiting ? 'animate-fadeOut' : 'animate-slideInRight'}`}
      onClick={handleDismiss}
      role="alert"
    >
      <div className="flex-shrink-0">
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div className="flex-1">
        <h4 className={`font-display font-bold ${color}`}>{title}</h4>
        <p className="text-sm text-slate-300 mt-1">{message}</p>
      </div>
    </div>
  );
};


export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm space-y-3">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          {...notification}
          onDismiss={removeNotification}
        />
      ))}
    </div>
  );
};