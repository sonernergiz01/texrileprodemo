import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, DownloadIcon, Calendar, BarChart3, PieChart as PieChartIcon, Filter, BarChart2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { addDays, format, subDays, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function MaintenanceReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined);

  // Mevcut kullanıcı verilerini al
  const { data: user } = useQuery<{ id: number, username: string, departmentId: number }>({
    queryKey: ["/api/user"],
  });

  // Bakım departmanlarını tanımla
  const maintenanceDepartments = [
    { id: 20, name: "Elektrik Bakım", code: "ELEC", color: "#f59e0b" },
    { id: 21, name: "Mekanik Bakım", code: "MECH", color: "#d97706" },
    { id: 22, name: "Bilgi İşlem", code: "IT", color: "#0ea5e9" }
  ];
  
  // Kullanıcı departmanı ID'sine göre varsayılan departman filtresi ayarla
  useEffect(() => {
    if (user && user.departmentId !== 1) {
      // Admin dışındaki bakım departmanları için otomatik olarak kendi departmanını filtrele
      if ([6, 7, 22].includes(user.departmentId)) {
        setDepartmentFilter(user.departmentId.toString());
      }
    }
  }, [user]);

  // İstatistik API'sinden bakım istatistiklerini al - URL'yi yeni oluşturduğumuz 
  // dashboard-stats endpointi olarak güncelledik
  const { 
    data: stats, 
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ["/api/maintenance/dashboard-stats", departmentFilter, dateRange?.from, dateRange?.to],
    queryFn: async () => {
      let url = "/api/maintenance/dashboard-stats";
      const params = new URLSearchParams();
      
      if (departmentFilter) {
        params.append("departmentId", departmentFilter);
      }
      
      if (dateRange?.from) {
        params.append("startDate", dateRange.from.toISOString());
      }
      
      if (dateRange?.to) {
        params.append("endDate", dateRange.to.toISOString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log("İstatistik verileri için istek atılıyor:", url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("İstatistikler alınamadı");
      }
      return response.json();
    },
  });
  
  // Tarih aralığı veya departman filtresi değiştiğinde istatistikleri yeniden al
  useEffect(() => {
    refetch();
  }, [dateRange, departmentFilter, refetch]);
  
  // Durum dağılımı grafiği için veri
  const statusChartData = React.useMemo(() => {
    if (!stats) return [];
    
    return [
      { name: "Beklemede", value: stats.statusCounts.find((s: any) => s.status === "pending")?.count || 0, color: "#facc15" },
      { name: "Devam Ediyor", value: stats.statusCounts.find((s: any) => s.status === "in-progress")?.count || 0, color: "#3b82f6" },
      { name: "Tamamlandı", value: stats.statusCounts.find((s: any) => s.status === "completed")?.count || 0, color: "#10b981" },
      { name: "Reddedildi", value: stats.statusCounts.find((s: any) => s.status === "rejected")?.count || 0, color: "#ef4444" },
    ];
  }, [stats]);

  // Öncelik dağılımı grafiği için veri
  const priorityChartData = React.useMemo(() => {
    if (!stats) return [];
    
    return [
      { name: "Düşük", value: stats.priorityCounts.find((p: any) => p.priority === "low")?.count || 0, color: "#94a3b8" },
      { name: "Normal", value: stats.priorityCounts.find((p: any) => p.priority === "normal")?.count || 0, color: "#3b82f6" },
      { name: "Yüksek", value: stats.priorityCounts.find((p: any) => p.priority === "high")?.count || 0, color: "#f97316" },
      { name: "Kritik", value: stats.priorityCounts.find((p: any) => p.priority === "critical")?.count || 0, color: "#ef4444" },
    ];
  }, [stats]);

  // Aylık bakım talebi grafiği için veri
  const monthlyChartData = React.useMemo(() => {
    if (!stats?.monthlyStats) return [];
    return stats.monthlyStats.map((item: any) => ({
      month: `${item.month} ${item.year}`,
      count: item.count,
    }));
  }, [stats]);

  // Yükleme durumunda göster
  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <PageHeader 
          title="Bakım Raporları" 
          description="Bakım taleplerine ait raporlar ve istatistikler"
        />
        <div className="space-y-4 mt-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Hata durumunda göster
  if (isError) {
    return (
      <div className="container mx-auto py-10">
        <PageHeader 
          title="Bakım Raporları" 
          description="Rapor verileri yüklenirken bir hata oluştu."
        />
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          <p>Rapor verileri yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <PageHeader 
        title="Bakım Raporları" 
        description="Bakım taleplerine ait raporlar ve istatistikler"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-1">
              <DownloadIcon className="h-4 w-4" />
              <span>Dışa Aktar</span>
            </Button>
          </div>
        }
      />

      <div className="flex justify-between items-center my-6">
        <div className="flex items-center gap-2">
          <DateRangePicker
            value={dateRange}
            onValueChange={setDateRange}
          />
          
          {/* Admin için departman filtresi */}
          {user?.departmentId === 1 && (
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Departman Filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Departmanlar</SelectItem>
                {maintenanceDepartments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="mb-6">
          <TabsList>
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="performance">Performans</TabsTrigger>
            <TabsTrigger value="trends">Trend Analizi</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Özet Metrikler */}
            <Card>
              <CardHeader>
                <CardTitle>Özet Metrikler</CardTitle>
                <CardDescription>
                  {dateRange?.from && dateRange?.to
                    ? `${format(dateRange.from, "dd.MM.yyyy")} - ${format(dateRange.to, "dd.MM.yyyy")} arası veriler`
                    : "Tüm zamanlar"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-md p-4">
                    <p className="text-sm text-gray-500">Toplam Bakım Talebi</p>
                    <p className="text-3xl font-bold">{stats?.totalRequests || 0}</p>
                  </div>
                  <div className="border rounded-md p-4">
                    <p className="text-sm text-gray-500">Tamamlanan</p>
                    <p className="text-3xl font-bold text-green-600">
                      {stats?.statusCounts?.find((s: any) => s.status === "completed")?.count || 0}
                    </p>
                  </div>
                  <div className="border rounded-md p-4">
                    <p className="text-sm text-gray-500">Devam Eden</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {stats?.statusCounts?.find((s: any) => s.status === "in-progress")?.count || 0}
                    </p>
                  </div>
                  <div className="border rounded-md p-4">
                    <p className="text-sm text-gray-500">Bekleyen</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {stats?.statusCounts?.find((s: any) => s.status === "pending")?.count || 0}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <p className="text-sm font-medium mb-2">Ortalama Tamamlanma Süresi</p>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-semibold text-blue-600">{stats?.avgCompletionTime || "0"} <span className="text-sm text-gray-500">saat</span></div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <p className="text-sm font-medium mb-2">Tamamlanma Oranı</p>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={
                        stats?.totalRequests > 0
                          ? (stats?.statusCounts?.find((s: any) => s.status === "completed")?.count / stats?.totalRequests) * 100
                          : 0
                      } 
                      className="h-2"
                    />
                    <span className="text-sm">
                      {stats?.totalRequests > 0
                        ? Math.round((stats?.statusCounts?.find((s: any) => s.status === "completed")?.count / stats?.totalRequests) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Durum Dağılımı Grafiği */}
            <Card>
              <CardHeader>
                <CardTitle>Durum Dağılımı</CardTitle>
                <CardDescription>Bakım taleplerinin durumlarına göre dağılımı</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(value) => [`${value} talep`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Öncelik Dağılımı Grafiği */}
            <Card>
              <CardHeader>
                <CardTitle>Öncelik Dağılımı</CardTitle>
                <CardDescription>Bakım taleplerinin önceliklerine göre dağılımı</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {priorityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(value) => [`${value} talep`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Aylık Bakım Talepleri Grafiği */}
            <Card>
              <CardHeader>
                <CardTitle>Aylık Bakım Talepleri</CardTitle>
                <CardDescription>Son 6 aydaki bakım talepleri</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} talep`, "Toplam"]} />
                      <Bar dataKey="count" name="Toplam Talep" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performans Metrikleri</CardTitle>
              <CardDescription>
                {user?.departmentId === 1 
                  ? 'Tüm bakım departmanlarının performans metrikleri' 
                  : 'Departman performans metrikleri'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <PieChartIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium">Yakında Kullanıma Sunulacak</h3>
                <p className="text-sm text-gray-500 mt-1 mb-6">
                  Detaylı performans metrikleri yakında bu sayfada gösterilecektir.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Trend Analizi</CardTitle>
              <CardDescription>
                Bakım taleplerinin zaman içindeki değişimi ve temel trend analizi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium">Yakında Kullanıma Sunulacak</h3>
                <p className="text-sm text-gray-500 mt-1 mb-6">
                  Detaylı trend analizi yakında bu sayfada gösterilecektir.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}