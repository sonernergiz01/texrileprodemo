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
  Settings,
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Activity,
  Clock,
  RotateCw,
  Wrench
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Makine şeması
const machineSchema = z.object({
  name: z.string().min(1, "Makine adı gereklidir"),
  machineNo: z.string().min(1, "Makine numarası gereklidir"),
  type: z.enum(["Ring", "Open-End", "Büküm", "Çözgü", "Bobin", "Diğer"]),
  manufacturer: z.string().min(1, "Üretici gereklidir"),
  model: z.string().min(1, "Model gereklidir"),
  yearOfManufacture: z.string().min(1, "Üretim yılı gereklidir"),
  maxSpeed: z.string().min(1, "Maksimum hız gereklidir"),
  speedUnit: z.string().min(1, "Hız birimi gereklidir"),
  capacity: z.string().min(1, "Kapasite gereklidir"),
  capacityUnit: z.string().min(1, "Kapasite birimi gereklidir"),
  location: z.string().min(1, "Konum gereklidir"),
  status: z.enum(["Aktif", "Bakımda", "Arızalı", "Devre Dışı"]).default("Aktif"),
  maintenanceSchedule: z.string().optional(),
  notes: z.string().optional(),
});

const YarnSpinningMachinesPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);

  // Form tanımlama
  const form = useForm<z.infer<typeof machineSchema>>({
    resolver: zodResolver(machineSchema),
    defaultValues: {
      name: "",
      machineNo: "",
      type: "Ring",
      manufacturer: "",
      model: "",
      yearOfManufacture: "",
      maxSpeed: "",
      speedUnit: "rpm",
      capacity: "",
      capacityUnit: "kg/gün",
      location: "İplikhane",
      status: "Aktif",
      maintenanceSchedule: "",
      notes: "",
    },
  });

  // Düzenleme formu
  const editForm = useForm<z.infer<typeof machineSchema>>({
    resolver: zodResolver(machineSchema),
    defaultValues: {
      name: "",
      machineNo: "",
      type: "Ring",
      manufacturer: "",
      model: "",
      yearOfManufacture: "",
      maxSpeed: "",
      speedUnit: "rpm",
      capacity: "",
      capacityUnit: "kg/gün",
      location: "İplikhane",
      status: "Aktif",
      maintenanceSchedule: "",
      notes: "",
    },
  });

  // Makineler verisini çek
  const { data: machines = [], isLoading: isLoadingMachines } = useQuery({
    queryKey: ["/api/yarn-spinning/machines"],
  });

  // Yeni makine oluştur
  const createMachineMutation = useMutation({
    mutationFn: async (data: z.infer<typeof machineSchema>) => {
      const res = await apiRequest("POST", "/api/yarn-spinning/machines", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Makine başarıyla oluşturuldu",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-spinning/machines"] });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Makine oluşturulurken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Makine güncelle
  const updateMachineMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/yarn-spinning/machines/${selectedMachine.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Makine başarıyla güncellendi",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-spinning/machines"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Makine güncellenirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Makine sil
  const deleteMachineMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/yarn-spinning/machines/${selectedMachine.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Makine başarıyla silindi",
      });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-spinning/machines"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Makine silinirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Form gönderme
  const onSubmit = (data: z.infer<typeof machineSchema>) => {
    createMachineMutation.mutate(data);
  };

  // Form güncelleme
  const onEditSubmit = (data: z.infer<typeof machineSchema>) => {
    updateMachineMutation.mutate(data);
  };

  // Makine düzenleme
  const handleEditMachine = (machine: any) => {
    setSelectedMachine(machine);
    editForm.reset({
      name: machine.name,
      machineNo: machine.machineNo,
      type: machine.type,
      manufacturer: machine.manufacturer,
      model: machine.model,
      yearOfManufacture: machine.yearOfManufacture,
      maxSpeed: machine.maxSpeed,
      speedUnit: machine.speedUnit,
      capacity: machine.capacity,
      capacityUnit: machine.capacityUnit,
      location: machine.location,
      status: machine.status,
      maintenanceSchedule: machine.maintenanceSchedule || "",
      notes: machine.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  // Makine silme
  const handleDeleteMachine = (machine: any) => {
    setSelectedMachine(machine);
    setIsDeleteDialogOpen(true);
  };

  // Makine durumu değiştirme
  const updateMachineStatus = async (machineId: number, newStatus: string) => {
    try {
      await apiRequest("PATCH", `/api/yarn-spinning/machines/${machineId}/status`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-spinning/machines"] });
      toast({
        title: "Başarılı",
        description: "Makine durumu güncellendi",
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
  const getFilteredMachines = () => {
    let filtered = machines;
    
    // Arama terimine göre filtrele
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((machine: any) => 
        machine.name?.toLowerCase().includes(searchLower) ||
        machine.machineNo?.toLowerCase().includes(searchLower) ||
        machine.model?.toLowerCase().includes(searchLower) ||
        machine.manufacturer?.toLowerCase().includes(searchLower)
      );
    }
    
    // Makine tipine göre filtrele
    if (typeFilter) {
      filtered = filtered.filter((machine: any) => machine.type === typeFilter);
    }
    
    // Duruma göre filtrele
    if (statusFilter) {
      filtered = filtered.filter((machine: any) => machine.status === statusFilter);
    }
    
    return filtered;
  };

  // Durum rozeti renkleri
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Aktif":
        return "success";
      case "Bakımda":
        return "warning";
      case "Arızalı":
        return "destructive";
      case "Devre Dışı":
        return "outline";
      default:
        return "secondary";
    }
  };

  // Durum ikonu
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Aktif":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Bakımda":
        return <Wrench className="h-4 w-4 text-yellow-500" />;
      case "Arızalı":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "Devre Dışı":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  // Yükleme durumu
  if (isLoadingMachines) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filtrelenmiş makineler
  const filteredMachines = getFilteredMachines();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="İplikhane ve Büküm Makineleri" 
        description="İplik üretim ve büküm makinelerini yönetin"
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Makine adı, numarası, model..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">Makine Tipi</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Makine Tipi</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={typeFilter === null}
                onCheckedChange={() => setTypeFilter(null)}
              >
                Tümü
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter === "Ring"}
                onCheckedChange={() => setTypeFilter(typeFilter === "Ring" ? null : "Ring")}
              >
                Ring
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter === "Open-End"}
                onCheckedChange={() => setTypeFilter(typeFilter === "Open-End" ? null : "Open-End")}
              >
                Open-End
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter === "Büküm"}
                onCheckedChange={() => setTypeFilter(typeFilter === "Büküm" ? null : "Büküm")}
              >
                Büküm
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter === "Çözgü"}
                onCheckedChange={() => setTypeFilter(typeFilter === "Çözgü" ? null : "Çözgü")}
              >
                Çözgü
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter === "Bobin"}
                onCheckedChange={() => setTypeFilter(typeFilter === "Bobin" ? null : "Bobin")}
              >
                Bobin
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
              <Button variant="outline" size="sm" className="h-9">Durum</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Durum</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={statusFilter === null}
                onCheckedChange={() => setStatusFilter(null)}
              >
                Tümü
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === "Aktif"}
                onCheckedChange={() => setStatusFilter(statusFilter === "Aktif" ? null : "Aktif")}
              >
                Aktif
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === "Bakımda"}
                onCheckedChange={() => setStatusFilter(statusFilter === "Bakımda" ? null : "Bakımda")}
              >
                Bakımda
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === "Arızalı"}
                onCheckedChange={() => setStatusFilter(statusFilter === "Arızalı" ? null : "Arızalı")}
              >
                Arızalı
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === "Devre Dışı"}
                onCheckedChange={() => setStatusFilter(statusFilter === "Devre Dışı" ? null : "Devre Dışı")}
              >
                Devre Dışı
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Yeni Makine
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>İplikhane ve Büküm Makineleri</CardTitle>
          <CardDescription>
            İplik üretim ve büküm makinelerinin listesi ve durumları
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMachines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || typeFilter || statusFilter ? 
                "Arama kriterlerine uygun makine bulunamadı." : 
                "Henüz makine bulunmamaktadır. Yeni bir makine eklemek için 'Yeni Makine' butonunu kullanın."
              }
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Makine No</TableHead>
                  <TableHead>Makine Adı</TableHead>
                  <TableHead>Tipi</TableHead>
                  <TableHead>Üretici/Model</TableHead>
                  <TableHead>Kapasite</TableHead>
                  <TableHead>Konum</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMachines.map((machine: any) => (
                  <TableRow key={machine.id}>
                    <TableCell className="font-medium">{machine.machineNo}</TableCell>
                    <TableCell>{machine.name}</TableCell>
                    <TableCell>{machine.type}</TableCell>
                    <TableCell>
                      {machine.manufacturer} / {machine.model}
                      <div className="text-xs text-muted-foreground">
                        Üretim Yılı: {machine.yearOfManufacture}
                      </div>
                    </TableCell>
                    <TableCell>
                      {machine.capacity} {machine.capacityUnit}
                      <div className="text-xs text-muted-foreground">
                        Maks. Hız: {machine.maxSpeed} {machine.speedUnit}
                      </div>
                    </TableCell>
                    <TableCell>{machine.location}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(machine.status)}
                        <Badge variant={getStatusBadgeVariant(machine.status)}>
                          {machine.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditMachine(machine)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteMachine(machine)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Sil
                          </DropdownMenuItem>
                          <DropdownMenuLabel>Durum Değiştir</DropdownMenuLabel>
                          {machine.status !== "Aktif" && (
                            <DropdownMenuItem onClick={() => updateMachineStatus(machine.id, "Aktif")}>
                              <Play className="h-4 w-4 mr-2 text-green-500" />
                              Aktif Duruma Al
                            </DropdownMenuItem>
                          )}
                          {machine.status !== "Bakımda" && (
                            <DropdownMenuItem onClick={() => updateMachineStatus(machine.id, "Bakımda")}>
                              <Wrench className="h-4 w-4 mr-2 text-yellow-500" />
                              Bakım Durumuna Al
                            </DropdownMenuItem>
                          )}
                          {machine.status !== "Arızalı" && (
                            <DropdownMenuItem onClick={() => updateMachineStatus(machine.id, "Arızalı")}>
                              <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                              Arızalı Olarak İşaretle
                            </DropdownMenuItem>
                          )}
                          {machine.status !== "Devre Dışı" && (
                            <DropdownMenuItem onClick={() => updateMachineStatus(machine.id, "Devre Dışı")}>
                              <Pause className="h-4 w-4 mr-2 text-gray-500" />
                              Devre Dışı Bırak
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
      
      {/* Yeni Makine Modalı */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yeni Makine Ekle</DialogTitle>
            <DialogDescription>
              İplikhane veya büküm bölümüne yeni bir makine ekleyin.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Makine Adı*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: Ring İplik 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="machineNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Makine Numarası*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: IPL-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Makine Tipi*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Makine tipi seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Ring">Ring</SelectItem>
                          <SelectItem value="Open-End">Open-End</SelectItem>
                          <SelectItem value="Büküm">Büküm</SelectItem>
                          <SelectItem value="Çözgü">Çözgü</SelectItem>
                          <SelectItem value="Bobin">Bobin</SelectItem>
                          <SelectItem value="Diğer">Diğer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konum*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: İplikhane A Bölümü" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Üretici*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: Rieter" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: G 32" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="yearOfManufacture"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Üretim Yılı*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: 2018" {...field} />
                      </FormControl>
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
                          <SelectItem value="Aktif">Aktif</SelectItem>
                          <SelectItem value="Bakımda">Bakımda</SelectItem>
                          <SelectItem value="Arızalı">Arızalı</SelectItem>
                          <SelectItem value="Devre Dışı">Devre Dışı</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="maxSpeed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maksimum Hız*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="speedUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hız Birimi*</FormLabel>
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
                            <SelectItem value="rpm">Devir/Dakika (rpm)</SelectItem>
                            <SelectItem value="m/dk">Metre/Dakika</SelectItem>
                            <SelectItem value="t/dk">Tur/Dakika</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kapasite*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="capacityUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kapasite Birimi*</FormLabel>
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
                            <SelectItem value="kg/gün">kg/gün</SelectItem>
                            <SelectItem value="kg/saat">kg/saat</SelectItem>
                            <SelectItem value="bobin/gün">bobin/gün</SelectItem>
                            <SelectItem value="iğ">iğ</SelectItem>
                            <SelectItem value="m/saat">m/saat</SelectItem>
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
                name="maintenanceSchedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bakım Takvimi</FormLabel>
                    <FormControl>
                      <Input placeholder="ör: Her 3 ayda bir" {...field} />
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
                        placeholder="Makine hakkında ek bilgiler..."
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
                  disabled={createMachineMutation.isPending}
                >
                  {createMachineMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Oluştur
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Makine Düzenleme Modalı */}
      {selectedMachine && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Makine Düzenle</DialogTitle>
              <DialogDescription>
                {selectedMachine.name} ({selectedMachine.machineNo}) makinesinin bilgilerini düzenleyin.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Makine Adı*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="machineNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Makine Numarası*</FormLabel>
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
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Makine Tipi*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Makine tipi seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Ring">Ring</SelectItem>
                            <SelectItem value="Open-End">Open-End</SelectItem>
                            <SelectItem value="Büküm">Büküm</SelectItem>
                            <SelectItem value="Çözgü">Çözgü</SelectItem>
                            <SelectItem value="Bobin">Bobin</SelectItem>
                            <SelectItem value="Diğer">Diğer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Konum*</FormLabel>
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
                    name="manufacturer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Üretici*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model*</FormLabel>
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
                    name="yearOfManufacture"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Üretim Yılı*</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                            <SelectItem value="Aktif">Aktif</SelectItem>
                            <SelectItem value="Bakımda">Bakımda</SelectItem>
                            <SelectItem value="Arızalı">Arızalı</SelectItem>
                            <SelectItem value="Devre Dışı">Devre Dışı</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <FormField
                      control={editForm.control}
                      name="maxSpeed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maksimum Hız*</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="speedUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hız Birimi*</FormLabel>
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
                              <SelectItem value="rpm">Devir/Dakika (rpm)</SelectItem>
                              <SelectItem value="m/dk">Metre/Dakika</SelectItem>
                              <SelectItem value="t/dk">Tur/Dakika</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <FormField
                      control={editForm.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kapasite*</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="capacityUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kapasite Birimi*</FormLabel>
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
                              <SelectItem value="kg/gün">kg/gün</SelectItem>
                              <SelectItem value="kg/saat">kg/saat</SelectItem>
                              <SelectItem value="bobin/gün">bobin/gün</SelectItem>
                              <SelectItem value="iğ">iğ</SelectItem>
                              <SelectItem value="m/saat">m/saat</SelectItem>
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
                  name="maintenanceSchedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bakım Takvimi</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                    disabled={updateMachineMutation.isPending}
                  >
                    {updateMachineMutation.isPending && (
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
      
      {/* Makine Silme Konfirmasyonu */}
      {selectedMachine && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-red-600">Makine Sil</DialogTitle>
              <DialogDescription>
                {selectedMachine.name} ({selectedMachine.machineNo}) makinesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">Dikkat!</h4>
                  <p className="text-sm text-red-700">
                    Bu makineyle ilişkili tüm veriler (bakım kayıtları, üretim kayıtları vb.) de silinecektir.
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                İptal
              </Button>
              <Button 
                type="button"
                variant="destructive"
                onClick={() => deleteMachineMutation.mutate()}
                disabled={deleteMachineMutation.isPending}
              >
                {deleteMachineMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Evet, Sil
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default YarnSpinningMachinesPage;