import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

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
  CalendarDays, 
  Eye, 
  Check, 
  X, 
  FileText, 
  Grid3X3, 
  BarChart4 
} from "lucide-react";

// Çözgü hazırlama şeması - gerçek şema schema.ts dosyasından alınmalıdır
const warpPreparationSchema = z.object({
  workOrderId: z.number({
    required_error: "İş emri seçilmelidir"
  }),
  status: z.string().default("Hazırlanıyor"),
  warpingMachineId: z.number({
    required_error: "Çözgü makinesi seçilmelidir"
  }),
  startDate: z.date({
    required_error: "Başlangıç tarihi gereklidir"
  }),
  estimatedEndDate: z.date({
    required_error: "Tahmini bitiş tarihi gereklidir"
  }),
  beamLength: z.number().optional(),
  beamWidth: z.number().optional(),
  beamCount: z.number().default(1),
  yarnType: z.string().optional(),
  yarnCount: z.string().optional(),
  totalEnds: z.number().optional(),
  sectionsCount: z.number().optional(),
  endsPerSection: z.number().optional(),
  notes: z.string().optional(),
});

const WarpPreparationPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedWarpPrep, setSelectedWarpPrep] = useState<any>(null);

  // Form tanımlama
  const form = useForm<z.infer<typeof warpPreparationSchema>>({
    resolver: zodResolver(warpPreparationSchema),
    defaultValues: {
      status: "Hazırlanıyor",
      startDate: new Date(),
      estimatedEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 gün sonrası
      beamCount: 1,
    },
  });

  // İş emirlerini çek (çözgü hazırlığı gerekli olanlar)
  const { data: workOrders = [], isLoading: isLoadingWorkOrders } = useQuery({
    queryKey: ["/api/weaving/work-orders/warp-required"],
  });

  // Çözgü makinelerini çek
  const { data: warpingMachines = [], isLoading: isLoadingMachines } = useQuery({
    queryKey: ["/api/weaving/warping-machines"],
  });

  // Çözgü hazırlama işlerini çek
  const { data: warpPreparations = [], isLoading: isLoadingWarpPreps } = useQuery({
    queryKey: ["/api/weaving/warp-preparations"],
  });

  // Çözgü hazırlama oluşturma
  const createWarpPrepMutation = useMutation({
    mutationFn: async (data: z.infer<typeof warpPreparationSchema>) => {
      const res = await apiRequest("POST", "/api/weaving/warp-preparations", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Çözgü hazırlama işi başarıyla oluşturuldu",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/weaving/warp-preparations"] });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Çözgü hazırlama işi oluşturulurken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Çözgü hazırlama durumunu güncelleme
  const updateWarpPrepStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/weaving/warp-preparations/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Çözgü hazırlama durumu güncellendi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/weaving/warp-preparations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Durum güncellenirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Form gönderme
  const onSubmit = (data: z.infer<typeof warpPreparationSchema>) => {
    createWarpPrepMutation.mutate(data);
  };

  // İş emri seçildiğinde formu güncelle
  const handleWorkOrderChange = (workOrderId: string) => {
    const selectedOrder = workOrders.find((order: any) => order.id === parseInt(workOrderId));
    if (selectedOrder) {
      form.setValue("totalEnds", selectedOrder.totalWarpEnds);
      form.setValue("beamLength", selectedOrder.warpLength);
      form.setValue("beamWidth", selectedOrder.fabricWidth);
    }
  };

  // Durum filtreleme
  const getFilteredWarpPreps = () => {
    let filtered = [...warpPreparations];
    
    // Durum tabına göre filtrele
    if (activeTab !== "all") {
      filtered = filtered.filter((prep: any) => prep.status === activeTab);
    }
    
    // Arama terimine göre filtrele
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((prep: any) => 
        prep.preparationNumber?.toLowerCase().includes(searchLower) ||
        prep.notes?.toLowerCase().includes(searchLower) ||
        workOrders.find((order: any) => order.id === prep.workOrderId)?.orderNumber.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  };

  // Çözgü hazırlama detaylarını görüntüleme
  const handleViewDetails = (warpPrep: any) => {
    setSelectedWarpPrep(warpPrep);
    setIsDetailDialogOpen(true);
  };

  // Çözgü hazırlama işini tamamlama
  const handleCompleteWarpPrep = (id: number) => {
    updateWarpPrepStatusMutation.mutate({ id, status: "Tamamlandı" });
  };

  // Renderlanacak çözgü hazırlama işleri
  const filteredWarpPreps = getFilteredWarpPreps();

  // Yükleme durumu
  if (isLoadingWarpPreps || isLoadingWorkOrders || isLoadingMachines) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Çözgü Hazırlama" 
        description="Dokuma öncesi çözgü hazırlama işlemlerini yönetin"
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Çözgü hazırlama işi ara..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Yeni Çözgü Hazırlama
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Tümü</TabsTrigger>
          <TabsTrigger value="Hazırlanıyor">Hazırlanıyor</TabsTrigger>
          <TabsTrigger value="Tamamlandı">Tamamlandı</TabsTrigger>
          <TabsTrigger value="İptal Edildi">İptal Edildi</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Çözgü Hazırlama İşleri</CardTitle>
              <CardDescription>
                {activeTab === "all" 
                  ? "Tüm çözgü hazırlama işleri" 
                  : `${activeTab} durumundaki çözgü hazırlama işleri`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredWarpPreps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {activeTab === "all" 
                    ? "Henüz çözgü hazırlama işi bulunmamaktadır. Yeni bir iş oluşturmak için 'Yeni Çözgü Hazırlama' butonunu kullanın."
                    : `${activeTab} durumunda çözgü hazırlama işi bulunmamaktadır.`}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hazırlama No</TableHead>
                      <TableHead>İş Emri No</TableHead>
                      <TableHead>Makine</TableHead>
                      <TableHead>Başlangıç</TableHead>
                      <TableHead>Bitiş</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWarpPreps.map((prep: any) => {
                      const workOrder = workOrders.find((order: any) => order.id === prep.workOrderId);
                      const machine = warpingMachines.find((m: any) => m.id === prep.warpingMachineId);
                      
                      return (
                        <TableRow key={prep.id}>
                          <TableCell className="font-medium">{prep.preparationNumber}</TableCell>
                          <TableCell>{workOrder?.orderNumber || "-"}</TableCell>
                          <TableCell>{machine?.name || "-"}</TableCell>
                          <TableCell>
                            {format(new Date(prep.startDate), "dd.MM.yyyy", { locale: tr })}
                          </TableCell>
                          <TableCell>
                            {format(new Date(prep.estimatedEndDate), "dd.MM.yyyy", { locale: tr })}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                prep.status === "Tamamlandı" 
                                  ? "success" 
                                  : prep.status === "Hazırlanıyor" 
                                  ? "default" 
                                  : "destructive"
                              }
                            >
                              {prep.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleViewDetails(prep)}
                              >
                                <Eye className="h-4 w-4 mr-1" /> Detaylar
                              </Button>
                              {prep.status === "Hazırlanıyor" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleCompleteWarpPrep(prep.id)}
                                >
                                  <Check className="h-4 w-4 mr-1" /> Tamamla
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Yeni Çözgü Hazırlama Modal */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Yeni Çözgü Hazırlama İşi</DialogTitle>
            <DialogDescription>
              Dokuma öncesi çözgü hazırlama işi oluşturun.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="workOrderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İş Emri</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(parseInt(value));
                        handleWorkOrderChange(value);
                      }}
                      defaultValue={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="İş emri seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workOrders.map((order: any) => (
                          <SelectItem key={order.id} value={order.id.toString()}>
                            {order.orderNumber} - {order.fabricDescription || 'Açıklama yok'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Çözgü hazırlanacak iş emrini seçin
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="warpingMachineId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Çözgü Makinesi</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Çözgü makinesi seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warpingMachines.map((machine: any) => (
                          <SelectItem key={machine.id} value={machine.id.toString()}>
                            {machine.name} - {machine.type || 'Tip belirtilmemiş'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Başlangıç Tarihi</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            field.onChange(date);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="estimatedEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tahmini Bitiş Tarihi</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            field.onChange(date);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="beamLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Levent Uzunluğu (m)</FormLabel>
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
                  name="beamWidth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Levent Genişliği (cm)</FormLabel>
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
                  name="beamCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Levent Sayısı</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
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
                  name="yarnType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İplik Tipi</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
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
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="totalEnds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Toplam Çözgü Teli</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          value={field.value === undefined ? "" : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sectionsCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bölüm Sayısı</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          value={field.value === undefined ? "" : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endsPerSection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bölüm Başına Tel</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          value={field.value === undefined ? "" : field.value}
                        />
                      </FormControl>
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
                        placeholder="Çözgü hazırlama işi hakkında notlar"
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
                  disabled={createWarpPrepMutation.isPending}
                >
                  {createWarpPrepMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Oluştur
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Çözgü Hazırlama Detay Modal */}
      {selectedWarpPrep && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Çözgü Hazırlama Detayları: {selectedWarpPrep.preparationNumber}</DialogTitle>
              <DialogDescription>
                Çözgü hazırlama işi ile ilgili detaylı bilgiler
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Çözgü Hazırlama Bilgileri</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Hazırlama No:</span>
                    <span className="text-sm font-medium">{selectedWarpPrep.preparationNumber}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Durum:</span>
                    <Badge
                      variant={
                        selectedWarpPrep.status === "Tamamlandı" 
                          ? "success" 
                          : selectedWarpPrep.status === "Hazırlanıyor" 
                          ? "default" 
                          : "destructive"
                      }
                    >
                      {selectedWarpPrep.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Başlangıç Tarihi:</span>
                    <span className="text-sm font-medium">
                      {format(new Date(selectedWarpPrep.startDate), "dd.MM.yyyy", { locale: tr })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Tahmini Bitiş:</span>
                    <span className="text-sm font-medium">
                      {format(new Date(selectedWarpPrep.estimatedEndDate), "dd.MM.yyyy", { locale: tr })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Teknik Bilgiler</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Makine:</span>
                    <span className="text-sm font-medium">
                      {warpingMachines.find((m: any) => m.id === selectedWarpPrep.warpingMachineId)?.name || "-"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">İplik Tipi:</span>
                    <span className="text-sm font-medium">
                      {selectedWarpPrep.yarnType || "-"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">İplik Numarası:</span>
                    <span className="text-sm font-medium">
                      {selectedWarpPrep.yarnCount || "-"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Toplam Çözgü Teli:</span>
                    <span className="text-sm font-medium">
                      {selectedWarpPrep.totalEnds || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Levent Bilgileri</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Levent Sayısı:</span>
                    <span className="text-sm font-medium">{selectedWarpPrep.beamCount || "1"}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Levent Uzunluğu:</span>
                    <span className="text-sm font-medium">
                      {selectedWarpPrep.beamLength ? `${selectedWarpPrep.beamLength} m` : "-"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Levent Genişliği:</span>
                    <span className="text-sm font-medium">
                      {selectedWarpPrep.beamWidth ? `${selectedWarpPrep.beamWidth} cm` : "-"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Bölüm Bilgileri</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Bölüm Sayısı:</span>
                    <span className="text-sm font-medium">{selectedWarpPrep.sectionsCount || "-"}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Bölüm Başına Tel:</span>
                    <span className="text-sm font-medium">{selectedWarpPrep.endsPerSection || "-"}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Notlar</h4>
              <p className="text-sm text-muted-foreground">
                {selectedWarpPrep.notes || "Not bulunmamaktadır."}
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
              {selectedWarpPrep.status === "Hazırlanıyor" && (
                <Button 
                  onClick={() => {
                    handleCompleteWarpPrep(selectedWarpPrep.id);
                    setIsDetailDialogOpen(false);
                  }}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Çözgü Hazırlamayı Tamamla
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WarpPreparationPage;