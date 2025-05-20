import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, icon, actions, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div className="flex items-center gap-2">
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex-shrink-0">{actions}</div>}
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  );
}

// Export as default for backward compatibility
export default PageHeader;