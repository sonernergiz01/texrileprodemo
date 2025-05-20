import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRoute, Link, useLocation } from "wouter";
import { z } from "zod";
import { MaintenanceRequest, MaintenanceActivity, insertMaintenanceActivitySchema, InsertMaintenanceActivity } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Pencil, 
  CornerDownRight, 
  Settings, 
  RotateCcw, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  ClipboardList,
  FileText,
  MessageSquare
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

// Aktivite form şeması
const activityFormSchema = insertMaintenanceActivitySchema.extend({
  description: z.string().min(5, "Açıklama en az 5 karakter olmalıdır"),
});

type ActivityFormValues = z.infer<typeof activityFormSchema>;

const statusColors: Record<string, string> = {
  "pending": "bg-yellow-200 text-yellow-800 hover:bg-yellow-300",
  "in-progress": "bg-blue-200 text-blue-800 hover:bg-blue-300",
  "completed": "bg-green-200 text-green-800 hover:bg-green-300",
  "cancelled": "bg-gray-200 text-gray-800 hover:bg-gray-300",
};

const priorityColors: Record<string, string> = {
  "low": "bg-slate-200 text-slate-800",
  "normal": "bg-blue-200 text-blue-800",
  "high": "bg-orange-200 text-orange-800",
  "critical": "bg-red-200 text-red-800"
};

const priorityIcons: Record<string, React.ReactNode> = {
  "low": <Settings className="h-4 w-4 mr-1" />,
  "normal": <RotateCcw className="h-4 w-4 mr-1" />,
  "high": <Clock className="h-4 w-4 mr-1" />,
  "critical": <AlertTriangle className="h-4 w-4 mr-1" />
};

