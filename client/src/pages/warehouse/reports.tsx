import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, subMonths, startOfMonth, endOfMonth, subDays } from "date-fns";
import { tr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  AlertTriangle,
  BarChart3, 
  Box, 
  CalendarRange, 
  Download, 
  FileDown, 
  Filter, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon, 
  RefreshCw, 
  Search,
  Truck,
  TrendingDown,
  TrendingUp,
  Users
} from "lucide-react";

// Grafik için renkler
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function WarehouseReports() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<string>("stock");
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });
  const [chartType, setChartType] = useState<string>("bar");
  const [filterValue, setFilterValue] = useState<string>("");

  // Stok raporu verileri
  const { data: stockReport = [], isLoading: isLoadingStock } = useQuery({
    queryKey: ['/api/warehouse/reports/stock', dateRange],
    queryFn: async () => {
      const res = await apiRequest(
        "GET", 
        `/api/warehouse/reports/stock?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`
      );
      return await res.json();
    }
  });

  // Giriş-çıkış raporu verileri
  const { data: movementReport = [], isLoading: isLoadingMovements } = useQuery({
    queryKey: ['/api/warehouse/reports/movements', dateRange],
    queryFn: async () => {
      const res = await apiRequest(
        "GET", 
        `/api/warehouse/reports/movements?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`
      );
      return await res.json();
    }
  });

  // Tedarikçi raporu verileri
  const { data: supplierReport = [], isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['/api/warehouse/reports/suppliers', dateRange],
    queryFn: async () => {
      const res = await apiRequest(
        "GET", 
        `/api/warehouse/reports/suppliers?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`
      );
      return await res.json();
    }
  });

  // Özet metrikleri
  const { data: metrics = {}, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['/api/warehouse/metrics'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/warehouse/metrics");
      return await res.json();
    }
  });

  // Tarih aralığı ayarlama yardımcıları
  const handleLast30Days = () => {
    setDateRange({
      from: subDays(new Date(), 30),
      to: new Date()
    });
  };

  const handleLastMonth = () => {
    const today = new Date();
    const firstDayPrevMonth = startOfMonth(subMonths(today, 1));
    const lastDayPrevMonth = endOfMonth(subMonths(today, 1));
    
    setDateRange({
      from: firstDayPrevMonth,
      to: lastDayPrevMonth
    });
  };

  const handleThisMonth = () => {
    const today = new Date();
    const firstDayThisMonth = startOfMonth(today);
    
    setDateRange({
      from: firstDayThisMonth,
      to: today
    });
  };

  // CSV indirme fonksiyonu
  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast({
        title: "Hata",
        description: "İndirilecek veri bulunamadı",
        variant: "destructive",
      });
      return;
    }

    // CSV başlıklarını veri anahtarlarından oluştur
    const headers = Object.keys(data[0]);
    
    // CSV içeriğini oluştur
    let csvContent = headers.join(",") + "\n";
    
    // Her satır için veri ekle
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || "";
        // Eğer değer virgül içeriyorsa tırnak içine al
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      });
      csvContent += values.join(",") + "\n";
    });
    
    // CSV dosyasını indir
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Grafik renderlaması
  const renderChart = (data: any[], dataKey: string, nameKey: string) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-dashed">
          <Box className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Görüntülenecek veri bulunamadı</p>
        </div>
      );
    }

    // Verileri filtrele
    const filteredData = filterValue 
      ? data.filter((item: any) => 
          String(item[nameKey]).toLowerCase().includes(filterValue.toLowerCase()))
      : data;

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={filteredData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={nameKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={dataKey} fill="#8884d8" name="Miktar" />
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={filteredData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={nameKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={dataKey} stroke="#8884d8" name="Miktar" />
            </LineChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={filteredData}
                dataKey={dataKey}
                nameKey={nameKey}
                cx="50%"
                cy="50%"
                outerRadius={150}
                fill="#8884d8"
                label={({name, value}) => `${name}: ${value}`}
              >
                {filteredData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => [value, props.payload[nameKey]]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  // Metrik kartları
  const metricCards = [
    {
      title: "Toplam Stok",
      value: metrics.totalStock || 0,
      unit: "Metre",
      icon: <Box className="h-5 w-5" />,
      color: "bg-blue-50 text-blue-700"
    },
    {
      title: "Stok Giriş",
      value: metrics.totalIn || 0,
      unit: "Metre",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "bg-green-50 text-green-700"
    },
    {
      title: "Stok Çıkış",
      value: metrics.totalOut || 0,
      unit: "Metre",
      icon: <TrendingDown className="h-5 w-5" />,
      color: "bg-red-50 text-red-700"
    },
    {
      title: "Kritik Stok",
      value: metrics.lowStock || 0,
      unit: "Kalem",
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "bg-amber-50 text-amber-700"
    }
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kumaş Depo Raporları</h1>
          <p className="text-muted-foreground">
            Kumaş depoya ait stok, giriş-çıkış ve tedarikçi raporlarını görüntüleyin.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <FileDown className="mr-2 h-4 w-4" />
            <span>Yazdır</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              switch (selectedTab) {
                case "stock":
                  downloadCSV(stockReport, "stok-raporu.csv");
                  break;
                case "movements":
                  downloadCSV(movementReport, "hareket-raporu.csv");
                  break;
                case "suppliers":
                  downloadCSV(supplierReport, "tedarikci-raporu.csv");
                  break;
              }
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            <span>CSV İndir</span>
          </Button>
        </div>
      </div>

      {/* Metrik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <div className="flex items-baseline mt-1">
                    <h3 className="text-2xl font-bold">
                      {isLoadingMetrics ? "..." : card.value}
                    </h3>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {card.unit}
                    </span>
                  </div>
                </div>
                <div className={`p-2 rounded-full ${card.color}`}>
                  {card.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Raporlar</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLast30Days}
                >
                  Son 30 Gün
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLastMonth}
                >
                  Geçen Ay
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleThisMonth}
                >
                  Bu Ay
                </Button>
              </div>
              <DateRangePicker
                className="w-auto"
                value={dateRange}
                onValueChange={setDateRange}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={selectedTab} 
            onValueChange={setSelectedTab}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="stock">Stok Raporu</TabsTrigger>
              <TabsTrigger value="movements">Giriş/Çıkış Raporu</TabsTrigger>
              <TabsTrigger value="suppliers">Tedarikçi Raporu</TabsTrigger>
            </TabsList>
            
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="flex items-center">
                <Label className="mr-2">Grafik Tipi:</Label>
                <Select 
                  value={chartType} 
                  onValueChange={setChartType}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Grafik Tipi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">
                      <div className="flex items-center">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span>Sütun Grafik</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="line">
                      <div className="flex items-center">
                        <LineChartIcon className="mr-2 h-4 w-4" />
                        <span>Çizgi Grafik</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="pie">
                      <div className="flex items-center">
                        <PieChartIcon className="mr-2 h-4 w-4" />
                        <span>Pasta Grafik</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Filtreleme..."
                  className="pl-8 w-full" 
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => {
                  setFilterValue("");
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            
            <TabsContent value="stock" className="space-y-4">
              <div className="h-[400px] w-full">
                {isLoadingStock ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin h-8 w-8 border-t-2 border-blue-500 rounded-full" />
                  </div>
                ) : renderChart(stockReport, 'quantity', 'itemName')}
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün Kodu</TableHead>
                      <TableHead>Ürün Adı</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Birim</TableHead>
                      <TableHead>Değer (TL)</TableHead>
                      <TableHead>Lokasyon</TableHead>
                      <TableHead>Son Güncelleme</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingStock ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">Yükleniyor...</TableCell>
                      </TableRow>
                    ) : stockReport.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">Kayıt bulunamadı</TableCell>
                      </TableRow>
                    ) : (
                      stockReport
                        .filter(item => 
                          filterValue 
                            ? item.itemName.toLowerCase().includes(filterValue.toLowerCase()) ||
                              item.itemCode.toLowerCase().includes(filterValue.toLowerCase())
                            : true
                        )
                        .map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.itemCode}</TableCell>
                            <TableCell>{item.itemName}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>{item.value?.toLocaleString("tr-TR")}</TableCell>
                            <TableCell>{item.location}</TableCell>
                            <TableCell>{format(new Date(item.lastUpdated), 'dd MMM yyyy', {locale: tr})}</TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="movements" className="space-y-4">
              <div className="h-[400px] w-full">
                {isLoadingMovements ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin h-8 w-8 border-t-2 border-blue-500 rounded-full" />
                  </div>
                ) : renderChart(movementReport, 'quantity', 'date')}
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Hareket Tipi</TableHead>
                      <TableHead>Ürün Kodu</TableHead>
                      <TableHead>Ürün Adı</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Referans No</TableHead>
                      <TableHead>Kullanıcı</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingMovements ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">Yükleniyor...</TableCell>
                      </TableRow>
                    ) : movementReport.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">Kayıt bulunamadı</TableCell>
                      </TableRow>
                    ) : (
                      movementReport
                        .filter(item => 
                          filterValue 
                            ? item.itemName.toLowerCase().includes(filterValue.toLowerCase()) ||
                              item.itemCode.toLowerCase().includes(filterValue.toLowerCase()) ||
                              item.movementType.toLowerCase().includes(filterValue.toLowerCase())
                            : true
                        )
                        .map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{format(new Date(item.date), 'dd MMM yyyy', {locale: tr})}</TableCell>
                            <TableCell>
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.movementType === 'Giriş' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {item.movementType}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{item.itemCode}</TableCell>
                            <TableCell>{item.itemName}</TableCell>
                            <TableCell>{item.quantity} {item.unit}</TableCell>
                            <TableCell>{item.referenceNo}</TableCell>
                            <TableCell>{item.username}</TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="suppliers" className="space-y-4">
              <div className="h-[400px] w-full">
                {isLoadingSuppliers ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin h-8 w-8 border-t-2 border-blue-500 rounded-full" />
                  </div>
                ) : renderChart(supplierReport, 'totalQuantity', 'supplierName')}
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tedarikçi</TableHead>
                      <TableHead>Toplam Miktar</TableHead>
                      <TableHead>Toplam Değer (TL)</TableHead>
                      <TableHead>Son Teslimat</TableHead>
                      <TableHead>Sipariş Sayısı</TableHead>
                      <TableHead>Ortalama Teslimat Süresi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingSuppliers ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">Yükleniyor...</TableCell>
                      </TableRow>
                    ) : supplierReport.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">Kayıt bulunamadı</TableCell>
                      </TableRow>
                    ) : (
                      supplierReport
                        .filter(item => 
                          filterValue 
                            ? item.supplierName.toLowerCase().includes(filterValue.toLowerCase())
                            : true
                        )
                        .map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.supplierName}</TableCell>
                            <TableCell>{item.totalQuantity} {item.unit}</TableCell>
                            <TableCell>{item.totalValue?.toLocaleString("tr-TR")}</TableCell>
                            <TableCell>
                              {item.lastDelivery 
                                ? format(new Date(item.lastDelivery), 'dd MMM yyyy', {locale: tr})
                                : "-"}
                            </TableCell>
                            <TableCell>{item.orderCount}</TableCell>
                            <TableCell>{item.avgDeliveryTime} gün</TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}