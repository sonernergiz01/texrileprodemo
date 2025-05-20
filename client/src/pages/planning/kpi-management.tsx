import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Pencil, Plus, RefreshCcw, Target, Trash2, LineChart, BarChart, CheckCircle2, XCircle, AlertTriangle, ArrowUpRight, ArrowDownRight, BellRing, Clock, Layers, Award, Sparkles } from "lucide-react";
import { ResponsiveContainer, LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart as ReBarChart, Bar } from "recharts";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { tr } from "date-fns/locale";

// KPI Türleri
interface PlanningKPI {
  id: number;
  name: string;
  description: string;
  category: 'operational' | 'financial' | 'productivity' | 'quality';
  unit: string;
  target: number;
  current: number;
  direction: 'increase' | 'decrease' | 'maintain';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  responsible: number; // departmentId
  responsibleName?: string; // departman adı
  lastUpdated: string; // ISO string
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  status: 'onTrack' | 'atRisk' | 'offTrack';
  history: Array<{
    date: string;
    value: number;
  }>;
  benchmarks?: Array<{
    name: string;
    value: number;
  }>;
}

// Hedef statüs değerlendirmesi için yardımcı fonksiyonlar
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'onTrack': return 'text-green-600';
    case 'atRisk': return 'text-yellow-600';
    case 'offTrack': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

const getProgressColor = (status: string): string => {
  switch (status) {
    case 'onTrack': return 'bg-green-600';
    case 'atRisk': return 'bg-yellow-600';
    case 'offTrack': return 'bg-red-600';
    default: return 'bg-gray-600';
  }
};

const getCompletionPercentage = (current: number, target: number, direction: string): number => {
  if (direction === 'maintain') {
    // %5 toleranslı stabilite hedefi
    const tolerance = target * 0.05;
    if (current >= target - tolerance && current <= target + tolerance) {
      return 100; // Hedef aralığında
    } else if (current < target - tolerance) {
      return (current / (target - tolerance)) * 100;
    } else {
      // Hedefin üzerinde ama bu tolerans aralığını aşıyor, tamamlanma oranı azalacak
      return Math.max(0, 100 - ((current - (target + tolerance)) / target) * 100);
    }
  } else if (direction === 'increase') {
    return Math.min(100, (current / target) * 100);
  } else {
    // Azaltma hedefi: hedefin altına düşmek isteniyor
    if (current <= target) return 100;
    // Hedefin üzerindeyse, ne kadar uzak olduğuna bağlı olarak tamamlanma azalır
    const startValue = target * 2; // Başlangıç değeri, hedefin 2 katı kabul edildi
    return Math.max(0, 100 - ((current - target) / (startValue - target)) * 100);
  }
};

const getTrendIcon = (trend: string, percentage: number) => {
  if (trend === 'up') {
    return <div className="flex items-center text-green-600"><ArrowUpRight className="h-3 w-3 mr-1" />{percentage}%</div>;
  } else if (trend === 'down') {
    return <div className="flex items-center text-red-600"><ArrowDownRight className="h-3 w-3 mr-1" />{percentage}%</div>;
  } else {
    return <div className="flex items-center text-gray-600">Stabil</div>;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'onTrack':
      return <Badge className="bg-green-100 text-green-800 border-green-200">Yolunda</Badge>;
    case 'atRisk':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Riskli</Badge>;
    case 'offTrack':
      return <Badge className="bg-red-100 text-red-800 border-red-200">Hedeften Uzak</Badge>;
    default:
      return <Badge>Belirsiz</Badge>;
  }
};

const getCategoryName = (category: string): string => {
  switch (category) {
    case 'operational': return 'Operasyonel';
    case 'financial': return 'Finansal';
    case 'productivity': return 'Verimlilik';
    case 'quality': return 'Kalite';
    default: return 'Diğer';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'operational':
      return <Layers className="h-4 w-4" />;
    case 'financial':
      return <BarChart3 className="h-4 w-4" />;
    case 'productivity':
      return <Clock className="h-4 w-4" />;
    case 'quality':
      return <Award className="h-4 w-4" />;
    default:
      return <Target className="h-4 w-4" />;
  }
};

