import React from "react";
import { CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    Hadir: {
      cls: "status-badge--success",
      icon: <CheckCircle2 size={12} />,
    },
    Izin: {
      cls: "status-badge--warning",
      icon: <AlertCircle size={12} />,
    },
    Terlambat: {
      cls: "status-badge--error",
      icon: <XCircle size={12} />,
    },
    Lembur: {
      cls: "status-badge--info",
      icon: <Clock size={12} />,
    },
  };
  const { cls, icon } = map[status] ?? { cls: "", icon: null };
  return (
    <span className={cn("status-badge", cls)}>
      {icon}
      {status}
    </span>
  );
}
