import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { PageContainer } from "@/components/layout/page-container";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Edit, Plus, Trash2 } from "lucide-react";

// Tür tanımları
interface MachineType {
  id: number;
  name: string;
  code: string;
  description: string | null;
  departmentId: number | null;
}

interface Machine {
  id: number;
  name: string;
  code: string;
  machineTypeId: number;
  departmentId: number | null;
  status: string;
  details: string | null;
}

interface Department {
  id: number;
  name: string;
  code: string;
  color: string;
}

// Form şemaları
const machineTypeSchema = z.object({
  name: z.string()
    .min(2, { message: "Makine tipi adı en az 2 karakter olmalıdır" })
    .max(100, { message: "Makine tipi adı en fazla 100 karakter olmalıdır" })
    .trim(),
  code: z.string()
    .min(2, { message: "Kod en az 2 karakter olmalıdır" })
    .max(20, { message: "Kod en fazla 20 karakter olmalıdır" })
    .trim()
    .refine(val => /^[A-Za-z0-9_-]+$/.test(val), {
      message: "Kod sadece harf, rakam, tire ve alt çizgi içerebilir"
    }),
  description: z.string()
    .max(255, { message: "Açıklama en fazla 255 karakter olabilir" })
    .optional()
    .nullable(),
  departmentId: z.string().optional().nullable()
});

const machineSchema = z.object({
  name: z.string()
    .min(2, { message: "Makine adı en az 2 karakter olmalıdır" })
    .max(100, { message: "Makine adı en fazla 100 karakter olmalıdır" })
    .trim(),
  code: z.string()
    .min(2, { message: "Kod en az 2 karakter olmalıdır" })
    .max(20, { message: "Kod en fazla 20 karakter olmalıdır" })
    .trim()
    .refine(val => /^[A-Za-z0-9_-]+$/.test(val), {
      message: "Kod sadece harf, rakam, tire ve alt çizgi içerebilir"
    }),
  machineTypeId: z.string({ required_error: "Makine tipi seçilmelidir" }),
  departmentId: z.string().optional().nullable(),
  status: z.enum(["active", "maintenance", "out-of-order"], { 
    required_error: "Durum seçilmelidir" 
  }).default("active"),
  details: z.string()
    .max(255, { message: "Detaylar en fazla 255 karakter olabilir" })
    .optional()
    .nullable()
});

type MachineTypeFormValues = z.infer<typeof machineTypeSchema>;
type MachineFormValues = z.infer<typeof machineSchema>;

