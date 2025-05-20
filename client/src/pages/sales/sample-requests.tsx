import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, FileText, Loader2, Plus, RefreshCw, Send, Eye } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Numune talep şeması
const sampleRequestFormSchema = z.object({
  customerId: z.coerce.number({
    required_error: "Müşteri seçilmelidir",
  }),
  requestType: z.enum(["Yeni Numune", "Revizyon", "Benzer Numune"], {
    required_error: "Talep türü seçilmelidir",
  }),
  // Başlık ve açıklama alanları backend için gerekli
  title: z.string().min(5, {
    message: "Numune başlığı en az 5 karakter olmalıdır",
  }),
  description: z.string().min(5, {
    message: "Numune açıklaması en az 5 karakter olmalıdır",
  }),
  fabricTypeId: z.coerce.number().optional(),
  colorRequest: z.string().optional(),
  quantity: z.coerce.number().min(1, {
    message: "Miktar en az 1 olmalıdır",
  }),
  unit: z.string().default("metre"),
  dueDate: z.date({
    required_error: "Termin tarihi seçilmelidir",
  }),
  notes: z.string().optional(),
  referenceOrderId: z.coerce.number().optional(),
  priority: z.enum(["Düşük", "Normal", "Yüksek", "Acil"]).default("Normal"),
  attachReference: z.boolean().default(false),
  // Backend için gerekli bu alanı ekliyoruz
  requestCode: z.string().optional(),
});

type SampleRequestFormValues = z.infer<typeof sampleRequestFormSchema>;

