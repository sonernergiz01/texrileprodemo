import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Activity, 
  AlertTriangle, 
  BarChart, 
  Bell, 
  Bot, 
  Calendar,
  CheckCircle2, 
  ChevronsRight, 
  CircleOff, 
  Clock, 
  Eye, 
  Filter, 
  History, 
  ListFilter, 
  Loader2, 
  PlayCircle, 
  Pulse, 
  RefreshCcw, 
  Search, 
  Slash, 
  SquareStack, 
  Target, 
  Truck, 
  WifiOff, 
  Zap 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { format, subMinutes, subHours, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip } from 'recharts';

// Production Card türü
interface ProductionCard {
  id: number;
  cardNo: string;
  orderId: number;
  orderCode: string;
  productName: string;
  productId: number;
  customerId: number;
  customerName: string;
  quantity: number;
  currentQuantity: number;
  unit: string;
  status: 'created' | 'in-process' | 'completed' | 'rejected';
  currentDepartmentId: number;
  currentDepartmentName: string;
  currentMachineId: number | null;
  currentMachineName: string | null;
  currentStepId: number;
  currentStepName: string;
  assignedOperatorId: number | null;
  assignedOperatorName: string | null;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate: string | null;
  actualEndDate: string | null;
  lastMovementDate: string | null;
  delayTime: number | null; // saat cinsinden, negatif ise erken
  delayLevel: 'onTime' | 'warning' | 'critical' | 'delayed';
  progress: number; // yüzde olarak tamamlanma
  quality: number; // yüzde olarak kalite
  barcode: string;
  notes: string | null;
  lastActivity: string | null;
}

// Üretim Adımı türü
interface ProductionStep {
  id: number;
  planId: number;
  orderCode: string;
  stepOrder: number;
  departmentId: number;
  departmentName: string;
  machineTypeId: number | null;
  machineTypeName: string | null;
  machineId: number | null;
  machineName: string | null;
  stepName: string;
  status: 'pending' | 'in-process' | 'completed' | 'skipped';
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate: string | null;
  actualEndDate: string | null;
  duration: number; // saat
  assignedOperatorId: number | null;
  assignedOperatorName: string | null;
  notes: string | null;
  delayTime: number | null; // saat cinsinden, negatif ise erken
  progress: number; // yüzde olarak tamamlanma
}

// Üretim Planı türü
interface ProductionPlan {
  id: number;
  planNo: string;
  orderCode: string;
  orderId: number;
  productId: number;
  productName: string;
  customerName: string;
  quantity: number;
  unit: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'planning' | 'in-process' | 'completed' | 'on-hold' | 'cancelled';
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate: string | null;
  actualEndDate: string | null;
  progress: number; // yüzde olarak tamamlanma
  delayTime: number | null; // saat cinsinden, negatif ise erken
  currentStepName: string | null;
  currentDepartmentName: string | null;
  productionCardCount: number;
  completedCardCount: number;
}

// Makine Durumu türü
interface MachineStatus {
  id: number;
  name: string;
  departmentId: number;
  departmentName: string;
  type: string;
  status: 'running' | 'idle' | 'maintenance' | 'breakdown' | 'offline';
  currentJobId: number | null;
  currentJobName: string | null;
  currentOrderCode: string | null;
  startTime: string | null;
  runningTime: number | null; // dakika
  efficiency: number; // yüzde
  speed: number; // birim/saat
  utilization: number; // yüzde
  nextMaintenanceDate: string | null;
  lastMaintenanceDate: string | null;
  telemetry: {
    temperature: number;
    vibration: number;
    power: number;
    pressure: number | null;
    speed: number;
  } | null;
  alerts: {
    type: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: string;
  }[];
  operatorId: number | null;
  operatorName: string | null;
}

// Departman Özeti türü
interface DepartmentSummary {
  id: number;
  name: string;
  activeCards: number;
  totalCards: number;
  activePlans: number;
  totalPlans: number;
  machineStatuses: {
    running: number;
    idle: number;
    maintenance: number;
    breakdown: number;
    offline: number;
  };
  avgProgress: number;
  avgDelay: number;
  bottleneckScore: number;
  utilization: number;
  workInProgress: number;
}

// Genel Fabrika Durumu türü
interface FactoryStatus {
  totalActivePlans: number;
  totalActiveCards: number;
  totalMachines: number;
  machineStatuses: {
    running: number;
    idle: number;
    maintenance: number;
    breakdown: number;
    offline: number;
  };
  departmentUtilization: Record<number, number>; // departmanId -> utilization
  avgProgress: number;
  avgDelay: number;
  alertCount: number;
  criticalAlertCount: number;
  productivity: number; // yüzde
  onTimeDelivery: number; // yüzde
}

// Durum renkleri için yardımcı fonksiyonlar
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'running':
    case 'in-process':
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'planning':
    case 'pending':
    case 'idle':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'maintenance':
    case 'on-hold':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'breakdown':
    case 'rejected':
    case 'cancelled':
    case 'offline':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getProgressColor = (progress: number): string => {
  if (progress >= 80) return 'bg-green-600';
  if (progress >= 50) return 'bg-blue-600';
  if (progress >= 30) return 'bg-yellow-600';
  return 'bg-red-600';
};

const getDelayBadge = (delayLevel: string) => {
  switch (delayLevel) {
    case 'onTime':
      return <Badge className="bg-green-100 text-green-800 border-green-200">Zamanında</Badge>;
    case 'warning':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Uyarı</Badge>;
    case 'critical':
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Kritik</Badge>;
    case 'delayed':
      return <Badge className="bg-red-100 text-red-800 border-red-200">Gecikti</Badge>;
    default:
      return <Badge>Bilinmiyor</Badge>;
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'low':
      return <Badge className="bg-green-100 text-green-800 border-green-200">Düşük</Badge>;
    case 'normal':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Normal</Badge>;
    case 'high':
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Yüksek</Badge>;
    case 'urgent':
      return <Badge className="bg-red-100 text-red-800 border-red-200">Acil</Badge>;
    default:
      return <Badge>Bilinmiyor</Badge>;
  }
};

