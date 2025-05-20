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
import { Printer, Search, CheckCircle2, XCircle, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

// Kumaş Numunesi (Kartela) şeması
const sampleCardSchema = z.object({
  orderId: z.number({
    required_error: "Sipariş seçimi zorunludur",
  }),
  fabricTypeId: z.number({
    required_error: "Kumaş tipi seçimi zorunludur",
  }),
  sampleCode: z.string().min(1, "Numune kodu zorunludur"),
  description: z.string().min(1, "Açıklama zorunludur"),
  specifications: z.string().optional(),
  expectedApprovalDate: z.string().optional(),
});

type SampleCardFormValues = z.infer<typeof sampleCardSchema>;

// Onay işlemi şeması
const approvalSchema = z.object({
  sampleId: z.number(),
  isApproved: z.boolean(),
  comments: z.string().optional(),
});

type ApprovalFormValues = z.infer<typeof approvalSchema>;

export default function FabricSampleCardPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSample, setSelectedSample] = useState<number | null>(null);
  const [showApprovalForm, setShowApprovalForm] = useState(false);

  // Form tanımlaması - Numune Kartı
  const form = useForm<SampleCardFormValues>({
    resolver: zodResolver(sampleCardSchema),
    defaultValues: {
      sampleCode: "",
      description: "",
      specifications: "",
    },
  });

  // Form tanımlaması - Onay İşlemi
  const approvalForm = useForm<ApprovalFormValues>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      isApproved: true,
      comments: "",
    },
  });

  // Kumaş tiplerini getir
  const { data: fabricTypes, isLoading: isLoadingFabricTypes } = useQuery({
    queryKey: ["/api/fabric-types"],
  });

  // Siparişleri getir
  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
    select: (data) =>
      data.filter((order: any) => order.statusId === 1 || order.statusId === 2),
  });

  // Mevcut numuneleri getir
  const { data: fabricSamples, isLoading: isLoadingSamples } = useQuery({
    queryKey: ["/api/fabric-samples"],
  });

  // Filtrelenmiş numuneler
  const filteredSamples = searchQuery
    ? fabricSamples?.filter(
        (sample: any) =>
          sample.sampleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sample.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sample.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sample.fabricType?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : fabricSamples;

  // Numune oluşturma mutasyonu
  const createSampleMutation = useMutation({
    mutationFn: async (data: SampleCardFormValues) => {
      const res = await apiRequest("POST", "/api/fabric-samples", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fabric-samples"] });
      toast({
        title: "Kumaş numunesi oluşturuldu",
        description: "Numune kartı başarıyla oluşturuldu ve barkod oluşturuldu.",
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

  // Numune durum güncelleme mutasyonu
  const updateSampleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/fabric-samples/${id}/status`, {
        status,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fabric-samples"] });
      toast({
        title: "Durum güncellendi",
        description: "Numune durumu başarıyla güncellendi.",
      });
      setSelectedSample(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Onay işlemi oluşturma mutasyonu
  const createApprovalMutation = useMutation({
    mutationFn: async (data: ApprovalFormValues) => {
      const res = await apiRequest("POST", "/api/fabric-samples/approvals", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fabric-samples"] });
      toast({
        title: "Onay işlemi kaydedildi",
        description: "Numune için onay işlemi başarıyla kaydedildi.",
      });
      approvalForm.reset();
      setShowApprovalForm(false);
      setSelectedSample(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form gönderimi - Numune Kartı
  const onSubmit = (values: SampleCardFormValues) => {
    createSampleMutation.mutate(values);
  };

  // Form gönderimi - Onay İşlemi
  const onSubmitApproval = (values: ApprovalFormValues) => {
    createApprovalMutation.mutate({
      ...values,
      sampleId: selectedSample as number,
    });

    // Aynı zamanda numune durumunu güncelle
    updateSampleStatusMutation.mutate({
      id: selectedSample as number,
      status: values.isApproved ? "approved" : "rejected",
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

  // Durum badgei oluştur
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "created":
        return <Badge variant="outline">Oluşturuldu</Badge>;
      case "submitted":
        return <Badge variant="secondary">Onaya Gönderildi</Badge>;
      case "approved":
        return <Badge className="bg-green-600">Onaylandı</Badge>;
      case "rejected":
        return <Badge variant="destructive">Reddedildi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Barkod yazdırma işlemi
  const printBarcode = (sampleId: number) => {
    setSelectedSample(sampleId);
    toast({
      title: "Barkod Yazdırma",
      description: "Barkod yazdırma özelliği yakında eklenecek.",
    });
  };

  // Onay formunu aç
  const startApprovalProcess = (sampleId: number) => {
    setSelectedSample(sampleId);
    setShowApprovalForm(true);
    approvalForm.setValue("sampleId", sampleId);
  };

  if (isLoadingFabricTypes || isLoadingSamples) {
    return <div className="flex justify-center p-8">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Kumaş Numuneleri (Kartela)</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Sol taraf - Yeni Numune Oluşturma veya Onay Formu */}
        {!showApprovalForm ? (
          <Card>
            <CardHeader>
              <CardTitle>Yeni Kumaş Numunesi</CardTitle>
              <CardDescription>
                Müşteri onayı için kumaş numunesi kartı oluşturun.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="orderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sipariş</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sipariş seçiniz" />
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
                    name="sampleCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numune Kodu</FormLabel>
                        <FormControl>
                          <Input placeholder="Numune kodu giriniz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Açıklama</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Numune açıklaması..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teknik Özellikler (Opsiyonel)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Teknik özellikler..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expectedApprovalDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beklenen Onay Tarihi (Opsiyonel)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createSampleMutation.isPending}
                  >
                    {createSampleMutation.isPending
                      ? "Oluşturuluyor..."
                      : "Numune Kartı Oluştur"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Numune Onay İşlemi</CardTitle>
              <CardDescription>
                Seçilen numune için onay veya red işlemini gerçekleştirin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...approvalForm}>
                <form
                  onSubmit={approvalForm.handleSubmit(onSubmitApproval)}
                  className="space-y-4"
                >
                  <FormField
                    control={approvalForm.control}
                    name="isApproved"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Onay Durumu</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === "true")}
                          value={field.value ? "true" : "false"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Onay durumunu seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">Onaylandı</SelectItem>
                            <SelectItem value="false">Reddedildi</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={approvalForm.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yorumlar</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Onay veya red ile ilgili notlar..." {...field} />
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
                        setShowApprovalForm(false);
                        setSelectedSample(null);
                      }}
                      className="flex-1"
                    >
                      İptal
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={createApprovalMutation.isPending}
                    >
                      {createApprovalMutation.isPending
                        ? "Kaydediliyor..."
                        : "Onay İşlemini Kaydet"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Sağ taraf - Numune Listesi */}
        <Card>
          <CardHeader>
            <CardTitle>Kumaş Numuneleri</CardTitle>
            <CardDescription>
              Oluşturulan numuneleri görüntüleyin ve yönetin.
            </CardDescription>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kod, açıklama veya sipariş ile ara..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>Kumaş numuneleri listesi</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numune Kodu</TableHead>
                    <TableHead>Sipariş</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSamples?.length > 0 ? (
                    filteredSamples.map((sample: any) => (
                      <TableRow key={sample.id}>
                        <TableCell
                          className="font-medium cursor-pointer hover:text-blue-600"
                          onClick={() => navigate(`/fabric-samples/${sample.id}`)}
                        >
                          {sample.sampleCode}
                        </TableCell>
                        <TableCell>{sample.orderNumber || "-"}</TableCell>
                        <TableCell>{getStatusBadge(sample.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => printBarcode(sample.id)}
                            >
                              <Printer className="h-4 w-4 mr-1" />
                              Yazdır
                            </Button>
                            {sample.status === "created" && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                  updateSampleStatusMutation.mutate({
                                    id: sample.id,
                                    status: "submitted",
                                  })
                                }
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Onaya Gönder
                              </Button>
                            )}
                            {sample.status === "submitted" && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => startApprovalProcess(sample.id)}
                                >
                                  <ThumbsUp className="h-4 w-4 mr-1" />
                                  Onay İşlemi
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        {searchQuery
                          ? "Arama kriterlerine uygun numune bulunamadı."
                          : "Henüz kumaş numunesi oluşturulmamış."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Toplam: {filteredSamples?.length || 0} numune
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}