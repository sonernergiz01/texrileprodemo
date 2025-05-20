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
  PlayCircle,
  PauseCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  ClockIcon,
  Layers,
  BarChart,
  CalendarDays,
  Edit,
  Calendar,
  User
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// İş emri şeması
const workOrderSchema = z.object({
  orderNumber: z.string().min(1, "Sipariş numarası gereklidir"),
  orderDate: z.string().min(1, "Sipariş tarihi gereklidir"),
  dueDate: z.string().min(1, "Termin tarihi gereklidir"),
  customerId: z.number().min(1, "Müşteri seçilmelidir"),
  yarnType: z.string().min(1, "İplik türü gereklidir"),
  count: z.string().min(1, "İplik numarası gereklidir"), 
  twistAmount: z.string().min(1, "Büküm miktarı gereklidir"),
  twistDirection: z.enum(["S", "Z"]),
  quantity: z.string().min(1, "Miktar gereklidir"),
  unit: z.string().min(1, "Birim gereklidir"),
  assignedToId: z.number().nullable().optional(),
  notes: z.string().optional(),
  status: z.enum(["Beklemede", "Planlandı", "Üretimde", "Tamamlandı", "İptal Edildi"]).default("Beklemede"),
  priority: z.enum(["Düşük", "Normal", "Yüksek", "Acil"]).default("Normal"),
});

const YarnSpinningWorkOrdersPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>(null);

  // Form tanımlama
  const form = useForm<z.infer<typeof workOrderSchema>>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      orderNumber: "",
      orderDate: new Date().toISOString().split('T')[0],
      dueDate: "",
      customerId: 0,
      yarnType: "",
      count: "",
      twistAmount: "",
      twistDirection: "Z",
      quantity: "",
      unit: "Kg",
      assignedToId: null,
      notes: "",
      status: "Beklemede",
      priority: "Normal",
    },
  });

  // Düzenleme formu
  const editForm = useForm<z.infer<typeof workOrderSchema>>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      orderNumber: "",
      orderDate: "",
      dueDate: "",
      customerId: 0,
      yarnType: "",
      count: "",
      twistAmount: "",
      twistDirection: "Z",
      quantity: "",
      unit: "Kg",
      assignedToId: null,
      notes: "",
      status: "Beklemede",
      priority: "Normal",
    },
  });

  // İş emirleri verisini çek
  const { data: workOrders = [], isLoading: isLoadingWorkOrders } = useQuery({
    queryKey: ["/api/yarn-spinning/work-orders"],
  });

  // Müşterileri çek
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });

  // Operatörleri çek
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Yeni iş emri oluştur
  const createWorkOrderMutation = useMutation({
    mutationFn: async (data: z.infer<typeof workOrderSchema>) => {
      const res = await apiRequest("POST", "/api/yarn-spinning/work-orders", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "İş emri başarıyla oluşturuldu",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-spinning/work-orders"] });
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

  // İş emri güncelle
  const updateWorkOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/yarn-spinning/work-orders/${selectedWorkOrder.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "İş emri başarıyla güncellendi",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-spinning/work-orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "İş emri güncellenirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Form gönderme
  const onSubmit = (data: z.infer<typeof workOrderSchema>) => {
    createWorkOrderMutation.mutate(data);
  };

  // Form güncelleme
  const onEditSubmit = (data: z.infer<typeof workOrderSchema>) => {
    updateWorkOrderMutation.mutate(data);
  };

  // İş emri düzenleme
  const handleEditWorkOrder = (workOrder: any) => {
    setSelectedWorkOrder(workOrder);
    editForm.reset({
      orderNumber: workOrder.orderNumber,
      orderDate: workOrder.orderDate,
      dueDate: workOrder.dueDate,
      customerId: workOrder.customerId,
      yarnType: workOrder.yarnType,
      count: workOrder.count,
      twistAmount: workOrder.twistAmount,
      twistDirection: workOrder.twistDirection,
      quantity: workOrder.quantity,
      unit: workOrder.unit,
      assignedToId: workOrder.assignedToId,
      notes: workOrder.notes || "",
      status: workOrder.status,
      priority: workOrder.priority,
    });
    setIsEditDialogOpen(true);
  };

  // Durum değiştirme işlemi
  const updateWorkOrderStatus = async (workOrderId: number, newStatus: string) => {
    try {
      await apiRequest("PATCH", `/api/yarn-spinning/work-orders/${workOrderId}/status`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-spinning/work-orders"] });
      toast({
        title: "Başarılı",
        description: "İş emri durumu güncellendi",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Durum güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  // Filtreleme
  const getFilteredWorkOrders = () => {
    let filtered = workOrders;
    
    // Arama terimine göre filtrele
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((workOrder: any) => 
        workOrder.orderNumber?.toLowerCase().includes(searchLower) ||
        workOrder.yarnType?.toLowerCase().includes(searchLower) ||
        getCustomerName(workOrder.customerId)?.toLowerCase().includes(searchLower)
      );
    }
    
    // Duruma göre filtrele
    if (statusFilter) {
      filtered = filtered.filter((workOrder: any) => workOrder.status === statusFilter);
    }
    
    return filtered;
  };

  // Müşteri adını bul
  const getCustomerName = (customerId: number) => {
    const customer = customers.find((c: any) => c.id === customerId);
    return customer ? customer.name : "Bilinmeyen";
  };

  // Operatör adını bul
  const getAssigneeName = (assignedToId: number | null) => {
    if (!assignedToId) return "-";
    const user = users.find((u: any) => u.id === assignedToId);
    return user ? user.fullName : "Bilinmeyen";
  };

  // Durum rozeti renkleri
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Beklemede":
        return "outline";
      case "Planlandı":
        return "secondary";
      case "Üretimde":
        return "default";
      case "Tamamlandı":
        return "success";
      case "İptal Edildi":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Öncelik rozeti renkleri
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "Düşük":
        return "outline";
      case "Normal":
        return "secondary";
      case "Yüksek":
        return "default";
      case "Acil":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Durum ikonu
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Beklemede":
        return <ClockIcon className="h-4 w-4 text-muted-foreground" />;
      case "Planlandı":
        return <Calendar className="h-4 w-4 text-primary" />;
      case "Üretimde":
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case "Tamamlandı":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "İptal Edildi":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Yükleme durumu
  if (isLoadingWorkOrders) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filtrelenmiş iş emirleri
  const filteredWorkOrders = getFilteredWorkOrders();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="İplik Büküm İş Emirleri" 
        description="İplikhane ve büküm bölümü iş emirlerini yönetin"
      />
      
      <Tabs defaultValue="all">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all" onClick={() => setStatusFilter(null)}>Tümü</TabsTrigger>
            <TabsTrigger value="waiting" onClick={() => setStatusFilter("Beklemede")}>Beklemede</TabsTrigger>
            <TabsTrigger value="planned" onClick={() => setStatusFilter("Planlandı")}>Planlandı</TabsTrigger>
            <TabsTrigger value="inProgress" onClick={() => setStatusFilter("Üretimde")}>Üretimde</TabsTrigger>
            <TabsTrigger value="completed" onClick={() => setStatusFilter("Tamamlandı")}>Tamamlandı</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Sipariş no, iplik türü..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Yeni İş Emri
            </Button>
          </div>
        </div>
        
        <TabsContent value="all" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>İplik Büküm İş Emirleri</CardTitle>
              <CardDescription>
                İplik bükümü ve iplikhane üretim emirleri listesi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredWorkOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || statusFilter ? 
                    "Arama kriterlerine uygun iş emri bulunamadı." : 
                    "Henüz iş emri bulunmamaktadır. Yeni bir iş emri eklemek için 'Yeni İş Emri' butonunu kullanın."
                  }
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sipariş No</TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>İplik</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Termin</TableHead>
                      <TableHead>Sorumlu</TableHead>
                      <TableHead>Öncelik</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkOrders.map((workOrder: any) => (
                      <TableRow key={workOrder.id}>
                        <TableCell className="font-medium">{workOrder.orderNumber}</TableCell>
                        <TableCell>{getCustomerName(workOrder.customerId)}</TableCell>
                        <TableCell>
                          {workOrder.yarnType} {workOrder.count} / {workOrder.twistDirection}
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {workOrder.twistAmount} T/m
                          </div>
                        </TableCell>
                        <TableCell>{workOrder.quantity} {workOrder.unit}</TableCell>
                        <TableCell>{workOrder.dueDate}</TableCell>
                        <TableCell>{getAssigneeName(workOrder.assignedToId)}</TableCell>
                        <TableCell>
                          <Badge variant={getPriorityBadgeVariant(workOrder.priority)}>
                            {workOrder.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(workOrder.status)}
                            <Badge variant={getStatusBadgeVariant(workOrder.status)}>
                              {workOrder.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditWorkOrder(workOrder)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {workOrder.status === "Beklemede" && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => updateWorkOrderStatus(workOrder.id, "Planlandı")}
                                title="Planla"
                              >
                                <Calendar className="h-4 w-4 text-primary" />
                              </Button>
                            )}
                            {workOrder.status === "Planlandı" && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => updateWorkOrderStatus(workOrder.id, "Üretimde")}
                                title="Üretime Başla"
                              >
                                <PlayCircle className="h-4 w-4 text-blue-500" />
                              </Button>
                            )}
                            {workOrder.status === "Üretimde" && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => updateWorkOrderStatus(workOrder.id, "Tamamlandı")}
                                title="Tamamlandı"
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
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
        
        <TabsContent value="waiting" className="m-0">
          {/* Bekleyenlerin içeriği aynı yapıda gösterilir, filtreler tarafından zaten kontrol ediliyor */}
        </TabsContent>
        
        <TabsContent value="planned" className="m-0">
          {/* Planlanmış emirlerin içeriği */}
        </TabsContent>
        
        <TabsContent value="inProgress" className="m-0">
          {/* Üretimdeki emirlerin içeriği */}
        </TabsContent>
        
        <TabsContent value="completed" className="m-0">
          {/* Tamamlanmış emirlerin içeriği */}
        </TabsContent>
      </Tabs>
      
      {/* Yeni İş Emri Modalı */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yeni İplik Büküm İş Emri</DialogTitle>
            <DialogDescription>
              Yeni bir iplik büküm iş emri oluşturun.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sipariş No*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: IPL-2025-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="orderDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sipariş Tarihi*</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Termin Tarihi*</FormLabel>
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
                  name="yarnType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İplik Türü*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: 100% Pamuk" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İplik Numarası*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: Ne 30/1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="twistAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Büküm Miktarı*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: 800" {...field} />
                      </FormControl>
                      <FormDescription>Tur/metre cinsinden</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="twistDirection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Büküm Yönü*</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Büküm yönü seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Z">Z (Sağ)</SelectItem>
                          <SelectItem value="S">S (Sol)</SelectItem>
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
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Miktar*</FormLabel>
                      <FormControl>
                        <Input type="text" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birim*</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Birim seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Kg">Kg</SelectItem>
                          <SelectItem value="Adet">Adet</SelectItem>
                          <SelectItem value="Bobin">Bobin</SelectItem>
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
                            <SelectValue placeholder="Sorumlu operatör seçin" />
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
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Öncelik*</FormLabel>
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
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="İş emrine dair özel notlar..."
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
      
      {/* İş Emri Düzenleme Modalı */}
      {selectedWorkOrder && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>İş Emri Düzenle</DialogTitle>
              <DialogDescription>
                {selectedWorkOrder.orderNumber} numaralı iş emrini düzenleyin.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="orderNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sipariş No*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="orderDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sipariş Tarihi*</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Termin Tarihi*</FormLabel>
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
                    name="yarnType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İplik Türü*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İplik Numarası*</FormLabel>
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
                    name="twistAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Büküm Miktarı*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>Tur/metre cinsinden</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="twistDirection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Büküm Yönü*</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Büküm yönü seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Z">Z (Sağ)</SelectItem>
                            <SelectItem value="S">S (Sol)</SelectItem>
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
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Miktar*</FormLabel>
                        <FormControl>
                          <Input type="text" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birim*</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Birim seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Kg">Kg</SelectItem>
                            <SelectItem value="Adet">Adet</SelectItem>
                            <SelectItem value="Bobin">Bobin</SelectItem>
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
                              <SelectValue placeholder="Sorumlu operatör seçin" />
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
                            <SelectItem value="Planlandı">Planlandı</SelectItem>
                            <SelectItem value="Üretimde">Üretimde</SelectItem>
                            <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                            <SelectItem value="İptal Edildi">İptal Edildi</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={editForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Öncelik*</FormLabel>
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
                    disabled={updateWorkOrderMutation.isPending}
                  >
                    {updateWorkOrderMutation.isPending && (
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
    </div>
  );
};

export default YarnSpinningWorkOrdersPage;