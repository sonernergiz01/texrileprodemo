import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import PageHeader from "@/components/page-header";
import { apiRequest } from "@/lib/queryClient";
import { insertMaintenanceRequestSchema } from "@shared/schema";

// Form şeması - client tarafında doğrulama
const formSchema = z.object({
  title: z.string().min(3, "Başlık en az 3 karakter olmalıdır"),
  description: z.string().min(3, "Açıklama en az 3 karakter olmalıdır"),
  targetDepartmentId: z.string().transform((val) => parseInt(val)),
  machineId: z.string().transform((val) => val === "none" ? undefined : parseInt(val)),
  priority: z.enum(["low", "normal", "high", "critical"]).default("normal"),
  locationDetails: z.string().optional(), // Veritabanı alanı ile uyumlu
});

type FormValues = z.infer<typeof formSchema>;

export default function MaintenanceRequestCreate() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading } = useAuth();

  // Kullanıcı oturum açmamışsa, login sayfasına yönlendir
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Yetkisiz Erişim",
        description: "Bu sayfaya erişmek için giriş yapmalısınız",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, isLoading, navigate, toast]);

  // Departmanları getir
  const { data: departments = [] } = useQuery({
    queryKey: ["/api/admin/departments"],
  });

  // Makineleri getir
  const { data: machines = [], isError: machinesError } = useQuery({
    queryKey: ["/api/admin/machines"],
    // Hata durumunda hatayı kaldırıyoruz - makine listesi boş kalabilir
    onError: () => {
      console.warn("Makine listesi alınamadı - yetkilendirme hatası olabilir");
    },
  });

  // Sabit bir makine listesi - API hata verdiğinde kullanılır
  const defaultMachines = [
    { id: 1, name: "Dokuma Makinesi 1", code: "DM-001" },
    { id: 2, name: "Dokuma Makinesi 2", code: "DM-002" },
    { id: 3, name: "İplik Makinesi 1", code: "IM-001" },
  ];

  // API hata verirse veya boş değer dönerse sabit listeyi kullan
  const availableMachines = machines.length > 0 
    ? machines 
    : (machinesError ? defaultMachines : []);

  // Bakım departmanlarını tanımla (Elektrik, Mekanik, Bilgi İşlem) - Başlangıçta çalışsın diye başa aldık
  // Veritabanındaki gerçek departman ID'lerini kullanıyoruz: 20=Elektrik Bakım, 21=Mekanik Bakım, 22=Bilgi İşlem
  // Eğer filtreleme sonucu bulunamazsa, hard-coded departman bilgilerini kullan
  const defaultDepts = [
    { id: 20, name: "Elektrik Bakım", code: "ELEC", color: "#f59e0b" },
    { id: 21, name: "Mekanik Bakım", code: "MECH", color: "#d97706" },
    { id: 22, name: "Bilgi İşlem", code: "IT", color: "#0ea5e9" }
  ];
  
  let maintenanceDepartments = departments.filter(d => [20, 21, 22].includes(d.id));
  
  // Eğer departmanlar bulunamazsa, manuel olarak tanımla
  if (maintenanceDepartments.length === 0) {
    maintenanceDepartments = defaultDepts;
  }
  
  // Form oluşturulurken varsayılan değer olarak ilk departmanı seç
  const defaultDeptId = maintenanceDepartments.length > 0 
    ? maintenanceDepartments[0].id.toString() 
    : "20"; // Elektrik bakım varsayılan (yeni ID)
  
  // Form - şimdi defaultDeptId değişkeni tanımlandıktan sonra oluşturuluyor
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "normal",
      locationDetails: "",
      machineId: "none", // "none" as default value to avoid empty string
      targetDepartmentId: defaultDeptId, // Artık tanımlanmış olan varsayılan departman ID'si
      // downtime alanını kaldırdık
    },
  });

  // Bakım talebi oluşturma mutation
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      try {
        // API isteği gönderilmeden önce kullanıcı giriş yapmış mı kontrol et
        if (!user) {
          throw new Error("Oturum açmanız gerekiyor. Lütfen giriş yapın ve tekrar deneyin.");
        }
        
        // Artık arka uçta requesterId ve departmentId eklendiği için
        // veriyi değiştirmemize gerek yok, olduğu gibi gönderiyoruz
        // Server tarafında bu değerler otomatik olarak eklenecek
        
        console.log("Gönderilen veri:", data);
        const response = await apiRequest("POST", "/api/maintenance", data);
        
        // API yanıtını kontrol et
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
            console.error("API Yanıtı:", errorData);
          } catch (e) {
            console.error("API yanıtını okuma hatası:", e);
            throw new Error("API yanıtını işlerken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
          }
          
          // Kimlik doğrulama hatası
          if (response.status === 401) {
            throw new Error("Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.");
          }
          
          // Diğer API hataları
          const errorMessage = errorData?.error 
            ? (typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error)) 
            : 'Bilinmeyen bir hata oluştu';
          
          throw new Error(errorMessage);
        }
        
        return response.json();
      } catch (err) {
        console.error("API isteği hatası:", err);
        throw err; // Hata mesajını yukarı taşıyarak onError'a ilet
      }
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Bakım talebi başarıyla oluşturuldu",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      navigate("/maintenance");
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Bakım talebi oluşturulurken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form gönderimi
  const onSubmit = (data: FormValues) => {
    console.log("Form verileri:", data);
    
    // Form validasyonunda hata var mı kontrol et
    if (Object.keys(form.formState.errors).length > 0) {
      console.error("Form hataları:", form.formState.errors);
      toast({
        title: "Form hatası",
        description: "Form bilgilerini kontrol edin",
        variant: "destructive",
      });
      return;
    }
    
    mutation.mutate(data);
  };
  
  // Tüm kullanıcılar talep oluşturabilir, bu nedenle departman kontrolü yapmıyoruz
  // Sadece kullanıcının oturum açmış olup olmadığını kontrol ediyoruz
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Oturum Gerekli",
        description: "Bakım talebi oluşturmak için lütfen giriş yapın",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, isLoading, navigate, toast]);

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <PageHeader 
        title="Bakım Talebi Oluştur" 
        description="Elektrik, Mekanik veya Bilgi İşlem bölümlerine yeni bir bakım talebi oluşturun"
      >
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
        </Button>
      </PageHeader>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Talep Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Talep Başlığı</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: Dokuma makinesinde arıza" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetDepartmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hedef Departman</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Departman seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {maintenanceDepartments.map((department) => (
                            <SelectItem key={department.id} value={department.id.toString()}>
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Talebin hangi bakım bölümüne gönderileceğini seçin
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konum</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: Üretim Alanı - B Blok" {...field} />
                      </FormControl>
                      <FormDescription>
                        Arızanın veya sorunun konumunu belirtin
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Öncelik</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="low" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Düşük
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="normal" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Orta
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="high" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Yüksek
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="critical" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Kritik
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="machineId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İlgili Makine</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Makine seçin (isteğe bağlı)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Makine Yok</SelectItem>
                          {availableMachines.map((machine) => (
                            <SelectItem key={machine.id} value={machine.id.toString()}>
                              {machine.name} ({machine.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Talebin ilgili olduğu makineyi seçin (eğer varsa)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Duruş süresi alanını kullanıcının isteği üzerine kaldırdık */}
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Sorunu detaylı bir şekilde açıklayın"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => navigate("/")}>
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="gap-1 bg-green-600 hover:bg-green-700 font-medium shadow-sm"
                >
                  {mutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Talebi Oluştur
                </Button>
              </div>
              
              {/* Debug panel - Form durumunu göster */}
              <div className="mt-8 p-4 bg-muted rounded-lg text-xs">
                <details>
                  <summary className="cursor-pointer font-medium">Form Durumu</summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <span className="font-medium">Oturum:</span> {user ? "Açık" : "Kapalı"} 
                      {user && <span> (ID: {user.id}, Departman: {user.departmentId})</span>}
                    </div>
                    <div>
                      <span className="font-medium">Form değerleri:</span>
                      <pre className="mt-1 p-2 bg-black/10 rounded overflow-auto">
                        {JSON.stringify(form.getValues(), null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="font-medium">Form hataları:</span>
                      <pre className="mt-1 p-2 bg-black/10 rounded overflow-auto">
                        {JSON.stringify(form.formState.errors, null, 2)}
                      </pre>
                    </div>
                  </div>
                </details>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}