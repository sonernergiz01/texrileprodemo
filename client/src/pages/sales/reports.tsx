import { PageContainer } from "@/components/layout/page-container";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Download, Filter, Printer, RefreshCw } from "lucide-react";

// Sample data for charts - in a real app these would come from API calls
const monthlyOrderData = [
  { name: "Oca", value: 42000 },
  { name: "Şub", value: 55000 },
  { name: "Mar", value: 75000 },
  { name: "Nis", value: 62000 },
  { name: "May", value: 89000 },
  { name: "Haz", value: 103000 },
  { name: "Tem", value: 97000 },
  { name: "Ağu", value: 110000 },
  { name: "Eyl", value: 93000 },
  { name: "Eki", value: 78000 },
  { name: "Kas", value: 67000 },
  { name: "Ara", value: 82000 }
];

const customerDistributionData = [
  { name: "ABC Tekstil Ltd.", value: 35 },
  { name: "Moda Tekstil A.Ş.", value: 25 },
  { name: "XYZ Konfeksiyon", value: 20 },
  { name: "Diğer", value: 20 }
];

const fabricTypeData = [
  { name: "Pamuklu Örme", value: 45 },
  { name: "Polyester Dokuma", value: 30 },
  { name: "Pamuklu Gabardin", value: 15 },
  { name: "Diğer", value: 10 }
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export default function SalesReports() {
  const [dateRange, setDateRange] = useState("last-year");
  const [reportType, setReportType] = useState("orders");
  
  // In a real app, we would use these filters to fetch data from the API
  const { data: orderSummary } = useQuery({
    queryKey: ["/api/orders/summary"],
  });
  
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });
  
  // Here we would have additional API calls for different report data
  
  return (
    <PageContainer
      title="Satış Raporları"
      subtitle="Satış performansını ve istatistikleri izleyin"
      breadcrumbs={[
        { label: "Ana Sayfa", href: "/" },
        { label: "Satış ve Pazarlama", href: "/sales" },
        { label: "Raporlar", href: "/sales/reports" },
      ]}
    >
      <div className="space-y-6">
        {/* Report Controls */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Select 
                defaultValue={dateRange} 
                onValueChange={setDateRange}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Tarih Aralığı" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-month">Bu Ay</SelectItem>
                  <SelectItem value="last-month">Geçen Ay</SelectItem>
                  <SelectItem value="last-quarter">Son Çeyrek</SelectItem>
                  <SelectItem value="last-year">Son 1 Yıl</SelectItem>
                  <SelectItem value="custom">Özel Aralık</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Yazdır
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Dışa Aktar
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Report Tabs */}
        <Tabs defaultValue="orders" onValueChange={setReportType} className="space-y-4">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="orders">Sipariş Raporları</TabsTrigger>
            <TabsTrigger value="customers">Müşteri Raporları</TabsTrigger>
            <TabsTrigger value="products">Ürün Raporları</TabsTrigger>
          </TabsList>
          
          {/* Orders Tab Content */}
          <TabsContent value="orders" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-500">Toplam Sipariş</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {(orderSummary?.pending || 0) + 
                       (orderSummary?.production || 0) + 
                       (orderSummary?.shipping || 0) + 
                       (orderSummary?.completed || 0)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      <span className="font-medium">+12%</span> geçen aya göre
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-500">Toplam Ciro</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {formatCurrency(
                        (orderSummary?.pendingValue || 0) + 
                        (orderSummary?.productionValue || 0) + 
                        (orderSummary?.shippingValue || 0) + 
                        (orderSummary?.completedValue || 0)
                      )}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      <span className="font-medium">+8.5%</span> geçen aya göre
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-500">Ortalama Sipariş Tutarı</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {formatCurrency(35250)}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      <span className="font-medium">-3.2%</span> geçen aya göre
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-500">Tamamlanma Oranı</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {orderSummary?.completed ? 
                        Math.round((orderSummary.completed / 
                          ((orderSummary?.pending || 0) + 
                           (orderSummary?.production || 0) + 
                           (orderSummary?.shipping || 0) + 
                           (orderSummary?.completed || 0)) * 100)) : 0}%
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      <span className="font-medium">+5.1%</span> geçen aya göre
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Monthly Orders Chart */}
            <Card>
              <CardHeader className="px-6 py-4 border-b border-gray-200">
                <CardTitle className="text-base font-medium">Aylık Sipariş Dağılımı</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyOrderData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis 
                        tickFormatter={(value) => `${value / 1000}k`}
                        label={{ value: 'Tutar (₺)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Bar dataKey="value" name="Sipariş Tutarı" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Order Status Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="px-6 py-4 border-b border-gray-200">
                  <CardTitle className="text-base font-medium">Sipariş Durumu Dağılımı</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Beklemede", value: orderSummary?.pending || 0 },
                            { name: "Üretimde", value: orderSummary?.production || 0 },
                            { name: "Sevkiyat", value: orderSummary?.shipping || 0 },
                            { name: "Tamamlandı", value: orderSummary?.completed || 0 }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {[0, 1, 2, 3].map((index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, "Adet"]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="px-6 py-4 border-b border-gray-200">
                  <CardTitle className="text-base font-medium">En Çok Satış Yapılan Müşteriler</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={customerDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {customerDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`%${value}`, "Oran"]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Customers Tab Content */}
          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader className="px-6 py-4 border-b border-gray-200">
                <CardTitle className="text-base font-medium">Müşteri İstatistikleri</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8 text-gray-500">
                  <p>Müşteri raporları yakında eklenecektir.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Products Tab Content */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader className="px-6 py-4 border-b border-gray-200">
                <CardTitle className="text-base font-medium">En Çok Satılan Kumaş Tipleri</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fabricTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {fabricTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`%${value}`, "Oran"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
