import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

// UI Bileşenleri
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import {
  Loader2,
  Search,
  Plus,
  BarChart2,
  ListFilter,
  RefreshCw,
  Check,
  X,
  FileText,
  Send,
  AlertTriangle,
  AlertCircle,
  Scale,
  Ruler,
  Maximize2,
  Minimize2,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Paperclip,
} from "lucide-react";

// Kumaş Kusurları ve Kalite Sınıflandırma için Sabitler
interface DefectType {
  id: number;
  code: string;
  name: string;
  severity: "Kritik" | "Majör" | "Minör";
  points: number;
  description: string;
}

// Kusur tipi listesi
const DEFECT_TYPES: DefectType[] = [
  { id: 1, code: "DEF-001", name: "İplik Kopması", severity: "Majör", points: 5, description: "Kumaşta atkı veya çözgü ipliklerinin kopması" },
  { id: 2, code: "DEF-002", name: "Leke", severity: "Majör", points: 4, description: "Kumaş üzerinde yağ veya diğer maddelerden kaynaklanan lekeler" },
  { id: 3, code: "DEF-003", name: "Renk Farklılığı", severity: "Minör", points: 2, description: "Aynı parti içinde renk tonu farklılıkları" },
  { id: 4, code: "DEF-004", name: "Desen Hatası", severity: "Majör", points: 4, description: "Dokuma deseni hataları veya uyumsuzlukları" },
  { id: 5, code: "DEF-005", name: "Dokuma Sıklığı Hatası", severity: "Majör", points: 4, description: "Cm başına düşen iplik sayısında sapmalar" },
  { id: 6, code: "DEF-006", name: "Çözgü Çizgisi", severity: "Minör", points: 2, description: "Çözgü ipliklerinin çizgi halinde hatası" },
  { id: 7, code: "DEF-007", name: "Atkı Çizgisi", severity: "Minör", points: 2, description: "Atkı ipliklerinin çizgi halinde hatası" },
  { id: 8, code: "DEF-008", name: "Delik", severity: "Kritik", points: 10, description: "Kumaşta delik veya yırtık" },
  { id: 9, code: "DEF-009", name: "Kenar Hatası", severity: "Majör", points: 3, description: "Kumaş kenarlarında bozulma" },
  { id: 10, code: "DEF-010", name: "Balık Sırtı", severity: "Minör", points: 2, description: "Dokumada seyrek görülen balık sırtı hatası" },
  { id: 11, code: "DEF-011", name: "İplik Kalınlık Farklılıkları", severity: "Minör", points: 2, description: "İplik kalınlığında düzensizlik" },
  { id: 12, code: "DEF-012", name: "Kirlilik", severity: "Minör", points: 2, description: "Kumaş yüzeyinde kir veya yabancı madde" },
  { id: 13, code: "DEF-013", name: "Kayma", severity: "Majör", points: 3, description: "Kumaşın yön kayması" },
  { id: 14, code: "DEF-014", name: "Kırışıklık", severity: "Minör", points: 1, description: "Düzeltilemez kırışıklık" },
  { id: 15, code: "DEF-015", name: "Genişlik Hatası", severity: "Majör", points: 4, description: "Belirtilen genişlik dışında dokuma" },
  { id: 16, code: "DEF-016", name: "İplik Düğümü", severity: "Minör", points: 2, description: "Kumaş yüzeyinde iplik düğümleri" },
  { id: 17, code: "DEF-017", name: "Dokuma Kayması", severity: "Majör", points: 4, description: "Kumaşın dokuma yapısında kayma" },
  { id: 18, code: "DEF-018", name: "Sık/Seyrek Doku", severity: "Majör", points: 4, description: "Kumaşın bazı bölgelerinde sık veya seyrek dokuma" },
  { id: 19, code: "DEF-019", name: "Teğet İplik", severity: "Minör", points: 1, description: "Kumaş yüzeyinde teğet geçen iplikler" },
  { id: 20, code: "DEF-020", name: "Büyük Yırtık", severity: "Kritik", points: 15, description: "Kumaşta büyük bir yırtık veya hasar" },
];

