import React, { useEffect } from 'react';

export interface PixelToastProps {
  message: string | null;
  type?: 'error' | 'success' | 'info';
  duration?: number;
  onClose: () => void;
}

export const PixelToast: React.FC<PixelToastProps> = ({
  message,
  type = 'error',
  duration = 3500,
  onClose,
}) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`pixel-toast ${type}`} role="alert">
      <span>{message}</span>
      <button
        type="button"
        className="pixel-toast-close"
        onClick={onClose}
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
};

export default PixelToast;
