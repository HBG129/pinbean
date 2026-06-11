import { CheckCircle2, XCircle } from "lucide-react";
import type { ToastItem } from "../hooks/useToasts";

export function ToastRegion({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="fixed bottom-4 right-4 z-[80] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm font-bold text-stone-700 shadow-xl dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
        >
          {toast.kind === "success" ? (
            <CheckCircle2 className="text-emerald-500" size={18} />
          ) : (
            <XCircle className="text-red-500" size={18} />
          )}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
