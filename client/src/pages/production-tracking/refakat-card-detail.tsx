import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { 
  Loader2, 
  ArrowLeft, 
  Save, 
  Trash, 
  LucideEdit, 
  RotateCw, 
  BarChartHorizontal,
  Package,
  Tag,
  History
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/layout/page-header";
import { useAuth } from "@/hooks/use-auth";
import { BarcodePrintButton } from "@/components/ui/barcode-print-button";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Refakat kartı durumları için renkler ve Türkçe çevirileri
const statusColors = {
  "created": "bg-blue-500",
  "in-process": "bg-amber-500",
  "completed": "bg-green-500",
  "rejected": "bg-red-500"
};

const statusLabels = {
  "created": "Oluşturuldu",
  "in-process": "İşlemde",
  "completed": "Tamamlandı",
  "rejected": "Reddedildi"
};

export default function RefakatCardDetailPage() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  
  // Departmanları getir
  const { data: departments } = useQuery<any[]>({
    queryKey: ["/api/admin/departments"],
    enabled: !!user
  });
  
  // Refakat kartı detayını getir
  const { 
    data: card, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery<any>({
    queryKey: [`/api/production-tracking/production-cards/${id}`],
    enabled: !!user && !!id
  });
  
  // Kart verisi geldiğinde form verilerini güncelle
  React.useEffect(() => {
    if (card) {
      setFormData({
        currentDepartmentId: String(card.currentDepartmentId || ""),
        status: card.status,
        length: card.length || "",
        weight: card.weight || "",
        width: card.width || "",
        color: card.color || "",
        qualityGrade: card.qualityGrade || "",
        notes: card.notes || ""
      });
    }
  }, [card]);
  
  // Refakat kartı hareketlerini getir
  const { 
    data: movements,
    isLoading: isMovementsLoading 
  } = useQuery<any[]>({
    queryKey: [`/api/production-tracking/production-cards/${id}/movements`],
    enabled: !!user && !!id
  });
  
  // Refakat kartını güncelle
  const updateCardMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const res = await apiRequest("PATCH", `/api/production-tracking/production-cards/${id}`, updatedData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Güncelleme Başarılı",
        description: "Refakat kartı başarıyla güncellendi.",
      });
      setIsEditing(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/production-tracking/production-cards"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Güncelleme sırasında bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Departman değişikliği ekle
  const addMovementMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/production-tracking/production-card-movements", {
        productionCardId: Number(id),
        type: "department_change",
        departmentId: Number(data.departmentId),
        description: `Kart ${departments?.find(d => d.id === Number(data.departmentId))?.name || "yeni"} departmanına taşındı`,
        changedBy: user?.id,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Hareket Eklendi",
        description: "Kart hareketi başarıyla kaydedildi."
      });
      queryClient.invalidateQueries({ queryKey: [`/api/production-tracking/production-cards/${id}/movements`] });
      queryClient.invalidateQueries({ queryKey: [`/api/production-tracking/production-cards/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-tracking/production-cards"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Hareket kaydedilirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Form alanı değişikliği
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Select değişikliği
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Eğer departman değişirse, hareket de ekle
    if (name === "currentDepartmentId" && card?.currentDepartmentId !== Number(value)) {
      addMovementMutation.mutate({ departmentId: value });
    }
  };
  
  // Formu gönder
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form verilerini hazırla (yalnızca değişenleri)
    const updatedData: any = {};
    
    if (formData.status !== card.status) updatedData.status = formData.status;
    if (formData.currentDepartmentId !== String(card.currentDepartmentId)) {
      updatedData.currentDepartmentId = Number(formData.currentDepartmentId);
    }
    if (String(formData.length) !== String(card.length)) updatedData.length = formData.length === "" ? null : Number(formData.length);
    if (String(formData.weight) !== String(card.weight)) updatedData.weight = formData.weight === "" ? null : Number(formData.weight);
    if (String(formData.width) !== String(card.width)) updatedData.width = formData.width === "" ? null : Number(formData.width);
    if (formData.color !== card.color) updatedData.color = formData.color;
    if (formData.qualityGrade !== card.qualityGrade) updatedData.qualityGrade = formData.qualityGrade;
    if (formData.notes !== card.notes) updatedData.notes = formData.notes;
    
    // Veri varsa güncelle
    if (Object.keys(updatedData).length > 0) {
      updateCardMutation.mutate(updatedData);
    } else {
      setIsEditing(false);
      toast({
        title: "Bilgi",
        description: "Değişiklik yapılmadı.",
      });
    }
  };
  
  // Kartlar listesine dön
  const handleGoBack = () => {
    navigate("/production-tracking/refakat-cards");
  };
  
  // Yükleme durumu
  if (isLoading) {
    return (
      <div className="container mx-auto py-4">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  // Hata durumu
  if (isError || !card) {
    return (
      <div className="container mx-auto py-4">
        <PageHeader
          title="Hata"
          description="Refakat kartı bulunamadı veya yüklenirken bir hata oluştu."
          actions={
            <Button variant="outline" onClick={handleGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
            </Button>
          }
        />
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="text-center text-red-500">
              <p>Bu refakat kartı bulunamadı veya erişim yetkiniz yok.</p>
              <Button className="mt-4" variant="outline" onClick={handleGoBack}>
                Refakat Kartları Listesine Dön
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-4">
      <PageHeader
        title={`Refakat Kartı: ${card.cardNo}`}
        description="Refakat kartı detayları ve hareket geçmişi"
        actions={
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Kartlara Dön
            </Button>
            <BarcodePrintButton
              data={card.barcode}
              title="Barkod Yazdır"
              description={`Kart: ${card.cardNo} - Sipariş: ${card.orderNumber || '-'}`}
              additionalInfo={[
                { label: "Kart No", value: card.cardNo },
                { label: "Sipariş No", value: card.orderNumber || "-" },
                { label: "Departman", value: departments?.find(d => d.id === card.currentDepartmentId)?.name || "-" },
              ]}
            />
          </div>
        }
      />
      
      <Tabs defaultValue="details" className="mt-4">
        <TabsList>
          <TabsTrigger value="details">
            <Tag className="mr-2 h-4 w-4" /> Kart Detayları
          </TabsTrigger>
          <TabsTrigger value="movements">
            <History className="mr-2 h-4 w-4" /> Hareket Geçmişi
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" /> Kart Bilgileri
                </CardTitle>
                <Badge className={statusColors[card.status as keyof typeof statusColors] || "bg-gray-500"}>
                  {statusLabels[card.status as keyof typeof statusLabels] || "Bilinmiyor"}
                </Badge>
              </div>
              <CardDescription>
                Refakat kartı temel bilgileri ve durum bilgisi
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="cardNo">Kart No</Label>
                    <Input id="cardNo" value={card.cardNo} readOnly disabled />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="barcode">Barkod</Label>
                    <Input id="barcode" value={card.barcode} readOnly disabled />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="createdAt">Oluşturma Tarihi</Label>
                    <Input 
                      id="createdAt" 
                      value={new Date(card.createdAt).toLocaleString('tr-TR')} 
                      readOnly 
                      disabled 
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="status">Durum</Label>
                    {isEditing ? (
                      <Select 
                        name="status"
                        value={formData.status} 
                        onValueChange={(value) => handleSelectChange("status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Durum seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="created">Oluşturuldu</SelectItem>
                          <SelectItem value="in-process">İşlemde</SelectItem>
                          <SelectItem value="completed">Tamamlandı</SelectItem>
                          <SelectItem value="rejected">Reddedildi</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input 
                        id="status" 
                        value={statusLabels[card.status as keyof typeof statusLabels] || "Bilinmiyor"} 
                        readOnly 
                        disabled 
                      />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="currentDepartment">Güncel Departman</Label>
                    {isEditing ? (
                      <Select 
                        name="currentDepartmentId"
                        value={formData.currentDepartmentId} 
                        onValueChange={(value) => handleSelectChange("currentDepartmentId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Departman seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments?.map(dept => (
                            <SelectItem key={dept.id} value={String(dept.id)}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input 
                        id="currentDepartment" 
                        value={card.departmentName || "Atanmamış"} 
                        readOnly 
                        disabled 
                      />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="productionPlanId">Üretim Planı</Label>
                    <Input 
                      id="productionPlanId" 
                      value={card.productionPlanId || "-"} 
                      readOnly 
                      disabled 
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="color">Renk / Desen</Label>
                    {isEditing ? (
                      <Input 
                        id="color" 
                        name="color"
                        value={formData.color || ""} 
                        onChange={handleInputChange}
                        placeholder="Ör: Mavi, Çizgili, vb."
                      />
                    ) : (
                      <Input 
                        id="color" 
                        value={card.color || "-"} 
                        readOnly 
                        disabled 
                      />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="length">Uzunluk / Adet</Label>
                    {isEditing ? (
                      <Input 
                        id="length" 
                        name="length"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.length || ""} 
                        onChange={handleInputChange}
                        placeholder="Ör: 100.5"
                      />
                    ) : (
                      <Input 
                        id="length" 
                        value={card.length ? `${card.length} m` : "-"} 
                        readOnly 
                        disabled 
                      />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="weight">Ağırlık (kg)</Label>
                    {isEditing ? (
                      <Input 
                        id="weight" 
                        name="weight"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.weight || ""} 
                        onChange={handleInputChange}
                        placeholder="Ör: 25.75"
                      />
                    ) : (
                      <Input 
                        id="weight" 
                        value={card.weight ? `${card.weight} kg` : "-"} 
                        readOnly 
                        disabled 
                      />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="width">En (cm)</Label>
                    {isEditing ? (
                      <Input 
                        id="width" 
                        name="width"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.width || ""} 
                        onChange={handleInputChange}
                        placeholder="Ör: 150"
                      />
                    ) : (
                      <Input 
                        id="width" 
                        value={card.width ? `${card.width} cm` : "-"} 
                        readOnly 
                        disabled 
                      />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="qualityGrade">Kalite Sınıfı</Label>
                    {isEditing ? (
                      <Select 
                        name="qualityGrade"
                        value={formData.qualityGrade || ""} 
                        onValueChange={(value) => handleSelectChange("qualityGrade", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kalite sınıfı seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Belirtilmemiş</SelectItem>
                          <SelectItem value="A">A Sınıfı</SelectItem>
                          <SelectItem value="B">B Sınıfı</SelectItem>
                          <SelectItem value="C">C Sınıfı</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input 
                        id="qualityGrade" 
                        value={card.qualityGrade ? `${card.qualityGrade} Sınıfı` : "Belirtilmemiş"} 
                        readOnly 
                        disabled 
                      />
                    )}
                  </div>
                </div>
                
                <div className="mt-6 space-y-1">
                  <Label htmlFor="notes">Notlar</Label>
                  {isEditing ? (
                    <Textarea 
                      id="notes" 
                      name="notes"
                      value={formData.notes || ""} 
                      onChange={handleInputChange}
                      placeholder="Kart ile ilgili notlar..."
                      className="h-24"
                    />
                  ) : (
                    <Textarea 
                      id="notes" 
                      value={card.notes || "Not bulunmuyor."} 
                      readOnly 
                      disabled 
                      className="resize-none h-20"
                    />
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between border-t bg-muted/50 p-4">
                {isEditing ? (
                  <>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                    >
                      İptal
                    </Button>
                    <div className="flex space-x-2">
                      <Button 
                        type="submit" 
                        disabled={updateCardMutation.isPending}
                      >
                        {updateCardMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Kaydediliyor...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Değişiklikleri Kaydet
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleGoBack}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Listeye Dön
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => setIsEditing(true)}
                      variant="default"
                    >
                      <LucideEdit className="mr-2 h-4 w-4" />
                      Düzenle
                    </Button>
                  </>
                )}
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="movements" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChartHorizontal className="mr-2 h-5 w-5" /> Kart Hareketleri
              </CardTitle>
              <CardDescription>
                Bu refakat kartının departmanlar arası hareket geçmişi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isMovementsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !movements || movements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="mx-auto h-12 w-12 mb-2 opacity-20" />
                  <p>Henüz hareket kaydı bulunmuyor</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Tür</TableHead>
                        <TableHead>Departman</TableHead>
                        <TableHead>Açıklama</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell className="font-medium">{new Date(movement.createdAt).toLocaleString('tr-TR')}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {movement.type === 'department_change' ? 'Departman Değişimi' : 
                               movement.type === 'status_change' ? 'Durum Değişimi' : 
                               movement.type === 'quality_check' ? 'Kalite Kontrolü' :
                               'Diğer'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {departments?.find(d => d.id === movement.departmentId)?.name || '-'}
                          </TableCell>
                          <TableCell>{movement.description || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}