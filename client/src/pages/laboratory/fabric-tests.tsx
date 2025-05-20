import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Microscope, 
  CheckCircle2, 
  Loader2, 
  MoveRight, 
  AlertTriangle, 
  BarChart, 
  Search, 
  FileText 
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  BarChart as ReBarChart, 
  Bar,
  PieChart,
  Pie,
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts";

// Sahte veri, gerçek uygulamada API'den gelecektir
const dummyFabricTests = [
  {
    id: 1,
    testNumber: "FTR-2023-001",
    fabricType: "Pamuklu",
    weavePattern: "Bezayağı",
    orderNumber: "SIP-2023-001",
    customerName: "Tekstil A.Ş.",
    testDate: new Date("2025-05-03"),
    width: 150,
    weight: 240,
    tensileStrength: {
      warp: 1250,
      weft: 950
    },
    tearStrength: {
      warp: 82,
      weft: 76
    },
    shrinkage: {
      warp: 2.5,
      weft: 3.2
    },
    colorFastness: {
      washing: 4.5,
      light: 4,
      rubbing: 4
    },
    pillResistance: 3.5,
    result: "Geçti",
    technician: "Elif Yılmaz",
    notes: "Mukavemet testleri kabul edilebilir sınırlar içinde.",
  },
  {
    id: 2,
    testNumber: "FTR-2023-002",
    fabricType: "Polyester",
    weavePattern: "Saten",
    orderNumber: "SIP-2023-002",
    customerName: "Kumaş Ltd.",
    testDate: new Date("2025-05-04"),
    width: 140,
    weight: 180,
    tensileStrength: {
      warp: 1450,
      weft: 1050
    },
    tearStrength: {
      warp: 95,
      weft: 88
    },
    shrinkage: {
      warp: 1.2,
      weft: 1.5
    },
    colorFastness: {
      washing: 4,
      light: 3.5,
      rubbing: 3.5
    },
    pillResistance: 4,
    result: "Geçti",
    technician: "Ayşe Demir",
    notes: "Yüksek mukavemet değerleri.",
  },
  {
    id: 3,
    testNumber: "FTR-2023-003",
    fabricType: "Pamuk/Polyester",
    weavePattern: "Twill",
    orderNumber: "SIP-2023-005",
    customerName: "Global Tekstil",
    testDate: new Date("2025-05-05"),
    width: 160,
    weight: 220,
    tensileStrength: {
      warp: 980,
      weft: 850
    },
    tearStrength: {
      warp: 68,
      weft: 62
    },
    shrinkage: {
      warp: 4.2,
      weft: 4.8
    },
    colorFastness: {
      washing: 3,
      light: 2.5,
      rubbing: 3
    },
    pillResistance: 2.5,
    result: "Kaldı",
    technician: "Mehmet Kaya",
    notes: "Renk haslığı değerleri talep edilen seviyenin altında. Pilling direnci yetersiz.",
  },
];

// Kumaş test analitik verileri
const testResultsData = [
  { name: "Pamuklu", geçti: 42, kaldı: 8 },
  { name: "Polyester", geçti: 38, kaldı: 5 },
  { name: "Pamuk/Polyester", geçti: 32, kaldı: 12 },
  { name: "Keten", geçti: 15, kaldı: 3 },
  { name: "Viskon", geçti: 25, kaldı: 7 },
];

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6"];

// Radar veri yapısı
const qualityRadarData = [
  { property: "Mukavemet", A: 90, B: 85, C: 65, fullMark: 100 },
  { property: "Renk Haslığı", A: 85, B: 70, C: 55, fullMark: 100 },
  { property: "Boyut Sabitliği", A: 88, B: 80, C: 75, fullMark: 100 },
  { property: "Pilling", A: 80, B: 70, C: 50, fullMark: 100 },
  { property: "Doku", A: 90, B: 85, C: 80, fullMark: 100 },
];

