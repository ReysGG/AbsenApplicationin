import React from "react";
import { Check } from "lucide-react";

interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-surface border-l-4 border-emerald-500 shadow-lg rounded-r-lg p-4 flex items-center gap-3 transition-all duration-300 z-50 animate-in slide-in-from-bottom-6">
      <Check className="text-emerald-500" size={18} />
      <div>
        <p className="text-xs font-semibold text-on-surface">{message}</p>
      </div>
    </div>
  );
}
