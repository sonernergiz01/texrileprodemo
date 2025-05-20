import { useState, useEffect } from "react";
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { BarChart, CalendarIcon, FileText, Loader2, Plus, Printer, Save, Trash } from "lucide-react";
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const orderSchema = z.object({
  orderNumber: z.string().min(1, "Sipariş numarası gereklidir"),
  customerId: z.coerce.number().min(1, "Müşteri seçilmelidir"),
  fabricTypeId: z.coerce.number().nullable().optional(),
  quantity: z.coerce.number().min(1, "Miktar girilmelidir"), // string -> number
  // Birşey gönderilmese bile "0" değeri verilecek
  unitPrice: z.coerce.number().default(0), // string -> number
  unit: z.string().default("metre"),
  orderDate: z.date(),
  dueDate: z.date(),
  statusId: z.coerce.number().default(1), // Default değer: Beklemede (1)
  notes: z.string().nullable().optional(),
  
  // Yeni alanlar
  orderType: z.enum(["direct", "block", "block_color"]).default("direct"),
  marketType: z.enum(["iç", "dış"]).default("iç"),
  variant: z.string().nullable().optional(),
  feel: z.string().nullable().optional(),
  width: z.coerce.number().nullable().optional(), // string -> number
  weight: z.coerce.number().nullable().optional(), // string -> number
  blend: z.string().nullable().optional(),
  groupName: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  pattern: z.string().nullable().optional(),
  parentOrderId: z.coerce.number().nullable().optional(),
  
  // Diğer sipariş detayları
  articleNo: z.string().nullable().optional(),
  fabricQualityId: z.coerce.number().nullable().optional(),
  qualityStandard: z.string().nullable().optional(),
  deliveryTerms: z.string().nullable().optional(),
  paymentTerms: z.string().nullable().optional(),
  documentNo: z.string().nullable().optional(),
  firmaPoNo: z.string().nullable().optional(),
  isUrgent: z.boolean().default(false),
});

type OrderFormValues = z.infer<typeof orderSchema>;

