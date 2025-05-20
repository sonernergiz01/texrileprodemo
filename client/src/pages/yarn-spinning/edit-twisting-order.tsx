import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useLocation, useParams } from "wouter";
import { z } from "zod";
import PageTitle from "@/components/ui/page-title";
import { Card, CardContent, CardHeader, CardDescription, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Save, AlertTriangle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Form şema validasyonu
const twistingOrderSchema = z.object({
  productionStepId: z.coerce.number({
    required_error: "Üretim adımı seçilmelidir",
  }),
  machineId: z.coerce.number({
    required_error: "Makine seçilmelidir",
  }),
  yarnTypeId: z.coerce.number({
    required_error: "İplik tipi seçilmelidir",
  }),
  twistLevel: z.string().optional(),
  yarnCount: z.string().min(1, "İplik numarası gereklidir"),
  twistDirection: z.enum(["S", "Z"], {
    required_error: "Büküm yönü seçilmelidir",
  }),
  twistAmount: z.coerce.number({
    required_error: "Büküm miktarı gereklidir",
  }).min(1, "Büküm miktarı pozitif olmalıdır"),
  quantity: z.coerce.number({
    required_error: "Miktar gereklidir",
  }).min(0.1, "Miktar pozitif olmalıdır"),
  assignedOperatorId: z.coerce.number().optional().nullable(),
  speed: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string(),
});

type TwistingOrderFormValues = z.infer<typeof twistingOrderSchema>;

const EditTwistingOrderPage: React.FC = () => {
  // URL'den sipariş ID'sini al
  const params = useParams<{ id: string }>();
  const orderId = parseInt(params.id || "0");
  
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<TwistingOrderFormValues>({
    resolver: zodResolver(twistingOrderSchema),
    defaultValues: {
      twistLevel: "normal",
      twistDirection: "Z",
      notes: "",
      status: "pending",
    },
  });

  // Büküm siparişini getir
  const { 
    data: orderDetails, 
    isLoading: isOrderLoading, 
    isError: isOrderError 
  } = useQuery({
    queryKey: ["/api/yarn-spinning/twisting-orders", orderId],
    enabled: orderId > 0,
  });

  // Form verilerini sipariş detaylarıyla doldur
  useEffect(() => {
    if (orderDetails) {
      form.reset({
        productionStepId: orderDetails.productionStepId,
        machineId: orderDetails.machineId,
        yarnTypeId: orderDetails.yarnTypeId,
        twistLevel: orderDetails.twistLevel || "normal",
        yarnCount: orderDetails.yarnCount,
        twistDirection: orderDetails.twistDirection,
        twistAmount: orderDetails.twistAmount,
        quantity: orderDetails.quantity,
        assignedOperatorId: orderDetails.assignedOperatorId,
        speed: orderDetails.speed,
        notes: orderDetails.notes,
        status: orderDetails.status,
      });
    }
  }, [orderDetails, form]);

  // İplik tiplerini getir
  const { data: yarnTypes = [], isLoading: isYarnTypesLoading } = useQuery({
    queryKey: ["/api/yarn-warehouse/yarn-types"],
  });

  // İplik prosesi için makineleri getir
  const { data: machines = [], isLoading: isMachinesLoading } = useQuery({
    queryKey: ["/api/yarn-spinning/machines", { departmentId: 3 }],
  });

  // Üretim adımlarını getir
  const { data: productionSteps = [], isLoading: isStepsLoading } = useQuery({
    queryKey: ["/api/yarn-spinning/production-steps", { processTypeId: 2 }],
  });

  // Operatörleri getir
  const { data: operators = [], isLoading: isOperatorsLoading } = useQuery({
    queryKey: ["/api/admin/operators", { departmentId: 3 }],
  });

  // Sipariş güncelleme mutasyonu
  const updateOrderMutation = useMutation({
    mutationFn: async (values: TwistingOrderFormValues) => {
      const response = await fetch(`/api/yarn-spinning/twisting-orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Sipariş güncellenirken bir hata oluştu");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Büküm siparişi başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-spinning/twisting-orders"] });
      navigate("/yarn-spinning/twisting-orders");
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form verilerini sunucuya gönder
  const onSubmit = (values: TwistingOrderFormValues) => {
    updateOrderMutation.mutate(values);
  };

  // Durum Badge'i
  const StatusBadge = ({ status }: { status: string }) => {
    let color;
    let text;

    switch (status) {
      case "pending":
        color = "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
        text = "Beklemede";
        break;
      case "in-progress":
        color = "bg-blue-100 text-blue-800 hover:bg-blue-200";
        text = "İşlemde";
        break;
      case "completed":
        color = "bg-green-100 text-green-800 hover:bg-green-200";
        text = "Tamamlandı";
        break;
      case "cancelled":
        color = "bg-red-100 text-red-800 hover:bg-red-200";
        text = "İptal Edildi";
        break;
      default:
        color = "bg-gray-100 text-gray-800 hover:bg-gray-200";
        text = status;
    }

    return <Badge className={cn(color)}>{text}</Badge>;
  };

  // Veri yüklenirken loading göster
  const isLoading = isYarnTypesLoading || isMachinesLoading || isStepsLoading || isOperatorsLoading || isOrderLoading;

  if (isOrderError) {
    return (
      <div className="container mx-auto py-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center">
              <AlertTriangle className="mr-2" />
              Hata
            </CardTitle>
            <CardDescription>
              Büküm siparişi bulunamadı veya yüklenirken bir hata oluştu.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/yarn-spinning/twisting-orders")}>
              Siparişlere Geri Dön
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <PageTitle 
          title={`Büküm Siparişi Düzenle #${orderId}`} 
          subtitle="İplik büküm siparişi güncelleme formu" 
        />

        <Button variant="outline" onClick={() => navigate("/yarn-spinning/twisting-orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Siparişlere Geri Dön
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Büküm Siparişi Bilgileri</CardTitle>
              <CardDescription>
                Büküm siparişini güncellemek için aşağıdaki bilgileri düzenleyin.
              </CardDescription>
            </div>
            {orderDetails && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Durum:</span>
                <StatusBadge status={orderDetails.status} />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Büküm işlem türü seçimi */}
                  <FormField
                    control={form.control}
                    name="productionStepId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Büküm İşlem Türü</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                          disabled={orderDetails?.status === "completed"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="İşlem türü seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {productionSteps.map((step: any) => (
                              <SelectItem
                                key={step.id}
                                value={step.id.toString()}
                              >
                                {step.processName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Makine seçimi */}
                  <FormField
                    control={form.control}
                    name="machineId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Büküm Makinesi</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                          disabled={orderDetails?.status === "completed"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Makine seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {machines.map((machine: any) => (
                              <SelectItem
                                key={machine.id}
                                value={machine.id.toString()}
                              >
                                {machine.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* İplik tipi seçimi */}
                  <FormField
                    control={form.control}
                    name="yarnTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İplik Tipi</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                          disabled={orderDetails?.status === "completed"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="İplik tipi seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {yarnTypes.map((yarn: any) => (
                              <SelectItem
                                key={yarn.id}
                                value={yarn.id.toString()}
                              >
                                {yarn.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* İplik numarası */}
                  <FormField
                    control={form.control}
                    name="yarnCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İplik Numarası (Ne)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Örn: 30/1" 
                            {...field} 
                            disabled={orderDetails?.status === "completed"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Büküm seviyesi */}
                  <FormField
                    control={form.control}
                    name="twistLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Büküm Seviyesi</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "normal"}
                          disabled={orderDetails?.status === "completed"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Büküm seviyesi seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Düşük</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">Yüksek</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Büküm miktarı */}
                  <FormField
                    control={form.control}
                    name="twistAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Büküm Miktarı (T/m)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Örn: 800" 
                            {...field} 
                            disabled={orderDetails?.status === "completed"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Büküm yönü */}
                  <FormField
                    control={form.control}
                    name="twistDirection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Büküm Yönü</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex space-x-4"
                            disabled={orderDetails?.status === "completed"}
                          >
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="Z" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                Z (Sağ)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="S" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                S (Sol)
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Miktar */}
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Miktar (kg)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Örn: 100" 
                            {...field} 
                            disabled={orderDetails?.status === "completed"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Operatör seçimi */}
                  <FormField
                    control={form.control}
                    name="assignedOperatorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operatör</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Operatör seçin (opsiyonel)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Operatör Seçilmedi</SelectItem>
                            {operators.map((operator: any) => (
                              <SelectItem
                                key={operator.id}
                                value={operator.id.toString()}
                              >
                                {operator.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Makine hızı */}
                  <FormField
                    control={form.control}
                    name="speed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Makine Hızı (d/dk)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Örn: 8000" 
                            {...field} 
                            value={field.value || ""} 
                            onChange={(e) => {
                              if (e.target.value === "") {
                                field.onChange(null);
                              } else {
                                field.onChange(parseFloat(e.target.value));
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Durum seçimi */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durum</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Durum seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Beklemede</SelectItem>
                            <SelectItem value="in-progress">İşlemde</SelectItem>
                            <SelectItem value="completed">Tamamlandı</SelectItem>
                            <SelectItem value="cancelled">İptal Edildi</SelectItem>
                          </SelectContent>
                        </Select>
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
                          placeholder="Sipariş ile ilgili ek notlar..."
                          className="min-h-24"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/yarn-spinning/twisting-orders")}
          >
            İptal
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={updateOrderMutation.isPending || isLoading}
          >
            {updateOrderMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Güncelleniyor...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Güncelle
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EditTwistingOrderPage;