import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowLeft } from 'lucide-react';
import { insertOrderSchema } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { type Order } from '@shared/schema';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

// Yeni sipariş için schema
const createChildOrderSchema = insertOrderSchema.omit({
  id: true,
}).extend({
  orderType: z.literal('block_color'), // Değişiklik: child yerine block_color kullanıyoruz
  parentOrderId: z.number(), // Ana siparişin ID'si
  quantity: z.string()
    .min(1, 'Miktar zorunludur')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Miktar pozitif bir sayı olmalıdır',
    }),
});

type CreateChildOrderValues = z.infer<typeof createChildOrderSchema>;

const CreateChildOrderPage = () => {
  // URL'den parametre alırken önce params kullanıyoruz
  const params = useParams<{ id: string }>();
  // Eğer params.id undefined ise, window.location.pathname'den almaya çalışıyoruz
  const urlPath = window.location.pathname;
  const idMatch = urlPath.match(/\/sales\/create-child-order\/(\d+)/);
  // parentOrderId'yi doğru şekilde ayarlıyoruz
  const parentOrderId = params.id || (idMatch ? idMatch[1] : '');
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [maxQuantity, setMaxQuantity] = useState<number>(0);
  const [usedQuantity, setUsedQuantity] = useState<number>(0);
  
  // Ana siparişi çek
  const { data: parentOrder, isLoading: isParentOrderLoading } = useQuery<any>({
    queryKey: ['/api/orders', parseInt(parentOrderId)],
    queryFn: async ({ queryKey }) => {
      try {
        // queryKey[1] ana sipariş ID'si
        const orderId = queryKey[1];
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) throw new Error('Blok sipariş detayları alınamadı');
        return await res.json();
      } catch (error) {
        console.error("Ana sipariş verisi çekilirken hata:", error);
        throw new Error('Blok sipariş detayları alınamadı');
      }
    },
  });

  // Ana siparişe ait mevcut alt siparişleri çek
  const { data: childOrders, isLoading: isChildOrdersLoading } = useQuery<any[]>({
    queryKey: ['/api/orders', parseInt(parentOrderId), 'children'],
    queryFn: async ({ queryKey }) => {
      try {
        // queryKey[1] ana sipariş ID'si
        const parentId = queryKey[1] as number;
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error('Siparişler alınamadı');
        const orders = await res.json();
        return orders.filter((o: any) => 
          o.parentOrderId === parentId && 
          o.orderType === 'block_color'
        );
      } catch (error) {
        console.error("Alt siparişler çekilirken hata:", error);
        return [];
      }
    },
    enabled: !!parentOrderId,
  });

  useEffect(() => {
    if (parentOrder && childOrders) {
      const totalQuantity = parseInt(parentOrder.quantity || '0');
      const totalUsed = childOrders.reduce((sum: number, o: any) => sum + parseInt(o.quantity || '0'), 0);
      
      setMaxQuantity(totalQuantity - totalUsed);
      setUsedQuantity(totalUsed);
    }
  }, [parentOrder, childOrders]);

  // Form değerlerimizi TypeScript uyumlu şekilde ilklendir
  const form = useForm<CreateChildOrderValues>({
    resolver: zodResolver(createChildOrderSchema),
    // @ts-ignore: defaultValues içindeki type uyumsuzluklarını görmezden gel
    defaultValues: {
      orderType: 'block_color' as const, // Değişiklik: orderType block_color olarak güncellendi
      parentOrderId: parseInt(parentOrderId),
      customerId: parentOrder?.customerId || 0,
      fabricTypeId: parentOrder?.fabricTypeId || 0,
      quantity: '',
      unit: parentOrder?.unit || 'metre',
      orderDate: new Date().toISOString().slice(0, 10),
      dueDate: parentOrder?.dueDate || new Date().toISOString().slice(0, 10),
      notes: '',
      color: '',
      marketType: parentOrder?.marketType || 'iç',
      statusId: 1, // Beklemede
    },
  });

  // Ana sipariş yüklendiğinde form değerlerini güncelle - Daha basit hale getirildi
  useEffect(() => {
    if (parentOrder) {
      // ForEach yerine doğrudan değer atama
      // @ts-ignore: TypeScript hatasını görmezden gel
      form.setValue('parentOrderId', parseInt(parentOrderId));
      // @ts-ignore: TypeScript hatasını görmezden gel
      form.setValue('customerId', parentOrder.customerId);
      // @ts-ignore: TypeScript hatasını görmezden gel
      form.setValue('fabricTypeId', parentOrder.fabricTypeId);
      // @ts-ignore: TypeScript hatasını görmezden gel
      form.setValue('unit', parentOrder.unit);
      // @ts-ignore: TypeScript hatasını görmezden gel
      form.setValue('orderType', 'block_color');
      // @ts-ignore: TypeScript hatasını görmezden gel
      form.setValue('statusId', 1);
      // @ts-ignore: TypeScript hatasını görmezden gel
      form.setValue('orderDate', new Date().toISOString().slice(0, 10));
      // @ts-ignore: TypeScript hatasını görmezden gel
      form.setValue('dueDate', parentOrder.dueDate);
      // @ts-ignore: TypeScript hatasını görmezden gel
      form.setValue('marketType', parentOrder.marketType || 'iç');
      
      // Opsiyonel kumaş özellikleri - varsa ekle
      if (parentOrder.variant) {
        // @ts-ignore: TypeScript hatasını görmezden gel
        form.setValue('variant', parentOrder.variant);
      }
      if (parentOrder.feel) {
        // @ts-ignore: TypeScript hatasını görmezden gel
        form.setValue('feel', parentOrder.feel);
      }
      if (parentOrder.width) {
        // @ts-ignore: TypeScript hatasını görmezden gel
        form.setValue('width', parentOrder.width);
      }
      if (parentOrder.weight) {
        // @ts-ignore: TypeScript hatasını görmezden gel
        form.setValue('weight', parentOrder.weight);
      }
      if (parentOrder.blend) {
        // @ts-ignore: TypeScript hatasını görmezden gel
        form.setValue('blend', parentOrder.blend);
      }
      if (parentOrder.groupName) {
        // @ts-ignore: TypeScript hatasını görmezden gel
        form.setValue('groupName', parentOrder.groupName);
      }
      if (parentOrder.pattern) {
        // @ts-ignore: TypeScript hatasını görmezden gel
        form.setValue('pattern', parentOrder.pattern);
      }
      
      // Debug
      console.log('Form değerleri yüklendi:', {
        parentOrderId,
        customerId: parentOrder.customerId,
        fabricTypeId: parentOrder.fabricTypeId
      });
    }
  }, [parentOrder, form, parentOrderId]);

  const mutation = useMutation({
    mutationFn: async (data: CreateChildOrderValues) => {
      console.log("Gönderilen veri:", JSON.stringify(data, null, 2));
      
      // Veri doğrulama - tüm zorunlu alanların dolu olduğundan emin ol
      if (!data.quantity || !data.parentOrderId || !data.customerId || !data.fabricTypeId) {
        throw new Error("Lütfen tüm zorunlu alanları doldurun.");
      }
      
      // Kullanıcı oturumunu kontrol et
      const userCheckResponse = await fetch('/api/user', { 
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!userCheckResponse.ok) {
        console.error("Oturum hatası:", await userCheckResponse.text());
        throw new Error("Oturum doğrulanamadı. Lütfen sayfayı yenileyip tekrar giriş yapın.");
      }
      
      try {
        // Veri hazırlama - quantity'nin string olduğundan emin ol
        const formattedData = {
          ...data,
          quantity: data.quantity.toString(),
        };
        
        const response = await apiRequest('POST', '/api/orders', formattedData);
        console.log("API yanıtı:", response);
        return response;
      } catch (error) {
        console.error("API hatası:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı!',
        description: 'Alt sipariş başarıyla oluşturuldu.',
      });
      
      // Tüm sipariş verilerini yenile
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      // Ana sipariş sayfasına dön - doğrudan tarayıcı yönlendirmesi kullan
      window.location.href = `/sales/orders/${parentOrderId}`;
    },
    onError: (error: any) => {
      console.error("Mutation hatası:", error);
      toast({
        title: 'Hata!',
        description: error.message || 'Sipariş oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: CreateChildOrderValues) => {
    // Miktar kontrolü ve doğrulama - temel kontrolü güvenli hale getir
    const quantityValue = typeof values.quantity === 'string' 
      ? values.quantity 
      : String(values.quantity);
    
    if (!quantityValue || quantityValue === '') {
      toast({
        title: 'Hata!',
        description: 'Lütfen miktar alanını doldurun.',
        variant: 'destructive',
      });
      return;
    }
    
    // Miktar sayısal değere dönüştür
    const requestedQuantity = parseInt(quantityValue);
    if (isNaN(requestedQuantity) || requestedQuantity <= 0) {
      toast({
        title: 'Hata!',
        description: 'Lütfen geçerli bir miktar girin.',
        variant: 'destructive',
      });
      return;
    }
    
    // Miktar kontrolü yap
    if (requestedQuantity > maxQuantity) {
      toast({
        title: 'Hata!',
        description: `Talep edilen miktar (${requestedQuantity}) kalan bakiyeden (${maxQuantity}) fazla olamaz.`,
        variant: 'destructive',
      });
      return;
    }
  
    // Debug log
    console.log('Form değerleri:', {
      parentOrderId: values.parentOrderId,
      customerId: values.customerId,
      quantity: values.quantity,
      color: values.color || 'Belirtilmedi',
      statusId: values.statusId,
      unit: values.unit
    });
    
    // Her şey uygunsa formu gönder
    try {
      mutation.mutate(values);
    } catch (error) {
      console.error('Form gönderme hatası:', error);
      toast({
        title: 'Hata!',
        description: 'Form gönderilirken bir hata oluştu. Lütfen tekrar deneyin.',
        variant: 'destructive',
      });
    }
  };

  const isLoading = isParentOrderLoading || isChildOrdersLoading || mutation.isPending;

  if (isParentOrderLoading || isChildOrdersLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="ml-2">Sipariş bilgileri yükleniyor...</span>
        </div>
      </PageContainer>
    );
  }

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
          <Button onClick={() => navigate('/sales/orders')}>Siparişlere Dön</Button>
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
              onClick={() => navigate(`/sales/orders/${parentOrderId}`)}
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
                <p className="text-sm text-gray-500">Grup Adı</p>
                <p className="font-medium">{parentOrder.groupName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sipariş Tarihi</p>
                <p className="font-medium">{new Date(parentOrder.orderDate).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            {/* Blok Sipariş Bakiye Durumu */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-2">
              <h3 className="text-base font-semibold mb-3 text-gray-800">Blok Sipariş Bakiye Durumu</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
                  <p className="text-xs text-gray-500">Toplam Sipariş</p>
                  <p className="text-xl font-bold text-blue-700">
                    {parseInt(parentOrder.quantity).toLocaleString('tr-TR')} {parentOrder.unit}
                  </p>
                </div>
                
                <div className="p-3 bg-indigo-50 rounded-md border border-indigo-100">
                  <p className="text-xs text-gray-500">Kullanılan Miktar</p>
                  <p className="text-xl font-bold text-indigo-700">
                    {usedQuantity.toLocaleString('tr-TR')} {parentOrder.unit}
                  </p>
                </div>
                
                <div className="p-3 bg-green-50 rounded-md border border-green-100">
                  <p className="text-xs text-gray-500">Kalan Bakiye</p>
                  <p className="text-xl font-bold text-green-700">
                    {maxQuantity.toLocaleString('tr-TR')} {parentOrder.unit}
                  </p>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full" 
                  style={{ 
                    width: `${Math.min(100, (usedQuantity / parseInt(parentOrder.quantity)) * 100)}%` 
                  }}
                ></div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>Tüketim: {Math.round((usedQuantity / parseInt(parentOrder.quantity)) * 100)}%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Alt Sipariş Formu */}
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
                            {/* @ts-ignore - Tip uyumsuzluğunu görmezden gel */}
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
                  
                  {/* Renk - Blok siparişten değişebilir */}
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Renk</FormLabel>
                        <FormControl>
                          {/* @ts-ignore - Tip uyumsuzluğunu görmezden gel */}
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
                        {/* @ts-ignore - Tip uyumsuzluğunu görmezden gel */}
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
                    onClick={() => navigate(`/sales/orders/${parentOrderId}`)}
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
};

export default CreateChildOrderPage;