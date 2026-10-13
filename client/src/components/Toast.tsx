import React, { createContext, useCallback, useContext, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onDismiss?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'success',
  onDismiss,
}) => {
  const iconMap = {
    success: <CheckCircle2 className="w-4 h-4 text-allow shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-review shrink-0" />,
    error: <XCircle className="w-4 h-4 text-block shrink-0" />,
    info: <Info className="w-4 h-4 text-primary shrink-0" />,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2.5 bg-surface border border-border rounded-lg px-3.5 py-2.5 shadow-popover text-body-sm font-medium text-ink min-w-[260px] max-w-md pointer-events-auto"
    >
      {iconMap[variant]}
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted hover:text-ink p-0.5 rounded transition-colors focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const shouldReduceMotion = useReducedMotion();

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, variant }]);
      window.setTimeout(() => {
        removeToast(id);
      }, 3000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{
                opacity: 0,
                x: shouldReduceMotion ? 0 : 40,
                y: shouldReduceMotion ? 0 : -8,
              }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{
                opacity: 0,
                x: shouldReduceMotion ? 0 : 30,
                scale: 0.95,
              }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Toast
                message={item.message}
                variant={item.variant}
                onDismiss={() => removeToast(item.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
