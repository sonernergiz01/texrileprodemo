import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit, Trash, Plus, Search, Database } from "lucide-react";

// Form Schemas
const fabricTypeSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  code: z.string().min(2, "Kod en az 2 karakter olmalıdır"),
  description: z.string().optional(),
});

const yarnTypeSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  code: z.string().min(2, "Kod en az 2 karakter olmalıdır"),
  description: z.string().optional(),
});

const rawMaterialSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  code: z.string().min(2, "Kod en az 2 karakter olmalıdır"),
  description: z.string().optional(),
  unit: z.string().min(1, "Birim gereklidir"),
});

export default function MasterData() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("other");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Forms
  const fabricForm = useForm<z.infer<typeof fabricTypeSchema>>({
    resolver: zodResolver(fabricTypeSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
    },
  });
  
  const yarnForm = useForm<z.infer<typeof yarnTypeSchema>>({
    resolver: zodResolver(yarnTypeSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
    },
  });
  
  const materialForm = useForm<z.infer<typeof rawMaterialSchema>>({
    resolver: zodResolver(rawMaterialSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      unit: "",
    },
  });
  
  // Mutations
  const createFabricTypeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof fabricTypeSchema>) => {
      const res = await apiRequest("POST", "/api/master/fabrics", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Kumaş Tipi Oluşturuldu",
        description: "Yeni kumaş tipi başarıyla oluşturuldu.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/master/fabrics"] });
      setFabricDialogOpen(false);
      fabricForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "Kumaş tipi oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  const createYarnTypeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof yarnTypeSchema>) => {
      const res = await apiRequest("POST", "/api/master/yarns", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "İplik Tipi Oluşturuldu",
        description: "Yeni iplik tipi başarıyla oluşturuldu.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/master/yarns"] });
      setYarnDialogOpen(false);
      yarnForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "İplik tipi oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  const createRawMaterialMutation = useMutation({
    mutationFn: async (data: z.infer<typeof rawMaterialSchema>) => {
      const res = await apiRequest("POST", "/api/master/raw-materials", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Hammadde Oluşturuldu",
        description: "Yeni hammadde başarıyla oluşturuldu.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/master/raw-materials"] });
      setMaterialDialogOpen(false);
      materialForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "Hammadde oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  // Submit handlers
  const onFabricSubmit = (data: z.infer<typeof fabricTypeSchema>) => {
    createFabricTypeMutation.mutate(data);
  };
  
  const onYarnSubmit = (data: z.infer<typeof yarnTypeSchema>) => {
    createYarnTypeMutation.mutate(data);
  };
  
  const onMaterialSubmit = (data: z.infer<typeof rawMaterialSchema>) => {
    createRawMaterialMutation.mutate(data);
  };
  
  // Filtered data based on search
  const filteredFabrics = searchQuery 
    ? fabricTypes.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : fabricTypes;
    
  const filteredYarns = searchQuery 
    ? yarnTypes.filter(y => 
        y.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        y.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (y.description && y.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : yarnTypes;
    
  const filteredMaterials = searchQuery 
    ? rawMaterials.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : rawMaterials;
  
  return (
    <PageContainer
      title="Ana Veri Yönetimi"
      subtitle="Kumaş, iplik ve hammadde bilgilerini yönetin"
      breadcrumbs={[
        { label: "Ana Sayfa", href: "/" },
        { label: "Admin", href: "/admin" },
        { label: "Ana Veri Yönetimi", href: "/admin/master-data" },
      ]}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Ana Veri Yönetimi
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ara..."
                  className="pl-8 w-60"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {activeTab === "fabrics" && (
                <Dialog open={fabricDialogOpen} onOpenChange={setFabricDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Yeni Kumaş Tipi
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Yeni Kumaş Tipi Ekle</DialogTitle>
                      <DialogDescription>
                        Sisteme yeni bir kumaş tipi ekleyin. Eklenen kumaş tipleri sipariş girişlerinde kullanılabilir.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...fabricForm}>
                      <form onSubmit={fabricForm.handleSubmit(onFabricSubmit)} className="space-y-4">
                        <FormField
                          control={fabricForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kumaş Adı</FormLabel>
                              <FormControl>
                                <Input placeholder="Kumaş adı" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={fabricForm.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kod</FormLabel>
                              <FormControl>
                                <Input placeholder="Kumaş kodu" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={fabricForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Açıklama</FormLabel>
                              <FormControl>
                                <Input placeholder="Açıklama" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setFabricDialogOpen(false)}>
                            İptal
                          </Button>
                          <Button type="submit" disabled={createFabricTypeMutation.isPending}>
                            {createFabricTypeMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
              {activeTab === "yarns" && (
                <Dialog open={yarnDialogOpen} onOpenChange={setYarnDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Yeni İplik Tipi
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Yeni İplik Tipi Ekle</DialogTitle>
                      <DialogDescription>
                        Sisteme yeni bir iplik tipi ekleyin. Eklenen iplik tipleri üretim süreçlerinde kullanılabilir.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...yarnForm}>
                      <form onSubmit={yarnForm.handleSubmit(onYarnSubmit)} className="space-y-4">
                        <FormField
                          control={yarnForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>İplik Adı</FormLabel>
                              <FormControl>
                                <Input placeholder="İplik adı" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={yarnForm.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kod</FormLabel>
                              <FormControl>
                                <Input placeholder="İplik kodu" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={yarnForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Açıklama</FormLabel>
                              <FormControl>
                                <Input placeholder="Açıklama" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setYarnDialogOpen(false)}>
                            İptal
                          </Button>
                          <Button type="submit" disabled={createYarnTypeMutation.isPending}>
                            {createYarnTypeMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
              {activeTab === "materials" && (
                <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Yeni Hammadde
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Yeni Hammadde Ekle</DialogTitle>
                      <DialogDescription>
                        Sisteme yeni bir hammadde ekleyin. Eklenen hammaddeler üretim ve stok yönetiminde kullanılabilir.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...materialForm}>
                      <form onSubmit={materialForm.handleSubmit(onMaterialSubmit)} className="space-y-4">
                        <FormField
                          control={materialForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hammadde Adı</FormLabel>
                              <FormControl>
                                <Input placeholder="Hammadde adı" {...field} />
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
                              <FormLabel>Kod</FormLabel>
                              <FormControl>
                                <Input placeholder="Hammadde kodu" {...field} />
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
                              <FormControl>
                                <Input placeholder="Ölçü birimi" {...field} />
                              </FormControl>
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
                                <Input placeholder="Açıklama" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setMaterialDialogOpen(false)}>
                            İptal
                          </Button>
                          <Button type="submit" disabled={createRawMaterialMutation.isPending}>
                            {createRawMaterialMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="fabrics" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="fabrics">Kumaş Tipleri</TabsTrigger>
                <TabsTrigger value="yarns">İplik Tipleri</TabsTrigger>
                <TabsTrigger value="materials">Hammaddeler</TabsTrigger>
              </TabsList>
              
              <TabsContent value="fabrics">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kumaş Adı</TableHead>
                      <TableHead>Kod</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingFabrics ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredFabrics.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-gray-500">
                          Kumaş tipi bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFabrics.map((fabric) => (
                        <TableRow key={fabric.id}>
                          <TableCell className="font-medium">{fabric.name}</TableCell>
                          <TableCell>{fabric.code}</TableCell>
                          <TableCell>{fabric.description || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="yarns">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>İplik Adı</TableHead>
                      <TableHead>Kod</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingYarns ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredYarns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-gray-500">
                          İplik tipi bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredYarns.map((yarn) => (
                        <TableRow key={yarn.id}>
                          <TableCell className="font-medium">{yarn.name}</TableCell>
                          <TableCell>{yarn.code}</TableCell>
                          <TableCell>{yarn.description || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="materials">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hammadde Adı</TableHead>
                      <TableHead>Kod</TableHead>
                      <TableHead>Birim</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingMaterials ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredMaterials.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                          Hammadde bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMaterials.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">{material.name}</TableCell>
                          <TableCell>{material.code}</TableCell>
                          <TableCell>{material.unit}</TableCell>
                          <TableCell>{material.description || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
