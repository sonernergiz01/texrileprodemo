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
  Printer,
  Check,
  X,
  FileBarChart,
  ListFilter,
  BarChart3,
  Filter
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Kontrol şeması
const inspectionSchema = z.object({
  batchNumber: z.string().min(1, "Parti numarası gereklidir"),
  weaveCode: z.string().min(1, "Dokuma kodu gereklidir"),
  width: z.string().min(1, "En bilgisi gereklidir"),
  defectCount: z.string().min(1, "Hata sayısı gereklidir"),
  grade: z.enum(["A", "B", "C"]).default("A"),
  inspectionDate: z.string().min(1, "Kontrol tarihi gereklidir"),
  inspectorId: z.number(),
  notes: z.string().optional(),
  status: z.enum(["Beklemede", "Kontrol Edildi", "Reddedildi", "Onaylandı"]).default("Beklemede"),
});

const QualityInspectionPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);

  // Form tanımlama
  const form = useForm<z.infer<typeof inspectionSchema>>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      batchNumber: "",
      weaveCode: "",
      width: "",
      defectCount: "0",
      grade: "A",
      inspectionDate: new Date().toISOString().split('T')[0],
      inspectorId: 1,
      notes: "",
      status: "Beklemede",
    },
  });

  // Düzenleme formu
  const editForm = useForm<z.infer<typeof inspectionSchema>>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      batchNumber: "",
      weaveCode: "",
      width: "",
      defectCount: "0",
      grade: "A",
      inspectionDate: new Date().toISOString().split('T')[0],
      inspectorId: 1,
      notes: "",
      status: "Beklemede",
    },
  });

  // Ham kalite kontrolleri verisini çek
  const { data: inspections = [], isLoading: isLoadingInspections } = useQuery({
    queryKey: ["/api/raw-quality/inspections"],
  });

  // Kullanıcıları (operatörleri) çek
  const { data: inspectors = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Yeni kalite kontrolü oluştur
  const createInspectionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof inspectionSchema>) => {
      const res = await apiRequest("POST", "/api/raw-quality/inspections", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Kalite kontrolü başarıyla oluşturuldu",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/raw-quality/inspections"] });
      form.reset({
        batchNumber: "",
        weaveCode: "",
        width: "",
        defectCount: "0",
        grade: "A",
        inspectionDate: new Date().toISOString().split('T')[0],
        inspectorId: 1,
        notes: "",
        status: "Beklemede",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Kalite kontrolü oluşturulurken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Kalite kontrolü güncelle
  const updateInspectionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/raw-quality/inspections/${selectedInspection.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Kalite kontrolü başarıyla güncellendi",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/raw-quality/inspections"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Kalite kontrolü güncellenirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Form gönderme
  const onSubmit = (data: z.infer<typeof inspectionSchema>) => {
    createInspectionMutation.mutate(data);
  };

  // Form güncelleme
  const onEditSubmit = (data: z.infer<typeof inspectionSchema>) => {
    updateInspectionMutation.mutate(data);
  };

  // Kalite kontrol kaydını görüntüleme
  const handleViewInspection = (inspection: any) => {
    setSelectedInspection(inspection);
    setIsViewDialogOpen(true);
  };

  // Kalite kontrol kaydını düzenleme
  const handleEditInspection = (inspection: any) => {
    setSelectedInspection(inspection);
    editForm.reset({
      batchNumber: inspection.batchNumber,
      weaveCode: inspection.weaveCode,
      width: inspection.width,
      defectCount: inspection.defectCount,
      grade: inspection.grade,
      inspectionDate: inspection.inspectionDate,
      inspectorId: inspection.inspectorId,
      notes: inspection.notes || "",
      status: inspection.status,
    });
    setIsEditDialogOpen(true);
  };

  // Durum filtreleme
  const getFilteredInspections = () => {
    let filtered = inspections;
    
    // Arama terimine göre filtrele
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((inspection: any) => 
        inspection.batchNumber?.toLowerCase().includes(searchLower) ||
        inspection.weaveCode?.toLowerCase().includes(searchLower)
      );
    }
    
    // Duruma göre filtrele
    if (statusFilter) {
      filtered = filtered.filter((inspection: any) => inspection.status === statusFilter);
    }
    
    return filtered;
  };

  // Operatör adını bul
  const getInspectorName = (inspectorId: number) => {
    const inspector = inspectors.find((user: any) => user.id === inspectorId);
    return inspector ? inspector.fullName : "Bilinmeyen";
  };

  // Durum rozeti renkleri
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Onaylandı":
        return "default";
      case "Beklemede":
        return "outline";
      case "Kontrol Edildi":
        return "secondary";
      case "Reddedildi":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Yükleme durumu
  if (isLoadingInspections) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filtrelenmiş kalite kontrolları
  const filteredInspections = getFilteredInspections();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Ham Kumaş Kalite Kontrol" 
        description="Dokuma sonrası ham kumaş kalite kontrol işlemlerini yönetin"
      />
      
      <Tabs defaultValue="all">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all" onClick={() => setStatusFilter(null)}>Tümü</TabsTrigger>
            <TabsTrigger value="pending" onClick={() => setStatusFilter("Beklemede")}>Beklemede</TabsTrigger>
            <TabsTrigger value="inspected" onClick={() => setStatusFilter("Kontrol Edildi")}>Kontrol Edildi</TabsTrigger>
            <TabsTrigger value="approved" onClick={() => setStatusFilter("Onaylandı")}>Onaylandı</TabsTrigger>
            <TabsTrigger value="rejected" onClick={() => setStatusFilter("Reddedildi")}>Reddedildi</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Parti no, dokuma kodu..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Yeni Kontrol
            </Button>
          </div>
        </div>
        
        <TabsContent value="all" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>Kalite Kontrol Kayıtları</CardTitle>
              <CardDescription>
                Ham kumaş kalite kontrol işlemleri ve sonuçları
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredInspections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || statusFilter ? 
                    "Arama kriterlerine uygun kalite kontrol kaydı bulunamadı." : 
                    "Henüz kalite kontrol kaydı bulunmamaktadır. Yeni bir kayıt eklemek için 'Yeni Kontrol' butonunu kullanın."
                  }
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parti No</TableHead>
                      <TableHead>Dokuma Kodu</TableHead>
                      <TableHead>Kontrol Tarihi</TableHead>
                      <TableHead>Görevli</TableHead>
                      <TableHead>Kalite</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInspections.map((inspection: any) => (
                      <TableRow key={inspection.id}>
                        <TableCell className="font-medium">{inspection.batchNumber}</TableCell>
                        <TableCell>{inspection.weaveCode}</TableCell>
                        <TableCell>{inspection.inspectionDate}</TableCell>
                        <TableCell>{getInspectorName(inspection.inspectorId)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              inspection.grade === "A" ? "default" :
                              inspection.grade === "B" ? "secondary" : "destructive"
                            }
                          >
                            {inspection.grade}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(inspection.status)}>
                            {inspection.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleViewInspection(inspection)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditInspection(inspection)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                            >
                              <Printer className="h-4 w-4" />
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
        
        <TabsContent value="pending" className="m-0">
          {/* Bekleyenlerin içeriği aynı yapıda gösterilir, filtreler tarafından zaten kontrol ediliyor */}
        </TabsContent>
        
        <TabsContent value="inspected" className="m-0">
          {/* Kontrol edilenlerin içeriği */}
        </TabsContent>
        
        <TabsContent value="approved" className="m-0">
          {/* Onaylananların içeriği */}
        </TabsContent>
        
        <TabsContent value="rejected" className="m-0">
          {/* Reddedilenlerin içeriği */}
        </TabsContent>
      </Tabs>
      
      {/* Yeni Kalite Kontrol Modalı */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yeni Kalite Kontrol Kaydı</DialogTitle>
            <DialogDescription>
              Ham kumaş için yeni bir kalite kontrol kaydı oluşturun.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="batchNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parti Numarası*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: BTH-2025-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="weaveCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dokuma Kodu*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: WV-2025-120" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>En (cm)*</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="defectCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hata Sayısı*</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kalite Sınıfı*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kalite sınıfı seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A">A Sınıfı (Premium)</SelectItem>
                          <SelectItem value="B">B Sınıfı (Standart)</SelectItem>
                          <SelectItem value="C">C Sınıfı (Ekonomik)</SelectItem>
                        </SelectContent>
                      </Select>
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
                  name="inspectorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kontrol Eden*</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Personel seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {inspectors.map((user: any) => (
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
                          <SelectItem value="Beklemede">Beklemede</SelectItem>
                          <SelectItem value="Kontrol Edildi">Kontrol Edildi</SelectItem>
                          <SelectItem value="Onaylandı">Onaylandı</SelectItem>
                          <SelectItem value="Reddedildi">Reddedildi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Kalite kontrolüne dair özel notlar..."
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
        </DialogContent>
      </Dialog>
      
      {/* Kalite Kontrol Düzenleme Modalı */}
      {selectedInspection && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Kalite Kontrol Kaydını Düzenle</DialogTitle>
              <DialogDescription>
                {selectedInspection.batchNumber} numaralı parti için kalite kontrol bilgilerini güncelleyin.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="batchNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parti Numarası*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="weaveCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dokuma Kodu*</FormLabel>
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
                    name="width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>En (cm)*</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="defectCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hata Sayısı*</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kalite Sınıfı*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Kalite sınıfı seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="A">A Sınıfı (Premium)</SelectItem>
                            <SelectItem value="B">B Sınıfı (Standart)</SelectItem>
                            <SelectItem value="C">C Sınıfı (Ekonomik)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
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
                    control={editForm.control}
                    name="inspectorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kontrol Eden*</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Personel seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {inspectors.map((user: any) => (
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
                            <SelectItem value="Kontrol Edildi">Kontrol Edildi</SelectItem>
                            <SelectItem value="Onaylandı">Onaylandı</SelectItem>
                            <SelectItem value="Reddedildi">Reddedildi</SelectItem>
                          </SelectContent>
                        </Select>
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
                    disabled={updateInspectionMutation.isPending}
                  >
                    {updateInspectionMutation.isPending && (
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
      
      {/* Kalite Kontrol Görüntüleme Modalı */}
      {selectedInspection && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Kalite Kontrol Detayları</DialogTitle>
              <DialogDescription>
                {selectedInspection.batchNumber} - {selectedInspection.weaveCode}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Temel Bilgiler</h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Parti No:</span>
                      <span className="text-sm font-medium">{selectedInspection.batchNumber}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Dokuma Kodu:</span>
                      <span className="text-sm font-medium">{selectedInspection.weaveCode}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">En:</span>
                      <span className="text-sm font-medium">{selectedInspection.width} cm</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Kontrol Tarihi:</span>
                      <span className="text-sm font-medium">{selectedInspection.inspectionDate}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Kalite Bilgileri</h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Kalite Sınıfı:</span>
                      <Badge
                        variant={
                          selectedInspection.grade === "A" ? "default" :
                          selectedInspection.grade === "B" ? "secondary" : "destructive"
                        }
                      >
                        {selectedInspection.grade}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Hata Sayısı:</span>
                      <span className="text-sm font-medium">{selectedInspection.defectCount}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Kontrol Eden:</span>
                      <span className="text-sm font-medium">{getInspectorName(selectedInspection.inspectorId)}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Durum:</span>
                      <Badge variant={getStatusBadgeVariant(selectedInspection.status)}>
                        {selectedInspection.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Notlar</h4>
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                  {selectedInspection.notes || "Not bulunmamaktadır."}
                </p>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Kapat
                </Button>
                <Button
                  variant="outline"
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
                <Button>
                  <Printer className="mr-2 h-4 w-4" />
                  Rapor Yazdır
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default QualityInspectionPage;