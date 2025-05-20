import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/page-container";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams } from "wouter";
import { KartelaFabricItem } from "../components/KartelaFabricItem";
import { KartelaItemForm } from "../components/KartelaItemForm";
import { QrCodePrintModal } from "../components/QrCodePrintModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, Plus, QrCode, Send, Package, Download, Printer } from "lucide-react";

export default function KartelaDetailPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const params = useParams();
  const id = params.id ? parseInt(params.id) : 0;

  // State tanımlamaları
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("fabrics");

  // Verileri çek
  const { data: kartela, isLoading: isLoadingKartela } = useQuery({
    queryKey: ["/api/kartelas", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/kartelas/${id}`);
      return await res.json();
    },
  });

  const { data: fabricTypes } = useQuery({
    queryKey: ["/api/product-development/fabric-types"],
  });

  const { data: stockMovements } = useQuery({
    queryKey: ["/api/kartelas", id, "stock"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/kartelas/${id}/stock`);
      return await res.json();
    },
  });

  const { data: shipments } = useQuery({
    queryKey: ["/api/kartelas", id, "shipments"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/kartelas/${id}/shipments`);
      return await res.json();
    },
  });

  // Kumaş ekle mutasyonu
  const addFabricItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/kartelas/${id}/items`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kartelas", id] });
      setShowAddItemDialog(false);
      toast({
        title: "Kumaş Eklendi",
        description: "Kumaş başarıyla kartelaya eklendi.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Kumaş sil mutasyonu
  const deleteFabricItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest("DELETE", `/api/kartelas/${id}/items/${itemId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kartelas", id] });
      toast({
        title: "Kumaş Silindi",
        description: "Kumaş başarıyla karteladan kaldırıldı.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form işlemleri
  const handleAddFabricItem = (data: any) => {
    const formattedData = {
      ...data,
      fabricTypeId: parseInt(data.fabricTypeId),
      kartelaId: id,
    };
    
    addFabricItemMutation.mutate(formattedData);
  };

  // Kumaş QR kodu yazdır
  const handlePrintFabricQr = (itemId: number) => {
    const item = kartela?.items?.find((item: any) => item.id === itemId);
    
    if (item) {
      const fabricType = fabricTypes?.find((ft: any) => ft.id === item.fabricTypeId);
      
      setQrData({
        id: item.id,
        title: fabricType?.name || item.fabricTypeName,
        code: item.fabricCode,
        qrData: item.qrCode,
        additionalFields: {
          "Renk": item.color || "-",
          "Gramaj": item.weight ? `${item.weight} gr/m²` : "-",
          "En": item.width ? `${item.width} cm` : "-",
          "Kompozisyon": item.composition || "-",
        }
      });
      setShowQrModal(true);
    }
  };

  // Kartela QR kodu yazdır
  const handlePrintKartelaQr = () => {
    if (kartela) {
      setQrData({
        id: kartela.id,
        title: kartela.name,
        code: kartela.kartelaCode,
        qrData: kartela.qrCode,
        additionalFields: {
          "Oluşturma Tarihi": new Date(kartela.createdAt).toLocaleDateString("tr-TR"),
          ...(kartela.customerName && { "Müşteri": kartela.customerName }),
          "Durum": kartela.status === "draft" ? "Taslak" : 
                   kartela.status === "sent" ? "Gönderildi" : 
                   kartela.status === "approved" ? "Onaylandı" : 
                   kartela.status === "rejected" ? "Reddedildi" : kartela.status,
          "Kumaş Sayısı": kartela.items?.length || 0,
        }
      });
      setShowQrModal(true);
    }
  };

  // Durumu göster
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Taslak</Badge>;
      case "sent":
        return <Badge variant="secondary">Gönderildi</Badge>;
      case "approved":
        return <Badge className="bg-green-600 text-white">Onaylandı</Badge>;
      case "rejected":
        return <Badge variant="destructive">Reddedildi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Yükleniyor göster
  if (isLoadingKartela) {
    return (
      <PageContainer title="Kartela Detayları" subtitle="Yükleniyor...">
        <div className="flex justify-center items-center h-[400px]">
          <p>Yükleniyor...</p>
        </div>
      </PageContainer>
    );
  }

  // Veri yoksa göster
  if (!kartela) {
    return (
      <PageContainer title="Kartela Bulunamadı" subtitle="Hata">
        <div className="flex flex-col justify-center items-center h-[400px]">
          <p className="text-red-500 mb-4">Kartela bulunamadı veya erişim izniniz yok.</p>
          <Button onClick={() => navigate("/fabric-samples/kartela")}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Kartela Listesine Dön
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={kartela.name}
      subtitle={`Kartela kodu: ${kartela.kartelaCode}`}
      backLink="/fabric-samples/kartela"
    >
      <div className="space-y-6">
        {/* Üst bilgi kartı */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {kartela.name}
                  {renderStatusBadge(kartela.status)}
                </CardTitle>
                <CardDescription>
                  {kartela.kartelaCode} | Oluşturulma: {format(new Date(kartela.createdAt), "dd MMMM yyyy", { locale: tr })}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrintKartelaQr}>
                  <QrCode className="mr-2 h-4 w-4" />
                  QR Yazdır
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate(`/fabric-samples/kartela/${id}/edit`)}>
                  Düzenle
                </Button>
                <Button size="sm" onClick={() => navigate(`/fabric-samples/kartela/${id}/ship`)}>
                  <Send className="mr-2 h-4 w-4" />
                  Gönder
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Açıklama</h4>
                <p className="text-sm text-gray-600">
                  {kartela.description || "Açıklama eklenmemiş."}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <h4 className="text-sm font-medium">Müşteri</h4>
                  <p className="text-sm text-gray-600">
                    {kartela.customerName || "Müşteri belirtilmemiş"}
                  </p>
                </div>
                <div className="flex justify-between">
                  <h4 className="text-sm font-medium">Kumaş Sayısı</h4>
                  <p className="text-sm text-gray-600">{kartela.items?.length || 0}</p>
                </div>
                <div className="flex justify-between">
                  <h4 className="text-sm font-medium">Son Güncelleme</h4>
                  <p className="text-sm text-gray-600">
                    {format(new Date(kartela.updatedAt), "dd MMMM yyyy HH:mm", { locale: tr })}
                  </p>
                </div>
              </div>
            </div>
            {kartela.notes && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-1">Notlar</h4>
                <p className="text-sm text-gray-600">{kartela.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sekmeler */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="fabrics">
              <Package className="h-4 w-4 mr-2" />
              Kartela Kumaşları
            </TabsTrigger>
            <TabsTrigger value="stock">
              <Download className="h-4 w-4 mr-2" />
              Stok Hareketleri
            </TabsTrigger>
            <TabsTrigger value="shipments">
              <Send className="h-4 w-4 mr-2" />
              Gönderimler
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fabrics" className="pt-4">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-medium">Kartela Kumaşları</h3>
              <Button onClick={() => setShowAddItemDialog(true)}>
                <Plus className="mr-2 h-4 w-4" /> Kumaş Ekle
              </Button>
            </div>

            {/* Kumaş listesi */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kartela.items && kartela.items.length > 0 ? (
                kartela.items.map((item: any) => (
                  <KartelaFabricItem
                    key={item.id}
                    id={item.id}
                    fabricTypeName={item.fabricTypeName}
                    fabricCode={item.fabricCode}
                    color={item.color}
                    weight={item.weight}
                    width={item.width}
                    composition={item.composition}
                    status={item.status}
                    onEdit={(itemId) => navigate(`/fabric-samples/kartela/${id}/items/${itemId}/edit`)}
                    onDelete={(itemId) => deleteFabricItemMutation.mutate(itemId)}
                    onPrintQr={handlePrintFabricQr}
                    onPrintLabel={(itemId) => toast({
                      title: "Etiket Yazdırma",
                      description: "Etiket yazdırma özelliği yakında eklenecek.",
                    })}
                  />
                ))
              ) : (
                <div className="col-span-3 py-8 text-center text-gray-500">
                  <p>Henüz bu kartelaya eklenmiş kumaş bulunmuyor.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowAddItemDialog(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Kumaş Ekle
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="stock" className="pt-4">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-medium">Stok Hareketleri</h3>
              <Button onClick={() => navigate(`/fabric-samples/kartela/${id}/stock/add`)}>
                <Plus className="mr-2 h-4 w-4" /> Stok Hareketi Ekle
              </Button>
            </div>

            {/* Stok hareketleri */}
            <Card>
              <CardContent className="p-0">
                {stockMovements && stockMovements.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 text-left font-medium">Tarih</th>
                        <th className="p-3 text-left font-medium">Hareket Tipi</th>
                        <th className="p-3 text-left font-medium">Miktar</th>
                        <th className="p-3 text-left font-medium">Kumaş</th>
                        <th className="p-3 text-left font-medium">Müşteri</th>
                        <th className="p-3 text-left font-medium">Belge No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockMovements.map((movement: any) => (
                        <tr key={movement.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-sm">
                            {format(new Date(movement.createdAt), "dd.MM.yyyy HH:mm")}
                          </td>
                          <td className="p-3 text-sm">
                            <Badge
                              variant={movement.movementType === "in" ? "outline" : "secondary"}
                            >
                              {movement.movementType === "in" ? "Giriş" : "Çıkış"}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">
                            {movement.quantity} {movement.unit}
                          </td>
                          <td className="p-3 text-sm">
                            {movement.kartelaItemId ? (
                              kartela.items?.find((i: any) => i.id === movement.kartelaItemId)?.fabricTypeName || "-"
                            ) : (
                              "Tüm Kartela"
                            )}
                          </td>
                          <td className="p-3 text-sm">{movement.customerName || "-"}</td>
                          <td className="p-3 text-sm">{movement.documentNumber || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    <p>Henüz stok hareketi bulunmuyor.</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate(`/fabric-samples/kartela/${id}/stock/add`)}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Stok Hareketi Ekle
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipments" className="pt-4">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-medium">Gönderimler</h3>
              <Button onClick={() => navigate(`/fabric-samples/kartela/${id}/ship`)}>
                <Plus className="mr-2 h-4 w-4" /> Yeni Gönderim
              </Button>
            </div>

            {/* Gönderimler */}
            <Card>
              <CardContent className="p-0">
                {shipments && shipments.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 text-left font-medium">Tarih</th>
                        <th className="p-3 text-left font-medium">Müşteri</th>
                        <th className="p-3 text-left font-medium">Gönderim Yöntemi</th>
                        <th className="p-3 text-left font-medium">Takip No</th>
                        <th className="p-3 text-left font-medium">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shipments.map((shipment: any) => (
                        <tr key={shipment.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-sm">
                            {format(new Date(shipment.shipmentDate), "dd.MM.yyyy")}
                          </td>
                          <td className="p-3 text-sm">{shipment.customerName}</td>
                          <td className="p-3 text-sm">{shipment.shipmentMethod}</td>
                          <td className="p-3 text-sm">{shipment.trackingNumber || "-"}</td>
                          <td className="p-3 text-sm">
                            <Badge
                              variant={
                                shipment.status === "pending"
                                  ? "outline"
                                  : shipment.status === "shipped"
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              {shipment.status === "pending"
                                ? "Beklemede"
                                : shipment.status === "shipped"
                                ? "Gönderildi"
                                : "Teslim Edildi"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    <p>Henüz gönderim bulunmuyor.</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate(`/fabric-samples/kartela/${id}/ship`)}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Yeni Gönderim
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Kumaş Ekleme Dialog */}
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Kumaş Ekle</DialogTitle>
            <DialogDescription>Kartelaya yeni bir kumaş örneği ekleyin.</DialogDescription>
          </DialogHeader>
          <KartelaItemForm
            fabricTypes={fabricTypes || []}
            onSubmit={handleAddFabricItem}
            isSubmitting={addFabricItemMutation.isPending}
            onCancel={() => setShowAddItemDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* QR Kod Yazdırma Modal */}
      {qrData && (
        <QrCodePrintModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          data={qrData}
          type={qrData.id === kartela.id ? "kartela" : "fabric"}
        />
      )}
    </PageContainer>
  );
}