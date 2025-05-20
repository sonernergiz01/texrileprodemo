import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  Search, 
  Download,
  Filter,
  ChevronDown,
  BarChart,
  PieChart,
  LineChart,
  FileBarChart,
  FileText,
  Calendar,
  ArrowDownToLine,
  Printer,
  Share2,
  PackageCheck,
  Package,
  Boxes,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  Clock,
  CircleDollarSign,
  RefreshCcw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const YarnReportsPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("inventory");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("this-month");
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierFilter, setSupplierFilter] = useState<string | null>(null);
  const [yarnTypeFilter, setYarnTypeFilter] = useState<string | null>(null);
  const [reportStartDate, setReportStartDate] = useState<string>(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // İplik envanteri verisini çek
  const { data: yarnInventory = [], isLoading: isLoadingInventory } = useQuery({
    queryKey: ["/api/yarn-warehouse/inventory"],
  });

  // İplik hareketleri verisini çek
  const { data: yarnMovements = [], isLoading: isLoadingMovements } = useQuery({
    queryKey: ["/api/yarn-warehouse/movements"],
  });

  // İplik tipleri verisini çek
  const { data: yarnTypes = [] } = useQuery({
    queryKey: ["/api/admin/yarn-types"],
  });

  // Tedarikçiler verisini çek
  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/admin/suppliers"],
  });

  // Stok raporları verisini çek
  const { data: inventoryMetrics = {}, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["/api/yarn-warehouse/metrics"],
  });

  // Tükenme riski raporu
  const getLowStockItems = () => {
    return yarnInventory.filter((item: any) => 
      item.stockQuantity <= item.minStockLevel * 1.2
    ).sort((a: any, b: any) => 
      (a.stockQuantity / a.minStockLevel) - (b.stockQuantity / b.minStockLevel)
    );
  };

  // Stok devir hızı
  const getStockTurnoverRate = (yarnId: string) => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);
    
    const movements = yarnMovements.filter((m: any) => 
      m.yarnId === yarnId && 
      m.movementType === "Çıkış" &&
      new Date(m.moveDate) >= startDate
    );
    
    const totalOutflow = movements.reduce((sum: number, m: any) => sum + m.quantity, 0);
    const yarn = yarnInventory.find((y: any) => y.yarnId === yarnId);
    
    if (!yarn || yarn.stockQuantity === 0) return 0;
    
    // 3 aylık çıkış / ortalama stok seviyesi
    return totalOutflow / yarn.stockQuantity;
  };

  // Envanter değeri
  const calculateInventoryValue = () => {
    return yarnInventory.reduce((sum: number, item: any) => {
      return sum + (item.stockQuantity * item.unitPrice);
    }, 0);
  };

  // Tedarikçi bazlı envanter
  const getInventoryBySupplier = () => {
    const result: any = {};
    
    yarnInventory.forEach((item: any) => {
      if (!result[item.supplier]) {
        result[item.supplier] = {
          quantity: 0,
          value: 0,
          items: 0,
        };
      }
      
      result[item.supplier].quantity += item.stockQuantity;
      result[item.supplier].value += (item.stockQuantity * item.unitPrice);
      result[item.supplier].items += 1;
    });
    
    return Object.entries(result).map(([supplier, data]: [string, any]) => ({
      supplier,
      ...data,
    })).sort((a: any, b: any) => b.value - a.value);
  };

  // İplik tipi bazlı envanter
  const getInventoryByYarnType = () => {
    const result: any = {};
    
    yarnInventory.forEach((item: any) => {
      if (!result[item.yarnType]) {
        result[item.yarnType] = {
          quantity: 0,
          value: 0,
          items: 0,
        };
      }
      
      result[item.yarnType].quantity += item.stockQuantity;
      result[item.yarnType].value += (item.stockQuantity * item.unitPrice);
      result[item.yarnType].items += 1;
    });
    
    return Object.entries(result).map(([yarnType, data]: [string, any]) => ({
      yarnType,
      ...data,
    })).sort((a: any, b: any) => b.quantity - a.quantity);
  };

  // Günlük hareketler
  const getDailyMovements = () => {
    const result: any = {};
    const endDate = new Date(reportEndDate);
    let currentDate = new Date(reportStartDate);
    
    // Tüm tarihler için boş array oluştur
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      result[dateKey] = {
        inflow: 0,
        outflow: 0,
        transfers: 0,
      };
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Hareketleri tarihlere göre grupla
    yarnMovements.forEach((movement: any) => {
      const moveDate = movement.moveDate;
      if (moveDate >= reportStartDate && moveDate <= reportEndDate) {
        if (!result[moveDate]) {
          result[moveDate] = {
            inflow: 0,
            outflow: 0,
            transfers: 0,
          };
        }
        
        if (movement.movementType === "Giriş") {
          result[moveDate].inflow += movement.quantity;
        } else if (movement.movementType === "Çıkış") {
          result[moveDate].outflow += movement.quantity;
        } else if (movement.movementType === "Transfer") {
          result[moveDate].transfers += movement.quantity;
        }
      }
    });
    
    return Object.entries(result).map(([date, data]: [string, any]) => ({
      date,
      ...data,
      netChange: data.inflow - data.outflow,
    })).sort((a: any, b: any) => a.date.localeCompare(b.date));
  };

  // Tedarikçi bazlı giriş
  const getInflowBySupplier = () => {
    const result: any = {};
    
    const relevantMovements = yarnMovements.filter((m: any) => 
      m.movementType === "Giriş" &&
      m.moveDate >= reportStartDate && 
      m.moveDate <= reportEndDate
    );
    
    relevantMovements.forEach((movement: any) => {
      const yarn = yarnInventory.find((y: any) => y.yarnId === movement.yarnId);
      if (!yarn) return;
      
      const supplier = yarn.supplier;
      
      if (!result[supplier]) {
        result[supplier] = {
          quantity: 0,
          movements: 0,
        };
      }
      
      result[supplier].quantity += movement.quantity;
      result[supplier].movements += 1;
    });
    
    return Object.entries(result).map(([supplier, data]: [string, any]) => ({
      supplier,
      ...data,
    })).sort((a: any, b: any) => b.quantity - a.quantity);
  };

  // Departman bazlı çıkış
  const getOutflowByDepartment = () => {
    const result: any = {};
    
    const relevantMovements = yarnMovements.filter((m: any) => 
      m.movementType === "Çıkış" &&
      m.moveDate >= reportStartDate && 
      m.moveDate <= reportEndDate &&
      m.departmentId
    );
    
    relevantMovements.forEach((movement: any) => {
      const departmentId = movement.departmentId;
      const departmentName = movement.departmentName || `Departman ${departmentId}`;
      
      if (!result[departmentName]) {
        result[departmentName] = {
          quantity: 0,
          movements: 0,
        };
      }
      
      result[departmentName].quantity += movement.quantity;
      result[departmentName].movements += 1;
    });
    
    return Object.entries(result).map(([department, data]: [string, any]) => ({
      department,
      ...data,
    })).sort((a: any, b: any) => b.quantity - a.quantity);
  };

  // Raporu indir
  const handleDownloadReport = (format: string) => {
    toast({
      title: "Rapor indiriliyor",
      description: `İplik raporu ${format.toUpperCase()} formatında indiriliyor...`,
    });
    // Gerçek uygulamada burada API'ye istek atılacak
  };

  // Raporu yazdır
  const handlePrintReport = () => {
    toast({
      title: "Rapor yazdırılıyor",
      description: "İplik raporu yazdırma sayfası açılıyor...",
    });
    // Gerçek uygulamada yazdırma işlemi burada yapılacak
    window.print();
  };

  // Dönem seçim işlevi
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    
    // Tarihleri otomatik ayarla
    const today = new Date();
    let startDate = new Date();
    
    if (value === "this-week") {
      // Haftanın başlangıcı (Pazartesi)
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(today.setDate(diff));
    } else if (value === "this-month") {
      // Ayın başlangıcı
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (value === "last-month") {
      // Geçen ay
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      today.setDate(0); // Geçen ayın son günü
    } else if (value === "last-quarter") {
      // Son çeyrek (3 ay)
      startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
    } else if (value === "this-year") {
      // Bu yıl
      startDate = new Date(today.getFullYear(), 0, 1);
    }
    
    setReportStartDate(startDate.toISOString().split('T')[0]);
    setReportEndDate(new Date().toISOString().split('T')[0]);
  };

  // Yükleme durumu
  if (isLoadingInventory || isLoadingMovements || isLoadingMetrics) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Tükenme riski olan iplikler
  const lowStockItems = getLowStockItems();
  
  // Toplam envanter değeri
  const totalInventoryValue = calculateInventoryValue();
  
  // Tedarikçi bazlı envanter
  const inventoryBySupplier = getInventoryBySupplier();
  
  // İplik tipi bazlı envanter
  const inventoryByYarnType = getInventoryByYarnType();
  
  // Günlük hareketler
  const dailyMovements = getDailyMovements();
  
  // Tedarikçi bazlı giriş
  const inflowBySupplier = getInflowBySupplier();
  
  // Departman bazlı çıkış
  const outflowByDepartment = getOutflowByDepartment();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="İplik Depo Raporları" 
        description="İplik envanterini ve stok hareketlerini analiz edin"
      />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="w-full">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium">Rapor Türü</h3>
            </div>
          
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Raporda ara..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Dönem seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-week">Bu Hafta</SelectItem>
                  <SelectItem value="this-month">Bu Ay</SelectItem>
                  <SelectItem value="last-month">Geçen Ay</SelectItem>
                  <SelectItem value="last-quarter">Son Çeyrek</SelectItem>
                  <SelectItem value="this-year">Bu Yıl</SelectItem>
                  <SelectItem value="custom">Özel Tarih Aralığı</SelectItem>
                </SelectContent>
              </Select>
              
              {selectedPeriod === "custom" && (
                <>
                  <Input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="w-full sm:w-auto"
                  />
                  <Input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="w-full sm:w-auto"
                  />
                </>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <ArrowDownToLine className="h-4 w-4 mr-2" />
                    Dışa Aktar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Rapor Formatı</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleDownloadReport('pdf')}>
                    <FileText className="h-4 w-4 mr-2" />
                    PDF olarak indir
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadReport('excel')}>
                    <FileBarChart className="h-4 w-4 mr-2" />
                    Excel olarak indir
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handlePrintReport}>
                    <Printer className="h-4 w-4 mr-2" />
                    Yazdır
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="inventory">Envanter</TabsTrigger>
              <TabsTrigger value="movements">Hareketler</TabsTrigger>
              <TabsTrigger value="analysis">Analiz</TabsTrigger>
              <TabsTrigger value="alerts">Uyarılar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="inventory" className="m-0 space-y-4">
        {/* Özet Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toplam İplik Stok Miktarı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {yarnInventory.reduce((sum: number, item: any) => sum + item.stockQuantity, 0).toFixed(2)} kg
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tüm iplik türleri için toplam stok
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toplam Envanter Değeri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalInventoryValue.toLocaleString('tr-TR')} TL
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tüm iplik stoklarının toplam değeri
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Farklı İplik Türü</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(yarnInventory.map((item: any) => item.yarnType)).size}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Envanterdeki benzersiz iplik türleri
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Düşük Stok Öğeleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {lowStockItems.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Minimum seviyeye yakın/altında olan stoklar
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Tedarikçi Bazlı Dağılım */}
        <Card>
          <CardHeader>
            <CardTitle>Tedarikçi Bazlı Envanter</CardTitle>
            <CardDescription>
              İplik tedarikçilerine göre stok dağılımı
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tedarikçi</TableHead>
                  <TableHead>Toplam Miktar</TableHead>
                  <TableHead>Envanter Değeri</TableHead>
                  <TableHead>Farklı İplik Sayısı</TableHead>
                  <TableHead>Dağılım (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryBySupplier.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.supplier}</TableCell>
                    <TableCell>{item.quantity.toFixed(2)} kg</TableCell>
                    <TableCell>{item.value.toLocaleString('tr-TR')} TL</TableCell>
                    <TableCell>{item.items}</TableCell>
                    <TableCell>
                      {((item.value / totalInventoryValue) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* İplik Tipi Bazlı Dağılım */}
        <Card>
          <CardHeader>
            <CardTitle>İplik Tipine Göre Envanter</CardTitle>
            <CardDescription>
              İplik türlerine göre stok dağılımı
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İplik Tipi</TableHead>
                  <TableHead>Toplam Miktar</TableHead>
                  <TableHead>Envanter Değeri</TableHead>
                  <TableHead>Farklı Çeşit Sayısı</TableHead>
                  <TableHead>Miktar Dağılımı (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryByYarnType.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.yarnType}</TableCell>
                    <TableCell>{item.quantity.toFixed(2)} kg</TableCell>
                    <TableCell>{item.value.toLocaleString('tr-TR')} TL</TableCell>
                    <TableCell>{item.items}</TableCell>
                    <TableCell>
                      {((item.quantity / yarnInventory.reduce((sum: number, item: any) => sum + item.stockQuantity, 0)) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="movements" className="m-0 space-y-4">
        {/* Hareket Özet Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toplam Stok Girişi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {yarnMovements
                  .filter((m: any) => m.movementType === "Giriş" && m.moveDate >= reportStartDate && m.moveDate <= reportEndDate)
                  .reduce((sum: number, m: any) => sum + m.quantity, 0).toFixed(2)
                } kg
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">{reportStartDate}</span> - <span className="font-medium">{reportEndDate}</span> arası
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toplam Stok Çıkışı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {yarnMovements
                  .filter((m: any) => m.movementType === "Çıkış" && m.moveDate >= reportStartDate && m.moveDate <= reportEndDate)
                  .reduce((sum: number, m: any) => sum + m.quantity, 0).toFixed(2)
                } kg
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">{reportStartDate}</span> - <span className="font-medium">{reportEndDate}</span> arası
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toplam Transfer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {yarnMovements
                  .filter((m: any) => m.movementType === "Transfer" && m.moveDate >= reportStartDate && m.moveDate <= reportEndDate)
                  .reduce((sum: number, m: any) => sum + m.quantity, 0).toFixed(2)
                } kg
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">{reportStartDate}</span> - <span className="font-medium">{reportEndDate}</span> arası
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Net Stok Değişimi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center">
                {(() => {
                  const inflow = yarnMovements
                    .filter((m: any) => m.movementType === "Giriş" && m.moveDate >= reportStartDate && m.moveDate <= reportEndDate)
                    .reduce((sum: number, m: any) => sum + m.quantity, 0);
                  
                  const outflow = yarnMovements
                    .filter((m: any) => m.movementType === "Çıkış" && m.moveDate >= reportStartDate && m.moveDate <= reportEndDate)
                    .reduce((sum: number, m: any) => sum + m.quantity, 0);
                  
                  const net = inflow - outflow;
                  
                  return (
                    <>
                      {net > 0 ? <TrendingUp className="h-5 w-5 mr-1 text-green-500" /> : 
                       net < 0 ? <TrendingDown className="h-5 w-5 mr-1 text-red-500" /> : 
                       <ArrowRight className="h-5 w-5 mr-1 text-gray-500" />}
                      {net.toFixed(2)} kg
                    </>
                  );
                })()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">{reportStartDate}</span> - <span className="font-medium">{reportEndDate}</span> arası
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Günlük Hareket Grafiği */}
        <Card>
          <CardHeader>
            <CardTitle>Günlük İplik Hareketleri</CardTitle>
            <CardDescription>
              {reportStartDate} - {reportEndDate} arası günlük iplik giriş-çıkışları
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <LineChart className="h-12 w-12 text-muted-foreground/60" />
              <p className="ml-4 text-muted-foreground">Günlük hareket grafiği yükleniyor...</p>
            </div>
          </CardContent>
          <CardFooter>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Giriş (kg)</TableHead>
                  <TableHead>Çıkış (kg)</TableHead>
                  <TableHead>Transfer (kg)</TableHead>
                  <TableHead>Net Değişim</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyMovements.slice(-5).map((day: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{day.date}</TableCell>
                    <TableCell className="text-green-600">{day.inflow.toFixed(2)}</TableCell>
                    <TableCell className="text-red-600">{day.outflow.toFixed(2)}</TableCell>
                    <TableCell>{day.transfers.toFixed(2)}</TableCell>
                    <TableCell className={day.netChange > 0 ? "text-green-600" : day.netChange < 0 ? "text-red-600" : ""}>
                      {day.netChange.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardFooter>
        </Card>
        
        {/* Tedarikçi Bazlı Giriş */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Tedarikçi Bazlı Girişler</CardTitle>
              <CardDescription>
                {reportStartDate} - {reportEndDate} arası
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tedarikçi</TableHead>
                    <TableHead>Toplam Giriş (kg)</TableHead>
                    <TableHead>Hareket Sayısı</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inflowBySupplier.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{item.supplier}</TableCell>
                      <TableCell>{item.quantity.toFixed(2)}</TableCell>
                      <TableCell>{item.movements}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {/* Departman Bazlı Çıkış */}
          <Card>
            <CardHeader>
              <CardTitle>Departman Bazlı Çıkışlar</CardTitle>
              <CardDescription>
                {reportStartDate} - {reportEndDate} arası
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Departman</TableHead>
                    <TableHead>Toplam Çıkış (kg)</TableHead>
                    <TableHead>Hareket Sayısı</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outflowByDepartment.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{item.department}</TableCell>
                      <TableCell>{item.quantity.toFixed(2)}</TableCell>
                      <TableCell>{item.movements}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="analysis" className="m-0 space-y-4">
        {/* Analiz Özet Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Tedarik Süresi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-500" />
                {inventoryMetrics.avgLeadTime || "-- "} gün
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sipariş-teslim arası ortalama süre
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Stok Devir Hızı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center">
                <RefreshCw className="h-5 w-5 mr-2 text-green-500" />
                {inventoryMetrics.avgTurnoverRate || "-- "} kez/ay
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Aylık ortalama stok yenileme sayısı
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Stok Maliyeti (Aylık)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center">
                <CircleDollarSign className="h-5 w-5 mr-2 text-red-500" />
                {inventoryMetrics.monthlyCost ? inventoryMetrics.monthlyCost.toLocaleString('tr-TR') : "-- "} TL
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tahmini aylık stok tutma maliyeti
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Stok Devir Hızı Tablosu */}
        <Card>
          <CardHeader>
            <CardTitle>Stok Devir Hızı Analizi</CardTitle>
            <CardDescription>
              İplik çeşitlerine göre satış/kullanım hızları
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İplik ID</TableHead>
                  <TableHead>İplik Tipi</TableHead>
                  <TableHead>Mevcut Stok</TableHead>
                  <TableHead>Devir Hızı (3 aylık)</TableHead>
                  <TableHead>Tahmini Tükenme Süresi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yarnInventory
                  .filter((yarn: any) => yarn.stockQuantity > 0)
                  .slice(0, 10)
                  .map((yarn: any) => {
                    const turnoverRate = getStockTurnoverRate(yarn.yarnId);
                    const estimatedDays = turnoverRate > 0 ? Math.floor(90 / turnoverRate) : 999;
                    
                    return (
                      <TableRow key={yarn.id}>
                        <TableCell className="font-medium">{yarn.yarnId}</TableCell>
                        <TableCell>{yarn.yarnType} {yarn.count}</TableCell>
                        <TableCell>{yarn.stockQuantity.toFixed(2)} {yarn.unitOfMeasure}</TableCell>
                        <TableCell>{turnoverRate.toFixed(2)}x (3 ay)</TableCell>
                        <TableCell>
                          <span className={
                            estimatedDays < 15 ? "text-red-600 font-medium" :
                            estimatedDays < 30 ? "text-yellow-600 font-medium" :
                            "text-green-600"
                          }>
                            {estimatedDays > 365 ? "1 yıldan fazla" : 
                              estimatedDays > 90 ? "3+ ay" : 
                              estimatedDays + " gün"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Stok Optimizasyonu Önerileri */}
        <Card>
          <CardHeader>
            <CardTitle>Stok Optimizasyon Önerileri</CardTitle>
            <CardDescription>
              Stok yönetimi için öneriler ve tavsiyeler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.length > 0 && (
                <div className="p-4 border rounded-md bg-yellow-50">
                  <h4 className="font-medium flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                    Düşük Stok Uyarısı
                  </h4>
                  <p className="text-sm mt-1">
                    {lowStockItems.length} adet iplik minimum stok seviyesine yaklaşıyor veya altında. 
                    Yeni sipariş planlaması yapılması önerilir.
                  </p>
                </div>
              )}
              
              {yarnInventory.filter((y: any) => getStockTurnoverRate(y.yarnId) < 0.1 && y.stockQuantity > 0).length > 0 && (
                <div className="p-4 border rounded-md bg-blue-50">
                  <h4 className="font-medium flex items-center">
                    <PackageCheck className="h-4 w-4 mr-2 text-blue-600" />
                    Hareketsiz Stok Tespiti
                  </h4>
                  <p className="text-sm mt-1">
                    {yarnInventory.filter((y: any) => getStockTurnoverRate(y.yarnId) < 0.1 && y.stockQuantity > 0).length} adet 
                    iplik son 3 ayda çok az hareket gösterdi. Alternatif kullanım alanları değerlendirilmeli.
                  </p>
                </div>
              )}
              
              <div className="p-4 border rounded-md bg-green-50">
                <h4 className="font-medium flex items-center">
                  <Package className="h-4 w-4 mr-2 text-green-600" />
                  Stok Planlaması İpuçları
                </h4>
                <p className="text-sm mt-1">
                  En yüksek değere sahip iplikler için JIT (tam zamanında) teslimat planlaması yapılması, 
                  düşük değerli ve yüksek hacimli iplikler için ise ekonomik sipariş miktarı (EOQ) 
                  yöntemiyle stok planlaması yapılması önerilir.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="alerts" className="m-0 space-y-4">
        {/* Düşük Stok Uyarıları */}
        <Card>
          <CardHeader>
            <CardTitle>Düşük Stok Uyarıları</CardTitle>
            <CardDescription>
              Minimum seviyeye yaklaşan veya altında olan iplikler
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                Şu anda minimum stok seviyesinin altında veya yaklaşan iplik bulunmamaktadır.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>İplik ID</TableHead>
                    <TableHead>İplik Tipi</TableHead>
                    <TableHead>Mevcut Stok</TableHead>
                    <TableHead>Minimum Seviye</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Tedarikçi</TableHead>
                    <TableHead>Tavsiye</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.yarnId}</TableCell>
                      <TableCell>{item.yarnType} {item.count}</TableCell>
                      <TableCell>{item.stockQuantity.toFixed(2)} {item.unitOfMeasure}</TableCell>
                      <TableCell>{item.minStockLevel.toFixed(2)} {item.unitOfMeasure}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={item.stockQuantity < item.minStockLevel ? "destructive" : "warning"}
                        >
                          {item.stockQuantity < item.minStockLevel ? "Minimum Altında" : "Kritik Seviyede"}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.supplier}</TableCell>
                      <TableCell>
                        {item.stockQuantity < item.minStockLevel * 0.5 ? 
                          "Acil Sipariş" : 
                          "Sipariş Planlaması"
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Hareketsiz Stok Uyarıları */}
        <Card>
          <CardHeader>
            <CardTitle>Hareketsiz Stok Uyarıları</CardTitle>
            <CardDescription>
              30 günden uzun süredir kullanılmayan iplikler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İplik ID</TableHead>
                  <TableHead>İplik Tipi</TableHead>
                  <TableHead>Hareketsiz Süre</TableHead>
                  <TableHead>Stok Miktarı</TableHead>
                  <TableHead>Stok Değeri</TableHead>
                  <TableHead>Tavsiye</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yarnInventory
                  .filter((yarn: any) => {
                    // En son hareket tarihini bul
                    const movements = yarnMovements.filter((m: any) => m.yarnId === yarn.yarnId);
                    if (movements.length === 0) return true; // Hiç hareket yoksa hareketsiz sayılır
                    
                    const lastMovementDate = new Date(Math.max(...movements.map((m: any) => new Date(m.moveDate).getTime())));
                    const daysSinceLastMovement = Math.floor((new Date().getTime() - lastMovementDate.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return daysSinceLastMovement > 30 && yarn.stockQuantity > 0;
                  })
                  .slice(0, 5)
                  .map((yarn: any) => {
                    // En son hareket tarihini bul
                    const movements = yarnMovements.filter((m: any) => m.yarnId === yarn.yarnId);
                    const lastMovementDate = movements.length > 0 
                      ? new Date(Math.max(...movements.map((m: any) => new Date(m.moveDate).getTime())))
                      : new Date(yarn.receiptDate);
                    
                    const daysSinceLastMovement = Math.floor((new Date().getTime() - lastMovementDate.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <TableRow key={yarn.id}>
                        <TableCell className="font-medium">{yarn.yarnId}</TableCell>
                        <TableCell>{yarn.yarnType} {yarn.count}</TableCell>
                        <TableCell>{daysSinceLastMovement} gün</TableCell>
                        <TableCell>{yarn.stockQuantity.toFixed(2)} {yarn.unitOfMeasure}</TableCell>
                        <TableCell>{(yarn.stockQuantity * yarn.unitPrice).toLocaleString('tr-TR')} TL</TableCell>
                        <TableCell>
                          {daysSinceLastMovement > 90 ? 
                            "Alternatif Değerlendirme" : 
                            "Kullanım Planlaması"
                          }
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Kalite/Lot Uyarıları */}
        <Card>
          <CardHeader>
            <CardTitle>Kalite ve Lot Uyarıları</CardTitle>
            <CardDescription>
              Bozulma riski veya lot farklılıkları içeren iplikler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-muted-foreground">
              Şu anda kalite veya lot riski bulunan iplik bulunmamaktadır.
            </div>
          </CardContent>
        </Card>
      </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

const YarnReports = YarnReportsPage;
export default YarnReports;