const MachinesManagement = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("machine-types");
  
  // Dialog durumları
  const [isAddTypeDialogOpen, setIsAddTypeDialogOpen] = useState(false);
  const [isEditTypeDialogOpen, setIsEditTypeDialogOpen] = useState(false);
  const [isDeleteTypeDialogOpen, setIsDeleteTypeDialogOpen] = useState(false);
  const [selectedMachineType, setSelectedMachineType] = useState<MachineType | null>(null);
  
  const [isAddMachineDialogOpen, setIsAddMachineDialogOpen] = useState(false);
  const [isEditMachineDialogOpen, setIsEditMachineDialogOpen] = useState(false);
  const [isDeleteMachineDialogOpen, setIsDeleteMachineDialogOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  // Form durumları
  const machineTypeForm = useForm<MachineTypeFormValues>({
    resolver: zodResolver(machineTypeSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      departmentId: ""
    }
  });

  const machineForm = useForm<MachineFormValues>({
    resolver: zodResolver(machineSchema),
    defaultValues: {
      name: "",
      code: "",
      machineTypeId: "",
      departmentId: "",
      status: "active",
      details: ""
    }
  });

  // Veri çekme işlemleri
  const { data: machineTypes, isLoading: isLoadingTypes } = useQuery({
    queryKey: ['/api/admin/machines/types'],
    select: (data: MachineType[]) => data.sort((a, b) => a.name.localeCompare(b.name))
  });

  const { data: machines, isLoading: isLoadingMachines } = useQuery({
    queryKey: ['/api/admin/machines'],
    select: (data: Machine[]) => data.sort((a, b) => a.name.localeCompare(b.name))
  });

  const { data: departments } = useQuery({
    queryKey: ['/api/admin/departments']
  });

  // Mutasyon işlemleri - Makine Tipleri
  const addMachineTypeMutation = useMutation({
    mutationFn: async (data: MachineTypeFormValues) => {
      try {
        console.log("Makine tipi ekleme isteği gönderiliyor:", data);
        const formattedData = {
          ...data,
          departmentId: data.departmentId ? parseInt(data.departmentId) : null
        };
        console.log("Formatlanmış veri:", formattedData);
        const response = await fetch('/api/admin/machines/types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("API hatası:", errorData);
          throw new Error(errorData.error || 'Makine tipi eklenemedi');
        }
        
        const result = await response.json();
        console.log("API başarılı yanıt:", result);
        return result;
      } catch (error) {
        console.error("Makine tipi ekleme hatası:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/machines/types'] });
      setIsAddTypeDialogOpen(false);
      machineTypeForm.reset();
      toast({
        title: "Başarılı",
        description: "Makine tipi başarıyla eklendi",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateMachineTypeMutation = useMutation({
    mutationFn: async (data: MachineTypeFormValues & { id: number }) => {
      const { id, ...updateData } = data;
      const formattedData = {
        ...updateData,
        departmentId: updateData.departmentId ? parseInt(updateData.departmentId) : null
      };
      
      const response = await fetch(`/api/admin/machines/types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Makine tipi güncellenemedi');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/machines/types'] });
      setIsEditTypeDialogOpen(false);
      setSelectedMachineType(null);
      machineTypeForm.reset();
      toast({
        title: "Başarılı",
        description: "Makine tipi başarıyla güncellendi",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteMachineTypeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/machines/types/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Makine tipi silinemedi');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/machines/types'] });
      setIsDeleteTypeDialogOpen(false);
      setSelectedMachineType(null);
      toast({
        title: "Başarılı",
        description: "Makine tipi başarıyla silindi",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutasyon işlemleri - Makineler
  const addMachineMutation = useMutation({
    mutationFn: async (data: MachineFormValues) => {
      try {
        console.log("Makine ekleme isteği gönderiliyor:", data);
        const formattedData = {
          ...data,
          machineTypeId: parseInt(data.machineTypeId),
          departmentId: data.departmentId ? parseInt(data.departmentId) : null
        };
        console.log("Formatlanmış veri:", formattedData);
        
        const response = await fetch('/api/admin/machines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("API hatası:", errorData);
          throw new Error(errorData.error || 'Makine eklenemedi');
        }
        
        const result = await response.json();
        console.log("API başarılı yanıt:", result);
        return result;
      } catch (error) {
        console.error("Makine ekleme hatası:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/machines'] });
      setIsAddMachineDialogOpen(false);
      machineForm.reset();
      toast({
        title: "Başarılı",
        description: "Makine başarıyla eklendi",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateMachineMutation = useMutation({
    mutationFn: async (data: MachineFormValues & { id: number }) => {
      const { id, ...updateData } = data;
      const formattedData = {
        ...updateData,
        machineTypeId: parseInt(updateData.machineTypeId),
        departmentId: updateData.departmentId ? parseInt(updateData.departmentId) : null
      };
      
      const response = await fetch(`/api/admin/machines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Makine güncellenemedi');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/machines'] });
      setIsEditMachineDialogOpen(false);
      setSelectedMachine(null);
      machineForm.reset();
      toast({
        title: "Başarılı",
        description: "Makine başarıyla güncellendi",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteMachineMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/machines/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Makine silinemedi');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/machines'] });
      setIsDeleteMachineDialogOpen(false);
      setSelectedMachine(null);
      toast({
        title: "Başarılı",
        description: "Makine başarıyla silindi",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Form işlemleri
  const onAddMachineTypeSubmit = (data: MachineTypeFormValues) => {
    try {
      console.log("Form gönderimi - Yeni makine tipi:", data);
      addMachineTypeMutation.mutate(data);
    } catch (error) {
      console.error("Form gönderimi sırasında hata:", error);
      toast({
        title: "Hata",
        description: "Form gönderimi sırasında bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const onEditMachineTypeSubmit = (data: MachineTypeFormValues) => {
    try {
      if (selectedMachineType) {
        console.log("Form gönderimi - Makine tipi düzenleme:", { ...data, id: selectedMachineType.id });
        updateMachineTypeMutation.mutate({ ...data, id: selectedMachineType.id });
      } else {
        console.error("Seçili makine tipi bulunamadı");
        toast({
          title: "Hata",
          description: "Düzenlenecek makine tipi bulunamadı",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Form gönderimi sırasında hata:", error);
      toast({
        title: "Hata",
        description: "Form gönderimi sırasında bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const onAddMachineSubmit = (data: MachineFormValues) => {
    try {
      console.log("Form gönderimi - Yeni makine:", data);
      addMachineMutation.mutate(data);
    } catch (error) {
      console.error("Form gönderimi sırasında hata:", error);
      toast({
        title: "Hata",
        description: "Form gönderimi sırasında bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const onEditMachineSubmit = (data: MachineFormValues) => {
    try {
      if (selectedMachine) {
        console.log("Form gönderimi - Makine düzenleme:", { ...data, id: selectedMachine.id });
        updateMachineMutation.mutate({ ...data, id: selectedMachine.id });
      } else {
        console.error("Seçili makine bulunamadı");
        toast({
          title: "Hata",
          description: "Düzenlenecek makine bulunamadı",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Form gönderimi sırasında hata:", error);
      toast({
        title: "Hata",
        description: "Form gönderimi sırasında bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  // Event handlers
  const handleEditMachineType = (machineType: MachineType) => {
    setSelectedMachineType(machineType);
    
    machineTypeForm.reset({
      name: machineType.name,
      code: machineType.code,
      description: machineType.description || "",
      departmentId: machineType.departmentId ? machineType.departmentId.toString() : ""
    });
    
    setIsEditTypeDialogOpen(true);
  };

  const handleDeleteMachineType = (machineType: MachineType) => {
    setSelectedMachineType(machineType);
    setIsDeleteTypeDialogOpen(true);
  };

  const handleEditMachine = (machine: Machine) => {
    setSelectedMachine(machine);
    
    machineForm.reset({
      name: machine.name,
      code: machine.code,
      machineTypeId: machine.machineTypeId.toString(),
      departmentId: machine.departmentId ? machine.departmentId.toString() : "",
      status: machine.status,
      details: machine.details || ""
    });
    
    setIsEditMachineDialogOpen(true);
  };

  const handleDeleteMachine = (machine: Machine) => {
    setSelectedMachine(machine);
    setIsDeleteMachineDialogOpen(true);
  };

  // Yardımcı fonksiyonlar
  const getDepartmentName = (id: number | null) => {
    if (!id) return "-";
    const dept = departments?.find(d => d.id === id);
    return dept ? dept.name : "-";
  };

  const getMachineTypeName = (id: number) => {
    const type = machineTypes?.find(t => t.id === id);
    return type ? type.name : "-";
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Aktif";
      case "maintenance": return "Bakımda";
      case "out-of-order": return "Arızalı";
      default: return status;
    }
  };

  // Temizleme işlemleri
  useEffect(() => {
    return () => {
      machineTypeForm.reset();
      machineForm.reset();
    };
  }, []);

  return (
    <PageContainer title="Makine Yönetimi" subtitle="Makine tiplerini ve makineleri yönetin">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Makine Yönetimi</CardTitle>
          <CardDescription>
            Sistemde kullanılan makine tiplerini ve makineleri yönetebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="machine-types" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="machine-types">Makine Tipleri</TabsTrigger>
              <TabsTrigger value="machines">Makineler</TabsTrigger>
            </TabsList>
            
            <TabsContent value="machine-types">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Makine Tipleri</h3>
                <Button onClick={() => setIsAddTypeDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Makine Tipi
                </Button>
              </div>
              
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Makine Tipi</TableHead>
                      <TableHead>Kod</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead>Departman</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingTypes ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          Veriler yükleniyor...
                        </TableCell>
                      </TableRow>
                    ) : machineTypes && machineTypes.length > 0 ? (
                      machineTypes.map((type) => (
                        <TableRow key={type.id}>
                          <TableCell className="font-medium">{type.name}</TableCell>
                          <TableCell>{type.code}</TableCell>
                          <TableCell>{type.description || "-"}</TableCell>
                          <TableCell>{getDepartmentName(type.departmentId)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditMachineType(type)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleDeleteMachineType(type)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          Hiç makine tipi bulunamadı.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="machines">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Makineler</h3>
                <Button onClick={() => setIsAddMachineDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Makine
                </Button>
              </div>
              
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Makine Adı</TableHead>
                      <TableHead>Kod</TableHead>
                      <TableHead>Makine Tipi</TableHead>
                      <TableHead>Departman</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Detaylar</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingMachines ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Veriler yükleniyor...
                        </TableCell>
                      </TableRow>
                    ) : machines && machines.length > 0 ? (
                      machines.map((machine) => (
                        <TableRow key={machine.id}>
                          <TableCell className="font-medium">{machine.name}</TableCell>
                          <TableCell>{machine.code}</TableCell>
                          <TableCell>{getMachineTypeName(machine.machineTypeId)}</TableCell>
                          <TableCell>{getDepartmentName(machine.departmentId)}</TableCell>
                          <TableCell>
                            <span 
                              className={`px-2 py-1 rounded-md text-xs ${
                                machine.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : machine.status === 'maintenance' 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {getStatusLabel(machine.status)}
                            </span>
                          </TableCell>
                          <TableCell>{machine.details || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditMachine(machine)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleDeleteMachine(machine)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Hiç makine bulunamadı.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Makine Tipi Dialogs */}
      <Dialog open={isAddTypeDialogOpen} onOpenChange={setIsAddTypeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Yeni Makine Tipi Ekle</DialogTitle>
            <DialogDescription>
              Yeni bir makine tipi ekleyin. Makine tipleri, makine kategorilerini tanımlar.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...machineTypeForm}>
            <form onSubmit={machineTypeForm.handleSubmit(onAddMachineTypeSubmit)} className="space-y-4">
              <FormField
                control={machineTypeForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Makine Tipi Adı *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Dokuma Tezgahı" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={machineTypeForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kod *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="DTZ" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={machineTypeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Dokuma işlemi yapan makineler" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={machineTypeForm.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departman</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value?.toString() || ""} 
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Departman seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">Departman yok</SelectItem>
                        {departments?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">İptal</Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  disabled={addMachineTypeMutation.isPending}
                >
                  {addMachineTypeMutation.isPending ? "Ekleniyor..." : "Ekle"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditTypeDialogOpen} onOpenChange={setIsEditTypeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Makine Tipi Düzenle</DialogTitle>
            <DialogDescription>
              Seçili makine tipini düzenleyin.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...machineTypeForm}>
            <form onSubmit={machineTypeForm.handleSubmit(onEditMachineTypeSubmit)} className="space-y-4">
              <FormField
                control={machineTypeForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Makine Tipi Adı *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={machineTypeForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kod *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={machineTypeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={machineTypeForm.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departman</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value?.toString() || ""} 
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Departman seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">Departman yok</SelectItem>
                        {departments?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">İptal</Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  disabled={updateMachineTypeMutation.isPending}
                >
                  {updateMachineTypeMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteTypeDialogOpen} onOpenChange={setIsDeleteTypeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Makine Tipi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu makine tipini silmek istediğinizden emin misiniz?
              {selectedMachineType && (
                <p className="mt-2 font-medium">{selectedMachineType.name} ({selectedMachineType.code})</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedMachineType && deleteMachineTypeMutation.mutate(selectedMachineType.id)}
              disabled={deleteMachineTypeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMachineTypeMutation.isPending ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Makine Dialogs */}
      <Dialog open={isAddMachineDialogOpen} onOpenChange={setIsAddMachineDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Yeni Makine Ekle</DialogTitle>
            <DialogDescription>
              Yeni bir makine ekleyin.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...machineForm}>
            <form onSubmit={machineForm.handleSubmit(onAddMachineSubmit)} className="space-y-4">
              <FormField
                control={machineForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Makine Adı *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Dokuma Tezgahı 001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={machineForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kod *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="DT001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={machineForm.control}
                name="machineTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Makine Tipi *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value?.toString() || ""} 
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Makine tipi seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {machineTypes?.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
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
                control={machineForm.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departman</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value?.toString() || ""} 
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Departman seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">Departman yok</SelectItem>
                        {departments?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={machineForm.control}
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
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="maintenance">Bakımda</SelectItem>
                        <SelectItem value="out-of-order">Arızalı</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={machineForm.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detaylar</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Makine detayları..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">İptal</Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  disabled={addMachineMutation.isPending}
                >
                  {addMachineMutation.isPending ? "Ekleniyor..." : "Ekle"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditMachineDialogOpen} onOpenChange={setIsEditMachineDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Makine Düzenle</DialogTitle>
            <DialogDescription>
              Seçili makineyi düzenleyin.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...machineForm}>
            <form onSubmit={machineForm.handleSubmit(onEditMachineSubmit)} className="space-y-4">
              <FormField
                control={machineForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Makine Adı *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={machineForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kod *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={machineForm.control}
                name="machineTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Makine Tipi *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value?.toString() || ""} 
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Makine tipi seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {machineTypes?.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
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
                control={machineForm.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departman</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value?.toString() || ""} 
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Departman seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">Departman yok</SelectItem>
                        {departments?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={machineForm.control}
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
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="maintenance">Bakımda</SelectItem>
                        <SelectItem value="out-of-order">Arızalı</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={machineForm.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detaylar</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">İptal</Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  disabled={updateMachineMutation.isPending}
                >
                  {updateMachineMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteMachineDialogOpen} onOpenChange={setIsDeleteMachineDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Makine Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu makineyi silmek istediğinizden emin misiniz?
              {selectedMachine && (
                <p className="mt-2 font-medium">{selectedMachine.name} ({selectedMachine.code})</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedMachine && deleteMachineMutation.mutate(selectedMachine.id)}
              disabled={deleteMachineMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMachineMutation.isPending ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default MachinesManagement;