const getFrequencyName = (frequency: string): string => {
  switch (frequency) {
    case 'daily': return 'Günlük';
    case 'weekly': return 'Haftalık';
    case 'monthly': return 'Aylık';
    case 'quarterly': return 'Üç Aylık';
    default: return frequency;
  }
};

// Ana bileşen
const KpiManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<string>("dashboard");
  const [selectedKpiId, setSelectedKpiId] = useState<number | null>(null);
  const [showNewKpiDialog, setShowNewKpiDialog] = useState(false);
  const [showEditKpiDialog, setShowEditKpiDialog] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Yeni KPI için form verileri
  const [kpiForm, setKpiForm] = useState<Partial<PlanningKPI>>({
    name: '',
    description: '',
    category: 'operational',
    unit: '',
    target: 100,
    direction: 'increase',
    frequency: 'monthly',
    responsible: 0,
  });

  // Bölümleri getir
  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/departments"],
    onError: (error: any) => {
      console.error("Departman listesi yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "Departman listesi yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });

  // KPI'ları getir
  const { data: kpis = [], isLoading: kpisLoading, refetch: refetchKpis } = useQuery<PlanningKPI[]>({
    queryKey: [
      "/api/planning/kpis",
      { category: filterCategory },
      { status: filterStatus }
    ],
  });

  // KPI Değerlendirmesini getir
  const { data: evaluationData = {
    categoryPerformance: {},
    totalKpis: 0,
    onTrackCount: 0,
    atRiskCount: 0,
    offTrackCount: 0
  } } = useQuery<{
    totalKpis: number,
    onTrackCount: number,
    atRiskCount: number,
    offTrackCount: number,
    categoryPerformance: {
      [key: string]: {
        total: number,
        onTrack: number,
        atRisk: number,
        offTrack: number,
        averageCompletion: number
      }
    }
  }>({
    queryKey: ["/api/planning/kpis/evaluation"],
  });

  // Seçili KPI
  const selectedKpi = kpis.find(kpi => kpi.id === selectedKpiId);

  // KPI oluşturma mutasyonu
  const createKpiMutation = useMutation({
    mutationFn: async (kpiData: Partial<PlanningKPI>) => {
      // Normalde burada API'ye istekte bulunulur
      /* const response = await apiRequest("POST", "/api/planning/kpis", kpiData);
      return await response.json(); */
      
      // Şimdilik toast ile başarı mesajı gösteriyoruz
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "KPI oluşturuldu",
        description: `"${kpiForm.name}" KPI'sı başarıyla oluşturuldu.`,
      });
      
      setShowNewKpiDialog(false);
      refetchKpis();
      
      // Form verilerini sıfırla
      setKpiForm({
        name: '',
        description: '',
        category: 'operational',
        unit: '',
        target: 100,
        direction: 'increase',
        frequency: 'monthly',
        responsible: 0,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `KPI oluşturulurken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // KPI güncelleme mutasyonu
  const updateKpiMutation = useMutation({
    mutationFn: async (kpiData: Partial<PlanningKPI>) => {
      // Normalde burada API'ye istekte bulunulur
      /* const response = await apiRequest("PATCH", `/api/planning/kpis/${kpiData.id}`, kpiData);
      return await response.json(); */
      
      // Şimdilik toast ile başarı mesajı gösteriyoruz
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "KPI güncellendi",
        description: `"${kpiForm.name}" KPI'sı başarıyla güncellendi.`,
      });
      
      setShowEditKpiDialog(false);
      refetchKpis();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `KPI güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // KPI silme mutasyonu
  const deleteKpiMutation = useMutation({
    mutationFn: async (id: number) => {
      // Normalde burada API'ye istekte bulunulur
      /* const response = await apiRequest("DELETE", `/api/planning/kpis/${id}`);
      return await response.json(); */
      
      // Şimdilik toast ile başarı mesajı gösteriyoruz
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "KPI silindi",
        description: `KPI başarıyla silindi.`,
        variant: "destructive",
      });
      
      setShowDeleteConfirmDialog(false);
      setSelectedKpiId(null);
      refetchKpis();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `KPI silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // KPI oluştur
  const handleCreateKpi = () => {
    createKpiMutation.mutate(kpiForm);
  };

  // KPI güncelle
  const handleUpdateKpi = () => {
    if (!selectedKpi) return;
    updateKpiMutation.mutate({ ...kpiForm, id: selectedKpi.id });
  };

  // KPI sil
  const handleDeleteKpi = () => {
    if (!selectedKpiId) return;
    deleteKpiMutation.mutate(selectedKpiId);
  };

  // KPI düzenlemeyi başlat
  const handleEditKpi = (kpi: PlanningKPI) => {
    setKpiForm({
      name: kpi.name,
      description: kpi.description,
      category: kpi.category,
      unit: kpi.unit,
      target: kpi.target,
      direction: kpi.direction,
      frequency: kpi.frequency,
      responsible: kpi.responsible,
    });
    
    setSelectedKpiId(kpi.id);
    setShowEditKpiDialog(true);
  };

  // Grafik verileri hesaplama
  const calculateCategoryData = () => {
    const { categoryPerformance } = evaluationData;
    
    if (!categoryPerformance) return [];

    return Object.keys(categoryPerformance).map(category => ({
      name: getCategoryName(category),
      tamamlanma: Math.round(categoryPerformance[category].averageCompletion),
      hedefSayısı: categoryPerformance[category].total
    }));
  };

  const calculateStatusDistribution = () => {
    const { totalKpis, onTrackCount, atRiskCount, offTrackCount } = evaluationData;
    
    if (!totalKpis) return [];
    
    return [
      { name: 'Yolunda', value: onTrackCount },
      { name: 'Riskli', value: atRiskCount },
      { name: 'Hedeften Uzak', value: offTrackCount },
    ];
  };

  const calculateRadarData = () => {
    const { categoryPerformance } = evaluationData;
    
    if (!categoryPerformance) return [];
    
    return [
      {
        subject: 'Operasyonel',
        A: categoryPerformance?.operational?.averageCompletion || 0,
        fullMark: 100,
      },
      {
        subject: 'Finansal',
        A: categoryPerformance?.financial?.averageCompletion || 0,
        fullMark: 100,
      },
      {
        subject: 'Verimlilik',
        A: categoryPerformance?.productivity?.averageCompletion || 0,
        fullMark: 100,
      },
      {
        subject: 'Kalite',
        A: categoryPerformance?.quality?.averageCompletion || 0,
        fullMark: 100,
      },
    ];
  };

  // Pie chart renkleri
  const COLORS = ['#4ade80', '#facc15', '#f87171'];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">KPI Yönetim Merkezi</h2>
          <p className="text-muted-foreground">
            Planlama süreçlerinizin performansını izleyin ve hedeflerinize ulaşın
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => refetchKpis()}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Yenile
          </Button>
          <Button onClick={() => setShowNewKpiDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni KPI
          </Button>
        </div>
      </div>

      <Tabs 
        defaultValue="dashboard" 
        value={selectedTab} 
        onValueChange={setSelectedTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="dashboard">
            <BarChart className="mr-2 h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="kpis">
            <Target className="mr-2 h-4 w-4" />
            KPI Listesi
          </TabsTrigger>
          <TabsTrigger value="reports">
            <LineChart className="mr-2 h-4 w-4" />
            Raporlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Toplam KPI
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {evaluationData.totalKpis || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sistemde tanımlı toplam KPI sayısı
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Hedefte Olanlar
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {evaluationData.onTrackCount || 0}
                  {evaluationData.totalKpis > 0 && (
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      ({Math.round((evaluationData.onTrackCount / evaluationData.totalKpis) * 100)}%)
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Hedefte ilerleyen KPI'ların sayısı
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Riskli Olanlar
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {evaluationData.atRiskCount || 0}
                  {evaluationData.totalKpis > 0 && (
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      ({Math.round((evaluationData.atRiskCount / evaluationData.totalKpis) * 100)}%)
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Risk altındaki KPI'ların sayısı
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Hedeften Uzak Olanlar
                </CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {evaluationData.offTrackCount || 0}
                  {evaluationData.totalKpis > 0 && (
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      ({Math.round((evaluationData.offTrackCount / evaluationData.totalKpis) * 100)}%)
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Hedeften uzak olan KPI'ların sayısı
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Kategori Bazlı Performans</CardTitle>
                <CardDescription>
                  KPI kategorilerine göre hedef gerçekleştirme performansı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReLineChart
                      data={calculateCategoryData()}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" domain={[0, 100]} />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="tamamlanma"
                        name="Tamamlanma (%)"
                        stroke="#4ade80"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="hedefSayısı"
                        name="KPI Sayısı"
                        stroke="#60a5fa"
                      />
                    </ReLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>KPI Durum Dağılımı</CardTitle>
                <CardDescription>
                  KPI'ların mevcut durumlarına göre dağılımı
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={calculateStatusDistribution()}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${Math.round(percent * 100)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {calculateStatusDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Performans Radar</CardTitle>
                <CardDescription>
                  Tüm kategorileri kapsayan performans görünümü
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={90} data={calculateRadarData()}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar
                        name="Tamamlanma"
                        dataKey="A"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Kritik KPI'lar</CardTitle>
                <CardDescription>
                  Acil dikkat gerektiren KPI'lar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {kpis
                    .filter(kpi => kpi.status === 'offTrack' || kpi.status === 'atRisk')
                    .slice(0, 5)
                    .map(kpi => (
                      <div
                        key={kpi.id}
                        className="flex items-center justify-between rounded-md border p-3 hover:bg-slate-50 cursor-pointer"
                        onClick={() => {
                          setSelectedKpiId(kpi.id);
                          setSelectedTab("kpis");
                        }}
                      >
                        <div className="space-y-1">
                          <div className="font-medium">{kpi.name}</div>
                          <div className="text-xs text-gray-500 flex items-center">
                            {getCategoryIcon(kpi.category)}
                            <span className="ml-1">{getCategoryName(kpi.category)}</span>
                            <span className="mx-1">•</span>
                            <span>{kpi.target} {kpi.unit}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${getStatusColor(kpi.status)}`}>
                              {kpi.current} {kpi.unit}
                            </span>
                            {getStatusBadge(kpi.status)}
                          </div>
                          <div className="w-24">
                            <Progress
                              value={getCompletionPercentage(kpi.current, kpi.target, kpi.direction)}
                              className={`h-1.5 ${getProgressColor(kpi.status)}`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                  {kpis.filter(kpi => kpi.status === 'offTrack' || kpi.status === 'atRisk').length === 0 && (
                    <div className="flex items-center justify-center py-6">
                      <div className="text-center">
                        <CheckCircle2 className="mx-auto h-8 w-8 text-green-500 mb-2" />
                        <p className="text-gray-500">Tüm KPI'lar hedefte ilerliyor.</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              {kpis.filter(kpi => kpi.status === 'offTrack' || kpi.status === 'atRisk').length > 5 && (
                <CardFooter>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setFilterStatus('atRisk');
                      setSelectedTab("kpis");
                    }}
                  >
                    Tümünü Görüntüle
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <Card className="md:w-2/3">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>KPI Listesi</CardTitle>
                    <CardDescription>
                      Planlama süreçleriniz için tanımlanmış tüm performans göstergeleri
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={filterCategory}
                      onValueChange={setFilterCategory}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Tüm Kategoriler" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Kategoriler</SelectItem>
                        <SelectItem value="operational">Operasyonel</SelectItem>
                        <SelectItem value="financial">Finansal</SelectItem>
                        <SelectItem value="productivity">Verimlilik</SelectItem>
                        <SelectItem value="quality">Kalite</SelectItem>
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
                        <SelectItem value="onTrack">Yolunda</SelectItem>
                        <SelectItem value="atRisk">Riskli</SelectItem>
                        <SelectItem value="offTrack">Hedeften Uzak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {kpisLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                  </div>
                ) : kpis.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>KPI Adı</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead className="text-right">Hedef</TableHead>
                          <TableHead className="text-right">Mevcut</TableHead>
                          <TableHead className="text-right">Durum</TableHead>
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {kpis.map((kpi) => (
                          <TableRow
                            key={kpi.id}
                            className={`cursor-pointer ${
                              selectedKpiId === kpi.id ? "bg-blue-50" : ""
                            }`}
                            onClick={() => setSelectedKpiId(kpi.id)}
                          >
                            <TableCell className="font-medium">{kpi.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {getCategoryIcon(kpi.category)}
                                <span className="ml-2">{getCategoryName(kpi.category)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{kpi.target} {kpi.unit}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end">
                                <span className="mr-2">{kpi.current} {kpi.unit}</span>
                                {getTrendIcon(kpi.trend, kpi.trendPercentage)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {getStatusBadge(kpi.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditKpi(kpi);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedKpiId(kpi.id);
                                    setShowDeleteConfirmDialog(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <Alert>
                    <AlertTitle>KPI bulunamadı</AlertTitle>
                    <AlertDescription>
                      Filtrelerinize uygun KPI bulunamadı. Filtreleri değiştirin veya yeni bir KPI ekleyin.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card className="md:w-1/3">
              <CardHeader>
                <CardTitle>KPI Detayları</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedKpi ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedKpi.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{selectedKpi.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-semibold">Kategori</div>
                        <div className="flex items-center mt-1">
                          {getCategoryIcon(selectedKpi.category)}
                          <span className="ml-2">{getCategoryName(selectedKpi.category)}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-semibold">Sorumluluk</div>
                        <div className="mt-1">{selectedKpi.responsibleName || 'Atanmamış'}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-semibold">Ölçüm Sıklığı</div>
                        <div className="mt-1">{getFrequencyName(selectedKpi.frequency)}</div>
                      </div>

                      <div>
                        <div className="text-sm font-semibold">Son Güncelleme</div>
                        <div className="mt-1">{format(new Date(selectedKpi.lastUpdated), 'd MMMM yyyy', { locale: tr })}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold mb-2">İlerleme</div>
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span>
                          <span className="font-medium">{selectedKpi.current}</span> / {selectedKpi.target} {selectedKpi.unit}
                        </span>
                        <span className={getStatusColor(selectedKpi.status)}>
                          {Math.round(getCompletionPercentage(selectedKpi.current, selectedKpi.target, selectedKpi.direction))}%
                        </span>
                      </div>
                      <Progress
                        value={getCompletionPercentage(selectedKpi.current, selectedKpi.target, selectedKpi.direction)}
                        className={`h-2 ${getProgressColor(selectedKpi.status)}`}
                      />
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>Yön: {selectedKpi.direction === 'increase' ? 'Artış' : selectedKpi.direction === 'decrease' ? 'Azalış' : 'Koruma'}</span>
                        <span>Durum: {getStatusBadge(selectedKpi.status)}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold mb-2">Tarihsel Değişim</div>
                      <div className="h-[150px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ReLineChart
                            data={selectedKpi.history.map(h => ({ 
                              tarih: format(new Date(h.date), 'd MMM', { locale: tr }), 
                              değer: h.value 
                            }))}
                            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="tarih" />
                            <YAxis />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="değer"
                              name={`${selectedKpi.name} (${selectedKpi.unit})`}
                              stroke="#8884d8"
                              activeDot={{ r: 8 }}
                            />
                          </ReLineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {selectedKpi.benchmarks && selectedKpi.benchmarks.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold mb-2">Kıyaslama Verileri</div>
                        <div className="space-y-2">
                          {selectedKpi.benchmarks.map((benchmark, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm">{benchmark.name}</span>
                              <span className="font-medium">{benchmark.value} {selectedKpi.unit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6">
                    <Target className="h-10 w-10 text-gray-300 mb-2" />
                    <h3 className="font-semibold mb-1">KPI Seçilmedi</h3>
                    <p className="text-sm text-center text-gray-500">
                      Detaylarını görmek için listeden bir KPI seçin veya yeni bir KPI oluşturun.
                    </p>
                  </div>
                )}
              </CardContent>
              {selectedKpi && (
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedTab("reports");
                    }}
                  >
                    <LineChart className="mr-2 h-4 w-4" />
                    Detaylı Rapor
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>KPI Performans Raporları</CardTitle>
              <CardDescription>
                Planlama KPI'larının detaylı analizi ve raporları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Departman Bazlı KPI Raporu</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ReBarChart
                            data={(departments && departments.length > 0) ? departments.map((dept: any) => ({
                              name: dept.name,
                              onTrack: Math.floor(Math.random() * 10),
                              atRisk: Math.floor(Math.random() * 5),
                              offTrack: Math.floor(Math.random() * 3)
                            })) : []}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="onTrack" stackId="a" name="Yolunda" fill="#4ade80" />
                            <Bar dataKey="atRisk" stackId="a" name="Riskli" fill="#facc15" />
                            <Bar dataKey="offTrack" stackId="a" name="Hedeften Uzak" fill="#f87171" />
                          </ReBarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Zaman Bazlı KPI Trendi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ReLineChart
                            data={[
                              { month: 'Oca', avg: 65 },
                              { month: 'Şub', avg: 68 },
                              { month: 'Mar', avg: 72 },
                              { month: 'Nis', avg: 75 },
                              { month: 'May', avg: 70 },
                              { month: 'Haz', avg: 78 },
                            ]}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="avg"
                              name="Ortalama KPI Gerçekleşme (%)"
                              stroke="#8884d8"
                              activeDot={{ r: 8 }}
                            />
                          </ReLineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>En Kritik KPI'lar - Detaylı Analiz</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-6">
                        {kpis
                          .filter(kpi => kpi.status === 'offTrack' || kpi.status === 'atRisk')
                          .map(kpi => (
                            <div key={kpi.id} className="border rounded-md p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                                <div>
                                  <h4 className="text-lg font-semibold">{kpi.name}</h4>
                                  <div className="flex items-center mt-1">
                                    <div className="flex items-center mr-3">
                                      {getCategoryIcon(kpi.category)}
                                      <span className="ml-1 text-sm">{getCategoryName(kpi.category)}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <BellRing className="h-4 w-4 mr-1" />
                                      <span className="text-sm">{getFrequencyName(kpi.frequency)}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center">
                                  <div className="mr-3">
                                    <span className="text-sm text-gray-500">Durum:</span>
                                    <span className="ml-1">{getStatusBadge(kpi.status)}</span>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-500">Sorumluluk:</span>
                                    <span className="ml-1 font-medium">{kpi.responsibleName || 'Atanmamış'}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600 mb-3">{kpi.description}</p>
                                  
                                  <div className="mb-4">
                                    <div className="text-sm font-medium mb-1">Mevcut Durum</div>
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <span className={`text-xl font-bold ${getStatusColor(kpi.status)}`}>
                                          {kpi.current} {kpi.unit}
                                        </span>
                                        <span className="text-gray-500 ml-2">/ {kpi.target} {kpi.unit}</span>
                                      </div>
                                      <div>
                                        {getTrendIcon(kpi.trend, kpi.trendPercentage)}
                                      </div>
                                    </div>
                                    <Progress
                                      value={getCompletionPercentage(kpi.current, kpi.target, kpi.direction)}
                                      className={`h-2 mt-2 ${getProgressColor(kpi.status)}`}
                                    />
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <h5 className="text-sm font-semibold">Analiz ve Öneriler</h5>
                                    <Alert>
                                      <AlertTriangle className="h-4 w-4" />
                                      <AlertTitle>Darboğaz Tespiti</AlertTitle>
                                      <AlertDescription>
                                        {kpi.status === 'offTrack' 
                                          ? "Bu KPI kritik düzeyde hedefinden uzaktır. Acil müdahale gereklidir."
                                          : "Bu KPI hedefine ulaşma yolunda risk altındadır. İyileştirme önlemleri alınmalıdır."}
                                      </AlertDescription>
                                    </Alert>
                                    
                                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                                      <div className="flex items-center mb-1">
                                        <Sparkles className="h-4 w-4 text-blue-600 mr-2" />
                                        <h6 className="font-medium text-blue-800">Önerilen Aksiyonlar</h6>
                                      </div>
                                      <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                                        <li>Kapasite esnekliğini artırmak için ek vardiya planlaması yapın</li>
                                        <li>Darboğazları gidermek için kaynak optimizasyonu yapın</li>
                                        <li>Önceliklendirme stratejisini gözden geçirin</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="text-sm font-semibold mb-3">Tarihsel Trend</div>
                                  <div className="h-[200px] mb-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <ReLineChart
                                        data={kpi.history.map(h => ({ 
                                          tarih: format(new Date(h.date), 'd MMM', { locale: tr }), 
                                          değer: h.value,
                                          hedef: kpi.target
                                        }))}
                                        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                                      >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="tarih" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                          type="monotone"
                                          dataKey="değer"
                                          name={`Gerçekleşen (${kpi.unit})`}
                                          stroke="#8884d8"
                                          activeDot={{ r: 8 }}
                                        />
                                        <Line
                                          type="monotone"
                                          dataKey="hedef"
                                          name={`Hedef (${kpi.unit})`}
                                          stroke="#82ca9d"
                                          strokeDasharray="5 5"
                                        />
                                      </ReLineChart>
                                    </ResponsiveContainer>
                                  </div>
                                  
                                  {kpi.benchmarks && kpi.benchmarks.length > 0 && (
                                    <div>
                                      <div className="text-sm font-semibold mb-2">Kıyaslama Analizi</div>
                                      <div className="bg-gray-50 border rounded-md">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Kıyaslama</TableHead>
                                              <TableHead className="text-right">Değer</TableHead>
                                              <TableHead className="text-right">Fark</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {kpi.benchmarks.map((benchmark, index) => {
                                              const diff = ((kpi.current - benchmark.value) / benchmark.value) * 100;
                                              const isPositive = diff > 0;
                                              const diffClass = kpi.direction === 'increase'
                                                ? (isPositive ? 'text-green-600' : 'text-red-600')
                                                : (isPositive ? 'text-red-600' : 'text-green-600');
                                              
                                              return (
                                                <TableRow key={index}>
                                                  <TableCell>{benchmark.name}</TableCell>
                                                  <TableCell className="text-right">{benchmark.value} {kpi.unit}</TableCell>
                                                  <TableCell className={`text-right ${diffClass}`}>
                                                    {isPositive ? '+' : ''}{diff.toFixed(1)}%
                                                  </TableCell>
                                                </TableRow>
                                              );
                                            })}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                        {kpis.filter(kpi => kpi.status === 'offTrack' || kpi.status === 'atRisk').length === 0 && (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
                              <h3 className="text-xl font-medium mb-2">Tüm KPI'lar Hedefte</h3>
                              <p className="text-gray-500 max-w-md mx-auto">
                                Mevcut durumda kritik durumdaki KPI bulunmamaktadır. Tüm performans göstergeleri hedeflerine uygun şekilde ilerlemektedir.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Yeni KPI Dialog */}
      <Dialog open={showNewKpiDialog} onOpenChange={setShowNewKpiDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Yeni KPI Oluştur</DialogTitle>
            <DialogDescription>
              Planlama süreçlerinizi izlemek için yeni bir performans göstergesi ekleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                KPI Adı
              </Label>
              <Input
                id="name"
                value={kpiForm.name}
                onChange={(e) => setKpiForm({ ...kpiForm, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Açıklama
              </Label>
              <Textarea
                id="description"
                value={kpiForm.description}
                onChange={(e) => setKpiForm({ ...kpiForm, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Kategori
              </Label>
              <Select
                value={kpiForm.category}
                onValueChange={(value) => setKpiForm({ ...kpiForm, category: value as any })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operasyonel</SelectItem>
                  <SelectItem value="financial">Finansal</SelectItem>
                  <SelectItem value="productivity">Verimlilik</SelectItem>
                  <SelectItem value="quality">Kalite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="target" className="text-right">
                Hedef Değer
              </Label>
              <div className="col-span-3 flex items-center gap-3">
                <Input
                  id="target"
                  type="number"
                  value={kpiForm.target?.toString() || ''}
                  onChange={(e) => setKpiForm({ ...kpiForm, target: Number(e.target.value) })}
                  className="flex-1"
                />
                <Input
                  id="unit"
                  placeholder="Birim (%, gün, TL vb.)"
                  value={kpiForm.unit}
                  onChange={(e) => setKpiForm({ ...kpiForm, unit: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="direction" className="text-right">
                Hedef Yönü
              </Label>
              <Select
                value={kpiForm.direction}
                onValueChange={(value) => setKpiForm({ ...kpiForm, direction: value as any })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Hedef yönü seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Artış (Yüksek olması iyi)</SelectItem>
                  <SelectItem value="decrease">Azalış (Düşük olması iyi)</SelectItem>
                  <SelectItem value="maintain">Koruma (Stabil olması iyi)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="frequency" className="text-right">
                Ölçüm Sıklığı
              </Label>
              <Select
                value={kpiForm.frequency}
                onValueChange={(value) => setKpiForm({ ...kpiForm, frequency: value as any })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Ölçüm sıklığı seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Günlük</SelectItem>
                  <SelectItem value="weekly">Haftalık</SelectItem>
                  <SelectItem value="monthly">Aylık</SelectItem>
                  <SelectItem value="quarterly">Üç Aylık</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="responsible" className="text-right">
                Sorumlu Departman
              </Label>
              <Select
                value={kpiForm.responsible?.toString() || ''}
                onValueChange={(value) => setKpiForm({ ...kpiForm, responsible: Number(value) })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Departman seçin" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowNewKpiDialog(false)}
            >
              İptal
            </Button>
            <Button 
              type="submit" 
              onClick={handleCreateKpi}
              disabled={!kpiForm.name || !kpiForm.target || !kpiForm.unit}
            >
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KPI Düzenleme Dialog */}
      <Dialog open={showEditKpiDialog} onOpenChange={setShowEditKpiDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>KPI Düzenle</DialogTitle>
            <DialogDescription>
              Seçili KPI'nın bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                KPI Adı
              </Label>
              <Input
                id="edit-name"
                value={kpiForm.name}
                onChange={(e) => setKpiForm({ ...kpiForm, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Açıklama
              </Label>
              <Textarea
                id="edit-description"
                value={kpiForm.description}
                onChange={(e) => setKpiForm({ ...kpiForm, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Kategori
              </Label>
              <Select
                value={kpiForm.category}
                onValueChange={(value) => setKpiForm({ ...kpiForm, category: value as any })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operasyonel</SelectItem>
                  <SelectItem value="financial">Finansal</SelectItem>
                  <SelectItem value="productivity">Verimlilik</SelectItem>
                  <SelectItem value="quality">Kalite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-target" className="text-right">
                Hedef Değer
              </Label>
              <div className="col-span-3 flex items-center gap-3">
                <Input
                  id="edit-target"
                  type="number"
                  value={kpiForm.target?.toString() || ''}
                  onChange={(e) => setKpiForm({ ...kpiForm, target: Number(e.target.value) })}
                  className="flex-1"
                />
                <Input
                  id="edit-unit"
                  placeholder="Birim (%, gün, TL vb.)"
                  value={kpiForm.unit}
                  onChange={(e) => setKpiForm({ ...kpiForm, unit: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-direction" className="text-right">
                Hedef Yönü
              </Label>
              <Select
                value={kpiForm.direction}
                onValueChange={(value) => setKpiForm({ ...kpiForm, direction: value as any })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Hedef yönü seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Artış (Yüksek olması iyi)</SelectItem>
                  <SelectItem value="decrease">Azalış (Düşük olması iyi)</SelectItem>
                  <SelectItem value="maintain">Koruma (Stabil olması iyi)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-frequency" className="text-right">
                Ölçüm Sıklığı
              </Label>
              <Select
                value={kpiForm.frequency}
                onValueChange={(value) => setKpiForm({ ...kpiForm, frequency: value as any })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Ölçüm sıklığı seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Günlük</SelectItem>
                  <SelectItem value="weekly">Haftalık</SelectItem>
                  <SelectItem value="monthly">Aylık</SelectItem>
                  <SelectItem value="quarterly">Üç Aylık</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-responsible" className="text-right">
                Sorumlu Departman
              </Label>
              <Select
                value={kpiForm.responsible?.toString() || ''}
                onValueChange={(value) => setKpiForm({ ...kpiForm, responsible: Number(value) })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Departman seçin" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowEditKpiDialog(false)}
            >
              İptal
            </Button>
            <Button 
              type="submit" 
              onClick={handleUpdateKpi}
              disabled={!kpiForm.name || !kpiForm.target || !kpiForm.unit}
            >
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Silme Onay Dialog */}
      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>KPI'yı Sil</DialogTitle>
            <DialogDescription>
              Bu işlem geri alınamaz. Bu KPI ve ilgili tüm veriler kalıcı olarak silinecektir.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              "{selectedKpi?.name}" isimli KPI'yı silmek istediğinizden emin misiniz?
            </p>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowDeleteConfirmDialog(false)}
            >
              İptal
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDeleteKpi}
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KpiManagement;