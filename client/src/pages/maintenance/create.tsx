import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { z } from "zod";
import { insertMaintenanceRequestSchema, InsertMaintenanceRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Wrench, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Zod form şeması genişletilmiş
const formSchema = insertMaintenanceRequestSchema.extend({
  description: z.string().min(10, "Açıklama en az 10 karakter olmalıdır"),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateMaintenancePage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Mevcut kullanıcı verilerini al
  const { data: user } = useQuery<{ id: number, username: string, departmentId: number }>({
    queryKey: ["/api/user"],
  });

  // Departman verilerini al
  const { data: departments, isLoading: isDepartmentsLoading } = useQuery<{ id: number, name: string, code: string, color: string }[]>({
    queryKey: ["/api/admin/departments"],
  });

  // Makine verilerini al (sadece kullanıcının departmanına ait olanları)
  const { data: machines, isLoading: isMachinesLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/machines"],
    enabled: !!user,
  });

  // Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      departmentId: user?.departmentId || undefined,
      priority: "normal",
      status: "pending",
    },
  });

  // Bakım talebi oluşturma mutasyonu
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/maintenance", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      toast({
        title: "Bakım talebi oluşturuldu",
        description: "Bakım talebiniz başarıyla oluşturuldu.",
      });
      setLocation("/maintenance");
    },
    onError: (error: Error) => {
      toast({
        title: "Bakım talebi oluşturulamadı",
        description: error.message || "Bakım talebi oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };

  // Yükleme durumunda iskelet göster
  if (isDepartmentsLoading || isMachinesLoading) {
    return (
      <div className="container mx-auto py-10">
        <PageHeader 
          title="Bakım Talebi Oluştur" 
          description="Makine ve ekipmanlar için yeni bakım talebi oluşturun"
        />
        <div className="space-y-4 mt-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <PageHeader 
        title="Bakım Talebi Oluştur" 
        description="Makine ve ekipmanlar için yeni bakım talebi oluşturun"
        actions={
          <Button variant="outline" onClick={() => setLocation("/maintenance")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Taleplere Dön
          </Button>
        }
      />

      <div className="mt-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center">
              <Wrench className="h-5 w-5 mr-2" />
              Yeni Bakım Talebi
            </CardTitle>
          </CardHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6 pt-6">
                {/* Başlık */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bakım Talebi Başlığı</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Örn: Motor Arızası, Makine Bakımı" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Açıklama */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detaylı Açıklama</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Lütfen bakım talebiniz hakkında detaylı bilgi verin" 
                          className="min-h-32" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Departman */}
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departman</FormLabel>
                      <Select 
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Departman seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments?.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Makine/Ekipman (İsteğe bağlı) */}
                <FormField
                  control={form.control}
                  name="machineId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Makine/Ekipman (İsteğe bağlı)</FormLabel>
                      <Select 
                        value={field.value?.toString() || "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? undefined : Number(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Makine/Ekipman seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">-- Makine seçilmedi --</SelectItem>
                          {machines?.map((machine) => (
                            <SelectItem key={machine.id} value={machine.id.toString()}>
                              {machine.name} {machine.code ? `(${machine.code})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Öncelik */}
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Öncelik</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-4 flex-wrap"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="low" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">Düşük</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="normal" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">Normal</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="high" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">Yüksek</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="critical" />
                            </FormControl>
                            <FormLabel className="flex items-center font-normal cursor-pointer text-red-500">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Kritik
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              
              <CardFooter className="flex justify-between border-t p-6">
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/maintenance")}
                  type="button"
                >
                  İptal
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Oluşturuluyor..." : "Bakım Talebi Oluştur"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}