// Kumaş testi formu için Zod şeması
const fabricTestFormSchema = z.object({
  fabricType: z.string().min(1, "Kumaş tipi gereklidir"),
  weavePattern: z.string().min(1, "Dokuma deseni gereklidir"),
  orderNumber: z.string().min(1, "Sipariş numarası gereklidir"),
  customerName: z.string().min(1, "Müşteri adı gereklidir"),
  width: z.coerce.number().min(0, "Genişlik değeri gereklidir"),
  weight: z.coerce.number().min(0, "Gramaj değeri gereklidir"),
  tensileStrengthWarp: z.coerce.number().min(0, "Çözgü mukavemet değeri gereklidir"),
  tensileStrengthWeft: z.coerce.number().min(0, "Atkı mukavemet değeri gereklidir"),
  tearStrengthWarp: z.coerce.number().min(0, "Çözgü yırtılma mukavemeti gereklidir"),
  tearStrengthWeft: z.coerce.number().min(0, "Atkı yırtılma mukavemeti gereklidir"),
  shrinkageWarp: z.coerce.number().min(0, "Çözgü çekme değeri gereklidir"),
  shrinkageWeft: z.coerce.number().min(0, "Atkı çekme değeri gereklidir"),
  colorFastnessWashing: z.coerce.number().min(0).max(5, "Değer 0-5 arasında olmalıdır"),
  colorFastnessLight: z.coerce.number().min(0).max(5, "Değer 0-5 arasında olmalıdır"),
  colorFastnessRubbing: z.coerce.number().min(0).max(5, "Değer 0-5 arasında olmalıdır"),
  pillResistance: z.coerce.number().min(0).max(5, "Değer 0-5 arasında olmalıdır"),
  technician: z.string().min(1, "Teknisyen gereklidir"),
  notes: z.string().optional(),
});

type FabricTestFormValues = z.infer<typeof fabricTestFormSchema>;