// Makine durumu için yardımcı bileşenler
const getMachineStatusIcon = (status: string) => {
  switch (status) {
    case 'running':
      return <PlayCircle className="h-4 w-4 text-green-600" />;
    case 'idle':
      return <Slash className="h-4 w-4 text-blue-600" />;
    case 'maintenance':
      return <Zap className="h-4 w-4 text-yellow-600" />;
    case 'breakdown':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case 'offline':
      return <WifiOff className="h-4 w-4 text-gray-600" />;
    default:
      return <CircleOff className="h-4 w-4 text-gray-600" />;
  }
};

const getMachineStatusBadge = (status: string) => {
  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {getMachineStatusIcon(status)}
      <span className="ml-1">
        {status === 'running' ? 'Çalışıyor' :
         status === 'idle' ? 'Boşta' :
         status === 'maintenance' ? 'Bakımda' :
         status === 'breakdown' ? 'Arızalı' :
         status === 'offline' ? 'Çevrimdışı' : 'Bilinmiyor'}
      </span>
    </div>
  );
};

// Telemetri göstergeleri için yardımcı bileşenler
const getTelemetryStatus = (value: number, max: number, high: number, low: number): string => {
  const percentage = (value / max) * 100;
  if (percentage > high) return 'text-red-600';
  if (percentage < low) return 'text-blue-600';
  return 'text-green-600';
};

// Zaman formatı yardımcıları
const formatTimeAgo = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  
  if (diffMins < 1) return 'Şimdi';
  if (diffMins < 60) return `${diffMins} dk önce`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} sa önce`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} gün önce`;
};

