"use client";

import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  onRetry?: () => void;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => string;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string, onRetry?: () => void) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, onRetry }: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, title, message, onRetry }]);

      // Auto-dismiss after 5 seconds if no retry action
      if (!onRetry) {
        setTimeout(() => {
          removeToast(id);
        }, 5000);
      }
      return id;
    },
    [removeToast],
  );

  const success = useCallback(
    (title: string, message?: string) => {
      showToast({ type: "success", title, message });
    },
    [showToast],
  );

  const error = useCallback(
    (title: string, message?: string, onRetry?: () => void) => {
      showToast({ type: "error", title, message, onRetry });
    },
    [showToast],
  );

  const info = useCallback(
    (title: string, message?: string) => {
      showToast({ type: "info", title, message });
    },
    [showToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast, success, error, info }}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
        aria-live="polite"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#171a21] shadow-elevated p-3.5 flex items-start gap-3 animate-enter text-[#e8eaf0]"
            role={toast.type === "error" ? "alert" : "status"}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {toast.type === "success" && (
                <div className="h-5 w-5 rounded-full bg-[rgba(62,207,142,0.15)] text-[#3ecf8e] flex items-center justify-center">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {toast.type === "error" && (
                <div className="h-5 w-5 rounded-full bg-[rgba(239,91,91,0.15)] text-[#ef5b5b] flex items-center justify-center">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              {toast.type === "info" && (
                <div className="h-5 w-5 rounded-full bg-[rgba(124,140,255,0.15)] text-[#7c8cff] flex items-center justify-center">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#e8eaf0]">{toast.title}</p>
              {toast.message && (
                <p className="text-xs text-[#8b91a1] mt-0.5 line-clamp-3">{toast.message}</p>
              )}
              {toast.onRetry && (
                <button
                  type="button"
                  onClick={() => {
                    removeToast(toast.id);
                    toast.onRetry?.();
                  }}
                  className="mt-2 text-xs font-semibold text-[#7c8cff] hover:underline inline-flex items-center gap-1"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry
                </button>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-[#8b91a1] hover:text-[#e8eaf0] p-0.5 rounded transition-colors"
              aria-label="Dismiss notification"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
