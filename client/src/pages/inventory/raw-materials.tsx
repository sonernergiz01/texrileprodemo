import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit, Trash, Plus, Search, Database } from "lucide-react";

// Form Schemas
const rawMaterialSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  code: z.string().min(2, "Kod en az 2 karakter olmalıdır"),
  description: z.string().optional(),
  unit: z.string().min(1, "Birim gereklidir"),
});

type RawMaterialFormValues = z.infer<typeof rawMaterialSchema>;

export default function RawMaterialsPage() {
  const { toast } = useToast();
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);
  
  // Raw Materials
  const {
    data: rawMaterials = [],
    isLoading: isLoadingMaterials,
  } = useQuery<any[]>({
    queryKey: ["/api/master/raw-materials"],
  });

  // Filtered materials
  const filteredMaterials = rawMaterials.filter((material: any) => 
    material.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (material.description && material.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Material Form
  const materialForm = useForm<RawMaterialFormValues>({
    resolver: zodResolver(rawMaterialSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      unit: "",
    },
  });

  const resetMaterialForm = () => {
    materialForm.reset({
      name: "",
      code: "",
      description: "",
      unit: "",
    });
    setSelectedMaterial(null);
  };

  // Add Raw Material
  const addMaterialMutation = useMutation({
    mutationFn: async (values: RawMaterialFormValues) => {
      const res = await apiRequest("POST", "/api/master/raw-materials", values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Hammadde Eklendi",
        description: "Yeni hammadde başarıyla eklendi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/master/raw-materials"] });
      setMaterialDialogOpen(false);
      resetMaterialForm();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Hammadde eklenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Edit Raw Material
  const editMaterialMutation = useMutation({
    mutationFn: async (values: RawMaterialFormValues & { id: number }) => {
      const { id, ...data } = values;
      const res = await apiRequest("PATCH", `/api/master/raw-materials/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Hammadde Güncellendi",
        description: "Hammadde başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/master/raw-materials"] });
      setMaterialDialogOpen(false);
      resetMaterialForm();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Hammadde güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete Raw Material
  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/master/raw-materials/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Hammadde Silindi",
        description: "Hammadde başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/master/raw-materials"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Hammadde silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submit
  const handleMaterialSubmit = (values: RawMaterialFormValues) => {
    if (selectedMaterial) {
      editMaterialMutation.mutate({ ...values, id: selectedMaterial.id });
    } else {
      addMaterialMutation.mutate(values);
    }
  };

  // Edit material
  const handleEditMaterial = (material: any) => {
    setSelectedMaterial(material);
    materialForm.reset({
      name: material.name,
      code: material.code,
      description: material.description || "",
      unit: material.unit,
    });
    setMaterialDialogOpen(true);
  };

  // Delete material
  const handleDeleteMaterial = (id: number) => {
    if (window.confirm("Bu hammaddeyi silmek istediğinizden emin misiniz?")) {
      deleteMaterialMutation.mutate(id);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Hammaddeler Yönetimi</h2>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Hammaddeler</CardTitle>
            <div className="flex space-x-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ara..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Dialog open={materialDialogOpen} onOpenChange={(open) => {
                setMaterialDialogOpen(open);
                if (!open) resetMaterialForm();
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    resetMaterialForm();
                    setMaterialDialogOpen(true);
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni Hammadde
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedMaterial ? "Hammadde Düzenle" : "Yeni Hammadde Ekle"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...materialForm}>
                    <form onSubmit={materialForm.handleSubmit(handleMaterialSubmit)} className="space-y-4 py-2">
                      <FormField
                        control={materialForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hammadde Adı</FormLabel>
                            <FormControl>
                              <Input placeholder="Hammadde adı girin" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={materialForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hammadde Kodu</FormLabel>
                            <FormControl>
                              <Input placeholder="Hammadde kodu girin" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={materialForm.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Birim</FormLabel>
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
                                <SelectItem value="kg">Kilogram (kg)</SelectItem>
                                <SelectItem value="g">Gram (g)</SelectItem>
                                <SelectItem value="l">Litre (l)</SelectItem>
                                <SelectItem value="m">Metre (m)</SelectItem>
                                <SelectItem value="m2">Metrekare (m²)</SelectItem>
                                <SelectItem value="adet">Adet</SelectItem>
                                <SelectItem value="ton">Ton</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={materialForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Açıklama</FormLabel>
                            <FormControl>
                              <Input placeholder="Açıklama girin" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter className="pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            resetMaterialForm();
                            setMaterialDialogOpen(false);
                          }}
                        >
                          İptal
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={addMaterialMutation.isPending || editMaterialMutation.isPending}
                        >
                          {(addMaterialMutation.isPending || editMaterialMutation.isPending) ? (
                            <>
                              <span className="mr-2 h-4 w-4 animate-spin" />
                              İşleniyor...
                            </>
                          ) : (
                            selectedMaterial ? "Güncelle" : "Ekle"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingMaterials ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Kod</TableHead>
                      <TableHead>Ad</TableHead>
                      <TableHead>Birim</TableHead>
                      <TableHead className="max-w-[200px]">Açıklama</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          Kayıt bulunamadı.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMaterials.map((material: any) => (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">{material.code}</TableCell>
                          <TableCell>{material.name}</TableCell>
                          <TableCell>{material.unit}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{material.description}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditMaterial(material)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMaterial(material.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}