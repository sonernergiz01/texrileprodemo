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
  AlertTriangle,
  ArrowUpDown,
  ChevronDown,
  Filter,
  BarChart3
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Kusur şeması
const defectSchema = z.object({
  batchNumber: z.string().min(1, "Parti numarası gereklidir"),
  defectType: z.enum(["İplik Hatası", "Örgü Hatası", "Renk Hatası", "Doku Hatası", "Boyut Hatası", "Diğer"]),
  severity: z.enum(["Düşük", "Orta", "Yüksek", "Kritik"]),
  location: z.string().min(1, "Hata konumu gereklidir"),
  size: z.string().optional(),
  reportedById: z.number(),
  reportDate: z.string().min(1, "Rapor tarihi gereklidir"),
  notes: z.string().optional(),
  status: z.enum(["Açık", "İnceleniyor", "Çözüldü", "Kapatıldı"]).default("Açık"),
});

const QualityDefectsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<any>(null);

  // Form tanımlama
  const form = useForm<z.infer<typeof defectSchema>>({
    resolver: zodResolver(defectSchema),
    defaultValues: {
      batchNumber: "",
      defectType: "İplik Hatası",
      severity: "Düşük",
      location: "",
      size: "",
      reportedById: 1,
      reportDate: new Date().toISOString().split('T')[0],
      notes: "",
      status: "Açık",
    },
  });

  // Düzenleme formu
  const editForm = useForm<z.infer<typeof defectSchema>>({
    resolver: zodResolver(defectSchema),
    defaultValues: {
      batchNumber: "",
      defectType: "İplik Hatası",
      severity: "Düşük",
      location: "",
      size: "",
      reportedById: 1,
      reportDate: new Date().toISOString().split('T')[0],
      notes: "",
      status: "Açık",
    },
  });

  // Kumaş kusurları verisini çek
  const { data: defects = [], isLoading: isLoadingDefects } = useQuery({
    queryKey: ["/api/raw-quality/defects"],
  });

  // Kullanıcıları çek
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Yeni kusur oluştur
  const createDefectMutation = useMutation({
    mutationFn: async (data: z.infer<typeof defectSchema>) => {
      const res = await apiRequest("POST", "/api/raw-quality/defects", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Kusur raporu başarıyla oluşturuldu",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/raw-quality/defects"] });
      form.reset({
        batchNumber: "",
        defectType: "İplik Hatası",
        severity: "Düşük",
        location: "",
        size: "",
        reportedById: 1,
        reportDate: new Date().toISOString().split('T')[0],
        notes: "",
        status: "Açık",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Kusur raporu oluşturulurken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Kusur güncelle
  const updateDefectMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/raw-quality/defects/${selectedDefect.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Kusur raporu başarıyla güncellendi",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/raw-quality/defects"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Kusur raporu güncellenirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Form gönderme
  const onSubmit = (data: z.infer<typeof defectSchema>) => {
    createDefectMutation.mutate(data);
  };

  // Form güncelleme
  const onEditSubmit = (data: z.infer<typeof defectSchema>) => {
    updateDefectMutation.mutate(data);
  };

  // Kusur kaydını görüntüleme
  const handleViewDefect = (defect: any) => {
    setSelectedDefect(defect);
    setIsViewDialogOpen(true);
  };

  // Kusur kaydını düzenleme
  const handleEditDefect = (defect: any) => {
    setSelectedDefect(defect);
    editForm.reset({
      batchNumber: defect.batchNumber,
      defectType: defect.defectType,
      severity: defect.severity,
      location: defect.location,
      size: defect.size || "",
      reportedById: defect.reportedById,
      reportDate: defect.reportDate,
      notes: defect.notes || "",
      status: defect.status,
    });
    setIsEditDialogOpen(true);
  };

  // Filtreleme
  const getFilteredDefects = () => {
    let filtered = defects;
    
    // Arama terimine göre filtrele
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((defect: any) => 
        defect.batchNumber?.toLowerCase().includes(searchLower) ||
        defect.location?.toLowerCase().includes(searchLower) ||
        defect.notes?.toLowerCase().includes(searchLower)
      );
    }
    
    // Kusur tipine göre filtrele
    if (typeFilter) {
      filtered = filtered.filter((defect: any) => defect.defectType === typeFilter);
    }
    
    // Önem derecesine göre filtrele
    if (severityFilter) {
      filtered = filtered.filter((defect: any) => defect.severity === severityFilter);
    }
    
    return filtered;
  };

  // Raporlayan kişi adını bul
  const getReporterName = (reporterId: number) => {
    const reporter = users.find((user: any) => user.id === reporterId);
    return reporter ? reporter.fullName : "Bilinmeyen";
  };

  // Önem derecesi rozeti renkleri
  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case "Düşük":
        return "outline";
      case "Orta":
        return "secondary";
      case "Yüksek":
        return "default";
      case "Kritik":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Durum rozeti renkleri
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Açık":
        return "outline";
      case "İnceleniyor":
        return "default";
      case "Çözüldü":
        return "secondary";
      case "Kapatıldı":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Yükleme durumu
  if (isLoadingDefects) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filtrelenmiş kusurlar
  const filteredDefects = getFilteredDefects();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Kumaş Kusur Raporlama" 
        description="Ham kumaştaki kusurları izleyin ve raporlayın"
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Parti no, konum, notlar..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 flex">
                <Filter className="mr-2 h-4 w-4" />
                Kusur Tipi
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={typeFilter === null}
                onCheckedChange={() => setTypeFilter(null)}
              >
                Tümü
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter === "İplik Hatası"}
                onCheckedChange={() => setTypeFilter(typeFilter === "İplik Hatası" ? null : "İplik Hatası")}
              >
                İplik Hatası
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter === "Örgü Hatası"}
                onCheckedChange={() => setTypeFilter(typeFilter === "Örgü Hatası" ? null : "Örgü Hatası")}
              >
                Örgü Hatası
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter === "Renk Hatası"}
                onCheckedChange={() => setTypeFilter(typeFilter === "Renk Hatası" ? null : "Renk Hatası")}
              >
                Renk Hatası
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter === "Doku Hatası"}
                onCheckedChange={() => setTypeFilter(typeFilter === "Doku Hatası" ? null : "Doku Hatası")}
              >
                Doku Hatası
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter === "Boyut Hatası"}
                onCheckedChange={() => setTypeFilter(typeFilter === "Boyut Hatası" ? null : "Boyut Hatası")}
              >
                Boyut Hatası
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter === "Diğer"}
                onCheckedChange={() => setTypeFilter(typeFilter === "Diğer" ? null : "Diğer")}
              >
                Diğer
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 flex">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Önem Seviyesi
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={severityFilter === null}
                onCheckedChange={() => setSeverityFilter(null)}
              >
                Tümü
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={severityFilter === "Düşük"}
                onCheckedChange={() => setSeverityFilter(severityFilter === "Düşük" ? null : "Düşük")}
              >
                Düşük
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={severityFilter === "Orta"}
                onCheckedChange={() => setSeverityFilter(severityFilter === "Orta" ? null : "Orta")}
              >
                Orta
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={severityFilter === "Yüksek"}
                onCheckedChange={() => setSeverityFilter(severityFilter === "Yüksek" ? null : "Yüksek")}
              >
                Yüksek
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={severityFilter === "Kritik"}
                onCheckedChange={() => setSeverityFilter(severityFilter === "Kritik" ? null : "Kritik")}
              >
                Kritik
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            İstatistikler
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Yeni Kusur Raporu
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Kumaş Kusur Raporları</CardTitle>
          <CardDescription>
            Ham kumaşlarda tespit edilen kusurlar ve takibi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDefects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || typeFilter || severityFilter ? 
                "Arama kriterlerine uygun kusur kaydı bulunamadı." : 
                "Henüz kusur kaydı bulunmamaktadır. Yeni bir kayıt eklemek için 'Yeni Kusur Raporu' butonunu kullanın."
              }
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parti No</TableHead>
                  <TableHead>Kusur Tipi</TableHead>
                  <TableHead>Önem Seviyesi</TableHead>
                  <TableHead>Konum</TableHead>
                  <TableHead>Raporlayan</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDefects.map((defect: any) => (
                  <TableRow key={defect.id}>
                    <TableCell className="font-medium">{defect.batchNumber}</TableCell>
                    <TableCell>{defect.defectType}</TableCell>
                    <TableCell>
                      <Badge variant={getSeverityBadgeVariant(defect.severity)}>
                        {defect.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>{defect.location}</TableCell>
                    <TableCell>{getReporterName(defect.reportedById)}</TableCell>
                    <TableCell>{defect.reportDate}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(defect.status)}>
                        {defect.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleViewDefect(defect)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditDefect(defect)}
                        >
                          <Edit className="h-4 w-4" />
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
      
      {/* Yeni Kusur Raporu Modalı */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yeni Kusur Raporu</DialogTitle>
            <DialogDescription>
              Ham kumaşta tespit edilen kusurları raporlayın.
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
                  name="reportDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rapor Tarihi*</FormLabel>
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
                  name="defectType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kusur Tipi*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kusur tipi seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="İplik Hatası">İplik Hatası</SelectItem>
                          <SelectItem value="Örgü Hatası">Örgü Hatası</SelectItem>
                          <SelectItem value="Renk Hatası">Renk Hatası</SelectItem>
                          <SelectItem value="Doku Hatası">Doku Hatası</SelectItem>
                          <SelectItem value="Boyut Hatası">Boyut Hatası</SelectItem>
                          <SelectItem value="Diğer">Diğer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Önem Derecesi*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Önem derecesi seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Düşük">Düşük</SelectItem>
                          <SelectItem value="Orta">Orta</SelectItem>
                          <SelectItem value="Yüksek">Yüksek</SelectItem>
                          <SelectItem value="Kritik">Kritik</SelectItem>
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
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kusur Konumu*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: Sağ kenar, 120cm" {...field} />
                      </FormControl>
                      <FormDescription>
                        Kumaş üzerinde kusurun bulunduğu konumu belirtin
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kusur Boyutu</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: 2x3 cm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reportedById"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Raporlayan*</FormLabel>
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
                          <SelectItem value="Açık">Açık</SelectItem>
                          <SelectItem value="İnceleniyor">İnceleniyor</SelectItem>
                          <SelectItem value="Çözüldü">Çözüldü</SelectItem>
                          <SelectItem value="Kapatıldı">Kapatıldı</SelectItem>
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
                        placeholder="Kusur hakkında detaylı bilgi..."
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
                  disabled={createDefectMutation.isPending}
                >
                  {createDefectMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Oluştur
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Kusur Düzenleme Modalı */}
      {selectedDefect && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Kusur Raporunu Düzenle</DialogTitle>
              <DialogDescription>
                {selectedDefect.batchNumber} numaralı parti için kusur bilgilerini güncelleyin.
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
                    name="reportDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rapor Tarihi*</FormLabel>
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
                    name="defectType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kusur Tipi*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Kusur tipi seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="İplik Hatası">İplik Hatası</SelectItem>
                            <SelectItem value="Örgü Hatası">Örgü Hatası</SelectItem>
                            <SelectItem value="Renk Hatası">Renk Hatası</SelectItem>
                            <SelectItem value="Doku Hatası">Doku Hatası</SelectItem>
                            <SelectItem value="Boyut Hatası">Boyut Hatası</SelectItem>
                            <SelectItem value="Diğer">Diğer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Önem Derecesi*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Önem derecesi seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Düşük">Düşük</SelectItem>
                            <SelectItem value="Orta">Orta</SelectItem>
                            <SelectItem value="Yüksek">Yüksek</SelectItem>
                            <SelectItem value="Kritik">Kritik</SelectItem>
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
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kusur Konumu*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Kumaş üzerinde kusurun bulunduğu konumu belirtin
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kusur Boyutu</FormLabel>
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
                    name="reportedById"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Raporlayan*</FormLabel>
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
                            <SelectItem value="Açık">Açık</SelectItem>
                            <SelectItem value="İnceleniyor">İnceleniyor</SelectItem>
                            <SelectItem value="Çözüldü">Çözüldü</SelectItem>
                            <SelectItem value="Kapatıldı">Kapatıldı</SelectItem>
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
                    disabled={updateDefectMutation.isPending}
                  >
                    {updateDefectMutation.isPending && (
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
      
      {/* Kusur Görüntüleme Modalı */}
      {selectedDefect && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Kusur Raporu Detayları</DialogTitle>
              <DialogDescription>
                {selectedDefect.batchNumber} - {selectedDefect.defectType}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Kusur Bilgileri</h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Parti No:</span>
                      <span className="text-sm font-medium">{selectedDefect.batchNumber}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Kusur Tipi:</span>
                      <span className="text-sm font-medium">{selectedDefect.defectType}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Önem:</span>
                      <Badge variant={getSeverityBadgeVariant(selectedDefect.severity)}>
                        {selectedDefect.severity}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Konum:</span>
                      <span className="text-sm font-medium">{selectedDefect.location}</span>
                    </div>
                    {selectedDefect.size && (
                      <div className="grid grid-cols-2">
                        <span className="text-sm text-muted-foreground">Boyut:</span>
                        <span className="text-sm font-medium">{selectedDefect.size}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Rapor Bilgileri</h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Rapor Tarihi:</span>
                      <span className="text-sm font-medium">{selectedDefect.reportDate}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Raporlayan:</span>
                      <span className="text-sm font-medium">{getReporterName(selectedDefect.reportedById)}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Durum:</span>
                      <Badge variant={getStatusBadgeVariant(selectedDefect.status)}>
                        {selectedDefect.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Notlar</h4>
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                  {selectedDefect.notes || "Not bulunmamaktadır."}
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
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    setTimeout(() => {
                      handleEditDefect(selectedDefect);
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

export default QualityDefectsPage;