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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Loader2, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash, 
  Eye, 
  FileText, 
  Grid3X3, 
  SquareStack,
  FileTextIcon,
  Copy,
  Pencil,
} from "lucide-react";

// Kumaş tasarımı şeması
const fabricDesignSchema = z.object({
  name: z.string().min(1, "Kumaş adı gereklidir"),
  code: z.string().min(1, "Kumaş kodu gereklidir"),
  warpYarnType: z.string().min(1, "Çözgü iplik tipi gereklidir"),
  weftYarnType: z.string().min(1, "Atkı iplik tipi gereklidir"),
  warpCount: z.string().min(1, "Çözgü iplik numarası gereklidir"),
  weftCount: z.string().min(1, "Atkı iplik numarası gereklidir"),
  warpDensity: z.number().min(1, "Çözgü sıklığı gereklidir"),
  weftDensity: z.number().min(1, "Atkı sıklığı gereklidir"),
  width: z.number().min(1, "Kumaş eni gereklidir"),
  weightPerSquareMeter: z.number().optional(),
  constructionType: z.string().optional(),
  weavePattern: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["Aktif", "Taslak", "Arşiv"]).default("Taslak"),
  imageUrl: z.string().optional(),
  notes: z.string().optional(),
});

const FabricDesignPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedFabricDesign, setSelectedFabricDesign] = useState<any>(null);

  // Form tanımlama
  const form = useForm<z.infer<typeof fabricDesignSchema>>({
    resolver: zodResolver(fabricDesignSchema),
    defaultValues: {
      status: "Taslak",
      warpDensity: 0,
      weftDensity: 0,
      width: 0,
    },
  });

  // Form değiştirme
  const editForm = useForm<z.infer<typeof fabricDesignSchema>>({
    resolver: zodResolver(fabricDesignSchema),
    defaultValues: {
      status: "Taslak",
      warpDensity: 0,
      weftDensity: 0,
      width: 0,
    },
  });

  // İplik Tiplerini çek
  const { data: yarnTypes = [], isLoading: isLoadingYarnTypes } = useQuery({
    queryKey: ["/api/admin/yarn-types"],
  });

  // Dokuma Desenleri çek
  const { data: weavePatterns = [], isLoading: isLoadingWeavePatterns } = useQuery({
    queryKey: ["/api/product-development/weave-patterns"],
  });

  // Kumaş tasarımlarını çek
  const { data: fabricDesigns = [], isLoading: isLoadingFabricDesigns } = useQuery({
    queryKey: ["/api/product-development/fabric-designs"],
  });

  // Kumaş tasarımı oluşturma
  const createFabricDesignMutation = useMutation({
    mutationFn: async (data: z.infer<typeof fabricDesignSchema>) => {
      const res = await apiRequest("POST", "/api/product-development/fabric-designs", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Kumaş tasarımı başarıyla oluşturuldu",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/product-development/fabric-designs"] });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Kumaş tasarımı oluşturulurken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Kumaş tasarımı güncelleme
  const updateFabricDesignMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/product-development/fabric-designs/${selectedFabricDesign.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Kumaş tasarımı başarıyla güncellendi",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/product-development/fabric-designs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Kumaş tasarımı güncellenirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Kumaş tasarımı silme
  const deleteFabricDesignMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/product-development/fabric-designs/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Kumaş tasarımı başarıyla silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/product-development/fabric-designs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Kumaş tasarımı silinirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Form gönderme
  const onSubmit = (data: z.infer<typeof fabricDesignSchema>) => {
    createFabricDesignMutation.mutate(data);
  };

  // Form güncelleme
  const onEditSubmit = (data: z.infer<typeof fabricDesignSchema>) => {
    updateFabricDesignMutation.mutate(data);
  };

  // Düzenleme için açma
  const handleEditFabricDesign = (design: any) => {
    setSelectedFabricDesign(design);
    editForm.reset({
      name: design.name,
      code: design.code,
      warpYarnType: design.warpYarnType,
      weftYarnType: design.weftYarnType,
      warpCount: design.warpCount,
      weftCount: design.weftCount,
      warpDensity: design.warpDensity,
      weftDensity: design.weftDensity,
      width: design.width,
      weightPerSquareMeter: design.weightPerSquareMeter,
      constructionType: design.constructionType,
      weavePattern: design.weavePattern,
      description: design.description,
      status: design.status,
      imageUrl: design.imageUrl,
      notes: design.notes,
    });
    setIsEditDialogOpen(true);
  };

  // Detay görüntüleme
  const handleViewFabricDesign = (design: any) => {
    setSelectedFabricDesign(design);
    setIsDetailDialogOpen(true);
  };

  // Silme onayı
  const handleDeleteFabricDesign = (id: number) => {
    if (window.confirm("Bu kumaş tasarımını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      deleteFabricDesignMutation.mutate(id);
    }
  };

  // Durum filtreleme
  const getFilteredFabricDesigns = () => {
    let filtered = [...fabricDesigns];
    
    // Durum tabına göre filtrele
    if (activeTab !== "all") {
      filtered = filtered.filter((design: any) => design.status === activeTab);
    }
    
    // Arama terimine göre filtrele
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((design: any) => 
        design.name?.toLowerCase().includes(searchLower) ||
        design.code?.toLowerCase().includes(searchLower) ||
        design.description?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  };

  // Yükleme durumu
  if (isLoadingFabricDesigns || isLoadingYarnTypes || isLoadingWeavePatterns) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filtrelenmiş kumaş tasarımları
  const filteredFabricDesigns = getFilteredFabricDesigns();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Kumaş Tasarımları" 
        description="Kumaş türlerini ve özelliklerini yönetin"
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Kumaş ara..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Yeni Kumaş Tasarımı
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Tümü</TabsTrigger>
          <TabsTrigger value="Taslak">Taslak</TabsTrigger>
          <TabsTrigger value="Aktif">Aktif</TabsTrigger>
          <TabsTrigger value="Arşiv">Arşiv</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Kumaş Tasarımları</CardTitle>
              <CardDescription>
                {activeTab === "all" 
                  ? "Tüm kumaş tasarımları" 
                  : `${activeTab} durumundaki kumaş tasarımları`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredFabricDesigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "Arama kriterlerine uygun kumaş tasarımı bulunamadı." : "Henüz kumaş tasarımı bulunmamaktadır. Yeni bir tasarım eklemek için 'Yeni Kumaş Tasarımı' butonunu kullanın."}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Kod</TableHead>
                      <TableHead>Kumaş Adı</TableHead>
                      <TableHead>Çözgü/Atkı</TableHead>
                      <TableHead>Sıklık (tel/cm)</TableHead>
                      <TableHead>En (cm)</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFabricDesigns.map((design: any) => (
                      <TableRow key={design.id}>
                        <TableCell className="font-medium">{design.code}</TableCell>
                        <TableCell>{design.name}</TableCell>
                        <TableCell>
                          {design.warpYarnType}/{design.weftYarnType}
                        </TableCell>
                        <TableCell>
                          {design.warpDensity}×{design.weftDensity}
                        </TableCell>
                        <TableCell>{design.width}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              design.status === "Aktif" 
                                ? "default" 
                                : design.status === "Taslak" 
                                ? "outline" 
                                : "secondary"
                            }
                          >
                            {design.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleViewFabricDesign(design)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditFabricDesign(design)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDeleteFabricDesign(design.id)}
                            >
                              <Trash className="h-4 w-4" />
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
      </Tabs>
      
      {/* Yeni Kumaş Tasarımı Modal */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Yeni Kumaş Tasarımı Ekle</DialogTitle>
            <DialogDescription>
              Yeni bir kumaş tasarımı oluşturun. Kumaş kodu ve adı benzersiz olmalıdır.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kumaş Kodu*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: FB-001" {...field} />
                      </FormControl>
                      <FormDescription>
                        Benzersiz bir kod girin
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kumaş Adı*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: Pamuklu Poplin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="warpYarnType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Çözgü İplik Tipi*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="İplik tipi seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {yarnTypes.map((type: any) => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.name}
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
                  name="weftYarnType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Atkı İplik Tipi*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="İplik tipi seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {yarnTypes.map((type: any) => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.name}
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
                  name="warpCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Çözgü İplik Numarası*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: Ne 30/1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="weftCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Atkı İplik Numarası*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: Ne 20/1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="warpDensity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Çözgü Sıklığı (tel/cm)*</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="weftDensity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Atkı Sıklığı (tel/cm)*</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
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
                      <FormLabel>Kumaş Eni (cm)*</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weightPerSquareMeter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gramaj (g/m²)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          value={field.value === undefined ? "" : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="constructionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yapı Türü</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Yapı türü seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Bezayağı">Bezayağı</SelectItem>
                          <SelectItem value="Dimi">Dimi</SelectItem>
                          <SelectItem value="Saten">Saten</SelectItem>
                          <SelectItem value="Kadife">Kadife</SelectItem>
                          <SelectItem value="Krep">Krep</SelectItem>
                          <SelectItem value="Diğer">Diğer</SelectItem>
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
                  name="weavePattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dokuma Deseni</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Desen seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {weavePatterns.map((pattern: any) => (
                            <SelectItem key={pattern.id} value={pattern.name}>
                              {pattern.name}
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
                      <FormLabel>Durum</FormLabel>
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
                          <SelectItem value="Taslak">Taslak</SelectItem>
                          <SelectItem value="Aktif">Aktif</SelectItem>
                          <SelectItem value="Arşiv">Arşiv</SelectItem>
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
                    <FormLabel>Açıklama</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Kumaş hakkında detaylı bilgi girin"
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
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
                        placeholder="Ekstra notlar"
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
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
                  disabled={createFabricDesignMutation.isPending}
                >
                  {createFabricDesignMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Oluştur
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Kumaş Düzenleme Modal */}
      {selectedFabricDesign && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Kumaş Tasarımını Düzenle</DialogTitle>
              <DialogDescription>
                Mevcut kumaş tasarımının bilgilerini güncelleyin.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                {/* Aynı form alanları (oluşturmadaki gibi) */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kumaş Kodu*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kumaş Adı*</FormLabel>
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
                    name="warpYarnType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Çözgü İplik Tipi*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="İplik tipi seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {yarnTypes.map((type: any) => (
                              <SelectItem key={type.id} value={type.name}>
                                {type.name}
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
                    name="weftYarnType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Atkı İplik Tipi*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="İplik tipi seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {yarnTypes.map((type: any) => (
                              <SelectItem key={type.id} value={type.name}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={editForm.control}
                    name="warpDensity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Çözgü Sıklığı (tel/cm)*</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="weftDensity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Atkı Sıklığı (tel/cm)*</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durum</FormLabel>
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
                            <SelectItem value="Taslak">Taslak</SelectItem>
                            <SelectItem value="Aktif">Aktif</SelectItem>
                            <SelectItem value="Arşiv">Arşiv</SelectItem>
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
                      <FormLabel>Açıklama</FormLabel>
                      <FormControl>
                        <Textarea
                          className="resize-none"
                          {...field}
                          value={field.value || ""}
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
                    disabled={updateFabricDesignMutation.isPending}
                  >
                    {updateFabricDesignMutation.isPending && (
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
      
      {/* Kumaş Detay Modal */}
      {selectedFabricDesign && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Kumaş Tasarım Detayları</DialogTitle>
              <DialogDescription>
                {selectedFabricDesign.code} - {selectedFabricDesign.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Genel Bilgiler</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Kumaş Kodu:</span>
                    <span className="text-sm font-medium">{selectedFabricDesign.code}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Kumaş Adı:</span>
                    <span className="text-sm font-medium">{selectedFabricDesign.name}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Durum:</span>
                    <Badge
                      variant={
                        selectedFabricDesign.status === "Aktif" 
                          ? "default" 
                          : selectedFabricDesign.status === "Taslak" 
                          ? "outline" 
                          : "secondary"
                      }
                    >
                      {selectedFabricDesign.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Yapı Türü:</span>
                    <span className="text-sm font-medium">{selectedFabricDesign.constructionType || "-"}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Dokuma Deseni:</span>
                    <span className="text-sm font-medium">{selectedFabricDesign.weavePattern || "-"}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Teknik Bilgiler</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Çözgü İplik:</span>
                    <span className="text-sm font-medium">{selectedFabricDesign.warpYarnType} {selectedFabricDesign.warpCount}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Atkı İplik:</span>
                    <span className="text-sm font-medium">{selectedFabricDesign.weftYarnType} {selectedFabricDesign.weftCount}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Çözgü Sıklığı:</span>
                    <span className="text-sm font-medium">{selectedFabricDesign.warpDensity} tel/cm</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Atkı Sıklığı:</span>
                    <span className="text-sm font-medium">{selectedFabricDesign.weftDensity} tel/cm</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Kumaş Eni:</span>
                    <span className="text-sm font-medium">{selectedFabricDesign.width} cm</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Gramaj:</span>
                    <span className="text-sm font-medium">{selectedFabricDesign.weightPerSquareMeter ? `${selectedFabricDesign.weightPerSquareMeter} g/m²` : "-"}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Açıklama</h4>
              <p className="text-sm text-muted-foreground">
                {selectedFabricDesign.description || "Açıklama bulunmamaktadır."}
              </p>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Notlar</h4>
              <p className="text-sm text-muted-foreground">
                {selectedFabricDesign.notes || "Not bulunmamaktadır."}
              </p>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDetailDialogOpen(false)}
              >
                Kapat
              </Button>
              <Button 
                onClick={() => {
                  setIsDetailDialogOpen(false);
                  handleEditFabricDesign(selectedFabricDesign);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Düzenle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FabricDesignPage;