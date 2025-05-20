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
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  CalendarDays,
  User,
  RefreshCw
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Numune talebi şeması
const sampleRequestSchema = z.object({
  requestNumber: z.string().min(1, "Talep numarası gereklidir"),
  customerId: z.number().min(1, "Müşteri seçilmelidir"),
  requestDate: z.string().min(1, "Talep tarihi gereklidir"),
  dueDate: z.string().min(1, "Termin tarihi gereklidir"),
  sampleType: z.enum(["Dokuma", "İplik", "Kumaş", "Boya", "Diğer"]),
  quantity: z.string().min(1, "Miktar gereklidir"),
  unit: z.string().min(1, "Birim gereklidir"),
  colorRequest: z.string().optional(),
  specificRequirements: z.string().optional(),
  assignedToId: z.number().nullable().optional(),
  status: z.enum(["Yeni", "İşlemde", "Üretimde", "Tamamlandı", "İptal Edildi", "Reddedildi"]).default("Yeni"),
  priority: z.enum(["Düşük", "Normal", "Yüksek", "Acil"]).default("Normal"),
  notes: z.string().optional(),
});

const SampleRequestsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // Form tanımlama
  const form = useForm<z.infer<typeof sampleRequestSchema>>({
    resolver: zodResolver(sampleRequestSchema),
    defaultValues: {
      requestNumber: "",
      customerId: 0,
      requestDate: new Date().toISOString().split('T')[0],
      dueDate: "",
      sampleType: "Dokuma",
      quantity: "",
      unit: "Adet",
      colorRequest: "",
      specificRequirements: "",
      assignedToId: null,
      status: "Yeni",
      priority: "Normal",
      notes: "",
    },
  });

  // Düzenleme formu
  const editForm = useForm<z.infer<typeof sampleRequestSchema>>({
    resolver: zodResolver(sampleRequestSchema),
    defaultValues: {
      requestNumber: "",
      customerId: 0,
      requestDate: "",
      dueDate: "",
      sampleType: "Dokuma",
      quantity: "",
      unit: "Adet",
      colorRequest: "",
      specificRequirements: "",
      assignedToId: null,
      status: "Yeni",
      priority: "Normal",
      notes: "",
    },
  });

  // Numune talepleri verisini çek
  const { data: sampleRequests = [], isLoading: isLoadingSampleRequests } = useQuery({
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

  // Yeni numune talebi oluştur
  const createSampleRequestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof sampleRequestSchema>) => {
      const res = await apiRequest("POST", "/api/samples/requests", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Numune talebi başarıyla oluşturuldu",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/samples/requests"] });
      form.reset({
        requestNumber: "",
        customerId: 0,
        requestDate: new Date().toISOString().split('T')[0],
        dueDate: "",
        sampleType: "Dokuma",
        quantity: "",
        unit: "Adet",
        colorRequest: "",
        specificRequirements: "",
        assignedToId: null,
        status: "Yeni",
        priority: "Normal",
        notes: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Numune talebi oluşturulurken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Numune talebi güncelle
  const updateSampleRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/samples/requests/${selectedRequest.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Numune talebi başarıyla güncellendi",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/samples/requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Numune talebi güncellenirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Durum değiştirme işlemi
  const updateRequestStatus = async (requestId: number, newStatus: string) => {
    try {
      await apiRequest("PATCH", `/api/samples/requests/${requestId}/status`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["/api/samples/requests"] });
      toast({
        title: "Başarılı",
        description: "Numune talebi durumu güncellendi",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Durum güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  // Form gönderme
  const onSubmit = (data: z.infer<typeof sampleRequestSchema>) => {
    createSampleRequestMutation.mutate(data);
  };

  // Form güncelleme
  const onEditSubmit = (data: z.infer<typeof sampleRequestSchema>) => {
    updateSampleRequestMutation.mutate(data);
  };

  // Numune talebini görüntüleme
  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setIsViewDialogOpen(true);
  };

  // Numune talebini düzenleme
  const handleEditRequest = (request: any) => {
    setSelectedRequest(request);
    editForm.reset({
      requestNumber: request.requestNumber,
      customerId: request.customerId,
      requestDate: request.requestDate,
      dueDate: request.dueDate,
      sampleType: request.sampleType,
      quantity: request.quantity,
      unit: request.unit,
      colorRequest: request.colorRequest || "",
      specificRequirements: request.specificRequirements || "",
      assignedToId: request.assignedToId,
      status: request.status,
      priority: request.priority,
      notes: request.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  // Filtreleme
  const getFilteredRequests = () => {
    let filtered = sampleRequests;
    
    // Arama terimine göre filtrele
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((request: any) => 
        request.requestNumber?.toLowerCase().includes(searchLower) ||
        request.sampleType?.toLowerCase().includes(searchLower) ||
        getCustomerName(request.customerId)?.toLowerCase().includes(searchLower)
      );
    }
    
    // Duruma göre filtrele
    if (statusFilter) {
      filtered = filtered.filter((request: any) => request.status === statusFilter);
    }
    
    return filtered;
  };

  // Müşteri adını bul
  const getCustomerName = (customerId: number) => {
    const customer = customers.find((c: any) => c.id === customerId);
    return customer ? customer.name : "Bilinmeyen";
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
      case "Yeni":
        return "secondary";
      case "İşlemde":
        return "default";
      case "Üretimde":
        return "default";
      case "Tamamlandı":
        return "success";
      case "İptal Edildi":
        return "destructive";
      case "Reddedildi":
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
      case "Yeni":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "İşlemde":
        return <RefreshCw className="h-4 w-4 text-indigo-500" />;
      case "Üretimde":
        return <RefreshCw className="h-4 w-4 text-purple-500" />;
      case "Tamamlandı":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "İptal Edildi":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "Reddedildi":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Yükleme durumu
  if (isLoadingSampleRequests) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filtrelenmiş numune talepleri
  const filteredRequests = getFilteredRequests();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Numune Talep Yönetimi" 
        description="Müşteri numune taleplerini yönetin ve takip edin"
      />
      
      <Tabs defaultValue="all">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all" onClick={() => setStatusFilter(null)}>Tümü</TabsTrigger>
            <TabsTrigger value="new" onClick={() => setStatusFilter("Yeni")}>Yeni</TabsTrigger>
            <TabsTrigger value="processing" onClick={() => setStatusFilter("İşlemde")}>İşlemde</TabsTrigger>
            <TabsTrigger value="production" onClick={() => setStatusFilter("Üretimde")}>Üretimde</TabsTrigger>
            <TabsTrigger value="completed" onClick={() => setStatusFilter("Tamamlandı")}>Tamamlandı</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Talep no, müşteri, numune tipi..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Yeni Numune Talebi
            </Button>
          </div>
        </div>
        
        <TabsContent value="all" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>Numune Talepleri</CardTitle>
              <CardDescription>
                Müşterilerden gelen tüm numune talepleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || statusFilter ? 
                    "Arama kriterlerine uygun numune talebi bulunamadı." : 
                    "Henüz numune talebi bulunmamaktadır. Yeni bir talep eklemek için 'Yeni Numune Talebi' butonunu kullanın."
                  }
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Talep No</TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Numune Tipi</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Talep Tarihi</TableHead>
                      <TableHead>Termin</TableHead>
                      <TableHead>Sorumlu</TableHead>
                      <TableHead>Öncelik</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request: any) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.requestNumber}</TableCell>
                        <TableCell>{getCustomerName(request.customerId)}</TableCell>
                        <TableCell>{request.sampleType}</TableCell>
                        <TableCell>{request.quantity} {request.unit}</TableCell>
                        <TableCell>{request.requestDate}</TableCell>
                        <TableCell>{request.dueDate}</TableCell>
                        <TableCell>{getAssigneeName(request.assignedToId)}</TableCell>
                        <TableCell>
                          <Badge variant={getPriorityBadgeVariant(request.priority)}>
                            {request.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(request.status)}
                            <Badge variant={getStatusBadgeVariant(request.status)}>
                              {request.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewRequest(request)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Görüntüle
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditRequest(request)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Düzenle
                              </DropdownMenuItem>
                              
                              <DropdownMenuLabel>Durum Değiştir</DropdownMenuLabel>
                              {request.status === "Yeni" && (
                                <DropdownMenuItem onClick={() => updateRequestStatus(request.id, "İşlemde")}>
                                  <RefreshCw className="h-4 w-4 mr-2 text-indigo-500" />
                                  İşleme Al
                                </DropdownMenuItem>
                              )}
                              {(request.status === "Yeni" || request.status === "İşlemde") && (
                                <DropdownMenuItem onClick={() => updateRequestStatus(request.id, "Üretimde")}>
                                  <RefreshCw className="h-4 w-4 mr-2 text-purple-500" />
                                  Üretime Al
                                </DropdownMenuItem>
                              )}
                              {(request.status !== "Tamamlandı" && request.status !== "İptal Edildi" && request.status !== "Reddedildi") && (
                                <DropdownMenuItem onClick={() => updateRequestStatus(request.id, "Tamamlandı")}>
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                  Tamamlandı Olarak İşaretle
                                </DropdownMenuItem>
                              )}
                              {(request.status !== "İptal Edildi" && request.status !== "Reddedildi") && (
                                <DropdownMenuItem onClick={() => updateRequestStatus(request.id, "İptal Edildi")}>
                                  <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                  İptal Et
                                </DropdownMenuItem>
                              )}
                              {(request.status === "Yeni") && (
                                <DropdownMenuItem onClick={() => updateRequestStatus(request.id, "Reddedildi")}>
                                  <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                  Reddet
                                </DropdownMenuItem>
                              )}
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
        </TabsContent>
        
        <TabsContent value="new" className="m-0">
          {/* Yeni taleplerin içeriği aynı yapıda gösterilir, filtreler tarafından zaten kontrol ediliyor */}
        </TabsContent>
        
        <TabsContent value="processing" className="m-0">
          {/* İşlemdeki taleplerin içeriği */}
        </TabsContent>
        
        <TabsContent value="production" className="m-0">
          {/* Üretimdeki taleplerin içeriği */}
        </TabsContent>
        
        <TabsContent value="completed" className="m-0">
          {/* Tamamlanmış taleplerin içeriği */}
        </TabsContent>
      </Tabs>
      
      {/* Yeni Numune Talebi Modalı */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yeni Numune Talebi</DialogTitle>
            <DialogDescription>
              Yeni bir müşteri numune talebi oluşturun.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="requestNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Talep No*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: NUM-2025-001" {...field} />
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
                  name="requestDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Talep Tarihi*</FormLabel>
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
                
                <div className="flex space-x-2">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem className="flex-1">
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
                      <FormItem className="w-24">
                        <FormLabel>Birim*</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Birim" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Adet">Adet</SelectItem>
                            <SelectItem value="Metre">Metre</SelectItem>
                            <SelectItem value="Kg">Kg</SelectItem>
                            <SelectItem value="Gram">Gram</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="colorRequest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renk Talebi</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ör: RAL 5013 / Kobalt Mavi veya Pantone 19-4045" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Talep edilen renk bilgisini, renk kodu veya renk adıyla belirtin
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                name="specificRequirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Özel Gereksinimler</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Müşterinin numune için talep ettiği özel gereksinimler..."
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Numune talebine dair özel notlar..."
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
                  disabled={createSampleRequestMutation.isPending}
                >
                  {createSampleRequestMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Oluştur
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Numune Talebi Düzenleme Modalı */}
      {selectedRequest && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Numune Talebi Düzenle</DialogTitle>
              <DialogDescription>
                {selectedRequest.requestNumber} numaralı talebi düzenleyin.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="requestNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Talep No*</FormLabel>
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
                    name="requestDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Talep Tarihi*</FormLabel>
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
                  
                  <div className="flex space-x-2">
                    <FormField
                      control={editForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem className="flex-1">
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
                        <FormItem className="w-24">
                          <FormLabel>Birim*</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Birim" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Adet">Adet</SelectItem>
                              <SelectItem value="Metre">Metre</SelectItem>
                              <SelectItem value="Kg">Kg</SelectItem>
                              <SelectItem value="Gram">Gram</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <FormField
                  control={editForm.control}
                  name="colorRequest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Renk Talebi</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Talep edilen renk bilgisini, renk kodu veya renk adıyla belirtin
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                            <SelectItem value="Yeni">Yeni</SelectItem>
                            <SelectItem value="İşlemde">İşlemde</SelectItem>
                            <SelectItem value="Üretimde">Üretimde</SelectItem>
                            <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                            <SelectItem value="İptal Edildi">İptal Edildi</SelectItem>
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
                  name="specificRequirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Özel Gereksinimler</FormLabel>
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
                    disabled={updateSampleRequestMutation.isPending}
                  >
                    {updateSampleRequestMutation.isPending && (
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
      
      {/* Numune Talebi Görüntüleme Modalı */}
      {selectedRequest && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Numune Talebi Detayları</DialogTitle>
              <DialogDescription>
                {selectedRequest.requestNumber} - {getCustomerName(selectedRequest.customerId)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Genel Bilgiler</h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Talep No:</span>
                      <span className="text-sm font-medium">{selectedRequest.requestNumber}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Müşteri:</span>
                      <span className="text-sm font-medium">{getCustomerName(selectedRequest.customerId)}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Numune Tipi:</span>
                      <span className="text-sm font-medium">{selectedRequest.sampleType}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Miktar:</span>
                      <span className="text-sm font-medium">{selectedRequest.quantity} {selectedRequest.unit}</span>
                    </div>
                    {selectedRequest.colorRequest && (
                      <div className="grid grid-cols-2">
                        <span className="text-sm text-muted-foreground">Renk Talebi:</span>
                        <span className="text-sm font-medium">{selectedRequest.colorRequest}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Durum Bilgileri</h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Talep Tarihi:</span>
                      <span className="text-sm font-medium">{selectedRequest.requestDate}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Termin Tarihi:</span>
                      <span className="text-sm font-medium">{selectedRequest.dueDate}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Sorumlu:</span>
                      <span className="text-sm font-medium">{getAssigneeName(selectedRequest.assignedToId)}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Öncelik:</span>
                      <Badge variant={getPriorityBadgeVariant(selectedRequest.priority)}>
                        {selectedRequest.priority}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Durum:</span>
                      <Badge variant={getStatusBadgeVariant(selectedRequest.status)}>
                        {selectedRequest.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedRequest.specificRequirements && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Özel Gereksinimler</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                    {selectedRequest.specificRequirements}
                  </p>
                </div>
              )}
              
              {selectedRequest.notes && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Notlar</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                    {selectedRequest.notes}
                  </p>
                </div>
              )}
              
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
                      handleEditRequest(selectedRequest);
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

export default SampleRequestsPage;