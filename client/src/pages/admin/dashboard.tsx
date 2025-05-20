import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
} from "recharts";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";
import {
  CalendarIcon,
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  UserIcon,
  BoxIcon,
  FactoryIcon,
  LineChartIcon,
  BarChart3Icon,
  RotateCcwIcon,
  PackageCheckIcon,
  PackageOpenIcon,
  TimerIcon,
  ActivityIcon,
  InfinityIcon,
  HeartHandshakeIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

// Renk paleti
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

// Tablo sütunları
const salesColumns: ColumnDef<any>[] = [
  {
    accessorKey: "orderNumber",
    header: "Sipariş No",
    cell: ({ row }) => (
      <Link to={`/satis-pazarlama/siparisler/${row.original.id}`}>
        <span className="text-blue-600 hover:underline">{row.getValue("orderNumber")}</span>
      </Link>
    ),
  },
  {
    accessorKey: "customerName",
    header: "Müşteri",
  },
  {
    accessorKey: "salesPerson",
    header: "Satışçı",
  },
  {
    accessorKey: "orderDate",
    header: "Sipariş Tarihi",
    cell: ({ row }) => {
      const date = new Date(row.getValue("orderDate"));
      return <span>{date.toLocaleDateString("tr-TR")}</span>;
    },
  },
  {
    accessorKey: "dueDate",
    header: "Termin Tarihi",
    cell: ({ row }) => {
      const date = new Date(row.getValue("dueDate"));
      return <span>{date.toLocaleDateString("tr-TR")}</span>;
    },
  },
  {
    accessorKey: "quantity",
    header: "Miktar",
    cell: ({ row }) => (
      <span>{row.getValue("quantity")} {row.original.unit}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusColors: Record<string, string> = {
        "Beklemede": "bg-blue-500",
        "Üretimde": "bg-green-500",
        "Sevkiyat Bekliyor": "bg-amber-500",
        "Tamamlandı": "bg-green-700",
        "İptal Edildi": "bg-red-500",
      };
      return (
        <Badge className={`${statusColors[status] || "bg-gray-500"}`}>
          {status}
        </Badge>
      );
    },
  },
];

const productionColumns: ColumnDef<any>[] = [
  {
    accessorKey: "planNo",
    header: "Plan No",
    cell: ({ row }) => (
      <Link to={`/planlama/uretim-planlari/${row.original.id}`}>
        <span className="text-blue-600 hover:underline">{row.getValue("planNo")}</span>
      </Link>
    ),
  },
  {
    accessorKey: "orderNumber",
    header: "Sipariş No",
    cell: ({ row }) => (
      <Link to={`/satis-pazarlama/siparisler/${row.original.orderId}`}>
        <span className="text-blue-600 hover:underline">{row.getValue("orderNumber")}</span>
      </Link>
    ),
  },
  {
    accessorKey: "productionStartDate",
    header: "Başlangıç",
    cell: ({ row }) => {
      const date = new Date(row.getValue("productionStartDate"));
      return <span>{date.toLocaleDateString("tr-TR")}</span>;
    },
  },
  {
    accessorKey: "productionEndDate",
    header: "Bitiş",
    cell: ({ row }) => {
      const date = new Date(row.getValue("productionEndDate"));
      return <span>{date.toLocaleDateString("tr-TR")}</span>;
    },
  },
  {
    accessorKey: "remainingDays",
    header: "Kalan Gün",
    cell: ({ row }) => {
      const remaining = row.getValue("remainingDays") as number;
      return (
        <Badge className={remaining < 3 ? "bg-red-500" : remaining < 7 ? "bg-amber-500" : "bg-green-500"}>
          {remaining <= 0 ? "Gecikmiş" : `${remaining} gün`}
        </Badge>
      );
    },
  },
  {
    accessorKey: "progress",
    header: "İlerleme",
    cell: ({ row }) => {
      const progress = row.getValue("progress") as number;
      return (
        <div className="w-full">
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-right mt-1">{progress}%</div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusColors: Record<string, string> = {
        "Beklemede": "bg-blue-500",
        "Üretimde": "bg-green-500",
        "Duraklatıldı": "bg-amber-500",
        "Tamamlandı": "bg-green-700",
        "İptal Edildi": "bg-red-500",
      };
      return (
        <Badge className={`${statusColors[status] || "bg-gray-500"}`}>
          {status}
        </Badge>
      );
    },
  },
];

const machineQueueColumns: ColumnDef<any>[] = [
  {
    accessorKey: "machineName",
    header: "Makine Adı",
  },
  {
    accessorKey: "ordersCount",
    header: "Bekleyen İş Sayısı",
    cell: ({ row }) => (
      <Badge variant="outline" className="bg-blue-50">
        {row.getValue("ordersCount")}
      </Badge>
    ),
  },
  {
    accessorKey: "totalQuantity",
    header: "Toplam Miktar",
    cell: ({ row }) => (
      <span>{row.getValue("totalQuantity")} metre</span>
    ),
  },
  {
    accessorKey: "estimatedCompletionTime",
    header: "Tahmini Bitiş",
    cell: ({ row }) => {
      const days = row.getValue("estimatedCompletionTime") as number;
      return (
        <Badge className={days > 14 ? "bg-red-500" : days > 7 ? "bg-amber-500" : "bg-green-500"}>
          {days} gün
        </Badge>
      );
    },
  },
  {
    accessorKey: "currentOrderNumber",
    header: "Mevcut İş",
    cell: ({ row }) => (
      <div className="flex items-center">
        <ActivityIcon className="w-4 h-4 mr-2 text-green-500" />
        <span>{row.getValue("currentOrderNumber") || "Boşta"}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusColors: Record<string, string> = {
        "Çalışıyor": "bg-green-500",
        "Duraklatıldı": "bg-amber-500",
        "Arızalı": "bg-red-500",
        "Bakımda": "bg-blue-500",
        "Boşta": "bg-gray-500",
      };
      return (
        <Badge className={`${statusColors[status] || "bg-gray-500"}`}>
          {status}
        </Badge>
      );
    },
  },
];

const qualityColumns: ColumnDef<any>[] = [
  {
    accessorKey: "orderNumber",
    header: "Sipariş No",
    cell: ({ row }) => (
      <Link to={`/satis-pazarlama/siparisler/${row.original.orderId}`}>
        <span className="text-blue-600 hover:underline">{row.getValue("orderNumber")}</span>
      </Link>
    ),
  },
  {
    accessorKey: "fabricType",
    header: "Kumaş Türü",
  },
  {
    accessorKey: "qualityScore",
    header: "Kalite Puanı",
    cell: ({ row }) => {
      const score = row.getValue("qualityScore") as number;
      return (
        <Badge className={score >= 90 ? "bg-green-500" : score >= 70 ? "bg-amber-500" : "bg-red-500"}>
          {score}/100
        </Badge>
      );
    },
  },
  {
    accessorKey: "defectCount",
    header: "Hata Sayısı",
    cell: ({ row }) => (
      <Badge variant="outline" className={`${parseInt(row.getValue("defectCount")) > 5 ? "text-red-500 border-red-500" : "text-gray-500"}`}>
        {row.getValue("defectCount")}
      </Badge>
    ),
  },
  {
    accessorKey: "inspectionDate",
    header: "Kontrol Tarihi",
    cell: ({ row }) => {
      const date = new Date(row.getValue("inspectionDate"));
      return <span>{date.toLocaleDateString("tr-TR")}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Sonuç",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusColors: Record<string, string> = {
        "Geçti": "bg-green-500",
        "Şartlı Geçti": "bg-amber-500",
        "Kaldı": "bg-red-500",
        "Tekrar Kontrol": "bg-blue-500",
      };
      return (
        <Badge className={`${statusColors[status] || "bg-gray-500"}`}>
          {status}
        </Badge>
      );
    },
  },
];