export default function SalesSampleRequestsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();

  // Müşteri verileri
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["/api/customers"],
  });

  // Kumaş tipleri
  const { data: fabricTypes = [], isLoading: isLoadingFabricTypes } = useQuery({
    queryKey: ["/api/master/fabrics"],
  });

  // Sipariş verileri (referans olarak seçilebilecek)
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["/api/orders"],
  });

  // Numune talepleri
  const { data: sampleRequests = [], isLoading: isLoadingSampleRequests } = useQuery({
    queryKey: ["/api/sample/requests"],
    refetchInterval: 10000, // 10 saniyede bir yenile
  });

  // Form tanımı
  const form = useForm<SampleRequestFormValues>({
    resolver: zodResolver(sampleRequestFormSchema),
    defaultValues: {
      requestType: "Yeni Numune",
      unit: "metre",
      priority: "Normal",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 hafta sonra
      attachReference: false,
      title: "",
      description: "",
    },
  });

  // Numune talebi oluşturma
  const createSampleRequestMutation = useMutation({
    mutationFn: async (data: SampleRequestFormValues) => {
      // Tarih verisi için yeni bir Date nesnesi oluştur
      // (string yerine doğrudan Date nesnesini göndermek için)
      const requestData = {
        ...data,
        // dueDate artık string'e dönüştürülmüyor, Date nesnesi olarak kalıyor
        sourceType: "sales", // Satış departmanından gelen talep olduğunu belirt
        status: "Beklemede",
        requestCode: `NR-${format(new Date(), "yyyyMM")}-${Math.floor(Math.random() * 9000) + 1000}`,
        requesterId: 1, // Authenticated user ID
      };
      
      const response = await apiRequest("POST", "/api/sample/requests", requestData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Numune talebi oluşturuldu",
        description: "Numune talebi başarıyla oluşturuldu ve ilgili departmana iletildi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sample/requests"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Numune talebi oluşturulurken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form gönderimi
  const onSubmit = (data: SampleRequestFormValues) => {
    createSampleRequestMutation.mutate(data);
  };

  // Numune iptal etme
  const cancelSampleRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest("PUT", `/api/sample/requests/${requestId}/cancel`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Numune talebi iptal edildi",
        description: "Numune talebi başarıyla iptal edildi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sample/requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Numune talebi iptal edilirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Numune durumuna göre filtreleme
  const filteredRequests = sampleRequests
    .filter((request: any) => {
      // Status'a göre filtrele
      if (activeTab === "all") return true;
      if (activeTab === "pending" && ["pending", "processing", "Beklemede", "İşlemde"].includes(request.status)) return true;
      if (activeTab === "completed" && ["completed", "Tamamlandı"].includes(request.status)) return true;
      if (activeTab === "cancelled" && ["cancelled", "İptal Edildi"].includes(request.status)) return true;
      return false;
    })
    .filter((request: any) => {
      // Arama sorgusuna göre filtrele
      if (!searchQuery) return true;
      
      const customerName = customers.find(
        (c: any) => c.id === request.customerId
      )?.name || "";
      
      const fabricName = fabricTypes.find(
        (f: any) => f.id === request.fabricTypeId
      )?.name || "";
      
      return (
        customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fabricName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.sampleDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

  // Numune durumuna göre badge rengi
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
      case "Beklemede":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Beklemede</Badge>;
      case "processing":
      case "İşlemde":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">İşlemde</Badge>;
      case "completed":
      case "Tamamlandı":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Tamamlandı</Badge>;
      case "cancelled":
      case "İptal Edildi":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">İptal Edildi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Öncelik seviyesine göre badge rengi
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Yüksek":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Yüksek</Badge>;
      case "Normal":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Normal</Badge>;
      case "Düşük":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Düşük</Badge>;
      case "Acil":
        return <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">Acil</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <PageHeader 
        title="Numune Talepleri" 
        description="Müşteriler için numune taleplerini yönetin ve takip edin"
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Plus size={16} /> Yeni Numune Talebi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Yeni Numune Talebi Oluştur</DialogTitle>
              <DialogDescription>
                Müşteri için numune talebi oluşturun. Bu talep, numune departmanına yönlendirilecektir.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Müşteri Seçimi */}
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Müşteri</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Müşteri seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingCustomers ? (
                              <div className="flex items-center justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Yükleniyor...
                              </div>
                            ) : (
                              customers.map((customer: any) => (
                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                  {customer.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Talep Türü */}
                  <FormField
                    control={form.control}
                    name="requestType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Talep Türü</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Talep türü seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Yeni Numune">Yeni Numune</SelectItem>
                            <SelectItem value="Revizyon">Revizyon</SelectItem>
                            <SelectItem value="Benzer Numune">Benzer Numune</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Numune Başlığı */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numune Başlığı</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Numunenin kısa başlığını girin"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Numune Açıklaması */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numune Açıklaması</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Numunenin detaylı açıklamasını girin"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Kumaş Tipi */}
                  <FormField
                    control={form.control}
                    name="fabricTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kumaş Tipi</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Kumaş tipi seçin (opsiyonel)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingFabricTypes ? (
                              <div className="flex items-center justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Yükleniyor...
                              </div>
                            ) : (
                              fabricTypes.map((fabric: any) => (
                                <SelectItem key={fabric.id} value={fabric.id.toString()}>
                                  {fabric.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Renk Talebi */}
                  <FormField
                    control={form.control}
                    name="colorRequest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Renk Talebi</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Talep edilen renk (opsiyonel)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Miktar */}
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Miktar</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Numune miktarı"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Birim */}
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birim</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Birim seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="metre">Metre</SelectItem>
                            <SelectItem value="adet">Adet</SelectItem>
                            <SelectItem value="kg">Kilogram</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Öncelik */}
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Öncelik</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Öncelik seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Düşük">Düşük</SelectItem>
                            <SelectItem value="Normal">Normal</SelectItem>
                            <SelectItem value="Yüksek">Yüksek</SelectItem>
                            <SelectItem value="Acil">Acil</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Termin Tarihi */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Termin Tarihi</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: tr })
                              ) : (
                                <span>Tarih seçin</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Referans Sipariş */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="attachReference"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Referans Sipariş Ekle</FormLabel>
                          <FormDescription>
                            Mevcut bir siparişi referans olarak ekle
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("attachReference") && (
                    <FormField
                      control={form.control}
                      name="referenceOrderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Referans Sipariş</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sipariş seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingOrders ? (
                                <div className="flex items-center justify-center p-2">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Yükleniyor...
                                </div>
                              ) : (
                                orders.map((order: any) => (
                                  <SelectItem key={order.id} value={order.id.toString()}>
                                    {order.orderNumber} - {order.customerName}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                {/* Notlar */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notlar</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ek notlar ve talimatlar"
                          className="resize-none"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createSampleRequestMutation.isPending}
                    className="gap-1"
                  >
                    {createSampleRequestMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Oluşturuluyor...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Numune Talebi Oluştur
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="my-6">
        <div className="flex justify-between items-center mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="pending">Bekleyen</TabsTrigger>
              <TabsTrigger value="completed">Tamamlanan</TabsTrigger>
              <TabsTrigger value="cancelled">İptal</TabsTrigger>
              <TabsTrigger value="all">Tümü</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2">
            <Input
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[300px]"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/sample/requests"] })}
              title="Yenile"
            >
              <RefreshCw size={16} />
            </Button>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Talep No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Kumaş Tipi</TableHead>
                  <TableHead className="text-center">Miktar</TableHead>
                  <TableHead className="text-center">Termin</TableHead>
                  <TableHead className="text-center">Öncelik</TableHead>
                  <TableHead className="text-center">Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingSampleRequests ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Numune talepleri yükleniyor...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      {searchQuery ? (
                        <div className="text-center text-muted-foreground">
                          Arama kriterlerine uygun numune talebi bulunamadı.
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          Bu kategoride numune talebi bulunmamaktadır.
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request: any) => {
                    const customer = customers.find((c: any) => c.id === request.customerId);
                    const fabricType = fabricTypes.find((f: any) => f.id === request.fabricTypeId);
                    
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          #{request.requestNumber || request.id}
                        </TableCell>
                        <TableCell>{customer?.name || "—"}</TableCell>
                        <TableCell>
                          <div className="max-w-[250px] truncate" title={request.sampleDescription}>
                            {request.sampleDescription}
                          </div>
                        </TableCell>
                        <TableCell>{fabricType?.name || "—"}</TableCell>
                        <TableCell className="text-center">
                          {request.quantity} {request.unit}
                        </TableCell>
                        <TableCell className="text-center">
                          {request.dueDate ? (
                            <span title={new Date(request.dueDate).toLocaleDateString("tr-TR")}>
                              {new Date(request.dueDate).toLocaleDateString("tr-TR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {getPriorityBadge(request.priority)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/samples/tracking/${request.id}`)}
                              title="Detayları Görüntüle"
                            >
                              <Eye size={16} />
                            </Button>
                            
                            {request.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (window.confirm("Bu numune talebini iptal etmek istediğinize emin misiniz?")) {
                                    cancelSampleRequestMutation.mutate(request.id);
                                  }
                                }}
                                disabled={cancelSampleRequestMutation.isPending}
                                className="text-red-500 hover:text-red-700"
                                title="İptal Et"
                              >
                                {cancelSampleRequestMutation.isPending ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <span className="i-lucide-x" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}