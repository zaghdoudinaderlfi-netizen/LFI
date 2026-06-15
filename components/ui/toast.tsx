"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "info";
type Toast = { id: number; type: ToastType; message: string };

const ToastContext = createContext<{ addToast: (toast: { type: ToastType; message: string }) => void } | null>(null);

/** Affiche un petit message de confirmation/erreur en bas de l'écran. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé à l'intérieur de <ToastProvider>");
  return ctx;
}

const ICONES: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const STYLES: Record<ToastType, string> = {
  success: "border-emerald-400/40 text-emerald-300",
  error: "border-red-400/40 text-red-300",
  info: "border-neon-cyan/40 text-neon-cyan",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: { type: ToastType; message: string }) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { ...toast, id }]);
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icone = ICONES[toast.type];
            return (
              <motion.div
                key={toast.id}
                role="status"
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className={`card pointer-events-auto flex w-full max-w-sm items-start gap-3 border px-4 py-3 ${STYLES[toast.type]}`}
              >
                <Icone className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="flex-1 text-sm text-ink-primary">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  aria-label="Fermer le message"
                  className="text-ink-muted transition-colors hover:text-ink-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