export default function OrderPage() {
  const [activeTab, setActiveTab] = useState("new-order");
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [selectedOrderType, setSelectedOrderType] = useState("direct");
  const [_, navigate] = useLocation();
  // Arama filtreleri için state'ler
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  
  // Sipariş kalemi ekleme için state'ler
  const [itemDescription, setItemDescription] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemUnit, setItemUnit] = useState("metre");
  const [itemNotes, setItemNotes] = useState("");

  // Verileri getir
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ['/api/customers'],
  });

  const { data: fabricTypes = [] } = useQuery<any[]>({
    queryKey: ['/api/master/fabrics'],
  });

  const { data: fabricQualities = [] } = useQuery<any[]>({
    queryKey: ['/api/master/fabricqualities'],
    enabled: false, // Bu uç nokta henüz mevcut olmayabilir, gerekirse etkinleştirin
  });

  const { data: orderStatuses = [] } = useQuery<any[]>({
    queryKey: ['/api/order-statuses'],
  });

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ['/api/orders'],
  });
  
  // Siparişleri filtrele
  const filteredOrders = orders.filter(order => {
    const customerMatch = order.customerName?.toLowerCase().includes(searchCustomer.toLowerCase()) || !searchCustomer;
    
    // Ürün adı için fabric bilgisinden al
    const fabricName = fabricTypes.find(f => f.id === order.fabricTypeId)?.name || "";
    const productMatch = fabricName.toLowerCase().includes(searchProduct.toLowerCase()) || !searchProduct;
    
    return customerMatch && productMatch;
  });

  // Form tanımı
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      orderNumber: `SIP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      orderDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün sonra
      unit: "metre",
      orderType: "direct",
      marketType: "iç",
      isUrgent: false,
      unitPrice: 0, // String yerine number tipinde 0 değeri
      quantity: undefined, // Başlangıç değeri olarak undefined (kullanıcı giriş yapacak)
    },
  });
  
  // Sipariş türü değiştiğinde formu güncelle
  const handleOrderTypeChange = (value: string) => {
    setSelectedOrderType(value);
    form.setValue("orderType", value as "direct" | "block" | "block_color");
    
    // Eğer block_color (alt sipariş) seçildiyse parent sipariş seçimini aktif et
    if (value === "block_color") {
      // Parent order ID formunu göster
    } else {
      form.setValue("parentOrderId", undefined);
    }
  };

  // Sipariş gönderme
  const orderMutation = useMutation({
    mutationFn: async (values: OrderFormValues) => {
      const res = await apiRequest('POST', '/api/orders', values);
      return res.json();
    },
    onSuccess: (data) => {
      // Otomatik planlama bilgisi varsa detaylı mesaj göster
      if (data.productionPlan) {
        toast({
          title: "Sipariş kaydedildi",
          description: `Sipariş başarıyla kaydedildi ve otomatik olarak planlamaya alındı. Üretim Plan No: ${data.productionPlan.planNo}`,
        });
      } else if (data.warning) {
        // Sipariş oluşturuldu ama planlama yapılamadı
        toast({
          title: "Sipariş kaydedildi",
          description: data.warning,
          variant: "destructive",
        });
      } else {
        // Standart başarı mesajı
        toast({
          title: "Sipariş kaydedildi",
          description: "Sipariş başarıyla kaydedildi.",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/planning/production-plans'] });
      
      form.reset();
      setOrderItems([]);
      setActiveTab("orders");
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Sipariş kaydedilirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (values: OrderFormValues) => {
    // Verileri formatlayalım
    const finalData = { 
      ...values,
      statusId: 1, // Beklemede
      // Sayı tipleri için dönüşümü zod şeması zaten yapıyor
      // Bu sayede quantity, unitPrice, width, weight gibi alanlar doğru tipte gönderilecek
    };
    
    // Debug için console.log ile gönderilen verileri görüntüle
    console.log("Gönderilen sipariş verileri:", finalData);
    
    try {
      orderMutation.mutate(finalData);
    } catch (error) {
      console.error("Sipariş oluşturma hatası:", error);
      toast({
        title: "Hata",
        description: "Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sipariş Yönetimi</h1>
      </div>

      <Tabs defaultValue="new-order" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="new-order">Yeni Sipariş</TabsTrigger>
          <TabsTrigger value="orders">Siparişler</TabsTrigger>
        </TabsList>

        <TabsContent value="new-order">
          <Card className="border-t-4 border-indigo-600 shadow-md">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-xl font-bold text-indigo-700">Sipariş Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Ana bilgiler - 4 kolonlu yatay düzen */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Temel bilgiler */}
                  <div>
                    <Label htmlFor="orderNumber" className="text-sm font-semibold text-gray-700">Sipariş No</Label>
                    <Input 
                      id="orderNumber"
                      className="mt-1 border-2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      {...form.register("orderNumber")} 
                      disabled
                    />
                    {form.formState.errors.orderNumber && (
                      <p className="mt-1 text-sm text-red-500">{form.formState.errors.orderNumber.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="customerId" className="text-sm font-semibold text-gray-700">Müşteri</Label>
                    <Select 
                      onValueChange={(value) => form.setValue("customerId", parseInt(value))}
                      defaultValue={form.getValues("customerId")?.toString()}
                    >
                      <SelectTrigger className="mt-1 border-2 border-gray-300 focus:border-indigo-500">
                        <SelectValue placeholder="Müşteri Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.customerId && (
                      <p className="mt-1 text-sm text-red-500">{form.formState.errors.customerId.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="orderType" className="text-sm font-semibold text-gray-700">Sipariş Türü</Label>
                    <Select 
                      onValueChange={handleOrderTypeChange}
                      defaultValue={selectedOrderType}
                    >
                      <SelectTrigger className="mt-1 border-2 border-gray-300 focus:border-indigo-500">
                        <SelectValue placeholder="Sipariş Türü" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct">Doğrudan Sipariş</SelectItem>
                        <SelectItem value="block">Blok Sipariş</SelectItem>
                        <SelectItem value="block_color">Alt Sipariş (Renk)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="marketType" className="text-sm font-semibold text-gray-700">Piyasa Türü</Label>
                    <Select 
                      onValueChange={(value) => form.setValue("marketType", value as "iç" | "dış")}
                      defaultValue={form.getValues("marketType")}
                    >
                      <SelectTrigger className="mt-1 border-2 border-gray-300 focus:border-indigo-500">
                        <SelectValue placeholder="Piyasa Türü" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iç">İç Piyasa</SelectItem>
                        <SelectItem value="dış">Dış Piyasa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Tarihler ve üst bilgiler - 4 kolonlu yatay düzen */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-t border-gray-200 pt-6">
                  <div>
                    <Label htmlFor="orderDate" className="text-sm font-semibold text-gray-700">Sipariş Tarihi</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="mt-1 w-full justify-start text-left font-normal border-2 border-gray-300 hover:bg-gray-50"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-indigo-600" />
                          {form.getValues("orderDate") ? (
                            format(form.getValues("orderDate"), "dd.MM.yyyy", { locale: tr })
                          ) : (
                            <span>Tarih Seçin</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.getValues("orderDate")}
                          onSelect={(date) => form.setValue("orderDate", date || new Date())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <Label htmlFor="dueDate" className="text-sm font-semibold text-gray-700">Termin Tarihi</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="mt-1 w-full justify-start text-left font-normal border-2 border-gray-300 hover:bg-gray-50"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-indigo-600" />
                          {form.getValues("dueDate") ? (
                            format(form.getValues("dueDate"), "dd.MM.yyyy", { locale: tr })
                          ) : (
                            <span>Tarih Seçin</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.getValues("dueDate")}
                          onSelect={(date) => form.setValue("dueDate", date || new Date())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <Label htmlFor="fabricTypeId" className="text-sm font-semibold text-gray-700">Ürün Adı</Label>
                    <Select 
                      onValueChange={(value) => {
                        const fabricId = parseInt(value);
                        form.setValue("fabricTypeId", fabricId);
                        
                        // Önce mevcut değerleri temizle
                        form.setValue("width", null);
                        form.setValue("weight", null);
                        form.setValue("color", "");
                        form.setValue("pattern", "");
                        form.setValue("feel", "");
                        form.setValue("blend", "");
                        form.setValue("variant", "");
                        form.setValue("groupName", "");
                        
                        // Seçilen kumaş tipinin özelliklerini otomatik olarak doldur
                        const selectedFabric = fabricTypes.find((f: any) => f.id === fabricId);
                        if (selectedFabric && selectedFabric.properties) {
                          // En bilgisini doldur
                          if (selectedFabric.properties.en) {
                            form.setValue("width", Number(selectedFabric.properties.en));
                          }
                          
                          // Gramaj bilgisini doldur
                          if (selectedFabric.properties.gramaj) {
                            form.setValue("weight", Number(selectedFabric.properties.gramaj));
                          }

                          // Renk bilgisini doldur
                          if (selectedFabric.properties.renk) {
                            form.setValue("color", selectedFabric.properties.renk);
                          }

                          // Desen bilgisini doldur (Desen varyant bilgisinden)
                          if (selectedFabric.properties.desenVaryant) {
                            form.setValue("pattern", selectedFabric.properties.desenVaryant);
                          }

                          // Tuşe bilgisini doldur
                          if (selectedFabric.properties.tuse) {
                            form.setValue("feel", selectedFabric.properties.tuse);
                          }

                          // Harman bilgisini doldur
                          if (selectedFabric.properties.harman) {
                            form.setValue("blend", selectedFabric.properties.harman);
                          }

                          // Desen varyant bilgisini varyant alanına doldur
                          if (selectedFabric.properties.desenVaryant) {
                            form.setValue("variant", selectedFabric.properties.desenVaryant);
                          }

                          // Grup adı 
                          if (selectedFabric.properties.grupAdi) {
                            form.setValue("groupName", selectedFabric.properties.grupAdi);
                          }

                          console.log("Kumaş özellikleri otomatik dolduruldu:", selectedFabric.properties);
                        }
                      }}
                      defaultValue={form.getValues("fabricTypeId")?.toString()}
                    >
                      <SelectTrigger className="mt-1 border-2 border-gray-300 focus:border-indigo-500">
                        <SelectValue placeholder="Kumaş Tipi Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {fabricTypes.map((fabricType: any) => (
                          <SelectItem key={fabricType.id} value={fabricType.id.toString()}>
                            {fabricType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="isUrgent" className="text-sm font-semibold text-gray-700">Sipariş Önceliği</Label>
                    <Select 
                      onValueChange={(value) => form.setValue("isUrgent", value === "true")}
                      defaultValue={form.getValues("isUrgent") ? "true" : "false"}
                    >
                      <SelectTrigger className="mt-1 border-2 border-gray-300 focus:border-indigo-500">
                        <SelectValue placeholder="Öncelik Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">ACELELİ</SelectItem>
                        <SelectItem value="false">NORMAL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Alt sipariş seçiliyse parent sipariş seçimi */}
                {selectedOrderType === "block_color" && (
                  <div className="border-t border-gray-200 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="parentOrderId" className="text-sm font-semibold text-gray-700">Bağlı Olduğu Blok Sipariş</Label>
                        <Select 
                          onValueChange={(value) => form.setValue("parentOrderId", parseInt(value))}
                          defaultValue={form.getValues("parentOrderId")?.toString()}
                        >
                          <SelectTrigger className="mt-1 border-2 border-gray-300 focus:border-indigo-500">
                            <SelectValue placeholder="Blok Sipariş Seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {orders
                              .filter((order: any) => order.orderType === "block")
                              .map((order: any) => (
                                <SelectItem key={order.id} value={order.id.toString()}>
                                  {order.orderNumber}
                                </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
                  
                {/* Sipariş miktarı ve ek bilgiler - 4 kolonlu yatay düzen */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-t border-gray-200 pt-6">
                  <div>
                    <Label htmlFor="quantity" className="text-sm font-semibold text-gray-700">Miktar</Label>
                    <Input 
                      id="quantity" 
                      className="mt-1 border-2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      {...form.register("quantity")} 
                    />
                    {form.formState.errors.quantity && (
                      <p className="mt-1 text-sm text-red-500">{form.formState.errors.quantity.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="unit" className="text-sm font-semibold text-gray-700">Birim</Label>
                    <Select 
                      onValueChange={(value) => form.setValue("unit", value)}
                      defaultValue={form.getValues("unit") || "metre"}
                    >
                      <SelectTrigger className="mt-1 border-2 border-gray-300 focus:border-indigo-500">
                        <SelectValue placeholder="Birim Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metre">Metre</SelectItem>
                        <SelectItem value="adet">Adet</SelectItem>
                        <SelectItem value="kg">Kilogram</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="width" className="text-sm font-semibold text-gray-700">En (cm)</Label>
                    <Input 
                      id="width" 
                      className="mt-1 border-2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      {...form.register("width")} 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="weight" className="text-sm font-semibold text-gray-700">Gramaj (g/m²)</Label>
                    <Input 
                      id="weight" 
                      className="mt-1 border-2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      {...form.register("weight")} 
                    />
                  </div>
                </div>
                
                {/* Renk ve desen - 4 kolonlu yatay düzen */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-t border-gray-200 pt-6">
                  <div>
                    <Label htmlFor="color" className="text-sm font-semibold text-gray-700">Renk</Label>
                    <Input 
                      id="color" 
                      className="mt-1 border-2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      {...form.register("color")} 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="pattern" className="text-sm font-semibold text-gray-700">Desen</Label>
                    <Input 
                      id="pattern" 
                      className="mt-1 border-2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      {...form.register("pattern")} 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="feel" className="text-sm font-semibold text-gray-700">Tuşe</Label>
                    <Input 
                      id="feel" 
                      className="mt-1 border-2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      {...form.register("feel")} 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="blend" className="text-sm font-semibold text-gray-700">Harman</Label>
                    <Input 
                      id="blend" 
                      className="mt-1 border-2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      {...form.register("blend")} 
                    />
                  </div>
                </div>
                
                {/* Notlar */}
                <div className="border-t border-gray-200 pt-6">
                  <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">Notlar</Label>
                  <Textarea 
                    id="notes" 
                    {...form.register("notes")} 
                    placeholder="Siparişe ait özel notlar..." 
                    className="mt-1 min-h-24 border-2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" 
                  />
                </div>
                
                {/* Kaydet butonu */}
                <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
                  <Button 
                    type="submit" 
                    className="w-40 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-medium shadow-md"
                    disabled={orderMutation.isPending}
                  >
                    {orderMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Kaydet
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card className="border-t-4 border-indigo-600 shadow-md">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-xl font-bold text-indigo-700">Siparişler</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Arama filtreleri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 mt-4">
                <div>
                  <Label htmlFor="searchCustomer" className="text-sm font-semibold text-gray-700">Müşteri Ara</Label>
                  <Input
                    id="searchCustomer"
                    placeholder="Müşteri adına göre ara..."
                    value={searchCustomer}
                    onChange={(e) => setSearchCustomer(e.target.value)}
                    className="mt-1 border-2 border-gray-300 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <Label htmlFor="searchProduct" className="text-sm font-semibold text-gray-700">Ürün Ara</Label>
                  <Input
                    id="searchProduct"
                    placeholder="Ürün adına göre ara..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className="mt-1 border-2 border-gray-300 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold">Sipariş No</TableHead>
                      <TableHead className="font-semibold">Müşteri</TableHead>
                      <TableHead className="font-semibold">Ürün</TableHead>
                      <TableHead className="font-semibold">Miktar</TableHead>
                      <TableHead className="font-semibold">Tarihler</TableHead>
                      <TableHead className="font-semibold">Durum</TableHead>
                      <TableHead className="font-semibold text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders && filteredOrders.map((order: any) => (
                      <TableRow key={order.id} className="hover:bg-gray-50 border-b border-gray-200">
                        <TableCell className="font-medium">
                          {order.orderNumber}
                          {order.parentOrderId && (
                            <div className="text-xs text-indigo-600 mt-1">
                              Blok: {orders.find(o => o.id === order.parentOrderId)?.orderNumber || "-"}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {order.orderType === "direct" ? "Doğrudan Sipariş" : 
                             order.orderType === "block" ? "Blok Sipariş" : "Alt Sipariş"}
                          </div>
                        </TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>
                          {fabricTypes.find(f => f.id === order.fabricTypeId)?.name || "-"}
                          {order.color && (
                            <div className="text-xs text-gray-500 mt-1">
                              Renk: {order.color}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {order.quantity} {order.unit}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div className="mb-1">
                              <span className="font-medium">Sipariş:</span> {order.orderDate ? new Date(order.orderDate).toLocaleDateString('tr-TR') : '-'}
                            </div>
                            <div>
                              <span className="font-medium">Termin:</span> {order.dueDate ? new Date(order.dueDate).toLocaleDateString('tr-TR') : '-'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div 
                              className="w-2 h-2 rounded-full mr-2" 
                              style={{ backgroundColor: orderStatuses.find(s => s.id === order.statusId)?.color || '#ccc' }}
                            ></div>
                            <span>{orderStatuses.find(s => s.id === order.statusId)?.name || 'Belirsiz'}</span>
                          </div>
                          {order.isUrgent && (
                            <div className="text-xs text-red-600 mt-1 font-semibold">ACELELİ</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(`/sales/print-order/${order.id}`, '_blank')}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate(`/sales/orders/${order.id}`)}
                              title="Siparişi Göster"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                    {!filteredOrders || filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                          Kayıtlı sipariş bulunamadı.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}