const shipmentColumns: ColumnDef<any>[] = [
  {
    accessorKey: "orderNumber",
    header: "Sipariş No",
    cell: ({ row }) => (
      <Link to={`/satis-pazarlama/siparisler/${row.original.orderId}`}>
        <span className="text-blue-600 hover:underline">{row.getValue("orderNumber")}</span>
      </Link>
    ),
  },
  {
    accessorKey: "customerName",
    header: "Müşteri",
  },
  {
    accessorKey: "plannedShipmentDate",
    header: "Planlanan Sevkiyat",
    cell: ({ row }) => {
      const date = new Date(row.getValue("plannedShipmentDate"));
      return <span>{date.toLocaleDateString("tr-TR")}</span>;
    },
  },
  {
    accessorKey: "actualShipmentDate",
    header: "Gerçekleşen Sevkiyat",
    cell: ({ row }) => {
      const value = row.getValue("actualShipmentDate");
      if (!value) return <span className="text-gray-400">-</span>;
      const date = new Date(value as string);
      return <span>{date.toLocaleDateString("tr-TR")}</span>;
    },
  },
  {
    accessorKey: "quantity",
    header: "Miktar",
    cell: ({ row }) => (
      <span>{row.getValue("quantity")} {row.original.unit}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusColors: Record<string, string> = {
        "Planlandı": "bg-blue-500",
        "Hazırlanıyor": "bg-amber-500",
        "Yola Çıktı": "bg-green-500",
        "Teslim Edildi": "bg-green-700",
        "Gecikti": "bg-red-500",
        "İptal Edildi": "bg-gray-500",
      };
      return (
        <Badge className={`${statusColors[status] || "bg-gray-500"}`}>
          {status}
        </Badge>
      );
    },
  },
];

