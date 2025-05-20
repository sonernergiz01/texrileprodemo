import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Loader2, 
  Search, 
  Plus, 
  Edit, 
  Eye,
  FileText,
  Calendar,
  Download,
  Upload,
  Trash2,
  Filter,
  ChevronDown,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart,
  CheckSquare,
  CircleSlash,
  ClipboardList,
  FileBarChart,
  FileCheck,
  ImagePlus,
  Printer,
  CalendarDays
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

// Kalite kontrol şeması
const qualityInspectionSchema = z.object({
  inspectionId: z.string().min(1, "Kontrol ID gereklidir"),
  orderId: z.number().min(1, "Sipariş seçilmelidir"),
  productType: z.string().min(1, "Ürün tipi gereklidir"),
  batchNumber: z.string().min(1, "Parti numarası gereklidir"),
  inspectionDate: z.string().min(1, "Kontrol tarihi gereklidir"),
  inspector: z.string().min(1, "Kontrol eden kişi gereklidir"),
  inspectionType: z.enum(["Final Kontrol", "İç Kontrol", "Sevkiyat Öncesi Kontrol", "Müşteri Şikayeti"]),
  sampleSize: z.string().min(1, "Örnek boyutu gereklidir"),
  aqlLevel: z.string().min(1, "AQL seviyesi gereklidir"),
  status: z.enum(["Onaylandı", "Şartlı Onaylandı", "Reddedildi", "Beklemede"]).default("Beklemede"),
  majorDefects: z.array(z.object({
    defectName: z.string(),
    count: z.number(),
    description: z.string().optional()
  })).optional(),
  minorDefects: z.array(z.object({
    defectName: z.string(),
    count: z.number(),
    description: z.string().optional()
  })).optional(),
  criticalDefects: z.array(z.object({
    defectName: z.string(),
    count: z.number(),
    description: z.string().optional()
  })).optional(),
  remarks: z.string().optional(),
  recommendations: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
});

const FinalInspectionPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [majorDefects, setMajorDefects] = useState<any[]>([{ defectName: "", count: 0, description: "" }]);
  const [minorDefects, setMinorDefects] = useState<any[]>([{ defectName: "", count: 0, description: "" }]);
  const [criticalDefects, setCriticalDefects] = useState<any[]>([{ defectName: "", count: 0, description: "" }]);

  // Form tanımlama
  const form = useForm<z.infer<typeof qualityInspectionSchema>>({
    resolver: zodResolver(qualityInspectionSchema),
    defaultValues: {
      inspectionId: "",
      orderId: undefined,
      productType: "",
      batchNumber: "",
      inspectionDate: new Date().toISOString().split('T')[0],
      inspector: "",
      inspectionType: "Final Kontrol",
      sampleSize: "",
      aqlLevel: "2.5",
      status: "Beklemede",
      majorDefects: [],
      minorDefects: [],
      criticalDefects: [],
      remarks: "",
      recommendations: "",
      imageUrls: [],
    },
  });

  // Düzenleme formu
  const editForm = useForm<z.infer<typeof qualityInspectionSchema>>({
    resolver: zodResolver(qualityInspectionSchema),
    defaultValues: {
      inspectionId: "",
      orderId: undefined,
      productType: "",
      batchNumber: "",
      inspectionDate: "",
      inspector: "",
      inspectionType: "Final Kontrol",
      sampleSize: "",
      aqlLevel: "",
      status: "Beklemede",
      majorDefects: [],
      minorDefects: [],
      criticalDefects: [],
      remarks: "",
      recommendations: "",
      imageUrls: [],
    },
  });

  // Kalite kontrolleri verisini çek
  const { data: qualityInspections = [], isLoading: isLoadingInspections } = useQuery({
    queryKey: ["/api/quality-control/inspections"],
  });

  // Sipariş verisini çek
  const { data: orders = [] } = useQuery({
    queryKey: ["/api/sales/orders"],
  });

  // Hata türleri verisini çek
  const { data: defectTypes = [] } = useQuery({
    queryKey: ["/api/quality-control/defect-types"],
  });

  // Kalite kontrolcüleri verisini çek
  const { data: inspectors = [] } = useQuery({
    queryKey: ["/api/quality-control/inspectors"],
  });

  // Yeni kalite kontrol kaydı oluştur
  const createInspectionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof qualityInspectionSchema>) => {
      const res = await apiRequest("POST", "/api/quality-control/inspections", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Kalite kontrol kaydı başarıyla oluşturuldu",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/quality-control/inspections"] });
      form.reset();
      setMajorDefects([{ defectName: "", count: 0, description: "" }]);
      setMinorDefects([{ defectName: "", count: 0, description: "" }]);
      setCriticalDefects([{ defectName: "", count: 0, description: "" }]);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Kalite kontrol kaydı oluşturulurken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Kalite kontrol kaydını güncelle
  const updateInspectionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/quality-control/inspections/${selectedInspection.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Kalite kontrol kaydı başarıyla güncellendi",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/quality-control/inspections"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Kalite kontrol kaydı güncellenirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Kalite kontrol kaydını sil
  const deleteInspectionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/quality-control/inspections/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Kalite kontrol kaydı başarıyla silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quality-control/inspections"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Kalite kontrol kaydı silinirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Form gönderme
  const onSubmit = (data: z.infer<typeof qualityInspectionSchema>) => {
    // Hata verilerini ekle
    const formData = {
      ...data,
      majorDefects: majorDefects.filter(defect => defect.defectName && defect.count > 0),
      minorDefects: minorDefects.filter(defect => defect.defectName && defect.count > 0),
      criticalDefects: criticalDefects.filter(defect => defect.defectName && defect.count > 0),
    };
    createInspectionMutation.mutate(formData);
  };

  // Form güncelleme
  const onEditSubmit = (data: z.infer<typeof qualityInspectionSchema>) => {
    updateInspectionMutation.mutate(data);
  };

  // Kalite kontrolünü görüntüleme
  const handleViewInspection = (inspection: any) => {
    setSelectedInspection(inspection);
    setIsViewDialogOpen(true);
  };

  // Kalite kontrolünü düzenleme
  const handleEditInspection = (inspection: any) => {
    setSelectedInspection(inspection);
    editForm.reset({
      inspectionId: inspection.inspectionId,
      orderId: inspection.orderId,
      productType: inspection.productType,
      batchNumber: inspection.batchNumber,
      inspectionDate: inspection.inspectionDate,
      inspector: inspection.inspector,
      inspectionType: inspection.inspectionType,
      sampleSize: inspection.sampleSize,
      aqlLevel: inspection.aqlLevel,
      status: inspection.status,
      majorDefects: inspection.majorDefects || [],
      minorDefects: inspection.minorDefects || [],
      criticalDefects: inspection.criticalDefects || [],
      remarks: inspection.remarks || "",
      recommendations: inspection.recommendations || "",
      imageUrls: inspection.imageUrls || [],
    });
    setMajorDefects(inspection.majorDefects || [{ defectName: "", count: 0, description: "" }]);
    setMinorDefects(inspection.minorDefects || [{ defectName: "", count: 0, description: "" }]);
    setCriticalDefects(inspection.criticalDefects || [{ defectName: "", count: 0, description: "" }]);
    setIsEditDialogOpen(true);
  };

  // Kalite kontrolünü silme
  const handleDeleteInspection = (inspection: any) => {
    if (window.confirm("Bu kalite kontrol kaydını silmek istediğinizden emin misiniz?")) {
      deleteInspectionMutation.mutate(inspection.id);
    }
  };

  // Major hata ekleme
  const addMajorDefect = () => {
    setMajorDefects([...majorDefects, { defectName: "", count: 0, description: "" }]);
  };

  // Minor hata ekleme
  const addMinorDefect = () => {
    setMinorDefects([...minorDefects, { defectName: "", count: 0, description: "" }]);
  };

  // Kritik hata ekleme
  const addCriticalDefect = () => {
    setCriticalDefects([...criticalDefects, { defectName: "", count: 0, description: "" }]);
  };

  // Major hata silme
  const removeMajorDefect = (index: number) => {
    setMajorDefects(majorDefects.filter((_, i) => i !== index));
  };

  // Minor hata silme
  const removeMinorDefect = (index: number) => {
    setMinorDefects(minorDefects.filter((_, i) => i !== index));
  };

  // Kritik hata silme
  const removeCriticalDefect = (index: number) => {
    setCriticalDefects(criticalDefects.filter((_, i) => i !== index));
  };

  // Major hata güncelleme
  const updateMajorDefect = (index: number, field: string, value: any) => {
    const updatedDefects = [...majorDefects];
    updatedDefects[index] = { ...updatedDefects[index], [field]: value };
    setMajorDefects(updatedDefects);
  };

  // Minor hata güncelleme
  const updateMinorDefect = (index: number, field: string, value: any) => {
    const updatedDefects = [...minorDefects];
    updatedDefects[index] = { ...updatedDefects[index], [field]: value };
    setMinorDefects(updatedDefects);
  };

  // Kritik hata güncelleme
  const updateCriticalDefect = (index: number, field: string, value: any) => {
    const updatedDefects = [...criticalDefects];
    updatedDefects[index] = { ...updatedDefects[index], [field]: value };
    setCriticalDefects(updatedDefects);
  };

  // Filtreleme
  const getFilteredInspections = () => {
    let filtered = qualityInspections;
    
    // Arama terimine göre filtrele
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((inspection: any) => 
        inspection.inspectionId?.toLowerCase().includes(searchLower) ||
        inspection.productType?.toLowerCase().includes(searchLower) ||
        inspection.batchNumber?.toLowerCase().includes(searchLower) ||
        inspection.inspector?.toLowerCase().includes(searchLower)
      );
    }
    
    // Duruma göre filtrele
    if (statusFilter) {
      filtered = filtered.filter((inspection: any) => inspection.status === statusFilter);
    }
    
    // Siparişe göre filtrele
    if (selectedOrder) {
      filtered = filtered.filter((inspection: any) => inspection.orderId === parseInt(selectedOrder));
    }
    
    return filtered;
  };

  // Sipariş numarasını al
  const getOrderNumber = (orderId: number) => {
    const order = orders.find((o: any) => o.id === orderId);
    return order ? order.orderNumber : "-";
  };

  // Durum rozeti renkleri
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Onaylandı":
        return "success";
      case "Şartlı Onaylandı":
        return "warning";
      case "Reddedildi":
        return "destructive";
      case "Beklemede":
        return "outline";
      default:
        return "outline";
    }
  };

  // Durum ikonu
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Onaylandı":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "Şartlı Onaylandı":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "Reddedildi":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "Beklemede":
        return <CalendarDays className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  // Hataları toplam sayısını hesapla
  const calculateTotalDefects = (inspection: any) => {
    let total = 0;
    
    if (inspection.majorDefects) {
      total += inspection.majorDefects.reduce((sum: number, defect: any) => sum + defect.count, 0);
    }
    
    if (inspection.minorDefects) {
      total += inspection.minorDefects.reduce((sum: number, defect: any) => sum + defect.count, 0);
    }
    
    if (inspection.criticalDefects) {
      total += inspection.criticalDefects.reduce((sum: number, defect: any) => sum + defect.count, 0);
    }
    
    return total;
  };

  // Yükleme durumu
  if (isLoadingInspections) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filtrelenmiş kalite kontrolleri
  const filteredInspections = getFilteredInspections();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Final Kalite Kontrol" 
        description="Ürün kalite kontrol sonuçlarını izleyin ve yönetin"
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={statusFilter === null ? "default" : "outline"} 
            onClick={() => setStatusFilter(null)}
          >
            Tümü
          </Button>
          <Button 
            variant={statusFilter === "Onaylandı" ? "default" : "outline"}
            onClick={() => setStatusFilter("Onaylandı")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle2 className="mr-1 h-4 w-4" /> Onaylandı
          </Button>
          <Button 
            variant={statusFilter === "Şartlı Onaylandı" ? "default" : "outline"}
            onClick={() => setStatusFilter("Şartlı Onaylandı")}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <AlertTriangle className="mr-1 h-4 w-4" /> Şartlı
          </Button>
          <Button 
            variant={statusFilter === "Reddedildi" ? "default" : "outline"}
            onClick={() => setStatusFilter("Reddedildi")}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <XCircle className="mr-1 h-4 w-4" /> Reddedildi
          </Button>
          <Button 
            variant={statusFilter === "Beklemede" ? "default" : "outline"}
            onClick={() => setStatusFilter("Beklemede")}
          >
            <CalendarDays className="mr-1 h-4 w-4" /> Beklemede
          </Button>
        </div>
          
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Kontrol ID, Parti No, Ürün..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Sipariş
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Sipariş Filtresi</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSelectedOrder(null)}>
                Tüm Siparişler
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {orders.map((order: any) => (
                <DropdownMenuItem 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order.id.toString())}
                >
                  {order.orderNumber}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Yeni Kontrol
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Kalite Kontrol Sonuçları</CardTitle>
          <CardDescription>
            Tamamlanan ve bekleyen kalite kontrol işlemleri
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInspections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter || selectedOrder ? 
                "Arama kriterlerine uygun kalite kontrol kaydı bulunamadı." : 
                "Henüz kalite kontrol kaydı bulunmamaktadır. Yeni bir kontrol eklemek için 'Yeni Kontrol' butonunu kullanın."
              }
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kontrol ID</TableHead>
                  <TableHead>Sipariş No</TableHead>
                  <TableHead>Parti No</TableHead>
                  <TableHead>Ürün Tipi</TableHead>
                  <TableHead>Kontrol Tarihi</TableHead>
                  <TableHead>Kontrolcü</TableHead>
                  <TableHead>Hata Sayısı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInspections.map((inspection: any) => (
                  <TableRow key={inspection.id}>
                    <TableCell className="font-medium">{inspection.inspectionId}</TableCell>
                    <TableCell>{getOrderNumber(inspection.orderId)}</TableCell>
                    <TableCell>{inspection.batchNumber}</TableCell>
                    <TableCell>{inspection.productType}</TableCell>
                    <TableCell>{inspection.inspectionDate}</TableCell>
                    <TableCell>{inspection.inspector}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {inspection.criticalDefects && inspection.criticalDefects.length > 0 && (
                          <Badge variant="destructive" className="text-[10px]">
                            K: {inspection.criticalDefects.reduce((sum: number, defect: any) => sum + defect.count, 0)}
                          </Badge>
                        )}
                        {inspection.majorDefects && inspection.majorDefects.length > 0 && (
                          <Badge variant="default" className="text-[10px] bg-amber-600">
                            M: {inspection.majorDefects.reduce((sum: number, defect: any) => sum + defect.count, 0)}
                          </Badge>
                        )}
                        {inspection.minorDefects && inspection.minorDefects.length > 0 && (
                          <Badge variant="outline" className="text-[10px]">
                            m: {inspection.minorDefects.reduce((sum: number, defect: any) => sum + defect.count, 0)}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getStatusIcon(inspection.status)}
                        <Badge 
                          variant={getStatusBadgeVariant(inspection.status)} 
                          className="ml-1"
                        >
                          {inspection.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Menüyü aç</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewInspection(inspection)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Görüntüle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditInspection(inspection)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {}}>
                            <FileCheck className="h-4 w-4 mr-2" />
                            Onay Formu
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {}}>
                            <FileBarChart className="h-4 w-4 mr-2" />
                            Rapor Oluştur
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {}}>
                            <Printer className="h-4 w-4 mr-2" />
                            Yazdır
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteInspection(inspection)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Yeni Kalite Kontrol Modalı */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Kalite Kontrol</DialogTitle>
            <DialogDescription>
              Yeni bir final kalite kontrol kaydı oluşturun.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Temel Bilgiler</TabsTrigger>
              <TabsTrigger value="defects">Hatalar</TabsTrigger>
              <TabsTrigger value="notes">Notlar ve Ekler</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="inspectionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kontrol ID*</FormLabel>
                          <FormControl>
                            <Input placeholder="ör: QC-2025-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="inspectionDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kontrol Tarihi*</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="orderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sipariş*</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sipariş seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {orders.map((order: any) => (
                                <SelectItem key={order.id} value={order.id.toString()}>
                                  {order.orderNumber}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="batchNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parti Numarası*</FormLabel>
                          <FormControl>
                            <Input placeholder="ör: BATCH-2025-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="productType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ürün Tipi*</FormLabel>
                          <FormControl>
                            <Input placeholder="ör: Dokuma Kumaş" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="inspector"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kontrolcü*</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Kontrolcü seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {inspectors && inspectors.length > 0 ? (
                                inspectors.map((inspector: any) => (
                                  <SelectItem key={inspector.id} value={inspector.name}>
                                    {inspector.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <>
                                  <SelectItem value="Ahmet Yılmaz">Ahmet Yılmaz</SelectItem>
                                  <SelectItem value="Ayşe Kaya">Ayşe Kaya</SelectItem>
                                  <SelectItem value="Mehmet Demir">Mehmet Demir</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="inspectionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kontrol Tipi*</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Kontrol tipi seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Final Kontrol">Final Kontrol</SelectItem>
                              <SelectItem value="İç Kontrol">İç Kontrol</SelectItem>
                              <SelectItem value="Sevkiyat Öncesi Kontrol">Sevkiyat Öncesi Kontrol</SelectItem>
                              <SelectItem value="Müşteri Şikayeti">Müşteri Şikayeti</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Durum*</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Durum seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Beklemede">Beklemede</SelectItem>
                              <SelectItem value="Onaylandı">Onaylandı</SelectItem>
                              <SelectItem value="Şartlı Onaylandı">Şartlı Onaylandı</SelectItem>
                              <SelectItem value="Reddedildi">Reddedildi</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sampleSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Örnek Boyutu*</FormLabel>
                          <FormControl>
                            <Input placeholder="ör: 100 metre, 50 adet" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="aqlLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>AQL Seviyesi*</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="AQL seviyesi seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1.0">1.0</SelectItem>
                              <SelectItem value="1.5">1.5</SelectItem>
                              <SelectItem value="2.5">2.5</SelectItem>
                              <SelectItem value="4.0">4.0</SelectItem>
                              <SelectItem value="6.5">6.5</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="defects" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center text-red-700">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Kritik Hatalar
                      </h3>
                      {criticalDefects.map((defect, index) => (
                        <div key={index} className="flex items-start space-x-2 mb-2">
                          <div className="grid grid-cols-10 gap-2 flex-1">
                            <Input
                              className="col-span-5"
                              placeholder="Hata adı"
                              value={defect.defectName}
                              onChange={(e) => updateCriticalDefect(index, 'defectName', e.target.value)}
                            />
                            <Input
                              className="col-span-2"
                              type="number"
                              min="0"
                              placeholder="Adet"
                              value={defect.count}
                              onChange={(e) => updateCriticalDefect(index, 'count', parseInt(e.target.value))}
                            />
                            <Input
                              className="col-span-3"
                              placeholder="Açıklama"
                              value={defect.description}
                              onChange={(e) => updateCriticalDefect(index, 'description', e.target.value)}
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            onClick={() => removeCriticalDefect(index)}
                            className="h-9 w-9"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCriticalDefect}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Kritik Hata Ekle
                      </Button>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center text-amber-700">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Major Hatalar
                      </h3>
                      {majorDefects.map((defect, index) => (
                        <div key={index} className="flex items-start space-x-2 mb-2">
                          <div className="grid grid-cols-10 gap-2 flex-1">
                            <Input
                              className="col-span-5"
                              placeholder="Hata adı"
                              value={defect.defectName}
                              onChange={(e) => updateMajorDefect(index, 'defectName', e.target.value)}
                            />
                            <Input
                              className="col-span-2"
                              type="number"
                              min="0"
                              placeholder="Adet"
                              value={defect.count}
                              onChange={(e) => updateMajorDefect(index, 'count', parseInt(e.target.value))}
                            />
                            <Input
                              className="col-span-3"
                              placeholder="Açıklama"
                              value={defect.description}
                              onChange={(e) => updateMajorDefect(index, 'description', e.target.value)}
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            onClick={() => removeMajorDefect(index)}
                            className="h-9 w-9"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addMajorDefect}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Major Hata Ekle
                      </Button>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center text-gray-700">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Minor Hatalar
                      </h3>
                      {minorDefects.map((defect, index) => (
                        <div key={index} className="flex items-start space-x-2 mb-2">
                          <div className="grid grid-cols-10 gap-2 flex-1">
                            <Input
                              className="col-span-5"
                              placeholder="Hata adı"
                              value={defect.defectName}
                              onChange={(e) => updateMinorDefect(index, 'defectName', e.target.value)}
                            />
                            <Input
                              className="col-span-2"
                              type="number"
                              min="0"
                              placeholder="Adet"
                              value={defect.count}
                              onChange={(e) => updateMinorDefect(index, 'count', parseInt(e.target.value))}
                            />
                            <Input
                              className="col-span-3"
                              placeholder="Açıklama"
                              value={defect.description}
                              onChange={(e) => updateMinorDefect(index, 'description', e.target.value)}
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            onClick={() => removeMinorDefect(index)}
                            className="h-9 w-9"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addMinorDefect}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Minor Hata Ekle
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="notes" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notlar</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Kontrol ile ilgili genel notlar ve açıklamalar..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="recommendations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Öneriler</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tespit edilen sorunlarla ilgili öneriler..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="imageUrls"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Görsel URL'leri</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Her satıra bir görsel URL'si girin..."
                            className="resize-none"
                            value={(field.value || []).join('\n')}
                            onChange={(e) => field.onChange(e.target.value.split('\n').filter(url => url.trim()))}
                          />
                        </FormControl>
                        <FormDescription>
                          Her satıra bir URL olacak şekilde görsel bağlantılarını girin
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-center">
                    <Button 
                      type="button" 
                      variant="outline"
                      className="w-full"
                    >
                      <ImagePlus className="mr-2 h-4 w-4" />
                      Görsel Yükle (İsteğe Bağlı)
                    </Button>
                  </div>
                </TabsContent>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createInspectionMutation.isPending}
                  >
                    {createInspectionMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Oluştur
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Kalite Kontrol Görüntüleme Modalı */}
      {selectedInspection && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Kalite Kontrol Detayları</DialogTitle>
              <DialogDescription>
                {selectedInspection.inspectionId} kodlu kontrol kaydı
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">{selectedInspection.inspectionId}</h3>
                  <p className="text-sm text-muted-foreground">
                    Sipariş: {getOrderNumber(selectedInspection.orderId)} | Parti: {selectedInspection.batchNumber}
                  </p>
                </div>
                <Badge variant={getStatusBadgeVariant(selectedInspection.status)}>
                  {selectedInspection.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Temel Bilgiler</h4>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2">
                        <span className="text-muted-foreground">Ürün Tipi:</span>
                        <span className="font-medium">{selectedInspection.productType}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-muted-foreground">Kontrolcü:</span>
                        <span className="font-medium">{selectedInspection.inspector}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-muted-foreground">Kontrol Tarihi:</span>
                        <span className="font-medium">{selectedInspection.inspectionDate}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-muted-foreground">Kontrol Tipi:</span>
                        <span className="font-medium">{selectedInspection.inspectionType}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Örnekleme Bilgileri</h4>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2">
                        <span className="text-muted-foreground">Örnek Boyutu:</span>
                        <span className="font-medium">{selectedInspection.sampleSize}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-muted-foreground">AQL Seviyesi:</span>
                        <span className="font-medium">{selectedInspection.aqlLevel}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Hata Özeti</h4>
                    <div className="space-y-2 text-sm">
                      {selectedInspection.criticalDefects && selectedInspection.criticalDefects.length > 0 && (
                        <div className="grid grid-cols-2">
                          <span className="text-red-600">Kritik Hatalar:</span>
                          <span className="font-medium text-red-600">
                            {selectedInspection.criticalDefects.reduce((sum: number, defect: any) => sum + defect.count, 0)} adet
                          </span>
                        </div>
                      )}
                      {selectedInspection.majorDefects && selectedInspection.majorDefects.length > 0 && (
                        <div className="grid grid-cols-2">
                          <span className="text-amber-600">Major Hatalar:</span>
                          <span className="font-medium text-amber-600">
                            {selectedInspection.majorDefects.reduce((sum: number, defect: any) => sum + defect.count, 0)} adet
                          </span>
                        </div>
                      )}
                      {selectedInspection.minorDefects && selectedInspection.minorDefects.length > 0 && (
                        <div className="grid grid-cols-2">
                          <span className="text-gray-600">Minor Hatalar:</span>
                          <span className="font-medium text-gray-600">
                            {selectedInspection.minorDefects.reduce((sum: number, defect: any) => sum + defect.count, 0)} adet
                          </span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 pt-1 border-t">
                        <span className="text-muted-foreground font-medium">Toplam:</span>
                        <span className="font-bold">
                          {calculateTotalDefects(selectedInspection)} adet
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {(selectedInspection.remarks || selectedInspection.recommendations) && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Notlar</h4>
                      {selectedInspection.remarks && (
                        <div className="space-y-1 text-sm mb-2">
                          <span className="text-muted-foreground">Genel Notlar:</span>
                          <p className="text-sm">{selectedInspection.remarks}</p>
                        </div>
                      )}
                      {selectedInspection.recommendations && (
                        <div className="space-y-1 text-sm">
                          <span className="text-muted-foreground">Öneriler:</span>
                          <p className="text-sm">{selectedInspection.recommendations}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <Accordion type="single" collapsible>
                {selectedInspection.criticalDefects && selectedInspection.criticalDefects.length > 0 && (
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-red-600 font-medium">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Kritik Hatalar ({selectedInspection.criticalDefects.length})
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {selectedInspection.criticalDefects.map((defect: any, index: number) => (
                          <div key={index} className="grid grid-cols-4 gap-2 text-sm">
                            <span className="font-medium">{defect.defectName}</span>
                            <span className="text-center">{defect.count} adet</span>
                            <span className="col-span-2 text-muted-foreground">{defect.description || "-"}</span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                
                {selectedInspection.majorDefects && selectedInspection.majorDefects.length > 0 && (
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-amber-600 font-medium">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Major Hatalar ({selectedInspection.majorDefects.length})
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {selectedInspection.majorDefects.map((defect: any, index: number) => (
                          <div key={index} className="grid grid-cols-4 gap-2 text-sm">
                            <span className="font-medium">{defect.defectName}</span>
                            <span className="text-center">{defect.count} adet</span>
                            <span className="col-span-2 text-muted-foreground">{defect.description || "-"}</span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                
                {selectedInspection.minorDefects && selectedInspection.minorDefects.length > 0 && (
                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-gray-600 font-medium">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Minor Hatalar ({selectedInspection.minorDefects.length})
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {selectedInspection.minorDefects.map((defect: any, index: number) => (
                          <div key={index} className="grid grid-cols-4 gap-2 text-sm">
                            <span className="font-medium">{defect.defectName}</span>
                            <span className="text-center">{defect.count} adet</span>
                            <span className="col-span-2 text-muted-foreground">{defect.description || "-"}</span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                
                {selectedInspection.imageUrls && selectedInspection.imageUrls.length > 0 && (
                  <AccordionItem value="item-4">
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <ImagePlus className="h-4 w-4 mr-2" />
                        Görseller ({selectedInspection.imageUrls.length})
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedInspection.imageUrls.map((url: string, index: number) => (
                          <div key={index} className="w-full h-40 relative rounded-md overflow-hidden border">
                            <img 
                              src={url} 
                              alt={`Hata görüntüsü ${index + 1}`} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Kapat
                </Button>
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    setTimeout(() => {
                      handleEditInspection(selectedInspection);
                    }, 100);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Düzenle
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FinalInspectionPage;