// Ana bileşen
const LiveMonitoring: React.FC = () => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<string>("overview");
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // saniye
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [showMachineDetailsDialog, setShowMachineDetailsDialog] = useState<boolean>(false);
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [telemetryHistory, setTelemetryHistory] = useState<any[]>([]);

  // Bölümleri getir
  const { data: departments = [] } = useQuery({
    queryKey: ["/api/admin/departments"],
  });

  // Genel fabrika durumunu getir
  const { data: factoryStatus, isLoading: factoryStatusLoading, refetch: refetchFactoryStatus } = useQuery<FactoryStatus>({
    queryKey: ["/api/planning/monitoring/factory-status"],
    refetchInterval: refreshInterval * 1000,
  });

  // Departman özetlerini getir
  const { data: departmentSummaries = [], isLoading: departmentSummariesLoading, refetch: refetchDepartmentSummaries } = useQuery<DepartmentSummary[]>({
    queryKey: ["/api/planning/monitoring/department-summaries"],
    refetchInterval: refreshInterval * 1000,
  });

  // Makine durumlarını getir
  const { data: machineStatuses = [], isLoading: machineStatusesLoading, refetch: refetchMachineStatuses } = useQuery<MachineStatus[]>({
    queryKey: [
      "/api/planning/monitoring/machine-statuses",
      { department: filterDepartment },
      { status: filterStatus }
    ],
    refetchInterval: refreshInterval * 1000,
  });

  // Aktif üretim kartlarını getir
  const { data: activeCards = [], isLoading: activeCardsLoading, refetch: refetchActiveCards } = useQuery<ProductionCard[]>({
    queryKey: [
      "/api/planning/monitoring/active-cards",
      { department: filterDepartment },
      { search: searchQuery }
    ],
    refetchInterval: refreshInterval * 1000,
  });

  // Aktif üretim planlarını getir
  const { data: activePlans = [], isLoading: activePlansLoading, refetch: refetchActivePlans } = useQuery<ProductionPlan[]>({
    queryKey: [
      "/api/planning/monitoring/active-plans",
      { department: filterDepartment },
      { search: searchQuery }
    ],
    refetchInterval: refreshInterval * 1000,
  });

  // Telemetri verilerini getir
  const { data: selectedMachineTelemetry, isLoading: telemetryLoading, refetch: refetchTelemetry } = useQuery<any>({
    queryKey: ["/api/planning/monitoring/machine-telemetry", selectedMachineId],
    enabled: !!selectedMachineId && showMachineDetailsDialog,
    refetchInterval: refreshInterval * 1000,
  });

  // Seçilmiş makine, kart ve plan
  const selectedMachine = machineStatuses.find(machine => machine.id === selectedMachineId);
  const selectedCard = activeCards.find(card => card.id === selectedCardId);
  const selectedPlan = activePlans.find(plan => plan.id === selectedPlanId);

  // Tüm verileri manuel olarak yenile
  const handleRefreshAll = () => {
    refetchFactoryStatus();
    refetchDepartmentSummaries();
    refetchMachineStatuses();
    refetchActiveCards();
    refetchActivePlans();
    if (selectedMachineId && showMachineDetailsDialog) {
      refetchTelemetry();
    }

    toast({
      title: "Veriler yenilendi",
      description: "Tüm izleme verileri başarıyla yenilendi.",
    });
  };

  // Makine detayları iletişim kutusunu göster
  const handleShowMachineDetails = (machineId: number) => {
    setSelectedMachineId(machineId);
    setShowMachineDetailsDialog(true);
  };

  // Telemetri geçmiş verileri için demo veri üretme
  useEffect(() => {
    if (selectedMachineId && showMachineDetailsDialog) {
      // Demo amaçlı telemetri grafiği için veri üret
      const history = Array.from({ length: 24 }, (_, i) => {
        const time = subHours(new Date(), 23 - i);
        
        // Makineye göre base değerler
        const baseTemp = selectedMachineId % 2 === 0 ? 65 : 70;
        const baseVibration = selectedMachineId % 2 === 0 ? 12 : 15;
        const basePower = selectedMachineId % 2 === 0 ? 380 : 420;
        
        // Küçük varyasyonlar ekle
        const temp = baseTemp + Math.sin(i * 0.5) * 5;
        const vibration = baseVibration + Math.cos(i * 0.3) * 3;
        const power = basePower + (Math.random() - 0.5) * 40;
        
        return {
          time: format(time, 'HH:mm'),
          temperature: Math.round(temp * 10) / 10,
          vibration: Math.round(vibration * 10) / 10,
          power: Math.round(power)
        };
      });
      
      setTelemetryHistory(history);
    }
  }, [selectedMachineId, showMachineDetailsDialog]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Canlı Üretim İzleme</h2>
          <p className="text-muted-foreground">
            Tüm üretim süreçlerini ve makine durumlarını gerçek zamanlı olarak izleyin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={refreshInterval.toString()}
            onValueChange={(value) => setRefreshInterval(parseInt(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Otomatik Yenileme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">Her 10 saniyede</SelectItem>
              <SelectItem value="30">Her 30 saniyede</SelectItem>
              <SelectItem value="60">Her dakikada</SelectItem>
              <SelectItem value="300">Her 5 dakikada</SelectItem>
              <SelectItem value="0">Manuel</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={handleRefreshAll}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Yenile
          </Button>
        </div>
      </div>

      <Tabs 
        defaultValue="overview" 
        value={selectedTab} 
        onValueChange={setSelectedTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart className="mr-2 h-4 w-4" />
            Genel Durum
          </TabsTrigger>
          <TabsTrigger value="machines">
            <Activity className="mr-2 h-4 w-4" />
            Makineler
          </TabsTrigger>
          <TabsTrigger value="cards">
            <SquareStack className="mr-2 h-4 w-4" />
            Refakat Kartları
          </TabsTrigger>
          <TabsTrigger value="plans">
            <Target className="mr-2 h-4 w-4" />
            Üretim Planları
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {factoryStatusLoading ? (
            <div className="flex items-center justify-center p-16">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                <p>Üretim verileri yükleniyor...</p>
              </div>
            </div>
          ) : factoryStatus ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Aktif Planlar
                    </CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {factoryStatus.totalActivePlans}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Devam eden üretim planı sayısı
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Aktif Refakat Kartları
                    </CardTitle>
                    <SquareStack className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {factoryStatus.totalActiveCards}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Üretim sürecindeki kart sayısı
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Ortalama İlerleme
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      %{factoryStatus.avgProgress}
                    </div>
                    <Progress 
                      value={factoryStatus.avgProgress} 
                      className={`h-2 mt-2 ${getProgressColor(factoryStatus.avgProgress)}`} 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tüm aktif planların ortalama ilerlemesi
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Aktif Makineler
                    </CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {factoryStatus.machineStatuses.running} / {factoryStatus.totalMachines}
                    </div>
                    <Progress 
                      value={(factoryStatus.machineStatuses.running / factoryStatus.totalMachines) * 100} 
                      className="h-2 mt-2 bg-green-600" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Aktif çalışan makine oranı
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Üretim Verimliliği
                    </CardTitle>
                    <Pulse className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      %{factoryStatus.productivity}
                    </div>
                    <Progress 
                      value={factoryStatus.productivity} 
                      className={`h-2 mt-2 ${getProgressColor(factoryStatus.productivity)}`} 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Toplam üretim verimliliği
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Zamanında Teslimat
                    </CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      %{factoryStatus.onTimeDelivery}
                    </div>
                    <Progress 
                      value={factoryStatus.onTimeDelivery} 
                      className={`h-2 mt-2 ${getProgressColor(factoryStatus.onTimeDelivery)}`} 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Zamanında teslim edilen siparişlerin oranı
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Ortalama Gecikme
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {factoryStatus.avgDelay > 0 
                        ? `${factoryStatus.avgDelay} saat gecikme` 
                        : factoryStatus.avgDelay < 0 
                          ? `${Math.abs(factoryStatus.avgDelay)} saat önde` 
                          : `Zamanında`}
                    </div>
                    <Progress 
                      value={50 - factoryStatus.avgDelay} // İlerleme çubuğunu ortala
                      className={`h-2 mt-2 ${factoryStatus.avgDelay > 0 ? 'bg-red-600' : 'bg-green-600'}`} 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Aktif planların ortalama gecikme/erkenlik durumu
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Aktif Uyarılar
                    </CardTitle>
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {factoryStatus.alertCount}
                      {factoryStatus.criticalAlertCount > 0 && (
                        <span className="text-sm font-normal text-red-600 ml-2">
                          ({factoryStatus.criticalAlertCount} kritik)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Dikkat gerektiren uyarı sayısı
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 grid-cols-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Departman Durumları</CardTitle>
                    <CardDescription>
                      Departman bazında üretim durumları ve performans göstergeleri
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Departman</TableHead>
                          <TableHead className="text-right">Aktif Kartlar</TableHead>
                          <TableHead className="text-right">Aktif Planlar</TableHead>
                          <TableHead className="text-right">Makine Durumu</TableHead>
                          <TableHead className="text-right">Kullanım</TableHead>
                          <TableHead className="text-right">İlerleme</TableHead>
                          <TableHead className="text-right">Darboğaz</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {departmentSummaries.map((dept) => (
                          <TableRow 
                            key={dept.id}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => {
                              setFilterDepartment(dept.id.toString());
                              setSelectedTab("machines");
                            }}
                          >
                            <TableCell className="font-medium">{dept.name}</TableCell>
                            <TableCell className="text-right">{dept.activeCards} / {dept.totalCards}</TableCell>
                            <TableCell className="text-right">{dept.activePlans} / {dept.totalPlans}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center">
                                        <span className="text-green-600">{dept.machineStatuses.running}</span>
                                        <span className="mx-1 text-gray-400">/</span>
                                        <span className="text-blue-600">{dept.machineStatuses.idle}</span>
                                        <span className="mx-1 text-gray-400">/</span>
                                        <span className="text-yellow-600">{dept.machineStatuses.maintenance}</span>
                                        <span className="mx-1 text-gray-400">/</span>
                                        <span className="text-red-600">{dept.machineStatuses.breakdown}</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Çalışıyor / Boşta / Bakımda / Arızalı</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end">
                                <Progress 
                                  value={dept.utilization} 
                                  className={`h-2 w-24 ${getProgressColor(dept.utilization)}`} 
                                />
                                <span className="ml-2">%{dept.utilization}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end">
                                <Progress 
                                  value={dept.avgProgress} 
                                  className={`h-2 w-24 ${getProgressColor(dept.avgProgress)}`} 
                                />
                                <span className="ml-2">%{dept.avgProgress}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className={`
                                ${dept.bottleneckScore > 75 ? 'bg-red-100 text-red-800' :
                                  dept.bottleneckScore > 50 ? 'bg-orange-100 text-orange-800' :
                                  dept.bottleneckScore > 25 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'}
                              `}>
                                %{dept.bottleneckScore}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Alert>
              <Eye className="h-4 w-4" />
              <AlertTitle>Veri bulunamadı</AlertTitle>
              <AlertDescription>
                Üretim izleme verilerine erişilemiyor. Lütfen bağlantıyı kontrol edin ve tekrar deneyin.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="machines" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={filterDepartment}
                onValueChange={setFilterDepartment}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tüm Departmanlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Departmanlar</SelectItem>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterStatus}
                onValueChange={setFilterStatus}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tüm Durumlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="running">Çalışıyor</SelectItem>
                  <SelectItem value="idle">Boşta</SelectItem>
                  <SelectItem value="maintenance">Bakımda</SelectItem>
                  <SelectItem value="breakdown">Arızalı</SelectItem>
                  <SelectItem value="offline">Çevrimdışı</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterDepartment("all");
                  setFilterStatus("all");
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtreleri Temizle
              </Button>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {machineStatusesLoading ? (
              <Card className="col-span-full">
                <CardContent className="flex items-center justify-center p-6">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                    <p>Makine durumları yükleniyor...</p>
                  </div>
                </CardContent>
              </Card>
            ) : machineStatuses.length > 0 ? (
              machineStatuses.map((machine) => (
                <Card 
                  key={machine.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    machine.status === 'breakdown' ? 'border-red-300' :
                    machine.status === 'maintenance' ? 'border-yellow-300' :
                    machine.status === 'running' ? 'border-green-300' :
                    ''
                  }`}
                  onClick={() => handleShowMachineDetails(machine.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{machine.name}</CardTitle>
                      {getMachineStatusBadge(machine.status)}
                    </div>
                    <CardDescription>
                      {machine.departmentName} - {machine.type}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-gray-500">Verimlilik</div>
                        <div className="flex items-center">
                          <Progress 
                            value={machine.efficiency} 
                            className={`h-2 flex-1 ${getProgressColor(machine.efficiency)}`} 
                          />
                          <span className="ml-2 text-sm font-medium">%{machine.efficiency}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Kullanım</div>
                        <div className="flex items-center">
                          <Progress 
                            value={machine.utilization} 
                            className={`h-2 flex-1 ${getProgressColor(machine.utilization)}`} 
                          />
                          <span className="ml-2 text-sm font-medium">%{machine.utilization}</span>
                        </div>
                      </div>
                    </div>

                    {machine.currentOrderCode && (
                      <div className="space-y-1 mt-2">
                        <div className="text-xs text-gray-500">Mevcut İş</div>
                        <div className="text-sm">
                          <span className="font-medium">{machine.currentJobName}</span>
                          {machine.currentOrderCode && (
                            <Badge variant="outline" className="ml-2">
                              {machine.currentOrderCode}
                            </Badge>
                          )}
                        </div>
                        {machine.startTime && (
                          <div className="text-xs text-gray-500">
                            Başlangıç: {format(new Date(machine.startTime), "HH:mm - dd MMM", { locale: tr })}
                            {machine.runningTime && (
                              <span className="ml-2">({Math.floor(machine.runningTime / 60)} sa {machine.runningTime % 60} dk)</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {machine.operatorName && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500">Operatör</div>
                        <div className="text-sm font-medium">{machine.operatorName}</div>
                      </div>
                    )}

                    {machine.alerts && machine.alerts.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-1">Uyarılar</div>
                        <div className="space-y-1">
                          {machine.alerts.slice(0, 2).map((alert, index) => (
                            <div 
                              key={index}
                              className={`flex items-center text-xs px-2 py-1 rounded-md ${
                                alert.type === 'critical' ? 'bg-red-50 text-red-700' :
                                alert.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                                'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {alert.type === 'critical' ? (
                                <AlertTriangle className="h-3 w-3 mr-1" />
                              ) : alert.type === 'warning' ? (
                                <Bell className="h-3 w-3 mr-1" />
                              ) : (
                                <Activity className="h-3 w-3 mr-1" />
                              )}
                              <span className="line-clamp-1">{alert.message}</span>
                            </div>
                          ))}
                          {machine.alerts.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{machine.alerts.length - 2} daha...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowMachineDetails(machine.id);
                      }}
                    >
                      <ChevronsRight className="mr-2 h-4 w-4" />
                      Detaylar
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Activity className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                    <h3 className="font-semibold mb-1">Makine bulunamadı</h3>
                    <p className="text-sm text-gray-500">
                      Belirtilen kriterlere uygun makine bulunamadı. Filtreleri değiştirmeyi deneyin.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={filterDepartment}
                onValueChange={setFilterDepartment}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tüm Departmanlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Departmanlar</SelectItem>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="Kart no, sipariş veya ürün ara..." 
                  className="pl-9 w-[280px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterDepartment("all");
                  setSearchQuery("");
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtreleri Temizle
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Aktif Refakat Kartları</CardTitle>
              <CardDescription>
                Üretim sürecindeki tüm refakat kartları ve durumları
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeCardsLoading ? (
                <div className="flex items-center justify-center p-6">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                    <p>Refakat kartları yükleniyor...</p>
                  </div>
                </div>
              ) : activeCards.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kart No</TableHead>
                      <TableHead>Ürün</TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Konum</TableHead>
                      <TableHead>İlerleme</TableHead>
                      <TableHead>Son İşlem</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeCards.map((card) => (
                      <TableRow 
                        key={card.id}
                        className={`${selectedCardId === card.id ? 'bg-blue-50' : ''}`}
                      >
                        <TableCell className="font-medium">{card.cardNo}</TableCell>
                        <TableCell>
                          <HoverCard>
                            <HoverCardTrigger className="cursor-help">
                              <span className="underline decoration-dotted underline-offset-4">
                                {card.productName.length > 20 
                                  ? `${card.productName.substring(0, 20)}...` 
                                  : card.productName}
                              </span>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80">
                              <div className="space-y-1">
                                <h4 className="text-sm font-semibold">{card.productName}</h4>
                                <div className="text-xs">
                                  Sipariş: {card.orderCode}
                                </div>
                                {card.notes && (
                                  <p className="text-xs text-gray-500">{card.notes}</p>
                                )}
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </TableCell>
                        <TableCell>{card.customerName}</TableCell>
                        <TableCell>
                          {card.currentQuantity} / {card.quantity} {card.unit}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(card.status)}>
                            {card.status === 'created' ? 'Oluşturuldu' :
                             card.status === 'in-process' ? 'Süreçte' :
                             card.status === 'completed' ? 'Tamamlandı' :
                             card.status === 'rejected' ? 'Reddedildi' : 'Bilinmiyor'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{card.currentDepartmentName}</span>
                            <span className="text-xs text-gray-500">{card.currentStepName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress
                              value={card.progress}
                              className={`h-2 w-16 ${getProgressColor(card.progress)}`}
                            />
                            <span className="text-xs">%{card.progress}</span>
                            {card.delayLevel !== 'onTime' && (
                              <div className="ml-1">
                                {getDelayBadge(card.delayLevel)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {card.lastMovementDate ? (
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {formatTimeAgo(card.lastMovementDate)}
                              </span>
                              {card.lastActivity && (
                                <span className="text-xs text-gray-500">{card.lastActivity}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setSelectedCardId(card.id === selectedCardId ? null : card.id)}
                          >
                            <span className="sr-only">Detaylar</span>
                            {selectedCardId === card.id ? (
                              <ChevronDownIcon className="h-4 w-4" />
                            ) : (
                              <ChevronsRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-6 text-center">
                  <SquareStack className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                  <h3 className="font-semibold mb-1">Aktif kart bulunamadı</h3>
                  <p className="text-sm text-gray-500">
                    Belirtilen kriterlere uygun refakat kartı bulunamadı. Filtreleri değiştirmeyi deneyin.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedCardId && selectedCard && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Refakat Kartı Detayları</CardTitle>
                    <CardDescription>
                      {selectedCard.cardNo} numaralı refakat kartı bilgileri
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(selectedCard.status)}>
                    {selectedCard.status === 'created' ? 'Oluşturuldu' :
                     selectedCard.status === 'in-process' ? 'Süreçte' :
                     selectedCard.status === 'completed' ? 'Tamamlandı' :
                     selectedCard.status === 'rejected' ? 'Reddedildi' : 'Bilinmiyor'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Kart Bilgileri</h3>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Ürün:</div>
                        <div className="col-span-2 font-medium">{selectedCard.productName}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Müşteri:</div>
                        <div className="col-span-2">{selectedCard.customerName}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Sipariş Kodu:</div>
                        <div className="col-span-2">{selectedCard.orderCode}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Miktar:</div>
                        <div className="col-span-2">
                          {selectedCard.currentQuantity} / {selectedCard.quantity} {selectedCard.unit}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Barkod:</div>
                        <div className="col-span-2">{selectedCard.barcode}</div>
                      </div>
                      {selectedCard.notes && (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-gray-500">Notlar:</div>
                          <div className="col-span-2">{selectedCard.notes}</div>
                        </div>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold mt-4 mb-2">Mevcut Durum</h3>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Departman:</div>
                        <div className="col-span-2 font-medium">{selectedCard.currentDepartmentName}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Adım:</div>
                        <div className="col-span-2">{selectedCard.currentStepName}</div>
                      </div>
                      {selectedCard.currentMachineName && (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-gray-500">Makine:</div>
                          <div className="col-span-2">{selectedCard.currentMachineName}</div>
                        </div>
                      )}
                      {selectedCard.assignedOperatorName && (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-gray-500">Operatör:</div>
                          <div className="col-span-2">{selectedCard.assignedOperatorName}</div>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">İlerleme:</div>
                        <div className="col-span-2">
                          <div className="flex items-center">
                            <Progress
                              value={selectedCard.progress}
                              className={`h-2 flex-1 ${getProgressColor(selectedCard.progress)}`}
                            />
                            <span className="ml-2">%{selectedCard.progress}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Kalite:</div>
                        <div className="col-span-2">
                          <div className="flex items-center">
                            <Progress
                              value={selectedCard.quality}
                              className={`h-2 flex-1 ${getProgressColor(selectedCard.quality)}`}
                            />
                            <span className="ml-2">%{selectedCard.quality}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Gecikme Durumu:</div>
                        <div className="col-span-2">
                          {getDelayBadge(selectedCard.delayLevel)}
                          {selectedCard.delayTime !== null && (
                            <span className="ml-2 text-xs">
                              {selectedCard.delayTime > 0 
                                ? `(${selectedCard.delayTime} saat gecikme)` 
                                : selectedCard.delayTime < 0 
                                  ? `(${Math.abs(selectedCard.delayTime)} saat önde)` 
                                  : '(zamanında)'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-2">Zamanlama Bilgileri</h3>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Planlanan Başlangıç:</div>
                        <div className="col-span-2">
                          {format(new Date(selectedCard.plannedStartDate), "dd MMMM yyyy HH:mm", { locale: tr })}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Planlanan Bitiş:</div>
                        <div className="col-span-2">
                          {format(new Date(selectedCard.plannedEndDate), "dd MMMM yyyy HH:mm", { locale: tr })}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Gerçek Başlangıç:</div>
                        <div className="col-span-2">
                          {selectedCard.actualStartDate 
                            ? format(new Date(selectedCard.actualStartDate), "dd MMMM yyyy HH:mm", { locale: tr })
                            : "-"}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Gerçek Bitiş:</div>
                        <div className="col-span-2">
                          {selectedCard.actualEndDate 
                            ? format(new Date(selectedCard.actualEndDate), "dd MMMM yyyy HH:mm", { locale: tr })
                            : "-"}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Son Hareket:</div>
                        <div className="col-span-2">
                          {selectedCard.lastMovementDate 
                            ? format(new Date(selectedCard.lastMovementDate), "dd MMMM yyyy HH:mm", { locale: tr })
                            : "-"}
                        </div>
                      </div>
                      {selectedCard.lastActivity && (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-gray-500">Son Aktivite:</div>
                          <div className="col-span-2">{selectedCard.lastActivity}</div>
                        </div>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold mt-4 mb-2">Takip ve İzleme</h3>
                    <div className="bg-gray-50 p-3 rounded-md border text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">Kart Hareketleri</div>
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <History className="h-3.5 w-3.5 mr-1" />
                          <span className="text-xs">Tüm Hareketler</span>
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex">
                          <div className="flex flex-col items-center mr-2">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <div className="h-8 w-0.5 bg-gray-200"></div>
                          </div>
                          <div>
                            <div className="text-xs font-medium">Dokuma - Dokuma Tamamlandı</div>
                            <div className="text-xs text-gray-500">{format(subHours(new Date(), 5), "dd MMM HH:mm", { locale: tr })}</div>
                          </div>
                        </div>
                        <div className="flex">
                          <div className="flex flex-col items-center mr-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            <div className="h-8 w-0.5 bg-gray-200"></div>
                          </div>
                          <div>
                            <div className="text-xs font-medium">Apre - İşlem Başlatıldı</div>
                            <div className="text-xs text-gray-500">{format(subHours(new Date(), 3), "dd MMM HH:mm", { locale: tr })}</div>
                          </div>
                        </div>
                        <div className="flex">
                          <div className="flex flex-col items-center mr-2">
                            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                          </div>
                          <div>
                            <div className="text-xs font-medium">Apre - Sanfor İşlemi</div>
                            <div className="text-xs text-gray-500">{format(subMinutes(new Date(), 45), "dd MMM HH:mm", { locale: tr })}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-4">
                <Button variant="outline" onClick={() => setSelectedCardId(null)}>
                  Kapat
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="Plan no, sipariş veya ürün ara..." 
                  className="pl-9 w-[280px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ListFilter className="mr-2 h-4 w-4" />
                    <span>Filtre</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Filtreleme Seçenekleri</h4>
                      <p className="text-sm text-muted-foreground">
                        Üretim planlarını filtrelemek için seçenekler
                      </p>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="departmentFilter" className="col-span-4">
                        Departman
                      </Label>
                      <Select
                        value={filterDepartment}
                        onValueChange={setFilterDepartment}
                      >
                        <SelectTrigger className="col-span-4">
                          <SelectValue placeholder="Tüm Departmanlar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tüm Departmanlar</SelectItem>
                          {departments.map((dept: any) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setFilterDepartment("all");
                        setSearchQuery("");
                      }}
                    >
                      Filtreleri Temizle
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Aktif Üretim Planları</CardTitle>
              <CardDescription>
                Devam eden tüm üretim planları ve durum bilgileri
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activePlansLoading ? (
                <div className="flex items-center justify-center p-6">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                    <p>Üretim planları yükleniyor...</p>
                  </div>
                </div>
              ) : activePlans.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan No</TableHead>
                      <TableHead>Sipariş</TableHead>
                      <TableHead>Ürün</TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Öncelik</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>İlerleme</TableHead>
                      <TableHead>Mevcut Adım</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activePlans.map((plan) => (
                      <TableRow 
                        key={plan.id}
                        className={`${selectedPlanId === plan.id ? 'bg-blue-50' : ''}`}
                      >
                        <TableCell className="font-medium">{plan.planNo}</TableCell>
                        <TableCell>{plan.orderCode}</TableCell>
                        <TableCell>
                          <HoverCard>
                            <HoverCardTrigger className="cursor-help">
                              <span className="underline decoration-dotted underline-offset-4">
                                {plan.productName.length > 20 
                                  ? `${plan.productName.substring(0, 20)}...` 
                                  : plan.productName}
                              </span>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80">
                              <div className="space-y-1">
                                <h4 className="text-sm font-semibold">{plan.productName}</h4>
                                <div className="text-xs">
                                  Sipariş: {plan.orderCode}
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </TableCell>
                        <TableCell>{plan.customerName}</TableCell>
                        <TableCell>{plan.quantity} {plan.unit}</TableCell>
                        <TableCell>{getPriorityBadge(plan.priority)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(plan.status)}>
                            {plan.status === 'planning' ? 'Planlamada' :
                             plan.status === 'in-process' ? 'Süreçte' :
                             plan.status === 'completed' ? 'Tamamlandı' :
                             plan.status === 'on-hold' ? 'Beklemede' :
                             plan.status === 'cancelled' ? 'İptal' : 'Bilinmiyor'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress
                              value={plan.progress}
                              className={`h-2 w-16 ${getProgressColor(plan.progress)}`}
                            />
                            <span className="text-xs">%{plan.progress}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {plan.currentStepName ? (
                            <div className="flex flex-col">
                              <span className="text-sm">{plan.currentStepName}</span>
                              {plan.currentDepartmentName && (
                                <span className="text-xs text-gray-500">{plan.currentDepartmentName}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setSelectedPlanId(plan.id === selectedPlanId ? null : plan.id)}
                          >
                            <span className="sr-only">Detaylar</span>
                            {selectedPlanId === plan.id ? (
                              <ChevronDownIcon className="h-4 w-4" />
                            ) : (
                              <ChevronsRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-6 text-center">
                  <Target className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                  <h3 className="font-semibold mb-1">Aktif plan bulunamadı</h3>
                  <p className="text-sm text-gray-500">
                    Belirtilen kriterlere uygun üretim planı bulunamadı. Filtreleri değiştirmeyi deneyin.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedPlanId && selectedPlan && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Üretim Planı Detayları</CardTitle>
                    <CardDescription>
                      {selectedPlan.planNo} numaralı üretim planı bilgileri
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(selectedPlan.status)}>
                    {selectedPlan.status === 'planning' ? 'Planlamada' :
                     selectedPlan.status === 'in-process' ? 'Süreçte' :
                     selectedPlan.status === 'completed' ? 'Tamamlandı' :
                     selectedPlan.status === 'on-hold' ? 'Beklemede' :
                     selectedPlan.status === 'cancelled' ? 'İptal' : 'Bilinmiyor'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Plan Bilgileri</h3>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Sipariş Kodu:</div>
                        <div className="col-span-2 font-medium">{selectedPlan.orderCode}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Ürün:</div>
                        <div className="col-span-2 font-medium">{selectedPlan.productName}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Müşteri:</div>
                        <div className="col-span-2">{selectedPlan.customerName}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Miktar:</div>
                        <div className="col-span-2">
                          {selectedPlan.quantity} {selectedPlan.unit}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Öncelik:</div>
                        <div className="col-span-2">{getPriorityBadge(selectedPlan.priority)}</div>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold mt-4 mb-2">Durum Bilgileri</h3>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Mevcut Adım:</div>
                        <div className="col-span-2 font-medium">{selectedPlan.currentStepName || "-"}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Departman:</div>
                        <div className="col-span-2">{selectedPlan.currentDepartmentName || "-"}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">İlerleme:</div>
                        <div className="col-span-2">
                          <div className="flex items-center">
                            <Progress
                              value={selectedPlan.progress}
                              className={`h-2 flex-1 ${getProgressColor(selectedPlan.progress)}`}
                            />
                            <span className="ml-2">%{selectedPlan.progress}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Gecikme Durumu:</div>
                        <div className="col-span-2">
                          {selectedPlan.delayTime !== null ? (
                            <span>
                              {selectedPlan.delayTime > 0 
                                ? (
                                  <Badge className="bg-red-100 text-red-800 border-red-200">
                                    {selectedPlan.delayTime} saat gecikme
                                  </Badge>
                                ) 
                                : selectedPlan.delayTime < 0 
                                  ? (
                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                      {Math.abs(selectedPlan.delayTime)} saat önde
                                    </Badge>
                                  ) 
                                  : (
                                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                      Zamanında
                                    </Badge>
                                  )}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-2">Zamanlama Bilgileri</h3>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Planlanan Başlangıç:</div>
                        <div className="col-span-2">
                          {format(new Date(selectedPlan.plannedStartDate), "dd MMMM yyyy", { locale: tr })}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Planlanan Bitiş:</div>
                        <div className="col-span-2">
                          {format(new Date(selectedPlan.plannedEndDate), "dd MMMM yyyy", { locale: tr })}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Gerçek Başlangıç:</div>
                        <div className="col-span-2">
                          {selectedPlan.actualStartDate 
                            ? format(new Date(selectedPlan.actualStartDate), "dd MMMM yyyy", { locale: tr })
                            : "-"}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-gray-500">Gerçek Bitiş:</div>
                        <div className="col-span-2">
                          {selectedPlan.actualEndDate 
                            ? format(new Date(selectedPlan.actualEndDate), "dd MMMM yyyy", { locale: tr })
                            : "-"}
                        </div>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold mt-4 mb-2">Refakat Kartları</h3>
                    <div className="text-sm grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 p-3 rounded-md border flex items-center justify-between">
                        <div>
                          <div className="font-medium">Toplam Kart</div>
                          <div className="text-xl font-bold">{selectedPlan.productionCardCount}</div>
                        </div>
                        <SquareStack className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md border flex items-center justify-between">
                        <div>
                          <div className="font-medium">Tamamlanan</div>
                          <div className="text-xl font-bold">{selectedPlan.completedCardCount}</div>
                        </div>
                        <CheckCircle2 className="h-8 w-8 text-green-400" />
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold mt-4 mb-2">Plan İzleme</h3>
                    <div className="bg-gray-50 p-3 rounded-md border text-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium">Plan İlerleme Durumu</div>
                        <Badge variant="outline">Canlı İzleme</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">Toplam İlerleme</div>
                          <div className="text-xs font-semibold">%{selectedPlan.progress}</div>
                        </div>
                        <Progress 
                          value={selectedPlan.progress} 
                          className={`h-2 ${getProgressColor(selectedPlan.progress)}`} 
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Başlangıç</span>
                          <span>Bitiş</span>
                        </div>
                      </div>
                      {/* Adım Göstergeleri */}
                      <div className="space-y-3 mt-4">
                        <div className="flex justify-between items-center">
                          <div className="text-xs font-medium">Dokuma</div>
                          <Badge className="bg-green-100 text-green-800 border-green-200">Tamamlandı</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs font-medium">Terbiye</div>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">Devam Ediyor</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs font-medium">Kalite Kontrol</div>
                          <Badge className="bg-gray-100 text-gray-800 border-gray-200">Bekliyor</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs font-medium">Paketleme</div>
                          <Badge className="bg-gray-100 text-gray-800 border-gray-200">Bekliyor</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-4">
                <Button variant="outline" onClick={() => setSelectedPlanId(null)}>
                  Kapat
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Makine Detay Dialog */}
      <Dialog open={showMachineDetailsDialog} onOpenChange={setShowMachineDetailsDialog}>
        <DialogContent className="sm:max-w-[800px]">
          {selectedMachine ? (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <DialogTitle>{selectedMachine.name}</DialogTitle>
                  {getMachineStatusBadge(selectedMachine.status)}
                </div>
                <DialogDescription>
                  {selectedMachine.departmentName} - {selectedMachine.type}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Performans Göstergeleri</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded-md border">
                        <div className="text-xs text-gray-500">Verimlilik</div>
                        <div className="text-xl font-bold">%{selectedMachine.efficiency}</div>
                        <Progress 
                          value={selectedMachine.efficiency} 
                          className={`h-1.5 mt-1 ${getProgressColor(selectedMachine.efficiency)}`} 
                        />
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md border">
                        <div className="text-xs text-gray-500">Kullanım</div>
                        <div className="text-xl font-bold">%{selectedMachine.utilization}</div>
                        <Progress 
                          value={selectedMachine.utilization} 
                          className={`h-1.5 mt-1 ${getProgressColor(selectedMachine.utilization)}`} 
                        />
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md border">
                        <div className="text-xs text-gray-500">Hız</div>
                        <div className="text-xl font-bold">{selectedMachine.speed}/sa</div>
                      </div>
                      {selectedMachine.runningTime && (
                        <div className="bg-gray-50 p-3 rounded-md border">
                          <div className="text-xs text-gray-500">Çalışma Süresi</div>
                          <div className="text-xl font-bold">
                            {Math.floor(selectedMachine.runningTime / 60)}:{String(selectedMachine.runningTime % 60).padStart(2, '0')}
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedMachine.currentOrderCode && (
                      <div className="mt-4">
                        <h3 className="text-sm font-semibold mb-2">Mevcut İş</h3>
                        <div className="bg-gray-50 p-3 rounded-md border">
                          <div className="flex justify-between">
                            <div className="text-sm font-medium">{selectedMachine.currentJobName}</div>
                            <Badge variant="outline">{selectedMachine.currentOrderCode}</Badge>
                          </div>
                          {selectedMachine.startTime && (
                            <div className="text-xs text-gray-500 mt-1">
                              Başlangıç: {format(new Date(selectedMachine.startTime), "dd MMM HH:mm", { locale: tr })}
                            </div>
                          )}
                          {selectedMachine.operatorName && (
                            <div className="text-xs text-gray-500 mt-1">
                              Operatör: {selectedMachine.operatorName}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <h3 className="text-sm font-semibold mb-2">Bakım Bilgileri</h3>
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-gray-500">Son Bakım:</div>
                          <div className="col-span-2">
                            {selectedMachine.lastMaintenanceDate 
                              ? format(new Date(selectedMachine.lastMaintenanceDate), "dd MMMM yyyy", { locale: tr })
                              : "-"}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-gray-500">Sonraki Bakım:</div>
                          <div className="col-span-2">
                            {selectedMachine.nextMaintenanceDate 
                              ? format(new Date(selectedMachine.nextMaintenanceDate), "dd MMMM yyyy", { locale: tr })
                              : "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Telemetri Verileri</h3>
                    {selectedMachine.telemetry ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 p-3 rounded-md border">
                            <div className="flex justify-between">
                              <div className="text-xs text-gray-500">Sıcaklık</div>
                              <div className={`text-xs font-medium ${
                                getTelemetryStatus(selectedMachine.telemetry.temperature, 100, 80, 20)
                              }`}>
                                {selectedMachine.telemetry.temperature}°C
                              </div>
                            </div>
                            <Progress 
                              value={(selectedMachine.telemetry.temperature / 100) * 100} 
                              className={`h-1.5 mt-2 ${
                                getTelemetryStatus(selectedMachine.telemetry.temperature, 100, 80, 20).replace('text-', 'bg-')
                              }`} 
                            />
                          </div>
                          <div className="bg-gray-50 p-3 rounded-md border">
                            <div className="flex justify-between">
                              <div className="text-xs text-gray-500">Titreşim</div>
                              <div className={`text-xs font-medium ${
                                getTelemetryStatus(selectedMachine.telemetry.vibration, 30, 80, 20)
                              }`}>
                                {selectedMachine.telemetry.vibration} Hz
                              </div>
                            </div>
                            <Progress 
                              value={(selectedMachine.telemetry.vibration / 30) * 100} 
                              className={`h-1.5 mt-2 ${
                                getTelemetryStatus(selectedMachine.telemetry.vibration, 30, 80, 20).replace('text-', 'bg-')
                              }`} 
                            />
                          </div>
                          <div className="bg-gray-50 p-3 rounded-md border">
                            <div className="flex justify-between">
                              <div className="text-xs text-gray-500">Güç Tüketimi</div>
                              <div className={`text-xs font-medium ${
                                getTelemetryStatus(selectedMachine.telemetry.power, 500, 80, 20)
                              }`}>
                                {selectedMachine.telemetry.power} kW
                              </div>
                            </div>
                            <Progress 
                              value={(selectedMachine.telemetry.power / 500) * 100} 
                              className={`h-1.5 mt-2 ${
                                getTelemetryStatus(selectedMachine.telemetry.power, 500, 80, 20).replace('text-', 'bg-')
                              }`} 
                            />
                          </div>
                          <div className="bg-gray-50 p-3 rounded-md border">
                            <div className="flex justify-between">
                              <div className="text-xs text-gray-500">Hız</div>
                              <div className={`text-xs font-medium ${
                                getTelemetryStatus(selectedMachine.telemetry.speed, 100, 80, 20)
                              }`}>
                                {selectedMachine.telemetry.speed} birim/sa
                              </div>
                            </div>
                            <Progress 
                              value={(selectedMachine.telemetry.speed / 100) * 100} 
                              className={`h-1.5 mt-2 ${
                                getTelemetryStatus(selectedMachine.telemetry.speed, 100, 80, 20).replace('text-', 'bg-')
                              }`} 
                            />
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold mb-2">Telemetri Geçmişi</h3>
                          <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={telemetryHistory}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis yAxisId="left" orientation="left" domain={[0, 100]} />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                                <ReTooltip />
                                <Line 
                                  yAxisId="left"
                                  type="monotone" 
                                  dataKey="temperature" 
                                  stroke="#ef4444" 
                                  name="Sıcaklık (°C)"
                                  dot={false}
                                />
                                <Line 
                                  yAxisId="right"
                                  type="monotone" 
                                  dataKey="vibration" 
                                  stroke="#3b82f6" 
                                  name="Titreşim (Hz)"
                                  dot={false}
                                />
                                <Line 
                                  yAxisId="right"
                                  type="monotone" 
                                  dataKey="power" 
                                  stroke="#10b981" 
                                  name="Güç (kW/5)"
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    ) : telemetryLoading ? (
                      <div className="flex items-center justify-center p-6">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                          <p className="text-sm">Telemetri verileri yükleniyor...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-md border p-6 text-center">
                        <Bot className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                        <p className="text-gray-500">Telemetri verilerine erişilemiyor.</p>
                      </div>
                    )}

                    {selectedMachine.alerts && selectedMachine.alerts.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-semibold mb-2">Uyarılar ve Alarmlar</h3>
                        <div className="space-y-2">
                          {selectedMachine.alerts.map((alert, index) => (
                            <div 
                              key={index}
                              className={`flex items-center p-2 rounded-md ${
                                alert.type === 'critical' ? 'bg-red-50 text-red-700' :
                                alert.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                                'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {alert.type === 'critical' ? (
                                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                              ) : alert.type === 'warning' ? (
                                <Bell className="h-4 w-4 mr-2 flex-shrink-0" />
                              ) : (
                                <Activity className="h-4 w-4 mr-2 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <div className="text-sm font-medium">{alert.message}</div>
                                <div className="text-xs">
                                  {format(new Date(alert.timestamp), "dd MMM yyyy HH:mm", { locale: tr })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowMachineDetailsDialog(false)}>
                  Kapat
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="p-6 text-center">
              <Activity className="mx-auto h-10 w-10 text-gray-300 mb-2" />
              <h3 className="font-semibold mb-1">Makine bulunamadı</h3>
              <p className="text-sm text-gray-500">
                Seçilen makine bulunamadı veya verilerine erişilemiyor.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default LiveMonitoring;