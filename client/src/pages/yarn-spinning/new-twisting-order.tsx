import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { z } from "zod";
import PageTitle from "@/components/ui/page-title";
import { Card, CardContent, CardHeader, CardDescription, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Save } from "lucide-react";
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
  assignedOperatorId: z.coerce.number().optional(),
  speed: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type TwistingOrderFormValues = z.infer<typeof twistingOrderSchema>;

const NewTwistingOrderPage: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<TwistingOrderFormValues>({
    resolver: zodResolver(twistingOrderSchema),
    defaultValues: {
      twistLevel: "normal",
      twistDirection: "Z",
      notes: "",
    },
  });

  // İplik tiplerini getir
  const { data: yarnTypes = [], isLoading: isYarnTypesLoading } = useQuery({
    queryKey: ["/api/yarn-warehouse/yarn-types"],
  });

  // İplik prosesi için makineleri getir (departmentId=3 genellikle büküm bölümüdür)
  const { data: machines = [], isLoading: isMachinesLoading } = useQuery({
    queryKey: ["/api/yarn-spinning/machines", { departmentId: 3 }],
  });

  // Üretim adımlarını getir (processTypeId=2 genellikle büküm prosesidir)
  const { data: productionSteps = [], isLoading: isStepsLoading } = useQuery({
    queryKey: ["/api/yarn-spinning/production-steps", { processTypeId: 2 }],
  });

  // Operatörleri getir
  const { data: operators = [], isLoading: isOperatorsLoading } = useQuery({
    queryKey: ["/api/admin/operators", { departmentId: 3 }],
  });

  // Sipariş oluşturma mutasyonu
  const createOrderMutation = useMutation({
    mutationFn: async (values: TwistingOrderFormValues) => {
      const response = await fetch("/api/yarn-spinning/twisting-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Sipariş oluşturulurken bir hata oluştu");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Büküm siparişi başarıyla oluşturuldu.",
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
    createOrderMutation.mutate(values);
  };

  // Veri yüklenirken loading göster
  const isLoading = isYarnTypesLoading || isMachinesLoading || isStepsLoading || isOperatorsLoading;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <PageTitle title="Yeni Büküm Siparişi" subtitle="İplik büküm siparişi oluşturma formu" />

        <Button variant="outline" onClick={() => navigate("/yarn-spinning/twisting-orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Siparişlere Geri Dön
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Büküm Siparişi Bilgileri</CardTitle>
          <CardDescription>
            Yeni bir büküm siparişi oluşturmak için aşağıdaki bilgileri doldurun.
          </CardDescription>
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
                          onValueChange={field.onChange}
                          defaultValue={field.value?.toString()}
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
                        <FormDescription>
                          Yapılacak büküm işleminin tipini seçin
                        </FormDescription>
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
                          onValueChange={field.onChange}
                          defaultValue={field.value?.toString()}
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
                        <FormDescription>
                          İşlemin yapılacağı makineyi seçin
                        </FormDescription>
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
                          onValueChange={field.onChange}
                          defaultValue={field.value?.toString()}
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
                        <FormDescription>
                          Bükülecek ipliğin tipini seçin
                        </FormDescription>
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
                          <Input placeholder="Örn: 30/1" {...field} />
                        </FormControl>
                        <FormDescription>
                          İplik numarasını girin (Ne, Nm, Dtex vb.)
                        </FormDescription>
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
                          defaultValue={field.value}
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
                        <FormDescription>
                          Büküm seviyesini seçin
                        </FormDescription>
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
                          <Input type="number" placeholder="Örn: 800" {...field} />
                        </FormControl>
                        <FormDescription>
                          Metre başına tur sayısını girin
                        </FormDescription>
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
                            defaultValue={field.value}
                            className="flex space-x-4"
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
                        <FormDescription>
                          Büküm yönünü seçin
                        </FormDescription>
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
                          <Input type="number" placeholder="Örn: 100" {...field} />
                        </FormControl>
                        <FormDescription>
                          İşlenecek toplam iplik miktarını girin
                        </FormDescription>
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
                          onValueChange={field.onChange}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Operatör seçin (opsiyonel)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                        <FormDescription>
                          İşlemi yapacak operatörü seçin
                        </FormDescription>
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
                          <Input type="number" placeholder="Örn: 8000" {...field} />
                        </FormControl>
                        <FormDescription>
                          Makine dönüş hızını girin (opsiyonel)
                        </FormDescription>
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
            disabled={createOrderMutation.isPending}
          >
            {createOrderMutation.isPending ? (
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
        </CardFooter>
      </Card>
    </div>
  );
};

export default NewTwistingOrderPage;