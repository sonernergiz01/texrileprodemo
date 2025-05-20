import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar, Wrench, Clock, Check, Loader2, ArrowLeft } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { apiRequest } from "@/lib/queryClient";
import { insertMaintenancePlanSchema } from "@shared/schema";

// Form şeması
const formSchema = insertMaintenancePlanSchema.extend({
  startDate: z.date({
    required_error: "Başlangıç tarihi seçilmelidir",
  }),
  endDate: z.date({
    required_error: "Bitiş tarihi seçilmelidir",
  }),
  departmentId: z.string().transform((val) => parseInt(val)),
  assignedToId: z.string().transform((val) => parseInt(val)).optional(),
}).refine((data) => {
  return data.endDate >= data.startDate;
}, {
  message: "Bitiş tarihi, başlangıç tarihinden sonra olmalıdır",
  path: ["endDate"],
});

type FormValues = z.infer<typeof formSchema>;

export default function MaintenancePlanCreatePage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Departmanları getir
  const { data: departments = [] } = useQuery({
    queryKey: ["/api/admin/departments"],
  });

  // Kullanıcıları getir
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      frequency: "monthly", // Varsayılan
      status: "active", // Varsayılan
      startDate: undefined,
      endDate: undefined,
      departmentId: undefined,
      assignedToId: undefined
    },
  });

  // Plan oluşturma mutation
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/maintenance/plans", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Bakım planı başarıyla oluşturuldu",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance/plans"] });
      navigate("/maintenance/plans");
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Bakım planı oluşturulurken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form gönderimi
  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <PageHeader 
        title="Yeni Bakım Planı Oluştur" 
        description="Düzenli bakım planlarınızı oluşturun ve yönetin"
        icon={<Calendar className="h-6 w-6" />}
      >
        <Button variant="outline" onClick={() => navigate("/maintenance/plans")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Bakım Planlarına Dön
        </Button>
      </PageHeader>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Plan Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Adı</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: Aylık Makine Bakımı" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İlgili Departman</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Bakım departmanını seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments
                            .filter(d => [1, 3, 6, 7, 8].includes(d.id)) // Admin, Üretim, Elektrik, Mekanik, Bilgi İşlem
                            .map((department) => (
                              <SelectItem key={department.id} value={department.id.toString()}>
                                {department.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Bakım planının hangi departmana ait olduğunu seçin
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Başlangıç Tarihi</FormLabel>
                      <DatePicker
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          if (!date) return false;
                          return date < new Date();
                        }}
                        locale={tr}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Bitiş Tarihi</FormLabel>
                      <DatePicker
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          if (!date) return false;
                          const startDate = form.getValues().startDate;
                          return date < (startDate || new Date());
                        }}
                        locale={tr}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bakım Sıklığı</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sıklık seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Günlük</SelectItem>
                          <SelectItem value="weekly">Haftalık</SelectItem>
                          <SelectItem value="monthly">Aylık</SelectItem>
                          <SelectItem value="quarterly">3 Aylık</SelectItem>
                          <SelectItem value="semi-annual">6 Aylık</SelectItem>
                          <SelectItem value="annual">Yıllık</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Bakım işlemlerinin ne sıklıkta yapılacağını belirtin
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedToId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sorumlu Kişi</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sorumlu kişiyi seçin (isteğe bağlı)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Bu bakım planının sorumlusu olacak kişiyi seçin
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
                    <FormLabel>Açıklama</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Bakım planı hakkında detaylı bilgi girin"
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
                <Button variant="outline" type="button" onClick={() => navigate("/maintenance/plans")}>
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="gap-1"
                >
                  {mutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Planı Oluştur
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}