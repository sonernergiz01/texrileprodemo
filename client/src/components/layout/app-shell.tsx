import React, { ReactNode } from "react";
import { TopNavigation } from "@/components/layout/top-navigation";
import { useAuth } from "@/hooks/use-auth";

interface AppShellProps {
  children: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <TopNavigation />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};