import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  Search, 
  BarChart, 
  MapPin, 
  Truck, 
  FileText, 
  Calendar, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  TimerOff
} from "lucide-react";

// Sahte takip verileri
const dummyShipmentTracking = [
  {
    id: 1,
    trackingNumber: "TRK-2023-001",
    orderNumber: "SIP-2023-001",
    customerName: "Tekstil A.Ş.",
    destination: "İstanbul",
    shipmentDate: new Date("2025-05-06"),
    estimatedDelivery: new Date("2025-05-08"),
    actualDelivery: new Date("2025-05-08"),
    carrier: "Lojistik A.Ş.",
    status: "Teslim Edildi",
    lastUpdated: new Date("2025-05-08T14:30:00"),
    events: [
      {
        id: 1,
        date: new Date("2025-05-06T09:15:00"),
        location: "Fabrika",
        status: "Sevkiyata Hazırlandı",
        details: "Ürünler ambalajlandı ve sevkiyata hazırlandı.",
      },
      {
        id: 2,
        date: new Date("2025-05-06T11:30:00"),
        location: "Fabrika",
        status: "Yükleme Yapıldı",
        details: "Ürünler araca yüklendi.",
      },
      {
        id: 3,
        date: new Date("2025-05-07T09:45:00"),
        location: "Ankara",
        status: "Transit",
        details: "Ürünler transit durumda, varış noktasına ilerliyor.",
      },
      {
        id: 4,
        date: new Date("2025-05-08T10:20:00"),
        location: "İstanbul",
        status: "Dağıtımda",
        details: "Ürünler dağıtım merkezine ulaştı, teslimat için hazırlanıyor.",
      },
      {
        id: 5,
        date: new Date("2025-05-08T14:30:00"),
        location: "İstanbul",
        status: "Teslim Edildi",
        details: "Ürünler müşteriye teslim edildi.",
      },
    ],
  },
  {
    id: 2,
    trackingNumber: "TRK-2023-002",
    orderNumber: "SIP-2023-002",
    customerName: "Kumaş Ltd.",
    destination: "Ankara",
    shipmentDate: new Date("2025-05-08"),
    estimatedDelivery: new Date("2025-05-10"),
    actualDelivery: null,
    carrier: "Hızlı Taşıma Ltd.",
    status: "Yolda",
    lastUpdated: new Date("2025-05-09T11:15:00"),
    events: [
      {
        id: 1,
        date: new Date("2025-05-08T08:45:00"),
        location: "Fabrika",
        status: "Sevkiyata Hazırlandı",
        details: "Ürünler ambalajlandı ve sevkiyata hazırlandı.",
      },
      {
        id: 2,
        date: new Date("2025-05-08T10:30:00"),
        location: "Fabrika",
        status: "Yükleme Yapıldı",
        details: "Ürünler araca yüklendi.",
      },
      {
        id: 3,
        date: new Date("2025-05-09T11:15:00"),
        location: "Eskişehir",
        status: "Transit",
        details: "Ürünler transit durumda, varış noktasına ilerliyor.",
      },
    ],
  },
  {
    id: 3,
    trackingNumber: "TRK-2023-003",
    orderNumber: "SIP-2023-005",
    customerName: "Global Tekstil",
    destination: "İzmir",
    shipmentDate: new Date("2025-05-10"),
    estimatedDelivery: new Date("2025-05-12"),
    actualDelivery: null,
    carrier: "Hızlı Taşıma Ltd.",
    status: "Hazırlanıyor",
    lastUpdated: new Date("2025-05-10T08:30:00"),
    events: [
      {
        id: 1,
        date: new Date("2025-05-10T08:30:00"),
        location: "Fabrika",
        status: "Sevkiyata Hazırlandı",
        details: "Ürünler ambalajlandı ve sevkiyata hazırlandı.",
      },
    ],
  },
];

// İstatistik verileri
const deliveryStatusData = [
  { name: "Zamanında", value: 85 },
  { name: "Gecikmeli", value: 10 },
  { name: "İptal", value: 5 },
];

