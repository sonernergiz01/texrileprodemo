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
  Plus, 
  Edit, 
  Trash, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Puzzle
} from "lucide-react";

// Dokuma makinesi şeması - gerçek şema schema.ts dosyasından alınmalıdır
const weavingMachineSchema = z.object({
  name: z.string().min(1, "Makine adı gereklidir"),
  machineType: z.string().min(1, "Makine tipi gereklidir"),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  yearOfManufacture: z.string().optional(),
  maxSpeed: z.number().optional(),
  maxWidth: z.number().optional(),
  numberOfHarnesses: z.number().optional(),
  numberOfHeald: z.number().optional(),
  status: z.enum(["Aktif", "Bakımda", "Arızalı", "Kullanım Dışı"]).default("Aktif"),
  location: z.string().optional(),
  notes: z.string().optional(),
  maintenanceSchedule: z.string().optional(),
});

// Çözgü makinesi şeması - gerçek şema schema.ts dosyasından alınmalıdır
const warpingMachineSchema = z.object({
  name: z.string().min(1, "Makine adı gereklidir"),
  machineType: z.string().min(1, "Makine tipi gereklidir"),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  yearOfManufacture: z.string().optional(),
  maxSpeed: z.number().optional(),
  maxWidth: z.number().optional(),
  maxBeamDiameter: z.number().optional(),
  maxBeamWeight: z.number().optional(),
  status: z.enum(["Aktif", "Bakımda", "Arızalı", "Kullanım Dışı"]).default("Aktif"),
  location: z.string().optional(),
  notes: z.string().optional(),
  maintenanceSchedule: z.string().optional(),
});

const WeavingMachinesPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("weaving");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateWeavingDialogOpen, setIsCreateWeavingDialogOpen] = useState(false);
  const [isCreateWarpingDialogOpen, setIsCreateWarpingDialogOpen] = useState(false);
  const [isEditWeavingDialogOpen, setIsEditWeavingDialogOpen] = useState(false);
  const [isEditWarpingDialogOpen, setIsEditWarpingDialogOpen] = useState(false);
  const [selectedWeavingMachine, setSelectedWeavingMachine] = useState<any>(null);
  const [selectedWarpingMachine, setSelectedWarpingMachine] = useState<any>(null);

  // Dokuma makinelerini çek
  const { data: weavingMachines = [], isLoading: isLoadingWeavingMachines } = useQuery({
    queryKey: ["/api/weaving/machines"],
  });

  // Çözgü makinelerini çek
  const { data: warpingMachines = [], isLoading: isLoadingWarpingMachines } = useQuery({
    queryKey: ["/api/weaving/warping-machines"],
  });

  // Dokuma makinesi form
  const weavingForm = useForm<z.infer<typeof weavingMachineSchema>>({
    resolver: zodResolver(weavingMachineSchema),
    defaultValues: {
      name: "",
      machineType: "",
      status: "Aktif",
    },
  });

  // Çözgü makinesi form
  const warpingForm = useForm<z.infer<typeof warpingMachineSchema>>({
    resolver: zodResolver(warpingMachineSchema),
    defaultValues: {
      name: "",
      machineType: "",
      status: "Aktif",
    },
  });

  // Dokuma makinesi düzenleme form
  const weavingEditForm = useForm<z.infer<typeof weavingMachineSchema>>({
    resolver: zodResolver(weavingMachineSchema),
    defaultValues: {
      name: "",
      machineType: "",
      status: "Aktif",
    },
  });

  // Çözgü makinesi düzenleme form
  const warpingEditForm = useForm<z.infer<typeof warpingMachineSchema>>({
    resolver: zodResolver(warpingMachineSchema),
    defaultValues: {
      name: "",
      machineType: "",
      status: "Aktif",
    },
  });

  // Dokuma makinesi oluşturma
  const createWeavingMachineMutation = useMutation({
    mutationFn: async (data: z.infer<typeof weavingMachineSchema>) => {
      const res = await apiRequest("POST", "/api/weaving/machines", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Dokuma makinesi başarıyla oluşturuldu",
      });
      setIsCreateWeavingDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/weaving/machines"] });
      weavingForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Dokuma makinesi oluşturulurken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Çözgü makinesi oluşturma
  const createWarpingMachineMutation = useMutation({
    mutationFn: async (data: z.infer<typeof warpingMachineSchema>) => {
      const res = await apiRequest("POST", "/api/weaving/warping-machines", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Çözgü makinesi başarıyla oluşturuldu",
      });
      setIsCreateWarpingDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/weaving/warping-machines"] });
      warpingForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Çözgü makinesi oluşturulurken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Dokuma makinesi güncelleme
  const updateWeavingMachineMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/weaving/machines/${selectedWeavingMachine.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Dokuma makinesi başarıyla güncellendi",
      });
      setIsEditWeavingDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/weaving/machines"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Dokuma makinesi güncellenirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Çözgü makinesi güncelleme
  const updateWarpingMachineMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/weaving/warping-machines/${selectedWarpingMachine.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Çözgü makinesi başarıyla güncellendi",
      });
      setIsEditWarpingDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/weaving/warping-machines"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Çözgü makinesi güncellenirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Dokuma makinesi silme
  const deleteWeavingMachineMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/weaving/machines/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Dokuma makinesi başarıyla silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/weaving/machines"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Dokuma makinesi silinirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Çözgü makinesi silme
  const deleteWarpingMachineMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/weaving/warping-machines/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Çözgü makinesi başarıyla silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/weaving/warping-machines"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Çözgü makinesi silinirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Dokuma makinesi form gönderme
  const onWeavingSubmit = (data: z.infer<typeof weavingMachineSchema>) => {
    createWeavingMachineMutation.mutate(data);
  };

  // Çözgü makinesi form gönderme
  const onWarpingSubmit = (data: z.infer<typeof warpingMachineSchema>) => {
    createWarpingMachineMutation.mutate(data);
  };

  // Dokuma makinesi düzenleme gönderme
  const onWeavingEditSubmit = (data: z.infer<typeof weavingMachineSchema>) => {
    updateWeavingMachineMutation.mutate(data);
  };

  // Çözgü makinesi düzenleme gönderme
  const onWarpingEditSubmit = (data: z.infer<typeof warpingMachineSchema>) => {
    updateWarpingMachineMutation.mutate(data);
  };

  // Dokuma makinesi düzenleme için açma
  const handleEditWeavingMachine = (machine: any) => {
    setSelectedWeavingMachine(machine);
    weavingEditForm.reset({
      name: machine.name,
      machineType: machine.machineType,
      brand: machine.brand,
      model: machine.model,
      serialNumber: machine.serialNumber,
      yearOfManufacture: machine.yearOfManufacture,
      maxSpeed: machine.maxSpeed,
      maxWidth: machine.maxWidth,
      numberOfHarnesses: machine.numberOfHarnesses,
      numberOfHeald: machine.numberOfHeald,
      status: machine.status,
      location: machine.location,
      notes: machine.notes,
      maintenanceSchedule: machine.maintenanceSchedule,
    });
    setIsEditWeavingDialogOpen(true);
  };

  // Çözgü makinesi düzenleme için açma
  const handleEditWarpingMachine = (machine: any) => {
    setSelectedWarpingMachine(machine);
    warpingEditForm.reset({
      name: machine.name,
      machineType: machine.machineType,
      brand: machine.brand,
      model: machine.model,
      serialNumber: machine.serialNumber,
      yearOfManufacture: machine.yearOfManufacture,
      maxSpeed: machine.maxSpeed,
      maxWidth: machine.maxWidth,
      maxBeamDiameter: machine.maxBeamDiameter,
      maxBeamWeight: machine.maxBeamWeight,
      status: machine.status,
      location: machine.location,
      notes: machine.notes,
      maintenanceSchedule: machine.maintenanceSchedule,
    });
    setIsEditWarpingDialogOpen(true);
  };

  // Dokuma makinesi silme onayı
  const handleDeleteWeavingMachine = (id: number) => {
    if (window.confirm("Bu dokuma makinesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      deleteWeavingMachineMutation.mutate(id);
    }
  };

  // Çözgü makinesi silme onayı
  const handleDeleteWarpingMachine = (id: number) => {
    if (window.confirm("Bu çözgü makinesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      deleteWarpingMachineMutation.mutate(id);
    }
  };

  // Makine durumuna göre renk belirleme
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aktif":
        return "success";
      case "Bakımda":
        return "warning";
      case "Arızalı":
        return "destructive";
      case "Kullanım Dışı":
        return "outline";
      default:
        return "default";
    }
  };

  // Makine arama filtreleme
  const getFilteredMachines = (machines: any[]) => {
    if (!searchTerm) return machines;
    
    const searchLower = searchTerm.toLowerCase();
    return machines.filter((machine) => 
      machine.name.toLowerCase().includes(searchLower) ||
      machine.machineType.toLowerCase().includes(searchLower) ||
      (machine.brand && machine.brand.toLowerCase().includes(searchLower)) ||
      (machine.model && machine.model.toLowerCase().includes(searchLower))
    );
  };

  // Yükleme durumu
  if (isLoadingWeavingMachines || isLoadingWarpingMachines) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filtrelenmiş makineler
  const filteredWeavingMachines = getFilteredMachines(weavingMachines);
  const filteredWarpingMachines = getFilteredMachines(warpingMachines);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Üretim Makineleri" 
        description="Dokuma ve çözgü makinelerini yönetin"
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Makine ara..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {activeTab === "weaving" ? (
          <Button onClick={() => setIsCreateWeavingDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Yeni Dokuma Makinesi
          </Button>
        ) : (
          <Button onClick={() => setIsCreateWarpingDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Yeni Çözgü Makinesi
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="weaving" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="weaving">Dokuma Makineleri</TabsTrigger>
          <TabsTrigger value="warping">Çözgü Makineleri</TabsTrigger>
        </TabsList>
        
        {/* Dokuma Makineleri Tab */}
        <TabsContent value="weaving" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dokuma Makineleri</CardTitle>
              <CardDescription>
                Tüm dokuma makinelerinin listesi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredWeavingMachines.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "Arama kriterlerine uygun makine bulunamadı." : "Henüz dokuma makinesi bulunmamaktadır. Yeni bir makine eklemek için 'Yeni Dokuma Makinesi' butonunu kullanın."}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Makine Adı</TableHead>
                      <TableHead>Tipi</TableHead>
                      <TableHead>Marka/Model</TableHead>
                      <TableHead>Genişlik</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWeavingMachines.map((machine: any) => (
                      <TableRow key={machine.id}>
                        <TableCell className="font-medium">{machine.name}</TableCell>
                        <TableCell>{machine.machineType || "-"}</TableCell>
                        <TableCell>{machine.brand} {machine.model ? `/ ${machine.model}` : ""}</TableCell>
                        <TableCell>{machine.maxWidth ? `${machine.maxWidth} cm` : "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusColor(machine.status)}
                          >
                            {machine.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditWeavingMachine(machine)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDeleteWeavingMachine(machine.id)}
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
        
        {/* Çözgü Makineleri Tab */}
        <TabsContent value="warping" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Çözgü Makineleri</CardTitle>
              <CardDescription>
                Tüm çözgü makinelerinin listesi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredWarpingMachines.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "Arama kriterlerine uygun makine bulunamadı." : "Henüz çözgü makinesi bulunmamaktadır. Yeni bir makine eklemek için 'Yeni Çözgü Makinesi' butonunu kullanın."}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Makine Adı</TableHead>
                      <TableHead>Tipi</TableHead>
                      <TableHead>Marka/Model</TableHead>
                      <TableHead>Genişlik</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWarpingMachines.map((machine: any) => (
                      <TableRow key={machine.id}>
                        <TableCell className="font-medium">{machine.name}</TableCell>
                        <TableCell>{machine.machineType || "-"}</TableCell>
                        <TableCell>{machine.brand} {machine.model ? `/ ${machine.model}` : ""}</TableCell>
                        <TableCell>{machine.maxWidth ? `${machine.maxWidth} cm` : "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusColor(machine.status)}
                          >
                            {machine.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditWarpingMachine(machine)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDeleteWarpingMachine(machine.id)}
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
      
      {/* Yeni Dokuma Makinesi Modal */}
      <Dialog open={isCreateWeavingDialogOpen} onOpenChange={setIsCreateWeavingDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yeni Dokuma Makinesi Ekle</DialogTitle>
            <DialogDescription>
              Yeni bir dokuma makinesi ekleyin.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...weavingForm}>
            <form onSubmit={weavingForm.handleSubmit(onWeavingSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={weavingForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Makine Adı*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: Dokuma-01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={weavingForm.control}
                  name="machineType"
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
                          <SelectItem value="Mekikli">Mekikli</SelectItem>
                          <SelectItem value="Rapier">Rapier</SelectItem>
                          <SelectItem value="Air Jet">Air Jet</SelectItem>
                          <SelectItem value="Water Jet">Water Jet</SelectItem>
                          <SelectItem value="Projectile">Projectile</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={weavingForm.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marka</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: Picanol" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={weavingForm.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: GTX Plus" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={weavingForm.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seri Numarası</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: SN12345" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={weavingForm.control}
                  name="yearOfManufacture"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Üretim Yılı</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: 2020" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={weavingForm.control}
                  name="maxSpeed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maksimum Hız (rpm)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="ör: 1000" 
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
                  control={weavingForm.control}
                  name="maxWidth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maksimum Genişlik (cm)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="ör: 220" 
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
                  control={weavingForm.control}
                  name="numberOfHarnesses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Çerçeve Sayısı</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="ör: 8" 
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
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={weavingForm.control}
                  name="numberOfHeald"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gücü Teli Sayısı</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="ör: 4800" 
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
                  control={weavingForm.control}
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
                          <SelectItem value="Aktif">Aktif</SelectItem>
                          <SelectItem value="Bakımda">Bakımda</SelectItem>
                          <SelectItem value="Arızalı">Arızalı</SelectItem>
                          <SelectItem value="Kullanım Dışı">Kullanım Dışı</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={weavingForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konum</FormLabel>
                    <FormControl>
                      <Input placeholder="ör: Dokuma Atölyesi - A Blok" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={weavingForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Makine hakkında notlar"
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
                  onClick={() => setIsCreateWeavingDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button 
                  type="submit"
                  disabled={createWeavingMachineMutation.isPending}
                >
                  {createWeavingMachineMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Oluştur
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Yeni Çözgü Makinesi Modal */}
      <Dialog open={isCreateWarpingDialogOpen} onOpenChange={setIsCreateWarpingDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yeni Çözgü Makinesi Ekle</DialogTitle>
            <DialogDescription>
              Yeni bir çözgü makinesi ekleyin.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...warpingForm}>
            <form onSubmit={warpingForm.handleSubmit(onWarpingSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={warpingForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Makine Adı*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: Çözgü-01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={warpingForm.control}
                  name="machineType"
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
                          <SelectItem value="Direkt">Direkt</SelectItem>
                          <SelectItem value="Seksiyonel">Seksiyonel</SelectItem>
                          <SelectItem value="Numune">Numune</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={warpingForm.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marka</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: Karl Mayer" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={warpingForm.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: WE-2" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={warpingForm.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seri Numarası</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: SN12345" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={warpingForm.control}
                  name="yearOfManufacture"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Üretim Yılı</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: 2020" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={warpingForm.control}
                  name="maxSpeed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maksimum Hız (m/dak)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="ör: 800" 
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
                  control={warpingForm.control}
                  name="maxWidth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maksimum Genişlik (cm)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="ör: 220" 
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
                  control={warpingForm.control}
                  name="maxBeamDiameter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maks. Levent Çapı (cm)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="ör: 80" 
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
                  control={warpingForm.control}
                  name="maxBeamWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maks. Levent Ağırlığı (kg)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="ör: 1200" 
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
                  control={warpingForm.control}
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
                          <SelectItem value="Aktif">Aktif</SelectItem>
                          <SelectItem value="Bakımda">Bakımda</SelectItem>
                          <SelectItem value="Arızalı">Arızalı</SelectItem>
                          <SelectItem value="Kullanım Dışı">Kullanım Dışı</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={warpingForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konum</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: Çözgü Atölyesi - B Blok" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={warpingForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Makine hakkında notlar"
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
                  onClick={() => setIsCreateWarpingDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button 
                  type="submit"
                  disabled={createWarpingMachineMutation.isPending}
                >
                  {createWarpingMachineMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Oluştur
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dokuma Makinesi Düzenleme Modal */}
      {selectedWeavingMachine && (
        <Dialog open={isEditWeavingDialogOpen} onOpenChange={setIsEditWeavingDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Dokuma Makinesini Düzenle</DialogTitle>
              <DialogDescription>
                Mevcut dokuma makinesinin bilgilerini güncelleyin.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...weavingEditForm}>
              <form onSubmit={weavingEditForm.handleSubmit(onWeavingEditSubmit)} className="space-y-6">
                {/* Aynı form alanları (yukarıdaki ile aynı) */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={weavingEditForm.control}
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
                    control={weavingEditForm.control}
                    name="machineType"
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
                            <SelectItem value="Mekikli">Mekikli</SelectItem>
                            <SelectItem value="Rapier">Rapier</SelectItem>
                            <SelectItem value="Air Jet">Air Jet</SelectItem>
                            <SelectItem value="Water Jet">Water Jet</SelectItem>
                            <SelectItem value="Projectile">Projectile</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={weavingEditForm.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marka</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={weavingEditForm.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={weavingEditForm.control}
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
                            <SelectItem value="Aktif">Aktif</SelectItem>
                            <SelectItem value="Bakımda">Bakımda</SelectItem>
                            <SelectItem value="Arızalı">Arızalı</SelectItem>
                            <SelectItem value="Kullanım Dışı">Kullanım Dışı</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={weavingEditForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Konum</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={weavingEditForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notlar</FormLabel>
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
                    onClick={() => setIsEditWeavingDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateWeavingMachineMutation.isPending}
                  >
                    {updateWeavingMachineMutation.isPending && (
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
      
      {/* Çözgü Makinesi Düzenleme Modal */}
      {selectedWarpingMachine && (
        <Dialog open={isEditWarpingDialogOpen} onOpenChange={setIsEditWarpingDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Çözgü Makinesini Düzenle</DialogTitle>
              <DialogDescription>
                Mevcut çözgü makinesinin bilgilerini güncelleyin.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...warpingEditForm}>
              <form onSubmit={warpingEditForm.handleSubmit(onWarpingEditSubmit)} className="space-y-6">
                {/* Aynı form alanları (yukarıdaki ile aynı) */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={warpingEditForm.control}
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
                    control={warpingEditForm.control}
                    name="machineType"
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
                            <SelectItem value="Direkt">Direkt</SelectItem>
                            <SelectItem value="Seksiyonel">Seksiyonel</SelectItem>
                            <SelectItem value="Numune">Numune</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={warpingEditForm.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marka</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={warpingEditForm.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={warpingEditForm.control}
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
                            <SelectItem value="Aktif">Aktif</SelectItem>
                            <SelectItem value="Bakımda">Bakımda</SelectItem>
                            <SelectItem value="Arızalı">Arızalı</SelectItem>
                            <SelectItem value="Kullanım Dışı">Kullanım Dışı</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={warpingEditForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Konum</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={warpingEditForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notlar</FormLabel>
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
                    onClick={() => setIsEditWarpingDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateWarpingMachineMutation.isPending}
                  >
                    {updateWarpingMachineMutation.isPending && (
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

export default WeavingMachinesPage;