import { useCallback, useState } from "react";

export type ToastKind = "success" | "error";

export type ToastItem = {
  id: string;
  kind: ToastKind;
  message: string;
};

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((kind: ToastKind, message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  return { toasts, showToast };
}
