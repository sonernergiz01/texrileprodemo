import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, Pencil, Search, Calendar, CalendarRange, MoreHorizontal, Eye, Users2, Layers } from "lucide-react";
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
  CardFooter,
  CardHeader,
  CardTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { insertProductionPlanSchema } from "@shared/schema";

const PlanningOrdersPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [isNewPlanDialogOpen, setIsNewPlanDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Siparişleri çek
  const { data: orders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  // Üretim planlarını çek
  const { data: plans, isLoading: isPlansLoading } = useQuery({
    queryKey: ["/api/planning/production-plans"],
  });
  
  // Kumaş tiplerini çek
  const { data: fabricTypes } = useQuery({
    queryKey: ["/api/fabric-types"],
  });

  // Üretim planı formu şeması
  const planningFormSchema = insertProductionPlanSchema.extend({
    productionStartDate: z.date({
      required_error: "Üretim başlangıç tarihi gereklidir",
    }),
    productionEndDate: z.date({
      required_error: "Üretim bitiş tarihi gereklidir",
    }),
    oldStartDate: z.date().optional().default(() => new Date()),
    oldEndDate: z.date().optional().default(() => new Date()),
  });

  type PlanningFormValues = z.infer<typeof planningFormSchema>;

  // Form hook'u
  const form = useForm<PlanningFormValues>({
    resolver: zodResolver(planningFormSchema),
    defaultValues: {
      orderId: 0,
      orderNumber: "",
      description: "",
      productionStartDate: new Date(),
      productionEndDate: new Date(),
      oldStartDate: new Date(),
      oldEndDate: new Date(),
      status: "Beklemede",
      notes: "",
    },
  });

  // Plan oluşturma mutasyonu
  const createPlanMutation = useMutation({
    mutationFn: async (data: PlanningFormValues) => {
      console.log("Gönderilen veriler:", data);
      try {
        // Benzersiz bir planNo oluştur (sipariş numarası + zaman damgası)
        const timestamp = new Date().getTime().toString().slice(-6);
        const uniquePlanNo = `PP-${data.orderNumber}-${timestamp}`;
        
        const response = await apiRequest("POST", "/api/planning/production-plans", {
          ...data,
          planNo: uniquePlanNo, // Unique plan numarası oluştur
        });
        console.log("API yanıtı:", response);
        return response;
      } catch (error: any) {
        console.error("API hatası:", error);
        // Hata mesajını işle ve anlaşılır bir hata mesajı döndür
        let errorMessage = "Üretim planı oluşturulurken bir hata meydana geldi";
        
        if (error.message && error.message.includes("duplicate key")) {
          errorMessage = "Bu sipariş için zaten bir üretim planı oluşturulmuş. Lütfen farklı bir sipariş seçin veya mevcut planı güncelleyin.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Başarılı",
        description: "Üretim planı başarıyla oluşturuldu",
      });
      setIsNewPlanDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/planning/production-plans"] });
      
      // Başarılı plan oluşturma sonrası kullanıcıyı üretim adımları sayfasına yönlendir
      if (data && data.id) {
        navigate(`/planning/production-steps/${data.id}`);
      }
      
      form.reset({
        orderId: 0,
        orderNumber: "",
        description: "",
        productionStartDate: new Date(),
        productionEndDate: new Date(),
        oldStartDate: new Date(),
        oldEndDate: new Date(),
        status: "Beklemede",
        notes: "",
      });
    },
    onError: (error: any) => {
      console.error("Mutation hatası:", error);
      toast({
        title: "Üretim Planı Oluşturulamadı",
        description: error.message || "Üretim planı oluşturulurken bir hata meydana geldi. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    },
  });

  // Siparişi seçtiğimizde formu güncelle
  const handleOrderChange = (orderId: string) => {
    const selectedOrder = orders?.find(order => order.id === parseInt(orderId));
    if (selectedOrder) {
      // Siparişe ait kumaş bilgisini bul
      let fabricName = "Bilinmiyor";
      if (selectedOrder?.fabricTypeId && fabricTypes) {
        const fabricType = fabricTypes.find(ft => ft.id === selectedOrder.fabricTypeId);
        if (fabricType) {
          fabricName = fabricType.name;
        }
      }

      form.setValue("orderId", selectedOrder.id);
      form.setValue("orderNumber", selectedOrder.orderNumber);
      form.setValue("description", `${selectedOrder.customerName || 'Bilinmiyor'} | ${fabricName}`);
    }
  };

  // Form gönderme
  const onSubmit = (data: PlanningFormValues) => {
    console.log("Form gönderiliyor:", data);
    
    // Form validasyonu geçiyor mu kontrol et
    if (form.formState.isValid) {
      console.log("Form validasyonu başarılı!");
    } else {
      console.log("Form validasyon hataları:", form.formState.errors);
      
      // Hata mesajlarını göster
      if (Object.keys(form.formState.errors).length > 0) {
        toast({
          title: "Form hatası",
          description: "Lütfen formdaki hataları düzeltin ve tekrar deneyin.",
          variant: "destructive",
        });
        return; // Formu gönderme
      }
    }
    
    // Tarih kontrolü
    if (data.productionEndDate < data.productionStartDate) {
      toast({
        title: "Tarih hatası",
        description: "Bitiş tarihi başlangıç tarihinden önce olamaz.",
        variant: "destructive",
      });
      return; // Formu gönderme
    }
    
    // Form verilerini hazırla
    const formData = {
      ...data,
      // Not: planNo artık mutasyon içinde zaman damgası ile benzersiz olarak oluşturuluyor
      oldStartDate: format(data.productionStartDate, "yyyy-MM-dd"),
      oldEndDate: format(data.productionEndDate, "yyyy-MM-dd"),
      // Date nesnelerini doğrudan gönder
      productionStartDate: data.productionStartDate,
      productionEndDate: data.productionEndDate
    };
    
    console.log("Hazırlanan veri:", formData);
    
    // Mutasyonu çalıştır
    createPlanMutation.mutate(formData);
  };

  // Üretim planlarını siparişlerle ve kumaş bilgileriyle zenginleştir
  const enrichedPlans = plans?.map(plan => {
    const relatedOrder = orders?.find(order => order.orderNumber === plan.orderNumber);
    
    // Siparişe ait kumaş bilgisini bul
    let fabricName = "Bilinmiyor";
    if (relatedOrder?.fabricTypeId && fabricTypes) {
      const fabricType = fabricTypes.find(ft => ft.id === relatedOrder.fabricTypeId);
      if (fabricType) {
        fabricName = fabricType.name;
      }
    }
    
    return {
      ...plan,
      customerName: relatedOrder?.customerName || "Bilinmiyor",
      fabricName: fabricName,
      enrichedDescription: `${relatedOrder?.customerName || "Bilinmiyor"} | ${fabricName}`
    };
  });
  
  // Filtrelenmiş planlar
  const filteredPlans = enrichedPlans?.filter(plan => {
    const matchesSearch = 
      searchTerm === "" || 
      plan.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (plan.customerName && plan.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (plan.fabricName && plan.fabricName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === "all" || 
      plan.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isOrdersLoading || isPlansLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Üretim Planları" 
        description="Siparişlere ait üretim planlarını yönetin"
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Sipariş veya plan ara..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Durum filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="Beklemede">Beklemede</SelectItem>
              <SelectItem value="Devam Ediyor">Devam Ediyor</SelectItem>
              <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
              <SelectItem value="İptal Edildi">İptal Edildi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsNewPlanDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Yeni Plan Oluştur
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Üretim Planları</CardTitle>
          <CardDescription>
            Tüm üretim planlarının listesi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPlans?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Üretim planı bulunamadı. Yeni bir plan oluşturmak için "Yeni Plan Oluştur" butonunu kullanın.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sipariş No</TableHead>
                  <TableHead>Plan Açıklaması</TableHead>
                  <TableHead>Başlangıç</TableHead>
                  <TableHead>Bitiş</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans?.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>{plan.orderNumber}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{plan.description}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Users2 className="h-3 w-3 mr-1" />
                            {plan.customerName}
                          </span>
                          <span className="flex items-center">
                            <Layers className="h-3 w-3 mr-1" />
                            {plan.fabricName}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(plan.productionStartDate), "dd.MM.yyyy", { locale: tr })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(plan.productionEndDate), "dd.MM.yyyy", { locale: tr })}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            console.log(`Adımları Göster butonuna tıklandı, planId: ${plan.id}`);
                            navigate(`/planning/production-steps/${plan.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" /> Adımları Göster
                        </Button>
                        <Button 
                          variant="ghost"
                          size="sm"
                          title="Termin Bilgisini Güncelle" 
                          onClick={() => {
                            const endDate = format(new Date(plan.productionEndDate), "dd.MM.yyyy");
                            toast({
                              title: "Termin Bilgisi Güncellendi",
                              description: `${plan.orderNumber} sipariş için termin bilgisi (${endDate}) satış departmanına iletildi.`,
                            });
                          }}
                        >
                          <CalendarRange className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Yeni Plan Oluşturma Modal */}
      <Dialog open={isNewPlanDialogOpen} onOpenChange={setIsNewPlanDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Yeni Üretim Planı Oluştur</DialogTitle>
            <DialogDescription>
              Sipariş için detaylı bir üretim planı oluşturun
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="orderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sipariş</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(parseInt(value));
                        handleOrderChange(value);
                      }} 
                      defaultValue={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sipariş seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {orders?.map((order) => (
                          <SelectItem key={order.id} value={order.id.toString()}>
                            {order.orderNumber} - {order.customerName || 'Müşteri adı yok'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Plan oluşturulacak siparişi seçin
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Açıklaması</FormLabel>
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
                  name="productionStartDate"
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
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
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
                  name="productionEndDate"
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
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(form.getValues().productionStartDate)
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Üretim planı durumu seçin" />
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
                    <FormLabel>Notlar (Opsiyonel)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewPlanDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button 
                  type="button"
                  onClick={() => {
                    console.log("Planı Oluştur butonuna tıklandı");
                    console.log("Form değerleri:", form.getValues());
                    
                    // Form verilerini al
                    const data = form.getValues();
                    
                    // Manuel olarak onSubmit işlevini çağır
                    onSubmit(data);
                  }}
                  disabled={createPlanMutation.isPending}
                >
                  {createPlanMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Planı Oluştur
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanningOrdersPage;