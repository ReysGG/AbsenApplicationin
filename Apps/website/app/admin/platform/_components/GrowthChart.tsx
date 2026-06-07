import React from "react";

export function GrowthChart() {
  return (
    <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-500">
            Tenant Growth
          </h3>
          <p className="font-label-md text-xs text-on-surface-variant">
            New vs Churned (Jan - Jun)
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-navy"></div>
            <span className="font-label-md text-xs text-on-surface-variant">New Tenants</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-dashed border-rose-500"></div>
            <span className="font-label-md text-xs text-on-surface-variant">Churned</span>
          </div>
        </div>
      </div>
      {/* Custom SVG Line Chart */}
      <div className="h-64 w-full relative border-l border-b border-outline-variant">
        {/* Y Axis Labels */}
        <div className="absolute -left-8 bottom-0 font-label-md text-[10px] text-on-surface-variant">0</div>
        <div className="absolute -left-10 top-1/2 -translate-y-1/2 font-label-md text-[10px] text-on-surface-variant">75</div>
        <div className="absolute -left-12 top-0 font-label-md text-[10px] text-on-surface-variant">150</div>
        
        {/* X Axis Labels */}
        <div className="absolute -bottom-6 left-0 font-label-md text-[10px] text-on-surface-variant -translate-x-1/2">Jan</div>
        <div className="absolute -bottom-6 left-[20%] font-label-md text-[10px] text-on-surface-variant -translate-x-1/2">Feb</div>
        <div className="absolute -bottom-6 left-[40%] font-label-md text-[10px] text-on-surface-variant -translate-x-1/2">Mar</div>
        <div className="absolute -bottom-6 left-[60%] font-label-md text-[10px] text-on-surface-variant -translate-x-1/2">Apr</div>
        <div className="absolute -bottom-6 left-[80%] font-label-md text-[10px] text-on-surface-variant -translate-x-1/2">May</div>
        <div className="absolute -bottom-6 right-0 font-label-md text-[10px] text-on-surface-variant translate-x-1/2">Jun</div>
        
        {/* Grid lines */}
        <div className="absolute top-0 w-full border-t border-outline-variant/20 h-0"></div>
        <div className="absolute top-1/2 w-full border-t border-outline-variant/20 h-0"></div>
        
        <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none" viewBox="0 0 100 100">
          {/* Area Fill */}
          <polygon fill="#022C22" fillOpacity="0.05" points="0,100 0,80 20,60 40,70 60,30 80,40 100,10 100,100" />
          {/* New Solid Line */}
          <polyline fill="none" points="0,80 20,60 40,70 60,30 80,40 100,10" stroke="#022C22" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Churned Dashed Line */}
          <polyline fill="none" points="0,95 20,90 40,92 60,85 80,88 100,80" stroke="#f43f5e" strokeDasharray="4 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="h-6" /> {/* spacer for labels */}
    </div>
  );
}
