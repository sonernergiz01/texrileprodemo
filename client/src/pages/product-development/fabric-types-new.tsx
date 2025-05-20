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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit, Trash, Plus, Search, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Otomatik kod oluşturma fonksiyonu - "KMS-XX-YYYY" formatında
const generateFabricCode = (name: string) => {
  const date = new Date();
  const year = date.getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  
  // İsimden 2 harfli prefix oluştur
  const namePrefix = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  const prefix = namePrefix.length >= 2 ? namePrefix : (namePrefix + 'T').substring(0, 2);
  return `KMS-${prefix}-${randomNum}`;
};

// Form Schemas
const fabricTypeSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  // code artık otomatik oluşturulacak
  description: z.string().optional(),
  properties: z.object({
    desenVaryant: z.string().optional(),
    grupAdi: z.string().optional(),
    en: z.number().optional(),
    gramaj: z.number().optional(),
    harman: z.string().optional(),
    orgu: z.string().optional(),
    strechYonu: z.string().optional(),
    tuse: z.string().optional(),
    tarih: z.string().optional(), // string olarak alıp sonra Date'e çevireceğiz
    boyamaTuru: z.string().optional(),
  }).optional().default({})
});

type FabricTypeFormValues = z.infer<typeof fabricTypeSchema>;

export default function FabricTypesPage() {
  const { toast } = useToast();
  const [fabricDialogOpen, setFabricDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFabric, setSelectedFabric] = useState<any | null>(null);
  
  // Fabric Types
  const {
    data: fabricTypes = [],
    isLoading: isLoadingFabrics,
  } = useQuery<any[]>({
    queryKey: ["/api/product-development/fabric-types"],
  });

  // Filtered fabrics
  const filteredFabrics = fabricTypes.filter((fabric: any) => 
    fabric.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fabric.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (fabric.description && fabric.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Fabric Form
  const fabricForm = useForm<FabricTypeFormValues>({
    resolver: zodResolver(fabricTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      properties: {
        desenVaryant: "",
        grupAdi: "",
        en: undefined,
        gramaj: undefined,
        harman: "",
        orgu: "",
        strechYonu: "",
        tuse: "",
        tarih: new Date().toISOString().split('T')[0],
        boyamaTuru: "",
      }
    },
  });

  const resetFabricForm = () => {
    fabricForm.reset({
      name: "",
      description: "",
      properties: {
        desenVaryant: "",
        grupAdi: "",
        en: undefined,
        gramaj: undefined,
        harman: "",
        orgu: "",
        strechYonu: "",
        tuse: "",
        tarih: new Date().toISOString().split('T')[0],
        boyamaTuru: "",
      }
    });
    setSelectedFabric(null);
  };

  // Add Fabric Type
  const addFabricMutation = useMutation({
    mutationFn: async (values: FabricTypeFormValues) => {
      const res = await apiRequest("POST", "/api/product-development/fabric-types", values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Kumaş Tipi Eklendi",
        description: "Yeni kumaş tipi başarıyla eklendi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/product-development/fabric-types"] });
      setFabricDialogOpen(false);
      resetFabricForm();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Kumaş tipi eklenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Edit Fabric Type
  const editFabricMutation = useMutation({
    mutationFn: async (values: FabricTypeFormValues & { id: number }) => {
      const { id, ...data } = values;
      const res = await apiRequest("PATCH", `/api/product-development/fabric-types/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Kumaş Tipi Güncellendi",
        description: "Kumaş tipi başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/product-development/fabric-types"] });
      setFabricDialogOpen(false);
      resetFabricForm();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Kumaş tipi güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete Fabric Type
  const deleteFabricMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/product-development/fabric-types/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Kumaş Tipi Silindi",
        description: "Kumaş tipi başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/product-development/fabric-types"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Kumaş tipi silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submit
  const handleFabricSubmit = (values: FabricTypeFormValues) => {
    // Yeni eklemede tip kodu otomatik olarak oluşturulacak
    if (selectedFabric) {
      editFabricMutation.mutate({ ...values, id: selectedFabric.id });
    } else {
      // Otomatik kod oluştur
      const code = generateFabricCode(values.name);
      addFabricMutation.mutate({ ...values, code });
    }
  };

  // Edit fabric
  const handleEditFabric = (fabric: any) => {
    setSelectedFabric(fabric);
    const props = fabric.properties || {};
    
    fabricForm.reset({
      name: fabric.name,
      description: fabric.description || "",
      properties: {
        desenVaryant: props.desenVaryant || "",
        grupAdi: props.grupAdi || "",
        en: props.en || undefined,
        gramaj: props.gramaj || undefined,
        harman: props.harman || "",
        orgu: props.orgu || "",
        strechYonu: props.strechYonu || "",
        tuse: props.tuse || "",
        tarih: props.tarih || new Date().toISOString().split('T')[0],
        boyamaTuru: props.boyamaTuru || "",
      }
    });
    setFabricDialogOpen(true);
  };

  // Delete fabric
  const handleDeleteFabric = (id: number) => {
    if (window.confirm("Bu kumaş tipini silmek istediğinizden emin misiniz?")) {
      deleteFabricMutation.mutate(id);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Kumaş Tipleri Yönetimi</h2>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Kumaş Tipleri</CardTitle>
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
              <Dialog open={fabricDialogOpen} onOpenChange={(open) => {
                setFabricDialogOpen(open);
                if (!open) resetFabricForm();
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    resetFabricForm();
                    setFabricDialogOpen(true);
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni Kumaş Tipi
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px]">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedFabric ? "Kumaş Tipi Düzenle" : "Yeni Kumaş Tipi Ekle"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...fabricForm}>
                    <form onSubmit={fabricForm.handleSubmit(handleFabricSubmit)} className="space-y-6 py-2">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Kumaş Adı */}
                        <FormField
                          control={fabricForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kumaş Adı</FormLabel>
                              <FormControl>
                                <Input placeholder="Kumaş adı girin" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Açıklama */}
                        <FormField
                          control={fabricForm.control}
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
                      </div>
                      
                      {selectedFabric && (
                        <div className="py-2 px-3 bg-slate-50 rounded-md border">
                          <p className="text-sm text-muted-foreground">Kod: <span className="font-semibold text-foreground">{selectedFabric.code}</span></p>
                          <p className="text-xs text-muted-foreground">Kumaş kodu otomatik olarak oluşturulur ve düzenlenemez</p>
                        </div>
                      )}
                      
                      <div className="border rounded-md p-4 bg-white shadow-sm">
                        <h3 className="font-medium text-lg mb-4">Kumaş Özellikleri</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {/* Desen Varyant */}
                          <FormField
                            control={fabricForm.control}
                            name="properties.desenVaryant"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Desen Varyant</FormLabel>
                                <FormControl>
                                  <Input placeholder="Desen varyantı" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Grup Adı */}
                          <FormField
                            control={fabricForm.control}
                            name="properties.grupAdi"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Grup Adı</FormLabel>
                                <FormControl>
                                  <Input placeholder="Grup adı" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* En */}
                          <FormField
                            control={fabricForm.control}
                            name="properties.en"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>En (cm)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="Kumaş eni" 
                                    {...field} 
                                    value={field.value === undefined ? "" : field.value} 
                                    onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Gramaj */}
                          <FormField
                            control={fabricForm.control}
                            name="properties.gramaj"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Gramaj</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="Gramaj" 
                                    {...field} 
                                    value={field.value === undefined ? "" : field.value} 
                                    onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Harman */}
                          <FormField
                            control={fabricForm.control}
                            name="properties.harman"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Harman</FormLabel>
                                <FormControl>
                                  <Input placeholder="Harman bilgisi" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Örgü */}
                          <FormField
                            control={fabricForm.control}
                            name="properties.orgu"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Örgü</FormLabel>
                                <FormControl>
                                  <Input placeholder="Örgü bilgisi" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Strech Yönü */}
                          <FormField
                            control={fabricForm.control}
                            name="properties.strechYonu"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Strech Yönü</FormLabel>
                                <FormControl>
                                  <Select
                                    value={field.value || ""}
                                    onValueChange={field.onChange}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Yok">Yok</SelectItem>
                                      <SelectItem value="Çözgü">Çözgü</SelectItem>
                                      <SelectItem value="Atkı">Atkı</SelectItem>
                                      <SelectItem value="Her İki Yönde">Her İki Yönde</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Tuşe */}
                          <FormField
                            control={fabricForm.control}
                            name="properties.tuse"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tuşe</FormLabel>
                                <FormControl>
                                  <Input placeholder="Tuşe bilgisi" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Tarih */}
                          <FormField
                            control={fabricForm.control}
                            name="properties.tarih"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tarih</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date"
                                    placeholder="Tarih seçin" 
                                    {...field} 
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Boyama Türü */}
                          <FormField
                            control={fabricForm.control}
                            name="properties.boyamaTuru"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Boyama Türü</FormLabel>
                                <FormControl>
                                  <Select
                                    value={field.value || ""}
                                    onValueChange={field.onChange}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Reaktif">Reaktif</SelectItem>
                                      <SelectItem value="Dispers">Dispers</SelectItem>
                                      <SelectItem value="Reaktif-Dispers">Reaktif-Dispers</SelectItem>
                                      <SelectItem value="Direkt">Direkt</SelectItem>
                                      <SelectItem value="Küp">Küp</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button type="submit" disabled={addFabricMutation.isPending || editFabricMutation.isPending}>
                          {(addFabricMutation.isPending || editFabricMutation.isPending) ? (
                            <>
                              <span className="mr-2 h-4 w-4 animate-spin">⏳</span>
                              {selectedFabric ? "Güncelleniyor..." : "Ekleniyor..."}
                            </>
                          ) : (
                            <>{selectedFabric ? "Güncelle" : "Ekle"}</>
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
            {isLoadingFabrics ? (
              <div className="flex justify-center py-4">
                <span className="loading loading-spinner"></span>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kod</TableHead>
                      <TableHead>Kumaş Adı</TableHead>
                      <TableHead>Grup</TableHead>
                      <TableHead>En (cm)</TableHead>
                      <TableHead>Gramaj</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFabrics.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Kayıt bulunamadı.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFabrics.map((fabric: any) => (
                        <TableRow key={fabric.id}>
                          <TableCell className="font-medium">{fabric.code}</TableCell>
                          <TableCell>{fabric.name}</TableCell>
                          <TableCell>
                            {fabric.properties?.grupAdi || "-"}
                          </TableCell>
                          <TableCell>
                            {fabric.properties?.en || "-"}
                          </TableCell>
                          <TableCell>
                            {fabric.properties?.gramaj || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleEditFabric(fabric)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleDeleteFabric(fabric.id)}
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