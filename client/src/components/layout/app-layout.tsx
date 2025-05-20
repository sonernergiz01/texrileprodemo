import React from "react";
import { Sidebar } from "./sidebar";
import { TopNavigation } from "./top-navigation";
import { useMobile } from "@/hooks/use-mobile";
import { useLocation } from "wouter";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isMobile, isSidebarOpen, setIsSidebarOpen } = useMobile();
  const [location] = useLocation();
  
  // Özel başlık kontrolü - boya reçeteleri sayfalarında başlığı gizle
  const isCustomHeader = location.startsWith("/dye-recipes");
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar - Mobile cihazlarda koşullu gösterim, masaüstünde sabit */}
      {(isMobile ? isSidebarOpen : true) && (
        <div className="fixed md:static inset-y-0 left-0 z-50 md:z-0">
          <Sidebar />
        </div>
      )}
      
      {/* Ana içerik */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <TopNavigation hideTitle={isCustomHeader} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      
      {/* Mobil sidebar açıkken karartma arkaplanı */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

// Boya reçeteleri modülü için geriye dönük uyumluluk
export default AppLayout;