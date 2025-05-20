import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronDown,
  Users,
  Lock,
  Database,
  ShoppingCart,
  UserPlus,
  BarChart,
  Layers,
  Cog,
  Truck,
  MoveRight,
  Boxes,
  ClipboardCheck,
  AlertTriangle,
  Settings,
  HelpCircle,
  LogOut,
  Target,
  Calendar,
  CalendarDays,
  Tag,
  ListChecks,
  GitBranch as Route,
  User,
  ScissorsLineDashed,
  Grid3X3,
  LayoutGrid,
  LineChart,
  Ruler,
  Microscope,
  Palette,
  Clock,
  Bookmark,
  FileFile,
  FileText,
  PenTool,
  Box,
  BadgeCheck,
  Package,
  Beaker,
  TestTube,
  Eye,
  AreaChart,
  GanttChart as Gantt,
  FlaskConical,
  Sparkles as SparkleIcon,
  BrainCircuit,
  Factory,
  Bell,
  PlusCircle,
  BarChart3,
  ShieldCheck,
  CreditCard,
  QrCode
} from "lucide-react";

// Menü Bölümü bileşeni
interface MenuSectionProps {
  title: string;
  color: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isActive?: boolean;
}

const MenuSection: React.FC<MenuSectionProps> = ({ 
  title, 
  color, 
  icon,
  children, 
  defaultOpen = false,
  isActive = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen || isActive);
  const [location] = useLocation();
  
  // Herhangi bir alt menü öğesi aktifse bölümü otomatik aç
  useEffect(() => {
    const childrenArray = React.Children.toArray(children);
    
    const hasActiveChild = childrenArray.some(child => {
      if (React.isValidElement(child) && child.props.href) {
        return location === child.props.href;
      }
      return false;
    });
    
    if (hasActiveChild) {
      setIsOpen(true);
    }
  }, [location, children]);

  return (
    <div className="mb-2">
      <button 
        className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md group"
        onClick={() => setIsOpen(!isOpen)}
      >
        {React.cloneElement(icon as React.ReactElement, { 
          className: cn(
            "h-5 w-5 mr-2",
            { 'text-blue-700': isOpen, [color]: !isOpen }
          )
        })}
        <span className="text-sm font-medium flex-1 text-left">{title}</span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-gray-500 transition-transform duration-200", 
            isOpen && "transform rotate-180"
          )} 
        />
      </button>
      
      <div className={cn(
        "ml-6 space-y-1 overflow-hidden transition-all duration-200",
        isOpen ? "max-h-96 pt-1 pb-1" : "max-h-0"
      )}>
        {children}
      </div>
    </div>
  );
};

// Menü öğesi bileşeni
interface MenuItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const MenuItem: React.FC<MenuItemProps> = ({ href, icon, children }) => {
  const [location, navigate] = useLocation();
  const isActive = location === href;

  return (
    <button 
      onClick={() => navigate(href)}
      className={cn(
        "flex items-center w-full px-3 py-2 text-sm rounded-md",
        isActive 
          ? "bg-blue-50 text-blue-700 font-medium" 
          : "text-gray-700 hover:bg-gray-100"
      )}
    >
      {React.cloneElement(icon as React.ReactElement, { 
        className: cn(
          "h-4 w-4 mr-2", 
          isActive ? "text-blue-700" : "text-gray-500"
        )
      })}
      <span>{children}</span>
    </button>
  );
};

