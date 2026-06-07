import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
}: ModalProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  }[maxWidth];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Backdrop click closer */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div
        className={cn(
          "bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg w-full p-6 relative animate-in fade-in-50 zoom-in-95 duration-200 z-10",
          maxWClass
        )}
      >
        <button
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors p-1.5 rounded-md hover:bg-surface-variant/50"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>
        <div className="mb-6">
          <h3 className="font-headline-md text-headline-md text-on-surface font-semibold text-lg">
            {title}
          </h3>
          {description && (
            <p className="font-body-md text-body-sm text-on-surface-variant mt-1">
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
