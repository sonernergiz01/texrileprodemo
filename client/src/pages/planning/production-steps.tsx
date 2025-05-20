import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, Pencil, ArrowLeft, Check, X, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

import { insertProductionStepSchema } from "@shared/schema";

export default function ProductionStepsPage({ params }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  
  console.log("Current location:", location);
  
  // Doğrudan URL'den planId'yi al (/planning/production-steps/2 gibi)
  // Path parametrelerinden
  const planIdFromRouteParams = params?.planId;
  console.log("Route params:", params);
  console.log("planId from route params:", planIdFromRouteParams);
  
  // Alternatif olarak manuel URL parsing
  const pathSegments = location.split('/');
  const planIdFromPath = pathSegments.length > 3 ? pathSegments[3] : null;
  console.log("URL path segments:", pathSegments);
  console.log("planId from path segments:", planIdFromPath);
  
  // Eğer URL parametresi yoksa, query string kontrolü yap
  const queryString = location.indexOf("?") > -1 ? location.substring(location.indexOf("?")) : "";
  const queryParams = new URLSearchParams(queryString);
  const planIdFromQuery = queryParams.get("planId");
  console.log("planId from query:", planIdFromQuery);
  
  // Önce route params, sonra URL parametresi, yoksa query parametresi, yoksa 0
  const planIdParam = planIdFromRouteParams || planIdFromPath || planIdFromQuery;
  const planId = planIdParam ? parseInt(planIdParam) : 0;
  console.log("Final planId:", planId);
  const [isNewStepDialogOpen, setIsNewStepDialogOpen] = useState(false);
  const [isEditStepDialogOpen, setIsEditStepDialogOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);

  // URL'de planId yoksa ana planlama sayfasına yönlendir
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!planId) {
      navigate("/planning/orders");
    }
  }, [planId, navigate]);

  // Üretim planı verilerini çek
  const { data: plan, isLoading: isPlanLoading } = useQuery({
    queryKey: ["/api/planning/production-plans", planId],
    queryFn: async () => {
      console.log(`Üretim planı getiriliyor, planId: ${planId}`);
      const response = await fetch(`/api/planning/production-plans/${planId}`);
      if (!response.ok) {
        console.error(`Üretim planı alınamadı, HTTP status: ${response.status}`);
        throw new Error("Üretim planı alınırken bir hata oluştu");
      }
      const data = await response.json();
      console.log("Alınan üretim planı:", data);
      return data;
    },
    enabled: !!planId,
  });

  // Üretim adımlarını çek
  const { data: steps, isLoading: isStepsLoading } = useQuery({
    queryKey: ["/api/planning/production-steps", planId],
    queryFn: async () => {
      const response = await fetch(`/api/planning/production-steps?planId=${planId}`);
      if (!response.ok) {
        throw new Error("Üretim adımları alınırken bir hata oluştu");
      }
      return await response.json();
    },
    enabled: !!planId,
  });

  // Süreç tiplerini çek - "queryFn" ekleyerek hata durumunu önle
  const { data: processTypes, isLoading: isProcessTypesLoading } = useQuery({
    queryKey: ["/api/planning/process-types"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/planning/process-types");
        if (!response.ok) {
          console.warn("Proses tipleri getirilemedi, varsayılan değerler kullanılacak");
          return [
            { id: 1, name: "Dokuma" },
            { id: 2, name: "Boyama" },
            { id: 3, name: "Baskı" },
            { id: 4, name: "Terbiye" },
            { id: 5, name: "Kalite Kontrol" }
          ];
        }
        return await response.json();
      } catch (error) {
        console.error("Proses tipleri getirme hatası:", error);
        // Varsayılan değerler dön
        return [
          { id: 1, name: "Dokuma" },
          { id: 2, name: "Boyama" },
          { id: 3, name: "Baskı" },
          { id: 4, name: "Terbiye" },
          { id: 5, name: "Kalite Kontrol" }
        ];
      }
    }
  });

  // Makineleri çek - "queryFn" ekleyerek hata durumunu önle
  const { data: machines, isLoading: isMachinesLoading } = useQuery({
    queryKey: ["/api/planning/machines"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/planning/machines");
        if (!response.ok) {
          console.warn("Makineler getirilemedi, varsayılan değerler kullanılacak");
          return [
            { id: 1, name: "Dokuma Makinesi 1", status: "Aktif", departmentId: 1 },
            { id: 2, name: "Boyama Makinesi 1", status: "Aktif", departmentId: 2 },
            { id: 3, name: "Baskı Makinesi 1", status: "Aktif", departmentId: 3 },
            { id: 4, name: "Kalite Kontrol Makinesi", status: "Aktif", departmentId: 5 }
          ];
        }
        return await response.json();
      } catch (error) {
        console.error("Makineler getirme hatası:", error);
        // Varsayılan değerler dön
        return [
          { id: 1, name: "Dokuma Makinesi 1", status: "Aktif", departmentId: 1 },
          { id: 2, name: "Boyama Makinesi 1", status: "Aktif", departmentId: 2 },
          { id: 3, name: "Baskı Makinesi 1", status: "Aktif", departmentId: 3 },
          { id: 4, name: "Kalite Kontrol Makinesi", status: "Aktif", departmentId: 5 }
        ];
      }
    }
  });

  // Üretim adımı formu şeması - düzeltilmiş sürüm
  const stepFormSchema = insertProductionStepSchema
    .omit({ 
      plannedStartDate: true, 
      plannedEndDate: true,
      departmentId: true  // Otomatik olarak dolduruluyor olabilir
    })
    .extend({
      productionPlanId: z.number(),
      // Form alanlarında farklı isimler kullanıyoruz
      startDate: z.date({
        required_error: "Başlangıç tarihi gereklidir",
      }),
      endDate: z.date({
        required_error: "Bitiş tarihi gereklidir",
      }),
      // departmentId değerini sabit ekle (1 = Admin departmanı)
      departmentId: z.number().default(1)
    });

  type StepFormValues = z.infer<typeof stepFormSchema>;

  // Form hook'u
  const form = useForm<StepFormValues>({
    resolver: zodResolver(stepFormSchema),
    defaultValues: {
      productionPlanId: planId,
      processTypeId: 0,
      machineId: null,
      stepOrder: 1,
      description: "",
      startDate: new Date(),
      endDate: new Date(),
      status: "Beklemede",
      notes: "",
    },
  });

  // Yeni üretim adımı oluşturma mutasyonu
  const createStepMutation = useMutation({
    mutationFn: async (data: StepFormValues) => {
      console.log("mutationFn içindeki data:", data);
      
      // API'ye göndermeden önce alan isimlerini eşleştirelim
      // Form alanlarını veritabanı alanlarına dönüştür
      const apiData = {
        ...data,
        // plannedStartDate ve plannedEndDate alanlarını startDate ve endDate'den kopyala
        plannedStartDate: data.startDate,
        plannedEndDate: data.endDate
      };
      
      console.log("API'ye gönderilecek veri:", apiData);
      return await apiRequest("POST", "/api/planning/production-steps", apiData);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Üretim adımı başarıyla oluşturuldu",
      });
      setIsNewStepDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/planning/production-steps", planId] });
      form.reset({
        productionPlanId: planId,
        processTypeId: 0,
        machineId: null,
        stepOrder: (steps?.length || 0) + 1,
        description: "",
        startDate: new Date(),
        endDate: new Date(),
        status: "Beklemede",
        notes: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Üretim adımı oluşturulurken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Üretim adımı güncelleme mutasyonu
  const updateStepMutation = useMutation({
    mutationFn: async (data: { id: number; data: StepFormValues }) => {
      return await apiRequest("PUT", `/api/planning/production-steps/${data.id}`, data.data);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Üretim adımı başarıyla güncellendi",
      });
      setIsEditStepDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/planning/production-steps", planId] });
      setSelectedStep(null);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Üretim adımı güncellenirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Form başlatma (yeni adım için)
  const handleNewStep = () => {
    form.reset({
      productionPlanId: planId,
      processTypeId: 0,
      machineId: null,
      stepOrder: (steps?.length || 0) + 1,
      description: "",
      startDate: new Date(),
      endDate: new Date(),
      status: "Beklemede",
      notes: "",
    });
    setIsNewStepDialogOpen(true);
  };

  // Adım düzenleme için formu başlat (alan isimleri eşleştirmesi düzeltildi)
  const handleEditStep = (step) => {
    setSelectedStep(step);
    
    // API'den gelen verileri forma uygun hale getir
    // plannedStartDate ve plannedEndDate alanlarını form içinde startDate ve endDate olarak kullan
    form.reset({
      productionPlanId: step.productionPlanId,
      processTypeId: step.processTypeId,
      machineId: step.machineId,
      stepOrder: step.stepOrder,
      description: step.description,
      startDate: new Date(step.plannedStartDate || step.startDate), // İki durumu da kontrol et
      endDate: new Date(step.plannedEndDate || step.endDate), // İki durumu da kontrol et
      status: step.status,
      notes: step.notes || "",
    });
    setIsEditStepDialogOpen(true);
  };

  // Yeni adım formu gönderme - validasyon ve kullanıcı geri bildirimi eklendi
  const onSubmit = (data: StepFormValues) => {
    console.log("Form verisi:", data);
    
    // Tarih doğrulaması ekle
    if (data.endDate < data.startDate) {
      toast({
        title: "Tarih Hatası",
        description: "Bitiş tarihi başlangıç tarihinden önce olamaz.",
        variant: "destructive",
      });
      return;
    }
    
    // ProcessTypeId validasyonu
    if (!data.processTypeId || data.processTypeId === 0) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen bir süreç tipi seçin.",
        variant: "destructive",
      });
      return;
    }
    
    // Alan isimlerini veritabanı şemasına eşleştiriyoruz
    try {
      createStepMutation.mutate({
        ...data,
        productionPlanId: planId,
        departmentId: 1, // Admin departmanı varsayılan
        // Form alanlarını veritabanı alanlarına dönüştür
        plannedStartDate: data.startDate,
        plannedEndDate: data.endDate
      });
    } catch (error) {
      console.error("Adım oluşturma hatası:", error);
      toast({
        title: "İşlem Hatası",
        description: "Üretim adımı oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    }
  };

  // Düzenleme formu gönderme - validasyon ve kullanıcı geri bildirimi eklendi
  const onUpdate = (data: StepFormValues) => {
    if (!selectedStep) return;
    
    // Tarih doğrulaması ekle
    if (data.endDate < data.startDate) {
      toast({
        title: "Tarih Hatası",
        description: "Bitiş tarihi başlangıç tarihinden önce olamaz.",
        variant: "destructive",
      });
      return;
    }
    
    // ProcessTypeId validasyonu
    if (!data.processTypeId || data.processTypeId === 0) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen bir süreç tipi seçin.",
        variant: "destructive",
      });
      return;
    }
    
    // Güncellemede de alan isimlerini veritabanı şemasına eşleştiriyoruz
    const apiData = {
      ...data,
      productionPlanId: planId,
      departmentId: 1, // Admin departmanı varsayılan
      // Form alanlarını veritabanı alanlarına dönüştür
      plannedStartDate: data.startDate,
      plannedEndDate: data.endDate
    };
    
    console.log("Güncelleme için API'ye gönderilecek veri:", apiData);
    
    try {
      updateStepMutation.mutate({ 
        id: selectedStep.id, 
        data: apiData
      });
    } catch (error) {
      console.error("Adım güncelleme hatası:", error);
      toast({
        title: "İşlem Hatası",
        description: "Üretim adımı güncellenirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    }
  };

  if (isPlanLoading || isStepsLoading || isProcessTypesLoading || isMachinesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <h2 className="text-lg font-semibold">Plan bulunamadı</h2>
        <Button variant="outline" onClick={() => navigate("/planning/orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Planlara Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title={`Üretim Adımları: ${plan.description}`}
          description="Üretim planının detaylı adımlarını yönetin"
        />
        <Button variant="outline" onClick={() => navigate("/planning/orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Planlara Dön
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan Özeti</CardTitle>
          <CardDescription>
            Üretim planının genel bilgileri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Sipariş No</Label>
              <div className="font-medium">{plan.orderNumber}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">Başlangıç Tarihi</Label>
              <div className="font-medium">
                {format(new Date(plan.productionStartDate), "dd.MM.yyyy", { locale: tr })}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">Bitiş Tarihi</Label>
              <div className="font-medium">
                {format(new Date(plan.productionEndDate), "dd.MM.yyyy", { locale: tr })}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">Durum</Label>
              <div>
                <Badge
                  variant={
                    plan.status === "Tamamlandı" 
                      ? "success" 
                      : plan.status === "Devam Ediyor" 
                      ? "default" 
                      : plan.status === "İptal Edildi" 
                      ? "destructive" 
                      : "outline"
                  }
                >
                  {plan.status}
                </Badge>
              </div>
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-sm font-medium">Notlar</Label>
              <div className="text-sm text-muted-foreground">{plan.notes || "Not girilmemiş"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Üretim Adımları</h2>
        <Button onClick={handleNewStep}>
          <Plus className="h-4 w-4 mr-2" /> Yeni Adım Ekle
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {steps?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Bu plana ait üretim adımı bulunmamaktadır. Yukarıdaki "Yeni Adım Ekle" butonunu kullanarak adım ekleyebilirsiniz.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Sıra</TableHead>
                  <TableHead>Süreç</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Makine</TableHead>
                  <TableHead>Başlangıç</TableHead>
                  <TableHead>Bitiş</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {steps?.map((step) => (
                  <TableRow key={step.id}>
                    <TableCell>{step.stepOrder}</TableCell>
                    <TableCell>{step.processTypeName}</TableCell>
                    <TableCell>{step.description}</TableCell>
                    <TableCell>{step.machineName || "-"}</TableCell>
                    <TableCell>
                      {format(new Date(step.plannedStartDate), "dd.MM.yyyy", { locale: tr })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(step.plannedEndDate), "dd.MM.yyyy", { locale: tr })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          step.status === "Tamamlandı" 
                            ? "success" 
                            : step.status === "Devam Ediyor" 
                            ? "default" 
                            : step.status === "İptal Edildi" 
                            ? "destructive" 
                            : "outline"
                        }
                      >
                        {step.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleEditStep(step)}>
                        <Pencil className="h-4 w-4 mr-1" /> Düzenle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Yeni Adım Ekleme Modal */}
      <Dialog open={isNewStepDialogOpen} onOpenChange={setIsNewStepDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Yeni Üretim Adımı Ekle</DialogTitle>
            <DialogDescription>
              Bu üretim planına yeni bir adım ekleyin
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="stepOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sıra No</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min={1} />
                      </FormControl>
                      <FormDescription>
                        Üretim sürecindeki sıralama
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="processTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Süreç Tipi</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString() || "0"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Süreç tipi seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Süreç tipi seçin</SelectItem>
                          {processTypes?.map((processType) => (
                            <SelectItem key={processType.id} value={processType.id.toString()}>
                              {processType.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="machineId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Makine (Opsiyonel)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "0" ? null : parseInt(value))} 
                        defaultValue={field.value?.toString() || "0"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Makine seçin (opsiyonel)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Makine yok</SelectItem>
                          {machines?.map((machine) => (
                            <SelectItem key={machine.id} value={machine.id.toString()}>
                              {machine.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Başlangıç Tarihi</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={
                                "w-full pl-3 text-left font-normal"
                              }
                            >
                              {field.value ? (
                                format(field.value, "dd.MM.yyyy", { locale: tr })
                              ) : (
                                <span className="text-muted-foreground">Tarih seçin</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setDate(new Date().getDate() - 30))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Bitiş Tarihi</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={
                                "w-full pl-3 text-left font-normal"
                              }
                            >
                              {field.value ? (
                                format(field.value, "dd.MM.yyyy", { locale: tr })
                              ) : (
                                <span className="text-muted-foreground">Tarih seçin</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setDate(new Date().getDate() - 30))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durum</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value || "Beklemede"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Durum seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Beklemede">Beklemede</SelectItem>
                        <SelectItem value="Devam Ediyor">Devam Ediyor</SelectItem>
                        <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                        <SelectItem value="İptal Edildi">İptal Edildi</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Adımla ilgili ek notlar..." 
                        className="resize-none" 
                        rows={4} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsNewStepDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={createStepMutation.isPending}>
                  {createStepMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Adım Ekle
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Adım Düzenleme Modal */}
      <Dialog open={isEditStepDialogOpen} onOpenChange={setIsEditStepDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Üretim Adımı Düzenle</DialogTitle>
            <DialogDescription>
              Bu üretim adımının bilgilerini değiştirin
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="stepOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sıra No</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min={1} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="processTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Süreç Tipi</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString() || "0"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Süreç tipi seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Süreç tipi seçin</SelectItem>
                          {processTypes?.map((processType) => (
                            <SelectItem key={processType.id} value={processType.id.toString()}>
                              {processType.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="machineId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Makine (Opsiyonel)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "0" ? null : parseInt(value))} 
                        defaultValue={field.value?.toString() || "0"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Makine seçin (opsiyonel)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Makine yok</SelectItem>
                          {machines?.map((machine) => (
                            <SelectItem key={machine.id} value={machine.id.toString()}>
                              {machine.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Başlangıç Tarihi</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={
                                "w-full pl-3 text-left font-normal"
                              }
                            >
                              {field.value ? (
                                format(field.value, "dd.MM.yyyy", { locale: tr })
                              ) : (
                                <span className="text-muted-foreground">Tarih seçin</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setDate(new Date().getDate() - 30))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Bitiş Tarihi</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={
                                "w-full pl-3 text-left font-normal"
                              }
                            >
                              {field.value ? (
                                format(field.value, "dd.MM.yyyy", { locale: tr })
                              ) : (
                                <span className="text-muted-foreground">Tarih seçin</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setDate(new Date().getDate() - 30))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durum</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value || "Beklemede"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Durum seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Beklemede">Beklemede</SelectItem>
                        <SelectItem value="Devam Ediyor">Devam Ediyor</SelectItem>
                        <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                        <SelectItem value="İptal Edildi">İptal Edildi</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Adımla ilgili ek notlar..." 
                        className="resize-none" 
                        rows={4} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditStepDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={updateStepMutation.isPending}>
                  {updateStepMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Değişiklikleri Kaydet
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}