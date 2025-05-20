import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FlaskConical, FileText, BarChart, LineChart, Layers, Play, Save, AlertTriangle, Factory, Settings, BrainCircuit, ChevronsUpDown, Clock, Calendar, Filter } from "lucide-react";
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart as ReLineChart, Line } from "recharts";

// Simülasyon senaryosu türü
interface SimulationScenario {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  baselineId: number | null;
  modifiedParameters: SimulationParameter[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: SimulationResult | null;
  tags: string[];
}

// Simülasyon parametresi türü
interface SimulationParameter {
  id: number;
  name: string;
  type: 'capacity' | 'workforce' | 'workingHours' | 'machineEfficiency' | 'priorityRules';
  value: number | string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  affectedResourceId?: number;
  affectedResourceName?: string;
}

// Simülasyon sonucu türü
interface SimulationResult {
  id: number;
  scenarioId: number;
  totalCompletionTime: number; // gün
  resourceUtilization: { [key: string]: number }; // key: kaynak adı, value: kullanım yüzdesi
  onTimeDeliveryRate: number; // yüzde
  totalCost: number;
  bottlenecks: BottleneckInfo[];
  costBreakdown: { [key: string]: number };
  comparisonToBaseline?: {
    totalCompletionTimeDiff: number;
    utilDiff: { [key: string]: number };
    onTimeDeliveryDiff: number;
    totalCostDiff: number;
  };
}

// Darboğaz bilgisi
interface BottleneckInfo {
  resourceId: number;
  resourceName: string;
  resourceType: 'machine' | 'department' | 'workforce';
  utilizationRate: number;
  idleTime: number;
  affectedOrderCount: number;
  potentialTimeSaving: number; // gün
}

// Parametreleri hesaplamak için yardımcı fonksiyonlar
const calculateAverageUtilization = (result: SimulationResult | null): number => {
  if (!result || Object.keys(result.resourceUtilization).length === 0) return 0;
  
  const utilValues = Object.values(result.resourceUtilization);
  return utilValues.reduce((sum, val) => sum + val, 0) / utilValues.length;
};

const calculateBottleneckRate = (result: SimulationResult | null): number => {
  if (!result || !result.bottlenecks.length) return 0;
  
  return result.bottlenecks.reduce((max, b) => Math.max(max, b.utilizationRate), 0);
};

// Karşılaştırmalı değer sınıfı yardımcısı
const getComparisonClass = (diff: number, inverse: boolean = false): string => {
  if (!diff) return "";
  
  if (!inverse) {
    if (diff > 0) return "text-green-600";
    return "text-red-600";
  } else {
    if (diff > 0) return "text-red-600";
    return "text-green-600";
  }
};

// Simülasyon merkezi ana bileşeni
const SimulationCenter: React.FC = () => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<string>("scenarios");
  const [showNewScenarioDialog, setShowNewScenarioDialog] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);
  const [filterTag, setFilterTag] = useState<string>("all");
  
  // Yeni senaryo için durum
  const [newScenario, setNewScenario] = useState({
    name: "",
    description: "",
    baselineId: null as number | null,
    tags: [] as string[],
    parameters: {} as Record<string, any>
  });

  // Tüm senaryoları getir
  const { data: scenarios = [], isLoading: scenariosLoading, refetch: refetchScenarios } = useQuery<SimulationScenario[]>({
    queryKey: ["/api/planning/simulation/scenarios", { tag: filterTag }],
  });

  // Mevcut parametreleri getir
  const { data: availableParameters = [] } = useQuery<SimulationParameter[]>({
    queryKey: ["/api/planning/simulation/parameters"],
  });

  // Bölümleri getir
  const { data: departments = [] } = useQuery({
    queryKey: ["/api/admin/departments"],
  });

  // Seçili senaryo
  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId) || (scenarios.length > 0 ? scenarios[0] : null);
  
  // Yeni senaryo oluşturma işleyicisi
  const handleCreateScenario = () => {
    toast({
      title: "Senaryo oluşturuldu",
      description: `"${newScenario.name}" adlı simülasyon senaryosu başarıyla oluşturuldu.`,
    });
    
    setShowNewScenarioDialog(false);
    refetchScenarios();
    
    // Form verilerini sıfırla
    setNewScenario({
      name: "",
      description: "",
      baselineId: null,
      tags: [],
      parameters: {}
    });
  };

  // Senaryo çalıştırma işleyicisi
  const handleRunSimulation = (scenarioId: number) => {
    toast({
      title: "Simülasyon başlatıldı",
      description: "Senaryo simülasyonu başlatıldı. Tamamlandığında sonuçlar gösterilecek.",
    });
    
    refetchScenarios();
  };

  // Parametreler için yardımcı dönüştürücüler
  const getParameterName = (type: string): string => {
    switch (type) {
      case 'capacity': return 'Kapasite';
      case 'workforce': return 'İş Gücü';
      case 'workingHours': return 'Çalışma Saatleri';
      case 'machineEfficiency': return 'Makine Verimliliği';
      case 'priorityRules': return 'Önceliklendirme Kuralları';
      default: return type;
    }
  };

  const getParameterUnit = (type: string): string => {
    switch (type) {
      case 'capacity': return '%';
      case 'workforce': return 'kişi';
      case 'workingHours': return 'saat';
      case 'machineEfficiency': return '%';
      default: return '';
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Simülasyon Merkezi</h2>
          <p className="text-muted-foreground">
            "What-if" senaryoları oluşturun ve üretim planlaması için alternatif senaryoları karşılaştırın
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => refetchScenarios()}
          >
            <LineChart className="mr-2 h-4 w-4" />
            Senaryoları Yenile
          </Button>
          <Button onClick={() => setShowNewScenarioDialog(true)}>
            <FlaskConical className="mr-2 h-4 w-4" />
            Yeni Senaryo
          </Button>
        </div>
      </div>

      <Tabs 
        defaultValue="scenarios" 
        value={selectedTab} 
        onValueChange={setSelectedTab}
        className="space-y-4"
      >
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="scenarios">
              <FileText className="mr-2 h-4 w-4" />
              Senaryolar
            </TabsTrigger>
            <TabsTrigger value="compare">
              <BarChart className="mr-2 h-4 w-4" />
              Karşılaştırma
            </TabsTrigger>
            <TabsTrigger value="parameters">
              <Settings className="mr-2 h-4 w-4" />
              Parametreler
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtrele
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Etiket Filtresi</h4>
                    <p className="text-sm text-muted-foreground">
                      Belirli etiketlere sahip senaryoları filtreleyebilirsiniz
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="tagFilter" className="col-span-4">
                        Etiket
                      </Label>
                      <Select
                        value={filterTag}
                        onValueChange={setFilterTag}
                      >
                        <SelectTrigger className="col-span-4">
                          <SelectValue placeholder="Tüm Etiketler" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tüm Etiketler</SelectItem>
                          <SelectItem value="kapasite">Kapasite</SelectItem>
                          <SelectItem value="maliyet">Maliyet</SelectItem>
                          <SelectItem value="verimlilik">Verimlilik</SelectItem>
                          <SelectItem value="zaman">Zaman</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <TabsContent value="scenarios" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Toplam Senaryo
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {scenarios.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sistemde kayıtlı toplam simülasyon senaryosu
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tamamlanan Simülasyonlar
                </CardTitle>
                <CheckIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {scenarios.filter(s => s.status === 'completed').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Başarıyla tamamlanan simülasyon sayısı
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Aktif Simülasyonlar
                </CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {scenarios.filter(s => s.status === 'running').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Şu anda çalışan simülasyon sayısı
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ortalama İyileştirme 
                </CardTitle>
                <BrainCircuit className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {scenarios.filter(s => s.results?.comparisonToBaseline).length > 0 ? (
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(
                      scenarios
                        .filter(s => s.results?.comparisonToBaseline)
                        .reduce((sum, s) => sum + (s.results?.comparisonToBaseline?.totalCostDiff || 0), 0) /
                      scenarios.filter(s => s.results?.comparisonToBaseline).length
                    )}%
                  </div>
                ) : (
                  <div className="text-2xl font-bold">N/A</div>
                )}
                <p className="text-xs text-muted-foreground">
                  Tüm simülasyonların ortalama maliyet iyileştirmesi
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Simülasyon Senaryoları</CardTitle>
                <CardDescription>
                  Önceden oluşturulmuş "what-if" senaryoları
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scenariosLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                  </div>
                ) : scenarios.length > 0 ? (
                  <ScrollArea className="h-[calc(100vh-350px)] pr-4">
                    <div className="space-y-2">
                      {scenarios.map((scenario) => (
                        <div
                          key={scenario.id}
                          className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                            selectedScenarioId === scenario.id ? "bg-blue-50 border-blue-200" : "bg-white"
                          }`}
                          onClick={() => setSelectedScenarioId(scenario.id)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="font-medium">{scenario.name}</div>
                            {scenario.status === 'running' && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                Çalışıyor
                              </Badge>
                            )}
                            {scenario.status === 'completed' && (
                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                Tamamlandı
                              </Badge>
                            )}
                            {scenario.status === 'failed' && (
                              <Badge className="bg-red-100 text-red-800 border-red-300">
                                Başarısız
                              </Badge>
                            )}
                            {scenario.status === 'pending' && (
                              <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                                Beklemede
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {scenario.description}
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mt-2">
                            {scenario.tags.map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs px-2 py-0">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="text-xs text-gray-400 mt-2">
                            {new Date(scenario.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Senaryo bulunamadı</AlertTitle>
                    <AlertDescription>
                      Hiç simülasyon senaryosu bulunamadı. Yeni bir senaryo oluşturun.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setShowNewScenarioDialog(true)}
                >
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Yeni Senaryo Oluştur
                </Button>
              </CardFooter>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Senaryo Detayları</CardTitle>
                <CardDescription>
                  Seçili simülasyon senaryosu ve sonuçları
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedScenario ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">{selectedScenario.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{selectedScenario.description}</p>
                        
                        <div className="flex flex-wrap gap-1 mt-3">
                          {selectedScenario.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="mt-4">
                          <div className="text-sm font-medium">Senaryo Durumu</div>
                          {selectedScenario.status === 'running' && (
                            <div className="flex items-center mt-1">
                              <div className="animate-spin h-3 w-3 border-2 border-blue-500 rounded-full border-t-transparent mr-2"></div>
                              <span className="text-yellow-600 text-sm">Simülasyon çalışıyor</span>
                            </div>
                          )}
                          {selectedScenario.status === 'completed' && (
                            <div className="flex items-center mt-1">
                              <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                              <span className="text-green-600 text-sm">Simülasyon tamamlandı</span>
                            </div>
                          )}
                          {selectedScenario.status === 'failed' && (
                            <div className="flex items-center mt-1">
                              <div className="h-3 w-3 bg-red-500 rounded-full mr-2"></div>
                              <span className="text-red-600 text-sm">Simülasyon başarısız</span>
                            </div>
                          )}
                          {selectedScenario.status === 'pending' && (
                            <div className="flex items-center mt-1">
                              <div className="h-3 w-3 bg-gray-300 rounded-full mr-2"></div>
                              <span className="text-gray-600 text-sm">Beklemede</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4">
                          <div className="text-sm font-medium">Değiştirilen Parametreler</div>
                          <div className="mt-1 space-y-2">
                            {selectedScenario.modifiedParameters.length > 0 ? (
                              selectedScenario.modifiedParameters.map((param, i) => (
                                <div key={i} className="text-sm">
                                  <div className="flex justify-between">
                                    <span>{getParameterName(param.type)}</span>
                                    <span className="font-semibold">
                                      {param.value} {getParameterUnit(param.type)}
                                    </span>
                                  </div>
                                  {param.affectedResourceName && (
                                    <div className="text-xs text-gray-500">
                                      {param.affectedResourceName}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-gray-500">
                                Bu senaryo için değiştirilmiş parametre bulunmuyor
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        {selectedScenario.results ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <Card>
                                <CardHeader className="p-3 pb-0">
                                  <CardTitle className="text-sm font-medium">
                                    Toplam Süre
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-2">
                                  <div className="text-xl font-bold">
                                    {selectedScenario.results.totalCompletionTime} gün
                                  </div>
                                  {selectedScenario.results.comparisonToBaseline && (
                                    <div className={`text-xs ${getComparisonClass(selectedScenario.results.comparisonToBaseline.totalCompletionTimeDiff, true)}`}>
                                      {selectedScenario.results.comparisonToBaseline.totalCompletionTimeDiff > 0 ? "+" : ""}
                                      {selectedScenario.results.comparisonToBaseline.totalCompletionTimeDiff} gün
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                              
                              <Card>
                                <CardHeader className="p-3 pb-0">
                                  <CardTitle className="text-sm font-medium">
                                    Kaynak Kullanımı
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-2">
                                  <div className="text-xl font-bold">
                                    {calculateAverageUtilization(selectedScenario.results).toFixed(1)}%
                                  </div>
                                  <Progress 
                                    value={calculateAverageUtilization(selectedScenario.results)} 
                                    className="h-1 mt-1" 
                                  />
                                </CardContent>
                              </Card>
                              
                              <Card>
                                <CardHeader className="p-3 pb-0">
                                  <CardTitle className="text-sm font-medium">
                                    Zamanında Teslimat
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-2">
                                  <div className="text-xl font-bold">
                                    {selectedScenario.results.onTimeDeliveryRate.toFixed(1)}%
                                  </div>
                                  {selectedScenario.results.comparisonToBaseline && (
                                    <div className={`text-xs ${getComparisonClass(selectedScenario.results.comparisonToBaseline.onTimeDeliveryDiff)}`}>
                                      {selectedScenario.results.comparisonToBaseline.onTimeDeliveryDiff > 0 ? "+" : ""}
                                      {selectedScenario.results.comparisonToBaseline.onTimeDeliveryDiff.toFixed(1)}%
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                              
                              <Card>
                                <CardHeader className="p-3 pb-0">
                                  <CardTitle className="text-sm font-medium">
                                    Toplam Maliyet
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-2">
                                  <div className="text-xl font-bold">
                                    ₺{selectedScenario.results.totalCost.toLocaleString()}
                                  </div>
                                  {selectedScenario.results.comparisonToBaseline && (
                                    <div className={`text-xs ${getComparisonClass(selectedScenario.results.comparisonToBaseline.totalCostDiff, true)}`}>
                                      {selectedScenario.results.comparisonToBaseline.totalCostDiff > 0 ? "+" : ""}
                                      {selectedScenario.results.comparisonToBaseline.totalCostDiff.toFixed(1)}%
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Darboğazlar</h4>
                              {selectedScenario.results.bottlenecks.length > 0 ? (
                                <div className="space-y-2">
                                  {selectedScenario.results.bottlenecks.map((bottleneck, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded-md bg-red-50 border border-red-100">
                                      <div>
                                        <div className="font-medium text-sm">{bottleneck.resourceName}</div>
                                        <div className="text-xs text-gray-500">
                                          {bottleneck.resourceType === 'machine' ? 'Makine' : 
                                           bottleneck.resourceType === 'department' ? 'Departman' : 'İş Gücü'}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-medium text-sm">{bottleneck.utilizationRate.toFixed(1)}%</div>
                                        <div className="text-xs text-gray-500">
                                          {bottleneck.potentialTimeSaving.toFixed(1)} gün kazanç potansiyeli
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">
                                  Darboğaz bulunamadı
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center p-4">
                            {selectedScenario.status === 'running' ? (
                              <>
                                <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent mb-4"></div>
                                <div className="text-center">
                                  <h3 className="font-semibold">Simülasyon çalışıyor</h3>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Sonuçlar hazır olduğunda burada görüntülenecek
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
                                <FlaskConical className="h-12 w-12 text-gray-300 mb-4" />
                                <div className="text-center">
                                  <h3 className="font-semibold">Simülasyon başlatılmadı</h3>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Simülasyonu çalıştırmak için aşağıdaki butona tıklayın
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-10">
                    <FlaskConical className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="font-semibold text-lg">Senaryo seçilmedi</h3>
                    <p className="text-gray-500 text-center mt-1">
                      Lütfen detaylarını görmek için soldaki listeden bir senaryo seçin veya yeni bir senaryo oluşturun
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                {selectedScenario && (
                  <div className="flex gap-2 w-full">
                    {selectedScenario.status !== 'running' && (
                      <Button 
                        className="flex-1" 
                        onClick={() => handleRunSimulation(selectedScenario.id)}
                        disabled={selectedScenario.status === 'running' as any}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Simülasyonu Çalıştır
                      </Button>
                    )}
                    
                    <Button variant="outline" className="flex-1">
                      <Save className="mr-2 h-4 w-4" />
                      Sonuçları Kaydet
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Simülasyon Karşılaştırması</CardTitle>
              <CardDescription>
                Farklı simülasyon senaryolarını yan yana karşılaştırın
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scenarios.filter(s => s.results).length >= 2 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <h3 className="text-sm font-medium mb-3">Tamamlanma Süresi Karşılaştırması (gün)</h3>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ReBarChart
                            data={scenarios
                              .filter(s => s.results)
                              .map(s => ({
                                name: s.name,
                                süre: s.results?.totalCompletionTime || 0
                              }))}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="süre" fill="#8884d8" name="Toplam Süre (gün)" />
                          </ReBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <h3 className="text-sm font-medium mb-3">Maliyet ve Teslimat Oranı Karşılaştırması</h3>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ReLineChart
                            data={scenarios
                              .filter(s => s.results)
                              .map(s => ({
                                name: s.name,
                                maliyet: s.results?.totalCost || 0,
                                teslimat: s.results?.onTimeDeliveryRate || 0
                              }))}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Legend />
                            <Line 
                              yAxisId="left"
                              type="monotone" 
                              dataKey="maliyet" 
                              stroke="#8884d8" 
                              name="Toplam Maliyet (₺)"
                            />
                            <Line 
                              yAxisId="right"
                              type="monotone" 
                              dataKey="teslimat" 
                              stroke="#82ca9d" 
                              name="Zamanında Teslimat (%)"
                            />
                          </ReLineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-3">Senaryo Karşılaştırma Tablosu</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Senaryo</th>
                            <th className="text-right p-2">Süre (gün)</th>
                            <th className="text-right p-2">Teslimat (%)</th>
                            <th className="text-right p-2">Kullanım (%)</th>
                            <th className="text-right p-2">Maliyet (₺)</th>
                            <th className="text-right p-2">Darboğaz</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scenarios
                            .filter(s => s.results)
                            .map((scenario) => (
                              <tr key={scenario.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 font-medium">{scenario.name}</td>
                                <td className="p-2 text-right">{scenario.results?.totalCompletionTime}</td>
                                <td className="p-2 text-right">{scenario.results?.onTimeDeliveryRate.toFixed(1)}%</td>
                                <td className="p-2 text-right">{calculateAverageUtilization(scenario.results).toFixed(1)}%</td>
                                <td className="p-2 text-right">₺{scenario.results?.totalCost.toLocaleString()}</td>
                                <td className="p-2 text-right">{calculateBottleneckRate(scenario.results).toFixed(1)}%</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Yeterli senaryo bulunamadı</AlertTitle>
                  <AlertDescription>
                    Karşılaştırma yapabilmek için en az iki tamamlanmış simülasyon senaryosu gereklidir.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parameters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Simülasyon Parametreleri</CardTitle>
              <CardDescription>
                Simülasyonlarda kullanılabilen parametreler ve değer aralıkları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Kapasite Parametreleri</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label>Departman Kapasitesi</Label>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs">%50</span>
                            <span className="text-xs">%150</span>
                          </div>
                          <Slider 
                            defaultValue={[100]} 
                            min={50} 
                            max={150} 
                            step={5}
                          />
                          <div className="text-xs text-center mt-1 text-gray-500">
                            Varsayılan: %100
                          </div>
                        </div>
                        
                        <div>
                          <Label>Makine Kapasitesi</Label>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs">%50</span>
                            <span className="text-xs">%150</span>
                          </div>
                          <Slider 
                            defaultValue={[100]} 
                            min={50} 
                            max={150} 
                            step={5}
                          />
                          <div className="text-xs text-center mt-1 text-gray-500">
                            Varsayılan: %100
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">İş Gücü Parametreleri</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label>Çalışan Sayısı</Label>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs">-50%</span>
                            <span className="text-xs">+50%</span>
                          </div>
                          <Slider 
                            defaultValue={[0]} 
                            min={-50} 
                            max={50} 
                            step={5}
                          />
                          <div className="text-xs text-center mt-1 text-gray-500">
                            Varsayılan: Mevcut durum (0%)
                          </div>
                        </div>
                        
                        <div>
                          <Label>Verimlilik Faktörü</Label>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs">%75</span>
                            <span className="text-xs">%125</span>
                          </div>
                          <Slider 
                            defaultValue={[100]} 
                            min={75} 
                            max={125} 
                            step={5}
                          />
                          <div className="text-xs text-center mt-1 text-gray-500">
                            Varsayılan: %100
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Operasyon Parametreleri</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Vardiya Sayısı</Label>
                          <Select defaultValue="2">
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label>Hafta Sonu Çalışma</Label>
                          <Switch />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label>Öncelik Stratejisi</Label>
                          <Select defaultValue="deadline">
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="deadline">Teslimat Tarihi</SelectItem>
                              <SelectItem value="fifo">İlk Giren İlk Çıkar</SelectItem>
                              <SelectItem value="priority">Müşteri Önceliği</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Parametre Etkileri</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Kapasite Artışı Etkileri</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Darboğazların azalması</li>
                          <li>Teslimat sürelerinin iyileşmesi</li>
                          <li>Zamanında teslimat oranının artması</li>
                          <li className="text-red-600">Ekipman ve personel maliyetlerinin artması</li>
                          <li className="text-red-600">Düşük kapasite kullanım oranı riski</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Operasyon Optimizasyonu Etkileri</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Kaynak kullanım verimliliğinin artması</li>
                          <li>Üretim çizelgesinin daha esnek olması</li>
                          <li>Darboğazların daha iyi yönetilmesi</li>
                          <li className="text-red-600">Operasyonel karmaşıklığın artması</li>
                          <li className="text-red-600">Geçiş maliyetlerinin artması</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Yeni Senaryo Oluşturma Dialog */}
      <Dialog open={showNewScenarioDialog} onOpenChange={setShowNewScenarioDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yeni Simülasyon Senaryosu</DialogTitle>
            <DialogDescription>
              "What-if" analizi için yeni bir simülasyon senaryosu oluşturun.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Senaryo Adı
              </Label>
              <Input
                id="name"
                value={newScenario.name}
                onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Açıklama
              </Label>
              <Textarea
                id="description"
                value={newScenario.description}
                onChange={(e) => setNewScenario({ ...newScenario, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="baseline" className="text-right">
                Temel Senaryo
              </Label>
              <Select
                value={newScenario.baselineId?.toString() || ""}
                onValueChange={(value) => setNewScenario({ 
                  ...newScenario, 
                  baselineId: value ? parseInt(value) : null 
                })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Temel senaryo seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Temel senaryo yok</SelectItem>
                  {scenarios
                    .filter(s => s.status === 'completed')
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tags" className="text-right">
                Etiketler
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex flex-wrap gap-1">
                  {newScenario.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {tag}
                      <button 
                        type="button"
                        onClick={() => setNewScenario({
                          ...newScenario,
                          tags: newScenario.tags.filter((_, i) => i !== index)
                        })}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Select
                    onValueChange={(value) => {
                      if (value && !newScenario.tags.includes(value)) {
                        setNewScenario({
                          ...newScenario,
                          tags: [...newScenario.tags, value]
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Etiket ekle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kapasite">Kapasite</SelectItem>
                      <SelectItem value="maliyet">Maliyet</SelectItem>
                      <SelectItem value="verimlilik">Verimlilik</SelectItem>
                      <SelectItem value="zaman">Zaman</SelectItem>
                      <SelectItem value="optimizasyon">Optimizasyon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="col-span-full">
              <h4 className="font-medium mb-2">Simülasyon Parametreleri</h4>
              <div className="border rounded-md p-3 space-y-3">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    Departman Kapasitesi
                  </Label>
                  <div className="col-span-3">
                    <Slider 
                      defaultValue={[100]} 
                      min={50} 
                      max={150} 
                      step={5}
                      onValueChange={(value) => setNewScenario({
                        ...newScenario,
                        parameters: {
                          ...newScenario.parameters,
                          departmentCapacity: value[0]
                        }
                      })}
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span>%50</span>
                      <span>%{newScenario.parameters.departmentCapacity || 100}</span>
                      <span>%150</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    İş Gücü Sayısı
                  </Label>
                  <div className="col-span-3">
                    <Slider 
                      defaultValue={[0]} 
                      min={-50} 
                      max={50} 
                      step={5}
                      onValueChange={(value) => setNewScenario({
                        ...newScenario,
                        parameters: {
                          ...newScenario.parameters,
                          workforceChange: value[0]
                        }
                      })}
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span>-50%</span>
                      <span>{(newScenario.parameters.workforceChange || 0) > 0 ? "+" : ""}{newScenario.parameters.workforceChange || 0}%</span>
                      <span>+50%</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    Vardiya Sayısı
                  </Label>
                  <Select
                    defaultValue="2"
                    onValueChange={(value) => setNewScenario({
                      ...newScenario,
                      parameters: {
                        ...newScenario.parameters,
                        shifts: parseInt(value)
                      }
                    })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Vardiya</SelectItem>
                      <SelectItem value="2">2 Vardiya</SelectItem>
                      <SelectItem value="3">3 Vardiya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    Önceliklendirme
                  </Label>
                  <Select
                    defaultValue="deadline"
                    onValueChange={(value) => setNewScenario({
                      ...newScenario,
                      parameters: {
                        ...newScenario.parameters,
                        priorityStrategy: value
                      }
                    })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deadline">Teslimat Tarihi</SelectItem>
                      <SelectItem value="fifo">İlk Giren İlk Çıkar</SelectItem>
                      <SelectItem value="priority">Müşteri Önceliği</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    Hafta Sonu Çalışma
                  </Label>
                  <div className="flex items-center space-x-2 col-span-3">
                    <Switch 
                      id="weekendWork"
                      onCheckedChange={(checked) => setNewScenario({
                        ...newScenario,
                        parameters: {
                          ...newScenario.parameters,
                          weekendWork: checked
                        }
                      })}
                    />
                    <Label htmlFor="weekendWork">
                      {newScenario.parameters.weekendWork ? "Aktif" : "Pasif"}
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowNewScenarioDialog(false)}
            >
              İptal
            </Button>
            <Button 
              type="submit" 
              onClick={handleCreateScenario}
              disabled={!newScenario.name}
            >
              Senaryo Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// CheckIcon bileşeni
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

export default SimulationCenter;