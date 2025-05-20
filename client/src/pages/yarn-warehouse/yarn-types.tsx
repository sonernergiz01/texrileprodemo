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
import { Edit, Trash, Plus, Search, Database } from "lucide-react";

// Form Schemas
const yarnTypeSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  code: z.string().min(2, "Kod en az 2 karakter olmalıdır"),
  description: z.string().optional(),
});

type YarnTypeFormValues = z.infer<typeof yarnTypeSchema>;

export default function YarnTypesPage() {
  const { toast } = useToast();
  const [yarnDialogOpen, setYarnDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYarn, setSelectedYarn] = useState<any | null>(null);
  
  // Yarn Types
  const {
    data: yarnTypes = [],
    isLoading: isLoadingYarns,
  } = useQuery<any[]>({
    queryKey: ["/api/master/yarns"],
  });

  // Filtered yarns
  const filteredYarns = yarnTypes.filter((yarn: any) => 
    yarn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    yarn.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (yarn.description && yarn.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Yarn Form
  const yarnForm = useForm<YarnTypeFormValues>({
    resolver: zodResolver(yarnTypeSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
    },
  });

  const resetYarnForm = () => {
    yarnForm.reset({
      name: "",
      code: "",
      description: "",
    });
    setSelectedYarn(null);
  };

  // Add Yarn Type
  const addYarnMutation = useMutation({
    mutationFn: async (values: YarnTypeFormValues) => {
      const res = await apiRequest("POST", "/api/master/yarns", values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "İplik Tipi Eklendi",
        description: "Yeni iplik tipi başarıyla eklendi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/master/yarns"] });
      setYarnDialogOpen(false);
      resetYarnForm();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `İplik tipi eklenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Edit Yarn Type
  const editYarnMutation = useMutation({
    mutationFn: async (values: YarnTypeFormValues & { id: number }) => {
      const { id, ...data } = values;
      const res = await apiRequest("PATCH", `/api/master/yarns/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "İplik Tipi Güncellendi",
        description: "İplik tipi başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/master/yarns"] });
      setYarnDialogOpen(false);
      resetYarnForm();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `İplik tipi güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete Yarn Type
  const deleteYarnMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/master/yarns/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "İplik Tipi Silindi",
        description: "İplik tipi başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/master/yarns"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `İplik tipi silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submit
  const handleYarnSubmit = (values: YarnTypeFormValues) => {
    if (selectedYarn) {
      editYarnMutation.mutate({ ...values, id: selectedYarn.id });
    } else {
      addYarnMutation.mutate(values);
    }
  };

  // Edit yarn
  const handleEditYarn = (yarn: any) => {
    setSelectedYarn(yarn);
    yarnForm.reset({
      name: yarn.name,
      code: yarn.code,
      description: yarn.description || "",
    });
    setYarnDialogOpen(true);
  };

  // Delete yarn
  const handleDeleteYarn = (id: number) => {
    if (window.confirm("Bu iplik tipini silmek istediğinizden emin misiniz?")) {
      deleteYarnMutation.mutate(id);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">İplik Tipleri Yönetimi</h2>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>İplik Tipleri</CardTitle>
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
              <Dialog open={yarnDialogOpen} onOpenChange={(open) => {
                setYarnDialogOpen(open);
                if (!open) resetYarnForm();
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    resetYarnForm();
                    setYarnDialogOpen(true);
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni İplik Tipi
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedYarn ? "İplik Tipi Düzenle" : "Yeni İplik Tipi Ekle"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...yarnForm}>
                    <form onSubmit={yarnForm.handleSubmit(handleYarnSubmit)} className="space-y-4 py-2">
                      <FormField
                        control={yarnForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>İplik Adı</FormLabel>
                            <FormControl>
                              <Input placeholder="İplik adı girin" {...field} />
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
                            <FormLabel>İplik Kodu</FormLabel>
                            <FormControl>
                              <Input placeholder="İplik kodu girin" {...field} />
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
                            resetYarnForm();
                            setYarnDialogOpen(false);
                          }}
                        >
                          İptal
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={addYarnMutation.isPending || editYarnMutation.isPending}
                        >
                          {(addYarnMutation.isPending || editYarnMutation.isPending) ? (
                            <>
                              <span className="mr-2 h-4 w-4 animate-spin" />
                              İşleniyor...
                            </>
                          ) : (
                            selectedYarn ? "Güncelle" : "Ekle"
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
            {isLoadingYarns ? (
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
                      <TableHead className="max-w-[200px]">Açıklama</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredYarns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          Kayıt bulunamadı.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredYarns.map((yarn: any) => (
                        <TableRow key={yarn.id}>
                          <TableCell className="font-medium">{yarn.code}</TableCell>
                          <TableCell>{yarn.name}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{yarn.description}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditYarn(yarn)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteYarn(yarn.id)}
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