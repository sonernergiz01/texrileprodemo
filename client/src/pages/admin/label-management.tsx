import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, Check, Copy, Download, Edit, Plus, Printer, QrCode, Tag, Trash } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import * as QR from "qrcode";

// Etiket oluşturma formu validasyon şeması
const labelSchema = z.object({
  name: z.string().min(3, "Etiket adı en az 3 karakter olmalıdır"),
  type: z.string().min(1, "Etiket türü seçilmelidir"),
  width: z.string().min(1, "Genişlik gereklidir"),
  height: z.string().min(1, "Yükseklik gereklidir"),
  description: z.string().optional(),
  isQrCode: z.boolean().default(false),
  content: z.string().min(1, "Etiket içeriği gereklidir"),
  fields: z.string().min(1, "Etiket alanları gereklidir"),
  departmentId: z.number().optional()
});

// Etiket yazırma formu validasyon şeması
const printSchema = z.object({
  labelId: z.number().min(1, "Etiket türü seçilmelidir"),
  quantity: z.number().min(1, "En az 1 adet yazdırılmalıdır").max(100, "En fazla 100 adet yazdırılabilir"),
  data: z.record(z.string()).optional()
});

type LabelFormData = z.infer<typeof labelSchema>;
type PrintFormData = z.infer<typeof printSchema>;

