import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Printer, Search, QrCode, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";

// Dokuma Üretim Kartı şeması
const productionCardSchema = z.object({
  batchNumber: z.string().min(1, "Parti numarası zorunludur"),
  orderId: z.number().optional(),
  fabricTypeId: z.number({
    required_error: "Kumaş tipi seçimi zorunludur",
  }),
  yarnType: z.string().min(1, "İplik türü zorunludur"),
  width: z.string().min(1, "En bilgisi zorunludur"),
  length: z.string().optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
});

type ProductionCardFormValues = z.infer<typeof productionCardSchema>;

// Üretim kartı izleme olayı şeması
const trackingEventSchema = z.object({
  cardId: z.number(),
  eventType: z.string(),
  machineId: z.number().optional(),
  details: z.string().optional(),
});

type TrackingEventFormValues = z.infer<typeof trackingEventSchema>;

export default function WeaveProductionCardPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [showTrackingForm, setShowTrackingForm] = useState(false);

  // Form tanımlaması - Üretim Kartı
  const form = useForm<ProductionCardFormValues>({
    resolver: zodResolver(productionCardSchema),
    defaultValues: {
      batchNumber: "",
      yarnType: "",
      width: "",
      notes: "",
    },
  });

  // Form tanımlaması - İzleme Olayı
  const trackingForm = useForm<TrackingEventFormValues>({
    resolver: zodResolver(trackingEventSchema),
    defaultValues: {
      eventType: "process_in",
      details: "",
    },
  });

  // Departmanları getir
  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
  });

  // Kumaş tiplerini getir
  const { data: fabricTypes, isLoading: isLoadingFabricTypes } = useQuery({
    queryKey: ["/api/fabric-types"],
  });

  // Makineleri getir
  const { data: machines, isLoading: isLoadingMachines } = useQuery({
    queryKey: ["/api/machines"],
    select: (data) => 
      data.filter((machine: any) => machine.departmentId === user?.departmentId),
  });

  // Siparişleri getir
  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
    select: (data) =>
      data.filter((order: any) => order.statusId === 1 || order.statusId === 2),
  });

  // Mevcut kartları getir
  const { data: productionCards, isLoading: isLoadingCards } = useQuery({
    queryKey: ["/api/weaving/production-cards"],
  });

  // Filtrelenmiş kartlar
  const filteredCards = searchQuery
    ? productionCards?.filter(
        (card: any) =>
          card.cardNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.fabricType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : productionCards;

  // Kart oluşturma mutasyonu
  const createCardMutation = useMutation({
    mutationFn: async (data: ProductionCardFormValues) => {
      const res = await apiRequest("POST", "/api/weaving/production-cards", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weaving/production-cards"] });
      toast({
        title: "Dokuma üretim kartı oluşturuldu",
        description: "Kart başarıyla oluşturuldu ve barkod oluşturuldu.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Kart durum güncelleme mutasyonu
  const updateCardStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/weaving/production-cards/${id}/status`, {
        status,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weaving/production-cards"] });
      toast({
        title: "Durum güncellendi",
        description: "Kart durumu başarıyla güncellendi.",
      });
      setSelectedCard(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // İzleme olayı oluşturma mutasyonu
  const createTrackingEventMutation = useMutation({
    mutationFn: async (data: TrackingEventFormValues) => {
      const res = await apiRequest("POST", "/api/weaving/tracking-events", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weaving/production-cards"] });
      toast({
        title: "İzleme olayı kaydedildi",
        description: "Üretim kartı için yeni izleme olayı başarıyla kaydedildi.",
      });
      trackingForm.reset();
      setShowTrackingForm(false);
      setSelectedCard(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form gönderimi - Üretim Kartı
  const onSubmit = (values: ProductionCardFormValues) => {
    createCardMutation.mutate(values);
  };

  // Form gönderimi - İzleme Olayı
  const onSubmitTrackingEvent = (values: TrackingEventFormValues) => {
    createTrackingEventMutation.mutate({
      ...values,
      cardId: selectedCard as number,
    });
  };

  // Kumaş tipi select opsiyonları oluştur
  const renderFabricTypeOptions = () => {
    if (!fabricTypes) return null;
    return fabricTypes.map((fabric: any) => (
      <SelectItem key={fabric.id} value={fabric.id.toString()}>
        {fabric.name} - {fabric.code}
      </SelectItem>
    ));
  };

  // Makine select opsiyonları oluştur
  const renderMachineOptions = () => {
    if (!machines) return null;
    return machines.map((machine: any) => (
      <SelectItem key={machine.id} value={machine.id.toString()}>
        {machine.name} - {machine.code}
      </SelectItem>
    ));
  };

  // Durum badgei oluştur
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "created":
        return <Badge variant="outline">Oluşturuldu</Badge>;
      case "in-progress":
        return <Badge variant="secondary">Üretimde</Badge>;
      case "completed":
        return <Badge className="bg-green-600">Tamamlandı</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Barkod yazdırma işlemi
  const printBarcode = (cardId: number) => {
    setSelectedCard(cardId);
    toast({
      title: "Barkod Yazdırma",
      description: "Barkod yazdırma özelliği yakında eklenecek.",
    });
  };

  // İzleme olayı ekleme ekranını aç
  const startTrackingEvent = (cardId: number) => {
    setSelectedCard(cardId);
    setShowTrackingForm(true);
    trackingForm.setValue("cardId", cardId);
  };

  if (isLoadingFabricTypes || isLoadingCards || isLoadingMachines) {
    return <div className="flex justify-center p-8">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dokuma Üretim Kartları</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Sol taraf - Yeni Kart Oluşturma */}
        {!showTrackingForm ? (
          <Card>
            <CardHeader>
              <CardTitle>Yeni Dokuma Üretim Kartı</CardTitle>
              <CardDescription>
                Dokuma departmanında üretim takibi için yeni kart oluşturun.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="batchNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parti Numarası</FormLabel>
                        <FormControl>
                          <Input placeholder="Parti numarası giriniz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="orderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sipariş (Opsiyonel)</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sipariş seçiniz (opsiyonel)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {orders?.map((order: any) => (
                              <SelectItem key={order.id} value={order.id.toString()}>
                                {order.orderNumber} - {order.customerName || "Müşteri"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Kart spesifik bir siparişe ait ise seçiniz
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fabricTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kumaş Tipi</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Kumaş tipi seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>{renderFabricTypeOptions()}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="yarnType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İplik Türü</FormLabel>
                        <FormControl>
                          <Input placeholder="İplik türü giriniz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="width"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>En (cm)</FormLabel>
                          <FormControl>
                            <Input placeholder="En" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="length"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Boy (m)</FormLabel>
                          <FormControl>
                            <Input placeholder="Boy (opsiyonel)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Renk (Opsiyonel)</FormLabel>
                        <FormControl>
                          <Input placeholder="Renk bilgisi" {...field} />
                        </FormControl>
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
                          <Textarea placeholder="Notlar..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createCardMutation.isPending}
                  >
                    {createCardMutation.isPending ? "Oluşturuluyor..." : "Üretim Kartı Oluştur"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Kart İzleme Olayı Ekle</CardTitle>
              <CardDescription>
                Seçilen kart için yeni bir işlem kaydı ekleyin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...trackingForm}>
                <form
                  onSubmit={trackingForm.handleSubmit(onSubmitTrackingEvent)}
                  className="space-y-4"
                >
                  <FormField
                    control={trackingForm.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Olay Türü</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Olay türü seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="process_in">İşleme Başlama</SelectItem>
                            <SelectItem value="process_out">İşlemi Tamamlama</SelectItem>
                            <SelectItem value="quality_check">Kalite Kontrol</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={trackingForm.control}
                    name="machineId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Makine</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Makine seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>{renderMachineOptions()}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={trackingForm.control}
                    name="details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detaylar (Opsiyonel)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="İşlem detayları..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowTrackingForm(false);
                        setSelectedCard(null);
                      }}
                      className="flex-1"
                    >
                      İptal
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={createTrackingEventMutation.isPending}
                    >
                      {createTrackingEventMutation.isPending ? "Kaydediliyor..." : "Olayı Kaydet"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Sağ taraf - Kart Listesi */}
        <Card>
          <CardHeader>
            <CardTitle>Dokuma Üretim Kartları</CardTitle>
            <CardDescription>
              Oluşturulan üretim kartlarını görüntüleyin ve yönetin.
            </CardDescription>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kart no, parti no veya kumaş tipi ile ara..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>Dokuma üretim kartları listesi</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kart No</TableHead>
                    <TableHead>Parti No</TableHead>
                    <TableHead>Kumaş Tipi</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards?.length > 0 ? (
                    filteredCards.map((card: any) => (
                      <TableRow key={card.id}>
                        <TableCell
                          className="font-medium cursor-pointer hover:text-blue-600"
                          onClick={() => navigate(`/weaving/production-cards/${card.id}`)}
                        >
                          {card.cardNumber}
                        </TableCell>
                        <TableCell>{card.batchNumber}</TableCell>
                        <TableCell>{card.fabricType}</TableCell>
                        <TableCell>{getStatusBadge(card.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => printBarcode(card.id)}
                            >
                              <Printer className="h-4 w-4 mr-1" />
                              Yazdır
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => startTrackingEvent(card.id)}
                            >
                              <QrCode className="h-4 w-4 mr-1" />
                              İşlem
                            </Button>
                            {card.status === "in-progress" && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() =>
                                  updateCardStatusMutation.mutate({
                                    id: card.id,
                                    status: "completed",
                                  })
                                }
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Tamamla
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        {searchQuery
                          ? "Arama kriterlerine uygun kart bulunamadı."
                          : "Henüz dokuma üretim kartı oluşturulmamış."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Toplam: {filteredCards?.length || 0} kart
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}