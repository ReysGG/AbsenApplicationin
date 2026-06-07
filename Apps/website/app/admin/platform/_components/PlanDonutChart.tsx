import React from "react";

export function PlanDonutChart() {
  return (
    <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col justify-between">
      <div>
        <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-500">
          Revenue by Plan
        </h3>
        <p className="font-label-md text-xs text-on-surface-variant mb-6">Current active subscriptions</p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-[160px]">
        <svg className="transform -rotate-90" height="150" viewBox="0 0 36 36" width="150">
          <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#eceef0" strokeWidth="4"></circle>
          {/* Enterprise (45%) */}
          <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#022C22" strokeDasharray="45 55" strokeDashoffset="0" strokeWidth="4" strokeLinecap="round"></circle>
          {/* Pro (35%) */}
          <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#047857" strokeDasharray="35 65" strokeDashoffset="-45" strokeWidth="4" strokeLinecap="round"></circle>
          {/* Basic (20%) */}
          <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#34D399" strokeDasharray="20 80" strokeDashoffset="-80" strokeWidth="4" strokeLinecap="round"></circle>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-lg font-bold text-on-surface">$84.5k</span>
          <span className="font-label-md text-[10px] text-on-surface-variant">Total MRR</span>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-navy"></div>
            <span className="text-on-surface text-xs">Enterprise</span>
          </div>
          <span className="font-semibold text-on-surface text-xs">45%</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#047857]"></div>
            <span className="text-on-surface text-xs">Pro</span>
          </div>
          <span className="font-semibold text-on-surface text-xs">35%</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-mint"></div>
            <span className="text-on-surface text-xs">Basic</span>
          </div>
          <span className="font-semibold text-on-surface text-xs">20%</span>
        </div>
      </div>
    </div>
  );
}
