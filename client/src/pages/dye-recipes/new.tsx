import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { TestTube, ArrowLeft, Save, PlusCircle, Trash2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/layout/page-header";

import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Form şeması
const formSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  code: z.string().min(2, "Kod en az 2 karakter olmalıdır"),
  recipeType: z.enum(["fabric", "yarn"], {
    required_error: "Reçete tipi seçilmelidir",
  }),
  forOrderId: z.number().optional().nullable(),
  description: z.string().optional(),
  fabricType: z.string().optional(),
  yarnType: z.string().optional(),
  color: z.string().optional(),
  temperature: z.string().optional(),
  bathRatio: z.string().optional(),
  machineType: z.string().optional(),
  notes: z.string().optional(),
  isTemplate: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

// Yeni reçete oluşturma sayfası
const DyeRecipeNew = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // Form tanımlama
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      recipeType: "fabric",
      forOrderId: null,
      description: "",
      fabricType: "",
      yarnType: "",
      color: "",
      temperature: "",
      bathRatio: "",
      machineType: "",
      notes: "",
      isTemplate: false,
    },
  });

  // Siparişleri getirme
  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const response = await fetch("/api/orders?status=active");
      if (!response.ok) {
        throw new Error("Siparişler yüklenirken hata oluştu");
      }
      return response.json();
    },
  });

  // Form gönderme
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await apiRequest("POST", "/api/dye-recipes", values);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reçete oluşturuldu",
        description: "Yeni boya reçetesi başarıyla oluşturuldu",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dye-recipes"] });
      navigate(`/dye-recipes/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Reçete oluşturulurken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  const recipeType = form.watch("recipeType");

  return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <div className="flex items-center">
            <TestTube className="h-6 w-6 text-cyan-600 mr-2" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Yeni Boya Reçetesi</h1>
              <p className="text-muted-foreground">Yeni bir boya reçetesi oluşturun</p>
            </div>
          </div>
        </div>

        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" asChild className="mr-2">
            <Link href="/dye-recipes/list">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri
            </Link>
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reçete Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reçete Adı*</FormLabel>
                        <FormControl>
                          <Input placeholder="Reçete adı girin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reçete Kodu*</FormLabel>
                        <FormControl>
                          <Input placeholder="Reçete kodu girin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recipeType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reçete Tipi*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Reçete tipi seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fabric">Kumaş</SelectItem>
                            <SelectItem value="yarn">İplik</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="forOrderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sipariş</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value) || null)}
                          value={field.value?.toString() || "no-selection"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sipariş seçin (opsiyonel)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="no-selection">Sipariş Seçin</SelectItem>
                            {orders?.map((order) => (
                              <SelectItem key={order.id} value={order.id.toString()}>
                                {order.orderNumber} - {order.customerName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Reçetenin uygulanacağı sipariş
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reçete Açıklaması</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Reçete hakkında açıklama girin"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recipeType === "fabric" && (
                    <FormField
                      control={form.control}
                      name="fabricType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kumaş Tipi</FormLabel>
                          <FormControl>
                            <Input placeholder="Kumaş tipi girin" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {recipeType === "yarn" && (
                    <FormField
                      control={form.control}
                      name="yarnType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>İplik Tipi</FormLabel>
                          <FormControl>
                            <Input placeholder="İplik tipi girin" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Renk</FormLabel>
                        <FormControl>
                          <Input placeholder="Renk kodu girin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="temperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sıcaklık</FormLabel>
                        <FormControl>
                          <Input placeholder="Sıcaklık girin (°C)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="bathRatio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banyo Oranı</FormLabel>
                        <FormControl>
                          <Input placeholder="Banyo oranı girin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="machineType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Makine Tipi</FormLabel>
                        <FormControl>
                          <Input placeholder="Makine tipi girin" {...field} />
                        </FormControl>
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
                        <Textarea
                          placeholder="Reçete için ek notlar girin"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isTemplate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Şablon Olarak Kaydet</FormLabel>
                        <FormDescription>
                          Bu reçeteyi gelecekte kullanmak üzere şablon olarak kaydet
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                className="min-w-[150px]"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⌛</span>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Reçeteyi Kaydet
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

  );
};

export default DyeRecipeNew;