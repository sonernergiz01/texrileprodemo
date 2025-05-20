import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, useRoute } from "wouter";
import { Loader2, Plus, Pencil, Trash2, GitBranch as Route, ArrowLeft, Save } from "lucide-react";

console.log("Route Template Steps sayfası yükleniyor...");
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult
} from '@hello-pangea/dnd';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Rota adımı şeması
const routeStepSchema = z.object({
  templateId: z.number(),
  processTypeId: z.number({
    required_error: "Proses tipi seçilmelidir",
  }),
  departmentId: z.number({
    required_error: "Departman seçilmelidir",
  }),
  machineId: z.number().optional().nullable(),
  dyeRecipeId: z.number().optional().nullable(), // Boya reçetesi ilişkisi
  stepOrder: z.number().default(0),
  dayOffset: z.number().default(0),
  estimatedDuration: z.number().min(1, {
    message: "Tahmini süre en az 1 gün olmalıdır",
  }).default(1),
  notes: z.string().optional().nullable(),
});

export default function RouteTemplateStepsPage() {
  const [matchOldPath, paramsOldPath] = useRoute<{ id: string }>("/planning/route-templates/:id/steps");
  const [matchNewPath, paramsNewPath] = useRoute<{ id: string }>("/planning/route-template-steps/:id");
  const [location, navigate] = useLocation();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // İki path'ten birini kullan
  const params = matchOldPath ? paramsOldPath : paramsNewPath;
  const match = matchOldPath || matchNewPath;
  
  console.log("Template ID params:", params);
  const templateId = params?.id ? parseInt(params.id) : 0;
  console.log("Template ID:", templateId);
  
  // Şablon bilgisini getir
  const { data: template, isLoading: isTemplateLoading } = useQuery({
    queryKey: ["/api/planning/route-templates", templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const res = await fetch(`/api/planning/route-templates/${templateId}`);
      if (!res.ok) throw new Error("Şablon yüklenirken bir hata oluştu");
      return res.json();
    },
    enabled: !!templateId,
  });
  
  // Adımları getir
  const { 
    data: steps = [], 
    isLoading: isStepsLoading,
    isError: isStepsError
  } = useQuery({
    queryKey: ["/api/planning/route-template-steps", templateId],
    queryFn: async () => {
      if (!templateId) return [];
      const res = await fetch(`/api/planning/route-template-steps/${templateId}`);
      if (!res.ok) throw new Error("Adımlar yüklenirken bir hata oluştu");
      return res.json();
    },
    enabled: !!templateId,
  });
  
  // Proses tiplerini getir
  const { data: processTypes = [] } = useQuery({
    queryKey: ["/api/planning/process-types"],
  });
  
  // Departmanları getir
  const { data: departments = [] } = useQuery({
    queryKey: ["/api/admin/departments"],
  });
  
  // Makineleri getir
  const { data: machineData } = useQuery({
    queryKey: ["/api/planning/machines"],
  });
  
  // Makine verisi olmadığında boş dizi kullan
  const machines = Array.isArray(machineData) ? machineData : [];
  
  // Boya reçetelerini getir
  const { data: dyeRecipesData } = useQuery({
    queryKey: ["/api/dye-recipes"],
  });
  
  // Boya reçetesi verisi olmadığında boş dizi kullan
  const dyeRecipes = Array.isArray(dyeRecipesData) ? dyeRecipesData : [];
  
  // Adım oluşturma formu
  const createForm = useForm({
    resolver: zodResolver(routeStepSchema),
    defaultValues: {
      templateId: templateId,
      processTypeId: 0,
      departmentId: 0,
      machineId: null,
      dyeRecipeId: null,
      stepOrder: steps && Array.isArray(steps) && steps.length > 0 ? steps.length + 1 : 1,
      dayOffset: steps && Array.isArray(steps) && steps.length > 0 
        ? Math.max(0, ...steps.map((s: any) => ((typeof s.dayOffset === 'number') ? s.dayOffset : 0) + ((typeof s.estimatedDuration === 'number') ? s.estimatedDuration : 1)))
        : 0,
      estimatedDuration: 1,
      notes: null,
    },
  });
  
  // Adım düzenleme formu  
  const editForm = useForm({
    resolver: zodResolver(routeStepSchema),
    defaultValues: {
      templateId: templateId,
      processTypeId: 0,
      departmentId: 0,
      machineId: null,
      dyeRecipeId: null,
      stepOrder: 1,
      dayOffset: 0,
      estimatedDuration: 1,
      notes: null,
    },
  });
  
  // Adımların sırasını güncelleme - body stream hatası düzeltildi
  const updateStepOrdersMutation = useMutation({
    mutationFn: async (updatedSteps: any[]) => {
      try {
        // Her adım için güncelleme işlemi
        const promises = updatedSteps.map((step, index) => {
          return fetch(`/api/planning/route-template-steps/${step.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              stepOrder: index + 1
            })
          }).then(response => {
            if (!response.ok) {
              throw new Error(`${step.id} ID'li adım güncellenirken hata: ${response.status}`);
            }
            return response.json();
          }).catch(err => {
            console.error(`Adım sıra güncellemesi hatası (ID: ${step.id}):`, err);
            throw err;
          });
        });
        
        return Promise.all(promises);
      } catch (err: any) {
        console.error("Adım sıralarını güncelleme hatası:", err);
        throw new Error("Adım sıralaması güncellenirken bir hata meydana geldi");
      }
    },
    onSuccess: () => {
      toast({
        title: "Başarılı!",
        description: "Adımların sırası güncellendi.",
      });
      
      queryClient.invalidateQueries({
        queryKey: ["/api/planning/route-template-steps", templateId],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata!",
        description: `Adımların sırası güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Adım oluşturma - body stream hatası düzeltildi
  const createStepMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        // apiRequest fonksiyonu yerine doğrudan fetch kullanarak response tek seferde tüketilecek
        const response = await fetch("/api/planning/route-template-steps", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        });
        
        // Yanıt başarılı değilse hata fırlat
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Bilinmeyen bir hata oluştu" }));
          throw new Error(errorData.message || `Hata: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (err: any) {
        console.error("Adım oluşturma hatası:", err);
        throw new Error(err.message || "Adım oluşturulurken bir hata meydana geldi");
      }
    },
    onSuccess: () => {
      toast({
        title: "Başarılı!",
        description: "Yeni adım başarıyla eklendi.",
      });
      
      queryClient.invalidateQueries({
        queryKey: ["/api/planning/route-template-steps", templateId],
      });
      
      setIsCreateDialogOpen(false);
      createForm.reset({
        templateId: templateId,
        processTypeId: 0,
        departmentId: 0,
        machineId: null,
        stepOrder: steps && Array.isArray(steps) && steps.length > 0 ? steps.length + 1 : 1,
        dayOffset: steps && Array.isArray(steps) && steps.length > 0 
          ? Math.max(0, ...steps.map((s: any) => ((typeof s.dayOffset === 'number') ? s.dayOffset : 0) + ((typeof s.estimatedDuration === 'number') ? s.estimatedDuration : 1)))
          : 0,
        estimatedDuration: 1,
        notes: null,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata!",
        description: `Adım eklenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Adım güncelleme - body stream hatası düzeltildi
  const updateStepMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        // apiRequest yerine fetch kullanarak response tek seferde tüketilecek
        const response = await fetch(`/api/planning/route-template-steps/${selectedStep.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        });
        
        // Yanıt başarılı değilse hata fırlat
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Bilinmeyen bir hata oluştu" }));
          throw new Error(errorData.message || `Hata: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (err: any) {
        console.error("Adım güncelleme hatası:", err);
        throw new Error(err.message || "Adım güncellenirken bir hata meydana geldi");
      }
    },
    onSuccess: () => {
      toast({
        title: "Başarılı!",
        description: "Adım başarıyla güncellendi.",
      });
      
      queryClient.invalidateQueries({
        queryKey: ["/api/planning/route-template-steps", templateId],
      });
      
      setIsEditDialogOpen(false);
      setSelectedStep(null);
    },
    onError: (error: any) => {
      toast({
        title: "Hata!",
        description: `Adım güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Adım silme - body stream hatası düzeltildi
  const deleteStepMutation = useMutation({
    mutationFn: async () => {
      try {
        // apiRequest yerine fetch kullanarak response tek seferde tüketilecek
        const response = await fetch(`/api/planning/route-template-steps/${selectedStep.id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          }
        });
        
        // Yanıt başarılı değilse hata fırlat
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Bilinmeyen bir hata oluştu" }));
          throw new Error(errorData.message || `Hata: ${response.status} ${response.statusText}`);
        }
        
        // 204 No Content ise boş bir nesne döndür
        if (response.status === 204) {
          return {};
        }
        
        return await response.json();
      } catch (err: any) {
        console.error("Adım silme hatası:", err);
        throw new Error(err.message || "Adım silinirken bir hata meydana geldi");
      }
    },
    onSuccess: () => {
      toast({
        title: "Başarılı!",
        description: "Adım başarıyla silindi.",
      });
      
      queryClient.invalidateQueries({
        queryKey: ["/api/planning/route-template-steps", templateId],
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedStep(null);
    },
    onError: (error: any) => {
      toast({
        title: "Hata!",
        description: `Adım silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Adım oluşturma formu
  const onCreateSubmit = async (data: any) => {
    createStepMutation.mutate({
      ...data,
      templateId: templateId,
    });
  };
  
  // Adım güncelleme formu
  const onEditSubmit = async (data: any) => {
    updateStepMutation.mutate({
      ...data,
      templateId: templateId,
    });
  };
  
  // Adım düzenleme için açma
  const handleEditStep = (step: any) => {
    setSelectedStep(step);
    editForm.reset({
      templateId: templateId,
      processTypeId: step.processTypeId,
      departmentId: step.departmentId,
      machineId: step.machineId,
      dyeRecipeId: step.dyeRecipeId,
      stepOrder: step.stepOrder,
      dayOffset: step.dayOffset,
      estimatedDuration: step.estimatedDuration || 1,
      notes: step.notes,
    });
    setIsEditDialogOpen(true);
  };
  
  // Adım silme için açma
  const handleDeleteStep = (step: any) => {
    setSelectedStep(step);
    setIsDeleteDialogOpen(true);
  };
  
  // Sürükle bırak işlemi
  const handleDragEnd = (result: DropResult) => {
    try {
      if (!result || !result.destination) return;
      
      // steps undefined veya array değilse, erken döndür
      if (!steps || !Array.isArray(steps) || steps.length === 0) return;
      
      const items = Array.from(steps);
      
      // Source ve destination değerlerinin geçerli olduğundan emin ol
      if (result.source.index < 0 || result.source.index >= items.length) {
        console.error("Sürükle-bırak işleminde geçersiz kaynak indeksi:", result.source.index);
        return;
      }
      
      const [reorderedItem] = items.splice(result.source.index, 1);
      if (!reorderedItem) {
        console.error("Sürükle-bırak sırasında öğe bulunamadı");
        return;
      }
      
      items.splice(result.destination.index, 0, reorderedItem);
      
      const updatedItems = items.map((item, index) => ({
        ...item,
        stepOrder: index + 1,
      }));
      
      updateStepOrdersMutation.mutate(updatedItems);
    } catch (error) {
      console.error("Sürükle-bırak işlemi sırasında hata oluştu:", error);
      toast({
        title: "Hata!",
        description: "Sıralama işlemi sırasında bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.",
        variant: "destructive",
      });
    }
  };
  
  // Form değerlerini güncelle
  useEffect(() => {
    try {
      if (steps && Array.isArray(steps) && steps.length > 0) {
        createForm.setValue("stepOrder", steps.length + 1);
        
        // En son adımın bitiş gününü hesapla
        const sortedSteps = [...steps].sort((a, b) => 
          ((typeof a.dayOffset === 'number') ? a.dayOffset : 0) - 
          ((typeof b.dayOffset === 'number') ? b.dayOffset : 0)
        );
        const lastStep = sortedSteps.length > 0 ? sortedSteps[sortedSteps.length - 1] : null;
        const newDayOffset = lastStep ? 
          ((typeof lastStep.dayOffset === 'number') ? lastStep.dayOffset : 0) + 
          ((typeof lastStep.estimatedDuration === 'number') ? lastStep.estimatedDuration : 1) 
          : 0;
        
        createForm.setValue("dayOffset", newDayOffset);
      }
    } catch (error) {
      console.error("Adım form değerlerini güncellerken hata oluştu:", error);
      // Hata durumunda güvenli değerleri atayalım
      createForm.setValue("stepOrder", 1);
      createForm.setValue("dayOffset", 0);
    }
  }, [steps]);
  
  if (!match) {
    navigate("/planning/route-templates");
    return null;
  }
  
  if (isTemplateLoading) {
    return (
      <div className="container mx-auto py-4">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }
  
  if (!template) {
    return (
      <div className="container mx-auto py-4">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-center text-destructive mb-4">
            Şablon bulunamadı.
          </p>
          <Button variant="outline" onClick={() => navigate("/planning/route-templates")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Şablonlara Dön
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-4">
      <PageHeader
        title={`Rota Adımları: ${template.name}`}
        description="Üretim rotası şablonu için adımları düzenleyin"
        actions={
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate("/planning/route-templates")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Adım
            </Button>
          </div>
        }
      />
      
      {!isStepsLoading && !isStepsError && Array.isArray(steps) && (
        <div className="flex items-center space-x-4 mt-4">
          <div className="bg-muted p-2 rounded-md text-sm flex flex-col items-center">
            <span className="font-medium text-primary">{steps.length}</span>
            <span className="text-xs">Toplam Adım</span>
          </div>
          <div className="bg-muted p-2 rounded-md text-sm flex flex-col items-center">
            <span className="font-medium text-primary">
              {steps.reduce((total, step: any) => total + (step.estimatedDuration || 1), 0)} gün
            </span>
            <span className="text-xs">Toplam Süre</span>
          </div>
          <div className="bg-muted p-2 rounded-md text-sm flex flex-col items-center">
            <span className="font-medium text-primary">
              {steps.length > 0 
                ? Math.max(...steps.map((s: any) => (s.dayOffset || 0) + (s.estimatedDuration || 1))) 
                : 0} gün
            </span>
            <span className="text-xs">Tamamlanma Süresi</span>
          </div>
        </div>
      )}
      
      {isStepsLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : isStepsError ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center h-40">
            <p className="text-center text-destructive">
              Adımlar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.
            </p>
          </CardContent>
        </Card>
      ) : steps.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center h-40">
            <Route className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">
              Bu rotada henüz adım bulunmamaktadır. Yeni bir adım eklemek için
              "Yeni Adım" butonuna tıklayın.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="steps">
              {(provided) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Sıra</TableHead>
                        <TableHead className="w-[180px]">Proses Tipi</TableHead>
                        <TableHead>Departman</TableHead>
                        <TableHead className="w-[100px]">Gün Offset</TableHead>
                        <TableHead className="w-[100px]">Süre (Gün)</TableHead>
                        <TableHead className="w-[180px]">Boya Reçetesi</TableHead>
                        <TableHead className="w-[100px]">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {steps.map((step: any, index: number) => (
                        <Draggable key={step.id} draggableId={step.id.toString()} index={index}>
                          {(provided) => (
                            <TableRow
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="cursor-move"
                            >
                              <TableCell>{step.stepOrder}</TableCell>
                              <TableCell>
                                {(() => {
                                  const processType = processTypes.find((p: any) => p.id === step.processTypeId);
                                  return (
                                    <div className="flex items-center">
                                      {processType?.color && (
                                        <div 
                                          className="w-3 h-3 rounded-full mr-2" 
                                          style={{ backgroundColor: processType.color }}
                                        />
                                      )}
                                      {processType?.name || "-"}
                                    </div>
                                  );
                                })()}
                              </TableCell>
                              <TableCell>
                                {departments.find((d: any) => d.id === step.departmentId)?.name || "-"}
                              </TableCell>
                              <TableCell>{step.dayOffset}</TableCell>
                              <TableCell>{step.estimatedDuration || 1}</TableCell>
                              <TableCell>
                                {(() => {
                                  if (!step.dyeRecipeId) return "-";
                                  const recipe = dyeRecipes.find((r: any) => r.id === step.dyeRecipeId);
                                  if (!recipe) return "-";
                                  return (
                                    <div className="flex items-center">
                                      <div 
                                        className="w-3 h-3 rounded-full mr-2" 
                                        style={{ backgroundColor: '#0ea5e9' }}
                                      />
                                      <span className="font-medium text-sm">{recipe.recipeName}</span>
                                      <span className="text-xs text-muted-foreground ml-1">({recipe.recipeType})</span>
                                    </div>
                                  );
                                })()}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditStep(step)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={() => handleDeleteStep(step)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
      
      {/* Yeni Adım Ekleme Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yeni Rota Adımı Ekle</DialogTitle>
            <DialogDescription>
              {template.name} rotasına yeni bir üretim adımı ekleyin.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="processTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proses Tipi *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Proses tipi seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {processTypes.map((processType: any) => (
                            <SelectItem 
                              key={processType.id} 
                              value={processType.id.toString()}
                            >
                              {processType.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departman *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Departman seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((department: any) => (
                            <SelectItem 
                              key={department.id} 
                              value={department.id.toString()}
                            >
                              {department.name}
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
                  control={createForm.control}
                  name="machineId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Makine</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                        defaultValue={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Makine seçin (opsiyonel)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no-selection">Makine Seçilmedi</SelectItem>
                          {machines.map((machine: any) => (
                            <SelectItem
                              key={machine.id}
                              value={machine.id.toString()}
                            >
                              {machine.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
{/* Boya reçetesi alanı kaldırıldı - bu işlem boya departmanı tarafından yapılacak */}
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={createForm.control}
                  name="stepOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sıra No</FormLabel>
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
                  control={createForm.control}
                  name="dayOffset"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gün Offset</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Başlangıç gününden itibaren kaç gün sonra başlayacağı
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="estimatedDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tahmini Süre (Gün)</FormLabel>
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
              

              
              <FormField
                control={createForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Bu adım hakkında ek notlar girin"
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
                  disabled={createStepMutation.isPending}
                >
                  {createStepMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Adım Ekle
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Adım Düzenleme Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Rota Adımını Düzenle</DialogTitle>
            <DialogDescription>
              {template.name} rotasındaki adımı düzenleyin.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="processTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proses Tipi *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Proses tipi seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {processTypes.map((processType: any) => (
                            <SelectItem 
                              key={processType.id} 
                              value={processType.id.toString()}
                            >
                              {processType.name}
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
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departman *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Departman seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((department: any) => (
                            <SelectItem 
                              key={department.id} 
                              value={department.id.toString()}
                            >
                              {department.name}
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
                  name="stepOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sıra No</FormLabel>
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
                  name="dayOffset"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gün Offset</FormLabel>
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
                  name="estimatedDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tahmini Süre (Gün)</FormLabel>
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
                  control={editForm.control}
                  name="machineId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Makine (İsteğe Bağlı)</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value !== "no-selection" ? parseInt(value) : null)}
                        value={field.value ? field.value.toString() : "no-selection"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Makine seçin (isteğe bağlı)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no-selection">Makine seçilmedi</SelectItem>
                          {machines.map((machine: any) => (
                            <SelectItem 
                              key={machine.id} 
                              value={machine.id.toString()}
                            >
                              {machine.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
{/* Boya reçetesi alanı kaldırıldı - bu işlem boya departmanı tarafından yapılacak */}
              </div>
              
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Bu adım hakkında ek notlar girin"
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
                  disabled={updateStepMutation.isPending}
                >
                  {updateStepMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Güncelle
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Adım Silme Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adımı Sil</DialogTitle>
            <DialogDescription>
              Bu rota adımını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-muted-foreground">
              <strong className="font-semibold text-foreground">
                {selectedStep && processTypes.find((p: any) => p.id === selectedStep.processTypeId)?.name} 
              </strong> adlı proses adımını silmek üzeresiniz.
            </p>
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
              onClick={() => deleteStepMutation.mutate()}
              disabled={deleteStepMutation.isPending}
            >
              {deleteStepMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}