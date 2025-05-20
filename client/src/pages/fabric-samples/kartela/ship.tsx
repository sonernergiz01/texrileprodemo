import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

import { PageContainer } from "@/components/layout/page-container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

const shipmentFormSchema = z.object({
  kartelaId: z.string().min(1, { message: "Kartela seçimi zorunludur" }),
  customerId: z.string().min(1, { message: "Müşteri seçimi zorunludur" }),
  shipmentDate: z.date({ required_error: "Sevkiyat tarihi zorunludur" }),
  shipmentMethod: z.string().min(1, { message: "Sevkiyat yöntemi zorunludur" }),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
});

type ShipmentFormValues = z.infer<typeof shipmentFormSchema>;

export default function KartelaShipPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedKartelaItems, setSelectedKartelaItems] = useState<any[]>([]);
  
  // Fetch data
  const { data: kartelas, isLoading: loadingKartelas } = useQuery({
    queryKey: ["/api/kartelas"],
  });
  
  const { data: customers, isLoading: loadingCustomers } = useQuery({
    queryKey: ["/api/customers"],
  });
  
  // Create form
  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues: {
      shipmentMethod: "cargo",
      shipmentDate: new Date(),
    },
  });
  
  // Kartela detayları için query
  const { data: selectedKartelaData, refetch: refetchKartelaDetails } = useQuery({
    queryKey: ["/api/kartela-detail"],
    enabled: false, // Başlangıçta çalıştırma
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/kartelas/${form.getValues("kartelaId")}`);
      if (!response.ok) {
        throw new Error("Kartela detayı getirilemedi");
      }
      return response.json();
    }
  });

  // Handle kartela selection
  const handleKartelaChange = async (kartelaId: string) => {
    // Handle special values
    if (kartelaId === "no-data") {
      form.setValue("kartelaId", "");
      setSelectedKartelaItems([]);
      return;
    }
    
    form.setValue("kartelaId", kartelaId);
    
    // Get kartela details to populate customer info
    const selectedKartela = kartelas?.find((k: any) => k.id.toString() === kartelaId);
    if (selectedKartela && selectedKartela.customerId) {
      form.setValue("customerId", selectedKartela.customerId.toString());
    }
    
    try {
      // React Query ile veri çekmek için queryClient kullanarak geçerli 
      // parametrelerle sorguyu yeniden çalıştır
      queryClient.setQueryData(["/api/kartela-detail"], null);
      const data = await queryClient.fetchQuery({
        queryKey: ["/api/kartelas", kartelaId],
        queryFn: async () => {
          const response = await fetch(`/api/kartelas/${kartelaId}`);
          if (!response.ok) {
            throw new Error("Kartela detayı getirilemedi");
          }
          return response.json();
        }
      });
      
      if (data?.items) {
        setSelectedKartelaItems(data.items);
      } else {
        setSelectedKartelaItems([]);
      }
    } catch (err) {
      console.error("Kartela öğeleri getirme hatası:", err);
      toast({
        title: "Hata",
        description: "Kartela öğeleri getirilemedi. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
      setSelectedKartelaItems([]);
    }
  };
  
  // Create shipment mutation
  const createShipmentMutation = useMutation({
    mutationFn: async (data: ShipmentFormValues) => {
      const response = await apiRequest(
        "POST", 
        `/api/kartelas/${data.kartelaId}/shipments`, 
        {
          ...data,
          kartelaId: parseInt(data.kartelaId),
          customerId: parseInt(data.customerId),
          customerName: customers?.find((c: any) => c.id.toString() === data.customerId)?.name || "",
        }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sevkiyat Oluşturuldu",
        description: "Kartela sevkiyatı başarıyla oluşturuldu.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/kartelas"] });
      navigate("/fabric-samples/kartela");
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Sevkiyat oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: ShipmentFormValues) => {
    // Özel değerleri kontrol et
    if (data.kartelaId === "no-data" || data.customerId === "no-customer") {
      toast({
        title: "Hata",
        description: "Lütfen geçerli bir kartela ve müşteri seçin.",
        variant: "destructive",
      });
      return;
    }
    
    // Boş değerleri kontrol et
    if (!data.kartelaId || !data.customerId) {
      toast({
        title: "Hata",
        description: "Kartela ve müşteri seçimi zorunludur.",
        variant: "destructive",
      });
      return;
    }
    
    createShipmentMutation.mutate(data);
  };
  
  if (loadingKartelas || loadingCustomers) {
    return (
      <PageContainer title="Kartela Sevkiyatı" subtitle="Müşterilere gönderilecek kartela sevkiyatlarını oluşturun">
        <div className="flex justify-center items-center h-[400px]">
          <p>Yükleniyor...</p>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer title="Kartela Sevkiyatı" subtitle="Müşterilere gönderilecek kartela sevkiyatlarını oluşturun">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Yeni Sevkiyat</CardTitle>
              <CardDescription>
                Müşteriye gönderilecek kartela ve sevkiyat bilgilerini girin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="kartelaId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kartela</FormLabel>
                          <Select 
                            onValueChange={(value) => handleKartelaChange(value)} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Kartela seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {kartelas?.length > 0 ? (
                                kartelas.map((kartela: any) => (
                                  <SelectItem key={kartela.id} value={kartela.id.toString()}>
                                    {kartela.name} ({kartela.kartelaCode})
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-data">Henüz kartela bulunmuyor</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Müşteri</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              // Handle special value for "no customer"
                              if (value === "no-customer") {
                                field.onChange("");
                              } else {
                                field.onChange(value);
                              }
                            }}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Müşteri seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers?.length > 0 ? (
                                customers.map((customer: any) => (
                                  <SelectItem key={customer.id} value={customer.id.toString()}>
                                    {customer.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-customer">Henüz müşteri bulunmuyor</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="shipmentDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Sevkiyat Tarihi</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PP", { locale: tr })
                                  ) : (
                                    <span>Sevkiyat tarihini seçin</span>
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
                                disabled={(date) => date < new Date("1900-01-01")}
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
                      name="shipmentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sevkiyat Yöntemi</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sevkiyat yöntemi seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cargo">Kargo</SelectItem>
                              <SelectItem value="courier">Kurye</SelectItem>
                              <SelectItem value="mail">Posta</SelectItem>
                              <SelectItem value="hand">Elden Teslim</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="trackingNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Takip Numarası</FormLabel>
                        <FormControl>
                          <Input placeholder="Kargo/kurye takip numarası girin" {...field} />
                        </FormControl>
                        <FormDescription>
                          İsteğe bağlı - kargo veya kurye takip numarası
                        </FormDescription>
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
                          <Textarea placeholder="Sevkiyat ile ilgili notlar..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-4">
                    <Button type="submit" disabled={createShipmentMutation.isPending}>
                      {createShipmentMutation.isPending ? "Oluşturuluyor..." : "Sevkiyat Oluştur"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Kartela İçeriği</CardTitle>
              <CardDescription>
                Seçilen kartelanın içerdiği kumaş örnekleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedKartelaItems.length > 0 ? (
                <div className="space-y-3">
                  {selectedKartelaItems.map((item) => (
                    <div key={item.id} className="border rounded-md p-3">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium">{item.fabricTypeName}</h3>
                        <Badge variant="outline">{item.fabricCode}</Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {item.color && <div>Renk: {item.color}</div>}
                        {item.weight && <div>Ağırlık: {item.weight} gr/m²</div>}
                        {item.width && <div>En: {item.width} cm</div>}
                        {item.composition && <div>Kompozisyon: {item.composition}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  {form.watch("kartelaId") ? 
                    "Bu kartelada henüz kumaş örneği bulunmuyor." : 
                    "Kartela seçildiğinde içeriği burada görüntülenecektir."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}