const monthlyShipmentData = [
  { name: "Ocak", count: 42 },
  { name: "Şubat", count: 38 },
  { name: "Mart", count: 45 },
  { name: "Nisan", count: 39 },
  { name: "Mayıs", count: 53 },
  { name: "Haziran", count: 48 },
  { name: "Temmuz", count: 51 },
  { name: "Ağustos", count: 55 },
  { name: "Eylül", count: 49 },
  { name: "Ekim", count: 58 },
  { name: "Kasım", count: 63 },
  { name: "Aralık", count: 68 },
];

const carrierPerformanceData = [
  { name: "Lojistik A.Ş.", onTime: 92, delayed: 8 },
  { name: "Hızlı Taşıma Ltd.", onTime: 88, delayed: 12 },
  { name: "Ekspres Kargo", onTime: 95, delayed: 5 },
  { name: "Güvenli Nakliyat", onTime: 90, delayed: 10 },
];

// Renk kodları
const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

// Kolon tanımları
const columns: ColumnDef<typeof dummyShipmentTracking[0]>[] = [
  {
    accessorKey: "trackingNumber",
    header: "Takip No",
  },
  {
    accessorKey: "orderNumber",
    header: "Sipariş No",
  },
  {
    accessorKey: "customerName",
    header: "Müşteri",
  },
  {
    accessorKey: "destination",
    header: "Varış Yeri",
  },
  {
    accessorKey: "shipmentDate",
    header: "Sevkiyat Tarihi",
    cell: ({ row }) => format(row.original.shipmentDate, "dd MMMM yyyy", { locale: tr }),
  },
  {
    accessorKey: "estimatedDelivery",
    header: "Tahmini Teslim",
    cell: ({ row }) => format(row.original.estimatedDelivery, "dd MMMM yyyy", { locale: tr }),
  },
  {
    accessorKey: "carrier",
    header: "Taşıyıcı",
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => {
      const status = row.original.status;
      let color = "";
      let icon = null;
      
      switch (status) {
        case "Teslim Edildi":
          color = "bg-green-100 text-green-800";
          icon = <CheckCircle className="h-3.5 w-3.5 mr-1" />;
          break;
        case "Yolda":
          color = "bg-blue-100 text-blue-800";
          icon = <Truck className="h-3.5 w-3.5 mr-1" />;
          break;
        case "Hazırlanıyor":
          color = "bg-yellow-100 text-yellow-800";
          icon = <FileText className="h-3.5 w-3.5 mr-1" />;
          break;
        case "Gecikme":
          color = "bg-red-100 text-red-800";
          icon = <AlertTriangle className="h-3.5 w-3.5 mr-1" />;
          break;
        case "İptal Edildi":
          color = "bg-gray-100 text-gray-800";
          icon = <TimerOff className="h-3.5 w-3.5 mr-1" />;
          break;
        default:
          color = "bg-gray-100 text-gray-800";
      }
      
      return (
        <Badge className={`${color} flex items-center`}>
          {icon}
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "İşlemler",
    cell: ({ row }) => (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Detaylar
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Sevkiyat Takibi - {row.original.trackingNumber}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Sipariş Bilgileri</h3>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Sipariş No:</span>
                  <span className="text-sm">{row.original.orderNumber}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Müşteri:</span>
                  <span className="text-sm">{row.original.customerName}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Varış Yeri:</span>
                  <span className="text-sm">{row.original.destination}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Taşıyıcı:</span>
                  <span className="text-sm">{row.original.carrier}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Tarih Bilgileri</h3>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Sevkiyat Tarihi:</span>
                  <span className="text-sm">{format(row.original.shipmentDate, "dd MMMM yyyy", { locale: tr })}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Tahmini Teslim:</span>
                  <span className="text-sm">{format(row.original.estimatedDelivery, "dd MMMM yyyy", { locale: tr })}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Gerçek Teslim:</span>
                  <span className="text-sm">
                    {row.original.actualDelivery 
                      ? format(row.original.actualDelivery, "dd MMMM yyyy", { locale: tr }) 
                      : "-"}
                  </span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Durum:</span>
                  <span className="text-sm">{row.original.status}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="font-semibold text-muted-foreground mb-2">Takip Geçmişi</h3>
            <div className="space-y-4">
              {row.original.events.map((event, index) => (
                <div key={event.id} className="flex">
                  <div className="flex flex-col items-center mr-4">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      index === row.original.events.length - 1 
                        ? "bg-green-100 text-green-600" 
                        : "bg-blue-100 text-blue-600"
                    }`}>
                      {index === row.original.events.length - 1 ? 
                        <CheckCircle className="h-4 w-4" /> : 
                        <Truck className="h-4 w-4" />
                      }
                    </div>
                    {index < row.original.events.length - 1 && (
                      <div className="h-full w-0.5 bg-gray-200 my-1" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{event.status}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(event.date, "dd MMM yyyy - HH:mm", { locale: tr })}
                      </p>
                    </div>
                    <div className="flex items-center text-sm mt-1">
                      <MapPin className="h-3.5 w-3.5 text-gray-500 mr-1" />
                      <span className="text-muted-foreground">{event.location}</span>
                    </div>
                    <p className="text-sm mt-1">{event.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    ),
  },
];

function ShipmentTracking() {
  const [searchTrackingNumber, setSearchTrackingNumber] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Filtre uygulanmış veri
  const filteredData = dummyShipmentTracking.filter(shipment => {
    let matchesStatus = true;
    if (filterStatus !== "all") {
      matchesStatus = shipment.status === filterStatus;
    }
    
    const matchesSearch = 
      searchTrackingNumber === "" || 
      shipment.trackingNumber.toLowerCase().includes(searchTrackingNumber.toLowerCase()) ||
      shipment.orderNumber.toLowerCase().includes(searchTrackingNumber.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sevkiyat Takibi</h1>
      </div>

      <Tabs defaultValue="tracking" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tracking" className="flex items-center">
            <Truck className="mr-2 h-4 w-4" />
            Takip
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <BarChart className="mr-2 h-4 w-4" />
            Analitik
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tracking">
          <Card>
            <CardHeader>
              <CardTitle>Sevkiyat Takibi</CardTitle>
              <CardDescription>
                Tüm sevkiyatlarınızın gerçek zamanlı durumunu izleyin. Toplam {filteredData.length} sevkiyat bulundu.
              </CardDescription>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Takip no veya sipariş no ile ara..."
                      className="pl-8"
                      value={searchTrackingNumber}
                      onChange={(e) => setSearchTrackingNumber(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-[180px]">
                  <Select
                    value={filterStatus}
                    onValueChange={setFilterStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Durum Filtresi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Durumlar</SelectItem>
                      <SelectItem value="Teslim Edildi">Teslim Edildi</SelectItem>
                      <SelectItem value="Yolda">Yolda</SelectItem>
                      <SelectItem value="Hazırlanıyor">Hazırlanıyor</SelectItem>
                      <SelectItem value="Gecikme">Gecikme</SelectItem>
                      <SelectItem value="İptal Edildi">İptal Edildi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={filteredData} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                  Aylık Sevkiyat Sayısı
                </CardTitle>
                <CardDescription>
                  Son 12 aydaki toplam sevkiyat sayısı dağılımı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyShipmentData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} Sevkiyat`, ""]} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        name="Sevkiyat Sayısı"
                        stroke="#10b981" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ArrowRight className="mr-2 h-5 w-5 text-blue-600" />
                  Sevkiyat Durumu Dağılımı
                </CardTitle>
                <CardDescription>
                  Teslim edilen, geciken ve iptal edilen sevkiyatların oranları
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deliveryStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {deliveryStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, ""]} />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        layout="horizontal"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="mr-2 h-5 w-5 text-blue-600" />
                  Taşıyıcı Performansı
                </CardTitle>
                <CardDescription>
                  Taşıyıcı bazında zamanında ve gecikmeli sevkiyat oranları
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={carrierPerformanceData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="onTime" 
                        name="Zamanında (%)"
                        stroke="#10b981" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="delayed" 
                        name="Gecikmeli (%)"
                        stroke="#ef4444" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShipmentTracking;