import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useMobile } from "@/hooks/use-mobile";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  Menu,
  Search,
  Settings,
  HelpCircle,
  LogOut,
  AlertCircle,
  WrenchIcon
} from "lucide-react";

type Breadcrumb = {
  label: string;
  href: string;
};

interface TopNavigationProps {
  title?: string;
  breadcrumbs?: Breadcrumb[];
  hideTitle?: boolean;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({ 
  title = '', 
  breadcrumbs = [],
  hideTitle = false
}: TopNavigationProps) => {
  const { user, logoutMutation } = useAuth();
  const { isMobile, setIsSidebarOpen } = useMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [_, navigate] = useLocation();
  
  const { data: departments = [] } = useQuery({
    queryKey: ["/api/admin/departments"],
  });
  
  const department = departments.find((d: any) => d.id === user?.departmentId);
  
  // Geçerli konum için başlık belirleme
  const [location] = useLocation();
  
  const getLocationTitle = (): string => {
    if (location.startsWith("/admin/users")) return "Kullanıcı Yönetimi";
    if (location.startsWith("/admin/roles")) return "Yetkilendirme";
    if (location.startsWith("/admin")) return "Admin";
    if (location.startsWith("/sales/orders")) return "Sipariş Girişi";
    if (location.startsWith("/sales/customers")) return "Müşteri Yönetimi";
    if (location.startsWith("/sales/crm")) return "CRM";
    if (location.startsWith("/sales/opportunities")) return "Fırsatlar";
    if (location.startsWith("/sales")) return "Satış ve Pazarlama";
    if (location.startsWith("/production")) return "Üretim";
    if (location.startsWith("/inventory")) return "Depo ve Stok";
    if (location.startsWith("/quality")) return "Kalite Kontrol";
    if (location.startsWith("/dye-recipes")) return "Boya Reçeteleri"; 
    return department?.name || "Kimtex ERP";
  };
  
  // Çıkış işlemi
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <header className="bg-white border-b border-gray-200 z-20">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Sol Taraf: Menü Düğmesi ve Başlık */}
        <div className="flex items-center">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menüyü Aç</span>
            </Button>
          )}
          <div className="text-xl font-semibold text-gray-800 flex items-center">
            {!isMobile && (
              <svg className="h-7 w-7 mr-2 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
            )}
            {!hideTitle && getLocationTitle()}
          </div>
        </div>
        
        {/* Sağ Taraf: Arama, Bildirimler ve Profil */}
        <div className="flex items-center space-x-3">
          {/* Arama kutusu */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Ara..."
              className="w-56 pl-9 h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Bildirimler */}
          <NotificationBell />
          
          {/* Profil */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 px-2 rounded-full hover:bg-gray-100 flex items-center space-x-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-blue-100 text-blue-800">
                    {user?.fullName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline-block">
                  {user?.fullName?.split(' ')[0]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                  <p className="text-xs text-gray-500">{department?.name || 'Departman atanmamış'}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4 text-gray-500" />
                <span>Ayarlar</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/help')}>
                <HelpCircle className="mr-2 h-4 w-4 text-gray-500" />
                <span>Yardım</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/maintenance/create-request')}>
                <WrenchIcon className="mr-2 h-4 w-4 text-gray-500" />
                <span>Bakım Talebi Oluştur</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4 text-gray-500" />
                <span>Çıkış Yap</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Breadcrumb - Eğer varsa göster */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <nav className="flex items-center text-sm">
            <a 
              href="/" 
              className="text-gray-500 hover:text-blue-600"
              onClick={(e) => { e.preventDefault(); navigate('/'); }}
            >
              Ana Sayfa
            </a>
            
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-gray-800 font-medium">{crumb.label}</span>
                ) : (
                  <a 
                    href={crumb.href}
                    className="text-gray-500 hover:text-blue-600"
                    onClick={(e) => { e.preventDefault(); navigate(crumb.href); }}
                  >
                    {crumb.label}
                  </a>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};
