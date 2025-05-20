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
  Edit, 
  Trash, 
  Grid3X3, 
  Check,
  X
} from "lucide-react";

// Dokuma Deseni şeması
const weavePatternSchema = z.object({
  name: z.string().min(1, "Desen adı gereklidir"),
  code: z.string().min(1, "Desen kodu gereklidir"),
  description: z.string().optional(),
  patternMatrix: z.string().min(1, "Desen matrisi gereklidir"),
  complexity: z.enum(["Basit", "Orta", "Karmaşık"]).default("Basit"),
  notes: z.string().optional(),
  status: z.enum(["Aktif", "Taslak", "Arşiv"]).default("Taslak"),
});

const WeavePatternsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedWeavePattern, setSelectedWeavePattern] = useState<any>(null);

  // Form tanımlama
  const form = useForm<z.infer<typeof weavePatternSchema>>({
    resolver: zodResolver(weavePatternSchema),
    defaultValues: {
      complexity: "Basit",
      status: "Taslak",
      patternMatrix: "10000\n01000\n00100\n00010\n00001",
    },
  });

  // Form değiştirme
  const editForm = useForm<z.infer<typeof weavePatternSchema>>({
    resolver: zodResolver(weavePatternSchema),
    defaultValues: {
      complexity: "Basit",
      status: "Taslak",
      patternMatrix: "",
    },
  });

  // Dokuma Desenleri çek
  const { data: weavePatterns = [], isLoading: isLoadingWeavePatterns } = useQuery({
    queryKey: ["/api/product-development/weave-patterns"],
  });

  // Dokuma Deseni oluşturma
  const createWeavePatternMutation = useMutation({
    mutationFn: async (data: z.infer<typeof weavePatternSchema>) => {
      const res = await apiRequest("POST", "/api/product-development/weave-patterns", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Dokuma deseni başarıyla oluşturuldu",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/product-development/weave-patterns"] });
      form.reset({
        complexity: "Basit",
        status: "Taslak",
        patternMatrix: "10000\n01000\n00100\n00010\n00001",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Dokuma deseni oluşturulurken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Dokuma Deseni güncelleme
  const updateWeavePatternMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/product-development/weave-patterns/${selectedWeavePattern.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Dokuma deseni başarıyla güncellendi",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/product-development/weave-patterns"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Dokuma deseni güncellenirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Dokuma Deseni silme
  const deleteWeavePatternMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/product-development/weave-patterns/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Dokuma deseni başarıyla silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/product-development/weave-patterns"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Dokuma deseni silinirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Form gönderme
  const onSubmit = (data: z.infer<typeof weavePatternSchema>) => {
    createWeavePatternMutation.mutate(data);
  };

  // Form güncelleme
  const onEditSubmit = (data: z.infer<typeof weavePatternSchema>) => {
    updateWeavePatternMutation.mutate(data);
  };

  // Düzenleme için açma
  const handleEditWeavePattern = (pattern: any) => {
    setSelectedWeavePattern(pattern);
    editForm.reset({
      name: pattern.name,
      code: pattern.code,
      description: pattern.description,
      patternMatrix: pattern.patternMatrix,
      complexity: pattern.complexity,
      notes: pattern.notes,
      status: pattern.status,
    });
    setIsEditDialogOpen(true);
  };

  // Önizleme için açma
  const handlePreviewWeavePattern = (pattern: any) => {
    setSelectedWeavePattern(pattern);
    setIsPreviewDialogOpen(true);
  };

  // Silme onayı
  const handleDeleteWeavePattern = (id: number) => {
    if (window.confirm("Bu dokuma desenini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      deleteWeavePatternMutation.mutate(id);
    }
  };

  // Arama filtreleme
  const getFilteredWeavePatterns = () => {
    if (!searchTerm) return weavePatterns;
    
    const searchLower = searchTerm.toLowerCase();
    return weavePatterns.filter((pattern: any) => 
      pattern.name?.toLowerCase().includes(searchLower) ||
      pattern.code?.toLowerCase().includes(searchLower) ||
      pattern.description?.toLowerCase().includes(searchLower)
    );
  };

  // Desen matrisini görsel olarak render etme
  const renderPatternMatrix = (matrixStr: string) => {
    // Matrisi satırlara ayır
    const rows = matrixStr.trim().split('\n');
    
    return (
      <div className="border rounded overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${rows[0]?.length || 1}, 1fr)` }}>
          {rows.map((row, rowIndex) => (
            row.split('').map((cell, cellIndex) => (
              <div
                key={`${rowIndex}-${cellIndex}`}
                className={`w-4 h-4 ${cell === '1' ? 'bg-black' : 'bg-white border border-gray-200'}`}
              />
            ))
          ))}
        </div>
      </div>
    );
  };

  // Yükleme durumu
  if (isLoadingWeavePatterns) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filtrelenmiş dokuma desenleri
  const filteredWeavePatterns = getFilteredWeavePatterns();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dokuma Desenleri" 
        description="Kumaş dokuma desenlerini ve örgülerini yönetin"
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Desen ara..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Yeni Dokuma Deseni
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Dokuma Desenleri</CardTitle>
          <CardDescription>
            Kumaş dokuma için kullanılabilecek desenler ve örgüler
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredWeavePatterns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Arama kriterlerine uygun dokuma deseni bulunamadı." : "Henüz dokuma deseni bulunmamaktadır. Yeni bir desen eklemek için 'Yeni Dokuma Deseni' butonunu kullanın."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Kod</TableHead>
                  <TableHead>Desen Adı</TableHead>
                  <TableHead>Karmaşıklık</TableHead>
                  <TableHead>Önizleme</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWeavePatterns.map((pattern: any) => (
                  <TableRow key={pattern.id}>
                    <TableCell className="font-medium">{pattern.code}</TableCell>
                    <TableCell>{pattern.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          pattern.complexity === "Karmaşık" 
                            ? "destructive" 
                            : pattern.complexity === "Orta" 
                            ? "default" 
                            : "outline"
                        }
                      >
                        {pattern.complexity}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[100px]">
                      <div className="flex justify-center">
                        <div className="scale-75" onClick={() => handlePreviewWeavePattern(pattern)}>
                          {renderPatternMatrix(pattern.patternMatrix)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          pattern.status === "Aktif" 
                            ? "default" 
                            : pattern.status === "Taslak" 
                            ? "outline" 
                            : "secondary"
                        }
                      >
                        {pattern.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handlePreviewWeavePattern(pattern)}
                        >
                          <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditWeavePattern(pattern)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteWeavePattern(pattern.id)}
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
      
      {/* Yeni Dokuma Deseni Modal */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yeni Dokuma Deseni Ekle</DialogTitle>
            <DialogDescription>
              Yeni bir dokuma deseni/örgüsü oluşturun. Desen kodu benzersiz olmalıdır.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desen Kodu*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: WP-001" {...field} />
                      </FormControl>
                      <FormDescription>
                        Benzersiz bir kod girin
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desen Adı*</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: Bezayağı 2/2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="complexity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Karmaşıklık Seviyesi</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seviye seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Basit">Basit</SelectItem>
                          <SelectItem value="Orta">Orta</SelectItem>
                          <SelectItem value="Karmaşık">Karmaşık</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
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
                          <SelectItem value="Taslak">Taslak</SelectItem>
                          <SelectItem value="Aktif">Aktif</SelectItem>
                          <SelectItem value="Arşiv">Arşiv</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="patternMatrix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desen Matrisi*</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="ör:\n10000\n01000\n00100\n00010\n00001"
                        className="font-mono h-36"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Desen matrisini '1' ve '0' kullanarak tanımlayın. Her satır için yeni satır kullanın.
                      1: Çözgü üstte, 0: Atkı üstte
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="border rounded p-4">
                <h4 className="text-sm font-medium mb-2">Desen Önizleme</h4>
                <div className="flex justify-center">
                  {renderPatternMatrix(form.watch("patternMatrix") || "")}
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Desen hakkında detaylı bilgi girin"
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
                      />
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
                        placeholder="Ekstra notlar"
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
                  disabled={createWeavePatternMutation.isPending}
                >
                  {createWeavePatternMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Oluştur
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dokuma Deseni Düzenleme Modal */}
      {selectedWeavePattern && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Dokuma Desenini Düzenle</DialogTitle>
              <DialogDescription>
                Mevcut dokuma deseninin bilgilerini güncelleyin.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desen Kodu*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desen Adı*</FormLabel>
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
                    name="complexity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Karmaşıklık Seviyesi</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seviye seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Basit">Basit</SelectItem>
                            <SelectItem value="Orta">Orta</SelectItem>
                            <SelectItem value="Karmaşık">Karmaşık</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
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
                            <SelectItem value="Taslak">Taslak</SelectItem>
                            <SelectItem value="Aktif">Aktif</SelectItem>
                            <SelectItem value="Arşiv">Arşiv</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={editForm.control}
                  name="patternMatrix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desen Matrisi*</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="font-mono h-36"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Desen matrisini '1' ve '0' kullanarak tanımlayın. Her satır için yeni satır kullanın.
                        1: Çözgü üstte, 0: Atkı üstte
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="border rounded p-4">
                  <h4 className="text-sm font-medium mb-2">Desen Önizleme</h4>
                  <div className="flex justify-center">
                    {renderPatternMatrix(editForm.watch("patternMatrix") || "")}
                  </div>
                </div>
                
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Açıklama</FormLabel>
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
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateWeavePatternMutation.isPending}
                  >
                    {updateWeavePatternMutation.isPending && (
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
      
      {/* Dokuma Deseni Önizleme Modal */}
      {selectedWeavePattern && (
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Dokuma Deseni Önizleme</DialogTitle>
              <DialogDescription>
                {selectedWeavePattern.code} - {selectedWeavePattern.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Desen Bilgileri</h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Kod:</span>
                      <span className="text-sm font-medium">{selectedWeavePattern.code}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">İsim:</span>
                      <span className="text-sm font-medium">{selectedWeavePattern.name}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Karmaşıklık:</span>
                      <span className="text-sm font-medium">{selectedWeavePattern.complexity}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm text-muted-foreground">Durum:</span>
                      <Badge
                        variant={
                          selectedWeavePattern.status === "Aktif" 
                            ? "default" 
                            : selectedWeavePattern.status === "Taslak" 
                            ? "outline" 
                            : "secondary"
                        }
                      >
                        {selectedWeavePattern.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                  <h4 className="text-sm font-medium mb-2">Desen Görünümü</h4>
                  <div className="scale-125">
                    {renderPatternMatrix(selectedWeavePattern.patternMatrix)}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Desen Matrisi (Ham)</h4>
                <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                  {selectedWeavePattern.patternMatrix}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Açıklama</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedWeavePattern.description || "Açıklama bulunmamaktadır."}
                </p>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsPreviewDialogOpen(false)}
                >
                  Kapat
                </Button>
                <Button 
                  onClick={() => {
                    setIsPreviewDialogOpen(false);
                    handleEditWeavePattern(selectedWeavePattern);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Düzenle
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WeavePatternsPage;