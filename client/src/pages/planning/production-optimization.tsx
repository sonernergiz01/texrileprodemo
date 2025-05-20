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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarDateRangePicker } from "@/components/ui/date-range-picker";
import { 
  ArrowDownIcon, 
  ArrowUpDown, 
  ArrowUpIcon, 
  Beaker, 
  BellRing, 
  BrainCircuit, 
  Calendar as CalendarIcon, 
  Check, 
  ChevronsUpDown, 
  Clock, 
  Factory, 
  Filter, 
  Layers, 
  LineChart, 
  Loader2, 
  PieChart, 
  Play, 
  RefreshCcw, 
  Save, 
  Sparkles, 
  Target, 
  Trash2, 
  TrendingDown, 
  TrendingUp, 
  Zap
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, LineChart as ReLineChart, Line, PieChart as RePieChart, Pie, Cell, Scatter, ScatterChart, ZAxis } from "recharts";

// Optimizasyon önerisi türleri
interface OptimizationSuggestion {
  id: number;
  title: string;
  description: string;
  category: 'scheduling' | 'resource' | 'capacity' | 'workflow' | 'bottleneck';
  impact: {
    leadTime: number; // % değişim
    capacity: number; // % değişim
    cost: number; // % değişim
    quality: number; // % değişim
  };
  difficulty: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'inProgress' | 'implemented' | 'rejected';
  createdAt: string;
  implementedAt?: string;
  requiredResources: string[];
  affectedDepartments: number[]; // departman ID'leri
  affectedDepartmentNames?: string[]; // departman adları
  implementationSteps: string[];
  potentialRisks: string[];
  roi: number; // yatırım getirisi (%)
  paybackPeriod: number; // geri ödeme süresi (ay)
  score: number; // 0-100 arası
}

// Departman Türü
interface Department {
  id: number;
  name: string;
  code: string;
  color: string;
}

// Makine Türü
interface Machine {
  id: number;
  name: string;
  departmentId: number;
  type: string;
  status: 'active' | 'maintenance' | 'inactive';
}

// Üretim performans analizi türü
interface ProductionAnalysis {
  id: number;
  name: string;
  period: string;
  metrics: {
    throughput: number;
    cycleTime: number;
    wip: number;
    utilization: number;
    leadTime: number;
    onTimeDelivery: number;
    quality: number;
    changeover: number;
    uptime: number;
  };
  departmentEfficiency: Record<string, number>;
  machineEfficiency: Record<string, number>;
  bottlenecks: Array<{
    resourceId: number;
    resourceName: string;
    resourceType: 'machine' | 'department' | 'workforce';
    utilizationRate: number;
    idleTime: number;
    impact: number;
  }>;
  workflowIssues: Array<{
    id: number;
    description: string;
    impact: number;
    category: string;
  }>;
}

// Yapay zeka önerisi
interface AIRecommendation {
  id: number;
  title: string;
  description: string;
  category: string;
  reasoning: string;
  impact: Record<string, number>;
  score: number;
  confidence: number;
  applicability: number;
  implementationTime: string;
  relatedSuggestionIds: number[];
}

// Durum ve kategori badge'leri için yardımcılar
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'new':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Yeni</Badge>;
    case 'inProgress':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Devam Ediyor</Badge>;
    case 'implemented':
      return <Badge className="bg-green-100 text-green-800 border-green-200">Uygulandı</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-800 border-red-200">Reddedildi</Badge>;
    default:
      return <Badge>Bilinmiyor</Badge>;
  }
};

const getCategoryBadge = (category: string) => {
  switch (category) {
    case 'scheduling':
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Çizelgeleme</Badge>;
    case 'resource':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Kaynak</Badge>;
    case 'capacity':
      return <Badge className="bg-green-100 text-green-800 border-green-200">Kapasite</Badge>;
    case 'workflow':
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">İş Akışı</Badge>;
    case 'bottleneck':
      return <Badge className="bg-red-100 text-red-800 border-red-200">Darboğaz</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{category}</Badge>;
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'low':
      return <Badge className="bg-green-100 text-green-800 border-green-200">Düşük</Badge>;
    case 'medium':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Orta</Badge>;
    case 'high':
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Yüksek</Badge>;
    case 'critical':
      return <Badge className="bg-red-100 text-red-800 border-red-200">Kritik</Badge>;
    default:
      return <Badge>Bilinmiyor</Badge>;
  }
};

const getDifficultyBadge = (difficulty: string) => {
  switch (difficulty) {
    case 'low':
      return <Badge className="bg-green-100 text-green-800 border-green-200">Kolay</Badge>;
    case 'medium':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Orta</Badge>;
    case 'high':
      return <Badge className="bg-red-100 text-red-800 border-red-200">Zor</Badge>;
    default:
      return <Badge>Bilinmiyor</Badge>;
  }
};

