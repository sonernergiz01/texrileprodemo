import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { Loader2, CheckCircle, ArrowRight, FileCheck, AlertCircle, Filter } from "lucide-react";

import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Form şeması
const assignRecipeSchema = z.object({
  dyeRecipeId: z.number({
    required_error: "Boya reçetesi seçilmelidir",
  }),
  notes: z.string().optional(),
});

export default function PendingAssignmentsPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<PendingStep | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [filterText, setFilterText] = useState<string>("");
  
  // Type tanımlamaları
  type PendingStep = {
    id: number;
    templateId: number;
    templateName: string;
    processTypeId: number;
    departmentId: number;
    stepOrder: number;
    dyeRecipeId: number | null;
    duration: number | null;
    dayOffset: number | null;
    estimatedDuration: number | null;
    notes: string | null;
    isRequired: boolean;
    dueDate?: Date;
    daysToDue?: number;
    isUrgent?: boolean;
    isDueToday?: boolean;
  };

  type Department = {
    id: number;
    name: string;
    code: string;
    color?: string;
  };

  type ProcessType = {
    id: number;
    name: string;
    code: string;
    departmentId: number;
    color?: string;
  };

  type DyeRecipe = {
    id: number;
    name: string;
    recipeName: string;
    recipeCode: string;
    recipeType: string;
  };

  // Bekleyen görevleri getir
  const {
    data: pendingSteps = [] as PendingStep[],
    isLoading: isPendingLoading,
    error: pendingError,
  } = useQuery<PendingStep[]>({
    queryKey: ["/api/dye-recipes/pending-assignments"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Boya reçetelerini getir
  const {
    data: dyeRecipes = [] as DyeRecipe[],
    isLoading: isDyeRecipesLoading,
  } = useQuery<DyeRecipe[]>({
    queryKey: ["/api/dye-recipes"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Departmanları getir
  const { data: departments = [] as Department[] } = useQuery<Department[]>({
    queryKey: ["/api/admin/departments"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Proses tiplerini getir
  const { data: processTypes = [] as ProcessType[] } = useQuery<ProcessType[]>({
    queryKey: ["/api/planning/process-types"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Reçete atama formu
  const assignForm = useForm({
    resolver: zodResolver(assignRecipeSchema),
    defaultValues: {
      dyeRecipeId: 0,
      notes: "",
    },
  });
  
  // Reçete atama işlemi
  const assignRecipeMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedStep) {
        throw new Error("Seçilen adım bulunamadı");
      }
      
      // dyeRecipeId'nin sayı olduğundan emin olalım
      const payload = {
        ...data,
        dyeRecipeId: Number(data.dyeRecipeId)
      };
      
      console.log("Reçete atama isteği gönderiliyor:", payload);
      
      const res = await apiRequest(
        "PUT", 
        `/api/dye-recipes/route-template-steps/${selectedStep.id}/assign-recipe`,
        payload
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı!",
        description: "Boya reçetesi başarıyla atandı.",
      });
      
      queryClient.invalidateQueries({
        queryKey: ["/api/dye-recipes/pending-assignments"],
      });
      
      setIsAssignDialogOpen(false);
      setSelectedStep(null);
    },
    onError: (error: any) => {
      console.error("Reçete atama hatası:", error);
      toast({
        title: "Hata!",
        description: `Reçete atanırken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Reçete atama fonksiyonu
  const onAssignSubmit = (data: any) => {
    assignRecipeMutation.mutate({
      ...data,
      stepId: selectedStep.id,
    });
  };
  
  // Adım seçme ve dialog açma
  const handleAssignRecipe = (step: any) => {
    setSelectedStep(step);
    assignForm.reset({
      dyeRecipeId: 0,
      notes: "",
    });
    setIsAssignDialogOpen(true);
  };
  
  // Filtereler
  const filteredSteps = pendingSteps.filter((step: any) => {
    // Tab filtreleme
    if (activeTab === "urgent" && !step.isUrgent) {
      return false;
    }
    if (activeTab === "today" && !step.isDueToday) {
      return false;
    }
    
    // Metin filtreleme
    if (filterText) {
      const templateName = step.templateName?.toLowerCase() || "";
      const processName = processTypes.find((p: any) => p.id === step.processTypeId)?.name?.toLowerCase() || "";
      const searchText = filterText.toLowerCase();
      
      if (!templateName.includes(searchText) && !processName.includes(searchText)) {
        return false;
      }
    }
    
    return true;
  });
  
  // Yükleme durumunda loading göster
  if (isPendingLoading) {
    return (
      <div className="container mx-auto py-4">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-4">
      <PageHeader
        title="Bekleyen Boya Reçetesi Görevleri"
        description="Planlama tarafından oluşturulmuş ve reçete ataması bekleyen adımlar"
      />
      
      <div className="mt-6 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>İş Listesi</CardTitle>
              <div className="flex gap-4">
                <div className="relative w-64">
                  <Input
                    placeholder="Ara..."
                    className="pl-8"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                  />
                  <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            <CardDescription>
              Toplam {filteredSteps.length} bekleyen görev bulunuyor
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs
              defaultValue="all"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="all">Tümü</TabsTrigger>
                <TabsTrigger value="urgent">Acil</TabsTrigger>
                <TabsTrigger value="today">Bugün</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-0">
                <StepsList
                  steps={filteredSteps}
                  departments={departments}
                  processTypes={processTypes}
                  onAssign={handleAssignRecipe}
                />
              </TabsContent>
              
              <TabsContent value="urgent" className="mt-0">
                <StepsList
                  steps={filteredSteps}
                  departments={departments}
                  processTypes={processTypes}
                  onAssign={handleAssignRecipe}
                />
              </TabsContent>
              
              <TabsContent value="today" className="mt-0">
                <StepsList
                  steps={filteredSteps}
                  departments={departments}
                  processTypes={processTypes}
                  onAssign={handleAssignRecipe}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Reçete Atama Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Boya Reçetesi Ata</DialogTitle>
            <DialogDescription>
              Bu adıma bir boya reçetesi atayın veya yeni reçete oluşturun.
            </DialogDescription>
          </DialogHeader>
          
          {selectedStep && (
            <div className="py-2">
              <div className="font-medium">{selectedStep.templateName}</div>
              <div className="text-muted-foreground text-sm">
                Proses: {processTypes.find((p: any) => p.id === selectedStep.processTypeId)?.name}
              </div>
            </div>
          )}
          
          <Form {...assignForm}>
            <form onSubmit={assignForm.handleSubmit(onAssignSubmit)} className="space-y-4">
              <FormField
                control={assignForm.control}
                name="dyeRecipeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Boya Reçetesi *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Reçete seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dyeRecipes.map((recipe: any) => (
                          <SelectItem 
                            key={recipe.id} 
                            value={recipe.id.toString()}
                          >
                            {recipe.recipeName} ({recipe.recipeType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Atamak istediğiniz reçeteyi seçin
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dye-recipes/new")}
                >
                  Yeni Reçete Oluştur
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAssignDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit"
                    disabled={assignRecipeMutation.isPending}
                  >
                    {assignRecipeMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Reçete Ata
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Adım listesi bileşeni
function StepsList({ 
  steps, 
  departments, 
  processTypes, 
  onAssign 
}: { 
  steps: any[], 
  departments: any[], 
  processTypes: any[],
  onAssign: (step: any) => void
}) {
  if (!steps.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 border rounded-md bg-muted/10">
        <FileCheck className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Bekleyen görev bulunmuyor</p>
      </div>
    );
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Durum</TableHead>
            <TableHead className="w-[200px]">Rota</TableHead>
            <TableHead className="w-[150px]">Proses Tipi</TableHead>
            <TableHead>Departman</TableHead>
            <TableHead className="w-[100px]">Bitiş Süresi</TableHead>
            <TableHead className="w-[100px]">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {steps.map((step: any) => (
            <TableRow key={step.id}>
              <TableCell>
                {step.isUrgent ? (
                  <span className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-destructive mr-1" />
                    <Badge variant="destructive">Acil</Badge>
                  </span>
                ) : step.isDueToday ? (
                  <span className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Bugün</Badge>
                  </span>
                ) : (
                  <span className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-muted-foreground mr-1" />
                    <Badge variant="outline">Normal</Badge>
                  </span>
                )}
              </TableCell>
              <TableCell className="font-medium">{step.templateName}</TableCell>
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
              <TableCell>
                {step.daysToDue <= 0 
                  ? "Bugün" 
                  : step.daysToDue === 1 
                    ? "Yarın" 
                    : `${step.daysToDue} gün`}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center"
                  onClick={() => onAssign(step)}
                >
                  <span className="mr-1">Ata</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}