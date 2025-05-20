import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, Pencil, Trash2, GitBranch as Route, ListTodo, CalendarRange, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Rota şablonu oluşturma/düzenleme formu için şema
const routeTemplateSchema = z.object({
  name: z.string().min(1, { message: "Şablon adı boş olamaz" }),
  code: z.string().min(1, { message: "Şablon kodu boş olamaz" }),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export default function RouteTemplatesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Rota şablonları sayfası
  
  // Rota şablonlarını getir
  const { 
    data: templates = [], 
    isLoading,
    isError
  } = useQuery({
    queryKey: ["/api/planning/route-templates"],
    staleTime: 1000 * 60 * 5, // 5 dakika
  });
  
  // Şablon oluşturma formu
  const createForm = useForm({
    resolver: zodResolver(routeTemplateSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      isActive: true,
    },
  });
  
  // Şablon düzenleme formu  
  const editForm = useForm({
    resolver: zodResolver(routeTemplateSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      isActive: true,
    },
  });
  
  // Şablon oluşturma
  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Rota şablonu oluşturma isteği:", data);
      const res = await apiRequest("POST", "/api/planning/route-templates", data);
      const result = await res.json();
      console.log("Rota şablonu oluşturma yanıtı:", result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Başarılı!",
        description: "Üretim rota şablonu başarıyla oluşturuldu.",
      });
      
      queryClient.invalidateQueries({
        queryKey: ["/api/planning/route-templates"],
      });
      
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Hata!",
        description: `Şablon oluşturulurken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Şablon güncelleme
  const updateTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Rota şablonu güncelleme isteği:", data, "ID:", selectedTemplate.id);
      const res = await apiRequest("PUT", `/api/planning/route-templates/${selectedTemplate.id}`, data);
      const result = await res.json();
      console.log("Rota şablonu güncelleme yanıtı:", result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Başarılı!",
        description: "Üretim rota şablonu başarıyla güncellendi.",
      });
      
      queryClient.invalidateQueries({
        queryKey: ["/api/planning/route-templates"],
      });
      
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Hata!",
        description: `Şablon güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Şablon silme
  const deleteTemplateMutation = useMutation({
    mutationFn: async () => {
      console.log("Rota şablonu silme isteği, ID:", selectedTemplate.id);
      const res = await apiRequest("DELETE", `/api/planning/route-templates/${selectedTemplate.id}`);
      const result = await res.json();
      console.log("Rota şablonu silme yanıtı:", result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Başarılı!",
        description: "Üretim rota şablonu başarıyla silindi.",
      });
      
      queryClient.invalidateQueries({
        queryKey: ["/api/planning/route-templates"],
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Hata!",
        description: `Şablon silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Şablon oluşturma
  const onCreateSubmit = async (data: any) => {
    createTemplateMutation.mutate(data);
  };
  
  // Şablon güncelleme
  const onEditSubmit = async (data: any) => {
    updateTemplateMutation.mutate(data);
  };
  
  // Şablon düzenleme için açma
  const handleEditTemplate = (template: any) => {
    setSelectedTemplate(template);
    editForm.reset({
      name: template.name,
      code: template.code,
      description: template.description || "",
      isActive: template.isActive,
    });
    setIsEditDialogOpen(true);
  };
  
  // Şablon silme için açma
  const handleDeleteTemplate = (template: any) => {
    setSelectedTemplate(template);
    setIsDeleteDialogOpen(true);
  };
  
  // Şablon adımlarını görüntüleme
  const handleViewSteps = (template: any) => {
    // Adımlar sayfasına yönlendir
    console.log("Adımları görüntülemeye yönlendiriliyor:", template.id);
    navigate(`/planning/route-template-steps/${template.id}`);
  };
  
  return (
    <div className="container mx-auto py-4">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Üretim Rotaları"
          description="Üretim süreçleri için rota şablonları yönetimi"
        />
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Rota Şablonu
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center h-40">
            <p className="text-center text-destructive">
              Şablonlar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.
            </p>
          </CardContent>
        </Card>
      ) : templates.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center h-40">
            <Route className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">
              Henüz üretim rotası şablonu bulunmamaktadır. Yeni bir şablon oluşturmak için
              "Yeni Rota Şablonu" butonuna tıklayın.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Şablon Adı</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead className="w-[100px]">Durum</TableHead>
                <TableHead className="w-[120px] text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template: any) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>{template.description || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={template.isActive ? "default" : "outline"}>
                      {template.isActive ? "Aktif" : "Pasif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Menüyü aç</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                        <DropdownMenuItem 
                          className="cursor-pointer flex items-center"
                          onClick={() => handleViewSteps(template)}
                        >
                          <ListTodo className="mr-2 h-4 w-4" />
                          <span>Adımları Görüntüle</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer flex items-center"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Düzenle</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="cursor-pointer text-destructive flex items-center"
                          onClick={() => handleDeleteTemplate(template)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Sil</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Yeni Şablon Oluşturma Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Yeni Üretim Rotası Şablonu</DialogTitle>
            <DialogDescription>
              Üretim süreçleri için yeni bir rota şablonu oluşturun. Şablonu oluşturduktan sonra adımlar ekleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şablon Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="Örn: Standart Dokuma Rotası" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şablon Kodu</FormLabel>
                    <FormControl>
                      <Input placeholder="Örn: STDRT001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Rota şablonu hakkında açıklama girin"
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
                  disabled={createTemplateMutation.isPending}
                >
                  {createTemplateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Oluştur
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Şablon Düzenleme Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Üretim Rotası Şablonunu Düzenle</DialogTitle>
            <DialogDescription>
              Var olan üretim rotası şablonunu düzenleyin. Adımları düzenlemek için önce şablonu kaydedin, ardından adımlar listesine gidin.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şablon Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="Örn: Standart Dokuma Rotası" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şablon Kodu</FormLabel>
                    <FormControl>
                      <Input placeholder="Örn: STDRT001" {...field} disabled />
                    </FormControl>
                    <FormDescription>
                      Şablon kodu benzersiz olmalıdır ve değiştirilemez.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Rota şablonu hakkında açıklama girin"
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
                  disabled={updateTemplateMutation.isPending}
                >
                  {updateTemplateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Kaydet
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Şablon Silme Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Şablonu Sil</DialogTitle>
            <DialogDescription>
              Bu rota şablonunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-muted-foreground">
              <strong className="font-semibold text-foreground">{selectedTemplate?.name}</strong> adlı şablonu ve buna bağlı tüm adımları silmek üzeresiniz.
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
              onClick={() => deleteTemplateMutation.mutate()}
              disabled={deleteTemplateMutation.isPending}
            >
              {deleteTemplateMutation.isPending && (
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
