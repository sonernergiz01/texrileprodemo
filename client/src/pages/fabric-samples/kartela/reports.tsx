import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { PageContainer } from "@/components/layout/page-container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { CalendarIcon, FileDown, FileText, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#a5d6a7'];

export default function KartelaReports() {
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
  );
  
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [reportType, setReportType] = useState("shipments");
  const [customerFilter, setCustomerFilter] = useState("");
  
  // Fetch data
  const { data: kartelas, isLoading: loadingKartelas } = useQuery({
    queryKey: ["/api/kartelas"],
  });
  
  const { data: shipments, isLoading: loadingShipments } = useQuery({
    queryKey: ["/api/kartelas/shipments", 
      startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate ? format(endDate, "yyyy-MM-dd") : undefined
    ],
  });
  
  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });
  
  // Filter data based on customer name if filter is provided
  const filteredShipments = shipments ? shipments.filter((shipment: any) => 
    !customerFilter || 
    shipment.customerName.toLowerCase().includes(customerFilter.toLowerCase())
  ) : [];
  
  // Shipment totals data for chart
  const shipmentByCustomerData = React.useMemo(() => {
    if (!filteredShipments) return [];
    
    const customerCounts: Record<string, number> = {};
    
    filteredShipments.forEach((shipment: any) => {
      const customerName = shipment.customerName || "Bilinmeyen";
      customerCounts[customerName] = (customerCounts[customerName] || 0) + 1;
    });
    
    return Object.entries(customerCounts).map(([name, value]) => ({
      name: name.length > 15 ? name.substring(0, 15) + "..." : name,
      value
    }));
  }, [filteredShipments]);
  
  // Kartela totals data for chart
  const kartelaByTypeData = React.useMemo(() => {
    if (!kartelas) return [];
    
    const typeCounts: Record<string, number> = {};
    
    kartelas.forEach((kartela: any) => {
      const type = kartela.type || "Genel";
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    return Object.entries(typeCounts).map(([name, value]) => ({
      name,
      value
    }));
  }, [kartelas]);
  
  // Shipment monthly data for bar chart
  const monthlyShipmentData = React.useMemo(() => {
    if (!filteredShipments) return [];
    
    const monthData: Record<string, number> = {};
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
                   "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    
    filteredShipments.forEach((shipment: any) => {
      const date = new Date(shipment.shipmentDate);
      const monthName = months[date.getMonth()];
      monthData[monthName] = (monthData[monthName] || 0) + 1;
    });
    
    return Object.entries(monthData).map(([name, count]) => ({
      name,
      count
    }));
  }, [filteredShipments]);
  
  // Export to PDF function
  const exportToPdf = () => {
    const doc = new jsPDF();
    
    // Add title and date range
    doc.setFontSize(16);
    doc.text("Kartela Raporları", 14, 20);
    doc.setFontSize(10);
    doc.text(`Rapor Türü: ${reportType === "shipments" ? "Sevkiyatlar" : "Kartela Özeti"}`, 14, 30);
    doc.text(`Tarih Aralığı: ${startDate ? format(startDate, "dd.MM.yyyy") : "-"} - ${endDate ? format(endDate, "dd.MM.yyyy") : "-"}`, 14, 35);
    
    // Add shipment table
    if (reportType === "shipments" && filteredShipments && filteredShipments.length > 0) {
      // Convert shipment data for the table
      const shipmentData = filteredShipments.map((shipment: any) => [
        shipment.id,
        shipment.kartelaName || "-",
        shipment.customerName || "-",
        shipment.shipmentDate ? format(new Date(shipment.shipmentDate), "dd.MM.yyyy") : "-",
        shipment.shipmentMethod || "-",
        shipment.trackingNumber || "-",
        shipment.status || "-"
      ]);
      
      // Add the table
      autoTable(doc, {
        head: [['ID', 'Kartela', 'Müşteri', 'Tarih', 'Yöntem', 'Takip No', 'Durum']],
        body: shipmentData,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [61, 90, 128] }
      });
    } else if (reportType === "kartelas" && kartelas && kartelas.length > 0) {
      // Convert kartela data for the table
      const kartelaData = kartelas.map((kartela: any) => [
        kartela.id,
        kartela.name || "-",
        kartela.kartelaCode || "-",
        kartela.type || "-",
        kartela.customerName || "-",
        kartela.itemCount || 0,
        kartela.status || "-"
      ]);
      
      // Add the table
      autoTable(doc, {
        head: [['ID', 'Kartela', 'Kod', 'Tür', 'Müşteri', 'Parça Sayısı', 'Durum']],
        body: kartelaData,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [61, 90, 128] }
      });
    }
    
    // Save the PDF
    doc.save(`kartela-rapor-${format(new Date(), "dd-MM-yyyy")}.pdf`);
  };
  
  if (loadingKartelas || loadingShipments) {
    return (
      <PageContainer title="Kartela Raporları" subtitle="Kartelalarla ilgili detaylı raporları görüntüleyin">
        <div className="flex justify-center items-center h-[400px]">
          <p>Yükleniyor...</p>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer title="Kartela Raporları" subtitle="Kartelalarla ilgili detaylı raporları görüntüleyin">
      <div className="space-y-6">
        {/* Filtreler */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Filtreler</CardTitle>
              <Button variant="outline" size="sm" onClick={exportToPdf}>
                <FileDown className="h-4 w-4 mr-2" />
                PDF Olarak İndir
              </Button>
            </div>
            <CardDescription>
              Rapor türünü ve tarih aralığını seçin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Rapor Türü</label>
                <Select 
                  value={reportType}
                  onValueChange={setReportType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rapor türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shipments">Sevkiyat Raporları</SelectItem>
                    <SelectItem value="kartelas">Kartela Özeti</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Başlangıç Tarihi</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd.MM.yyyy", { locale: tr }) : <span>Tarih seçin</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Bitiş Tarihi</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd.MM.yyyy", { locale: tr }) : <span>Tarih seçin</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Müşteri Filtresi</label>
                <div className="relative">
                  <Filter className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="Müşteri adı ile filtrele" 
                    className="pl-8"
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Grafikler */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Müşterilere Göre Sevkiyatlar</CardTitle>
              <CardDescription>
                Müşteri bazında sevkiyat dağılımı
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shipmentByCustomerData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {shipmentByCustomerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Aylık Sevkiyat Trendi</CardTitle>
              <CardDescription>
                Aylara göre sevkiyat sayıları
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyShipmentData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Sevkiyat Sayısı" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        
        {/* Veri Tablosu */}
        <Card>
          <CardHeader>
            <CardTitle>
              {reportType === "shipments" ? "Sevkiyat Listesi" : "Kartela Listesi"}
            </CardTitle>
            <CardDescription>
              {reportType === "shipments" 
                ? "Tüm kartela sevkiyat kayıtları" 
                : "Sistemdeki tüm kartelaların listesi"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportType === "shipments" ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Kartela</TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Sevkiyat Tarihi</TableHead>
                      <TableHead>Yöntem</TableHead>
                      <TableHead>Takip No</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShipments.length > 0 ? (
                      filteredShipments.map((shipment: any) => (
                        <TableRow key={shipment.id}>
                          <TableCell>{shipment.id}</TableCell>
                          <TableCell>{shipment.kartelaName || "-"}</TableCell>
                          <TableCell>{shipment.customerName || "-"}</TableCell>
                          <TableCell>
                            {shipment.shipmentDate ? 
                              format(new Date(shipment.shipmentDate), "dd.MM.yyyy") : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {shipment.shipmentMethod === "cargo" && "Kargo"}
                              {shipment.shipmentMethod === "courier" && "Kurye"}
                              {shipment.shipmentMethod === "mail" && "Posta"}
                              {shipment.shipmentMethod === "hand" && "Elden"}
                              {!shipment.shipmentMethod && "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>{shipment.trackingNumber || "-"}</TableCell>
                          <TableCell>
                            <Badge className={cn(
                              shipment.status === "delivered" && "bg-green-100 text-green-800 hover:bg-green-100",
                              shipment.status === "pending" && "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
                              shipment.status === "cancelled" && "bg-red-100 text-red-800 hover:bg-red-100",
                              shipment.status === "in_transit" && "bg-blue-100 text-blue-800 hover:bg-blue-100",
                            )}>
                              {shipment.status === "delivered" && "Teslim Edildi"}
                              {shipment.status === "pending" && "Beklemede"}
                              {shipment.status === "cancelled" && "İptal Edildi"}
                              {shipment.status === "in_transit" && "Yolda"}
                              {!shipment.status && "Bilinmiyor"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                          Sevkiyat kaydı bulunamadı
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Kartela Adı</TableHead>
                      <TableHead>Kartela Kodu</TableHead>
                      <TableHead>Tür</TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Parça Sayısı</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kartelas && kartelas.length > 0 ? (
                      kartelas.map((kartela: any) => (
                        <TableRow key={kartela.id}>
                          <TableCell>{kartela.id}</TableCell>
                          <TableCell>{kartela.name}</TableCell>
                          <TableCell>{kartela.kartelaCode}</TableCell>
                          <TableCell>{kartela.type || "Genel"}</TableCell>
                          <TableCell>{kartela.customerName || "-"}</TableCell>
                          <TableCell>{kartela.itemCount || 0}</TableCell>
                          <TableCell>
                            <Badge className={cn(
                              kartela.status === "active" && "bg-green-100 text-green-800 hover:bg-green-100",
                              kartela.status === "pending" && "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
                              kartela.status === "archived" && "bg-gray-100 text-gray-800 hover:bg-gray-100",
                            )}>
                              {kartela.status === "active" && "Aktif"}
                              {kartela.status === "pending" && "Hazırlanıyor"}
                              {kartela.status === "archived" && "Arşivlendi"}
                              {!kartela.status && "Bilinmiyor"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                          Kartela kaydı bulunamadı
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}