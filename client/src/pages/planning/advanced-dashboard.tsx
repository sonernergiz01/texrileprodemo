import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDateRangePicker } from "@/components/ui/date-range-picker";
import { useEffect, useState } from "react";
import { AdvancedProductionPlan } from "@shared/schema/planning";
import { Calendar, CircleAlert, Clock, Cog, FileStack, Filter, LineChart as LineChartIcon, ListChecks, Loader2, Percent, RefreshCcw, RotateCcw, Timer, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDays, format, subDays } from "date-fns";
import { tr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

// Renk paleti
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#8dd1e1', '#a4de6c', '#d0ed57'];

// Demo veri - Üretim Plan Durumları için
const productionStatusData = [
  { name: 'Taslak', value: 5, color: '#9ca3af' },
  { name: 'Beklemede', value: 12, color: '#f59e0b' },
  { name: 'Devam Ediyor', value: 25, color: '#3b82f6' },
  { name: 'Tamamlandı', value: 18, color: '#22c55e' },
  { name: 'İptal Edildi', value: 2, color: '#ef4444' },
  { name: 'Bekletiliyor', value: 8, color: '#8b5cf6' },
  { name: 'Gecikmiş', value: 6, color: '#f43f5e' }
];

// Demo veri - Departman bazlı üretim kapasitesi
const departmentCapacityData = [
  { name: 'Dokuma', allocated: 85, available: 100 },
  { name: 'Boyama', allocated: 70, available: 100 },
  { name: 'Apre', allocated: 45, available: 100 },
  { name: 'Kalite', allocated: 60, available: 100 },
  { name: 'Konfeksiyon', allocated: 90, available: 100 }
];

// Demo veri - Makine kapasitesi kullanımı
const machineUtilizationData = [
  { name: 'Dokuma-01', efficiency: 92, status: 'active' },
  { name: 'Dokuma-02', efficiency: 88, status: 'active' },
  { name: 'Dokuma-03', efficiency: 76, status: 'maintenance' },
  { name: 'Boyama-01', efficiency: 95, status: 'active' },
  { name: 'Boyama-02', efficiency: 72, status: 'active' },
  { name: 'Apre-01', efficiency: 85, status: 'active' },
  { name: 'Apre-02', efficiency: 0, status: 'inactive' },
  { name: 'Kalite-01', efficiency: 90, status: 'active' }
];

// Demo veri - Son 7 günün tamamlanan işleri
const completedWorkData = [
  { date: '01.05', completed: 12 },
  { date: '02.05', completed: 15 },
  { date: '03.05', completed: 10 },
  { date: '04.05', completed: 18 },
  { date: '05.05', completed: 14 },
  { date: '06.05', completed: 20 }
];

// Demo veri - KPI sonuçları
const kpiData = [
  { name: 'Zamanında Teslim', target: 90, actual: 87, status: 'warning' },
  { name: 'Kalite Oranı', target: 95, actual: 97, status: 'success' },
  { name: 'Verimlilik', target: 85, actual: 82, status: 'warning' },
  { name: 'Kapasite Kullanımı', target: 80, actual: 75, status: 'warning' },
  { name: 'Kayıp Zaman', target: 5, actual: 8, status: 'error' }
];

// Demo veri - Üretim süreç izleme
const processTrackingData = [
  { id: 1, planName: 'SP-2023-001', stage: 'Dokuma', progress: 100, startDate: '01.05.2023', endDate: '05.05.2023', status: 'completed' },
  { id: 2, planName: 'SP-2023-001', stage: 'Boyama', progress: 75, startDate: '06.05.2023', endDate: '09.05.2023', status: 'in-progress' },
  { id: 3, planName: 'SP-2023-001', stage: 'Apre', progress: 0, startDate: '10.05.2023', endDate: '12.05.2023', status: 'pending' },
  { id: 4, planName: 'SP-2023-001', stage: 'Kalite Kontrol', progress: 0, startDate: '13.05.2023', endDate: '14.05.2023', status: 'pending' },
  { id: 5, planName: 'SP-2023-001', stage: 'Sevkiyat', progress: 0, startDate: '15.05.2023', endDate: '15.05.2023', status: 'pending' }
];

// Tarih aralığı tipi
type DateRange = {
  from: Date;
  to: Date;
};

export default function AdvancedDashboard() {
  const { toast } = useToast();
  
  // Varsayılan tarih aralığını son 7 gün olarak ayarlama
  const [date, setDate] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  
  // Seçilen müşteri ve ürün
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  
  // Üretim planlarını çekme
  const {
    data: productionPlans,
    isLoading: plansLoading,
    isError: plansError,
    refetch: refetchPlans
  } = useQuery({
    queryKey: ['/api/advanced-planning/plans', date.from, date.to, selectedCustomer, selectedProduct],
    queryFn: async () => {
      // Gerçek veri olmadığı için şu an boş dizi döndürüyoruz
      // Gerçek uygulamada API'ye istek atılacak
      // Üretim aşamasında:
      // const res = await fetch(`/api/advanced-planning/plans?from=${format(date.from, 'yyyy-MM-dd')}&to=${format(date.to, 'yyyy-MM-dd')}&customer=${selectedCustomer}&product=${selectedProduct}`);
      // return await res.json();
      return [] as AdvancedProductionPlan[];
    },
    enabled: true
  });
  
  // KPI verilerini çekme
  const {
    data: kpis,
    isLoading: kpisLoading,
    isError: kpisError,
    refetch: refetchKpis
  } = useQuery({
    queryKey: ['/api/advanced-planning/kpis', date.from, date.to],
    queryFn: async () => {
      // Gerçek veri olmadığı için varsayılan kpiData değerini kullanıyoruz
      // Gerçek uygulamada API'ye istek atılacak
      // Üretim aşamasında:
      // const res = await fetch(`/api/advanced-planning/kpis?from=${format(date.from, 'yyyy-MM-dd')}&to=${format(date.to, 'yyyy-MM-dd')}`);
      // return await res.json();
      return kpiData;
    },
    enabled: true
  });
  
  // Tüm verileri yenileme fonksiyonu
  const refreshAllData = () => {
    refetchPlans();
    refetchKpis();
    toast({
      title: "Veriler yenileniyor",
      description: "Dashboard verileri güncelleniyor...",
    });
  };
  
  // Durum rengi bulma yardımcı fonksiyonu
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-amber-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Üretim süreç ilerleme rengi
  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-gray-300';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Veri yükleme hatası durumunda
  if (plansError || kpisError) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <CircleAlert className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Veri Yükleme Hatası</h2>
          <p className="text-gray-600 mb-4">Gelişmiş planlama verileri yüklenirken bir sorun oluştu.</p>
          <Button onClick={refreshAllData}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Yeniden Dene
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gelişmiş Planlama Dashboard</h1>
            <p className="text-muted-foreground">Üretim ve performans metriklerini kapsamlı olarak görüntüleyin.</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={refreshAllData}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Yenile
            </Button>
          </div>
        </div>
        
        {/* Filtreler */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Tarih Aralığı</CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarDateRangePicker date={date} onChange={setDate} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Filtreleme</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Müşteri</label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="1">ABC Tekstil</SelectItem>
                    <SelectItem value="2">XYZ Kumaş</SelectItem>
                    <SelectItem value="3">123 İplik</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ürün Tipi</label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ürün tipi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="1">Dokuma Kumaş</SelectItem>
                    <SelectItem value="2">Örgü Kumaş</SelectItem>
                    <SelectItem value="3">Denim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Özet Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Toplam Plan</span>
                <span className="text-2xl font-bold">76</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Aktif Plan</span>
                <span className="text-2xl font-bold">25</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Gecikmeli</span>
                <span className="text-2xl font-bold text-red-500">6</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Bugün Tamamlanan</span>
                <span className="text-2xl font-bold text-green-500">3</span>
              </div>
            </CardContent>
          </Card>
        </div>
      
        {/* Ana Dashboard İçeriği */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl mx-auto">
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="capacity">Kapasite</TabsTrigger>
            <TabsTrigger value="performance">Performans</TabsTrigger>
            <TabsTrigger value="tracking">Süreç İzleme</TabsTrigger>
            <TabsTrigger value="planning">Simülasyon</TabsTrigger>
          </TabsList>
          
          {/* Genel Bakış Sekmesi */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Üretim Plan Durumları */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Üretim Planı Durumları</CardTitle>
                  <CardDescription>Tüm planların güncel durumları</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={productionStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {productionStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* KPI Performans Kartı */}
              <Card>
                <CardHeader>
                  <CardTitle>KPI Özeti</CardTitle>
                  <CardDescription>Kritik performans göstergeleri</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {kpiData.map((kpi, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{kpi.name}</span>
                          <Badge 
                            className={`${
                              kpi.status === 'success' ? 'bg-green-500' : 
                              kpi.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                            } text-white hover:bg-opacity-90`}
                          >
                            {kpi.actual}%
                          </Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              kpi.status === 'success' ? 'bg-green-500' : 
                              kpi.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${kpi.actual}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Hedef: {kpi.target}%</span>
                          <span>Fark: {(kpi.actual - kpi.target).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
          
              {/* Tamamlanan İşler Grafiği */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Tamamlanan İşler Trendi</CardTitle>
                  <CardDescription>Son 7 günde tamamlanan işler</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={completedWorkData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="completed" 
                          name="Tamamlanan İş" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ r: 5 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Genel İstatistikler */}
              <Card>
                <CardHeader>
                  <CardTitle>Genel İstatistikler</CardTitle>
                  <CardDescription>Bu aydaki genel durum</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                      <Calendar className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-blue-600">Planlanan Siparişler</p>
                        <h4 className="text-2xl font-bold">42</h4>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                      <FileStack className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-green-600">Tamamlanan Siparişler</p>
                        <h4 className="text-2xl font-bold">18</h4>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-3 bg-red-50 rounded-lg">
                      <Clock className="h-8 w-8 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-red-600">Geciken Siparişler</p>
                        <h4 className="text-2xl font-bold">6</h4>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-3 bg-purple-50 rounded-lg">
                      <Percent className="h-8 w-8 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium text-purple-600">Verimlilik Oranı</p>
                        <h4 className="text-2xl font-bold">82%</h4>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Kapasite Sekmesi */}
          <TabsContent value="capacity" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Departman Kapasite Grafiği */}
              <Card>
                <CardHeader>
                  <CardTitle>Departman Kapasite Kullanımı</CardTitle>
                  <CardDescription>Bölüm bazlı atanan ve mevcut kapasite</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={departmentCapacityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="allocated" name="Atanan Kapasite" fill="#3b82f6" />
                        <Bar dataKey="available" name="Toplam Kapasite" fill="#e5e7eb" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Makine Verimlilik Tablosu */}
              <Card>
                <CardHeader>
                  <CardTitle>Makine Verimliliği</CardTitle>
                  <CardDescription>Makinelerin çalışma verimliliği ve durumları</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Makine
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Verimlilik
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Durum
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {machineUtilizationData.map((machine, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {machine.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                  <div 
                                    className={`h-2.5 rounded-full ${
                                      machine.efficiency > 85 ? 'bg-green-500' : 
                                      machine.efficiency > 70 ? 'bg-amber-500' : 
                                      machine.efficiency > 0 ? 'bg-red-500' : 'bg-gray-400'
                                    }`}
                                    style={{ width: `${machine.efficiency}%` }}
                                  />
                                </div>
                                <span>{machine.efficiency}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <Badge className={
                                machine.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                                machine.status === 'maintenance' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : 
                                'bg-red-100 text-red-800 hover:bg-red-100'
                              }>
                                {machine.status === 'active' ? 'Aktif' : 
                                machine.status === 'maintenance' ? 'Bakımda' : 'Devre Dışı'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Performans Sekmesi */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* KPI Kartları */}
              {kpiData.map((kpi, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{kpi.name}</CardTitle>
                    <CardDescription>
                      Hedef: {kpi.target}% / Gerçekleşen: {kpi.actual}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          {/* Gri arka plan daire */}
                          <circle
                            className="text-gray-200"
                            strokeWidth="10"
                            stroke="currentColor"
                            fill="transparent"
                            r="40"
                            cx="50"
                            cy="50"
                          />
                          {/* Değer dairesi */}
                          <circle
                            className={`
                              ${kpi.status === 'success' ? 'text-green-500' : 
                                kpi.status === 'warning' ? 'text-amber-500' : 'text-red-500'}
                            `}
                            strokeWidth="10"
                            strokeDasharray={`${kpi.actual * 2.51}, 251.2`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="40"
                            cx="50"
                            cy="50"
                          />
                        </svg>
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                          <div className="text-2xl font-bold">{kpi.actual}%</div>
                        </div>
                      </div>
                      
                      <div className={`text-sm font-medium px-3 py-1 rounded-full
                        ${kpi.status === 'success' ? 'bg-green-100 text-green-800' : 
                          kpi.status === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}
                      `}>
                        {kpi.status === 'success' ? 'Hedefte' : 
                        kpi.status === 'warning' ? 'Uyarı' : 'Kritik'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Süreç İzleme Sekmesi */}
          <TabsContent value="tracking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Üretim Süreç İzleme</CardTitle>
                <CardDescription>Üretim planının aşama bazında ilerleyişi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {processTrackingData.map((step, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold">{step.stage}</div>
                          <div className="text-sm text-gray-500">
                            {step.startDate} - {step.endDate}
                          </div>
                        </div>
                        <Badge 
                          className={`
                            ${step.status === 'completed' ? 'bg-green-500' : 
                              step.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-400'}
                            text-white hover:bg-opacity-90
                          `}
                        >
                          {step.status === 'completed' ? 'Tamamlandı' : 
                            step.status === 'in-progress' ? 'Devam Ediyor' : 'Beklemede'}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={getProgressColor(step.status)}
                          style={{ width: `${step.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{step.progress}% Tamamlandı</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Simülasyon Sekmesi */}
          <TabsContent value="planning" className="space-y-6">
            <Card className="p-6">
              <div className="text-center space-y-4">
                <Cog className="h-12 w-12 text-blue-500 mx-auto" />
                <h3 className="text-xl font-bold">Planlama Simülasyonu</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Çeşitli üretim senaryolarını simüle ederek en verimli planlama stratejisini belirleyin.
                  (Bu özellik geliştirme aşamasındadır.)
                </p>
                <Button className="mt-2">
                  <LineChartIcon className="mr-2 h-4 w-4" />
                  Simülasyon Başlat
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}