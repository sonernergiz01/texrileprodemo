import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpDown, Loader2, Calendar, Search, Filter, FileDown } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { AppLayout } from "@/components/layout/app-layout";

export default function OrdersListPage() {
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useState({
    orderNumber: "",
    customerName: "",
    status: "",
    trackingStatus: "",
    fromDate: "",
    toDate: "",
    delayed: false,
    hasIssues: false,
    department: "",
  });
  const [sortBy, setSortBy] = useState("orderDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Sipariş listesini çek
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["/api/orders-integration/search", searchParams, page, sortBy, sortOrder],
    queryFn: async () => {
      const queryString = new URLSearchParams();
      
      // Parametreleri ekle
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) queryString.append(key, String(value));
      });
      
      // Sayfalama ve sıralama
      queryString.append("page", String(page));
      queryString.append("sortBy", sortBy);
      queryString.append("sortOrder", sortOrder);
      
      const response = await fetch(`/api/orders-integration/search?${queryString.toString()}`);
      if (!response.ok) {
        throw new Error("Sipariş listesi alınamadı");
      }
      return response.json();
    },
  });
  
  // Sipariş takip durumlarını çek
  const { data: trackingStatuses } = useQuery({
    queryKey: ["/api/orders-integration/tracking-statuses"],
    queryFn: async () => {
      const response = await fetch("/api/orders-integration/tracking-statuses");
      if (!response.ok) {
        throw new Error("Sipariş takip durumları alınamadı");
      }
      return response.json();
    },
  });
  
  // Departmanları çek
  const { data: departments } = useQuery({
    queryKey: ["/api/admin/departments"],
    queryFn: async () => {
      const response = await fetch("/api/admin/departments");
      if (!response.ok) {
        throw new Error("Departmanlar alınamadı");
      }
      return response.json();
    },
  });
  
  // Sıralama değiştirme
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };
  
  // Arama formunu gönderme
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };
  
  // Form temizleme
  const handleReset = () => {
    setSearchParams({
      orderNumber: "",
      customerName: "",
      status: "",
      trackingStatus: "",
      fromDate: "",
      toDate: "",
      delayed: false,
      hasIssues: false,
      department: "",
    });
  };
  
  // Sipariş detayına gitme
  const handleOrderClick = (orderId: number) => {
    navigate(`/production/order-tracking/${orderId}`);
  };
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }
  
  if (isError) {
    return (
      <AppLayout>
        <div className="container max-w-7xl mx-auto py-6">
          <Card>
            <CardHeader>
              <CardTitle>Siparişler</CardTitle>
              <CardDescription>Üretim ve sevkiyat takibi yapılacak siparişler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-10 gap-4">
                <p className="text-destructive font-medium">Veriler yüklenirken bir hata oluştu</p>
                <p className="text-muted-foreground">{(error as Error).message}</p>
                <Button onClick={() => refetch()}>Tekrar Dene</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Üretim Siparişleri</h1>
            <p className="text-muted-foreground">Üretim ve sevkiyat takibi yapılacak siparişler</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <FileDown className="h-4 w-4" />
              Dışa Aktar
            </Button>
            <Button asChild>
              <Link href="/sales/orders">Tüm Siparişlere Dön</Link>
            </Button>
          </div>
        </div>
        
        {/* Arama filtresi kartı */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Sipariş Filtreleme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="orderNumber">Sipariş No</Label>
                  <Input
                    id="orderNumber"
                    placeholder="Sipariş no ara..."
                    value={searchParams.orderNumber}
                    onChange={(e) => setSearchParams({ ...searchParams, orderNumber: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="customerName">Müşteri</Label>
                  <Input
                    id="customerName"
                    placeholder="Müşteri adı ara..."
                    value={searchParams.customerName}
                    onChange={(e) => setSearchParams({ ...searchParams, customerName: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="trackingStatus">Sipariş Durumu</Label>
                  <Select 
                    value={searchParams.trackingStatus}
                    onValueChange={(value) => setSearchParams({ ...searchParams, trackingStatus: value })}
                  >
                    <SelectTrigger id="trackingStatus">
                      <SelectValue placeholder="Durum seç" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tümü</SelectItem>
                      {trackingStatuses?.map((status) => (
                        <SelectItem key={status.id} value={status.code}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="fromDate">Başlangıç Tarihi</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={searchParams.fromDate}
                    onChange={(e) => setSearchParams({ ...searchParams, fromDate: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="toDate">Bitiş Tarihi</Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={searchParams.toDate}
                    onChange={(e) => setSearchParams({ ...searchParams, toDate: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="department">Departman</Label>
                  <Select 
                    value={searchParams.department}
                    onValueChange={(value) => setSearchParams({ ...searchParams, department: value })}
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Departman seç" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tümü</SelectItem>
                      {departments?.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={searchParams.delayed}
                    onChange={(e) => setSearchParams({ ...searchParams, delayed: e.target.checked })}
                    className="rounded border-gray-300 h-4 w-4"
                  />
                  <span>Ertelenen siparişler</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={searchParams.hasIssues}
                    onChange={(e) => setSearchParams({ ...searchParams, hasIssues: e.target.checked })}
                    className="rounded border-gray-300 h-4 w-4"
                  />
                  <span>Sorunlu siparişler</span>
                </label>
              </div>
              
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={handleReset}>
                  Temizle
                </Button>
                <Button type="submit" className="gap-2">
                  <Search className="h-4 w-4" />
                  Ara
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Sipariş tablosu */}
        <Card>
          <CardHeader>
            <CardTitle>Siparişler</CardTitle>
            <CardDescription>
              Toplam {data?.length || 0} sipariş listeleniyor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px] cursor-pointer" onClick={() => handleSort("orderNumber")}>
                      <div className="flex items-center">
                        Sipariş No
                        {sortBy === "orderNumber" && (
                          <ArrowUpDown className={`ml-2 h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("customerName")}>
                      <div className="flex items-center">
                        Müşteri
                        {sortBy === "customerName" && (
                          <ArrowUpDown className={`ml-2 h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("orderDate")}>
                      <div className="flex items-center">
                        Sipariş Tarihi
                        {sortBy === "orderDate" && (
                          <ArrowUpDown className={`ml-2 h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("dueDate")}>
                      <div className="flex items-center">
                        Termin Tarihi
                        {sortBy === "dueDate" && (
                          <ArrowUpDown className={`ml-2 h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Miktar</TableHead>
                    <TableHead>Mevcut Departman</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data && data.length > 0 ? (
                    data.map((order) => (
                      <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleOrderClick(order.id)}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>{formatDate(order.orderDate)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(order.dueDate)}
                          </div>
                          {order.daysRemaining <= 3 && !order.hasDelay && (
                            <Badge variant="destructive" className="mt-1">
                              {order.daysRemaining === 0 ? "Bugün" : `${order.daysRemaining} gün kaldı`}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {order.currentTrackingStatus ? (
                            <Badge variant="secondary">{order.currentTrackingStatus}</Badge>
                          ) : (
                            <Badge variant="outline">{order.statusName}</Badge>
                          )}
                          {order.hasDelay && (
                            <Badge variant="destructive" className="ml-2">Ertelendi</Badge>
                          )}
                        </TableCell>
                        <TableCell>{order.quantity} {order.unit}</TableCell>
                        <TableCell>{order.currentDepartment || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/production/order-tracking/${order.id}`}>Görüntüle</Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        {isLoading ? (
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        ) : (
                          "Sipariş bulunamadı"
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}