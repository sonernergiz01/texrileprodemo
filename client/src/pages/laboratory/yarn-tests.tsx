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
import { Beaker, CheckCircle2, Loader2, MoveRight, AlertTriangle, BarChart, Search, FileText } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart as ReBarChart, Bar } from "recharts";

// Sahte veri, gerçek uygulamada API'den gelecektir
const dummyYarnTests = [
  {
    id: 1,
    testNumber: "YTR-2023-001",
    yarnType: "Pamuk",
    yarnCount: "20/1",
    supplierName: "İplik Üreticisi A.Ş.",
    testDate: new Date("2025-05-03"),
    strength: 18.5,
    elongation: 7.2,
    irregularity: 11.2,
    thinPlaces: 15,
    thickPlaces: 22,
    neps: 32,
    hairiness: 5.8,
    result: "Geçti",
    technician: "Ahmet Yılmaz",
    notes: "Standartları karşılıyor.",
  },
  {
    id: 2,
    testNumber: "YTR-2023-002",
    yarnType: "Polyester",
    yarnCount: "30/1",
    supplierName: "İplik San. Ltd.",
    testDate: new Date("2025-05-04"),
    strength: 22.1,
    elongation: 12.5,
    irregularity: 9.8,
    thinPlaces: 12,
    thickPlaces: 18,
    neps: 25,
    hairiness: 4.2,
    result: "Geçti",
    technician: "Mehmet Kaya",
    notes: "Yüksek mukavemet değerleri.",
  },
  {
    id: 3,
    testNumber: "YTR-2023-003",
    yarnType: "Pamuk/Polyester",
    yarnCount: "24/1",
    supplierName: "İplik Tekstil A.Ş.",
    testDate: new Date("2025-05-05"),
    strength: 16.2,
    elongation: 8.5,
    irregularity: 13.6,
    thinPlaces: 25,
    thickPlaces: 35,
    neps: 45,
    hairiness: 6.5,
    result: "Kaldı",
    technician: "Ali Demir",
    notes: "Düzgünsüzlük ve neps değerleri standartların üstünde.",
  },
];

// İplik test analitik verileri
const monthlyTestData = [
  { name: "Ocak", geçti: 32, kaldı: 8 },
  { name: "Şubat", geçti: 28, kaldı: 6 },
  { name: "Mart", geçti: 30, kaldı: 5 },
  { name: "Nisan", geçti: 35, kaldı: 7 },
  { name: "Mayıs", geçti: 40, kaldı: 6 },
];

const supplierPerformanceData = [
  { name: "İplik Üreticisi A.Ş.", oran: 92 },
  { name: "İplik San. Ltd.", oran: 88 },
  { name: "İplik Tekstil A.Ş.", oran: 75 },
  { name: "Global İplik", oran: 94 },
  { name: "İplik Tic. Ltd.", oran: 85 },
];

// İplik testi formu için Zod şeması
const yarnTestFormSchema = z.object({
  yarnType: z.string().min(1, "İplik tipi gereklidir"),
  yarnCount: z.string().min(1, "İplik numarası gereklidir"),
  supplierName: z.string().min(1, "Tedarikçi gereklidir"),
  strength: z.coerce.number().min(0, "Mukavemet değeri gereklidir"),
  elongation: z.coerce.number().min(0, "Uzama değeri gereklidir"),
  irregularity: z.coerce.number().min(0, "Düzgünsüzlük değeri gereklidir"),
  thinPlaces: z.coerce.number().min(0, "İnce yer değeri gereklidir"),
  thickPlaces: z.coerce.number().min(0, "Kalın yer değeri gereklidir"),
  neps: z.coerce.number().min(0, "Neps değeri gereklidir"),
  hairiness: z.coerce.number().min(0, "Tüylülük değeri gereklidir"),
  technician: z.string().min(1, "Teknisyen gereklidir"),
  notes: z.string().optional(),
});

type YarnTestFormValues = z.infer<typeof yarnTestFormSchema>;

