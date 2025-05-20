import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Loader2,
  PlusCircle,
  Settings,
  User,
  Wrench,
  Tool,
  AlertTriangle,
  Edit,
  Trash2,
  CalendarCheck,
  MoreVertical,
  ChevronDown
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Bakım planı durumları için renk kodları
const statusColors = {
  active: "bg-green-100 text-green-800 border-green-300",
  completed: "bg-blue-100 text-blue-800 border-blue-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

// Bakım sıklığı metinleri
const frequencyTexts = {
  daily: "Günlük",
  weekly: "Haftalık",
  monthly: "Aylık",
  quarterly: "3 Aylık",
  "semi-annual": "6 Aylık",
  annual: "Yıllık",
};

// Öncelik renkleri
const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  normal: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function MaintenancePlanDetailPage() {
  const params = useParams();
  const planId = params.id;
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState("overview");

  // Bakım planı verilerini getir
  const {
    data: plan,
    isLoading: isPlanLoading,
    error: planError,
  } = useQuery({
    queryKey: [`/api/maintenance/plans/${planId}`],
    enabled: !!planId,
  });

  // Plan detaylarını getir
  const {
    data: planItems = [],
    isLoading: isPlanItemsLoading,
    error: planItemsError,
  } = useQuery({
    queryKey: [`/api/maintenance/plans/${planId}/items`],
    enabled: !!planId,
  });

  // Departmanları getir
  const { data: departments = [] } = useQuery({
    queryKey: ["/api/admin/departments"],
  });

  // Kullanıcıları getir
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Makineleri getir
  const { data: machines = [] } = useQuery({
    queryKey: ["/api/admin/machines"],
  });

  // Departman adını bul
  const getDepartmentName = (departmentId) => {
    const department = departments.find((d) => d.id === departmentId);
    return department ? department.name : "Bilinmeyen Departman";
  };

  // Kullanıcı adını bul
  const getUserName = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.fullName : "Bilinmeyen Kullanıcı";
  };

  // Makine adını bul
  const getMachineName = (machineId) => {
    if (!machineId) return null;
    const machine = machines.find((m) => m.id === machineId);
    return machine ? machine.name : "Bilinmeyen Makine";
  };

  // Durumu iptal etme mutasyonu
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/maintenance/plans/${planId}`, {
        status: "cancelled",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Bakım planı iptal edildi",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/maintenance/plans/${planId}`] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `İşlem sırasında bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Durumu tamamlandı olarak işaretleme mutasyonu
  const completeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/maintenance/plans/${planId}`, {
        status: "completed",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Bakım planı tamamlandı olarak işaretlendi",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/maintenance/plans/${planId}`] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `İşlem sırasında bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Yükleniyor durumu
  if (isPlanLoading || isPlanItemsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 mr-2" />
        <span>Bakım planı yükleniyor...</span>
      </div>
    );
  }

  // Hata durumu
  if (planError || planItemsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">
          Bakım planı yüklenirken bir hata oluştu
        </div>
        <div className="text-sm text-gray-600">
          {(planError || planItemsError)?.message || "Bilinmeyen hata"}
        </div>
        <Button onClick={() => navigate("/maintenance/plans")} className="mt-4">
          Bakım Planlarına Dön
        </Button>
      </div>
    );
  }

  // Plan bulunamadı durumu
  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-gray-700 mb-4">Bakım planı bulunamadı.</div>
        <Button onClick={() => navigate("/maintenance/plans")} className="mt-4">
          Bakım Planlarına Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <PageHeader
        title={plan.name}
        description={`Bakım planı detayları ve ilgili görevler`}
        icon={<Calendar className="h-6 w-6" />}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/maintenance/plans")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                İşlemler
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast({
                title: "Bildirim",
                description: "Bu özellik henüz geliştirme aşamasındadır."
              })}>
                <Edit className="h-4 w-4 mr-2" />
                Planı Düzenle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast({
                title: "Bildirim",
                description: "Bu özellik henüz geliştirme aşamasındadır."
              })}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Yeni Görev Ekle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => completeMutation.mutate()}
                disabled={plan.status === "completed" || plan.status === "cancelled"}
              >
                <Check className="h-4 w-4 mr-2 text-green-600" />
                Tamamlandı Olarak İşaretle
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  if (confirm("Bu bakım planını iptal etmek istediğinize emin misiniz?")) {
                    cancelMutation.mutate();
                  }
                }}
                disabled={plan.status === "cancelled"}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Planı İptal Et
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PageHeader>

      <div className="mt-6">
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="tasks">Bakım Görevleri</TabsTrigger>
            <TabsTrigger value="history">Geçmiş</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Plan Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Durum</p>
                      <Badge 
                        className={`mt-1 border font-medium ${statusColors[plan.status] || "bg-gray-100 text-gray-800"}`}
                      >
                        {plan.status === "active" ? "Aktif" : 
                         plan.status === "completed" ? "Tamamlandı" : 
                         plan.status === "cancelled" ? "İptal Edildi" : plan.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Departman</p>
                      <p className="mt-1 text-sm">{getDepartmentName(plan.departmentId)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Bakım Sıklığı</p>
                      <p className="mt-1 text-sm">{frequencyTexts[plan.frequency] || plan.frequency}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium text-gray-500">Açıklama</p>
                    <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                      {plan.description || "Bu bakım planı için açıklama bulunmamaktadır."}
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Oluşturan</p>
                      <div className="mt-1 flex items-center">
                        <User className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="text-sm">{getUserName(plan.createdById)}</span>
                      </div>
                    </div>
                    {plan.assignedToId && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Sorumlu</p>
                        <div className="mt-1 flex items-center">
                          <User className="h-4 w-4 mr-1 text-gray-400" />
                          <span className="text-sm">{getUserName(plan.assignedToId)}</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</p>
                      <div className="mt-1 flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="text-sm">
                          {format(new Date(plan.createdAt), "dd MMMM yyyy", { locale: tr })}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Son Güncelleme</p>
                      <div className="mt-1 flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="text-sm">
                          {format(new Date(plan.updatedAt), "dd MMMM yyyy", { locale: tr })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Zaman Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Başlangıç Tarihi</p>
                    <div className="mt-1 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-green-600" />
                      <span>
                        {format(new Date(plan.startDate), "dd MMMM yyyy", { locale: tr })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Bitiş Tarihi</p>
                    <div className="mt-1 flex items-center">
                      <CalendarCheck className="h-4 w-4 mr-2 text-red-600" />
                      <span>
                        {format(new Date(plan.endDate), "dd MMMM yyyy", { locale: tr })}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium text-gray-500">Süre</p>
                    <div className="mt-1 text-2xl font-semibold">
                      {Math.ceil(
                        (new Date(plan.endDate).getTime() - new Date(plan.startDate).getTime()) / 
                        (1000 * 60 * 60 * 24)
                      )} gün
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            {planItems.length === 0 ? (
              <Card>
                <CardContent className="py-10 flex flex-col items-center justify-center text-center">
                  <Wrench className="h-12 w-12 text-gray-300 mb-4" />
                  <CardTitle className="text-lg mb-2">Henüz Görev Eklenmemiş</CardTitle>
                  <CardDescription className="max-w-md mb-6">
                    Bu bakım planı için henüz görev eklenmemiş. Bakım görevlerini ekleyerek 
                    planınızı daha ayrıntılı hale getirebilirsiniz.
                  </CardDescription>
                  <Button variant="outline" onClick={() => toast({
                    title: "Bildirim",
                    description: "Bu özellik henüz geliştirme aşamasındadır."
                  })}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Görev Ekle
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Bakım Görevleri</CardTitle>
                  <CardDescription>
                    Bu bakım planı için oluşturulan tüm görevler
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Görev</TableHead>
                        <TableHead>Ekipman / Makine</TableHead>
                        <TableHead>Öncelik</TableHead>
                        <TableHead>Süre (dk)</TableHead>
                        <TableHead>Son İşlem</TableHead>
                        <TableHead>Sonraki İşlem</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {planItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.taskDescription}</TableCell>
                          <TableCell>
                            {item.machineId 
                              ? getMachineName(item.machineId) 
                              : item.equipmentName || "Belirtilmemiş"}
                          </TableCell>
                          <TableCell>
                            <Badge className={priorityColors[item.priority] || "bg-gray-100"}>
                              {item.priority === "low" 
                                ? "Düşük" 
                                : item.priority === "normal" 
                                ? "Normal" 
                                : item.priority === "high" 
                                ? "Yüksek" 
                                : item.priority === "critical" 
                                ? "Kritik" 
                                : item.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.estimatedTime || "-"}</TableCell>
                          <TableCell>
                            {item.lastCompleted
                              ? format(new Date(item.lastCompleted), "dd MMM yyyy", { locale: tr })
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {item.nextDue
                              ? format(new Date(item.nextDue), "dd MMM yyyy", { locale: tr })
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => toast({
                                  title: "Bildirim",
                                  description: "Bu özellik henüz geliştirme aşamasındadır."
                                })}>
                                  Görevi Görüntüle
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast({
                                  title: "Bildirim",
                                  description: "Bu özellik henüz geliştirme aşamasındadır."
                                })}>
                                  Görevi Düzenle
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast({
                                  title: "Bildirim",
                                  description: "Bu özellik henüz geliştirme aşamasındadır."
                                })}>
                                  Tamamlandı İşaretle
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex justify-between border-t px-6 py-4">
                  <div className="text-sm text-gray-500">
                    Toplam {planItems.length} görev
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toast({
                    title: "Bildirim",
                    description: "Bu özellik henüz geliştirme aşamasındadır."
                  })}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Yeni Görev Ekle
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bakım Geçmişi</CardTitle>
                <CardDescription>
                  Bu bakım planı için geçmiş işlemler ve aktiviteler
                </CardDescription>
              </CardHeader>
              <CardContent className="py-6">
                <div className="flex flex-col items-center justify-center text-center py-10">
                  <Clock className="h-12 w-12 text-gray-300 mb-4" />
                  <CardTitle className="text-lg mb-2">Geçmiş Kaydı Bulunamadı</CardTitle>
                  <CardDescription className="max-w-md">
                    Bu bakım planı için henüz bir işlem geçmişi bulunmamaktadır. 
                    Görevler tamamlandıkça burada geçmiş işlemler listelenecektir.
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}