// Kalite değerlendirme formül sabitleri
const QUALITY_CONSTANTS = {
  pointThresholdA1: 7,  // A1 kalite için maksimum hata puanı (optimize edilmiş değer)
  pointThresholdA2: 20, // A2 kalite için maksimum hata puanı (optimize edilmiş değer)
  criticalDefectLimit: 0, // A1 için izin verilen kritik hata sayısı
  majorDefectLimitA1: 2, // A1 için izin verilen majör hata sayısı (optimize edilmiş değer)
  minorDefectLimitA1: 4, // A1 için izin verilen minör hata sayısı (optimize edilmiş değer)
  majorDefectLimitA2: 4, // A2 için izin verilen majör hata sayısı (optimize edilmiş değer)
  minorDefectLimitA2: 6, // A2 için izin verilen minör hata sayısı (optimize edilmiş değer)
  metersPerPoint: 10,   // Her 10 metre için 1 puan hesaplanır
  defectAreaFactor: 1.5, // Kusur büyüklüğü için çarpan faktörü
};

// Kumaş inceleme formu şeması
const fabricInspectionSchema = z.object({
  batchNumber: z.string().min(1, "Parti numarası zorunludur"),
  orderNumber: z.string().min(1, "Sipariş numarası zorunludur"),
  fabricType: z.string().min(1, "Kumaş tipi zorunludur"),
  length: z.coerce.number().min(1, "Uzunluk zorunludur"),
  width: z.coerce.number().min(1, "Genişlik zorunludur"),
  weight: z.coerce.number().min(1, "Ağırlık zorunludur"),
  notes: z.string().optional(),
});

type FabricInspectionFormValues = z.infer<typeof fabricInspectionSchema>;

interface FabricDefect {
  id: string;
  defectTypeId: number;
  position: string; // Örn: "Sol Kenar", "Orta", "Sağ Kenar"
  meter: number;
  severity: "Kritik" | "Majör" | "Minör";
  notes: string;
  width?: number; // Kusurun genişliği (cm)
  length?: number; // Kusurun uzunluğu (cm)
  area?: number; // Kusurun alanı (cm²)
}

// Ölçüm Cihazları Arayüzü 
interface DeviceStatus {
  weightConnected: boolean;
  meterConnected: boolean;
}