// Etki değerlendirmesi için yardımcılar
const getImpactColor = (value: number): string => {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-600';
};

const getImpactIcon = (value: number) => {
  if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
  return null;
};

const getImpactValue = (value: number, reverse: boolean = false): string => {
  const prefix = value > 0 ? '+' : '';
  const displayValue = prefix + value.toFixed(1) + '%';

  // Bazı metriklerde azalma iyidir (maliyet, çevrim süresi gibi)
  if (reverse) {
    return value > 0 ? `${displayValue} 🔴` : value < 0 ? `${displayValue} 🟢` : displayValue;
  }

  // Normal metriklerde artış iyidir (kapasite, kalite gibi)
  return value > 0 ? `${displayValue} 🟢` : value < 0 ? `${displayValue} 🔴` : displayValue;
};

// Ana Bileşen
const ProductionOptimization: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<string>("suggestions");
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<number | null>(null);
  const [showAiRecommendationsDialog, setShowAiRecommendationsDialog] = useState(false);
  const [selectedAiRecommendationId, setSelectedAiRecommendationId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [date, setDate] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(new Date().setDate(new Date().getDate() + 30)),
  });

  // Bölümleri getir
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/admin/departments"],
  });

  // Makineleri getir
  const { data: machines = [] } = useQuery<Machine[]>({
    queryKey: ["/api/planning/machines"],
  });

  // Optimizasyon önerilerini getir
  const { data: suggestions = [], isLoading: suggestionsLoading, refetch: refetchSuggestions } = useQuery<OptimizationSuggestion[]>({
    queryKey: [
      "/api/planning/optimization/suggestions",
      { category: filterCategory },
      { status: filterStatus },
      { priority: filterPriority }
    ],
  });

  // Üretim performans analizini getir
  const { data: productionAnalysis, isLoading: analysisLoading } = useQuery<ProductionAnalysis>({
    queryKey: ["/api/planning/optimization/analysis", { from: date.from, to: date.to }],
  });

  // AI önerilerini getir
  const { data: aiRecommendations = [], isLoading: aiRecommendationsLoading } = useQuery<AIRecommendation[]>({
    queryKey: ["/api/planning/optimization/ai-recommendations"],
    enabled: showAiRecommendationsDialog,
  });

  // Seçili öneri
  const selectedSuggestion = suggestions.find(suggestion => suggestion.id === selectedSuggestionId);
  // Seçili AI önerisi
  const selectedAiRecommendation = aiRecommendations.find(rec => rec.id === selectedAiRecommendationId);

  // Öneri durumunu güncelleme mutasyonu
  const updateSuggestionStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      // Normalde burada API'ye istekte bulunulur
      /* const response = await apiRequest("PATCH", `/api/planning/optimization/suggestions/${id}`, { status });
      return await response.json(); */
      
      // Şimdilik toast ile başarı mesajı gösteriyoruz
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Durum güncellendi",
        description: "Optimizasyon önerisi durumu başarıyla güncellendi.",
      });
      
      refetchSuggestions();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Durum güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // AI önerisini uygulama mutasyonu
  const implementAiRecommendationMutation = useMutation({
    mutationFn: async (id: number) => {
      // Normalde burada API'ye istekte bulunulur
      /* const response = await apiRequest("POST", `/api/planning/optimization/ai-recommendations/${id}/implement`);
      return await response.json(); */
      
      // Şimdilik toast ile başarı mesajı gösteriyoruz
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Öneri uygulandı",
        description: "Yapay zeka önerisi başarıyla optimizasyon listesine eklendi.",
      });
      
      setShowAiRecommendationsDialog(false);
      refetchSuggestions();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Öneri uygulanırken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Öneri durumunu güncelle
  const handleUpdateSuggestionStatus = (id: number, status: string) => {
    updateSuggestionStatusMutation.mutate({ id, status });
  };

  // AI önerisini uygula
  const handleImplementAiRecommendation = (id: number) => {
    implementAiRecommendationMutation.mutate(id);
  };

  // Scatter plot veri dönüşümü
  const prepareScatterData = (suggestions: OptimizationSuggestion[]) => {
    return suggestions.map(suggestion => ({
      x: suggestion.roi, // Yatırım getirisi (X ekseni)
      y: suggestion.paybackPeriod, // Geri ödeme süresi (Y ekseni)
      z: suggestion.score, // Puan (nokta boyutu)
      id: suggestion.id,
      name: suggestion.title,
      priority: suggestion.priority,
      category: suggestion.category
    }));
  };

  // Radar grafiği için normalize edilmiş veri
  const normalizeMetrics = (metrics: any) => {
    // Normalize edilmiş değerler için referans max değerler
    const maxValues = {
      throughput: 100,
      cycleTime: 30,
      wip: 50,
      utilization: 100,
      leadTime: 30,
      onTimeDelivery: 100,
      quality: 100,
      changeover: 60,
      uptime: 100
    };

    // Ölçek değerlerini 0-100 arasına normalize et
    return Object.keys(metrics).map(key => ({
      subject: getMetricDisplayName(key),
      A: normalizeValue(metrics[key], key, maxValues),
      fullMark: 100
    }));
  };

  // Metrik adını görüntüleme adına dönüştür
  const getMetricDisplayName = (key: string): string => {
    const displayNames: Record<string, string> = {
      throughput: 'Verim',
      cycleTime: 'Çevrim Süresi',
      wip: 'Süreç İçi İş',
      utilization: 'Kullanım',
      leadTime: 'Teslimat Süresi',
      onTimeDelivery: 'Zamanında Teslimat',
      quality: 'Kalite',
      changeover: 'Değişim Süresi',
      uptime: 'Çalışma Süresi'
    };
    return displayNames[key] || key;
  };

  // Değeri normalize et (bazı değerler için ters ölçek kullan)
  const normalizeValue = (value: number, key: string, maxValues: Record<string, number>): number => {
    // Bazı metriklerde düşük değer iyidir (çevrim süresi, teslimat süresi gibi)
    const inverseMetrics = ['cycleTime', 'leadTime', 'changeover'];
    
    if (inverseMetrics.includes(key)) {
      // Ters ölçek: Düşük değer daha iyi
      return 100 - (value / maxValues[key]) * 100;
    } else {
      // Normal ölçek: Yüksek değer daha iyi
      return (value / maxValues[key]) * 100;
    }
  };

  // Kategori grafiği için veri dönüşümü
  const prepareCategoryData = (suggestions: OptimizationSuggestion[]) => {
    const categories: Record<string, number> = {
      scheduling: 0,
      resource: 0,
      capacity: 0,
      workflow: 0,
      bottleneck: 0
    };
    
    suggestions.forEach(suggestion => {
      categories[suggestion.category]++;
    });
    
    return Object.entries(categories).map(([category, count]) => ({
      name: getCategoryDisplayName(category),
      value: count
    }));
  };

  // Kategori görüntüleme adı
  const getCategoryDisplayName = (category: string): string => {
    const displayNames: Record<string, string> = {
      scheduling: 'Çizelgeleme',
      resource: 'Kaynak',
      capacity: 'Kapasite',
      workflow: 'İş Akışı',
      bottleneck: 'Darboğaz'
    };
    return displayNames[category] || category;
  };

  // Temel renk paleti
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Üretim Optimizasyonu</h2>
          <p className="text-muted-foreground">
            Yapay zeka destekli üretim süreçleri optimizasyonu ve iyileştirme önerileri
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => refetchSuggestions()}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Yenile
          </Button>
          <Button 
            onClick={() => setShowAiRecommendationsDialog(true)}
          >
            <BrainCircuit className="mr-2 h-4 w-4" />
            Yapay Zeka Önerileri
          </Button>
        </div>
      </div>

      <Tabs 
        defaultValue="suggestions" 
        value={selectedTab} 
        onValueChange={setSelectedTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="suggestions">
            <Sparkles className="mr-2 h-4 w-4" />
            Optimizasyon Önerileri
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <LineChart className="mr-2 h-4 w-4" />
            Üretim Analizi
          </TabsTrigger>
          <TabsTrigger value="bottlenecks">
            <Target className="mr-2 h-4 w-4" />
            Darboğaz Analizi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <Card className="md:w-2/3">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>Optimizasyon Önerileri</CardTitle>
                    <CardDescription>
                      Üretim süreçlerinizi iyileştirmek için önerilen optimizasyon fırsatları
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
                        <SelectItem value="scheduling">Çizelgeleme</SelectItem>
                        <SelectItem value="resource">Kaynak</SelectItem>
                        <SelectItem value="capacity">Kapasite</SelectItem>
                        <SelectItem value="workflow">İş Akışı</SelectItem>
                        <SelectItem value="bottleneck">Darboğaz</SelectItem>
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
                        <SelectItem value="new">Yeni</SelectItem>
                        <SelectItem value="inProgress">Devam Ediyor</SelectItem>
                        <SelectItem value="implemented">Uygulandı</SelectItem>
                        <SelectItem value="rejected">Reddedildi</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={filterPriority}
                      onValueChange={setFilterPriority}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Tüm Öncelikler" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Öncelikler</SelectItem>
                        <SelectItem value="critical">Kritik</SelectItem>
                        <SelectItem value="high">Yüksek</SelectItem>
                        <SelectItem value="medium">Orta</SelectItem>
                        <SelectItem value="low">Düşük</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {suggestionsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                  </div>
                ) : suggestions.length > 0 ? (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {suggestions.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                            selectedSuggestionId === suggestion.id ? "bg-blue-50 border-blue-200" : "bg-white"
                          }`}
                          onClick={() => setSelectedSuggestionId(suggestion.id)}
                        >
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{suggestion.title}</h3>
                                {getStatusBadge(suggestion.status)}
                              </div>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {suggestion.description}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                              {getCategoryBadge(suggestion.category)}
                              {getPriorityBadge(suggestion.priority)}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                      {suggestion.score}/100
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Optimizasyon Skoru</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                            <div className="text-xs">
                              <span className="text-gray-500">Teslimat Süresi:</span>
                              <div className={`font-medium ${getImpactColor(suggestion.impact.leadTime)}`}>
                                {getImpactValue(suggestion.impact.leadTime, true)}
                              </div>
                            </div>
                            <div className="text-xs">
                              <span className="text-gray-500">Kapasite:</span>
                              <div className={`font-medium ${getImpactColor(suggestion.impact.capacity)}`}>
                                {getImpactValue(suggestion.impact.capacity)}
                              </div>
                            </div>
                            <div className="text-xs">
                              <span className="text-gray-500">Maliyet:</span>
                              <div className={`font-medium ${getImpactColor(-suggestion.impact.cost)}`}>
                                {getImpactValue(suggestion.impact.cost, true)}
                              </div>
                            </div>
                            <div className="text-xs">
                              <span className="text-gray-500">Kalite:</span>
                              <div className={`font-medium ${getImpactColor(suggestion.impact.quality)}`}>
                                {getImpactValue(suggestion.impact.quality)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertTitle>Öneri bulunamadı</AlertTitle>
                    <AlertDescription>
                      Filtrelerinize uygun optimizasyon önerisi bulunamadı. Filtreleri değiştirin veya yeni öneriler için yapay zeka önerilerini kontrol edin.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card className="md:w-1/3">
              <CardHeader>
                <CardTitle>Öneri Detayları</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSuggestion ? (
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold">{selectedSuggestion.title}</h3>
                        <div className="flex flex-wrap gap-2 items-center mt-2">
                          {getStatusBadge(selectedSuggestion.status)}
                          {getCategoryBadge(selectedSuggestion.category)}
                          {getPriorityBadge(selectedSuggestion.priority)}
                          {getDifficultyBadge(selectedSuggestion.difficulty)}
                        </div>
                        <p className="text-sm text-gray-600 mt-3">
                          {selectedSuggestion.description}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-3">Beklenen Etki</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col bg-gray-50 p-3 rounded-md">
                            <span className="text-xs text-gray-500">Teslimat Süresi</span>
                            <div className="flex items-center">
                              {getImpactIcon(selectedSuggestion.impact.leadTime)}
                              <span className={`text-base font-semibold ${getImpactColor(selectedSuggestion.impact.leadTime)}`}>
                                {selectedSuggestion.impact.leadTime > 0 ? '+' : ''}
                                {selectedSuggestion.impact.leadTime}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col bg-gray-50 p-3 rounded-md">
                            <span className="text-xs text-gray-500">Kapasite</span>
                            <div className="flex items-center">
                              {getImpactIcon(selectedSuggestion.impact.capacity)}
                              <span className={`text-base font-semibold ${getImpactColor(selectedSuggestion.impact.capacity)}`}>
                                {selectedSuggestion.impact.capacity > 0 ? '+' : ''}
                                {selectedSuggestion.impact.capacity}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col bg-gray-50 p-3 rounded-md">
                            <span className="text-xs text-gray-500">Maliyet</span>
                            <div className="flex items-center">
                              {getImpactIcon(-selectedSuggestion.impact.cost)}
                              <span className={`text-base font-semibold ${getImpactColor(-selectedSuggestion.impact.cost)}`}>
                                {selectedSuggestion.impact.cost > 0 ? '+' : ''}
                                {selectedSuggestion.impact.cost}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col bg-gray-50 p-3 rounded-md">
                            <span className="text-xs text-gray-500">Kalite</span>
                            <div className="flex items-center">
                              {getImpactIcon(selectedSuggestion.impact.quality)}
                              <span className={`text-base font-semibold ${getImpactColor(selectedSuggestion.impact.quality)}`}>
                                {selectedSuggestion.impact.quality > 0 ? '+' : ''}
                                {selectedSuggestion.impact.quality}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-semibold">Yatırım Getirisi (ROI)</div>
                          <div className="text-xl font-bold text-green-600">%{selectedSuggestion.roi}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-semibold">Geri Ödeme Süresi</div>
                          <div className="text-xl font-bold">{selectedSuggestion.paybackPeriod} ay</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2">Etkilenen Departmanlar</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedSuggestion.affectedDepartmentNames?.map((dept, index) => (
                            <Badge key={index} variant="outline">
                              {dept}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2">Gerekli Kaynaklar</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {selectedSuggestion.requiredResources.map((resource, index) => (
                            <li key={index}>{resource}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2">Uygulama Adımları</h4>
                        <ol className="list-decimal list-inside text-sm space-y-2">
                          {selectedSuggestion.implementationSteps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2">Potansiyel Riskler</h4>
                        <ul className="list-disc list-inside text-sm space-y-1 text-red-700">
                          {selectedSuggestion.potentialRisks.map((risk, index) => (
                            <li key={index}>{risk}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2">Durum Bilgisi</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-500">Oluşturulma Tarihi:</div>
                          <div>{format(new Date(selectedSuggestion.createdAt), "dd MMMM yyyy", { locale: tr })}</div>
                          
                          {selectedSuggestion.implementedAt && (
                            <>
                              <div className="text-gray-500">Uygulama Tarihi:</div>
                              <div>{format(new Date(selectedSuggestion.implementedAt), "dd MMMM yyyy", { locale: tr })}</div>
                            </>
                          )}
                          
                          <div className="text-gray-500">Mevcut Durum:</div>
                          <div>{getStatusBadge(selectedSuggestion.status)}</div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6">
                    <Target className="h-10 w-10 text-gray-300 mb-2" />
                    <h3 className="font-semibold mb-1">Öneri Seçilmedi</h3>
                    <p className="text-sm text-center text-gray-500">
                      Detaylarını görmek için listeden bir optimizasyon önerisi seçin.
                    </p>
                  </div>
                )}
              </CardContent>
              {selectedSuggestion && (
                <CardFooter>
                  <div className="flex flex-col w-full gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      {selectedSuggestion.status === 'new' && (
                        <>
                          <Button 
                            onClick={() => handleUpdateSuggestionStatus(selectedSuggestion.id, 'inProgress')}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Başlat
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => handleUpdateSuggestionStatus(selectedSuggestion.id, 'rejected')}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Reddet
                          </Button>
                        </>
                      )}
                      
                      {selectedSuggestion.status === 'inProgress' && (
                        <>
                          <Button 
                            onClick={() => handleUpdateSuggestionStatus(selectedSuggestion.id, 'implemented')}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Tamamla
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => handleUpdateSuggestionStatus(selectedSuggestion.id, 'rejected')}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Reddet
                          </Button>
                        </>
                      )}
                      
                      {(selectedSuggestion.status === 'implemented' || selectedSuggestion.status === 'rejected') && (
                        <Button 
                          className="col-span-2"
                          variant="outline"
                          onClick={() => handleUpdateSuggestionStatus(selectedSuggestion.id, 'new')}
                        >
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          Yeniden Aktifleştir
                        </Button>
                      )}
                    </div>
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Optimizasyon Öneri Analizi</CardTitle>
                <CardDescription>
                  ROI, geri ödeme süresi ve öncelik analizleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid />
                      <XAxis type="number" dataKey="x" name="ROI %" domain={[0, 'dataMax']} />
                      <YAxis type="number" dataKey="y" name="Geri Ödeme Süresi (ay)" domain={[0, 'dataMax']} />
                      <ZAxis type="number" dataKey="z" range={[100, 500]} name="Öneri Puanı" />
                      <ReTooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 border rounded shadow-sm">
                              <p className="font-semibold">{data.name}</p>
                              <p>ROI: %{data.x}</p>
                              <p>Geri Ödeme: {data.y} ay</p>
                              <p>Puan: {data.z}</p>
                              <p>Kategori: {getCategoryDisplayName(data.category)}</p>
                              <p>Öncelik: {data.priority}</p>
                            </div>
                          );
                        }
                        return null;
                      }} />
                      <Legend />
                      <Scatter 
                        name="Yüksek Öncelikli" 
                        data={prepareScatterData(suggestions.filter(s => s.priority === 'high' || s.priority === 'critical'))} 
                        fill="#ff0000" 
                        onClick={(data) => setSelectedSuggestionId(data.id)}
                      />
                      <Scatter 
                        name="Orta Öncelikli" 
                        data={prepareScatterData(suggestions.filter(s => s.priority === 'medium'))} 
                        fill="#FFBB28" 
                        onClick={(data) => setSelectedSuggestionId(data.id)}
                      />
                      <Scatter 
                        name="Düşük Öncelikli" 
                        data={prepareScatterData(suggestions.filter(s => s.priority === 'low'))} 
                        fill="#00C49F" 
                        onClick={(data) => setSelectedSuggestionId(data.id)}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimizasyon Kategorileri</CardTitle>
                <CardDescription>
                  Öneri türlerine göre dağılım
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={prepareCategoryData(suggestions)}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {prepareCategoryData(suggestions).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ReTooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Üretim Performans Analizi</h3>
              <p className="text-sm text-gray-500">
                Seçili tarih aralığındaki üretim performansının detaylı analizi
              </p>
            </div>
            <CalendarDateRangePicker date={date} setDate={setDate} />
          </div>

          {analysisLoading ? (
            <div className="flex items-center justify-center p-16">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                <p>Performans analizi yükleniyor...</p>
              </div>
            </div>
          ) : productionAnalysis ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Üretim Verimi
                    </CardTitle>
                    <Factory className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {productionAnalysis.metrics.throughput} birim/gün
                    </div>
                    <Progress 
                      value={Math.min(100, (productionAnalysis.metrics.throughput / 100) * 100)} 
                      className="h-2 mt-2" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Günlük ortalama üretim adedi
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Ortalama Teslimat Süresi
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {productionAnalysis.metrics.leadTime} gün
                    </div>
                    <Progress 
                      value={Math.min(100, Math.max(0, 100 - (productionAnalysis.metrics.leadTime / 30) * 100))} 
                      className="h-2 mt-2" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Sipariş oluşturma ile teslim arasındaki ortalama süre
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Kaynak Kullanımı
                    </CardTitle>
                    <LineChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      %{productionAnalysis.metrics.utilization}
                    </div>
                    <Progress 
                      value={productionAnalysis.metrics.utilization} 
                      className="h-2 mt-2" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Makinelerin ortalama kullanım oranı
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Zamanında Teslimat
                    </CardTitle>
                    <BellRing className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      %{productionAnalysis.metrics.onTimeDelivery}
                    </div>
                    <Progress 
                      value={productionAnalysis.metrics.onTimeDelivery} 
                      className="h-2 mt-2" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Zamanında teslim edilen siparişlerin oranı
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-7">
                <Card className="md:col-span-3">
                  <CardHeader>
                    <CardTitle>Departman Verimliliği</CardTitle>
                    <CardDescription>
                      Departman bazında performans karşılaştırması
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={Object.entries(productionAnalysis.departmentEfficiency).map(([dept, efficiency]) => ({
                            name: dept,
                            verim: efficiency
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis dataKey="name" type="category" />
                          <ReTooltip formatter={(value) => [`${value}%`, 'Verimlilik']} />
                          <Legend />
                          <Bar dataKey="verim" name="Verimlilik (%)" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-4">
                  <CardHeader>
                    <CardTitle>Performans Radar Analizi</CardTitle>
                    <CardDescription>
                      Tüm performans metriklerinin dengeli görünümü
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart 
                          cx="50%" 
                          cy="50%" 
                          outerRadius="80%" 
                          data={normalizeMetrics(productionAnalysis.metrics)}
                        >
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar
                            name="Performans"
                            dataKey="A"
                            stroke="#8884d8"
                            fill="#8884d8"
                            fillOpacity={0.6}
                          />
                          <ReTooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Kritik Darboğazlar</CardTitle>
                    <CardDescription>
                      Üretim sürecinde tespit edilen kritik darboğazlar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {productionAnalysis.bottlenecks.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Kaynak</TableHead>
                            <TableHead>Tür</TableHead>
                            <TableHead className="text-right">Kullanım</TableHead>
                            <TableHead className="text-right">Boş Süre</TableHead>
                            <TableHead className="text-right">Etki</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productionAnalysis.bottlenecks.map((bottleneck, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{bottleneck.resourceName}</TableCell>
                              <TableCell>
                                {bottleneck.resourceType === 'machine' 
                                  ? 'Makine' 
                                  : bottleneck.resourceType === 'department' 
                                    ? 'Departman' 
                                    : 'İş Gücü'}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge 
                                  className={`
                                    ${bottleneck.utilizationRate > 90 
                                      ? 'bg-red-100 text-red-800' 
                                      : bottleneck.utilizationRate > 80 
                                        ? 'bg-yellow-100 text-yellow-800' 
                                        : 'bg-green-100 text-green-800'
                                    }
                                  `}
                                >
                                  %{bottleneck.utilizationRate}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">{bottleneck.idleTime} saat/hafta</TableCell>
                              <TableCell className="text-right">
                                <Badge 
                                  className={`
                                    ${bottleneck.impact > 20 
                                      ? 'bg-red-100 text-red-800' 
                                      : bottleneck.impact > 10 
                                        ? 'bg-yellow-100 text-yellow-800' 
                                        : 'bg-green-100 text-green-800'
                                    }
                                  `}
                                >
                                  %{bottleneck.impact}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="flex items-center justify-center p-6">
                        <div className="text-center">
                          <CheckIcon className="mx-auto h-8 w-8 text-green-500 mb-2" />
                          <p className="text-gray-500">Herhangi bir kritik darboğaz tespit edilmedi.</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>İş Akışı Sorunları</CardTitle>
                    <CardDescription>
                      Üretim süreçlerinde tespit edilen sorunlar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {productionAnalysis.workflowIssues.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sorun</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead className="text-right">Etki (%)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productionAnalysis.workflowIssues.map((issue, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{issue.description}</TableCell>
                              <TableCell>{issue.category}</TableCell>
                              <TableCell className="text-right">
                                <Badge 
                                  className={`
                                    ${issue.impact > 20 
                                      ? 'bg-red-100 text-red-800' 
                                      : issue.impact > 10 
                                        ? 'bg-yellow-100 text-yellow-800' 
                                        : 'bg-green-100 text-green-800'
                                    }
                                  `}
                                >
                                  %{issue.impact}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="flex items-center justify-center p-6">
                        <div className="text-center">
                          <CheckIcon className="mx-auto h-8 w-8 text-green-500 mb-2" />
                          <p className="text-gray-500">Herhangi bir iş akışı sorunu tespit edilmedi.</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Veri bulunamadı</AlertTitle>
              <AlertDescription>
                Seçili tarih aralığında üretim performans analizi verisi bulunamadı.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="bottlenecks" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Darboğaz Analizi</h3>
              <p className="text-sm text-gray-500">
                Üretim süreçlerinde darboğazların tespiti ve iyileştirme önerileri
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Darboğaz Haritası</CardTitle>
              <CardDescription>
                Üretim süreçlerinde tespit edilen darboğazlar ve bunların etkileri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kaynak</TableHead>
                      <TableHead>Tür</TableHead>
                      <TableHead>Etki Alanı</TableHead>
                      <TableHead className="text-right">Kullanım Oranı</TableHead>
                      <TableHead className="text-right">Çözüm Zorluğu</TableHead>
                      <TableHead className="text-right">Kazanç Potansiyeli</TableHead>
                      <TableHead>Öncelik</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productionAnalysis?.bottlenecks.map((bottleneck, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{bottleneck.resourceName}</TableCell>
                        <TableCell>
                          {bottleneck.resourceType === 'machine' 
                            ? 'Makine' 
                            : bottleneck.resourceType === 'department' 
                              ? 'Departman' 
                              : 'İş Gücü'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs">Teslimat Süresi</Badge>
                            <Badge variant="outline" className="text-xs">Kapasite</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <Progress 
                                    value={bottleneck.utilizationRate} 
                                    className={`h-2 ${
                                      bottleneck.utilizationRate > 90 
                                        ? 'bg-red-600' 
                                        : bottleneck.utilizationRate > 80 
                                          ? 'bg-yellow-600' 
                                          : 'bg-green-600'
                                    }`} 
                                  />
                                  <div className="text-xs mt-1">%{bottleneck.utilizationRate}</div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Boş Süre: {bottleneck.idleTime} saat/hafta</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-right">
                          {bottleneck.impact > 20 
                            ? <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Zor</Badge>
                            : bottleneck.impact > 10 
                              ? <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Orta</Badge>
                              : <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Kolay</Badge>
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span>%{Math.round(bottleneck.impact * 1.5)}</span>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          </div>
                        </TableCell>
                        <TableCell>
                          {bottleneck.impact > 20 
                            ? <Badge className="bg-red-100 text-red-800 border-red-200">Kritik</Badge>
                            : bottleneck.impact > 10 
                              ? <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Yüksek</Badge>
                              : <Badge className="bg-green-100 text-green-800 border-green-200">Orta</Badge>
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {!productionAnalysis || productionAnalysis.bottlenecks.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6">
                          <div className="text-center">
                            <CheckIcon className="mx-auto h-8 w-8 text-green-500 mb-2" />
                            <p className="text-gray-500">Herhangi bir darboğaz tespit edilmedi.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {productionAnalysis && productionAnalysis.bottlenecks.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-base font-semibold mb-4">Darboğaz İyileştirme Önerileri</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {productionAnalysis.bottlenecks.slice(0, 2).map((bottleneck, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{bottleneck.resourceName} İyileştirmesi</CardTitle>
                            <Badge className="bg-green-100 text-green-800 border-green-200">Yapay Zeka Önerisi</Badge>
                          </div>
                          <CardDescription>
                            {bottleneck.resourceType === 'machine' 
                              ? 'Makine verimliliğini artırma önerisi' 
                              : bottleneck.resourceType === 'department' 
                                ? 'Departman iş akışı iyileştirme önerisi' 
                                : 'İş gücü optimizasyon önerisi'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="text-sm space-y-1">
                              <p>Bu darboğazı iyileştirmek için aşağıdaki adımları uygulayabilirsiniz:</p>
                              <ul className="list-disc list-inside pl-2 text-gray-600">
                                <li>Kaynak kapasitesini %15 artırma</li>
                                <li>İş dağılımını optimizasyon ile dengeleme</li>
                                <li>Alternatif iş akışları oluşturma</li>
                              </ul>
                            </div>
                            
                            <div>
                              <div className="text-sm font-medium">Beklenen Kazanımlar</div>
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                <div className="flex items-center">
                                  <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
                                  <span className="text-sm">{bottleneck.impact}% teslimat süresi</span>
                                </div>
                                <div className="flex items-center">
                                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                                  <span className="text-sm">{Math.round(bottleneck.impact * 1.2)}% kapasite</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            className="w-full"
                            variant="outline"
                            onClick={() => {
                              // Yapay zeka önerilerini görüntüle
                              setShowAiRecommendationsDialog(true);
                            }}
                          >
                            <Zap className="mr-2 h-4 w-4" />
                            Detaylı Öneri Oluştur
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Yapay Zeka Önerileri Dialog */}
      <Dialog open={showAiRecommendationsDialog} onOpenChange={setShowAiRecommendationsDialog}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Yapay Zeka Üretim Optimizasyon Önerileri</DialogTitle>
            <DialogDescription>
              Üretim verilerinize göre yapay zeka tarafından oluşturulan optimizasyon önerileri
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <div className="text-sm font-semibold mb-2">Öneriler</div>
                {aiRecommendationsLoading ? (
                  <div className="flex items-center justify-center p-16">
                    <div className="flex flex-col items-center gap-2">
                      <BrainCircuit className="h-10 w-10 animate-pulse text-blue-500" />
                      <p className="text-sm text-gray-500">Yapay zeka önerileri oluşturuluyor...</p>
                    </div>
                  </div>
                ) : aiRecommendations.length > 0 ? (
                  <ScrollArea className="h-[500px] pr-4">
                    {aiRecommendations.map((recommendation) => (
                      <div
                        key={recommendation.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all mb-2 ${
                          selectedAiRecommendationId === recommendation.id ? "bg-blue-50 border-blue-200" : "bg-white hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedAiRecommendationId(recommendation.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                            AI
                          </Badge>
                          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                            {recommendation.score}/100
                          </Badge>
                        </div>
                        <div className="font-medium mt-1">{recommendation.title}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {recommendation.description}
                        </div>
                        <div className="flex items-center mt-2 text-xs text-gray-600">
                          <span>Kategori: {getCategoryDisplayName(recommendation.category)}</span>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                ) : (
                  <div className="border rounded-md p-4">
                    <div className="text-center">
                      <BrainCircuit className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                      <p className="text-gray-500">Henüz öneri bulunmuyor.</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="md:w-2/3 border-l pl-6">
                {selectedAiRecommendation ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedAiRecommendation.title}</h3>
                      <div className="flex flex-wrap gap-2 items-center mt-2">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          Yapay Zeka Önerisi
                        </Badge>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Puan: {selectedAiRecommendation.score}/100
                        </Badge>
                        <Badge variant="outline">
                          Güven: %{selectedAiRecommendation.confidence}
                        </Badge>
                        <Badge variant="outline">
                          Uygulanabilirlik: %{selectedAiRecommendation.applicability}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mt-3">
                        {selectedAiRecommendation.description}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Yapay Zeka Gerekçelendirme</h4>
                      <div className="bg-purple-50 border border-purple-100 rounded-md p-3 text-sm text-purple-700">
                        {selectedAiRecommendation.reasoning}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Beklenen Etki</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.entries(selectedAiRecommendation.impact).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 p-3 rounded-md">
                            <div className="text-xs text-gray-500">{key}</div>
                            <div className={`font-semibold ${getImpactColor(value)}`}>
                              {value > 0 ? '+' : ''}{value}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Uygulama Bilgileri</h4>
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="text-xs text-gray-500">Uygulama Süresi</div>
                          <div className="font-medium">{selectedAiRecommendation.implementationTime}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Zorluk</div>
                          <div className="font-medium">
                            {selectedAiRecommendation.score > 80 ? 'Kolay' : selectedAiRecommendation.score > 60 ? 'Orta' : 'Zor'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {selectedAiRecommendation.relatedSuggestionIds.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">İlişkili Öneriler</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedAiRecommendation.relatedSuggestionIds.map((id) => {
                            const relatedRec = aiRecommendations.find(r => r.id === id);
                            return relatedRec ? (
                              <Badge 
                                key={id} 
                                variant="outline" 
                                className="cursor-pointer"
                                onClick={() => setSelectedAiRecommendationId(id)}
                              >
                                {relatedRec.title}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6">
                    <BrainCircuit className="h-12 w-12 text-gray-300 mb-2" />
                    <h3 className="font-semibold mb-1">Öneri Seçilmedi</h3>
                    <p className="text-sm text-center text-gray-500">
                      Detaylarını görmek için listeden bir yapay zeka önerisi seçin.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            {selectedAiRecommendation && (
              <div className="flex w-full gap-2">
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAiRecommendationsDialog(false)}
                >
                  İptal
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => handleImplementAiRecommendation(selectedAiRecommendation.id)}
                >
                  Öneriyi Uygula
                </Button>
              </div>
            )}

            {!selectedAiRecommendation && (
              <Button onClick={() => setShowAiRecommendationsDialog(false)}>
                Kapat
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Check icon
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default ProductionOptimization;