// Kolon tanımları
const columns: ColumnDef<typeof dummyYarnTests[0]>[] = [
  {
    accessorKey: "testNumber",
    header: "Test No",
  },
  {
    accessorKey: "yarnType",
    header: "İplik Tipi",
  },
  {
    accessorKey: "yarnCount",
    header: "İplik No",
  },
  {
    accessorKey: "supplierName",
    header: "Tedarikçi",
  },
  {
    accessorKey: "testDate",
    header: "Test Tarihi",
    cell: ({ row }) => format(row.original.testDate, "dd MMMM yyyy", { locale: tr }),
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-blue-600" />
              İplik Test Detayları - {row.original.testNumber}
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
                  <span className="text-sm font-medium">İplik Tipi:</span>
                  <span className="text-sm">{row.original.yarnType}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">İplik No:</span>
                  <span className="text-sm">{row.original.yarnCount}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Tedarikçi:</span>
                  <span className="text-sm">{row.original.supplierName}</span>
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
              <h3 className="font-semibold text-sm text-muted-foreground">Mekanik Özellikler</h3>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Mukavemet:</span>
                  <span className="text-sm">{row.original.strength} cN/tex</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Uzama:</span>
                  <span className="text-sm">{row.original.elongation} %</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Düzgünsüzlük:</span>
                  <span className="text-sm">{row.original.irregularity} %</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Tüylülük:</span>
                  <span className="text-sm">{row.original.hairiness}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Düzgünsüzlük</h3>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">İnce Yerler:</span>
                  <span className="text-sm">{row.original.thinPlaces} adet/km</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Kalın Yerler:</span>
                  <span className="text-sm">{row.original.thickPlaces} adet/km</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Neps:</span>
                  <span className="text-sm">{row.original.neps} adet/km</span>
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
              Üretim Onayı
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    ),
  },
];

const YarnTests: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [filterValue, setFilterValue] = useState("all");

  // Filtreleme işlemi
  const filteredData = dummyYarnTests.filter(test => {
    const matchesSearch = 
      searchValue === "" || 
      test.testNumber.toLowerCase().includes(searchValue.toLowerCase()) ||
      test.yarnType.toLowerCase().includes(searchValue.toLowerCase()) ||
      test.supplierName.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchesFilter = 
      filterValue === "all" || 
      test.result === filterValue;
    
    return matchesSearch && matchesFilter;
  });

  // Form 
  const form = useForm<YarnTestFormValues>({
    resolver: zodResolver(yarnTestFormSchema),
    defaultValues: {
      yarnType: "",
      yarnCount: "",
      supplierName: "",
      strength: 0,
      elongation: 0,
      irregularity: 0,
      thinPlaces: 0,
      thickPlaces: 0,
      neps: 0,
      hairiness: 0,
      technician: "",
      notes: "",
    },
  });

  const onSubmit = async (data: YarnTestFormValues) => {
    setIsSubmitting(true);
    try {
      // Burada API çağrısı yapılacak
      console.log("Form data:", data);
      
      // API çağrısı simülasyonu
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: "Test kaydı oluşturuldu",
        description: "İplik test kaydı başarıyla oluşturuldu.",
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
        <h1 className="text-2xl font-bold">İplik Laboratuvar Testleri</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Beaker className="mr-2 h-4 w-4" />
              Yeni Test Kaydı
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Yeni İplik Test Kaydı</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="yarnType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İplik Tipi</FormLabel>
                        <FormControl>
                          <Input placeholder="Pamuk, Polyester, vb." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="yarnCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İplik Numarası</FormLabel>
                        <FormControl>
                          <Input placeholder="20/1, 30/1, vb." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="supplierName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tedarikçi</FormLabel>
                        <FormControl>
                          <Input placeholder="Tedarikçi adı" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Mekanik Özellikler</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="strength"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mukavemet (cN/tex)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="elongation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Uzama (%)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="irregularity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Düzgünsüzlük (%)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="hairiness"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tüylülük</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Hata Analizi</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="thinPlaces"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>İnce Yerler (adet/km)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="thickPlaces"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kalın Yerler (adet/km)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="neps"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Neps (adet/km)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                    </div>
                  </div>
                </div>

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
            <Beaker className="mr-2 h-4 w-4" />
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
              <CardTitle>İplik Test Kayıtları</CardTitle>
              <CardDescription>
                Tüm iplik test kayıtlarının listesi. Toplam {filteredData.length} test kaydı bulundu.
              </CardDescription>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Test no, iplik tipi veya tedarikçi ile ara..."
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
                  Aylık Test Sonuçları
                </CardTitle>
                <CardDescription>
                  Son 5 aydaki test sonuçlarının dağılımı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart
                      data={monthlyTestData}
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
                  Tedarikçi Performansı
                </CardTitle>
                <CardDescription>
                  Tedarikçilerin test geçme oranları (%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={supplierPerformanceData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, ""]} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="oran" 
                        name="Geçme Oranı (%)" 
                        stroke="#10b981" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
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

export default YarnTests;