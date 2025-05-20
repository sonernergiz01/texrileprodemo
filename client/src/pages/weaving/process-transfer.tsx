import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, ChevronLeft } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/utils";
// AppLayout bileşenini içe aktar
import { AppLayout } from "@/components/layout/app-layout";

export default function ProcessTransferPage() {
  const { id } = useParams<{ id: string }>();
  const weavingOrderId = parseInt(id || "0");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Form durumu
  const [quantity, setQuantity] = useState<number | "">("");
  const [unit, setUnit] = useState<string>("metre");
  const [targetProcessType, setTargetProcessType] = useState<string>("boyama");
  const [targetDepartmentId, setTargetDepartmentId] = useState<number | "">("");
  const [notes, setNotes] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Dokuma işlemi verisi
  const { data: weavingOrder, isLoading: isLoadingOrder, error: orderError } = useQuery({
    queryKey: ["/api/weaving", weavingOrderId],
    queryFn: () => apiRequest("GET", `/api/weaving/${weavingOrderId}`).then(res => res.json())
  });
  
  // Departmanlar verisi
  const { data: departments, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ["/api/admin/departments"],
    queryFn: () => apiRequest("GET", "/api/admin/departments").then(res => res.json())
  });
  
  // Terbiye/Apre süreç tipleri
  const finishingProcessTypes = [
    { id: "boyama", name: "Boyama" },
    { id: "apre", name: "Apre İşlemi" },
    { id: "yikama", name: "Yıkama" },
    { id: "kurutma", name: "Kurutma" },
    { id: "sanfor", name: "Sanfor" },
    { id: "fikse", name: "Fikse" },
    { id: "kalender", name: "Kalender" }
  ];
  
  // Transfer işlemi mutations
  const transferMutation = useMutation({
    mutationFn: async (transferData: any) => {
      const res = await apiRequest("POST", "/api/weaving-enhanced/transfers", transferData);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "İşlem başarılı",
        description: "Transfer işlemi başarıyla tamamlandı.",
        variant: "default",
      });
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["/api/weaving-enhanced/transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finishing/processes"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Transfer işlemi sırasında bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  // İlk veri yükleme
  useEffect(() => {
    // Dokuma işlemi varsa, formu önbellek
    if (weavingOrder) {
      setUnit(weavingOrder.unit || "metre");
      setQuantity(weavingOrder.quantity || "");
    }
  }, [weavingOrder]);
  
  // Terbiye departmanını otomatik seçme
  useEffect(() => {
    if (departments && departments.length > 0) {
      // "Terbiye" veya "TRB" kodlu departmanı bul
      const terbiyeDept = departments.find(d => 
        d.name.toLowerCase().includes("terbiye") || 
        d.code === "TRB" || 
        d.code === "TERBIYE"
      );
      
      if (terbiyeDept) {
        setTargetDepartmentId(terbiyeDept.id);
      }
    }
  }, [departments]);
  
  // Form gönderme işlemi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!weavingOrderId) {
      toast({
        title: "Hata",
        description: "Dokuma işlemi seçilmedi.",
        variant: "destructive",
      });
      return;
    }
    
    if (!quantity) {
      toast({
        title: "Hata",
        description: "Miktar alanı zorunludur.",
        variant: "destructive",
      });
      return;
    }
    
    if (!targetDepartmentId) {
      toast({
        title: "Hata",
        description: "Hedef departman seçilmedi.",
        variant: "destructive",
      });
      return;
    }
    
    // Transfer verisini hazırla
    const transferData = {
      sourceProcessId: weavingOrderId,
      sourceProcessType: "weaving",
      targetProcessType,
      targetDepartmentId,
      quantity: Number(quantity),
      unit,
      notes
    };
    
    // Mutation çağır
    transferMutation.mutate(transferData);
  };
  
  // Hata durumunu kontrol et
  if (orderError) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-red-500">Hata</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Dokuma işlemi yüklenirken bir hata oluştu. Lütfen tekrar deneyin.</p>
              <Button variant="secondary" className="mt-4" onClick={() => navigate("/weaving")}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Dokuma Modülüne Dön
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }
  
  // Başarılı işlem sonrası görünüm
  if (isSuccess) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card className="w-full">
            <CardHeader className="bg-green-50 dark:bg-green-900/20">
              <CardTitle className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircle className="mr-2 h-5 w-5" /> İşlem Başarılı
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4">
                Dokuma işlemi terbiye/apre sürecine başarıyla aktarıldı. Terbiye/apre işlemlerini 
                takip etmek için ilgili sayfaya gidebilirsiniz.
              </p>
              
              <div className="flex flex-col space-y-4 mt-6">
                <Button onClick={() => navigate("/finishing/processes")}>
                  Terbiye/Apre İşlemlerine Git
                </Button>
                <Button variant="outline" onClick={() => navigate(`/weaving-enhanced/weaving/${weavingOrderId}/transfers`)}>
                  Bu Dokuma İşleminin Transfer Geçmişini Görüntüle
                </Button>
                <Button variant="secondary" onClick={() => navigate("/weaving")}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Dokuma Modülüne Dön
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Dokuma İşlemini Terbiye/Apre Sürecine Aktar</CardTitle>
            <CardDescription>
              Bu form, tamamlanan dokuma işlemini terbiye/apre departmanına aktarmak için kullanılır.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isLoadingOrder ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3">Dokuma işlemi yükleniyor...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Dokuma İşlemi Bilgileri */}
                <div className="bg-muted/40 p-4 rounded-lg mb-6">
                  <h3 className="font-medium text-lg mb-3">Dokuma İşlemi Bilgileri</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>İş Emri No</Label>
                      <div className="font-medium mt-1">
                        {weavingOrder?.orderNumber || "-"}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Durum</Label>
                      <div className="mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          weavingOrder?.status === "completed" || weavingOrder?.status === "Tamamlandı" 
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}>
                          {weavingOrder?.status === "completed" ? "Tamamlandı" : 
                           weavingOrder?.status === "Tamamlandı" ? "Tamamlandı" : 
                           weavingOrder?.status || "-"}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Kumaş Tipi</Label>
                      <div className="font-medium mt-1">
                        {weavingOrder?.fabricType || "-"}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Miktar</Label>
                      <div className="font-medium mt-1">
                        {weavingOrder ? `${formatNumber(weavingOrder.quantity)} ${weavingOrder.unit || "metre"}` : "-"}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Başlangıç Tarihi</Label>
                      <div className="mt-1">
                        {weavingOrder?.actualStartDate ? formatDate(weavingOrder.actualStartDate, true) : "-"}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Bitiş Tarihi</Label>
                      <div className="mt-1">
                        {weavingOrder?.actualEndDate ? formatDate(weavingOrder.actualEndDate, true) : "-"}
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                {/* Transfer Bilgileri */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Transfer Bilgileri</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Miktar</Label>
                      <Input
                        id="quantity"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value ? parseFloat(e.target.value) : "")}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Terbiye/apre sürecine aktarılacak miktar
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="unit">Birim</Label>
                      <Select
                        value={unit}
                        onValueChange={setUnit}
                      >
                        <SelectTrigger id="unit">
                          <SelectValue placeholder="Birim seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="metre">Metre</SelectItem>
                          <SelectItem value="kg">Kilogram</SelectItem>
                          <SelectItem value="adet">Adet</SelectItem>
                          <SelectItem value="top">Top</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="processType">İşlem Tipi</Label>
                      <Select
                        value={targetProcessType}
                        onValueChange={setTargetProcessType}
                      >
                        <SelectTrigger id="processType">
                          <SelectValue placeholder="İşlem tipi seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {finishingProcessTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Terbiye/apre sürecinde uygulanacak işlem tipi
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="department">Departman</Label>
                      <Select
                        value={targetDepartmentId ? targetDepartmentId.toString() : ""}
                        onValueChange={(val) => setTargetDepartmentId(parseInt(val))}
                      >
                        <SelectTrigger id="department">
                          <SelectValue placeholder="Departman seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingDepartments ? (
                            <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
                          ) : (
                            departments?.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id.toString()}>
                                {dept.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notlar</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Transfer ile ilgili ek bilgiler..."
                      rows={3}
                    />
                  </div>
                </div>
              </form>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigate("/weaving")}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Geri Dön
            </Button>
            
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoadingOrder || transferMutation.isPending}
            >
              {transferMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Transfer İşlemini Başlat
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}