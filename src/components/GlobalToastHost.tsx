import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within GlobalToastHost');
  }
  return context;
};

export const showToast = (message: string, type: ToastType = 'info') => {
  window.dispatchEvent(new CustomEvent<{ message: string; type: ToastType }>('app:toast', {
    detail: { message, type },
  }));
};

export function GlobalToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string; type: ToastType }>;
      const { message, type } = customEvent.detail || {};
      if (!message) return;

      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev, { id, message, type: type || 'info' }]);

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 3600);
    };

    window.addEventListener('app:toast', handleToast as EventListener);
    return () => window.removeEventListener('app:toast', handleToast as EventListener);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => {
          const palette = {
            success: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
            error: 'border-rose-400/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
            info: 'border-sky-400/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
          };

          const Icon = toast.type === 'success'
            ? CheckCircle2
            : toast.type === 'error'
              ? AlertTriangle
              : Info;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex min-w-[280px] max-w-[360px] items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur ${palette[toast.type]}`}
            >
              <div className="mt-0.5 shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-sm font-medium leading-5">{toast.message}</div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
