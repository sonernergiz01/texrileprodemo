import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowLeft } from 'lucide-react';
import { insertOrderSchema } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

// Çok daha basit bir şema, minimum veri doğrulama ile
const simpleChildOrderSchema = z.object({
  parentOrderId: z.number().positive(),
  quantity: z.string().min(1, "Miktar zorunludur"),
  color: z.string().optional(),
  notes: z.string().optional(),
});

type SimpleChildOrderFormValues = z.infer<typeof simpleChildOrderSchema>;

// Basitleştirilmiş Alt Sipariş Sayfası
function AddChildOrderPage() {
  const { toast } = useToast();
  
  // URL'den parentOrderId parametresini al
  const urlSearchParams = new URLSearchParams(window.location.search);
  const parentOrderId = urlSearchParams.get('parentId') || '';
  
  // Ana siparişi getir
  const {
    data: parentOrder,
    isLoading: isParentOrderLoading,
  } = useQuery({
    queryKey: ['/api/orders', parentOrderId],
    queryFn: async () => {
      if (!parentOrderId) return null;
      const response = await fetch(`/api/orders/${parentOrderId}`);
      if (!response.ok) throw new Error('Ana sipariş yüklenemedi');
      return response.json();
    },
    enabled: !!parentOrderId,
  });

  // Alt siparişleri getir
  const {
    data: childOrders = [],
    isLoading: isChildOrdersLoading,
  } = useQuery({
    queryKey: ['/api/orders', 'children', parentOrderId],
    queryFn: async () => {
      if (!parentOrderId) return [];
      const response = await fetch(`/api/orders`);
      if (!response.ok) throw new Error('Siparişler yüklenemedi');
      const orders = await response.json();
      return orders.filter((order: any) => 
        order.parentOrderId === parseInt(parentOrderId) && 
        order.orderType === 'block_color'
      );
    },
    enabled: !!parentOrderId,
  });

  // Kalan miktarı hesapla
  const totalQuantity = parentOrder ? parseInt(parentOrder.quantity || '0') : 0;
  const usedQuantity = childOrders.reduce((sum: number, order: any) => 
    sum + parseInt(order.quantity || '0'), 0
  );
  const maxQuantity = totalQuantity - usedQuantity;
  
  // Form 
  const form = useForm<SimpleChildOrderFormValues>({
    resolver: zodResolver(simpleChildOrderSchema),
    defaultValues: {
      parentOrderId: parentOrderId ? parseInt(parentOrderId) : 0,
      quantity: '',
      color: '',
      notes: '',
    },
  });

  // Sipariş oluşturma mutasyonu
  const mutation = useMutation({
    mutationFn: async (data: SimpleChildOrderFormValues) => {
      // Tam sipariş verisi oluştur
      const fullOrderData = {
        ...data,
        orderType: 'block_color',
        customerId: parentOrder?.customerId,
        fabricTypeId: parentOrder?.fabricTypeId,
        unit: parentOrder?.unit || 'metre',
        orderDate: new Date().toISOString().slice(0, 10),
        dueDate: parentOrder?.dueDate,
        statusId: 1, // Beklemede
        marketType: parentOrder?.marketType || 'iç',
        // Geçici sipariş numarası (sunucu tarafında gerçek numara oluşturulacak)
        orderNumber: `TEMP-${Date.now()}`,
      };
      
      console.log("Gönderilen veri:", fullOrderData);
      
      const response = await apiRequest('POST', '/api/orders', fullOrderData);
      const responseData = await response.json();
      return responseData;
    },
    onSuccess: () => {
      // Başarılı olduğunda
      queryClient.invalidateQueries({queryKey: ['/api/orders']});
      toast({
        title: 'Başarılı!',
        description: 'Alt sipariş başarıyla oluşturuldu.',
      });
      
      // Ana sipariş sayfasına yönlendir
      window.location.href = `/sales/orders/${parentOrderId}`;
    },
    onError: (error: any) => {
      // Hata durumunda
      console.error("Sipariş oluşturma hatası:", error);
      toast({
        title: 'Hata!',
        description: error.message || 'Alt sipariş oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  // Form gönderme işlemi
  const onSubmit = (values: SimpleChildOrderFormValues) => {
    // Miktar kontrolü
    const requestedQuantity = parseInt(values.quantity);
    if (isNaN(requestedQuantity) || requestedQuantity <= 0) {
      toast({
        title: 'Hata!',
        description: 'Lütfen geçerli bir miktar girin.',
        variant: 'destructive',
      });
      return;
    }
    
    // Kalan bakiye kontrolü
    if (requestedQuantity > maxQuantity) {
      toast({
        title: 'Hata!',
        description: `Talep edilen miktar (${requestedQuantity}) kalan bakiyeden (${maxQuantity}) fazla olamaz.`,
        variant: 'destructive',
      });
      return;
    }
    
    // Her şey uygunsa formu gönder
    mutation.mutate(values);
  };

  const isLoading = isParentOrderLoading || isChildOrdersLoading || mutation.isPending;

  // Ana sipariş yüklenirken yükleniyor göster
  if (isParentOrderLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="ml-2">Sipariş bilgileri yükleniyor...</span>
        </div>
      </PageContainer>
    );
  }

  // Ana sipariş bulunamadıysa veya bir hata olduysa 
  if (!parentOrder || parentOrder.orderType !== 'block') {
    return (
      <PageContainer>
        <Alert variant="destructive">
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>
            Bu sipariş bir blok sipariş değil veya bulunamadı. Lütfen geçerli bir blok sipariş seçin.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => window.location.href = '/sales/orders'}>
            Siparişlere Dön
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = `/sales/orders/${parentOrderId}`}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Blok Siparişe Dön
            </Button>
            <h1 className="text-2xl font-bold">Alt Sipariş Oluştur</h1>
          </div>
        </div>
        
        {/* Blok Sipariş Bilgileri Özeti */}
        <Card className="mb-6 border-t-4 border-blue-600">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between">
              <span>Blok Sipariş Bilgileri</span>
              <span className="text-sm font-normal bg-blue-100 text-blue-800 px-3 py-1 rounded-md">
                {parentOrder.orderNumber}
              </span>
            </CardTitle>
            <CardDescription>
              Bu bilgiler ana blok siparişten alınmıştır ve alt siparişe otomatik olarak aktarılacaktır.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Müşteri</p>
                <p className="font-medium">{parentOrder.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Kumaş Tipi</p>
                <p className="font-medium">{parentOrder.fabricTypeName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Toplam Miktar</p>
                <p className="font-medium">{parseInt(parentOrder.quantity).toLocaleString('tr-TR')} {parentOrder.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Kalan Bakiye</p>
                <p className="font-medium text-green-700">{maxQuantity.toLocaleString('tr-TR')} {parentOrder.unit}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Alt Sipariş Formu - Basitleştirilmiş */}
        <Card>
          <CardHeader>
            <CardTitle>Alt Sipariş Bilgileri</CardTitle>
            <CardDescription>
              Lütfen alt sipariş detaylarını girin. En fazla {maxQuantity.toLocaleString('tr-TR')} {parentOrder.unit} sipariş oluşturabilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Miktar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Miktar *</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Input
                              {...field}
                              type="number"
                              placeholder="Miktar giriniz"
                              min="1"
                              max={maxQuantity}
                              className="rounded-r-none"
                            />
                            <div className="flex items-center justify-center px-3 border border-l-0 rounded-r-md bg-gray-50">
                              {parentOrder.unit}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Renk */}
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Renk</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Renk bilgisi girin" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                          {...field}
                          placeholder="Alt sipariş için özel notlar"
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.location.href = `/sales/orders/${parentOrderId}`}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || maxQuantity <= 0}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Alt Sipariş Oluştur
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export default AddChildOrderPage;