export const Sidebar: React.FC = () => {
  const { user, logoutMutation } = useAuth();
  const { isMobile, setIsSidebarOpen } = useMobile();
  const [location] = useLocation();
  const queryClient = useQueryClient();
  
  // API verilerini al
  const { data: departments = [] } = useQuery({
    queryKey: ["/api/admin/departments"],
    refetchOnWindowFocus: true,
  });
  
  const { data: userPermissions = [] } = useQuery({
    queryKey: ["/api/user/permissions"],
    refetchOnWindowFocus: true,
    refetchOnMount: true, 
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ["/api/user/roles"],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  
  // Kullanıcı departmanı
  const department = departments.find((d: any) => d.id === user?.departmentId);
  
  // İzin kontrolü
  const hasPermission = useCallback((code: string): boolean => {
    return userPermissions.some((p: any) => p.code === code);
  }, [userPermissions]);
  
  // Rol kontrolü
  const hasRole = useCallback((roleName: string): boolean => {
    return userRoles.some((r: any) => r.name === roleName);
  }, [userRoles]);
  
  // Departman kontrolü - user.departmentId ile eşleşen departman kodunu kontrol eder
  const isDepartment = useCallback((departmentCode: string): boolean => {
    // Önce kullanıcının departmanını bul
    const userDept = departments.find((d: any) => d.id === user?.departmentId);
    
    // Admin kullanıcısı tüm departmanlara erişebilir
    if (hasRole("Admin")) return true;
    
    // Departman kodu kontrolü
    return userDept?.code === departmentCode;
  }, [departments, user?.departmentId, hasRole]);
  
  // Rol bazlı erişim kontrolleri
  const isAdmin = hasRole("Admin");
  // Departman bazlı erişim kontrolleri - Kullanıcı kendi departmanı koduna göre erişebilir
  const isSales = isAdmin || isDepartment("SALES") || hasRole("Satış ve Pazarlama");
  const isProduction = isAdmin || isDepartment("PROD") || hasRole("Üretim");
  const isInventory = isAdmin || isDepartment("INV") || hasRole("Depo ve Stok");
  const isQuality = isAdmin || isDepartment("QC") || hasRole("Kalite Kontrol");
  
  // Departman bazlı menü gösterimi için ekstra kontroller - Kendi departman kodu ile eşleştir
  const isPlanning = isAdmin || isDepartment("PLN") || hasRole("Planlama");
  const isWeaving = isAdmin || isDepartment("DKM") || hasRole("Dokuma");
  const isProductDev = isAdmin || isDepartment("URG") || hasRole("ÜRGE");
  const isRawQuality = isAdmin || isDepartment("HKL") || hasRole("Ham Kalite");
  const isYarnSpinning = isAdmin || isDepartment("IBK") || hasRole("İplik Büküm");
  const isSamples = isAdmin || isDepartment("NUM") || hasRole("Numune"); 
  const isLaboratory = isAdmin || isDepartment("LAB") || hasRole("Laboratuvar");
  const isKartela = isAdmin || isDepartment("KRT") || hasRole("Kartela");
  const isYarnWarehouse = isAdmin || isDepartment("IPD") || hasRole("İplik Depo") || isInventory;
  const isWarehouse = isAdmin || isDepartment("KDP") || hasRole("Kumaş Depo") || isInventory;
  const isShipment = isAdmin || isDepartment("SVK") || hasRole("Sevkiyat");
  
  // Bakım departmanları için erişim kontrolü
  const isElectricMaintenance = isAdmin || isDepartment("ELB") || hasRole("Elektrik Bakım");
  const isMechanicalMaintenance = isAdmin || isDepartment("MKB") || hasRole("Mekanik Bakım");
  const isIT = isAdmin || isDepartment("BLG") || hasRole("Bilgi İşlem");
  // Sadece Elektrik Bakım, Mekanik Bakım ve Bilgi İşlem departmanları bakım sayfalarına erişebilir
  const isMaintenanceStaff = isElectricMaintenance || isMechanicalMaintenance || isIT;
  
  // Aktif bölümü belirleme
  const getActiveSectionFromPath = (): string => {
    if (location.startsWith("/admin")) return "admin";
    if (location.startsWith("/yonetim")) return "yonetim";
    if (location.startsWith("/sales")) return "sales";
    if (location.startsWith("/planning")) return "planning";
    if (location.startsWith("/production")) return "production";
    if (location.startsWith("/production-tracking")) return "production-tracking";
    if (location.startsWith("/weaving")) return "weaving";
    if (location.startsWith("/product-development")) return "product-development";
    if (location.startsWith("/raw-quality")) return "raw-quality";
    if (location.startsWith("/yarn-spinning")) return "yarn-spinning";
    if (location.startsWith("/samples")) return "samples";
    if (location.startsWith("/laboratory")) return "laboratory";
    if (location.startsWith("/kartela")) return "kartela";
    if (location.startsWith("/inventory")) return "inventory";
    if (location.startsWith("/quality")) return "quality";
    if (location.startsWith("/yarn-warehouse")) return "yarn-warehouse";
    if (location.startsWith("/warehouse")) return "warehouse";
    if (location.startsWith("/shipment")) return "shipment";
    if (location.startsWith("/maintenance")) return "maintenance";
    return "";
  };
  
  const activeSection = getActiveSectionFromPath();
  
  // Kullanıcı değiştiğinde yetkileri güncellemek için kullanıcı verilerini izle
  useEffect(() => {
    if (user) {
      // Kullanıcı değiştiğinde yetki ve izinleri yenile
      queryClient.invalidateQueries({ queryKey: ["/api/user/permissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/roles"] });
    }
  }, [user, queryClient]);

  // Çıkış işlemi
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="bg-white h-screen w-64 border-r border-gray-200 flex flex-col shadow-lg md:shadow-none overflow-hidden">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">Kimtex ERP</h1>
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden"
            >
              <span className="sr-only">Menüyü Kapat</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </Button>
          )}
        </div>
      </div>
      
      {/* Profil */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-blue-100 text-blue-800">
              {user?.fullName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
            <p className="text-xs text-gray-500">{department?.name || 'Departman atanmamış'}</p>
          </div>
        </div>
      </div>
      
      {/* Menü */}
      <ScrollArea className="flex-1 h-[calc(100vh-130px)] overflow-y-auto">
        <div className="p-3">
          {/* Şirket Yönetimi */}
          {isAdmin && (
            <MenuSection 
              title="Şirket Yönetimi" 
              color="text-blue-500"
              icon={<LineChart />}
              isActive={activeSection === "yonetim"}
            >
              <MenuItem href="/yonetim/dashboard" icon={<BarChart />}>
                Yönetim Paneli
              </MenuItem>
              <MenuItem href="/yonetim/finansal-rapor" icon={<CreditCard />}>
                Finansal Raporlar
              </MenuItem>
              <MenuItem href="/yonetim/uretim-raporu" icon={<Factory />}>
                Üretim Raporları
              </MenuItem>
              <MenuItem href="/yonetim/satis-raporu" icon={<ShoppingCart />}>
                Satış Raporları
              </MenuItem>
            </MenuSection>
          )}

          {/* Admin Bölümü */}
          {isAdmin && (
            <MenuSection 
              title="Admin" 
              color="text-indigo-500"
              icon={<Settings />}
              isActive={activeSection === "admin"}
            >
              <MenuItem href="/admin/users" icon={<Users />}>
                Kullanıcı Yönetimi
              </MenuItem>
              <MenuItem href="/admin/operators" icon={<Factory />}>
                Operatör Yönetimi
              </MenuItem>
              <MenuItem href="/admin/roles" icon={<Lock />}>
                Yetkilendirme
              </MenuItem>
              <MenuItem href="/admin/labels" icon={<Tag />}>
                Etiket Yönetimi
              </MenuItem>
              <MenuItem href="/admin/notification-test" icon={<Bell />}>
                Bildirim Testi
              </MenuItem>
              <MenuItem href="/admin/notification-management" icon={<Bell />}>
                Bildirim Yönetimi
              </MenuItem>
              <MenuItem href="/admin/machines-management" icon={<Cog />}>
                Makine Yönetimi
              </MenuItem>
            </MenuSection>
          )}
          
          {/* Satış ve Pazarlama */}
          {(isSales) && (
            <MenuSection 
              title="Satış ve Pazarlama" 
              color="text-blue-500"
              icon={<ShoppingCart />}
              isActive={activeSection === "sales"}
            >
              <MenuItem href="/sales/orders" icon={<ShoppingCart />}>
                Sipariş Girişi
              </MenuItem>
              <MenuItem href="/sales/customers" icon={<UserPlus />}>
                Müşteri Yönetimi
              </MenuItem>
              <MenuItem href="/sales/crm" icon={<Users />}>
                CRM
              </MenuItem>
              <MenuItem href="/sales/opportunities" icon={<Target />}>
                Fırsatlar
              </MenuItem>
              <MenuItem href="/sales/reports" icon={<BarChart />}>
                Raporlar
              </MenuItem>
              <MenuItem href="/sales/sample-requests" icon={<FileText />}>
                Numune Talepleri
              </MenuItem>
            </MenuSection>
          )}
          
          {/* Planlama - Dünya Standartları */}
          {(isPlanning || isAdmin || isProduction) && (
            <MenuSection 
              title="Planlama" 
              color="text-purple-500"
              icon={<Calendar />}
              isActive={activeSection === "planning"}
              defaultOpen={true}
            >
              <MenuItem href="/planning/advanced-dashboard" icon={<AreaChart />}>
                Planlama Merkezi
              </MenuItem>
              <MenuItem href="/planning/capacity" icon={<BrainCircuit />}>
                Kapasite Planlama
              </MenuItem>
              <MenuItem href="/planning/gantt" icon={<Gantt />}>
                Gantt Şeması
              </MenuItem>
              <MenuItem href="/planning/calendar" icon={<CalendarDays />}>
                Planlama Takvimi
              </MenuItem>
              <MenuItem href="/planning/simulation" icon={<FlaskConical />}>
                Simülasyon Merkezi
              </MenuItem>
              <MenuItem href="/planning/templates" icon={<Route />}>
                Rota Şablonları
              </MenuItem>
              <MenuItem href="/planning/kpis" icon={<LineChart />}>
                KPI Yönetimi
              </MenuItem>
              <MenuItem href="/planning/optimization" icon={<SparkleIcon />}>
                Üretim Optimizasyonu
              </MenuItem>
              <MenuItem href="/planning/monitoring" icon={<Eye />}>
                Canlı İzleme
              </MenuItem>
            </MenuSection>
          )}
          
          {/* Üretim Takibi */}
          {(isProduction || isAdmin) && (
            <MenuSection 
              title="Üretim Takibi" 
              color="text-emerald-500"
              icon={<ListChecks />}
              isActive={activeSection === "production-tracking"}
            >
              <MenuItem href="/production-tracking/refakat-cards" icon={<FileText />}>
                Refakat Kartları
              </MenuItem>
              <MenuItem href="/production-tracking/refakat-card-new" icon={<PlusCircle />}>
                Yeni Refakat Kartı
              </MenuItem>
              <MenuItem href="/production-tracking/barcode-scan" icon={<QrCode />}>
                Barkod Tarama
              </MenuItem>
            </MenuSection>
          )}
          
          {/* Dokuma Bölümü */}
          {(isWeaving || isProduction) && (
            <MenuSection 
              title="Dokuma" 
              color="text-cyan-500"
              icon={<Layers />}
              isActive={activeSection === "weaving"}
            >
              <MenuItem href="/weaving/work-orders" icon={<Layers />}>
                İş Emirleri
              </MenuItem>
              <MenuItem href="/weaving/warp-preparation" icon={<ScissorsLineDashed />}>
                Çözgü Hazırlama
              </MenuItem>
              <MenuItem href="/weaving/machines" icon={<Cog />}>
                Makine Yönetimi
              </MenuItem>
            </MenuSection>
          )}
          
          {/* ÜRGE Bölümü */}
          {(isProductDev || isProduction) && (
            <MenuSection 
              title="Ürün Geliştirme" 
              color="text-pink-500"
              icon={<PenTool />}
              isActive={activeSection === "product-development"}
            >
              <MenuItem href="/product-development/fabric-design" icon={<LayoutGrid />}>
                Kumaş Tasarımları
              </MenuItem>
              <MenuItem href="/product-development/weave-patterns" icon={<Grid3X3 />}>
                Dokuma Desenleri
              </MenuItem>
              <MenuItem href="/product-development/fabric-types" icon={<Database />}>
                Kumaş Tipleri
              </MenuItem>
            </MenuSection>
          )}
          
          {/* Ham Kalite Kontrol */}
          {(isRawQuality || isQuality || isProduction) && (
            <MenuSection 
              title="Ham Kalite Kontrol" 
              color="text-purple-500"
              icon={<ClipboardCheck />}
              isActive={activeSection === "raw-quality"}
            >
              <MenuItem href="/raw-quality/inspection" icon={<ClipboardCheck />}>
                Muayene
              </MenuItem>
              <MenuItem href="/raw-quality/defects" icon={<AlertTriangle />}>
                Kusur Raporlama
              </MenuItem>
            </MenuSection>
          )}

          {/* İplik Büküm */}
          {(isYarnSpinning || isProduction) && (
            <MenuSection 
              title="İplik Büküm" 
              color="text-fuchsia-500"
              icon={<Clock className="rotate-90" />}
              isActive={activeSection === "yarn-spinning"}
            >
              <MenuItem href="/yarn-spinning/work-orders" icon={<Layers />}>
                İş Emirleri
              </MenuItem>
              <MenuItem href="/yarn-spinning/twisting-orders" icon={<Clock />}>
                Büküm Siparişleri
              </MenuItem>
              <MenuItem href="/yarn-spinning/machines" icon={<Cog />}>
                Makine Yönetimi
              </MenuItem>
            </MenuSection>
          )}
          
          {/* Numune Bölümü */}
          {(isSamples) && (
            <MenuSection 
              title="Numune Bölümü" 
              color="text-orange-500"
              icon={<Bookmark />}
              isActive={activeSection === "samples"}
            >
              <MenuItem href="/samples/requests" icon={<Layers />}>
                Numune Talepleri
              </MenuItem>
              <MenuItem href="/samples/tracking" icon={<LineChart />}>
                Numune Takibi
              </MenuItem>
              <MenuItem href="/samples/cards" icon={<QrCode />}>
                Numune Kartları
              </MenuItem>
            </MenuSection>
          )}

          {/* Laboratuvar */}
          {(isLaboratory || isQuality || isProduction) && (
            <MenuSection 
              title="Laboratuvar" 
              color="text-cyan-600"
              icon={<Beaker />}
              isActive={activeSection === "laboratory"}
            >
              <MenuItem href="/laboratory/yarn-tests" icon={<Ruler />}>
                İplik Testleri
              </MenuItem>
              <MenuItem href="/laboratory/fabric-tests" icon={<Microscope />}>
                Kumaş Testleri
              </MenuItem>
            </MenuSection>
          )}
          
          {/* Kartela */}
          {(isKartela) && (
            <MenuSection 
              title="Kartela" 
              color="text-emerald-600"
              icon={<Palette />}
              isActive={activeSection === "kartela"}
            >
              <MenuItem href="/fabric-samples/kartela" icon={<Bookmark />}>
                Kartela Yönetimi
              </MenuItem>
              <MenuItem href="/fabric-samples/kartela/ship" icon={<Truck />}>
                Kartela Sevkiyat
              </MenuItem>
              <MenuItem href="/fabric-samples/kartela/reports" icon={<FileText />}>
                Kartela Raporları
              </MenuItem>
              <MenuItem href="/fabric-samples/kartela/qr-print" icon={<QrCode />}>
                QR Kod Yazdır
              </MenuItem>
            </MenuSection>
          )}
          

          
          {/* Depo ve Stok */}
          {(isInventory) && (
            <MenuSection 
              title="Depo ve Stok" 
              color="text-amber-500"
              icon={<Box />}
              isActive={activeSection === "inventory"}
            >
              <MenuItem href="/inventory/raw-materials" icon={<Database />}>
                Hammaddeler
              </MenuItem>
            </MenuSection>
          )}
          
          {/* Kalite Kontrol */}
          {(isQuality) && (
            <MenuSection 
              title="Kalite Kontrol" 
              color="text-red-500"
              icon={<BadgeCheck />}
              isActive={activeSection === "quality"}
            >
              <MenuItem href="/quality/final-inspection" icon={<ClipboardCheck />}>
                Final Kalite Kontrol
              </MenuItem>
              <MenuItem href="/quality/control" icon={<Microscope />}>
                İşlem Girişi
              </MenuItem>
              <MenuItem href="/quality/issues" icon={<AlertTriangle />}>
                Hata Raporları
              </MenuItem>
              <MenuItem href="/quality/reports" icon={<BarChart />}>
                Raporlar
              </MenuItem>
            </MenuSection>
          )}
          
          {/* Boya Reçeteleri */}
          {(isQuality || isProductDev || isAdmin) && (
            <MenuSection 
              title="Boya Reçeteleri" 
              color="text-cyan-600"
              icon={<TestTube />}
              isActive={activeSection === "dye-recipes"}
            >
              <MenuItem href="/dye-recipes/list" icon={<Beaker />}>
                Reçete Listesi
              </MenuItem>
              <MenuItem href="/dye-recipes/new" icon={<PlusCircle />}>
                Yeni Reçete
              </MenuItem>
              <MenuItem href="/dye-recipes/pending-assignments" icon={<Clock />}>
                İş Listesi
              </MenuItem>
              <MenuItem href="/dye-recipes/chemicals" icon={<TestTube />}>
                Kimyasallar
              </MenuItem>
              <MenuItem href="/dye-recipes/templates" icon={<Bookmark />}>
                Reçete Şablonları
              </MenuItem>
              <MenuItem href="/dye-recipes/reports" icon={<BarChart3 />}>
                Raporlar
              </MenuItem>
            </MenuSection>
          )}
          
          {/* İplik Depo */}
          {(isYarnWarehouse || isInventory) && (
            <MenuSection 
              title="İplik Depo" 
              color="text-yellow-700"
              icon={<Package />}
              isActive={activeSection === "yarn-warehouse"}
            >
              <MenuItem href="/yarn-warehouse/inventory" icon={<Boxes />}>
                Envanter
              </MenuItem>
              <MenuItem href="/yarn-warehouse/issue-cards" icon={<FileText />}>
                İplik Çıkış Kartları
              </MenuItem>
              <MenuItem href="/yarn-warehouse/movements" icon={<MoveRight />}>
                Hareketler
              </MenuItem>
              <MenuItem href="/yarn-warehouse/reports" icon={<BarChart />}>
                Raporlar
              </MenuItem>
              <MenuItem href="/yarn-warehouse/yarn-types" icon={<Database />}>
                İplik Tipleri
              </MenuItem>
            </MenuSection>
          )}
          
          {/* Kumaş Depo */}
          {(isWarehouse || isInventory) && (
            <MenuSection 
              title="Kumaş Depo" 
              color="text-amber-500"
              icon={<Boxes />}
              isActive={activeSection === "warehouse"}
            >
              <MenuItem href="/warehouse/inventory" icon={<Boxes />}>
                Envanter
              </MenuItem>
              <MenuItem href="/warehouse/movements" icon={<MoveRight />}>
                Stok Hareketleri
              </MenuItem>
              <MenuItem href="/warehouse/reports" icon={<BarChart />}>
                Raporlar
              </MenuItem>
            </MenuSection>
          )}

          {/* Sevkiyat Bölümü */}
          {(isShipment) && (
            <MenuSection 
              title="Sevkiyat" 
              color="text-blue-600"
              icon={<Truck />}
              isActive={activeSection === "shipment"}
            >
              <MenuItem href="/shipment/planning" icon={<Calendar />}>
                Sevkiyat Planlaması
              </MenuItem>
              <MenuItem href="/shipment/documents" icon={<FileText />}>
                İrsaliye/Fatura
              </MenuItem>
              <MenuItem href="/shipment/packaging" icon={<Package />}>
                Ambalajlama
              </MenuItem>
              <MenuItem href="/shipment/tracking" icon={<LineChart />}>
                Sevkiyat Takibi
              </MenuItem>
            </MenuSection>
          )}
          
          {/* Bakım Bölümü - Sadece bakım departmanlarına (Elektrik, Mekanik, Bilgi İşlem) göster */}
          {isMaintenanceStaff && (
            <MenuSection 
              title="Bakım" 
              color="text-orange-600"
              icon={<Settings />}
              isActive={activeSection === "maintenance"}
            >
              <MenuItem href="/maintenance" icon={<ClipboardCheck />}>
                Bakım Talepleri
              </MenuItem>
              <MenuItem href="/maintenance/create" icon={<FileText />}>
                Talep Oluştur
              </MenuItem>
              <MenuItem href="/maintenance/plans" icon={<Calendar />}>
                Bakım Planları
              </MenuItem>
              <MenuItem href="/maintenance/plans/create" icon={<PlusCircle className="h-4 w-4" />}>
                Plan Oluştur
              </MenuItem>
              <MenuItem href="/maintenance/reports" icon={<BarChart3 className="h-4 w-4" />}>
                Raporlar
              </MenuItem>
            </MenuSection>
          )}
        </div>
      </ScrollArea>
      
      {/* Alt Menü */}
      <div className="p-3 border-t border-gray-200">
        <MenuItem href="/settings" icon={<Settings />}>
          Ayarlar
        </MenuItem>
        <MenuItem href="/help" icon={<HelpCircle />}>
          Yardım
        </MenuItem>
        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 mt-1 text-sm text-gray-700 rounded-md hover:bg-gray-100"
        >
          <LogOut className="h-4 w-4 mr-2 text-gray-500" />
          <span>Çıkış</span>
        </button>
      </div>
    </div>
  );
};
