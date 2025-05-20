import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/page-container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { KartelaCard } from "../components/KartelaCard";
import { KartelaForm } from "../components/KartelaForm";
import { QrCodePrintModal } from "../components/QrCodePrintModal";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function KartelaPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // State tanımlamaları
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedKartela, setSelectedKartela] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrData, setQrData] = useState<any>(null);

  // Verileri yükle
  const { data: kartelas, isLoading } = useQuery({
    queryKey: ["/api/kartelas"],
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  // Kartelayı Oluştur
  const createKartelaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/kartelas", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kartelas"] });
      setShowAddDialog(false);
      toast({
        title: "Kartela Oluşturuldu",
        description: "Yeni kartela başarıyla oluşturuldu.",
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

  // Kartela Sil
  const deleteKartelaMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/kartelas/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kartelas"] });
      setShowDeleteDialog(false);
      setSelectedKartela(null);
      toast({
        title: "Kartela Silindi",
        description: "Kartela ve bağlı tüm veriler başarıyla silindi.",
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

  // Kartela ekle
  const handleAddKartela = (data: any) => {
    // Form verilerini API'ye gönderilecek şekilde dönüştür
    const formattedData = {
      ...data,
      customerId: data.customerId ? parseInt(data.customerId) : null,
    };
    
    createKartelaMutation.mutate(formattedData);
  };

  // Kartelayı silme işlemini başlat
  const handleDeleteKartela = (id: number) => {
    setSelectedKartela(id);
    setShowDeleteDialog(true);
  };

  // Kartelayı sil onay
  const confirmDeleteKartela = () => {
    if (selectedKartela) {
      deleteKartelaMutation.mutate(selectedKartela);
    }
  };

  // QR kodu yazdır
  const handlePrintQr = (id: number) => {
    const kartela = kartelas?.find((k: any) => k.id === id);
    
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
        }
      });
      setShowQrModal(true);
    }
  };

  // Kartelayı detay sayfasına yönlendir
  const handleViewKartela = (id: number) => {
    navigate(`/fabric-samples/kartela/${id}`);
  };

  // Kartelayı düzenle sayfasına yönlendir
  const handleEditKartela = (id: number) => {
    navigate(`/fabric-samples/kartela/${id}/edit`);
  };

  // Kartelayı gönderme sayfasına yönlendir
  const handleShipKartela = (id: number) => {
    navigate(`/fabric-samples/kartela/${id}/ship`);
  };

  // Filtrelenmiş kartelalar
  const getFilteredKartelas = () => {
    if (!kartelas) return [];
    
    let filtered = kartelas;
    
    // Metin araması
    if (searchQuery) {
      filtered = filtered.filter((kartela: any) => 
        kartela.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        kartela.kartelaCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (kartela.description && kartela.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (kartela.customerName && kartela.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Durum filtresi
    if (activeTab !== "all") {
      filtered = filtered.filter((kartela: any) => kartela.status === activeTab);
    }
    
    // En son oluşturulanı en üste getir
    return [...filtered].sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  // UI Rendering
  if (isLoading) {
    return (
      <PageContainer title="Kartela Yönetimi" subtitle="Kumaş kartela yönetimi">
        <div className="flex justify-center items-center h-[400px]">
          <p>Yükleniyor...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Kartela Yönetimi" subtitle="Kumaş kartela yönetimi">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Kartelalar</CardTitle>
              <CardDescription>
                Kumaş örneklerini içeren kartela bilgileri
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Yeni Kartela
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Arama ve Filtreleme */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Kartela ara..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full sm:w-auto"
              >
                <TabsList className="grid grid-cols-4 sm:w-[360px]">
                  <TabsTrigger value="all">Tümü</TabsTrigger>
                  <TabsTrigger value="draft">Taslak</TabsTrigger>
                  <TabsTrigger value="sent">Gönderildi</TabsTrigger>
                  <TabsTrigger value="approved">Onaylandı</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Kartela Listesi */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {getFilteredKartelas().length > 0 ? (
                getFilteredKartelas().map((kartela: any) => (
                  <KartelaCard
                    key={kartela.id}
                    id={kartela.id}
                    kartelaCode={kartela.kartelaCode}
                    name={kartela.name}
                    description={kartela.description}
                    customerName={kartela.customerName}
                    status={kartela.status}
                    itemCount={kartela.itemCount || 0}
                    createdAt={new Date(kartela.createdAt)}
                    onView={handleViewKartela}
                    onEdit={handleEditKartela}
                    onDelete={handleDeleteKartela}
                    onPrintQr={handlePrintQr}
                    onShip={handleShipKartela}
                  />
                ))
              ) : (
                <div className="col-span-3 py-8 text-center text-gray-500">
                  {searchQuery ? (
                    <p>Arama kriterlerine uygun kartela bulunamadı.</p>
                  ) : (
                    <p>Henüz kartela bulunmuyor. Yeni bir kartela oluşturun.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yeni Kartela Ekleme Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yeni Kartela Oluştur</DialogTitle>
            <DialogDescription>
              Kumaş örnekleri içeren yeni bir kartela oluşturun.
            </DialogDescription>
          </DialogHeader>
          <KartelaForm
            customers={customers || []}
            onSubmit={handleAddKartela}
            isSubmitting={createKartelaMutation.isPending}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Kartela Silme Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Kartela Sil</DialogTitle>
            <DialogDescription>
              Bu kartelayı silmek istediğinizden emin misiniz? Bu işlem geriye alınamaz.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteKartela}
              disabled={deleteKartelaMutation.isPending}
            >
              {deleteKartelaMutation.isPending ? "Siliniyor..." : "Sil"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Kod Yazdırma Modal */}
      {qrData && (
        <QrCodePrintModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          data={qrData}
          type="kartela"
        />
      )}
    </PageContainer>
  );
}