// Dashboard ana bileşeni
export default function AdminDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("genel");

  // Sipariş özet verilerini çek
  const { data: orderSummary, isLoading: isOrderSummaryLoading } = useQuery({
    queryKey: ["/api/admin/dashboard/order-summary"],
    queryFn: async () => {
      const response = await fetch("/api/admin/dashboard/order-summary");
      if (!response.ok) {
        throw new Error("Sipariş özeti alınamadı");
      }
      return response.json();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Sipariş özeti alınamadı: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
        variant: "destructive",
      });
      return {
        pending: 0,
        production: 0,
        shipping: 0,
        completed: 0,
        pendingValue: 0,
        productionValue: 0,
        shippingValue: 0,
        completedValue: 0,
      };
    },
  });

  // Satışçıların siparişlerini çek
  const { data: salesOrders, isLoading: isSalesOrdersLoading } = useQuery({
    queryKey: ["/api/admin/dashboard/sales-orders"],
    queryFn: async () => {
      const response = await fetch("/api/admin/dashboard/sales-orders");
      if (!response.ok) {
        throw new Error("Satış siparişleri alınamadı");
      }
      return response.json();
    },
    enabled: activeTab === "satis" || activeTab === "genel",
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Satış siparişleri alınamadı: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
        variant: "destructive",
      });
      return [];
    },
  });

  // Termin durumuna göre siparişleri çek
  const { data: dueDateOrders, isLoading: isDueDateOrdersLoading } = useQuery({
    queryKey: ["/api/admin/dashboard/duedate-orders"],
    queryFn: async () => {
      const response = await fetch("/api/admin/dashboard/duedate-orders");
      if (!response.ok) {
        throw new Error("Termin siparişleri alınamadı");
      }
      return response.json();
    },
    enabled: activeTab === "termin" || activeTab === "genel",
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Termin siparişleri alınamadı: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
        variant: "destructive",
      });
      return [];
    },
  });

  // Üretim durumları
  const { data: productionPlans, isLoading: isProductionPlansLoading } = useQuery({
    queryKey: ["/api/admin/dashboard/production-plans"],
    queryFn: async () => {
      const response = await fetch("/api/admin/dashboard/production-plans");
      if (!response.ok) {
        throw new Error("Üretim planları alınamadı");
      }
      return response.json();
    },
    enabled: activeTab === "uretim" || activeTab === "genel",
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Üretim planları alınamadı: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
        variant: "destructive",
      });
      return [];
    },
  });

  // Makine bekleyen işler
  const { data: machineQueues, isLoading: isMachineQueuesLoading } = useQuery({
    queryKey: ["/api/admin/dashboard/machine-queues"],
    queryFn: async () => {
      const response = await fetch("/api/admin/dashboard/machine-queues");
      if (!response.ok) {
        throw new Error("Makine kuyrukları alınamadı");
      }
      return response.json();
    },
    enabled: activeTab === "makine" || activeTab === "genel",
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Makine kuyrukları alınamadı: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
        variant: "destructive",
      });
      return [];
    },
  });

  // Kalite kontrol raporları
  const { data: qualityReports, isLoading: isQualityReportsLoading } = useQuery({
    queryKey: ["/api/admin/dashboard/quality-reports"],
    queryFn: async () => {
      const response = await fetch("/api/admin/dashboard/quality-reports");
      if (!response.ok) {
        throw new Error("Kalite raporları alınamadı");
      }
      return response.json();
    },
    enabled: activeTab === "kalite" || activeTab === "genel",
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Kalite raporları alınamadı: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
        variant: "destructive",
      });
      return [];
    },
  });

  // Sevkiyat raporları
  const { data: shipmentReports, isLoading: isShipmentReportsLoading } = useQuery({
    queryKey: ["/api/admin/dashboard/shipment-reports"],
    queryFn: async () => {
      const response = await fetch("/api/admin/dashboard/shipment-reports");
      if (!response.ok) {
        throw new Error("Sevkiyat raporları alınamadı");
      }
      return response.json();
    },
    enabled: activeTab === "sevkiyat" || activeTab === "genel",
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Sevkiyat raporları alınamadı: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
        variant: "destructive",
      });
      return [];
    },
  });

  // Haftalık satış trendleri
  const { data: salesTrends, isLoading: isSalesTrendsLoading } = useQuery({
    queryKey: ["/api/admin/dashboard/sales-trends"],
    queryFn: async () => {
      const response = await fetch("/api/admin/dashboard/sales-trends");
      if (!response.ok) {
        throw new Error("Satış trendleri alınamadı");
      }
      return response.json();
    },
    enabled: activeTab === "genel",
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Satış trendleri alınamadı: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
        variant: "destructive",
      });
      return [];
    },
  });

  // Sipariş durumu özet verileri için grafik verileri
  const orderStatusData = orderSummary
    ? [
        { name: "Beklemede", value: orderSummary.pending, amount: orderSummary.pendingValue },
        { name: "Üretimde", value: orderSummary.production, amount: orderSummary.productionValue },
        { name: "Sevkiyat Bekliyor", value: orderSummary.shipping, amount: orderSummary.shippingValue },
        { name: "Tamamlandı", value: orderSummary.completed, amount: orderSummary.completedValue },
      ]
    : [];

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yönetim Paneli</h1>
          <p className="text-muted-foreground">
            Tekstil fabrikası operasyonlarının detaylı izleme ve yönetim arayüzü
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="gap-2">
            <RotateCcwIcon className="h-4 w-4" /> Yenile
          </Button>
          <Badge className="px-3 py-1 bg-blue-600">
            {new Date().toLocaleDateString("tr-TR")}
          </Badge>
        </div>
      </div>

      <Tabs
        defaultValue="genel"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-8 bg-muted/50">
          <TabsTrigger value="genel" className="data-[state=active]:bg-background">
            <LineChartIcon className="h-4 w-4 mr-2" /> Genel Bakış
          </TabsTrigger>
          <TabsTrigger value="satis" className="data-[state=active]:bg-background">
            <HeartHandshakeIcon className="h-4 w-4 mr-2" /> Satış Raporu
          </TabsTrigger>
          <TabsTrigger value="termin" className="data-[state=active]:bg-background">
            <CalendarIcon className="h-4 w-4 mr-2" /> Termin Durumu
          </TabsTrigger>
          <TabsTrigger value="uretim" className="data-[state=active]:bg-background">
            <FactoryIcon className="h-4 w-4 mr-2" /> Üretim Durumu
          </TabsTrigger>
          <TabsTrigger value="makine" className="data-[state=active]:bg-background">
            <InfinityIcon className="h-4 w-4 mr-2" /> Makine İş Yükü
          </TabsTrigger>
          <TabsTrigger value="kalite" className="data-[state=active]:bg-background">
            <PackageCheckIcon className="h-4 w-4 mr-2" /> Kalite Raporları
          </TabsTrigger>
          <TabsTrigger value="sevkiyat" className="data-[state=active]:bg-background">
            <TruckIcon className="h-4 w-4 mr-2" /> Sevkiyat Durumu
          </TabsTrigger>
        </TabsList>

        {/* Genel Bakış Sekmesi */}
        <TabsContent value="genel" className="space-y-8">
          {/* Özet Kartlar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 text-blue-500" /> Bekleyen Siparişler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isOrderSummaryLoading ? "..." : orderSummary?.pending || 0}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Toplam değer: {isOrderSummaryLoading ? "..." : (orderSummary?.pendingValue || 0).toLocaleString("tr-TR")} ₺
                </div>
                <Progress className="h-2 mt-3" value={orderSummary ? (orderSummary.pending / (orderSummary.pending + orderSummary.production + orderSummary.shipping + orderSummary.completed) * 100) : 0} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <FactoryIcon className="h-5 w-5 mr-2 text-green-500" /> Üretimdeki Siparişler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isOrderSummaryLoading ? "..." : orderSummary?.production || 0}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Toplam değer: {isOrderSummaryLoading ? "..." : (orderSummary?.productionValue || 0).toLocaleString("tr-TR")} ₺
                </div>
                <Progress className="h-2 mt-3" value={orderSummary ? (orderSummary.production / (orderSummary.pending + orderSummary.production + orderSummary.shipping + orderSummary.completed) * 100) : 0} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <TruckIcon className="h-5 w-5 mr-2 text-amber-500" /> Sevkiyat Bekleyenler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isOrderSummaryLoading ? "..." : orderSummary?.shipping || 0}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Toplam değer: {isOrderSummaryLoading ? "..." : (orderSummary?.shippingValue || 0).toLocaleString("tr-TR")} ₺
                </div>
                <Progress className="h-2 mt-3" value={orderSummary ? (orderSummary.shipping / (orderSummary.pending + orderSummary.production + orderSummary.shipping + orderSummary.completed) * 100) : 0} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-green-700" /> Tamamlanan Siparişler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isOrderSummaryLoading ? "..." : orderSummary?.completed || 0}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Toplam değer: {isOrderSummaryLoading ? "..." : (orderSummary?.completedValue || 0).toLocaleString("tr-TR")} ₺
                </div>
                <Progress className="h-2 mt-3" value={orderSummary ? (orderSummary.completed / (orderSummary.pending + orderSummary.production + orderSummary.shipping + orderSummary.completed) * 100) : 0} />
              </CardContent>
            </Card>
          </div>

          {/* Grafik ve Analiz Bölümü */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Sipariş Durum Dağılımı</CardTitle>
                <CardDescription>Mevcut siparişlerin durum bazlı dağılımı</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isOrderSummaryLoading ? (
                  <div className="flex items-center justify-center h-full">Yükleniyor...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {orderStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => {
                          if (name === "value") {
                            return [`${value} adet`, "Sipariş Sayısı"];
                          }
                          return [`${value.toLocaleString("tr-TR")} ₺`, "Toplam Değer"];
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Haftalık Satış Trendi</CardTitle>
                <CardDescription>Son dört haftadaki sipariş değişimi</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isSalesTrendsLoading ? (
                  <div className="flex items-center justify-center h-full">Yükleniyor...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={salesTrends}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} adet`, "Sipariş Sayısı"]} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="orders"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.2}
                        name="Sipariş Sayısı"
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.2}
                        name="Toplam Değer"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Kritik Öğeler ve Özet Tablolar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Son Gelen Siparişler */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-blue-500" /> Satışçı Performansı
                </CardTitle>
                <CardDescription>Satış temsilcilerinin son siparişleri</CardDescription>
              </CardHeader>
              <CardContent>
                {isSalesOrdersLoading ? (
                  <div className="flex items-center justify-center h-40">Yükleniyor...</div>
                ) : (
                  <DataTable 
                    columns={salesColumns} 
                    data={salesOrders?.slice(0, 5) || []} 
                    pagination={false}
                  />
                )}
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-end">
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <Link href="/admin/dashboard/satis">
                    Tüm Satış Raporlarını Gör
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Üretim Durumu */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TimerIcon className="h-5 w-5 mr-2 text-green-500" /> Termin Durumu
                </CardTitle>
                <CardDescription>Yaklaşan termin tarihlerine göre siparişler</CardDescription>
              </CardHeader>
              <CardContent>
                {isDueDateOrdersLoading ? (
                  <div className="flex items-center justify-center h-40">Yükleniyor...</div>
                ) : (
                  <DataTable 
                    columns={salesColumns} 
                    data={dueDateOrders?.slice(0, 5) || []} 
                    pagination={false}
                  />
                )}
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-end">
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <Link href="/admin/dashboard/termin">
                    Tüm Termin Raporlarını Gör
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Satış Raporu Sekmesi */}
        <TabsContent value="satis" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HeartHandshakeIcon className="h-5 w-5 mr-2 text-blue-500" /> Satışçıların Açtığı Siparişler
              </CardTitle>
              <CardDescription>Satış temsilcilerine göre açılan siparişlerin detaylı listesi</CardDescription>
            </CardHeader>
            <CardContent>
              {isSalesOrdersLoading ? (
                <div className="flex items-center justify-center h-96">Yükleniyor...</div>
              ) : (
                <DataTable 
                  columns={salesColumns} 
                  data={salesOrders || []} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Termin Raporu Sekmesi */}
        <TabsContent value="termin" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-amber-500" /> Termin Süresine Göre Siparişler
              </CardTitle>
              <CardDescription>Termin tarihlerine göre sıralanmış siparişlerin detaylı listesi</CardDescription>
            </CardHeader>
            <CardContent>
              {isDueDateOrdersLoading ? (
                <div className="flex items-center justify-center h-96">Yükleniyor...</div>
              ) : (
                <DataTable 
                  columns={salesColumns} 
                  data={dueDateOrders || []} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Üretim Raporu Sekmesi */}
        <TabsContent value="uretim" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FactoryIcon className="h-5 w-5 mr-2 text-green-500" /> Üretim Planları ve İlerleme Durumu
              </CardTitle>
              <CardDescription>Üretimde olan siparişlerin mevcut durum ve ilerleme oranları</CardDescription>
            </CardHeader>
            <CardContent>
              {isProductionPlansLoading ? (
                <div className="flex items-center justify-center h-96">Yükleniyor...</div>
              ) : (
                <DataTable 
                  columns={productionColumns} 
                  data={productionPlans || []} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Makine İş Yükü Sekmesi */}
        <TabsContent value="makine" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <InfinityIcon className="h-5 w-5 mr-2 text-purple-500" /> Makinelerdeki Bekleyen İşler
              </CardTitle>
              <CardDescription>Makinelerin mevcut iş yükü ve bekleyen siparişlerin durumu</CardDescription>
            </CardHeader>
            <CardContent>
              {isMachineQueuesLoading ? (
                <div className="flex items-center justify-center h-96">Yükleniyor...</div>
              ) : (
                <DataTable 
                  columns={machineQueueColumns} 
                  data={machineQueues || []} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kalite Raporu Sekmesi */}
        <TabsContent value="kalite" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PackageCheckIcon className="h-5 w-5 mr-2 text-blue-500" /> Kalite Kontrol Raporları
              </CardTitle>
              <CardDescription>Siparişlerin kalite kontrol sonuçları ve değerlendirmeleri</CardDescription>
            </CardHeader>
            <CardContent>
              {isQualityReportsLoading ? (
                <div className="flex items-center justify-center h-96">Yükleniyor...</div>
              ) : (
                <DataTable 
                  columns={qualityColumns} 
                  data={qualityReports || []} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sevkiyat Raporu Sekmesi */}
        <TabsContent value="sevkiyat" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TruckIcon className="h-5 w-5 mr-2 text-amber-500" /> Sevkiyat Durumu
              </CardTitle>
              <CardDescription>Sevkiyat bekleyen ve tamamlanan siparişlerin detaylı listesi</CardDescription>
            </CardHeader>
            <CardContent>
              {isShipmentReportsLoading ? (
                <div className="flex items-center justify-center h-96">Yükleniyor...</div>
              ) : (
                <DataTable 
                  columns={shipmentColumns} 
                  data={shipmentReports || []} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}