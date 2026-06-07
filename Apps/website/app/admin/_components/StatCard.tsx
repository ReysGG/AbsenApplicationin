import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  changeLabel?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  gradientCls?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  isPositive = true,
  icon,
  iconBgColor = "bg-primary-container/20",
  iconColor = "text-primary",
  gradientCls = "bg-primary-container/10",
}: StatCardProps) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-200">
      <div
        className={cn(
          "absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110",
          gradientCls
        )}
      />
      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-2">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-xs font-semibold">
            {title}
          </p>
          <h3 className="font-display text-display text-on-surface text-3xl font-bold tracking-tight">
            {value}
          </h3>
          {(change !== undefined || changeLabel) && (
            <div className="flex items-center gap-1.5 font-body-sm text-sm">
              {change !== undefined && (
                <span
                  className={cn(
                    "font-semibold flex items-center gap-0.5",
                    isPositive ? "text-emerald-600" : "text-rose-600"
                  )}
                >
                  {isPositive ? "▲" : "▼"} {change}
                </span>
              )}
              {changeLabel && (
                <span className="text-on-surface-variant/70 text-xs">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            "p-3 rounded-lg flex items-center justify-center relative z-10",
            iconBgColor,
            iconColor
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
