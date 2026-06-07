import React from "react";

interface RevenueMonth {
  month: string;
  val: number;
  highlight?: boolean;
}

const revenueMonths: RevenueMonth[] = [
  { month: "Jan", val: 40 },
  { month: "Feb", val: 45 },
  { month: "Mar", val: 52 },
  { month: "Apr", val: 48 },
  { month: "May", val: 60 },
  { month: "Jun", val: 65 },
  { month: "Jul", val: 58 },
  { month: "Aug", val: 72 },
  { month: "Sep", val: 78, highlight: true },
  { month: "Oct", val: 75 },
  { month: "Nov", val: 85 },
  { month: "Dec", val: 90 },
];

export function RevenueChart() {
  return (
    <div className="lg:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-500">
            Revenue (Last 12 Months)
          </h3>
          <p className="text-xs text-on-surface-variant">Core Subscription billing trend</p>
        </div>
        <select className="bg-surface-container-low border border-outline-variant rounded-lg text-xs font-medium px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary">
          <option>All Products</option>
          <option>Core Platform</option>
          <option>Add-ons</option>
        </select>
      </div>

      {/* Bar Chart Container */}
      <div className="flex-1 min-h-[200px] flex items-end gap-2 sm:gap-4 pt-4 relative border-b border-outline-variant/30">
        {/* Y Axis Grid Label */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-on-surface-variant font-label-md text-[10px] py-4 pr-2 border-r border-outline-variant/10 bg-surface-container-lowest z-10 w-12 sm:w-16">
          <span>$150k</span>
          <span>$100k</span>
          <span>$50k</span>
          <span>$0</span>
        </div>
        {/* Bars */}
        <div className="flex-1 flex items-end justify-between ml-14 sm:ml-20 h-full pb-4">
          {revenueMonths.map((m) => (
            <div key={m.month} className="w-full mx-0.5 sm:mx-1.5 group relative flex flex-col items-center">
              {/* Tooltip */}
              <div className="absolute -top-10 scale-0 group-hover:scale-100 bg-slate-900 text-white text-[10px] font-semibold py-1 px-2 rounded shadow transition-all duration-150 z-20 whitespace-nowrap">
                ${m.val}k
              </div>
              <div
                style={{ height: `${m.val}%` }}
                className={`w-full rounded-t-lg transition-all duration-300 ${
                  m.highlight
                    ? "bg-navy shadow-lg shadow-emerald-900/20"
                    : "bg-surface-container-high group-hover:bg-navy/50"
                }`}
              />
              <span className="absolute -bottom-6 text-[10px] font-medium text-on-surface-variant">
                {m.month}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="h-4" /> {/* spacer for absolute labels */}
    </div>
  );
}