export default function MaintenanceDetailPage() {
  const [match, params] = useRoute<{ id: string }>("/maintenance/:id");
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Mevcut kullanıcı verilerini al
  const { data: user } = useQuery<{ id: number, username: string, departmentId: number }>({
    queryKey: ["/api/user"],
  });

  // Bakım talebini al
  const { 
    data: maintenanceRequest, 
    isLoading: isRequestLoading,
    isError: isRequestError,
    refetch: refetchRequest 
  } = useQuery<MaintenanceRequest>({
    queryKey: ["/api/maintenance", Number(params?.id)],
    enabled: !!params?.id,
  });

  // Bakım talebi aktivitelerini al
  const { 
    data: activities, 
    isLoading: isActivitiesLoading,
    isError: isActivitiesError,
    refetch: refetchActivities 
  } = useQuery<MaintenanceActivity[]>({
    queryKey: ["/api/maintenance", Number(params?.id), "activities"],
    enabled: !!params?.id,
  });

  // Departman verilerini al - Admin yetkisi gerektirmeden 
  const { data: departments } = useQuery<{ id: number, name: string, code: string, color: string }[]>({
    queryKey: ["/api/admin/departments"],
    enabled: !!maintenanceRequest,
  });

  // Kullanıcı verilerini doğrudan API'den al (Admin yetkisi gerektirmeden)
  // NOT: API endpointi "/users"den "/all-users"a değiştirildi - çakışma sorunu nedeniyle
  const { data: maintUsers } = useQuery<{ id: number, username: string, fullName: string }[]>({
    queryKey: ["/api/maintenance/all-users"],
    enabled: !!params?.id,
  });

  // Departman ve kullanıcı bilgilerini çek
  const department = useMemo(() => {
    if (!departments || !maintenanceRequest) return null;
    return departments.find(d => d.id === maintenanceRequest.departmentId);
  }, [departments, maintenanceRequest]);
  
  const requester = useMemo(() => {
    if (!maintUsers || !maintenanceRequest) return null;
    return maintUsers.find(u => u.id === maintenanceRequest.requesterId);
  }, [maintUsers, maintenanceRequest]);
  
  const assignee = useMemo(() => {
    if (!maintUsers || !maintenanceRequest) return null;
    return maintUsers.find(u => u.id === maintenanceRequest.assignedToId);
  }, [maintUsers, maintenanceRequest]);

  // Aktivite form
  const activityForm = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      activityType: "comment",
      description: "",
    },
  });

  // Durum güncelleme form
  const statusDefaultValue = useMemo(() => {
    return { status: "pending" };
  }, []);
  
  const statusUpdateForm = useForm<{ status: string }>({
    defaultValues: statusDefaultValue,
  });

  // Atama form
  const assignmentDefaultValue = useMemo(() => {
    return { assignedToId: null };
  }, []);
  
  const assignmentForm = useForm<{ assignedToId: number | null | string }>({
    defaultValues: assignmentDefaultValue,
  });

  // Form değerlerini güncelle 
  useEffect(() => {
    if (maintenanceRequest) {
      statusUpdateForm.setValue("status", maintenanceRequest.status);
      assignmentForm.setValue("assignedToId", maintenanceRequest.assignedToId || null);
    }
  }, [maintenanceRequest, statusUpdateForm, assignmentForm]);

  // Form işlemleri
  const onSubmitActivity = useCallback((data: ActivityFormValues) => {
    addActivityMutation.mutate(data);
  }, []);

  const onSubmitStatusUpdate = useCallback((data: { status: string }) => {
    updateStatusMutation.mutate(data);
  }, []);

  const onSubmitAssignment = useCallback((data: { assignedToId: number | null | string }) => {
    // "none" değerini null olarak işle
    const payload = {
      assignedToId: data.assignedToId === "none" ? null : Number(data.assignedToId)
    };
    assignMutation.mutate(payload);
  }, []);

  // Aktivite ekleme mutasyonu
  const addActivityMutation = useMutation({
    mutationFn: async (data: ActivityFormValues) => {
      const response = await apiRequest("POST", `/api/maintenance/${params?.id}/activities`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance", Number(params?.id), "activities"] });
      activityForm.reset({ activityType: "comment", description: "" });
      toast({
        title: "Aktivite eklendi",
        description: "Bakım talebi aktivitesi başarıyla eklendi.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Aktivite eklenemedi",
        description: error.message || "Aktivite eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  // Durum güncelleme mutasyonu
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { status: string }) => {
      const response = await apiRequest("PATCH", `/api/maintenance/${params?.id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance", Number(params?.id)] });
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      toast({
        title: "Durum güncellendi",
        description: "Bakım talebi durumu başarıyla güncellendi.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Durum güncellenemedi",
        description: error.message || "Durum güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  // Atama mutasyonu
  const assignMutation = useMutation({
    mutationFn: async (data: { assignedToId: number | null }) => {
      const response = await apiRequest("PATCH", `/api/maintenance/${params?.id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance", Number(params?.id)] });
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      toast({
        title: "Atama güncellendi",
        description: "Bakım talebi ataması başarıyla güncellendi.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Atama güncellenemedi",
        description: error.message || "Atama güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  // Hata durumunu ele al
  if (isRequestError || isActivitiesError) {
    return (
      <div className="container mx-auto py-10">
        <PageHeader 
          title="Bakım Talebi Detayları" 
          description="Bakım talebi detayları yüklenirken bir hata oluştu."
          actions={
            <Button onClick={() => {
              refetchRequest();
              refetchActivities();
            }}>
              Yeniden Dene
            </Button>
          }
        />
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          <p>Bakım talebi bilgileri yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>
        </div>
      </div>
    );
  }

  // Eğer ID yoksa
  if (!params?.id) {
    return (
      <div className="container mx-auto py-10">
        <PageHeader 
          title="Bakım Talebi Detayları" 
          description="Geçersiz bakım talebi ID'si"
        />
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mt-4">
          <p>Geçersiz veya eksik bakım talebi ID'si. Lütfen geçerli bir bakım talebi seçin.</p>
          <Button onClick={() => setLocation("/maintenance")} className="mt-2">
            Bakım Taleplerine Dön
          </Button>
        </div>
      </div>
    );
  }

  // Yükleme durumunda iskelet göster
  if (isRequestLoading || isActivitiesLoading) {
    return (
      <div className="container mx-auto py-10">
        <PageHeader 
          title="Bakım Talebi Detayları" 
          description="Bakım talebi detayları yükleniyor..."
        />
        <div className="space-y-4 mt-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  // Talep bulunamadıysa
  if (!maintenanceRequest) {
    return (
      <div className="container mx-auto py-10">
        <PageHeader 
          title="Bakım Talebi Detayları" 
          description="Bakım talebi bulunamadı"
          actions={
            <Button variant="outline" onClick={() => setLocation("/maintenance")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Taleplere Dön
            </Button>
          }
        />
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mt-4">
          <p>İstenen bakım talebi bulunamadı. Talep silinmiş veya erişim izniniz olmayabilir.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <PageHeader 
        title="Bakım Talebi Detayları" 
        description={`#${maintenanceRequest.id} numaralı bakım talebi`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation("/maintenance")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Taleplere Dön
            </Button>
            <Button onClick={() => setIsEditing(!isEditing)}>
              <Pencil className="h-4 w-4 mr-2" />
              {isEditing ? "Düzenlemeyi İptal Et" : "Düzenle"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Sol Sütun - Detaylar */}
        <div className="md:col-span-2">
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="details">
                <FileText className="h-4 w-4 mr-2" />
                Detaylar
              </TabsTrigger>
              <TabsTrigger value="activities">
                <ClipboardList className="h-4 w-4 mr-2" />
                Aktiviteler {activities?.length ? `(${activities.length})` : ""}
              </TabsTrigger>
            </TabsList>

            {/* Detaylar Sekmesi */}
            <TabsContent value="details" className="mt-0">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold">{maintenanceRequest.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {requester ? requester.fullName : `Kullanıcı #${maintenanceRequest.requesterId}`} tarafından {maintenanceRequest.requestDate ? format(new Date(maintenanceRequest.requestDate), "dd.MM.yyyy HH:mm") : "belirsiz tarihte"} oluşturuldu
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge className={priorityColors[maintenanceRequest.priority]}>
                        {priorityIcons[maintenanceRequest.priority]}
                        {maintenanceRequest.priority === "low" ? "Düşük Öncelik" :
                         maintenanceRequest.priority === "normal" ? "Normal Öncelik" :
                         maintenanceRequest.priority === "high" ? "Yüksek Öncelik" :
                         maintenanceRequest.priority === "critical" ? "Kritik Öncelik" : maintenanceRequest.priority}
                      </Badge>
                      <Badge className={statusColors[maintenanceRequest.status]}>
                        {maintenanceRequest.status === "pending" ? "Beklemede" :
                         maintenanceRequest.status === "in-progress" ? "Devam Ediyor" :
                         maintenanceRequest.status === "completed" ? "Tamamlandı" :
                         maintenanceRequest.status === "cancelled" ? "İptal Edildi" : maintenanceRequest.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Departman</h3>
                      <p>{department ? department.name : `Departman #${maintenanceRequest.departmentId}`}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Atanan Kişi</h3>
                      <p>{assignee ? assignee.fullName : "Henüz atanmadı"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Makine ID</h3>
                      <p>{maintenanceRequest.machineId || "Belirtilmedi"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Oluşturma Tarihi</h3>
                      <p>{maintenanceRequest.requestDate ? format(new Date(maintenanceRequest.requestDate), "dd.MM.yyyy HH:mm") : "Belirsiz"}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Açıklama</h3>
                    <div className="p-4 bg-gray-50 rounded-md whitespace-pre-line">
                      {maintenanceRequest.description}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aktiviteler Sekmesi */}
            <TabsContent value="activities" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Aktiviteler ve Yorumlar</CardTitle>
                </CardHeader>
                <CardContent>
                  {activities && activities.length > 0 ? (
                    <div className="space-y-4">
                      {activities.map((activity) => {
                        const activityUser = maintUsers?.find(u => u.id === activity.createdById);
                        return (
                          <div key={activity.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                            <div className="flex justify-between items-start mb-1">
                              <div className="flex items-center">
                                <CornerDownRight className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="font-medium">
                                  {activityUser ? activityUser.fullName : `Kullanıcı #${activity.createdById}`}
                                </span>
                                <Badge className="ml-2" variant="outline">
                                  {activity.activityType === "comment" ? "Yorum" :
                                   activity.activityType === "status_change" ? "Durum Değişikliği" :
                                   activity.activityType === "assignment" ? "Atama Değişikliği" :
                                   activity.activityType === "work_log" ? "İş Kaydı" : activity.activityType}
                                </Badge>
                              </div>
                              <span className="text-sm text-gray-500">
                                {activity.createdAt ? format(new Date(activity.createdAt), "dd.MM.yyyy HH:mm") : "Belirsiz tarih"}
                              </span>
                            </div>
                            <div className="ml-6 mt-1 whitespace-pre-line">
                              {activity.description}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p>Henüz aktivite bulunmuyor</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Form {...activityForm}>
                    <form onSubmit={activityForm.handleSubmit(onSubmitActivity)} className="w-full space-y-4">
                      <FormField
                        control={activityForm.control}
                        name="activityType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Aktivite Tipi</FormLabel>
                            <Select 
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Aktivite tipi seçin" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="comment">Yorum</SelectItem>
                                <SelectItem value="work_log">İş Kaydı</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={activityForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Açıklama</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Aktivite açıklaması..." 
                                className="min-h-24" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={addActivityMutation.isPending}
                      >
                        {addActivityMutation.isPending ? "Ekleniyor..." : "Aktivite Ekle"}
                      </Button>
                    </form>
                  </Form>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sağ Sütun - Aksiyonlar ve Durum */}
        <div>
          <div className="space-y-4">
            {/* Durum Kartı */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Durum</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Badge className={`text-sm ${statusColors[maintenanceRequest.status]}`}>
                    {maintenanceRequest.status === "pending" ? "Beklemede" :
                     maintenanceRequest.status === "in-progress" ? "Devam Ediyor" :
                     maintenanceRequest.status === "completed" ? "Tamamlandı" :
                     maintenanceRequest.status === "cancelled" ? "İptal Edildi" : maintenanceRequest.status}
                  </Badge>
                </div>
                
                {isEditing && (
                  <Form {...statusUpdateForm}>
                    <form onSubmit={statusUpdateForm.handleSubmit(onSubmitStatusUpdate)}>
                      <FormField
                        control={statusUpdateForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Durum Güncelle</FormLabel>
                            <Select 
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Durum seçin" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pending">Beklemede</SelectItem>
                                <SelectItem value="in-progress">Devam Ediyor</SelectItem>
                                <SelectItem value="completed">Tamamlandı</SelectItem>
                                <SelectItem value="cancelled">İptal Edildi</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="mt-4 w-full"
                        disabled={updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending ? "Güncelleniyor..." : "Durumu Güncelle"}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>

            {/* Atama Kartı */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Atama</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  {assignee ? (
                    <div>
                      <p className="font-medium">{assignee.fullName}</p>
                      <p className="text-sm text-gray-500">{assignee.username}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Henüz kimseye atanmadı</p>
                  )}
                </div>
                
                {isEditing && (
                  <Form {...assignmentForm}>
                    <form onSubmit={assignmentForm.handleSubmit(onSubmitAssignment)}>
                      <FormField
                        control={assignmentForm.control}
                        name="assignedToId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Atanacak Kişi</FormLabel>
                            <Select 
                              value={field.value?.toString() || ""}
                              onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Kişi seçin" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Kimseye Atanmasın</SelectItem>
                                {maintUsers?.map((u) => (
                                  <SelectItem key={u.id} value={u.id.toString()}>
                                    {u.fullName} ({u.username})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="mt-4 w-full"
                        disabled={assignMutation.isPending}
                      >
                        {assignMutation.isPending ? "Güncelleniyor..." : "Atamayı Güncelle"}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>

            {/* Bilgiler Kartı */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Talep Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Talep Eden</p>
                  <p>{requester ? requester.fullName : `Kullanıcı #${maintenanceRequest.requesterId}`}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Departman</p>
                  <p>{department ? department.name : `Departman #${maintenanceRequest.departmentId}`}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Öncelik</p>
                  <Badge className={`mt-1 ${priorityColors[maintenanceRequest.priority]}`}>
                    {priorityIcons[maintenanceRequest.priority]}
                    {maintenanceRequest.priority === "low" ? "Düşük" :
                     maintenanceRequest.priority === "normal" ? "Normal" :
                     maintenanceRequest.priority === "high" ? "Yüksek" :
                     maintenanceRequest.priority === "critical" ? "Kritik" : maintenanceRequest.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Talep Tarihi</p>
                  <p>{maintenanceRequest.requestDate ? format(new Date(maintenanceRequest.requestDate), "dd.MM.yyyy HH:mm") : "Belirsiz"}</p>
                </div>
                {maintenanceRequest.completionDate && (
                  <div>
                    <p className="text-sm text-gray-500">Tamamlanma Tarihi</p>
                    <p>{maintenanceRequest.completionDate ? format(new Date(maintenanceRequest.completionDate), "dd.MM.yyyy HH:mm") : "Belirsiz"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}