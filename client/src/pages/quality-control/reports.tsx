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
  Share2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ReportsPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("weekly");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("this-week");
  const [searchTerm, setSearchTerm] = useState("");

  // API'den veri çekme işlemleri
  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery({
    queryKey: ["/api/admin/departments"],
  });

  const { data: qualityMetrics = {}, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["/api/quality-control/metrics", selectedPeriod, selectedDepartment],
  });

  const { data: qualityTrends = {}, isLoading: isLoadingTrends } = useQuery({
    queryKey: ["/api/quality-control/trends", selectedPeriod, selectedDepartment],
  });

  const { data: qualityReports = [], isLoading: isLoadingReports } = useQuery({
    queryKey: ["/api/quality-control/reports", selectedPeriod, selectedDepartment],
  });

  // Raporu indir fonksiyonu
  const handleDownloadReport = (format: string) => {
    toast({
      title: "Rapor indiriliyor",
      description: `Kalite kontrol raporu ${format.toUpperCase()} formatında indiriliyor...`,
    });
    // Gerçek uygulamada burada API'ye istek atılacak
  };

  // Raporu yazdır fonksiyonu
  const handlePrintReport = () => {
    toast({
      title: "Rapor yazdırılıyor",
      description: "Kalite kontrol raporu yazdırma sayfası açılıyor...",
    });
    // Gerçek uygulamada yazdırma işlemi burada yapılacak
    window.print();
  };

  // Raporu paylaş fonksiyonu
  const handleShareReport = () => {
    toast({
      title: "Rapor paylaşılıyor",
      description: "Kalite kontrol raporu paylaşım seçenekleri açılıyor...",
    });
    // Gerçek uygulamada paylaşım işlemi burada yapılacak
  };

  // Dönem seçim işlevi
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
  };

  // Departman seçim işlevi
  const handleDepartmentChange = (value: string | null) => {
    setSelectedDepartment(value);
  };

  // Yükleme durumları
  if (isLoadingDepartments || isLoadingMetrics || isLoadingTrends || isLoadingReports) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Metriklerin görüntülenmesi
  const renderMetrics = () => {
    const metrics = [
      { title: "Toplam Kalite Kontrolü", value: qualityMetrics?.totalInspections || 0, change: "+12%", status: "increase" },
      { title: "Kabul Oranı", value: `${qualityMetrics?.acceptanceRate || 0}%`, change: "+5%", status: "increase" },
      { title: "Ret Oranı", value: `${qualityMetrics?.rejectionRate || 0}%`, change: "-3%", status: "decrease" },
      { title: "Ortalama Hata Sayısı", value: qualityMetrics?.avgDefectsPerInspection || 0, change: "-2.3", status: "decrease" },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className={`text-xs flex items-center mt-1 ${metric.status === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                {metric.change}
                <span className="ml-1">
                  {metric.status === 'increase' ? '↑' : '↓'}
                </span>
                <span className="text-gray-500 ml-1">önceki döneme göre</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Grafiklerin görüntülenmesi
  const renderCharts = () => {
    // Not: Gerçek uygulamada burada recharts veya benzeri kütüphaneler kullanılarak gerçek grafikler gösterilecek
    // Şimdilik demo görünüm sağlanıyor

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hata Türleri Dağılımı</CardTitle>
            <CardDescription>Hata türlerine göre dağılım oranları</CardDescription>
          </CardHeader>
          <CardContent className="h-60 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <PieChart className="h-12 w-12 mx-auto mb-2 text-muted-foreground/60" />
              <p>Grafik verisi yükleniyor...</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kalite Trendi</CardTitle>
            <CardDescription>Zaman içindeki kalite değişimi</CardDescription>
          </CardHeader>
          <CardContent className="h-60 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <LineChart className="h-12 w-12 mx-auto mb-2 text-muted-foreground/60" />
              <p>Grafik verisi yükleniyor...</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Departman Bazlı Hata Oranları</CardTitle>
            <CardDescription>Departmanlara göre hata oranları</CardDescription>
          </CardHeader>
          <CardContent className="h-60 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <BarChart className="h-12 w-12 mx-auto mb-2 text-muted-foreground/60" />
              <p>Grafik verisi yükleniyor...</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Müşteri Memnuniyet Oranları</CardTitle>
            <CardDescription>Kalite sonrası müşteri memnuniyeti</CardDescription>
          </CardHeader>
          <CardContent className="h-60 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <BarChart className="h-12 w-12 mx-auto mb-2 text-muted-foreground/60" />
              <p>Grafik verisi yükleniyor...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Raporların görüntülenmesi
  const renderReports = () => {
    // Demo rapor verileri
    const reports = [
      { id: "QR-001", title: "Haftalık Kalite Raporu", date: "01.05.2025", department: "Tüm Departmanlar", type: "Periyodik" },
      { id: "QR-002", title: "Dokuma Departmanı Kalite Analizi", date: "30.04.2025", department: "Dokuma", type: "Analiz" },
      { id: "QR-003", title: "Hammadde Kalite Raporu", date: "29.04.2025", department: "Ham Kalite", type: "Malzeme" },
      { id: "QR-004", title: "Müşteri İadeleri Analizi", date: "27.04.2025", department: "Kalite Kontrol", type: "Müşteri" },
      { id: "QR-005", title: "Kalite İyileştirme Planı", date: "25.04.2025", department: "Tüm Departmanlar", type: "Planlama" },
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle>Oluşturulan Raporlar</CardTitle>
          <CardDescription>
            Oluşturulmuş kalite kontrol raporları listesi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Rapor ID</th>
                  <th scope="col" className="px-6 py-3">Rapor Adı</th>
                  <th scope="col" className="px-6 py-3">Oluşturulma Tarihi</th>
                  <th scope="col" className="px-6 py-3">Departman</th>
                  <th scope="col" className="px-6 py-3">Tür</th>
                  <th scope="col" className="px-6 py-3">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {report.id}
                    </td>
                    <td className="px-6 py-4">{report.title}</td>
                    <td className="px-6 py-4">{report.date}</td>
                    <td className="px-6 py-4">{report.department}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{report.type}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleDownloadReport('pdf')}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handlePrintReport}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleShareReport}>
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Kalite Kontrol Raporları" 
        description="Kalite kontrol süreçleri ile ilgili analiz ve raporlara erişin"
      />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="weekly">Haftalık</TabsTrigger>
            <TabsTrigger value="monthly">Aylık</TabsTrigger>
            <TabsTrigger value="quarterly">Çeyreklik</TabsTrigger>
            <TabsTrigger value="yearly">Yıllık</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rapor ara..."
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
              <SelectItem value="last-week">Geçen Hafta</SelectItem>
              <SelectItem value="this-month">Bu Ay</SelectItem>
              <SelectItem value="last-month">Geçen Ay</SelectItem>
              <SelectItem value="last-quarter">Son Çeyrek</SelectItem>
              <SelectItem value="this-year">Bu Yıl</SelectItem>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Departman
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Departman Filtresi</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleDepartmentChange(null)}>
                Tüm Departmanlar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {departments.map((dept: any) => (
                <DropdownMenuItem 
                  key={dept.id} 
                  onClick={() => handleDepartmentChange(dept.name)}
                >
                  {dept.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
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
              <DropdownMenuItem onClick={handleShareReport}>
                <Share2 className="h-4 w-4 mr-2" />
                Paylaş
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <TabsContent value="weekly" className="m-0">
        {renderMetrics()}
        {renderCharts()}
        {renderReports()}
      </TabsContent>
      
      <TabsContent value="monthly" className="m-0">
        {renderMetrics()}
        {renderCharts()}
        {renderReports()}
      </TabsContent>
      
      <TabsContent value="quarterly" className="m-0">
        {renderMetrics()}
        {renderCharts()}
        {renderReports()}
      </TabsContent>
      
      <TabsContent value="yearly" className="m-0">
        {renderMetrics()}
        {renderCharts()}
        {renderReports()}
      </TabsContent>
    </div>
  );
};

const Reports = ReportsPage;
export default Reports;