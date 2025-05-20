import { ReactNode } from "react";
import { TopNavigation } from "@/components/layout/top-navigation";

type Breadcrumb = {
  label: string;
  href: string;
};

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  hideTitle?: boolean;
}

export const PageContainer = ({ 
  children,
  title,
  subtitle,
  breadcrumbs,
  hideTitle 
}: PageContainerProps) => {
  return (
    <div className="w-full">
      {/* Page Content */}
      <main className="p-4 md:p-6">
        {/* Page Header - hideTitle değeri true değilse ve subtitle varsa göster */}
        {!hideTitle && subtitle && (
          <div className="mb-6">
            {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
          </div>
        )}
        
        {/* Page Content */}
        {children}
      </main>
    </div>
  );
};
