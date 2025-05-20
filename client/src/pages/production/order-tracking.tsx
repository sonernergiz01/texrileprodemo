import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useParams, useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Calendar, Clock, Users, Clipboard, Package, TruckIcon, FileText, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { AppLayout } from "@/components/layout/app-layout";

export default function OrderTrackingPage() {
  const [orderId, setOrderId] = useState<string>("");
  const [, navigate] = useLocation();
  const { id } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("tracking");
  
  // Sayfa açılışında URL'den ID varsa set et
  useEffect(() => {
    if (id) {
      setOrderId(id);
    }
  }, [id]);
  
  // Sipariş takip bilgilerini çek
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["/api/orders-integration/order-tracking", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const response = await fetch(`/api/orders-integration/order-tracking/${orderId}`);
      if (!response.ok) {
        throw new Error("Sipariş takip verileri alınamadı");
      }
      return response.json();
    },
    enabled: !!orderId,
  });
  
  // Sipariş durumlarını çek
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
  
  // Farklı bir siparişe git
  const handleOrderSearch = () => {
    if (orderId) {
      navigate(`/production/order-tracking/${orderId}`);
    } else {
      toast({
        title: "Hata",
        description: "Lütfen geçerli bir sipariş numarası girin",
        variant: "destructive",
      });
    }
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
        <div className="flex flex-col items-center justify-center h-[500px] gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Sipariş verileri alınamadı</h2>
          <p className="text-muted-foreground">{(error as Error).message}</p>
          
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="orderIdInput">Sipariş ID:</Label>
              <input 
                id="orderIdInput"
                type="text" 
                value={orderId} 
                onChange={(e) => setOrderId(e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
            </div>
            <Button onClick={handleOrderSearch}>Ara</Button>
          </div>
          
          <Button variant="outline" asChild className="mt-4">
            <Link href="/sales/orders">Tüm Siparişlere Dön</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }
  
  if (!data || !data.order) {
    return (
      <AppLayout>
        <div className="container max-w-6xl mx-auto py-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <h1 className="text-2xl font-bold">Sipariş Takip</h1>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="orderIdInput">Sipariş ID:</Label>
              <input 
                id="orderIdInput"
                type="text" 
                value={orderId} 
                onChange={(e) => setOrderId(e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
              <Button onClick={handleOrderSearch}>Ara</Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-10 gap-4">
                <p className="text-muted-foreground">Lütfen bir sipariş ID girin veya sipariş listesinden bir sipariş seçin.</p>
                <Button asChild>
                  <Link href="/sales/orders">Sipariş Listesi</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }
  
  const { order, tracking, production, shipments, statusHistory, delayReasons, materialRequirements, customer } = data;
  
  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Sipariş Takip: #{order.orderNumber}</h1>
            <p className="text-muted-foreground">Müşteri: {customer?.name || "Bilinmeyen müşteri"}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="orderIdInput">Sipariş ID:</Label>
            <input 
              id="orderIdInput"
              type="text" 
              value={orderId} 
              onChange={(e) => setOrderId(e.target.value)}
              className="px-3 py-2 border rounded-md"
            />
            <Button onClick={handleOrderSearch}>Ara</Button>
          </div>
        </div>
        
        {/* Sipariş Detay Kartı */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Sipariş Bilgileri</CardTitle>
                <CardDescription>Sipariş No: {order.orderNumber}</CardDescription>
              </div>
              <Badge 
                variant="outline" 
                className="text-xs font-medium py-1"
                style={{ 
                  backgroundColor: tracking.currentStatus?.statusColor || "#3b82f6",
                  color: "white"
                }}
              >
                {tracking.currentStatus?.statusName || "Durum belirsiz"}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Sipariş Tarihi</h4>
                <p className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {formatDate(order.orderDate)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Termin Tarihi</h4>
                <p className="flex items-center gap-1"><Clock className="h-4 w-4" /> {formatDate(order.dueDate)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Miktar</h4>
                <p>{order.quantity} {order.unit}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Tutar</h4>
                <p>{formatCurrency(order.totalPrice || 0)} TL</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Kumaş Tipi</h4>
                <p>{order.properties?.fabricType || "Belirtilmemiş"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Sorumlu Kullanıcı</h4>
                <p className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> {order.assignedUser || "Atanmamış"}
                </p>
              </div>
            </div>
            
            {delayReasons && delayReasons.length > 0 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> Sipariş Ertelendi veya İptal Edildi
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  Neden: {delayReasons[0].reason} - 
                  {delayReasons[0].isCancelled 
                    ? " Sipariş iptal edildi" 
                    : ` Yeni termin tarihi: ${formatDate(delayReasons[0].newDueDate)}`}
                </p>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" asChild>
              <Link href={`/sales/order-details/${order.id}`}>Sipariş Detayları</Link>
            </Button>
            
            <Button asChild>
              <Link href={`/production/plan-details/${production?.currentStep?.productionPlanId || ""}`}>
                Üretim Planı
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Sekmeler */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="tracking">Sipariş Takibi</TabsTrigger>
            <TabsTrigger value="production">Üretim Adımları</TabsTrigger>
            <TabsTrigger value="shipment">Sevkiyat</TabsTrigger>
            <TabsTrigger value="material">Malzeme İhtiyaçları</TabsTrigger>
          </TabsList>
          
          {/* Takip Sekmesi */}
          <TabsContent value="tracking">
            <Card>
              <CardHeader>
                <CardTitle>Sipariş Durum Geçmişi</CardTitle>
                <CardDescription>
                  Siparişin takip aşamaları ve durum değişiklikleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                    {tracking.records && tracking.records.length > 0 ? (
                      tracking.records.map((record, index) => (
                        <div key={record.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-white shadow-sm text-slate-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between space-x-2 mb-1">
                              <div className="font-bold text-slate-900 flex items-center">
                                <Badge 
                                  className="mr-2"
                                  style={{ 
                                    backgroundColor: record.statusColor || "#3b82f6",
                                    color: "white"
                                  }}
                                >
                                  {record.statusName}
                                </Badge>
                              </div>
                              <time className="font-medium text-slate-500 text-sm whitespace-nowrap">
                                {formatDate(record.timestamp)}
                              </time>
                            </div>
                            <div className="text-slate-500">
                              {record.note || "Not girilmemiş"}
                            </div>
                            <div className="text-sm text-slate-600 mt-2">
                              İşlemi yapan: {record.userName || "Bilinmiyor"}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-muted-foreground">
                        Henüz takip kaydı bulunmuyor
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Durumu Güncelle</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Sipariş Durumunu Güncelle</DialogTitle>
                    </DialogHeader>
                    <UpdateOrderStatusForm 
                      orderId={order.id} 
                      currentStatusId={tracking.currentStatus?.statusId}
                      statuses={trackingStatuses || []}
                    />
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Üretim Sekmesi */}
          <TabsContent value="production">
            <Card>
              <CardHeader>
                <CardTitle>Üretim Aşamaları</CardTitle>
                <CardDescription>
                  Siparişin üretim planı ve tamamlanan üretim adımları
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {production.steps && production.steps.length > 0 ? (
                    production.steps.map((step, index) => (
                      <div key={step.id} className="flex flex-col gap-2 p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <span className="w-6 h-6 flex items-center justify-center bg-primary text-white rounded-full text-xs">
                              {step.stepOrder}
                            </span>
                            {step.step}
                          </h3>
                          <Badge variant={
                            step.status === 'completed' ? "default" :
                            step.status === 'in-progress' ? "secondary" :
                            "outline"
                          }>
                            {
                              step.status === 'completed' ? 'Tamamlandı' :
                              step.status === 'in-progress' ? 'Devam Ediyor' :
                              step.status === 'pending' ? 'Beklemede' :
                              step.status
                            }
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Departman</h4>
                            <p>{step.departmentName}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Başlangıç Tarihi</h4>
                            <p>{step.startDate ? formatDate(step.startDate) : "Henüz başlamadı"}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Bitiş Tarihi</h4>
                            <p>{step.endDate ? formatDate(step.endDate) : "Tamamlanmadı"}</p>
                          </div>
                        </div>
                        
                        {step.notes && (
                          <div className="mt-2">
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Notlar</h4>
                            <p className="text-sm">{step.notes}</p>
                          </div>
                        )}
                        
                        {step.completionPercentage > 0 && (
                          <div className="mt-2">
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Tamamlanma Oranı</h4>
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                              <div 
                                className="bg-primary h-2.5 rounded-full" 
                                style={{ width: `${step.completionPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-right block mt-1">{step.completionPercentage}%</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-muted-foreground">
                      Henüz üretim adımı tanımlanmamış
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Üretim Adımı Ekle/Güncelle</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Üretim Adımı Ekle/Güncelle</DialogTitle>
                    </DialogHeader>
                    <UpdateProductionStepForm orderId={order.id} />
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Sevkiyat Sekmesi */}
          <TabsContent value="shipment">
            <Card>
              <CardHeader>
                <CardTitle>Sevkiyat Bilgileri</CardTitle>
                <CardDescription>
                  Siparişe ait yapılan sevkiyatlar ve planlanan sevkiyatlar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shipments && shipments.length > 0 ? (
                    shipments.map((shipment, index) => (
                      <div key={shipment.id} className="border rounded-lg p-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-2">
                          <h3 className="font-semibold flex items-center gap-2">
                            <TruckIcon className="h-5 w-5" />
                            Sevkiyat #{shipment.shipmentNo}
                          </h3>
                          <Badge variant={
                            shipment.shipmentStatus === 'completed' ? "default" :
                            shipment.shipmentStatus === 'in-transit' ? "secondary" :
                            "outline"
                          }>
                            {
                              shipment.shipmentStatus === 'completed' ? 'Tamamlandı' :
                              shipment.shipmentStatus === 'in-transit' ? 'Sevk Edildi' : 
                              shipment.shipmentStatus === 'preparing' ? 'Hazırlanıyor' :
                              shipment.shipmentStatus
                            }
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Miktar</h4>
                            <p>{shipment.quantity} {shipment.unit}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Sevkiyat Tarihi</h4>
                            <p>{shipment.shipmentDate ? formatDate(shipment.shipmentDate) : "Belirtilmemiş"}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Paket/Palet Sayısı</h4>
                            <p>{shipment.packageCount || "0"} paket / {shipment.palletCount || "0"} palet</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Brüt Ağırlık</h4>
                            <p>{shipment.grossWeight || "-"} kg</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Net Ağırlık</h4>
                            <p>{shipment.netWeight || "-"} kg</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Hacim</h4>
                            <p>{shipment.volumeM3 || "-"} m³</p>
                          </div>
                        </div>
                        
                        {shipment.notes && (
                          <div className="mt-3">
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Notlar</h4>
                            <p className="text-sm">{shipment.notes}</p>
                          </div>
                        )}
                        
                        {shipment.isComplete && (
                          <div className="mt-3 text-sm text-emerald-600 font-medium">
                            Bu sevkiyatla sipariş tamamlandı.
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-muted-foreground">
                      Henüz sevkiyat kaydı bulunmuyor
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Sevkiyat Kaydı Ekle</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Sevkiyat Kaydı Ekle</DialogTitle>
                    </DialogHeader>
                    <AddShipmentForm orderId={order.id} />
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Malzeme Sekmesi */}
          <TabsContent value="material">
            <Card>
              <CardHeader>
                <CardTitle>Malzeme İhtiyaçları</CardTitle>
                <CardDescription>
                  Siparişin üretimi için gereken malzemeler ve durumları
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {materialRequirements && materialRequirements.length > 0 ? (
                    materialRequirements.map((material, index) => (
                      <div key={material.id} className="border rounded-lg p-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-2">
                          <h3 className="font-semibold flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            {material.description}
                          </h3>
                          <Badge variant={material.isAvailable ? "default" : "destructive"}>
                            {material.isAvailable ? "Stokta" : "Tedarik Edilecek"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Malzeme Tipi</h4>
                            <p>{material.materialType}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Miktar</h4>
                            <p>{material.quantity} {material.unit}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Tahmini Tedarik Tarihi</h4>
                            <p>{material.estimatedArrivalDate ? formatDate(material.estimatedArrivalDate) : "Belirtilmemiş"}</p>
                          </div>
                        </div>
                        
                        {material.notes && (
                          <div className="mt-3">
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Notlar</h4>
                            <p className="text-sm">{material.notes}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-muted-foreground">
                      Henüz malzeme ihtiyacı tanımlanmamış
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Malzeme İhtiyacı Ekle</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Malzeme İhtiyacı Ekle</DialogTitle>
                    </DialogHeader>
                    <AddMaterialRequirementForm orderId={order.id} />
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

// Sipariş durum güncelleme formu
function UpdateOrderStatusForm({ orderId, currentStatusId, statuses }: { 
  orderId: number;
  currentStatusId: number | null;
  statuses: Array<{ id: number; name: string; }>
}) {
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [selectedStatusId, setSelectedStatusId] = useState<string>(currentStatusId?.toString() || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Geçerli durumdan geçiş yapılabilecek durumları çek
  const { data: availableStatuses, isLoading: loadingTransitions } = useQuery({
    queryKey: ["/api/orders-integration/status-transitions", currentStatusId],
    queryFn: async () => {
      if (!currentStatusId) return [];
      const response = await fetch(`/api/orders-integration/status-transitions/${currentStatusId}`);
      if (!response.ok) {
        throw new Error("Durum geçişleri alınamadı");
      }
      return response.json();
    },
    enabled: !!currentStatusId,
  });

  // Durum güncelleme mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { statusId: number; note: string }) => {
      const response = await fetch(`/api/orders-integration/order-status-update/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Durum güncellenirken bir hata oluştu");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Sipariş durumu güncellendi",
        variant: "default",
      });
      setNote("");
      // Sayfa verilerini yenile
      queryClient.invalidateQueries({ queryKey: ["/api/orders-integration/order-tracking", orderId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStatusId) {
      toast({
        title: "Hata",
        description: "Lütfen bir durum seçin",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await updateStatusMutation.mutateAsync({
        statusId: parseInt(selectedStatusId),
        note: note
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="status">Yeni Durum</Label>
        <Select 
          value={selectedStatusId} 
          onValueChange={setSelectedStatusId}
          disabled={loadingTransitions}
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="Durum seçin" />
          </SelectTrigger>
          <SelectContent>
            {loadingTransitions ? (
              <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
            ) : availableStatuses && availableStatuses.length > 0 ? (
              availableStatuses.map((status: { id: number; name: string }) => (
                <SelectItem key={status.id} value={status.id.toString()}>
                  {status.name}
                </SelectItem>
              ))
            ) : (
              statuses.map((status) => (
                <SelectItem key={status.id} value={status.id.toString()}>
                  {status.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="note">Not</Label>
        <Textarea
          id="note"
          placeholder="Durum değişikliği için açıklama girin"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Güncelleniyor...
          </>
        ) : (
          "Durumu Güncelle"
        )}
      </Button>
    </form>
  );
}

function UpdateProductionStepForm({ orderId }: { orderId: number }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    departmentId: "",
    processTypeId: "",
    plannedStartDate: "",
    plannedEndDate: "",
    notes: "",
    status: "planlandi", // Varsayılan durum
  });

  // Departmanları çek
  const { data: departments, isLoading: loadingDepartments } = useQuery({
    queryKey: ["/api/admin/departments"],
    queryFn: async () => {
      const response = await fetch("/api/admin/departments");
      if (!response.ok) {
        throw new Error("Departmanlar alınamadı");
      }
      return response.json();
    },
  });

  // Süreç tiplerini çek
  const { data: processTypes, isLoading: loadingProcessTypes } = useQuery({
    queryKey: ["/api/production/process-types"],
    queryFn: async () => {
      const response = await fetch("/api/production/process-types");
      if (!response.ok) {
        throw new Error("Süreç tipleri alınamadı");
      }
      return response.json();
    },
  });

  // Form değişikliklerini yönet
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Üretim adımı ekleme mutation
  const addProductionStepMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/orders-integration/production-steps/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Üretim adımı eklenirken bir hata oluştu");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Üretim adımı eklendi",
        variant: "default",
      });
      // Formu sıfırla
      setFormData({
        departmentId: "",
        processTypeId: "",
        plannedStartDate: "",
        plannedEndDate: "",
        notes: "",
        status: "planlandi",
      });
      // Sayfa verilerini yenile
      queryClient.invalidateQueries({ queryKey: ["/api/orders-integration/order-tracking", orderId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form doğrulama
    if (!formData.departmentId || !formData.processTypeId || !formData.plannedStartDate || !formData.plannedEndDate) {
      toast({
        title: "Hata",
        description: "Lütfen tüm zorunlu alanları doldurun",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addProductionStepMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="departmentId">Departman</Label>
          <Select 
            name="departmentId"
            value={formData.departmentId} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value }))}
            disabled={loadingDepartments}
          >
            <SelectTrigger id="departmentId">
              <SelectValue placeholder="Departman seçin" />
            </SelectTrigger>
            <SelectContent>
              {loadingDepartments ? (
                <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
              ) : departments ? (
                departments.map((dept: any) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>Departman bulunamadı</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="processTypeId">Süreç Tipi</Label>
          <Select 
            name="processTypeId"
            value={formData.processTypeId} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, processTypeId: value }))}
            disabled={loadingProcessTypes}
          >
            <SelectTrigger id="processTypeId">
              <SelectValue placeholder="Süreç tipi seçin" />
            </SelectTrigger>
            <SelectContent>
              {loadingProcessTypes ? (
                <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
              ) : processTypes ? (
                processTypes.map((type: any) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>Süreç tipi bulunamadı</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="plannedStartDate">Planlanan Başlangıç</Label>
          <input
            id="plannedStartDate"
            name="plannedStartDate"
            type="datetime-local"
            value={formData.plannedStartDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="plannedEndDate">Planlanan Bitiş</Label>
          <input
            id="plannedEndDate"
            name="plannedEndDate"
            type="datetime-local"
            value={formData.plannedEndDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div className="space-y-2 col-span-2">
          <Label htmlFor="status">Durum</Label>
          <Select 
            name="status"
            value={formData.status} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Durum seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planlandi">Planlandı</SelectItem>
              <SelectItem value="beklemede">Beklemede</SelectItem>
              <SelectItem value="devam_ediyor">Devam Ediyor</SelectItem>
              <SelectItem value="tamamlandi">Tamamlandı</SelectItem>
              <SelectItem value="iptal_edildi">İptal Edildi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 col-span-2">
          <Label htmlFor="notes">Notlar</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Üretim adımı için notlar ekleyin"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
          />
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Ekleniyor...
          </>
        ) : (
          "Üretim Adımı Ekle"
        )}
      </Button>
    </form>
  );
}

function AddShipmentForm({ orderId }: { orderId: number }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    shipmentDate: "",
    deliveryAddress: "",
    shipmentMethod: "kara_yolu", // Varsayılan yöntem
    packageCount: "",
    totalWeight: "",
    trackingNumber: "",
    courierCompany: "",
    notes: "",
    status: "hazirlanıyor", // Varsayılan durum
  });

  // Form değişikliklerini yönet
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Sevkiyat ekleme mutation
  const addShipmentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/orders-integration/shipments/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Sevkiyat eklenirken bir hata oluştu");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Sevkiyat kaydı oluşturuldu",
        variant: "default",
      });
      // Formu sıfırla
      setFormData({
        shipmentDate: "",
        deliveryAddress: "",
        shipmentMethod: "kara_yolu",
        packageCount: "",
        totalWeight: "",
        trackingNumber: "",
        courierCompany: "",
        notes: "",
        status: "hazirlanıyor",
      });
      // Sayfa verilerini yenile
      queryClient.invalidateQueries({ queryKey: ["/api/orders-integration/order-tracking", orderId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form doğrulama
    if (!formData.shipmentDate || !formData.deliveryAddress || !formData.packageCount) {
      toast({
        title: "Hata",
        description: "Lütfen tüm zorunlu alanları doldurun",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addShipmentMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="shipmentDate">Sevkiyat Tarihi*</Label>
          <input
            id="shipmentDate"
            name="shipmentDate"
            type="datetime-local"
            value={formData.shipmentDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="shipmentMethod">Sevkiyat Yöntemi*</Label>
          <Select 
            name="shipmentMethod"
            value={formData.shipmentMethod} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, shipmentMethod: value }))}
          >
            <SelectTrigger id="shipmentMethod">
              <SelectValue placeholder="Sevkiyat yöntemi seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kara_yolu">Kara Yolu</SelectItem>
              <SelectItem value="deniz_yolu">Deniz Yolu</SelectItem>
              <SelectItem value="hava_yolu">Hava Yolu</SelectItem>
              <SelectItem value="demiryolu">Demir Yolu</SelectItem>
              <SelectItem value="kurye">Kurye</SelectItem>
              <SelectItem value="müşteri_teslim">Müşteri Teslim</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 col-span-2">
          <Label htmlFor="deliveryAddress">Teslimat Adresi*</Label>
          <Textarea
            id="deliveryAddress"
            name="deliveryAddress"
            placeholder="Teslimat adresini girin"
            value={formData.deliveryAddress}
            onChange={handleChange}
            rows={2}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="packageCount">Paket Sayısı*</Label>
          <input
            id="packageCount"
            name="packageCount"
            type="number"
            min="1"
            value={formData.packageCount}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="totalWeight">Toplam Ağırlık (kg)</Label>
          <input
            id="totalWeight"
            name="totalWeight"
            type="number"
            step="0.01"
            min="0"
            value={formData.totalWeight}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="courierCompany">Kargo/Taşıma Firması</Label>
          <input
            id="courierCompany"
            name="courierCompany"
            type="text"
            value={formData.courierCompany}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="trackingNumber">Takip Numarası</Label>
          <input
            id="trackingNumber"
            name="trackingNumber"
            type="text"
            value={formData.trackingNumber}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div className="space-y-2 col-span-2">
          <Label htmlFor="status">Sevkiyat Durumu</Label>
          <Select 
            name="status"
            value={formData.status} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Durum seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hazirlanıyor">Hazırlanıyor</SelectItem>
              <SelectItem value="yolda">Yolda</SelectItem>
              <SelectItem value="teslim_edildi">Teslim Edildi</SelectItem>
              <SelectItem value="ertelendi">Ertelendi</SelectItem>
              <SelectItem value="iptal_edildi">İptal Edildi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 col-span-2">
          <Label htmlFor="notes">Notlar</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Sevkiyat için notlar ekleyin"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
          />
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sevkiyat Ekleniyor...
          </>
        ) : (
          "Sevkiyat Kaydı Oluştur"
        )}
      </Button>
    </form>
  );
}

function AddMaterialRequirementForm({ orderId }: { orderId: number }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    materialType: "",
    quantity: "",
    unit: "metre",
    required_date: "",
    status: "talep_edildi",
    supplierName: "",
    notes: "",
    priority: "normal"
  });
  const [showCustomMaterial, setShowCustomMaterial] = useState(false);
  const [customMaterialType, setCustomMaterialType] = useState("");

  // Malzeme tiplerini çek
  const { data: materialTypes, isLoading: loadingMaterials } = useQuery({
    queryKey: ["/api/inventory/material-types"],
    queryFn: async () => {
      const response = await fetch("/api/inventory/material-types");
      if (!response.ok) {
        throw new Error("Malzeme tipleri alınamadı");
      }
      return response.json();
    },
  });

  // Form değişikliklerini yönet
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Malzeme ihtiyacı ekleme mutation
  const addMaterialRequirementMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/orders-integration/material-requirements/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Malzeme ihtiyacı eklenirken bir hata oluştu");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Malzeme ihtiyacı kaydedildi",
        variant: "default",
      });
      // Formu sıfırla
      setFormData({
        materialType: "",
        quantity: "",
        unit: "metre",
        required_date: "",
        status: "talep_edildi",
        supplierName: "",
        notes: "",
        priority: "normal"
      });
      setShowCustomMaterial(false);
      setCustomMaterialType("");
      // Sayfa verilerini yenile
      queryClient.invalidateQueries({ queryKey: ["/api/orders-integration/order-tracking", orderId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form doğrulama
    if (!formData.quantity || !(formData.materialType || customMaterialType) || !formData.required_date) {
      toast({
        title: "Hata",
        description: "Lütfen tüm zorunlu alanları doldurun",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const formDataToSubmit = {
        ...formData,
        materialType: showCustomMaterial ? customMaterialType : formData.materialType
      };
      
      await addMaterialRequirementMutation.mutateAsync(formDataToSubmit);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="materialType">Malzeme Tipi*</Label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="customMaterial"
                checked={showCustomMaterial}
                onChange={() => setShowCustomMaterial(!showCustomMaterial)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="customMaterial" className="text-sm">Özel malzeme ekle</Label>
            </div>
          </div>
          
          {showCustomMaterial ? (
            <input
              id="customMaterialType"
              type="text"
              value={customMaterialType}
              onChange={(e) => setCustomMaterialType(e.target.value)}
              placeholder="Özel malzeme adını girin"
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          ) : (
            <Select 
              name="materialType"
              value={formData.materialType} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, materialType: value }))}
              disabled={loadingMaterials}
            >
              <SelectTrigger id="materialType">
                <SelectValue placeholder="Malzeme tipi seçin" />
              </SelectTrigger>
              <SelectContent>
                {loadingMaterials ? (
                  <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
                ) : materialTypes ? (
                  materialTypes.map((type: any) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>Malzeme bulunamadı</SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Miktar*</Label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            step="0.01"
            min="0"
            value={formData.quantity}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="unit">Birim*</Label>
          <Select 
            name="unit"
            value={formData.unit} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
          >
            <SelectTrigger id="unit">
              <SelectValue placeholder="Birim seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="metre">Metre</SelectItem>
              <SelectItem value="adet">Adet</SelectItem>
              <SelectItem value="kg">Kilogram</SelectItem>
              <SelectItem value="litre">Litre</SelectItem>
              <SelectItem value="kutu">Kutu</SelectItem>
              <SelectItem value="paket">Paket</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="required_date">İhtiyaç Tarihi*</Label>
          <input
            id="required_date"
            name="required_date"
            type="date"
            value={formData.required_date}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="priority">Öncelik</Label>
          <Select 
            name="priority"
            value={formData.priority} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
          >
            <SelectTrigger id="priority">
              <SelectValue placeholder="Öncelik seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="düşük">Düşük</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="yüksek">Yüksek</SelectItem>
              <SelectItem value="acil">Acil</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="status">Durum</Label>
          <Select 
            name="status"
            value={formData.status} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Durum seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="talep_edildi">Talep Edildi</SelectItem>
              <SelectItem value="onaylandi">Onaylandı</SelectItem>
              <SelectItem value="siparis_verildi">Sipariş Verildi</SelectItem>
              <SelectItem value="tedarik_sürecinde">Tedarik Sürecinde</SelectItem>
              <SelectItem value="temin_edildi">Temin Edildi</SelectItem>
              <SelectItem value="reddedildi">Reddedildi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 col-span-2">
          <Label htmlFor="supplierName">Tedarikçi</Label>
          <input
            id="supplierName"
            name="supplierName"
            type="text"
            value={formData.supplierName}
            onChange={handleChange}
            placeholder="Tedarikçi adı girin"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div className="space-y-2 col-span-2">
          <Label htmlFor="notes">Notlar</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Malzeme ihtiyacı için notlar ekleyin"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
          />
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Kaydediliyor...
          </>
        ) : (
          "Malzeme İhtiyacı Ekle"
        )}
      </Button>
    </form>
  );
}