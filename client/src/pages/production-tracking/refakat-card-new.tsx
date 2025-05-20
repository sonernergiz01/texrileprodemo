import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, Save, ArrowLeft, Barcode } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

import PageHeader from "@/components/layout/page-header";
import { useAuth } from "@/hooks/use-auth";

// Refakat kartı şeması
const refakatCardSchema = z.object({
  productionPlanId: z.string().min(1, "Üretim planı seçilmelidir"),
  length: z.string().optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
  currentDepartmentId: z.string().min(1, "Departman seçilmelidir"),
});

type RefakatCardFormValues = z.infer<typeof refakatCardSchema>;

export default function RefakatCardNewPage() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Departmanları getir
  const { data: departments, isLoading: loadingDepartments } = useQuery<any[]>({
    queryKey: ["/api/admin/departments"],
    enabled: !!user
  });

  // Üretime alınabilecek üretim planlarını getir
  const { data: productionPlans, isLoading: loadingPlans } = useQuery<any[]>({
    queryKey: ["/api/planning/production-plans"],
    enabled: !!user
  });

  // Form oluştur
  const form = useForm<RefakatCardFormValues>({
    resolver: zodResolver(refakatCardSchema),
    defaultValues: {
      productionPlanId: "",
      length: "",
      color: "",
      notes: "",
      currentDepartmentId: user?.departmentId ? String(user.departmentId) : "",
    },
  });

  // Kullanıcı departmanı değiştiyse formu güncelle
  useEffect(() => {
    if (user?.departmentId) {
      form.setValue("currentDepartmentId", String(user.departmentId));
    }
  }, [user, form]);

  // Yeni refakat kartı oluşturma mutation
  const createCardMutation = useMutation({
    mutationFn: async (values: RefakatCardFormValues) => {
      // Seçili üretim planından sipariş ID'sini al
      const selectedPlan = productionPlans?.find(
        plan => plan.id === parseInt(values.productionPlanId)
      );
      
      // Sipariş ID'si yoksa hata fırlat
      if (!selectedPlan) {
        throw new Error("Seçili üretim planı bulunamadı");
      }
      
      // Önce gönderilecek verileri hazırla
      const postData = {
        productionPlanId: parseInt(values.productionPlanId),
        currentDepartmentId: parseInt(values.currentDepartmentId),
        orderId: selectedPlan.orderId, // Üretim planından sipariş ID'sini al
        length: values.length || "",
        color: values.color || "",
        notes: values.notes || "",
        status: 'created'
      };
      
      // Debug için verileri konsola yazdır
      console.log('Gönderilecek refakat kartı verileri:', postData);
      
      // API isteği yap
      const res = await apiRequest("POST", "/api/production-tracking/production-cards", postData);
      
      // İsteğin başarılı olduğunu doğrula
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API hatası: ${res.status} - ${errorText}`);
      }
      
      // JSON dönüşü yap
      return await res.json();
    },
    onSuccess: (card) => {
      toast({
        title: "Refakat kartı oluşturuldu",
        description: `${card.cardNo} numaralı refakat kartı başarıyla oluşturuldu.`,
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/production-tracking/production-cards"],
      });
      navigate("/production-tracking/refakat-cards");
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Refakat kartı oluşturulurken bir hata oluştu: ${error.message || "Beklenmeyen bir hata"}`,
        variant: "destructive",
      });
    },
  });

  // Form gönderildiğinde
  const onSubmit = (values: RefakatCardFormValues) => {
    setLoading(true);
    createCardMutation.mutate(values);
  };

  // Seçili planın detaylarını göster
  const selectedPlan = form.watch("productionPlanId") 
    ? productionPlans?.find(plan => plan.id === parseInt(form.watch("productionPlanId")))
    : null;
    
  // Müşteri ve ürün bilgilerini al
  const selectedPlanCustomerName = selectedPlan?.customerName || "—";
  const selectedPlanProductName = selectedPlan?.fabricTypeName || "—";

  return (
    <div className="container mx-auto py-4">
      <PageHeader 
        title="Yeni Refakat Kartı" 
        description="Üretim süreçlerinde parça takibi için yeni refakat kartı oluştur"
        actions={
          <Button variant="outline" onClick={() => navigate("/production-tracking/refakat-cards")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Listeye Dön
          </Button>
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Refakat Kartı Bilgileri</CardTitle>
              <CardDescription>Kart için gerekli bilgileri doldurun</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="productionPlanId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Üretim Planı</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Üretim planı seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingPlans ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-5 w-5 animate-spin" />
                          </div>
                        ) : (
                          productionPlans?.map((plan) => (
                            <SelectItem key={plan.id} value={String(plan.id)}>
                              {plan.planNo} - {plan.orderNumber} 
                              {plan.customerName ? ` | ${plan.customerName}` : ''} 
                              {plan.fabricTypeName ? ` | ${plan.fabricTypeName}` : ''}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedPlan && (
                <div className="bg-muted p-4 rounded-lg mb-4">
                  <h3 className="font-medium text-sm mb-2">Seçili Üretim Planı Detayları</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Plan No:</span> {selectedPlan.planNo}
                    </div>
                    <div>
                      <span className="font-medium">Sipariş No:</span> {selectedPlan.orderNumber}
                    </div>
                    <div>
                      <span className="font-medium">Müşteri:</span> {selectedPlanCustomerName}
                    </div>
                    <div>
                      <span className="font-medium">Ürün Adı:</span> {selectedPlanProductName}
                    </div>
                    <div>
                      <span className="font-medium">Açıklama:</span> {selectedPlan.description || "—"}
                    </div>
                    <div>
                      <span className="font-medium">Durum:</span> {selectedPlan.status}
                    </div>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="currentDepartmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departman</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Departman seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingDepartments ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-5 w-5 animate-spin" />
                          </div>
                        ) : (
                          departments?.map((dept) => (
                            <SelectItem key={dept.id} value={String(dept.id)}>
                              {dept.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Kartın başlangıç departmanını seçin
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Miktar/Uzunluk</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: 100" {...field} />
                      </FormControl>
                      <FormDescription>
                        Metraj/adet bilgisi (opsiyonel)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Renk</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: Mavi" {...field} />
                      </FormControl>
                      <FormDescription>
                        Renk bilgisi (opsiyonel)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Input placeholder="Kart ile ilgili notlar" {...field} />
                    </FormControl>
                    <FormDescription>
                      Ek açıklamalar (opsiyonel)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => navigate("/production-tracking/refakat-cards")}
              >
                İptal
              </Button>
              <Button 
                type="submit"
                disabled={loading || createCardMutation.isPending}
              >
                {(loading || createCardMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Kartı Oluştur
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}