const LabelManagementPage = () => {
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [showNewLabel, setShowNewLabel] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<any>(null);
  const [labelPreview, setLabelPreview] = useState<string | null>(null);

  // Etiket form tanımlama
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<LabelFormData>({
    resolver: zodResolver(labelSchema),
    defaultValues: {
      name: "",
      type: "",
      width: "100",
      height: "60",
      description: "",
      isQrCode: false,
      content: "",
      fields: "{ \"field1\": \"Değer 1\", \"field2\": \"Değer 2\" }",
    }
  });

  // Yazdırma form tanımlama
  const {
    register: registerPrint,
    handleSubmit: handleSubmitPrint,
    formState: { errors: printErrors },
    reset: resetPrint,
    setValue: setPrintValue,
    watch: watchPrint
  } = useForm<PrintFormData>({
    resolver: zodResolver(printSchema),
    defaultValues: {
      labelId: 0,
      quantity: 1,
      data: {}
    }
  });

  // Etiket verilerini çek
  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>(undefined);

  const { data: labels = [], isLoading } = useQuery({
    queryKey: ["/api/labels/types", selectedDepartment],
    queryFn: async () => {
      const url = selectedDepartment 
        ? `/api/labels/types?departmentId=${selectedDepartment}` 
        : "/api/labels/types";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Etiketler yüklenemedi");
      return response.json();
    }
  });

  // Etiket yazdırma geçmişini çek
  const { data: printHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ["/api/labels/prints"],
    queryFn: async () => {
      const response = await fetch("/api/labels/prints");
      if (!response.ok) throw new Error("Yazdırma geçmişi yüklenemedi");
      return response.json();
    }
  });

  // Departman listesini çek
  const { data: departments = [] } = useQuery({
    queryKey: ["/api/admin/departments"],
    queryFn: async () => {
      const response = await fetch("/api/admin/departments");
      if (!response.ok) throw new Error("Departmanlar yüklenemedi");
      return response.json();
    }
  });

  // Yeni etiket oluştur
  const createLabelMutation = useMutation({
    mutationFn: async (data: LabelFormData) => {
      const response = await apiRequest("POST", "/api/labels", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Etiket oluşturulamadı");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Etiket başarıyla oluşturuldu",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/labels/types"] });
      setShowNewLabel(false);
      reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Etiket yazdır
  const printLabelMutation = useMutation({
    mutationFn: async (data: PrintFormData) => {
      const response = await apiRequest("POST", "/api/labels/print", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Etiket yazdırılamadı");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Başarılı",
        description: "Etiket yazdırma işlemi başarılı",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/labels/prints"] });
      createPDF(data);
      setShowPrintDialog(false);
      resetPrint();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Etiket sil
  const deleteLabelMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/labels/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Etiket silinemedi");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Etiket başarıyla silindi",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/labels/types"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Yeni etiket oluştur
  const onSubmitLabel = (data: LabelFormData) => {
    createLabelMutation.mutate(data);
  };

  // Etiket yazdır
  const onSubmitPrint = (data: PrintFormData) => {
    printLabelMutation.mutate(data);
  };

  // Etiket önizleme
  const handlePreview = (label: any) => {
    console.log("Önizleme başlatılıyor:", label);
    try {
      if (!label) {
        throw new Error("Etiket verisi bulunamadı");
      }
      
      // Gerekli alanların kontrolü
      if (!label.name) {
        console.warn("Etiket adı bulunamadı, varsayılan ad kullanılacak");
      }
      
      // Template kontrolü
      if (label.template && typeof label.template === 'string') {
        try {
          JSON.parse(label.template);
        } catch (e) {
          console.warn("Template JSON formatında değil:", e);
        }
      }
      
      // Fields kontrolü
      if (label.fields && typeof label.fields === 'string') {
        try {
          JSON.parse(label.fields);
        } catch (e) {
          console.warn("Fields JSON formatında değil:", e);
        }
      }
      
      setSelectedLabel(label);
      setLabelPreview(null); // önce önizleme temizle
      setShowPreviewDialog(true); // Dialog'u hemen aç
      
      // Biraz gecikme ile önizleme oluştur (DOM güncellemesi için zaman tanı)
      setTimeout(() => {
        generatePreview(label);
      }, 100);
    } catch (err) {
      console.error("Önizleme başlatılırken hata:", err);
      toast({
        title: "Hata",
        description: "Önizleme başlatılamadı: " + (err instanceof Error ? err.message : "Bilinmeyen hata"),
        variant: "destructive",
      });
    }
  };

  // QR kod oluştur
  const generateQR = async (data: string): Promise<string> => {
    try {
      return await QR.toDataURL(data);
    } catch (err) {
      console.error(err);
      return "";
    }
  };

  // Önizleme oluştur
  const generatePreview = async (label: any) => {
    if (!label) {
      toast({
        title: "Hata",
        description: "Etiket verisi bulunamadı",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Önizleme için etiket:", label);
    
    try {
      // Template verisini JSON olarak çözümle
      let template: any = {};
      
      if (label.template) {
        try {
          if (typeof label.template === 'string') {
            console.log("Template string:", label.template);
            template = JSON.parse(label.template);
          } else if (typeof label.template === 'object') {
            template = label.template;
          } else {
            console.log("Template bilinmeyen tür:", typeof label.template);
            template = { width: 100, height: 60, barcodeType: 'code128' };
          }
        } catch (e) {
          console.error("Template JSON çözümlenemedi:", e);
          template = { width: 100, height: 60, barcodeType: 'code128' };
        }
      } else {
        console.log("Template verisi yok, varsayılan kullanılıyor");
        template = { width: 100, height: 60, barcodeType: 'code128' };
      }
      
      console.log("Çözümlenmiş template:", template);
      
      // Boyut bilgilerini template'den al
      const width = template.width || 100;
      const height = template.height || 60;
      
      console.log(`Boyutlar: ${width}mm x ${height}mm`);

      // Boş bir PDF oluştur
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [Number(width), Number(height)]
      });
      
      // PDF içeriği
      doc.setFontSize(12);
      doc.text(label.name || "İsimsiz Etiket", 5, 10);
      
      // QR kod ekle
      const isQrCode = template.barcodeType === 'qrcode';
      try {
        if (isQrCode) {
          const qrData = await generateQR(JSON.stringify({ label: label.name, id: label.id }));
          doc.addImage(qrData, "PNG", 5, 15, 20, 20);
          doc.text("Etiket Tipi: " + getLabelTypeText(label.type || 'diger'), 30, 20);
          doc.text("Tarih: " + format(new Date(), "dd/MM/yyyy", { locale: tr }), 30, 30);
        } else {
          doc.text("Etiket Tipi: " + getLabelTypeText(label.type || 'diger'), 5, 20);
          doc.text("Tarih: " + format(new Date(), "dd/MM/yyyy", { locale: tr }), 5, 30);
        }
      } catch (e) {
        console.error("QR kod eklenirken hata:", e);
        doc.text("Etiket Tipi: " + getLabelTypeText(label.type || 'diger'), 5, 20);
        doc.text("Tarih: " + format(new Date(), "dd/MM/yyyy", { locale: tr }), 5, 30);
      }
      
      // Fields bilgisini göster
      try {
        let fields: any = [];
        
        if (label.fields) {
          if (typeof label.fields === 'string') {
            console.log("Fields string:", label.fields);
            try {
              fields = JSON.parse(label.fields);
            } catch (err) {
              console.error("Fields JSON çözümlenemedi:", err);
              fields = [label.fields];
            }
          } else if (Array.isArray(label.fields)) {
            fields = label.fields;
          } else if (typeof label.fields === 'object') {
            fields = label.fields;
          }
        } else {
          console.log("Fields verisi yok");
        }
        
        console.log("Çözümlenmiş fields:", fields);
        
        let yPos = 40;
        if (Array.isArray(fields)) {
          fields.forEach((field: string) => {
            doc.text(`Alan: ${field}`, 5, yPos);
            yPos += 8;
          });
        } else if (fields && typeof fields === 'object') {
          Object.entries(fields).forEach(([key, value]) => {
            doc.text(`${key}: ${String(value)}`, 5, yPos);
            yPos += 8;
          });
        }
      } catch (e) {
        console.error("Fields gösterilirken hata:", e);
      }
      
      // PDF'i base64 string olarak al
      try {
        const pdfData = doc.output("datauristring");
        console.log("PDF oluşturuldu");
        setLabelPreview(pdfData);
      } catch (e) {
        console.error("PDF çıktısı alınırken hata:", e);
        throw e;
      }
    } catch (error) {
      console.error("Önizleme oluşturma hatası:", error);
      toast({
        title: "Hata",
        description: "Etiket önizleme oluşturulamadı: " + (error instanceof Error ? error.message : "Bilinmeyen hata"),
        variant: "destructive",
      });
    }
  };

  // PDF oluştur ve indir
  const createPDF = async (printData: any) => {
    console.log("PDF oluşturuluyor, veri:", printData);
    
    try {
      // Önce veri kontrolü
      if (!printData) {
        throw new Error("Yazdırma verisi bulunamadı");
      }
      
      const { label } = printData;
      
      if (!label) {
        throw new Error("Etiket verisi bulunamadı");
      }
      
      console.log("Yazdırma için etiket:", label);
      console.log("Yazdırma verisi:", printData);
      
      // Template verisini JSON olarak çözümle
      let template: any = {};
      
      if (label.template) {
        try {
          if (typeof label.template === 'string') {
            console.log("Template string:", label.template);
            template = JSON.parse(label.template);
          } else if (typeof label.template === 'object') {
            template = label.template;
          } else {
            console.log("Template bilinmeyen tür:", typeof label.template);
            template = { width: 100, height: 60, barcodeType: 'code128' };
          }
        } catch (e) {
          console.error("Template JSON çözümlenemedi:", e);
          template = { width: 100, height: 60, barcodeType: 'code128' };
        }
      } else {
        console.log("Template verisi yok, varsayılan kullanılıyor");
        template = { width: 100, height: 60, barcodeType: 'code128' };
      }
      
      console.log("Çözümlenmiş template:", template);
      
      // Boyut bilgilerini template'den al
      const width = template.width || 100;
      const height = template.height || 60;
      
      console.log(`Boyutlar: ${width}mm x ${height}mm`);
      
      // PDF oluştur
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [Number(width), Number(height)]
      });
      
      // Yazdırma sayısı kadar tekrarla
      const quantity = printData.quantity || 1;
      console.log(`${quantity} adet etiket yazdırılacak`);
      
      for (let i = 0; i < quantity; i++) {
        if (i > 0) doc.addPage([Number(width), Number(height)]);
        
        // Sayfa içeriği
        doc.setFontSize(12);
        doc.text(label.name || "İsimsiz Etiket", 5, 10);
        
        // Alanları işle
        try {
          let fields: any = [];
          
          if (label.fields) {
            if (typeof label.fields === 'string') {
              console.log("Fields string:", label.fields);
              try {
                fields = JSON.parse(label.fields);
              } catch (err) {
                console.error("Fields JSON çözümlenemedi:", err);
                fields = [label.fields];
              }
            } else if (Array.isArray(label.fields)) {
              fields = label.fields;
            } else if (typeof label.fields === 'object') {
              fields = label.fields;
            }
          } else {
            console.log("Fields verisi yok");
          }
          
          console.log("Çözümlenmiş fields:", fields);
          
          const data = printData.data || {};
          console.log("Yazdırma verileri:", data);
          
          let yPos = 20;
          
          if (Array.isArray(fields)) {
            fields.forEach((field: string) => {
              const value = data[field] || field;
              doc.text(`${field}: ${String(value)}`, 5, yPos);
              yPos += 8;
            });
          } else if (fields && typeof fields === 'object') {
            Object.entries(fields).forEach(([key, defaultValue]) => {
              const value = data[key] || defaultValue;
              doc.text(`${key}: ${String(value)}`, 5, yPos);
              yPos += 8;
            });
          }
        } catch (e) {
          console.error("Fields işlenirken hata:", e);
        }
        
        // QR kod veya barkod ekle
        const isQrCode = template.barcodeType === 'qrcode';
        if (isQrCode) {
          try {
            // QR kod için async/await yerine Promise zinciri kullanmalıyız
            generateQR(JSON.stringify({ 
              label: label.name, 
              id: label.id,
              type: label.type,
              timestamp: new Date().toISOString()
            }))
            .then(qrData => {
              doc.addImage(qrData, "PNG", 5, height - 25, 20, 20);
            })
            .catch(err => {
              console.error("QR kod oluşturma hatası:", err);
            });
          } catch (err) {
            console.error("QR kod işlenirken beklenmeyen hata:", err);
          }
        }
        
        // Yazdırma bilgileri
        doc.setFontSize(8);
        doc.text(`Yazdırma ID: ${printData.id || 'Önizleme'}`, 5, Number(height) - 5);
        doc.text(`Tarih: ${format(new Date(printData.createdAt || new Date()), "dd/MM/yyyy HH:mm", { locale: tr })}`, 5, Number(height) - 3);
      }
      
      // PDF'i indir
      const filename = `Etiket_${label.name.replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`;
      console.log(`PDF oluşturuldu: ${filename}`);
      doc.save(filename);
      
      toast({
        title: "Başarılı",
        description: "PDF başarıyla oluşturuldu ve indirildi",
        variant: "default",
      });
    } catch (error) {
      console.error("PDF oluşturma hatası:", error);
      toast({
        title: "Hata",
        description: "PDF oluşturulamadı: " + (error instanceof Error ? error.message : "Bilinmeyen hata"),
        variant: "destructive",
      });
    }
  };

  // Etiket yazdırma dialogunu aç
  const openPrintDialog = (label: any) => {
    setSelectedLabel(label);
    setPrintValue("labelId", label.id);
    generatePreview(label);
    setShowPrintDialog(true);
  };

  // Etiket türüne göre renk döndür
  const getLabelTypeColor = (type: string) => {
    switch (type) {
      case "dokuma": return "bg-blue-100 text-blue-800";
      case "ham_kalite": return "bg-amber-100 text-amber-800";
      case "refakat_karti": return "bg-orange-100 text-orange-800";
      case "kalite_kontrol": return "bg-red-100 text-red-800";
      case "sevkiyat": return "bg-green-100 text-green-800";
      case "iplik_depo": return "bg-purple-100 text-purple-800";
      case "kumas_depo": return "bg-teal-100 text-teal-800";
      case "kartela": return "bg-indigo-100 text-indigo-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Etiket tipine göre Türkçe metin döndür
  const getLabelTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      "dokuma": "Dokuma",
      "ham_kalite": "Ham Kalite Kontrol",
      "refakat_karti": "Üretim Refakat Kartı",
      "kalite_kontrol": "Kalite Kontrol",
      "sevkiyat": "Sevkiyat",
      "iplik_depo": "İplik Depo",
      "kumas_depo": "Kumaş Depo",
      "kartela": "Kartela",
      "diger": "Diğer"
    };
    return typeMap[type] || type;
  };

  return (
    <PageContainer
      title="Etiket Yönetimi"
      subtitle="Üretim, depo ve sevkiyat için etiketleri yönetin"
      breadcrumbs={[
        { label: "Ana Sayfa", href: "/" },
        { label: "Admin", href: "/admin" },
        { label: "Etiket Yönetimi", href: "/admin/labels" },
      ]}
      hideTitle={location === "/admin/labels"}
    >
      <Tabs defaultValue="labels" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="labels">Etiket Tipleri</TabsTrigger>
          <TabsTrigger value="history">Yazdırma Geçmişi</TabsTrigger>
        </TabsList>
        
        {/* Etiket Tipleri Sekmesi */}
        <TabsContent value="labels">
          <div className="mb-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold">Etiket Tipleri</h2>
              <Select
                value={selectedDepartment?.toString() || ""}
                onValueChange={(value) => setSelectedDepartment(value ? parseInt(value) : undefined)}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Tüm Departmanlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Tüm Departmanlar</SelectItem>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => setShowNewLabel(true)} 
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Yeni Etiket Tipi
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            </div>
          ) : (
            <>
              {labels.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <Tag className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-500">Henüz etiket tipi oluşturulmadı</p>
                    <p className="text-sm text-gray-400 mb-4">Etiket tiplerini eklemek için "Yeni Etiket Tipi" düğmesine tıklayın</p>
                    <Button 
                      onClick={() => setShowNewLabel(true)} 
                      variant="outline"
                    >
                      Etiket Tipi Oluştur
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {labels.map((label: any) => (
                    <Card key={label.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {label.name}
                              {label.isQrCode && <QrCode className="h-4 w-4 text-blue-500" />}
                            </CardTitle>
                            <CardDescription>
                              {label.description || "Açıklama bulunmuyor"}
                            </CardDescription>
                          </div>
                          <Badge className={getLabelTypeColor(label.type)}>
                            {getLabelTypeText(label.type)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3 pt-0">
                        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                          <div>
                            <span className="font-medium">Boyut:</span>{" "}
                            {(() => {
                              try {
                                const template = typeof label.template === 'string' 
                                  ? JSON.parse(label.template) 
                                  : label.template;
                                return `${template.width || 100}mm x ${template.height || 60}mm`;
                              } catch (e) {
                                return "Boyut bilgisi alınamadı";
                              }
                            })()}
                          </div>
                          <div>
                            <span className="font-medium">Oluşturma:</span>{" "}
                            {format(new Date(label.createdAt), "dd/MM/yyyy", { locale: tr })}
                          </div>
                        </div>
                        <div className="text-sm mb-4">
                          <span className="font-medium">İçerik Alanları:</span>
                          <div className="mt-1 text-gray-600">
                            {(() => {
                              try {
                                const fields = typeof label.fields === 'string' 
                                  ? JSON.parse(label.fields) 
                                  : label.fields;
                                
                                if (Array.isArray(fields)) {
                                  return fields.join(", ");
                                } else if (typeof fields === 'object') {
                                  return Object.keys(fields).join(", ");
                                } else {
                                  return "Alanlar bulunamadı";
                                }
                              } catch (e) {
                                return "Alan bilgisi alınamadı";
                              }
                            })()}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 flex justify-between">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handlePreview(label)}
                          >
                            <Download className="h-4 w-4 mr-1" /> Önizle
                          </Button>
                          <Button 
                            size="sm" 
                            variant="default" 
                            onClick={() => openPrintDialog(label)}
                          >
                            <Printer className="h-4 w-4 mr-1" /> Yazdır
                          </Button>
                        </div>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => {
                            if (window.confirm(`"${label.name}" etiketini silmek istediğinize emin misiniz?`)) {
                              deleteLabelMutation.mutate(label.id);
                            }
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Yazdırma Geçmişi Sekmesi */}
        <TabsContent value="history">
          <h2 className="text-xl font-bold mb-4">Yazdırma Geçmişi</h2>
          
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            </div>
          ) : (
            <>
              {printHistory.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <Printer className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-500">Yazdırma geçmişi bulunamadı</p>
                    <p className="text-sm text-gray-400">Henüz hiç etiket yazdırılmamış</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Etiket</TableHead>
                        <TableHead>Kullanıcı</TableHead>
                        <TableHead>Miktar</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {printHistory.map((print: any) => (
                        <TableRow key={print.id}>
                          <TableCell className="font-medium">{print.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {print.label?.isQrCode && <QrCode className="h-4 w-4 text-blue-500" />}
                              {print.label?.name || "Bilinmeyen Etiket"}
                            </div>
                          </TableCell>
                          <TableCell>{print.user?.username || "Bilinmeyen Kullanıcı"}</TableCell>
                          <TableCell>{print.quantity || 1}</TableCell>
                          <TableCell>
                            {print.printedAt 
                              ? format(new Date(print.printedAt), "dd/MM/yyyy HH:mm", { locale: tr })
                              : "Tarih bilgisi yok"
                            }
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => print.label && createPDF(print)}
                              disabled={!print.label}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Yeni Etiket Oluşturma Modalı */}
      <Dialog open={showNewLabel} onOpenChange={setShowNewLabel}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Etiket Tipi Oluştur</DialogTitle>
            <DialogDescription>
              Üretim, depo veya sevkiyat için kullanacağınız etiket tipini tanımlayın.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmitLabel)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Etiket Adı</Label>
                <Input id="name" placeholder="Etiket adı girin" {...register("name")} />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="type">Etiket Türü</Label>
                <Select 
                  onValueChange={(value) => setValue("type", value)} 
                  defaultValue={watch("type")}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Etiket türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dokuma">Dokuma</SelectItem>
                    <SelectItem value="ham_kalite">Ham Kalite Kontrol</SelectItem>
                    <SelectItem value="refakat_karti">Üretim Refakat Kartı</SelectItem>
                    <SelectItem value="kalite_kontrol">Kalite Kontrol</SelectItem>
                    <SelectItem value="sevkiyat">Sevkiyat</SelectItem>
                    <SelectItem value="iplik_depo">İplik Depo</SelectItem>
                    <SelectItem value="kumas_depo">Kumaş Depo</SelectItem>
                    <SelectItem value="kartela">Kartela</SelectItem>
                    <SelectItem value="diger">Diğer</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-red-500 text-xs">{errors.type.message}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="width">Genişlik (mm)</Label>
                  <Input id="width" type="number" placeholder="100" {...register("width")} />
                  {errors.width && <p className="text-red-500 text-xs">{errors.width.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="height">Yükseklik (mm)</Label>
                  <Input id="height" type="number" placeholder="60" {...register("height")} />
                  {errors.height && <p className="text-red-500 text-xs">{errors.height.message}</p>}
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea id="description" placeholder="Etiket açıklaması girin" {...register("description")} />
                {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="isQrCode" 
                  checked={watch("isQrCode")} 
                  onCheckedChange={(checked) => setValue("isQrCode", checked)} 
                />
                <Label htmlFor="isQrCode">QR Kod Kullan</Label>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="fields">Etiket Alanları (JSON)</Label>
                <Textarea 
                  id="fields" 
                  placeholder='{ "alan1": "değer1", "alan2": "değer2" }' 
                  {...register("fields")} 
                  className="font-mono text-sm"
                />
                {errors.fields && <p className="text-red-500 text-xs">{errors.fields.message}</p>}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="departmentId">Departman</Label>
                <Select 
                  onValueChange={(value) => setValue("departmentId", parseInt(value))} 
                  defaultValue={watch("departmentId")?.toString()}
                >
                  <SelectTrigger id="departmentId">
                    <SelectValue placeholder="Departman seçin (opsiyonel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowNewLabel(false)}
              >
                İptal
              </Button>
              <Button 
                type="submit" 
                disabled={createLabelMutation.isPending}
              >
                {createLabelMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Etiket Yazdırma Modalı */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Etiket Yazdır</DialogTitle>
            <DialogDescription>
              {selectedLabel?.name} etiketinin yazdırma ayarlarını yapın.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitPrint(onSubmitPrint)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Yazdırma Adedi</Label>
                <Input 
                  id="quantity" 
                  type="number" 
                  min="1" 
                  max="100" 
                  {...registerPrint("quantity", { valueAsNumber: true })} 
                />
                {printErrors.quantity && <p className="text-red-500 text-xs">{printErrors.quantity.message}</p>}
              </div>
              
              {selectedLabel && (
                <div className="mt-2">
                  <Label className="mb-2 block">Etiket Önizleme</Label>
                  <div className="border rounded p-4 flex justify-center items-center">
                    {labelPreview ? (
                      <iframe 
                        src={labelPreview} 
                        className="w-full h-[200px]" 
                        title="Etiket Önizleme"
                      />
                    ) : (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="grid gap-2">
                <Label className="mb-2 block">Alanları Düzenle</Label>
                <div className="max-h-[200px] overflow-y-auto space-y-3 border rounded-md p-3">
                  {selectedLabel && (() => {
                    try {
                      const fields = typeof selectedLabel.fields === 'string' 
                        ? JSON.parse(selectedLabel.fields) 
                        : selectedLabel.fields;
                      
                      if (Array.isArray(fields)) {
                        return fields.map((field: string, index: number) => (
                          <div key={index} className="grid gap-2">
                            <Label htmlFor={`field-${index}`}>{field}</Label>
                            <Input 
                              id={`field-${index}`}
                              placeholder={field}
                              {...registerPrint(`data.${field}`)}
                            />
                          </div>
                        ));
                      } else if (fields && typeof fields === 'object') {
                        return Object.entries(fields).map(([key, defaultValue], index) => (
                          <div key={index} className="grid gap-2">
                            <Label htmlFor={`field-${key}`}>{key}</Label>
                            <Input 
                              id={`field-${key}`}
                              placeholder={String(defaultValue)}
                              defaultValue={String(defaultValue)}
                              {...registerPrint(`data.${key}`)}
                            />
                          </div>
                        ));
                      }
                      return <p className="text-sm text-gray-500">Düzenlenebilir alan bulunamadı</p>;
                    } catch (e) {
                      return <p className="text-sm text-red-500">Alan bilgisi alınamadı</p>;
                    }
                  })()}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowPrintDialog(false)}
              >
                İptal
              </Button>
              <Button 
                type="submit" 
                disabled={printLabelMutation.isPending}
              >
                {printLabelMutation.isPending ? "Yazdırılıyor..." : "Yazdır"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Etiket Önizleme Modalı */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Etiket Önizleme</DialogTitle>
            <DialogDescription>
              {selectedLabel?.name} etiketinin önizlemesi
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="border rounded p-4 flex justify-center items-center">
              {labelPreview ? (
                <iframe 
                  src={labelPreview} 
                  className="w-full h-[400px]" 
                  title="Etiket Önizleme"
                />
              ) : (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowPreviewDialog(false)}
            >
              Kapat
            </Button>
            <Button 
              type="button"
              onClick={() => {
                if (selectedLabel) {
                  openPrintDialog(selectedLabel);
                  setShowPreviewDialog(false);
                }
              }}
            >
              Yazdır
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default LabelManagementPage;