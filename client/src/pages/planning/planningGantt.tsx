/**
 * Planlama Gantt Şeması
 * Bu sayfa, üretim planlamalarını görsel olarak göstermek, düzenlemek ve yönetmek için Gantt şeması sunar.
 * Sürükle-bırak özellikleri ile planlamaları kolayca değiştirebilirsiniz.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { format, addDays, parseISO, differenceInDays, startOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

// UI Bileşenleri
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, Plus, Search, RefreshCcw, Filter, Calendar, 
  ArrowLeft, ArrowRight, Check, X, Users2, Layers,
  Clock, ClipboardList, MessageSquare, Save, Edit, Trash2
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// Gantt Chart Bileşenleri ve Stiller
const TASK_COLORS = {
  "not-started": "bg-gray-200 border-gray-400",
  "inProgress": "bg-blue-100 border-blue-400",
  "pending": "bg-yellow-100 border-yellow-400",
  "completed": "bg-green-100 border-green-400",
  "delayed": "bg-red-100 border-red-400",
  "Beklemede": "bg-yellow-100 border-yellow-400",
  "Devam Ediyor": "bg-blue-100 border-blue-400",
  "Tamamlandı": "bg-green-100 border-green-400",
  "Gecikti": "bg-red-100 border-red-400"
};

const STATUS_BADGES = {
  "not-started": <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">Başlamadı</Badge>,
  "inProgress": <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Devam Ediyor</Badge>,
  "pending": <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Beklemede</Badge>,
  "completed": <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Tamamlandı</Badge>,
  "delayed": <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Gecikti</Badge>,
  "Beklemede": <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Beklemede</Badge>,
  "Devam Ediyor": <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Devam Ediyor</Badge>,
  "Tamamlandı": <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Tamamlandı</Badge>,
  "Gecikti": <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Gecikti</Badge>,
};

interface Task {
  id: string;
  productionPlanId: number;
  processTypeId: number;
  stepOrder: number;
  departmentId: number;
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate?: Date | null;
  actualEndDate?: Date | null;
  machineId?: number | null;
  status: string;
  notes?: string | null;
  departmentName: string;
  title?: string; // İşlem tipi ve departman adından oluşturulacak
  startDate?: Date; // Gantt şeması için plannedStartDate'in karşılığı
  endDate?: Date; // Gantt şeması için plannedEndDate'in karşılığı
  department?: string; // Gantt şeması için departmentId'nin karşılığı
  customerName?: string; // Müşteri adı
  fabricName?: string; // Kumaş adı
}

interface Department {
  id: number;
  name: string;
}

interface ProductionPlan {
  id: number;
  planNo: string;
  orderNumber: string;
  description: string;
  productionStartDate: string;
  productionEndDate: string;
  status: string;
}

export default function PlanningGantt() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: addDays(new Date(), 14),
  });
  const [currentTab, setCurrentTab] = useState("timeline");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  // Görev detayları için dialog durumu
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskNotes, setTaskNotes] = useState<string>("");
  const [taskStatus, setTaskStatus] = useState<string>("");
  const [taskStartDate, setTaskStartDate] = useState<Date | undefined>(undefined);
  const [taskEndDate, setTaskEndDate] = useState<Date | undefined>(undefined);

  // Verileri çekme
  const { data: departments, isLoading: deptsLoading } = useQuery({
    queryKey: ["/api/admin/departments"],
    select: (data) => data as Department[],
  });

  // Sipariş bilgilerini almak için ek bir sorgu
  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
    select: (data) => data as any[],
  });

  // Kumaş tiplerini almak için sorgu
  const { data: fabricTypes } = useQuery({
    queryKey: ["/api/fabric-types"],
    select: (data) => data as any[],
  });

  // Üretim planları için ek detaylar
  // Önce kumaş tiplerini çek
  const fabricTypesQuery = useQuery({
    queryKey: ["/api/fabric-types"],
    select: (data) => data as any[]
  });

  // Üretim planlarını çek
  const { data: productionPlans, isLoading: productionPlansLoading } = useQuery({
    queryKey: ["/api/planning/production-plans"],
    select: (data) => data as any[],
  });

  // Planları çek ve sipariş/kumaş bilgileriyle zenginleştir
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/planning/plans"],
    select: (data) => {
      if (!data || !Array.isArray(data)) return [] as ProductionPlan[];
      
      // Plan verilerini sipariş bilgileriyle zenginleştir
      return (data as any[]).map(plan => {
        // Plan'a ait siparişi bul
        const relatedOrder = orders?.find(order => 
          order.orderNumber === plan.orderNumber
        );
        
        // Siparişe ait kumaş tipini bul
        let fabricName = "Kumaş bilgisi yok";
        if (relatedOrder?.fabricTypeId && fabricTypesQuery.data) {
          const fabricType = fabricTypesQuery.data.find(ft => ft.id === relatedOrder.fabricTypeId);
          if (fabricType) {
            fabricName = fabricType.name;
          }
        }
        
        return {
          ...plan,
          // Siparişten müşteri ve kumaş bilgilerini ekle
          customerName: relatedOrder?.customerName || "Müşteri bilgisi yok",
          fabricName: fabricName
        };
      }) as ProductionPlan[];
    },
    enabled: !!orders && !!fabricTypesQuery.data // Sadece sipariş ve kumaş verileri hazır olduğunda çalıştır
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/planning/tasks", selectedPlan],
    select: (data) => {
      const selectedPlanData = productionPlans?.find(p => p.id.toString() === selectedPlan);
      const orderData = selectedPlanData ? orders?.find(o => o.orderNumber === selectedPlanData.orderNumber) : null;
      
      // Siparişe ait kumaş tipini bul
      let fabricName = "Kumaş bilgisi yok";
      if (orderData?.fabricTypeId && fabricTypesQuery.data) {
        const fabricType = fabricTypesQuery.data.find(ft => ft.id === orderData.fabricTypeId);
        if (fabricType) {
          fabricName = fabricType.name;
        }
      }
      
      console.log("Sipariş verileri:", orderData);
      console.log("Kumaş bilgisi (task):", fabricName);
      console.log("Kumaş tipleri:", fabricTypesQuery.data);
      
      return (data || []).map((task: any) => ({
        ...task,
        id: task.id.toString(),
        // API'den gelen verileri bileşen için uygun hale getiriyoruz
        title: `${task.processTypeId}. Adım: ${task.departmentName}`,
        startDate: new Date(task.plannedStartDate),
        endDate: new Date(task.plannedEndDate),
        department: task.departmentId.toString(),
        customerName: orderData?.customerName || "Müşteri bilgisi yok",
        fabricName: fabricName
      })) as Task[];
    },
    enabled: !!selectedPlan,
  });

  // Görev Güncelleme Mutasyonu
  const updateTaskMutation = useMutation({
    mutationFn: async (taskData: Partial<Task> & { id: string }) => {
      // API'ye gönderilecek veriyi task tipinden plannedStartDate/plannedEndDate tipine dönüştür
      const apiData = {
        ...taskData,
        plannedStartDate: taskData.startDate,
        plannedEndDate: taskData.endDate,
        // API'nin beklediği diğer alanları ekle
      };
      
      return await apiRequest("PATCH", `/api/planning/tasks/${taskData.id}`, apiData);
    },
    onSuccess: () => {
      toast({
        title: "Görev güncellendi",
        description: "Görev başarıyla güncellendi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/planning/tasks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Görev güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Tarih değişikliği işlevi - sürükle-bırak geçici olarak devre dışı bırakıldı
  const updateTaskDate = (taskId: string, newStartDate: Date, newEndDate: Date) => {
    if (!tasks) return;
    
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) return;
    
    updateTaskMutation.mutate({
      id: taskId,
      startDate: newStartDate,
      endDate: newEndDate
    });
  };
  
  // Sürükle-bırak işlevselliği - şimdilik basitleştirildi
  const handleDragEnd = (result: any) => {
    console.log("Sürükle-bırak işlevi geçici olarak devre dışı bırakıldı");
    // Şu an için basit bir günlük mesajı
  };

  // Gantt Şeması için tarih aralıklarını hesaplama
  const calculateDateRange = () => {
    if (!tasks || tasks.length === 0) return [];
    
    const dates = [];
    let currentDate = startOfDay(dateRange.startDate);
    const endDate = startOfDay(dateRange.endDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    
    return dates;
  };

  // Gantt Şeması için görevi çizme - geliştirilmiş sürüm
  // Göreve tıklama olayını işle
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskNotes(task.notes || "");
    setTaskStatus(task.status);
    setTaskStartDate(task.startDate);
    setTaskEndDate(task.endDate);
    setIsTaskDialogOpen(true);
  };
  
  // Görev güncelleme işlemi
  const handleSaveTask = () => {
    if (!selectedTask) return;
    
    updateTaskMutation.mutate({
      id: selectedTask.id,
      status: taskStatus,
      notes: taskNotes,
      startDate: taskStartDate,
      endDate: taskEndDate
    });
    
    setIsTaskDialogOpen(false);
  };
  
  // Gantt Şeması için görevi çizme - geliştirilmiş sürüm
  const renderTaskOnGantt = (task: Task, dates: Date[]) => {
    if (!task.startDate || !task.endDate) return null;
    
    const startDate = startOfDay(task.startDate);
    const endDate = startOfDay(task.endDate);
    
    // Görüntülenen tarih aralığındaki görev konumunu hesapla
    const startDateIndex = dates.findIndex(date => 
      startOfDay(date).getTime() === startOfDay(startDate).getTime()
    );
    
    if (startDateIndex === -1) return null;
    
    const taskDuration = differenceInDays(endDate, startDate) + 1;
    const taskWidth = `${taskDuration * 100}%`;
    
    // Doğru CSS sınıfını seç, eğer yoksa varsayılan kullan
    const colorClass = task.status && TASK_COLORS[task.status] 
      ? TASK_COLORS[task.status] 
      : "bg-gray-200 border-gray-400";
      
    // Tamamlanmış görevler için ilerleme çubuğunu belirle
    const isCompleted = task.status === "completed" || task.status === "Tamamlandı";
    const isInProgress = task.status === "inProgress" || task.status === "Devam Ediyor";
    
    // Gerçek ilerleme hesaplama (eğer başlangıç ve bitiş tarihleri varsa)
    let progressPercent = 0;
    if (task.actualStartDate) {
      if (task.actualEndDate) {
        progressPercent = 100; // Tamamlanmış
      } else {
        // Şu ana kadar geçen süreyi hesapla
        const totalPlannedDuration = differenceInDays(task.plannedEndDate, task.plannedStartDate);
        const elapsedDuration = differenceInDays(new Date(), task.actualStartDate);
        progressPercent = Math.min(Math.round((elapsedDuration / totalPlannedDuration) * 100), 100);
      }
    }
    
    // Çakışma durumunu kontrol et (görev tarihleri arasında bugün varsa)
    const today = startOfDay(new Date());
    const isActive = startOfDay(task.startDate).getTime() <= today.getTime() && 
                     startOfDay(task.endDate).getTime() >= today.getTime();
    
    // Gecikmiş görev durumunu kontrol et (bitiş tarihi geçmiş ve tamamlanmamış)
    const isDelayed = startOfDay(task.endDate).getTime() < today.getTime() && 
                      !isCompleted && 
                      (task.status !== "cancelled" && task.status !== "İptal Edildi");
    
    return (
      <div 
        className={`absolute h-full ${colorClass} border rounded-md p-1 text-xs font-medium overflow-hidden 
                    hover:shadow-md transition-all cursor-pointer
                    ${isActive ? 'ring-2 ring-offset-1 ring-blue-400' : ''}
                    ${isDelayed ? 'ring-2 ring-red-400' : ''}
                   `}
        style={{
          left: `${startDateIndex * 100}%`,
          width: taskWidth,
          maxWidth: `${dates.length * 100}%`,
          zIndex: isActive ? 20 : 10,
        }}
        onClick={() => handleTaskClick(task)}
        title={`${task.title} - ${task.departmentName}\nBaşlangıç: ${format(task.startDate, 'dd.MM.yyyy')}\nBitiş: ${format(task.endDate, 'dd.MM.yyyy')}`}
      >
        {/* İlerleme çubuğu - yalnızca devam eden görevler için */}
        {isInProgress && progressPercent > 0 && (
          <div 
            className="absolute bottom-0 left-0 h-1 bg-blue-500" 
            style={{ width: `${progressPercent}%` }}
          />
        )}
        
        {/* Tamamlanmış görevler için onay işareti */}
        {isCompleted && (
          <div className="absolute right-1 top-1 bg-green-400 rounded-full w-3 h-3 flex items-center justify-center">
            <Check className="w-2 h-2 text-white" />
          </div>
        )}
        
        <div className="font-medium">{task.title}</div>
        
        {/* Yalnızca yeterli genişlikte alan varsa müşteri/kumaş bilgilerini göster */}
        {taskDuration > 2 && (
          <div className="mt-1 text-[10px] space-y-1">
            <div className="flex items-center">
              <Users2 className="h-2.5 w-2.5 mr-0.5 flex-shrink-0" />
              <span className="truncate">{task.customerName}</span>
            </div>
            <div className="flex items-center">
              <Layers className="h-2.5 w-2.5 mr-0.5 flex-shrink-0" />
              <span className="truncate">{task.fabricName}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Gantt görünümü için tarih aralığını değiştirme
  const moveRange = (direction: 'forward' | 'backward', days: number = 7) => {
    setDateRange(prev => {
      if (direction === 'forward') {
        return {
          startDate: addDays(prev.startDate, days),
          endDate: addDays(prev.endDate, days),
        };
      } else {
        return {
          startDate: addDays(prev.startDate, -days),
          endDate: addDays(prev.endDate, -days),
        };
      }
    });
  };

  // Geliştirilmiş filtreleme fonksiyonu - daha esnek ve kapsamlı arama
  const filteredTasks = tasks ? tasks.filter(task => {
    // Metin içinde arama - müşteri adı, kumaş adı ve görev başlığında
    const matchesSearch = searchTerm === "" || 
      (task.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       task.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       task.fabricName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       task.notes?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Departman filtreleme - departman ID veya adına göre
    const matchesDepartment = departmentFilter === "all" || 
      task.department === departmentFilter || 
      task.departmentName?.toLowerCase() === departmentFilter.toLowerCase();
    
    // Durum filtreleme - farklı durum formatlarıyla uyumlu
    const matchesStatus = statusFilter === "all" || 
      task.status === statusFilter || 
      (statusFilter === "pending" && task.status === "Beklemede") ||
      (statusFilter === "inProgress" && task.status === "Devam Ediyor") ||
      (statusFilter === "completed" && task.status === "Tamamlandı");
    
    // Seçilen plana göre filtreleme
    const matchesPlan = !selectedPlan || task.productionPlanId?.toString() === selectedPlan;
    
    return matchesSearch && matchesDepartment && matchesStatus && matchesPlan;
  }) : [];

  // Departman adını getir
  const getDepartmentName = (departmentId: string) => {
    if (!departments) return departmentId;
    const department = departments.find(d => d.id.toString() === departmentId);
    return department ? department.name : departmentId;
  };

  const dates = calculateDateRange();

  return (
    <div className="container mx-auto py-6">
      {/* Görev Detayları Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ClipboardList className="w-5 h-5 mr-2" />
              Görev Detayları
            </DialogTitle>
            <DialogDescription>
              {selectedTask && 
                `${selectedTask.title} - ${selectedTask.departmentName}`
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedTask && (
            <>
              <div className="grid gap-4 py-4">
                {/* Müşteri ve Kumaş Bilgisi */}
                <Card className="bg-gray-50 border">
                  <CardContent className="p-4 space-y-2 text-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <Users2 className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="font-medium">Müşteri:</span>
                      </div>
                      <span>{selectedTask.customerName}</span>
                    </div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <Layers className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="font-medium">Kumaş:</span>
                      </div>
                      <span>{selectedTask.fabricName}</span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Durum ve Tarihler */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      Başlangıç Tarihi
                    </label>
                    <DatePicker
                      date={taskStartDate}
                      onSelect={setTaskStartDate}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      Bitiş Tarihi
                    </label>
                    <DatePicker
                      date={taskEndDate}
                      onSelect={setTaskEndDate}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-gray-500" />
                    Durum
                  </label>
                  <Select 
                    value={taskStatus} 
                    onValueChange={setTaskStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beklemede">Beklemede</SelectItem>
                      <SelectItem value="Devam Ediyor">Devam Ediyor</SelectItem>
                      <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                      <SelectItem value="İptal Edildi">İptal Edildi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-gray-500" />
                    Notlar
                  </label>
                  <Textarea
                    placeholder="Görev ile ilgili notlar..."
                    value={taskNotes || ""}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsTaskDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  İptal
                </Button>
                <Button type="submit" className="w-full sm:w-auto" onClick={handleSaveTask}>
                  <Save className="w-4 h-4 mr-2" />
                  Kaydet
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Üretim Planlama</h1>
          <p className="text-muted-foreground">Görsel planlama aracı ile üretim planlarını yönetin</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => moveRange('backward')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Önceki
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => moveRange('forward')}
          >
            Sonraki <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          
          <div className="flex items-center bg-gray-100 rounded-md px-3 py-1 text-sm">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span>
              {format(dateRange.startDate, "d MMM", { locale: tr })} - {format(dateRange.endDate, "d MMM yyyy", { locale: tr })}
            </span>
          </div>
        </div>
      </div>
      
      {/* Plan Seçimi */}
      <div className="mb-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Üretim Planı Seçimi</CardTitle>
              <Button variant="outline" size="sm">
                <RefreshCcw className="h-4 w-4 mr-1" /> Yenile
              </Button>
            </div>
            <CardDescription>
              Görüntülemek istediğiniz üretim planını seçin
            </CardDescription>
          </CardHeader>
          <CardContent>
            {plansLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
              </div>
            ) : plans && plans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <div 
                    key={plan.id}
                    className={`border rounded-md p-4 cursor-pointer transition-all hover:border-primary
                      ${selectedPlan === plan.id.toString() ? 'border-primary bg-primary/5' : ''}
                    `}
                    onClick={() => setSelectedPlan(plan.id.toString())}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{plan.planNo}</h3>
                        <p className="text-xs text-muted-foreground">
                          #{plan.orderNumber}
                        </p>
                      </div>
                      {STATUS_BADGES[plan.status as keyof typeof STATUS_BADGES] || (
                        <Badge variant="outline">{plan.status}</Badge>
                      )}
                    </div>
                    
                    <div className="mb-1">
                      <div className="flex items-center mb-1">
                        <Users2 className="h-3 w-3 mr-1 text-muted-foreground" />
                        <p className="text-xs font-medium">
                          {plan.customerName || "Müşteri bilgisi yok"}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <Layers className="h-3 w-3 mr-1 text-muted-foreground" />
                        <p className="text-xs font-medium">
                          {plan.fabricName || "Kumaş bilgisi yok"}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-sm line-clamp-2 mb-2">{plan.description}</p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{format(parseISO(plan.productionStartDate), "dd.MM.yyyy")}</span>
                      <span>-</span>
                      <span>{format(parseISO(plan.productionEndDate), "dd.MM.yyyy")}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {plansLoading ? (
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2">Planlar yükleniyor...</span>
                  </div>
                ) : plans && plans.length === 0 ? (
                  <>
                    <p className="mb-2">Henüz üretim planı bulunmuyor.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/planning/plans"] })}
                    >
                      <RefreshCcw className="w-4 h-4 mr-1" />
                      Yenile
                    </Button>
                  </>
                ) : (
                  <p>Filtrelere uygun üretim planı bulunamadı.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Filtreler */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Görev adına göre ara..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
          
        <div className="flex space-x-2">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[220px]">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Departman Filtrele" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Departmanlar</SelectItem>
              {departments?.map((department) => (
                <SelectItem key={department.id} value={department.id.toString()}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
              
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Durum Filtrele" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="pending">Beklemede</SelectItem>
              <SelectItem value="inProgress">Devam Ediyor</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="Beklemede">Beklemede</SelectItem>
              <SelectItem value="Devam Ediyor">Devam Ediyor</SelectItem>
              <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Gantt ve Liste Görünümleri */}
      <Tabs defaultValue="timeline" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="timeline">Gantt Şeması</TabsTrigger>
          <TabsTrigger value="list">Liste Görünümü</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeline" className="mt-0">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Gantt Şeması</CardTitle>
              <CardDescription>Sürükle-bırak ile görevleri düzenleyin</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedPlan ? (
                tasksLoading ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
                  </div>
                ) : filteredTasks.length > 0 ? (
                  <div className="mt-6">
                    {/* Gantt Başlık (Tarih Aralığı) */}
                    <div className="flex border-b text-xs font-medium text-gray-500">
                      <div className="w-64 shrink-0 py-2 px-4">Görevler</div>
                      <div className="flex-1 flex">
                        {dates.map((date, i) => (
                          <div 
                            key={i} 
                            className={`flex-1 py-2 text-center ${
                              date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-50' : ''
                            }`}
                          >
                            <div>{format(date, "EEE", { locale: tr })}</div>
                            <div>{format(date, "d", { locale: tr })}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Gantt İçeriği - Sürükle bırak sorununu çözmek için düzenlendi */}
                    <div>
                      {filteredTasks.map((task, taskIndex) => (
                        <div 
                          key={task.id} 
                          className="flex border-b hover:bg-gray-50 transition-colors"
                        >
                          {/* Görev Bilgisi */}
                          <div className="w-64 shrink-0 py-2 px-4 flex flex-col justify-center">
                            <div className="font-medium">{task.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {getDepartmentName(task.department)}
                            </div>
                          </div>
                                
                          {/* Gantt Çubuğu */}
                          <div className="flex-1 flex relative">
                            {dates.map((date, dateIndex) => (
                              <div 
                                key={dateIndex}
                                className={`flex-1 relative border-r ${
                                  date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-50' : ''
                                }`}
                              />
                            ))}
                            
                            {/* Görev çubuğunu çiz */}
                            {renderTaskOnGantt(task, dates)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Filtrelere uygun görev bulunamadı.
                  </div>
                )
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Lütfen görüntülemek için bir üretim planı seçin.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="list" className="mt-0">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Liste Görünümü</CardTitle>
              <CardDescription>Görevleri liste biçiminde görüntüleyin</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedPlan ? (
                tasksLoading ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
                  </div>
                ) : filteredTasks.length > 0 ? (
                  <div className="border rounded-md mt-4">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Görev</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Departman</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Müşteri</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Kumaş</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Başlangıç</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Bitiş</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Durum</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Öncelik</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTasks.map((task) => (
                          <tr key={task.id} className="border-t hover:bg-muted/30">
                            <td className="px-4 py-3">{task.title}</td>
                            <td className="px-4 py-3">{getDepartmentName(task.department)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <Users2 className="h-3 w-3 mr-1 text-muted-foreground" />
                                <span>{task.customerName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <Layers className="h-3 w-3 mr-1 text-muted-foreground" />
                                <span>{task.fabricName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">{format(task.startDate, "dd.MM.yyyy")}</td>
                            <td className="px-4 py-3">{format(task.endDate, "dd.MM.yyyy")}</td>
                            <td className="px-4 py-3">
                              {STATUS_BADGES[task.status as keyof typeof STATUS_BADGES]}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={
                                task.priority === "high" ? "destructive" :
                                task.priority === "medium" ? "default" : "outline"
                              } className="text-xs">
                                {task.priority === "high" ? "Yüksek" :
                                 task.priority === "medium" ? "Orta" : "Düşük"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Filtrelere uygun görev bulunamadı.
                  </div>
                )
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Lütfen görüntülemek için bir üretim planı seçin.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}