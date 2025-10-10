import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastProps = {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
};

export const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getToastIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} />;
      case 'error':
        return <AlertCircle size={16} />;
      case 'info':
        return <Info size={16} />;
      default:
        return <Info size={16} />;
    }
  };

  const getToastClassName = () => {
    switch (type) {
      case 'success':
        return 'toast success';
      case 'error':
        return 'toast error';
      case 'info':
        return 'toast info';
      default:
        return 'toast info';
    }
  };

  return (
    <div className={getToastClassName()}>
      <div className="toast-icon">{getToastIcon()}</div>
      <span className="toast-message">{message}</span>
      <button type="button" className="toast-close" onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  );
};
