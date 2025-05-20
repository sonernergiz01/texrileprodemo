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
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Calendar,
  CalendarCheck,
  ArrowRightCircle,
  Truck,
  PackageCheck,
  BarChart3,
  FileText
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

// Numune takibi şeması
const sampleTrackingSchema = z.object({
  sampleId: z.string().min(1, "Numune ID gereklidir"),
  requestId: z.number().min(1, "Numune talebi seçilmelidir"),
  customerId: z.number().min(1, "Müşteri seçilmelidir"),
  description: z.string().min(1, "Açıklama gereklidir"),
  productionDate: z.string().min(1, "Üretim tarihi gereklidir"),
  completionDate: z.string().optional(),
  shippingDate: z.string().optional(),
  sampleType: z.enum(["Dokuma", "İplik", "Kumaş", "Boya", "Diğer"]),
  sampleSize: z.string().optional(),
  testResults: z.string().optional(),
  approvalStatus: z.enum(["Onay Bekliyor", "Onaylandı", "Reddedildi", "Revizyon Gerekli"]).default("Onay Bekliyor"),
  customerFeedback: z.string().optional(),
  status: z.enum([
    "Planlama", 
    "Üretimde", 
    "Üretim Tamamlandı", 
    "Test Aşamasında", 
    "Test Tamamlandı", 
    "Sevk Edildi", 
    "Müşteri Onayı Alındı", 
    "Reddedildi",
    "İptal Edildi"
  ]).default("Planlama"),
  assignedToId: z.number().nullable().optional(),
  notes: z.string().optional(),
});

const SampleTrackingPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState<any>(null);

  // Form tanımlama
  const form = useForm<z.infer<typeof sampleTrackingSchema>>({
    resolver: zodResolver(sampleTrackingSchema),
    defaultValues: {
      sampleId: "",
      requestId: 0,
      customerId: 0,
      description: "",
      productionDate: new Date().toISOString().split('T')[0],
      sampleType: "Dokuma",
      sampleSize: "",
      testResults: "",
      approvalStatus: "Onay Bekliyor",
      customerFeedback: "",
      status: "Planlama",
      assignedToId: null,
      notes: "",
    },
  });

  // Düzenleme formu
  const editForm = useForm<z.infer<typeof sampleTrackingSchema>>({
    resolver: zodResolver(sampleTrackingSchema),
    defaultValues: {
      sampleId: "",
      requestId: 0,
      customerId: 0,
      description: "",
      productionDate: "",
      completionDate: "",
      shippingDate: "",
      sampleType: "Dokuma",
      sampleSize: "",
      testResults: "",
      approvalStatus: "Onay Bekliyor",
      customerFeedback: "",
      status: "Planlama",
      assignedToId: null,
      notes: "",
    },
  });

  // Numune takibi verisini çek
  const { data: samples = [], isLoading: isLoadingSamples } = useQuery({
    queryKey: ["/api/samples/tracking"],
  });

  // Numune talepleri verisini çek
  const { data: sampleRequests = [] } = useQuery({
    queryKey: ["/api/samples/requests"],
  });

  // Müşterileri çek
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });

  // Kullanıcıları çek
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Yeni numune takibi oluştur
  const createSampleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof sampleTrackingSchema>) => {
      const res = await apiRequest("POST", "/api/samples/tracking", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Numune takibi başarıyla oluşturuldu",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/samples/tracking"] });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Numune takibi oluşturulurken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Numune takibi güncelle
  const updateSampleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/samples/tracking/${selectedSample.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Numune takibi başarıyla güncellendi",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/samples/tracking"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Numune takibi güncellenirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Durum değiştirme işlemi
  const updateSampleStatus = async (sampleId: number, newStatus: string) => {
    try {
      await apiRequest("PATCH", `/api/samples/tracking/${sampleId}/status`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["/api/samples/tracking"] });
      toast({
        title: "Başarılı",
        description: "Numune durumu güncellendi",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Durum güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  // Onay durumu değiştirme işlemi
  const updateApprovalStatus = async (sampleId: number, approvalStatus: string) => {
    try {
      await apiRequest("PATCH", `/api/samples/tracking/${sampleId}/approval`, { approvalStatus });
      queryClient.invalidateQueries({ queryKey: ["/api/samples/tracking"] });
      toast({
        title: "Başarılı",
        description: "Numune onay durumu güncellendi",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Onay durumu güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  // Form gönderme
  const onSubmit = (data: z.infer<typeof sampleTrackingSchema>) => {
    createSampleMutation.mutate(data);
  };

  // Form güncelleme
  const onEditSubmit = (data: z.infer<typeof sampleTrackingSchema>) => {
    updateSampleMutation.mutate(data);
  };

  // Numune takibini görüntüleme
  const handleViewSample = (sample: any) => {
    setSelectedSample(sample);
    setIsViewDialogOpen(true);
  };

  // Numune takibini düzenleme
  const handleEditSample = (sample: any) => {
    setSelectedSample(sample);
    editForm.reset({
      sampleId: sample.sampleId,
      requestId: sample.requestId,
      customerId: sample.customerId,
      description: sample.description,
      productionDate: sample.productionDate,
      completionDate: sample.completionDate || "",
      shippingDate: sample.shippingDate || "",
      sampleType: sample.sampleType,
      sampleSize: sample.sampleSize || "",
      testResults: sample.testResults || "",
      approvalStatus: sample.approvalStatus,
      customerFeedback: sample.customerFeedback || "",
      status: sample.status,
      assignedToId: sample.assignedToId,
      notes: sample.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  // Filtreleme
  const getFilteredSamples = () => {
    let filtered = samples;
    
    // Arama terimine göre filtrele
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((sample: any) => 
        sample.sampleId?.toLowerCase().includes(searchLower) ||
        sample.description?.toLowerCase().includes(searchLower) ||
        getCustomerName(sample.customerId)?.toLowerCase().includes(searchLower) ||
        getRequestNumber(sample.requestId)?.toLowerCase().includes(searchLower)
      );
    }
    
    // Duruma göre filtrele
    if (statusFilter) {
      filtered = filtered.filter((sample: any) => sample.status === statusFilter);
    }
    
    return filtered;
  };

  // Müşteri adını bul
  const getCustomerName = (customerId: number) => {
    const customer = customers.find((c: any) => c.id === customerId);
    return customer ? customer.name : "Bilinmeyen";
  };

  // Talep numarasını bul
  const getRequestNumber = (requestId: number) => {
    const request = sampleRequests.find((r: any) => r.id === requestId);
    return request ? request.requestNumber : "Bilinmeyen";
  };

  // Sorumlu adını bul
  const getAssigneeName = (assignedToId: number | null) => {
    if (!assignedToId) return "-";
    const user = users.find((u: any) => u.id === assignedToId);
    return user ? user.fullName : "Bilinmeyen";
  };

  // Durum rozeti renkleri
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Planlama":
        return "outline";
      case "Üretimde":
        return "default";
      case "Üretim Tamamlandı":
        return "default";
      case "Test Aşamasında":
        return "secondary";
      case "Test Tamamlandı":
        return "secondary";
      case "Sevk Edildi":
        return "default";
      case "Müşteri Onayı Alındı":
        return "success";
      case "Reddedildi":
        return "destructive";
      case "İptal Edildi":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Onay durumu rozeti renkleri
  const getApprovalBadgeVariant = (status: string) => {
    switch (status) {
      case "Onay Bekliyor":
        return "outline";
      case "Onaylandı":
        return "success";
      case "Reddedildi":
        return "destructive";
      case "Revizyon Gerekli":
        return "warning";
      default:
        return "outline";
    }
  };

  // Durum ikonu
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Planlama":
        return <Calendar className="h-4 w-4 text-gray-500" />;
      case "Üretimde":
        return <ArrowRightCircle className="h-4 w-4 text-blue-500" />;
      case "Üretim Tamamlandı":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Test Aşamasında":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "Test Tamamlandı":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Sevk Edildi":
        return <Truck className="h-4 w-4 text-blue-500" />;
      case "Müşteri Onayı Alındı":
        return <CalendarCheck className="h-4 w-4 text-green-500" />;
      case "Reddedildi":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "İptal Edildi":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Yükleme durumu
  if (isLoadingSamples) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filtrelenmiş numuneler
  const filteredSamples = getFilteredSamples();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Numune Takibi" 
        description="Üretilen numuneleri izleyin ve müşteri onay süreçlerini yönetin"
      />
      
      <Tabs defaultValue="all">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all" onClick={() => setStatusFilter(null)}>Tümü</TabsTrigger>
            <TabsTrigger value="planning" onClick={() => setStatusFilter("Planlama")}>Planlama</TabsTrigger>
            <TabsTrigger value="production" onClick={() => setStatusFilter("Üretimde")}>Üretimde</TabsTrigger>
            <TabsTrigger value="testing" onClick={() => setStatusFilter("Test Aşamasında")}>Test Aşamasında</TabsTrigger>
            <TabsTrigger value="shipped" onClick={() => setStatusFilter("Sevk Edildi")}>Sevk Edildi</TabsTrigger>
            <TabsTrigger value="approved" onClick={() => setStatusFilter("Müşteri Onayı Alındı")}>Onaylı</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Numune ID, müşteri, açıklama..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Raporlar
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Yeni Numune
            </Button>
          </div>
        </div>
        
        <TabsContent value="all" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>Numune Takibi</CardTitle>
              <CardDescription>
                Tüm numunelerin güncel durumları ve müşteri onay süreçleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSamples.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || statusFilter ? 
                    "Arama kriterlerine uygun numune bulunamadı." : 
                    "Henüz numune takibi bulunmamaktadır. Yeni bir numune eklemek için 'Yeni Numune' butonunu kullanın."
                  }
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numune ID</TableHead>
                      <TableHead>Talep No</TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead>Üretim Tarihi</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Onay Durumu</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSamples.map((sample: any) => (
                      <TableRow key={sample.id}>
                        <TableCell className="font-medium">{sample.sampleId}</TableCell>
                        <TableCell>{getRequestNumber(sample.requestId)}</TableCell>
                        <TableCell>{getCustomerName(sample.customerId)}</TableCell>
                        <TableCell>
                          <HoverCard>
                            <HoverCardTrigger className="cursor-help">
                              {sample.description.length > 20
                                ? `${sample.description.substring(0, 20)}...`
                                : sample.description}
                            </HoverCardTrigger>
                            <HoverCardContent>
                              <div className="space-y-1">
                                <p className="text-sm">{sample.description}</p>
                                {sample.sampleSize && (
                                  <p className="text-xs text-muted-foreground">
                                    Boyut: {sample.sampleSize}
                                  </p>
                                )}
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </TableCell>
                        <TableCell>{sample.productionDate}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(sample.status)}
                            <Badge variant={getStatusBadgeVariant(sample.status)}>
                              {sample.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getApprovalBadgeVariant(sample.approvalStatus)}>
                            {sample.approvalStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleViewSample(sample)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditSample(sample)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="planning" className="m-0">
          {/* Planlamadaki numunelerin içeriği */}
        </TabsContent>
        
        <TabsContent value="production" className="m-0">
          {/* Üretimdeki numunelerin içeriği */}
        </TabsContent>
        
        <TabsContent value="testing" className="m-0">
          {/* Test aşamasındaki numunelerin içeriği */}
        </TabsContent>
        
        <TabsContent value="shipped" className="m-0">
          {/* Sevk edilmiş numunelerin içeriği */}
        </TabsContent>
        
        <TabsContent value="approved" className="m-0">
          {/* Onaylı numunelerin içeriği */}
        </TabsContent>
      </Tabs>
      
      {/* Yeni Numune Modalı */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yeni Numune</DialogTitle>
            <DialogDescription>
              Takip edilecek yeni bir numune kaydı oluşturun.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sampleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numune ID*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: NUM-2025-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="requestId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numune Talebi*</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Numune talebi seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sampleRequests.map((request: any) => (
                            <SelectItem key={request.id} value={request.id.toString()}>
                              {request.requestNumber}
                            </SelectItem>
                          ))}
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
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Müşteri*</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Müşteri seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer: any) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name}
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
                  name="sampleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numune Tipi*</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Numune tipi seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Dokuma">Dokuma</SelectItem>
                          <SelectItem value="İplik">İplik</SelectItem>
                          <SelectItem value="Kumaş">Kumaş</SelectItem>
                          <SelectItem value="Boya">Boya</SelectItem>
                          <SelectItem value="Diğer">Diğer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama*</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Numune hakkında detaylı açıklama..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="productionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Üretim Tarihi*</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sampleSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numune Boyutu</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: 20x30 cm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="assignedToId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sorumlu</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sorumlu kişi seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Seçiniz</SelectItem>
                          {users.map((user: any) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.fullName}
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
                          <SelectItem value="Planlama">Planlama</SelectItem>
                          <SelectItem value="Üretimde">Üretimde</SelectItem>
                          <SelectItem value="Üretim Tamamlandı">Üretim Tamamlandı</SelectItem>
                          <SelectItem value="Test Aşamasında">Test Aşamasında</SelectItem>
                          <SelectItem value="Test Tamamlandı">Test Tamamlandı</SelectItem>
                          <SelectItem value="Sevk Edildi">Sevk Edildi</SelectItem>
                          <SelectItem value="Müşteri Onayı Alındı">Müşteri Onayı Alındı</SelectItem>
                          <SelectItem value="Reddedildi">Reddedildi</SelectItem>
                          <SelectItem value="İptal Edildi">İptal Edildi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="approvalStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Onay Durumu*</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Onay durumu seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Onay Bekliyor">Onay Bekliyor</SelectItem>
                        <SelectItem value="Onaylandı">Onaylandı</SelectItem>
                        <SelectItem value="Reddedildi">Reddedildi</SelectItem>
                        <SelectItem value="Revizyon Gerekli">Revizyon Gerekli</SelectItem>
                      </SelectContent>
                    </Select>
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
                        placeholder="Numune hakkında ilave notlar..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                  disabled={createSampleMutation.isPending}
                >
                  {createSampleMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Oluştur
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Numune Düzenleme Modalı */}
      {selectedSample && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Numune Düzenle</DialogTitle>
              <DialogDescription>
                {selectedSample.sampleId} numaralı numuneyi düzenleyin.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="sampleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numune ID*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="requestId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numune Talebi*</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Numune talebi seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sampleRequests.map((request: any) => (
                              <SelectItem key={request.id} value={request.id.toString()}>
                                {request.requestNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Müşteri*</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Müşteri seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((customer: any) => (
                              <SelectItem key={customer.id} value={customer.id.toString()}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="sampleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numune Tipi*</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Numune tipi seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Dokuma">Dokuma</SelectItem>
                            <SelectItem value="İplik">İplik</SelectItem>
                            <SelectItem value="Kumaş">Kumaş</SelectItem>
                            <SelectItem value="Boya">Boya</SelectItem>
                            <SelectItem value="Diğer">Diğer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Açıklama*</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={editForm.control}
                    name="productionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Üretim Tarihi*</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="completionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tamamlanma Tarihi</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="shippingDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sevkiyat Tarihi</FormLabel>
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
                    control={editForm.control}
                    name="assignedToId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sorumlu</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                          defaultValue={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sorumlu kişi seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Seçiniz</SelectItem>
                            {users.map((user: any) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="sampleSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numune Boyutu</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
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
                            <SelectItem value="Planlama">Planlama</SelectItem>
                            <SelectItem value="Üretimde">Üretimde</SelectItem>
                            <SelectItem value="Üretim Tamamlandı">Üretim Tamamlandı</SelectItem>
                            <SelectItem value="Test Aşamasında">Test Aşamasında</SelectItem>
                            <SelectItem value="Test Tamamlandı">Test Tamamlandı</SelectItem>
                            <SelectItem value="Sevk Edildi">Sevk Edildi</SelectItem>
                            <SelectItem value="Müşteri Onayı Alındı">Müşteri Onayı Alındı</SelectItem>
                            <SelectItem value="Reddedildi">Reddedildi</SelectItem>
                            <SelectItem value="İptal Edildi">İptal Edildi</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="approvalStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Onay Durumu*</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Onay durumu seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Onay Bekliyor">Onay Bekliyor</SelectItem>
                            <SelectItem value="Onaylandı">Onaylandı</SelectItem>
                            <SelectItem value="Reddedildi">Reddedildi</SelectItem>
                            <SelectItem value="Revizyon Gerekli">Revizyon Gerekli</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="testResults"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test Sonuçları</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="resize-none"
                            placeholder="Numune test sonuçları..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="customerFeedback"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Müşteri Geri Bildirimi</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="resize-none"
                            placeholder="Müşteriden gelen geri bildirimler..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={editForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notlar</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateSampleMutation.isPending}
                  >
                    {updateSampleMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Güncelle
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Numune Görüntüleme Modalı */}
      {selectedSample && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>Numune Detayları</DialogTitle>
              <DialogDescription>
                {selectedSample.sampleId} - {getCustomerName(selectedSample.customerId)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Genel Bilgiler</h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Numune ID:</span>
                      <span className="text-sm font-medium">{selectedSample.sampleId}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Talep No:</span>
                      <span className="text-sm font-medium">{getRequestNumber(selectedSample.requestId)}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Müşteri:</span>
                      <span className="text-sm font-medium">{getCustomerName(selectedSample.customerId)}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Numune Tipi:</span>
                      <span className="text-sm font-medium">{selectedSample.sampleType}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Açıklama:</span>
                      <span className="text-sm">{selectedSample.description}</span>
                    </div>
                    {selectedSample.sampleSize && (
                      <div className="grid grid-cols-2">
                        <span className="text-sm text-muted-foreground">Numune Boyutu:</span>
                        <span className="text-sm font-medium">{selectedSample.sampleSize}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Durum Bilgileri</h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Üretim Tarihi:</span>
                      <span className="text-sm font-medium">{selectedSample.productionDate}</span>
                    </div>
                    {selectedSample.completionDate && (
                      <div className="grid grid-cols-2">
                        <span className="text-sm text-muted-foreground">Tamamlanma Tarihi:</span>
                        <span className="text-sm font-medium">{selectedSample.completionDate}</span>
                      </div>
                    )}
                    {selectedSample.shippingDate && (
                      <div className="grid grid-cols-2">
                        <span className="text-sm text-muted-foreground">Sevkiyat Tarihi:</span>
                        <span className="text-sm font-medium">{selectedSample.shippingDate}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Sorumlu:</span>
                      <span className="text-sm font-medium">{getAssigneeName(selectedSample.assignedToId)}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Durum:</span>
                      <Badge variant={getStatusBadgeVariant(selectedSample.status)}>
                        {selectedSample.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Onay Durumu:</span>
                      <Badge variant={getApprovalBadgeVariant(selectedSample.approvalStatus)}>
                        {selectedSample.approvalStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedSample.testResults && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Test Sonuçları</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                    {selectedSample.testResults}
                  </p>
                </div>
              )}
              
              {selectedSample.customerFeedback && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Müşteri Geri Bildirimi</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                    {selectedSample.customerFeedback}
                  </p>
                </div>
              )}
              
              {selectedSample.notes && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Notlar</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                    {selectedSample.notes}
                  </p>
                </div>
              )}
              
              <DialogFooter className="gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Kapat
                </Button>
                {selectedSample.status !== "Üretim Tamamlandı" && selectedSample.status !== "Test Tamamlandı" && selectedSample.status !== "Sevk Edildi" && selectedSample.status !== "Müşteri Onayı Alındı" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      updateSampleStatus(selectedSample.id, "Üretim Tamamlandı");
                      setIsViewDialogOpen(false);
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Üretimi Tamamla
                  </Button>
                )}
                {selectedSample.status === "Üretim Tamamlandı" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      updateSampleStatus(selectedSample.id, "Test Tamamlandı");
                      setIsViewDialogOpen(false);
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Testi Tamamla
                  </Button>
                )}
                {selectedSample.status === "Test Tamamlandı" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      updateSampleStatus(selectedSample.id, "Sevk Edildi");
                      setIsViewDialogOpen(false);
                    }}
                  >
                    <Truck className="mr-2 h-4 w-4 text-blue-500" />
                    Sevk Et
                  </Button>
                )}
                {selectedSample.status === "Sevk Edildi" && selectedSample.approvalStatus !== "Onaylandı" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      updateApprovalStatus(selectedSample.id, "Onaylandı");
                      updateSampleStatus(selectedSample.id, "Müşteri Onayı Alındı");
                      setIsViewDialogOpen(false);
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Müşteri Onayı Al
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    setTimeout(() => {
                      handleEditSample(selectedSample);
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

export default SampleTrackingPage;