// Kolon tanımları
const columns: ColumnDef<typeof dummyFabricTests[0]>[] = [
  {
    accessorKey: "testNumber",
    header: "Test No",
  },
  {
    accessorKey: "fabricType",
    header: "Kumaş Tipi",
  },
  {
    accessorKey: "orderNumber",
    header: "Sipariş No",
  },
  {
    accessorKey: "customerName",
    header: "Müşteri",
  },
  {
    accessorKey: "testDate",
    header: "Test Tarihi",
    cell: ({ row }) => format(row.original.testDate, "dd MMMM yyyy", { locale: tr }),
  },
  {
    accessorKey: "weight",
    header: "Gramaj (g/m²)",
    cell: ({ row }) => row.original.weight,
  },
  {
    accessorKey: "result",
    header: "Sonuç",
    cell: ({ row }) => {
      const result = row.original.result;
      let color = "";
      let icon = null;
      
      if (result === "Geçti") {
        color = "bg-green-100 text-green-800";
        icon = <CheckCircle2 className="h-3.5 w-3.5 mr-1" />;
      } else {
        color = "bg-red-100 text-red-800";
        icon = <AlertTriangle className="h-3.5 w-3.5 mr-1" />;
      }
      
      return (
        <Badge className={`${color} flex items-center`}>
          {icon}
          {result}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "İşlemler",
    cell: ({ row }) => (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Detaylar
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Microscope className="h-5 w-5 text-blue-600" />
              Kumaş Test Detayları - {row.original.testNumber}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-6 py-4">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Genel Bilgiler</h3>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Test No:</span>
                  <span className="text-sm">{row.original.testNumber}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Kumaş Tipi:</span>
                  <span className="text-sm">{row.original.fabricType}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Dokuma Deseni:</span>
                  <span className="text-sm">{row.original.weavePattern}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Sipariş No:</span>
                  <span className="text-sm">{row.original.orderNumber}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Müşteri:</span>
                  <span className="text-sm">{row.original.customerName}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Test Tarihi:</span>
                  <span className="text-sm">{format(row.original.testDate, "dd MMMM yyyy", { locale: tr })}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Teknisyen:</span>
                  <span className="text-sm">{row.original.technician}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Fiziksel Özellikler</h3>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Genişlik:</span>
                  <span className="text-sm">{row.original.width} cm</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Gramaj:</span>
                  <span className="text-sm">{row.original.weight} g/m²</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Kopma Mukavemeti (Çözgü):</span>
                  <span className="text-sm">{row.original.tensileStrength.warp} N</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Kopma Mukavemeti (Atkı):</span>
                  <span className="text-sm">{row.original.tensileStrength.weft} N</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Yırtılma Mukavemeti (Çözgü):</span>
                  <span className="text-sm">{row.original.tearStrength.warp} N</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Yırtılma Mukavemeti (Atkı):</span>
                  <span className="text-sm">{row.original.tearStrength.weft} N</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Haslık Özellikleri</h3>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Çekme (Çözgü):</span>
                  <span className="text-sm">% {row.original.shrinkage.warp}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Çekme (Atkı):</span>
                  <span className="text-sm">% {row.original.shrinkage.weft}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Yıkama Haslığı:</span>
                  <span className="text-sm">{row.original.colorFastness.washing}/5</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Işık Haslığı:</span>
                  <span className="text-sm">{row.original.colorFastness.light}/5</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Sürtünme Haslığı:</span>
                  <span className="text-sm">{row.original.colorFastness.rubbing}/5</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Pilling Direnci:</span>
                  <span className="text-sm">{row.original.pillResistance}/5</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Sonuç:</span>
                  <Badge className={row.original.result === "Geçti" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {row.original.result}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-2">
            <h3 className="font-semibold text-sm text-muted-foreground">Notlar</h3>
            <p className="mt-1 text-sm">{row.original.notes || "-"}</p>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Raporu Görüntüle
            </Button>
            <Button variant="default">
              <MoveRight className="h-4 w-4 mr-2" />
              Sevkiyat Onayı
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    ),
  },
];

const FabricTests: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [filterValue, setFilterValue] = useState("all");

  // Filtreleme işlemi
  const filteredData = dummyFabricTests.filter(test => {
    const matchesSearch = 
      searchValue === "" || 
      test.testNumber.toLowerCase().includes(searchValue.toLowerCase()) ||
      test.fabricType.toLowerCase().includes(searchValue.toLowerCase()) ||
      test.orderNumber.toLowerCase().includes(searchValue.toLowerCase()) ||
      test.customerName.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchesFilter = 
      filterValue === "all" || 
      test.result === filterValue;
    
    return matchesSearch && matchesFilter;
  });

  // Form 
  const form = useForm<FabricTestFormValues>({
    resolver: zodResolver(fabricTestFormSchema),
    defaultValues: {
      fabricType: "",
      weavePattern: "",
      orderNumber: "",
      customerName: "",
      width: 0,
      weight: 0,
      tensileStrengthWarp: 0,
      tensileStrengthWeft: 0,
      tearStrengthWarp: 0,
      tearStrengthWeft: 0,
      shrinkageWarp: 0,
      shrinkageWeft: 0,
      colorFastnessWashing: 0,
      colorFastnessLight: 0,
      colorFastnessRubbing: 0,
      pillResistance: 0,
      technician: "",
      notes: "",
    },
  });

  const onSubmit = async (data: FabricTestFormValues) => {
    setIsSubmitting(true);
    try {
      // Burada API çağrısı yapılacak
      console.log("Form data:", data);
      
      // API çağrısı simülasyonu
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: "Test kaydı oluşturuldu",
        description: "Kumaş test kaydı başarıyla oluşturuldu.",
      });
      
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Test kaydı oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kumaş Laboratuvar Testleri</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Microscope className="mr-2 h-4 w-4" />
              Yeni Test Kaydı
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Yeni Kumaş Test Kaydı</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="fabricType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kumaş Tipi</FormLabel>
                        <FormControl>
                          <Input placeholder="Pamuklu, Polyester, vb." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weavePattern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dokuma Deseni</FormLabel>
                        <FormControl>
                          <Input placeholder="Bezayağı, Dimi, Saten, vb." {...field} />
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
                        <FormLabel>Sipariş No</FormLabel>
                        <FormControl>
                          <Input placeholder="SIP-2023-XXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Müşteri</FormLabel>
                        <FormControl>
                          <Input placeholder="Müşteri adı" {...field} />
                        </FormControl>
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
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gramaj (g/m²)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Mukavemet Testleri</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tensileStrengthWarp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kopma Mukavemeti - Çözgü (N)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tensileStrengthWeft"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kopma Mukavemeti - Atkı (N)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tearStrengthWarp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Yırtılma Mukavemeti - Çözgü (N)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tearStrengthWeft"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Yırtılma Mukavemeti - Atkı (N)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Boyut Sabitliği ve Haslık</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="shrinkageWarp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Çekme - Çözgü (%)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="shrinkageWeft"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Çekme - Atkı (%)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="colorFastnessWashing"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Yıkama Haslığı (1-5)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" max="5" step="0.5" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="colorFastnessLight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Işık Haslığı (1-5)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" max="5" step="0.5" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="colorFastnessRubbing"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sürtünme Haslığı (1-5)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" max="5" step="0.5" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="pillResistance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pilling Direnci (1-5)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" max="5" step="0.5" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="technician"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teknisyen</FormLabel>
                        <FormControl>
                          <Input placeholder="Teknisyen adı" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notlar</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Test sonuçları ile ilgili notlar..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Kaydet
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tests" className="flex items-center">
            <Microscope className="mr-2 h-4 w-4" />
            Test Kayıtları
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <BarChart className="mr-2 h-4 w-4" />
            Analitik
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle>Kumaş Test Kayıtları</CardTitle>
              <CardDescription>
                Tüm kumaş test kayıtlarının listesi. Toplam {filteredData.length} test kaydı bulundu.
              </CardDescription>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Test no, kumaş tipi, sipariş no veya müşteri ile ara..."
                      className="pl-8"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-[180px]">
                  <Select
                    value={filterValue}
                    onValueChange={setFilterValue}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Durum Filtresi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Sonuçlar</SelectItem>
                      <SelectItem value="Geçti">Geçti</SelectItem>
                      <SelectItem value="Kaldı">Kaldı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={filteredData} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="mr-2 h-5 w-5 text-blue-600" />
                  Kumaş Türüne Göre Test Sonuçları
                </CardTitle>
                <CardDescription>
                  Kumaş türlerine göre geçen/kalan test sonuçları
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart
                      data={testResultsData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="geçti" name="Geçti" fill="#10b981" />
                      <Bar dataKey="kaldı" name="Kaldı" fill="#ef4444" />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="mr-2 h-5 w-5 text-blue-600" />
                  Kalite Dağılımı
                </CardTitle>
                <CardDescription>
                  Geçen testlerin kalite sınıflandırması
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "A Sınıfı", value: 65 },
                          { name: "B Sınıfı", value: 25 },
                          { name: "C Sınıfı", value: 10 }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: "A Sınıfı", value: 65 },
                          { name: "B Sınıfı", value: 25 },
                          { name: "C Sınıfı", value: 10 }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, ""]} />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        layout="horizontal"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Microscope className="mr-2 h-5 w-5 text-blue-600" />
                  Kalite Sınıflarının Karşılaştırması
                </CardTitle>
                <CardDescription>
                  A, B ve C kalite sınıflarının özellikler bazında karşılaştırması
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={150} width={730} height={350} data={qualityRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="property" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="A Sınıfı"
                        dataKey="A"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.5}
                      />
                      <Radar
                        name="B Sınıfı"
                        dataKey="B"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.5}
                      />
                      <Radar
                        name="C Sınıfı"
                        dataKey="C"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.5}
                      />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FabricTests;