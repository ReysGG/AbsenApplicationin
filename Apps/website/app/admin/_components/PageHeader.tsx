import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface text-2xl font-bold tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