export default function FabricQuality() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("inspection");
  const [defects, setDefects] = useState<FabricDefect[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentDefect, setCurrentDefect] = useState<FabricDefect | null>(null);
  const [finalGrade, setFinalGrade] = useState<"A1" | "A2" | "B" | null>(null);
  const [qualityReport, setQualityReport] = useState<string>("");
  const [comPorts, setComPorts] = useState<{path: string, manufacturer?: string}[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    weightConnected: false,
    meterConnected: false
  });
  const [weightValue, setWeightValue] = useState("0.0");
  const [meterValue, setMeterValue] = useState("0.0");
  const [isFetchingDeviceValue, setIsFetchingDeviceValue] = useState(false);

  // Kusur Ekleme Formu
  const form = useForm<FabricInspectionFormValues>({
    resolver: zodResolver(fabricInspectionSchema),
    defaultValues: {
      batchNumber: "",
      orderNumber: "",
      fabricType: "",
      length: 0,
      width: 0,
      weight: 0,
      notes: "",
    },
  });

  // COM Port Listesini Çekme
  const { data: portsData, refetch: refetchPorts } = useQuery({
    queryKey: ['/api/quality/ports'],
    enabled: false,
  });

  useEffect(() => {
    if (portsData) {
      setComPorts(portsData);
    }
  }, [portsData]);

  // Cihaz Durumunu Periyodik Kontrol
  useEffect(() => {
    const checkDeviceStatus = async () => {
      try {
        const response = await apiRequest('GET', '/api/quality/device-status');
        const data = await response.json();
        setDeviceStatus(data);
      } catch (error) {
        console.error("Cihaz durumu kontrol edilirken hata:", error);
      }
    };

    // İlk kontrol
    checkDeviceStatus();

    // 5 saniyede bir kontrol et
    const interval = setInterval(checkDeviceStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Tartı ve Metre Değerlerini Alma
  const getDeviceValue = async (deviceType: 'weight' | 'meter') => {
    setIsFetchingDeviceValue(true);
    try {
      const response = await apiRequest('GET', `/api/quality/${deviceType}-value`);
      const data = await response.json();
      
      if (deviceType === 'weight') {
        setWeightValue(data.value);
        // Form değerini otomatik güncelle
        form.setValue("weight", parseFloat(data.value));
      } else {
        setMeterValue(data.value);
        // Form değerini otomatik güncelle
        form.setValue("length", parseFloat(data.value));
      }
      
      toast({
        title: `${deviceType === 'weight' ? 'Tartı' : 'Metre'} değeri alındı`,
        description: `Değer: ${data.value}`,
      });
    } catch (error) {
      console.error(`${deviceType} değeri alınırken hata:`, error);
      toast({
        title: `${deviceType === 'weight' ? 'Tartı' : 'Metre'} değeri alınamadı`,
        description: "Lütfen cihaz bağlantısını kontrol edin",
        variant: "destructive",
      });
    } finally {
      setIsFetchingDeviceValue(false);
    }
  };

  // COM Port Bağlantısı Oluşturma
  const connectDevice = async (portName: string, deviceType: 'weight' | 'meter') => {
    try {
      const response = await apiRequest('POST', '/api/quality/ports/connect', {
        portName,
        deviceType,
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Bağlantı başarılı",
          description: data.message,
        });
        
        // Cihaz durumunu güncelle
        const statusResponse = await apiRequest('GET', '/api/quality/device-status');
        const statusData = await statusResponse.json();
        setDeviceStatus(statusData);
      } else {
        toast({
          title: "Bağlantı hatası",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Cihaz bağlanırken hata:", error);
      toast({
        title: "Bağlantı hatası",
        description: "İşlem sırasında bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  // Kusur Ekleme
  const addDefect = (defect: FabricDefect) => {
    setDefects(prev => [...prev, defect]);
    setDialogOpen(false);
    setCurrentDefect(null);
    
    // Kalite değerlendirmesini yeniden hesapla
    evaluateQuality([...defects, defect], form.getValues("length"));
  };

  // Kusur Düzenleme
  const editDefect = (defect: FabricDefect) => {
    setDefects(prev => prev.map(d => d.id === defect.id ? defect : d));
    setDialogOpen(false);
    setCurrentDefect(null);
    
    // Kalite değerlendirmesini yeniden hesapla
    evaluateQuality(defects.map(d => d.id === defect.id ? defect : d), form.getValues("length"));
  };

  // Kusur Silme
  const removeDefect = (id: string) => {
    setDefects(prev => prev.filter(d => d.id !== id));
    
    // Kalite değerlendirmesini yeniden hesapla
    evaluateQuality(defects.filter(d => d.id !== id), form.getValues("length"));
  };

  // Yeni Kusur Ekleme İletişim Kutusu Açma
  const openNewDefectDialog = () => {
    setCurrentDefect({
      id: Date.now().toString(),
      defectTypeId: 1,
      position: "Orta",
      meter: parseFloat(meterValue) || 0,
      severity: "Minör",
      notes: "",
      width: 5,
      length: 5,
      area: 25,
    });
    setDialogOpen(true);
  };

  // Kusur Düzenleme İletişim Kutusu Açma
  const openEditDefectDialog = (defect: FabricDefect) => {
    setCurrentDefect(defect);
    setDialogOpen(true);
  };

  // Kalite Değerlendirme Algoritması 
  const evaluateQuality = (defectList: FabricDefect[], fabricLength: number) => {
    // Kusur tiplerine göre sayıları ve kusur puanlarını hesapla
    let criticalDefectCount = 0;
    let majorDefectCount = 0;
    let minorDefectCount = 0;
    let criticalDefectPoints = 0;
    let majorDefectPoints = 0;
    let minorDefectPoints = 0;
    
    // Kusurları şiddetlerine göre grupla ve puanları topla
    defectList.forEach(defect => {
      const defectType = DEFECT_TYPES.find(type => type.id === defect.defectTypeId);
      if (!defectType) return;
      
      // Kusur alanını hesapla (varsayılan alan 25 cm²)
      const area = defect.area || 25; 
      
      // Boyut faktörü ve konum faktörü hesapla
      const sizeFactor = Math.sqrt(area / 25);
      const positionFactor = defect.position === "Orta" ? 1.2 : 
                           defect.position === "Sol Kenar" || defect.position === "Sağ Kenar" ? 0.8 : 1.0;
      
      // Toplam puan hesaplaması
      const defectPoints = Math.round((defectType.points * sizeFactor * positionFactor * QUALITY_CONSTANTS.defectAreaFactor) * 10) / 10;
      
      // Şiddete göre grupla
      if (defectType.severity === "Kritik") {
        criticalDefectCount++;
        criticalDefectPoints += defectPoints;
      } else if (defectType.severity === "Majör") {
        majorDefectCount++;
        majorDefectPoints += defectPoints;
      } else if (defectType.severity === "Minör") {
        minorDefectCount++;
        minorDefectPoints += defectPoints;
      }
    });
    
    const criticalDefects = criticalDefectCount;
    const majorDefects = majorDefectCount;
    const minorDefects = minorDefectCount;
    
    // Toplam kusur puanı - şiddet gruplarına göre puanları topla
    const totalPoints = criticalDefectPoints + majorDefectPoints + minorDefectPoints;
    
    // 100 metreye normalize edilmiş kusur puanı
    // Kumaş uzunluğu 0 veya tanımsız olduğunda default 1 kullan
    const fabricLengthInMeters = fabricLength > 0 ? fabricLength : 1;
    const normalizedPoints = (totalPoints / fabricLengthInMeters) * 100;
    
    let grade: "A1" | "A2" | "B";
    let reportDetails: string[] = [];
    
    // Rapor başlığı
    reportDetails.push(`Kumaş Kalite Değerlendirme Raporu`);
    reportDetails.push(`Değerlendirme Tarihi: ${format(new Date(), "dd MMMM yyyy", { locale: tr })}`);
    reportDetails.push(`\nKusur Özeti:`);
    reportDetails.push(`Kritik Kusurlar: ${criticalDefects}`);
    reportDetails.push(`Majör Kusurlar: ${majorDefects}`);
    reportDetails.push(`Minör Kusurlar: ${minorDefects}`);
    reportDetails.push(`Toplam Kusur Puanı: ${totalPoints}`);
    reportDetails.push(`100 Metre Normalize Edilmiş Puan: ${normalizedPoints.toFixed(2)}`);
    
    // Kalite sınıfını belirle
    if (
      criticalDefects <= QUALITY_CONSTANTS.criticalDefectLimit &&
      majorDefects <= QUALITY_CONSTANTS.majorDefectLimitA1 &&
      minorDefects <= QUALITY_CONSTANTS.minorDefectLimitA1 &&
      normalizedPoints <= QUALITY_CONSTANTS.pointThresholdA1
    ) {
      grade = "A1";
      reportDetails.push(`\nKalite Sınıfı: A1 (Birinci Kalite)`);
      reportDetails.push(`Sonuç: Kumaş A1 kalite standartlarını karşılamaktadır.`);
    } 
    else if (
      criticalDefects <= 1 &&
      majorDefects <= QUALITY_CONSTANTS.majorDefectLimitA2 &&
      minorDefects <= QUALITY_CONSTANTS.minorDefectLimitA2 &&
      normalizedPoints <= QUALITY_CONSTANTS.pointThresholdA2
    ) {
      grade = "A2";
      reportDetails.push(`\nKalite Sınıfı: A2 (İkinci Kalite)`);
      reportDetails.push(`Sonuç: Kumaş A2 kalite standartlarını karşılamaktadır.`);
    } 
    else {
      grade = "B";
      reportDetails.push(`\nKalite Sınıfı: B (Üçüncü Kalite)`);
      reportDetails.push(`Sonuç: Kumaş B kalite olarak sınıflandırılmıştır.`);
    }
    
    // Kusur detayları
    if (defectList.length > 0) {
      reportDetails.push(`\nKusur Detayları:`);
      defectList.forEach((defect, index) => {
        const defectType = DEFECT_TYPES.find(type => type.id === defect.defectTypeId);
        const defectWidth = defect.width ? `Genişlik: ${defect.width} cm, ` : '';
        const defectLength = defect.length ? `Uzunluk: ${defect.length} cm, ` : '';
        const defectArea = defect.area ? `Alan: ${defect.area} cm², ` : '';
        
        reportDetails.push(`${index + 1}. ${defectType?.name} (${defectType?.severity}) - Pozisyon: ${defect.position}, Metre: ${defect.meter}`);
        if (defect.width || defect.length || defect.area) {
          reportDetails.push(`   Boyut: ${defectWidth}${defectLength}${defectArea}`);
        }
        if (defect.notes) reportDetails.push(`   Not: ${defect.notes}`);
      });
    }
    
    setFinalGrade(grade);
    setQualityReport(reportDetails.join('\n'));
  };

  // Form gönderimi
  const onSubmit = (data: FabricInspectionFormValues) => {
    // Kalite değerlendirmeyi başlat
    evaluateQuality(defects, data.length);
    
    toast({
      title: "Kalite değerlendirme tamamlandı",
      description: `Kumaş kalite sınıfı: ${finalGrade || 'Değerlendiriliyor...'}`,
    });
    
    setActiveTab("report");
  };

  // COM portlarını yenile
  const handleRefreshPorts = () => {
    refetchPorts();
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Kumaş Kalite Kontrol</h1>
          <p className="text-muted-foreground">
            Kumaş kalite kontrolü yapın ve kalite sınıfını belirleyin
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="devices">Ölçüm Cihazları</TabsTrigger>
          <TabsTrigger value="inspection">Kalite Kontrol</TabsTrigger>
          <TabsTrigger value="report">Kalite Raporu</TabsTrigger>
        </TabsList>

        {/* Ölçüm Cihazları Sekmesi */}
        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ölçüm Cihazları Bağlantı Durumu</CardTitle>
              <CardDescription>
                Kalite kontrol için kullanılan tartı ve metre cihazlarının bağlantı durumunu yönetin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Tartı Cihazı */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Tartı Cihazı</CardTitle>
                      <Badge
                        variant={deviceStatus.weightConnected ? "default" : "destructive"}
                      >
                        {deviceStatus.weightConnected ? "Bağlı" : "Bağlı Değil"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Kumaş ağırlığını ölçmek için tartı cihazını bağlayın
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-md">
                      <div className="flex items-center">
                        <Scale className="h-5 w-5 mr-2 text-primary" />
                        <span className="font-medium">Mevcut Değer:</span>
                      </div>
                      <span className="text-lg font-bold">
                        {weightValue} kg
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <Select disabled={!deviceStatus.weightConnected}>
                        <SelectTrigger>
                          <SelectValue placeholder="COM port seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {comPorts.map((port) => (
                            <SelectItem key={port.path} value={port.path}>
                              {port.path} {port.manufacturer ? `(${port.manufacturer})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefreshPorts}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => getDeviceValue("weight")}
                      disabled={!deviceStatus.weightConnected || isFetchingDeviceValue}
                    >
                      {isFetchingDeviceValue ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Scale className="mr-2 h-4 w-4" />
                      )}
                      Değeri Al
                    </Button>
                  </CardFooter>
                </Card>

                {/* Metre Cihazı */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Metre Cihazı</CardTitle>
                      <Badge
                        variant={deviceStatus.meterConnected ? "default" : "destructive"}
                      >
                        {deviceStatus.meterConnected ? "Bağlı" : "Bağlı Değil"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Kumaş uzunluğunu ölçmek için metre cihazını bağlayın
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-md">
                      <div className="flex items-center">
                        <Ruler className="h-5 w-5 mr-2 text-primary" />
                        <span className="font-medium">Mevcut Değer:</span>
                      </div>
                      <span className="text-lg font-bold">
                        {meterValue} m
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <Select disabled={!deviceStatus.meterConnected}>
                        <SelectTrigger>
                          <SelectValue placeholder="COM port seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {comPorts.map((port) => (
                            <SelectItem key={port.path} value={port.path}>
                              {port.path} {port.manufacturer ? `(${port.manufacturer})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefreshPorts}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => getDeviceValue("meter")}
                      disabled={!deviceStatus.meterConnected || isFetchingDeviceValue}
                    >
                      {isFetchingDeviceValue ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Ruler className="mr-2 h-4 w-4" />
                      )}
                      Değeri Al
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Mevcut Portlar</CardTitle>
                  <CardDescription>
                    Sistemde tespit edilen seri portların listesi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshPorts}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Portları Yenile
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Port</TableHead>
                        <TableHead>Üretici</TableHead>
                        <TableHead>İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comPorts.length > 0 ? (
                        comPorts.map((port) => (
                          <TableRow key={port.path}>
                            <TableCell>{port.path}</TableCell>
                            <TableCell>{port.manufacturer || "Bilinmiyor"}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => connectDevice(port.path, "weight")}
                                >
                                  <Scale className="mr-2 h-4 w-4" />
                                  Tartı Olarak Bağla
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => connectDevice(port.path, "meter")}
                                >
                                  <Ruler className="mr-2 h-4 w-4" />
                                  Metre Olarak Bağla
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4">
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <AlertCircle className="h-10 w-10 mb-2" />
                              <p>Herhangi bir COM port tespit edilemedi.</p>
                              <p className="text-sm">
                                "Portları Yenile" düğmesine tıklayarak tekrar
                                deneyin veya cihazların bağlı olduğundan emin
                                olun.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kalite Kontrol Sekmesi */}
        <TabsContent value="inspection" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Kumaş Bilgileri */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Kumaş Bilgileri</CardTitle>
                <CardDescription>
                  Kalite kontrolü yapılacak kumaş bilgilerini girin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form className="space-y-4">
                    <FormField
                      control={form.control}
                      name="batchNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parti Numarası</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ORN: BATCH-001" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="orderNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sipariş Numarası</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ORN: ORD-2025-001" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fabricType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kumaş Tipi</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Kumaş tipi seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Pamuklu Dokuma">Pamuklu Dokuma</SelectItem>
                              <SelectItem value="Polyester Dokuma">Polyester Dokuma</SelectItem>
                              <SelectItem value="Pamuk-Polyester Karışım">Pamuk-Polyester Karışım</SelectItem>
                              <SelectItem value="Keten Dokuma">Keten Dokuma</SelectItem>
                              <SelectItem value="İpek Dokuma">İpek Dokuma</SelectItem>
                              <SelectItem value="Viskon Dokuma">Viskon Dokuma</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Uzunluk (m)</FormLabel>
                            <div className="flex space-x-2">
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              {deviceStatus.meterConnected && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => getDeviceValue("meter")}
                                  disabled={isFetchingDeviceValue}
                                >
                                  {isFetchingDeviceValue ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Ruler className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Genişlik (cm)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ağırlık (kg)</FormLabel>
                          <div className="flex space-x-2">
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            {deviceStatus.weightConnected && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => getDeviceValue("weight")}
                                disabled={isFetchingDeviceValue}
                              >
                                {isFetchingDeviceValue ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Scale className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notlar</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Ek bilgiler..."
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Kusur Listesi */}
            <Card className="md:col-span-1">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Tespit Edilen Kusurlar</CardTitle>
                  <Button
                    size="sm"
                    onClick={openNewDefectDialog}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Kusur Ekle
                  </Button>
                </div>
                <CardDescription>
                  Kumaşta tespit edilen kusurların listesi
                </CardDescription>
              </CardHeader>
              <CardContent>
                {defects.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kusur Tipi</TableHead>
                        <TableHead>Konum</TableHead>
                        <TableHead>Metre</TableHead>
                        <TableHead>Şiddet</TableHead>
                        <TableHead>İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {defects.map((defect) => {
                        const defectType = DEFECT_TYPES.find(
                          (type) => type.id === defect.defectTypeId
                        );
                        return (
                          <TableRow key={defect.id}>
                            <TableCell>
                              {defectType?.name || "Bilinmeyen"}
                            </TableCell>
                            <TableCell>{defect.position}</TableCell>
                            <TableCell>{defect.meter}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  defect.severity === "Kritik"
                                    ? "destructive"
                                    : defect.severity === "Majör"
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {defect.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDefectDialog(defect)}
                                >
                                  <Paperclip className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeDefect(defect.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground mb-2">
                      Henüz kusur eklenmemiş
                    </p>
                    <Button
                      variant="outline"
                      onClick={openNewDefectDialog}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Kusur Ekle
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => form.handleSubmit(onSubmit)()}
                  disabled={defects.length === 0}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Kalite Değerlendirmesini Tamamla
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Kusur Ekleme/Düzenleme İletişim Kutusu */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {currentDefect && currentDefect.id ? "Kusur Düzenle" : "Yeni Kusur Ekle"}
                </DialogTitle>
                <DialogDescription>
                  Tespit edilen kusurun detaylarını girin
                </DialogDescription>
              </DialogHeader>

              {currentDefect && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Kusur Tipi</label>
                      <Select
                        value={currentDefect.defectTypeId.toString()}
                        onValueChange={(value) =>
                          setCurrentDefect({
                            ...currentDefect,
                            defectTypeId: parseInt(value),
                            severity: DEFECT_TYPES.find(type => type.id === parseInt(value))?.severity || "Minör"
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kusur tipi seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEFECT_TYPES.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name} ({type.severity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Genişlik (cm)</label>
                        <Input
                          type="number"
                          value={currentDefect.width?.toString() || "5"}
                          onChange={(e) =>
                            setCurrentDefect({
                              ...currentDefect,
                              width: parseInt(e.target.value) || 5,
                              area: (parseInt(e.target.value) || 5) * (currentDefect.length || 5)
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Uzunluk (cm)</label>
                        <Input
                          type="number"
                          value={currentDefect.length?.toString() || "5"}
                          onChange={(e) =>
                            setCurrentDefect({
                              ...currentDefect,
                              length: parseInt(e.target.value) || 5,
                              area: (parseInt(e.target.value) || 5) * (currentDefect.width || 5)
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Alan (cm²)</label>
                        <Input
                          type="number"
                          value={currentDefect.area?.toString() || "25"}
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Pozisyon</label>
                        <Select
                          value={currentDefect.position}
                          onValueChange={(value) =>
                            setCurrentDefect({
                              ...currentDefect,
                              position: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Konum seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sol Kenar">Sol Kenar</SelectItem>
                            <SelectItem value="Sağ Kenar">Sağ Kenar</SelectItem>
                            <SelectItem value="Orta">Orta</SelectItem>
                            <SelectItem value="Tam Genişlik">Tam Genişlik</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Metre</label>
                        <div className="flex space-x-2">
                          <Input
                            type="number"
                            value={currentDefect.meter}
                            onChange={(e) =>
                              setCurrentDefect({
                                ...currentDefect,
                                meter: parseFloat(e.target.value),
                              })
                            }
                          />
                          {deviceStatus.meterConnected && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setCurrentDefect({
                                  ...currentDefect,
                                  meter: parseFloat(meterValue) || 0,
                                });
                              }}
                            >
                              <Ruler className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notlar</label>
                      <Textarea
                        value={currentDefect.notes}
                        onChange={(e) =>
                          setCurrentDefect({
                            ...currentDefect,
                            notes: e.target.value,
                          })
                        }
                        placeholder="Kusur hakkında ek detaylar..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button
                  onClick={() => {
                    if (currentDefect) {
                      if (defects.find((d) => d.id === currentDefect.id)) {
                        editDefect(currentDefect);
                      } else {
                        addDefect(currentDefect);
                      }
                    }
                  }}
                >
                  Kaydet
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Kalite Raporu Sekmesi */}
        <TabsContent value="report" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Kumaş Kalite Raporu</CardTitle>
                {finalGrade && (
                  <Badge
                    className="text-lg py-1 px-3"
                    variant={
                      finalGrade === "A1"
                        ? "default"
                        : finalGrade === "A2"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {finalGrade} Kalite
                  </Badge>
                )}
              </div>
              <CardDescription>
                Kalite değerlendirmesi sonucunda oluşturulan rapor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {qualityReport ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Kusur İstatistikleri</CardTitle>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                {
                                  name: "Kritik",
                                  value: defects.filter(
                                    (d) =>
                                      DEFECT_TYPES.find(
                                        (type) => type.id === d.defectTypeId
                                      )?.severity === "Kritik"
                                  ).length,
                                },
                                {
                                  name: "Majör",
                                  value: defects.filter(
                                    (d) =>
                                      DEFECT_TYPES.find(
                                        (type) => type.id === d.defectTypeId
                                      )?.severity === "Majör"
                                  ).length,
                                },
                                {
                                  name: "Minör",
                                  value: defects.filter(
                                    (d) =>
                                      DEFECT_TYPES.find(
                                        (type) => type.id === d.defectTypeId
                                      )?.severity === "Minör"
                                  ).length,
                                },
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              <Cell fill="#ef4444" />
                              <Cell fill="#f97316" />
                              <Cell fill="#f59e0b" />
                            </Pie>
                            <Legend />
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Kusur Dağılımı</CardTitle>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={DEFECT_TYPES.map((type) => ({
                              name: type.name,
                              count: defects.filter(
                                (d) => d.defectTypeId === type.id
                              ).length,
                            })).filter((item) => item.count > 0)}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis
                              dataKey="name"
                              type="category"
                              width={100}
                              tick={{ fontSize: 10 }}
                            />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Detaylı Rapor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px] border rounded-md p-4">
                        <pre className="whitespace-pre-wrap font-mono text-sm">
                          {qualityReport}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Kumaş Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm text-muted-foreground">
                            Parti Numarası
                          </span>
                          <span className="font-medium">
                            {form.getValues("batchNumber")}
                          </span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm text-muted-foreground">
                            Sipariş Numarası
                          </span>
                          <span className="font-medium">
                            {form.getValues("orderNumber")}
                          </span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm text-muted-foreground">
                            Kumaş Tipi
                          </span>
                          <span className="font-medium">
                            {form.getValues("fabricType")}
                          </span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm text-muted-foreground">
                            Uzunluk
                          </span>
                          <span className="font-medium">
                            {form.getValues("length")} m
                          </span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm text-muted-foreground">
                            Genişlik
                          </span>
                          <span className="font-medium">
                            {form.getValues("width")} cm
                          </span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm text-muted-foreground">
                            Ağırlık
                          </span>
                          <span className="font-medium">
                            {form.getValues("weight")} kg
                          </span>
                        </div>
                      </div>
                      {form.getValues("notes") && (
                        <div className="mt-4">
                          <span className="text-sm text-muted-foreground">
                            Notlar
                          </span>
                          <p className="mt-1">{form.getValues("notes")}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Henüz rapor oluşturulmadı
                  </h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    Kalite değerlendirmesi yapmak için "Kalite Kontrol"
                    sekmesinde gerekli bilgileri doldurun ve kusur girişi yapın.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("inspection")}
                  >
                    Kalite Kontrole Git
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("inspection")}>
                Kontrole Geri Dön
              </Button>
              
              {finalGrade && (
                <Button>
                  <Send className="mr-2 h-4 w-4" />
                  Raporu Kaydet ve Gönder
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}