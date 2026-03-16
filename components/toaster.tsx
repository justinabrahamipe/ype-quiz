"use client";

import { useEffect, useState, useCallback } from "react";

type Toast = {
  id: number;
  message: string;
  type: "success" | "error" | "info";
};

let toastId = 0;
let addToastFn: ((message: string, type: Toast["type"]) => void) | null = null;

export function toast(message: string, type: Toast["type"] = "info") {
  addToastFn?.(message, type);
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast["type"]) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm animate-slide-up ${
            t.type === "success"
              ? "bg-green-600"
              : t.type === "error"
              ? "bg-red-600"
              : "bg-blue-600"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
