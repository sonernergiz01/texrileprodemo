import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { DollarSign, Users, Package, Clock, BarChart3, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
// AppLayout artık bu sayfada kullanılmayacak
// import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, BarChart, PieChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Area, Bar, Pie, Cell, Legend } from "recharts";

// Dashboard bileşenleri
import { DashboardCard, DashboardChartCard, DashboardStatsCard, DashboardEmptySection } from "@/components/dashboard/dashboard-card";
import { DashboardAreaChart, DashboardBarChart, DashboardPieChart, CHART_COLORS } from "@/components/dashboard/dashboard-charts";

// Dashboard veri hooku
import { useDashboardData } from "@/hooks/use-dashboard-data";

// Veri formatlamaları için yardımcı fonksiyonlar
const formatCurrency = (value: number) => `₺${value.toLocaleString('tr-TR')}`;
const formatPercentage = (value: number) => `%${value.toFixed(1)}`;
const formatQuantity = (value: number) => `${value.toLocaleString('tr-TR')} metre`;

const YonetimDashboard: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Dashboard verileri
  const {
    isLoading,
    orderSummary,
    salesOrders,
    duedateOrders,
    machineQueues,
    productionPlans,
    qualityReports,
    salesTrends,
    shipmentReports,
    refreshData
  } = useDashboardData();

  // API'den gelen veriler veya örnek veriler
  const salesData = salesTrends || [
    { name: "Oca", sales: 4300 },
    { name: "Şub", sales: 3300 },
    { name: "Mar", sales: 5800 },
    { name: "Nis", sales: 7200 },
    { name: "May", sales: 6800 },
    { name: "Haz", sales: 8400 },
    { name: "Tem", sales: 7800 },
    { name: "Ağu", sales: 6800 },
    { name: "Eyl", sales: 8100 },
    { name: "Eki", sales: 9800 },
    { name: "Kas", sales: 8900 },
    { name: "Ara", sales: 11200 },
  ];

  const dueDateData = duedateOrders || [
    { name: "Bu Hafta", value: 12 },
    { name: "Gelecek Hafta", value: 18 },
    { name: "15+ Gün", value: 32 },
    { name: "30+ Gün", value: 27 },
  ];

  const qualityData = qualityReports?.qualityResults || [
    { name: "Mükemmel", value: 68 },
    { name: "İyi", value: 24 },
    { name: "Kabul Edilebilir", value: 6 },
    { name: "Ret", value: 2 },
  ];

  const machineData = machineQueues || [
    { name: "Dokuma-1", doluluk: 95 },
    { name: "Dokuma-2", doluluk: 88 },
    { name: "Dokuma-3", doluluk: 76 },
    { name: "Dokuma-4", doluluk: 92 },
    { name: "Çözgü-1", doluluk: 65 },
    { name: "Çözgü-2", doluluk: 78 },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Yönetim Paneli</h2>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2 gap-1" 
                onClick={() => refreshData()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Yenile
              </Button>
              <Badge variant="outline" className="text-sm">
                Son güncelleme: {new Date().toLocaleString("tr-TR")}
              </Badge>
            </div>
          </div>
          
          <Tabs defaultValue="genel-bakis" className="space-y-4">
            <TabsList>
              <TabsTrigger value="genel-bakis">Genel Bakış</TabsTrigger>
              <TabsTrigger value="satis">Satışlar</TabsTrigger>
              <TabsTrigger value="uretim">Üretim</TabsTrigger>
              <TabsTrigger value="kalite">Kalite</TabsTrigger>
            </TabsList>
            
            <TabsContent value="genel-bakis" className="space-y-4">
              {/* Üst bölüm kartlar */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <DashboardCard
                  title="Toplam Satış (Ay)"
                  value={orderSummary?.monthlySales ? formatCurrency(orderSummary.monthlySales) : "₺1.528.900"}
                  description="geçen aya göre"
                  icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                  trend={orderSummary?.growthRate ? {
                    value: `${Math.abs(parseFloat(orderSummary.growthRate)).toFixed(1)}%`,
                    isPositive: parseFloat(orderSummary.growthRate) > 0
                  } : {
                    value: "18%",
                    isPositive: true
                  }}
                  isLoading={isLoading}
                />
                
                <DashboardCard
                  title="Bekleyen Siparişler"
                  value={orderSummary?.totalOrders?.toString() || "37"}
                  description={orderSummary?.pendingQuantity ? `${orderSummary.pendingQuantity.toLocaleString('tr-TR')} metre kumaş` : "178.450 metre kumaş"}
                  icon={<Package className="h-4 w-4 text-muted-foreground" />}
                  isLoading={isLoading}
                />
                
                <DashboardCard
                  title="Aktif Müşteriler"
                  value={orderSummary?.activeCustomers?.toString() || "24"}
                  description="son 30 günde"
                  icon={<Users className="h-4 w-4 text-muted-foreground" />}
                  trend={orderSummary?.newCustomers ? {
                    value: `+${orderSummary.newCustomers}`,
                    isPositive: true
                  } : {
                    value: "+2",
                    isPositive: true
                  }}
                  isLoading={isLoading}
                />
                
                <DashboardCard
                  title="Ortalama Üretim Süresi"
                  value={orderSummary?.avgProductionTime ? `${orderSummary.avgProductionTime.toFixed(1)} Gün` : "12.5 Gün"}
                  description="bu çeyrek"
                  icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                  trend={{
                    value: "-1.8 gün",
                    isPositive: true
                  }}
                  isLoading={isLoading}
                />
              </div>
              
              {/* Orta bölüm - Grafik ve Makine Kullanım Durumu */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Yıllık Satışlar</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={salesData}>
                        <defs>
                          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip formatter={(value) => `${value} bin ₺`} />
                        <Area 
                          type="monotone" 
                          dataKey="sales" 
                          stroke="#3b82f6" 
                          fillOpacity={1} 
                          fill="url(#salesGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Makine Doluluk Durumu</CardTitle>
                    <CardDescription>
                      Aktif makinelerin doluluk oranları
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={machineData} layout="vertical">
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis type="category" width={80} dataKey="name" />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Bar dataKey="doluluk" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              
              {/* Alt bölüm - Vade ve Kalite */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Termin Tarihine Göre Siparişler</CardTitle>
                    <CardDescription>
                      Sipariş teslim tarihlerine göre dağılım
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={dueDateData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              fill="#8884d8"
                              paddingAngle={5}
                              dataKey="value"
                              label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {dueDateData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} sipariş`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-col justify-center space-y-2">
                        <div className="flex items-center">
                          <div className="w-4 h-4 rounded bg-blue-500 mr-2"></div>
                          <span className="text-sm">Bu Hafta: 12 sipariş</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 rounded bg-green-600 mr-2"></div>
                          <span className="text-sm">Gelecek Hafta: 18 sipariş</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 rounded bg-amber-500 mr-2"></div>
                          <span className="text-sm">15+ Gün: 32 sipariş</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 rounded bg-red-500 mr-2"></div>
                          <span className="text-sm">30+ Gün: 27 sipariş</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Kalite Kontrol Sonuçları</CardTitle>
                    <CardDescription>
                      Son 30 günlük kalite kontrol sonuçları
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={qualityData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({name, percent}) => `${(percent * 100).toFixed(0)}%`}
                          >
                            {qualityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value}%`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="satis" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Satış Performansı</CardTitle>
                    <CardDescription>Satış ekibi performans metrikleri</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px] flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <TrendingUp className="h-16 w-16 text-blue-500" />
                        <h3 className="text-2xl font-bold">Mevcut Yapıda Hazırlanıyor</h3>
                        <p className="text-muted-foreground">
                          Bu bölüm, satış ekibi performans metriklerini ve detaylı satış raporlarını içerecektir.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Satış Takvimi</CardTitle>
                    <CardDescription>Planlanmış teslim tarihleri</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="rounded-md border"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="uretim" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Üretim Akışı</CardTitle>
                    <CardDescription>Aktif üretim planları ve durum bilgileri</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px] flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Package className="h-16 w-16 text-blue-500" />
                        <h3 className="text-2xl font-bold">Mevcut Yapıda Hazırlanıyor</h3>
                        <p className="text-muted-foreground">
                          Bu bölüm, üretim akış bilgilerini, aktif planları ve durum güncellemelerini içerecektir.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Üretim Özeti</CardTitle>
                    <CardDescription>Günlük üretim metrikleri</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Üretim Planları (Aktif):</span>
                        <span className="font-medium">24</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Tamamlanan İşler (Bugün):</span>
                        <span className="font-medium">6</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Üretilen Miktar (Bugün):</span>
                        <span className="font-medium">12,450 metre</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Aktif Makine Sayısı:</span>
                        <span className="font-medium">18/22</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Verimlilik (Aylık):</span>
                        <span className="font-medium text-green-500">92%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="kalite" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Kalite Kontrol Analizleri</CardTitle>
                    <CardDescription>Kumaş kalite metrikleri ve sorun analizleri</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px] flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <AlertTriangle className="h-16 w-16 text-blue-500" />
                        <h3 className="text-2xl font-bold">Mevcut Yapıda Hazırlanıyor</h3>
                        <p className="text-muted-foreground">
                          Bu bölüm, kalite kontrol sonuçlarını, hata analizlerini ve kalite iyileştirme önlemlerini içerecektir.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Kalite Özeti</CardTitle>
                    <CardDescription>Haftalık kalite metrikleri</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Kalite Kontrol (Haftalık):</span>
                        <span className="font-medium">87 Parti</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Ret Oranı:</span>
                        <span className="font-medium text-amber-600">1.8%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">İyileştirme Gerektiren:</span>
                        <span className="font-medium">8.2%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Mükemmel Kalite:</span>
                        <span className="font-medium text-green-500">78.5%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Ortalama Kalite Puanı:</span>
                        <span className="font-medium text-green-500">4.62/5</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default YonetimDashboard;