"use client";

import { useState, useCallback, createContext, useContext, type ReactNode } from "react";

interface ToastContextType {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
    setTimeout(() => setVisible(false), 1800);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {visible && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200]" style={{ animation: "slide-up 0.3s ease-out" }}>
          <div
            className="px-5 py-3 text-white text-sm font-semibold rounded-full whitespace-nowrap flex items-center gap-2"
            style={{ background: "var(--color-accent)", boxShadow: "0 8px 30px rgba(255,77,0,0.2)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            {message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
