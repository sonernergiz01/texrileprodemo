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
import { Loader2, Search, Filter, Plus, CalendarDays, Eye, Check, X } from "lucide-react";

// İş emri şeması - gerçek şema schema.ts dosyasından alınmalıdır
const workOrderSchema = z.object({
  productionPlanId: z.number({
    required_error: "Üretim planı seçilmelidir"
  }),
  weavingMachineId: z.number({
    required_error: "Dokuma makinesi seçilmelidir"
  }),
  status: z.string().default("Beklemede"),
  priority: z.enum(["Düşük", "Normal", "Yüksek", "Acil"]).default("Normal"),
  startDate: z.date({
    required_error: "Başlangıç tarihi gereklidir"
  }),
  estimatedEndDate: z.date({
    required_error: "Tahmini bitiş tarihi gereklidir"
  }),
  notes: z.string().optional(),
  warpPreparationRequired: z.boolean().default(true),
  warpLength: z.number().optional(),
  warpDensity: z.number().optional(),
  weftDensity: z.number().optional(),
  totalWarpEnds: z.number().optional(),
  totalWeftPicks: z.number().optional(),
});

const WeavingWorkOrdersPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>(null);

  // Form tanımlama
  const form = useForm<z.infer<typeof workOrderSchema>>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      status: "Beklemede",
      priority: "Normal",
      startDate: new Date(),
      estimatedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Bir hafta sonrası
      warpPreparationRequired: true,
    },
  });

  // Üretim planlarını çek
  const { data: productionPlans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ["/api/planning/production-plans"],
  });

  // Dokuma makinelerini çek
  const { data: weavingMachines = [], isLoading: isLoadingMachines } = useQuery({
    queryKey: ["/api/weaving/machines"],
  });

  // İş emirlerini çek
  const { data: workOrders = [], isLoading: isLoadingWorkOrders } = useQuery({
    queryKey: ["/api/weaving/work-orders"],
  });

  // İş emri oluşturma
  const createWorkOrderMutation = useMutation({
    mutationFn: async (data: z.infer<typeof workOrderSchema>) => {
      const res = await apiRequest("POST", "/api/weaving/work-orders", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "İş emri başarıyla oluşturuldu",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/weaving/work-orders"] });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "İş emri oluşturulurken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // İş emri durumunu güncelleme
  const updateWorkOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/weaving/work-orders/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "İş emri durumu güncellendi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/weaving/work-orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "İş emri durumu güncellenirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Form gönderme
  const onSubmit = (data: z.infer<typeof workOrderSchema>) => {
    createWorkOrderMutation.mutate(data);
  };

  // Durum filtreleme
  const getFilteredWorkOrders = () => {
    let filtered = [...workOrders];
    
    // Durum tabına göre filtrele
    if (activeTab !== "all") {
      filtered = filtered.filter((order: any) => order.status === activeTab);
    }
    
    // Arama terimine göre filtrele
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((order: any) => 
        order.orderNumber?.toLowerCase().includes(searchLower) ||
        order.notes?.toLowerCase().includes(searchLower) ||
        productionPlans.find((plan: any) => plan.id === order.productionPlanId)?.orderNumber.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  };

  // İş emri detaylarını görüntüleme
  const handleViewDetails = (workOrder: any) => {
    setSelectedWorkOrder(workOrder);
    setIsDetailDialogOpen(true);
  };

  // İş emri başlatma
  const handleStartWorkOrder = (id: number) => {
    updateWorkOrderStatusMutation.mutate({ id, status: "Üretimde" });
  };

  // İş emri tamamlama
  const handleCompleteWorkOrder = (id: number) => {
    updateWorkOrderStatusMutation.mutate({ id, status: "Tamamlandı" });
  };

  // Renderlanacak iş emirleri
  const filteredWorkOrders = getFilteredWorkOrders();

  // Yükleme durumu
  if (isLoadingWorkOrders || isLoadingPlans || isLoadingMachines) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dokuma İş Emirleri" 
        description="Dokuma bölümü için iş emirlerini yönetin"
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="İş emri ara..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Yeni İş Emri
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Tümü</TabsTrigger>
          <TabsTrigger value="Beklemede">Beklemede</TabsTrigger>
          <TabsTrigger value="Hazırlanıyor">Hazırlanıyor</TabsTrigger>
          <TabsTrigger value="Üretimde">Üretimde</TabsTrigger>
          <TabsTrigger value="Tamamlandı">Tamamlandı</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>İş Emirleri</CardTitle>
              <CardDescription>
                {activeTab === "all" 
                  ? "Tüm dokuma iş emirleri" 
                  : `${activeTab} durumundaki iş emirleri`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredWorkOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {activeTab === "all" 
                    ? "Henüz iş emri bulunmamaktadır. Yeni bir iş emri oluşturmak için 'Yeni İş Emri' butonunu kullanın."
                    : `${activeTab} durumunda iş emri bulunmamaktadır.`}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>İş Emri No</TableHead>
                      <TableHead>Sipariş No</TableHead>
                      <TableHead>Makine</TableHead>
                      <TableHead>Öncelik</TableHead>
                      <TableHead>Başlangıç</TableHead>
                      <TableHead>Tahmini Bitiş</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkOrders.map((order: any) => {
                      const productionPlan = productionPlans.find((p: any) => p.id === order.productionPlanId);
                      const machine = weavingMachines.find((m: any) => m.id === order.weavingMachineId);
                      
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.orderNumber}</TableCell>
                          <TableCell>{productionPlan?.orderNumber || "-"}</TableCell>
                          <TableCell>{machine?.name || "-"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.priority === "Acil" 
                                  ? "destructive" 
                                  : order.priority === "Yüksek" 
                                  ? "default" 
                                  : order.priority === "Düşük" 
                                  ? "outline" 
                                  : "secondary"
                              }
                            >
                              {order.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {order.startDate ? format(new Date(order.startDate), "dd.MM.yyyy", { locale: tr }) : "-"}
                          </TableCell>
                          <TableCell>
                            {order.estimatedEndDate ? format(new Date(order.estimatedEndDate), "dd.MM.yyyy", { locale: tr }) : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.status === "Tamamlandı" 
                                  ? "success" 
                                  : order.status === "Üretimde" 
                                  ? "default" 
                                  : order.status === "Hazırlanıyor" 
                                  ? "warning" 
                                  : "outline"
                              }
                            >
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleViewDetails(order)}
                              >
                                <Eye className="h-4 w-4 mr-1" /> Detaylar
                              </Button>
                              {order.status === "Beklemede" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleStartWorkOrder(order.id)}
                                >
                                  <Check className="h-4 w-4 mr-1" /> Başlat
                                </Button>
                              )}
                              {order.status === "Üretimde" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleCompleteWorkOrder(order.id)}
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
      
      {/* Yeni İş Emri Oluşturma Modal */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Yeni Dokuma İş Emri Oluştur</DialogTitle>
            <DialogDescription>
              Dokuma bölümü için yeni bir iş emri oluşturun.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="productionPlanId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Üretim Planı</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Üretim planı seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productionPlans.map((plan: any) => (
                          <SelectItem key={plan.id} value={plan.id.toString()}>
                            {plan.orderNumber} - {plan.description || 'Açıklama yok'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      İş emri oluşturulacak üretim planını seçin
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="weavingMachineId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dokuma Makinesi</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Dokuma makinesi seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {weavingMachines.map((machine: any) => (
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
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Öncelik</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Öncelik seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Düşük">Düşük</SelectItem>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="Yüksek">Yüksek</SelectItem>
                          <SelectItem value="Acil">Acil</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="warpPreparationRequired"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4">
                      <div className="space-y-1 leading-none">
                        <FormLabel>Çözgü Hazırlığı Gerekli</FormLabel>
                        <FormDescription>
                          Bu iş emri için çözgü hazırlığı gerekiyor mu?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="warpLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Çözgü Uzunluğu (m)</FormLabel>
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
                  name="warpDensity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Çözgü Sıklığı (tel/cm)</FormLabel>
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
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weftDensity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Atkı Sıklığı (tel/cm)</FormLabel>
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
                  name="totalWarpEnds"
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
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="İş emri hakkında notlar"
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
                  disabled={createWorkOrderMutation.isPending}
                >
                  {createWorkOrderMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Oluştur
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* İş Emri Detay Modal */}
      {selectedWorkOrder && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>İş Emri Detayları: {selectedWorkOrder.orderNumber}</DialogTitle>
              <DialogDescription>
                İş emri ile ilgili detaylı bilgiler
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">İş Emri Bilgileri</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">İş Emri No:</span>
                    <span className="text-sm font-medium">{selectedWorkOrder.orderNumber}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Durum:</span>
                    <Badge
                      variant={
                        selectedWorkOrder.status === "Tamamlandı" 
                          ? "success" 
                          : selectedWorkOrder.status === "Üretimde" 
                          ? "default" 
                          : selectedWorkOrder.status === "Hazırlanıyor" 
                          ? "warning" 
                          : "outline"
                      }
                    >
                      {selectedWorkOrder.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Öncelik:</span>
                    <Badge
                      variant={
                        selectedWorkOrder.priority === "Acil" 
                          ? "destructive" 
                          : selectedWorkOrder.priority === "Yüksek" 
                          ? "default" 
                          : selectedWorkOrder.priority === "Düşük" 
                          ? "outline" 
                          : "secondary"
                      }
                    >
                      {selectedWorkOrder.priority}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Başlangıç Tarihi:</span>
                    <span className="text-sm font-medium">
                      {format(new Date(selectedWorkOrder.startDate), "dd.MM.yyyy", { locale: tr })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Tahmini Bitiş:</span>
                    <span className="text-sm font-medium">
                      {format(new Date(selectedWorkOrder.estimatedEndDate), "dd.MM.yyyy", { locale: tr })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Dokuma Bilgileri</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Makine:</span>
                    <span className="text-sm font-medium">
                      {weavingMachines.find((m: any) => m.id === selectedWorkOrder.weavingMachineId)?.name || "-"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Çözgü Uzunluğu:</span>
                    <span className="text-sm font-medium">
                      {selectedWorkOrder.warpLength ? `${selectedWorkOrder.warpLength} m` : "-"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Çözgü Sıklığı:</span>
                    <span className="text-sm font-medium">
                      {selectedWorkOrder.warpDensity ? `${selectedWorkOrder.warpDensity} tel/cm` : "-"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Atkı Sıklığı:</span>
                    <span className="text-sm font-medium">
                      {selectedWorkOrder.weftDensity ? `${selectedWorkOrder.weftDensity} tel/cm` : "-"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Toplam Çözgü Teli:</span>
                    <span className="text-sm font-medium">
                      {selectedWorkOrder.totalWarpEnds || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Notlar</h4>
              <p className="text-sm text-muted-foreground">
                {selectedWorkOrder.notes || "Not bulunmamaktadır."}
              </p>
            </div>
            
            <div className="mt-4 flex justify-between">
              <div>
                <h4 className="text-sm font-medium mb-2">İlgili Sipariş</h4>
                <p className="text-sm font-medium">
                  {productionPlans.find((p: any) => p.id === selectedWorkOrder.productionPlanId)?.orderNumber || "-"}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Çözgü Hazırlığı</h4>
                <Badge variant={selectedWorkOrder.warpPreparationRequired ? "default" : "outline"}>
                  {selectedWorkOrder.warpPreparationRequired ? "Gerekli" : "Gerekli Değil"}
                </Badge>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDetailDialogOpen(false)}
              >
                Kapat
              </Button>
              {selectedWorkOrder.status === "Beklemede" && (
                <Button 
                  onClick={() => {
                    handleStartWorkOrder(selectedWorkOrder.id);
                    setIsDetailDialogOpen(false);
                  }}
                >
                  <Check className="mr-2 h-4 w-4" />
                  İş Emrini Başlat
                </Button>
              )}
              {selectedWorkOrder.status === "Üretimde" && (
                <Button 
                  onClick={() => {
                    handleCompleteWorkOrder(selectedWorkOrder.id);
                    setIsDetailDialogOpen(false);
                  }}
                >
                  <Check className="mr-2 h-4 w-4" />
                  İş Emrini Tamamla
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WeavingWorkOrdersPage;