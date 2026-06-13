"use client";

/**
 * components/ui/toast.tsx
 *
 * Lightweight, dependency-free toast system for centralized success/error
 * feedback across the dashboard (audit §15 — several actions previously failed
 * silently via `catch {}`).
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast({ title: "Tersimpan", variant: "success" });
 *   toast({ title: "Gagal", description: err.message, variant: "error" });
 *
 * Mount <ToastProvider> once near the root of an authenticated area; it renders
 * its own fixed container.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "info";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Auto-dismiss after this many ms (default 4000). 0 disables auto-dismiss. */
  durationMs?: number;
}

interface ToastItem extends Required<Omit<ToastOptions, "durationMs">> {
  id: number;
  durationMs: number;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_META: Record<
  ToastVariant,
  { icon: React.ReactNode; border: string; iconColor: string }
> = {
  success: {
    icon: <CheckCircle2 size={18} />,
    border: "border-emerald-500",
    iconColor: "text-emerald-500",
  },
  error: {
    icon: <AlertCircle size={18} />,
    border: "border-rose-500",
    iconColor: "text-rose-500",
  },
  info: {
    icon: <Info size={18} />,
    border: "border-sky-500",
    iconColor: "text-sky-500",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (opts: ToastOptions) => {
      const id = ++counter.current;
      const item: ToastItem = {
        id,
        title: opts.title,
        description: opts.description ?? "",
        variant: opts.variant ?? "info",
        durationMs: opts.durationMs ?? 4000,
      };
      setToasts((prev) => [...prev, item]);
      if (item.durationMs > 0) {
        setTimeout(() => dismiss(id), item.durationMs);
      }
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-[min(360px,calc(100vw-3rem))]"
        role="region"
        aria-label="Notifikasi"
      >
        {toasts.map((t) => {
          const meta = VARIANT_META[t.variant];
          return (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              className={`bg-white border-l-4 ${meta.border} shadow-lg rounded-r-lg p-4 flex items-start gap-3 animate-in slide-in-from-bottom-4 fade-in`}
            >
              <span className={`${meta.iconColor} shrink-0 mt-0.5`}>
                {meta.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-gray-500 mt-0.5 break-words">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Tutup notifikasi"
                className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}
