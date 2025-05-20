import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { TestTube, PlusCircle, Search, Edit, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/layout/page-header";

import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Kimyasallar sayfası bileşeni
const DyeRecipeChemicals = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddingChemical, setIsAddingChemical] = useState(false);
  const [isEditingChemical, setIsEditingChemical] = useState(false);
  const [selectedChemical, setSelectedChemical] = useState(null);
  const [newChemical, setNewChemical] = useState({
    name: "",
    code: "",
    category: "dye",
    unit: "g/L",
    description: "",
    supplier: "",
    msdsLink: "",
    notes: "",
  });

  // Kimyasalları getirme
  const { data: chemicals, isLoading } = useQuery({
    queryKey: ["/api/dye-recipes/chemicals/list"],
    queryFn: async () => {
      const response = await fetch("/api/dye-recipes/chemicals/list");
      if (!response.ok) {
        throw new Error("Kimyasallar yüklenirken hata oluştu");
      }
      return response.json();
    },
  });

  // Kimyasal ekleme
  const addChemicalMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/dye-recipes/chemicals", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Kimyasal eklendi",
        description: "Yeni kimyasal başarıyla eklendi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dye-recipes/chemicals/list"] });
      setIsAddingChemical(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Kimyasal eklenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Kimyasal güncelleme
  const updateChemicalMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest("PUT", `/api/dye-recipes/chemicals/${selectedChemical.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Kimyasal güncellendi",
        description: "Kimyasal bilgileri başarıyla güncellendi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dye-recipes/chemicals/list"] });
      setIsEditingChemical(false);
      setSelectedChemical(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Kimyasal güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Kimyasal silme
  const deleteChemicalMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/dye-recipes/chemicals/${id}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Kimyasal silindi",
        description: "Kimyasal başarıyla silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dye-recipes/chemicals/list"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Kimyasal silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Kimyasal düzenleme işlemi
  const handleEditChemical = (chemical) => {
    setSelectedChemical(chemical);
    setNewChemical({
      name: chemical.name,
      code: chemical.code,
      category: chemical.category,
      unit: chemical.unit || "g/L",
      description: chemical.description || "",
      supplier: chemical.supplier || "",
      msdsLink: chemical.msdsLink || "",
      notes: chemical.notes || "",
    });
    setIsEditingChemical(true);
  };

  // Form temizleme
  const resetForm = () => {
    setNewChemical({
      name: "",
      code: "",
      category: "dye",
      unit: "g/L",
      description: "",
      supplier: "",
      msdsLink: "",
      notes: "",
    });
  };

  // Filtreleme
  const filteredChemicals = chemicals?.filter((chemical) => {
    const matchesSearch =
      chemical.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chemical.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      categoryFilter === "all" || 
      chemical.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Kategori rengini belirleme
  const getCategoryColor = (category) => {
    switch (category) {
      case "dye":
        return "bg-red-100 text-red-800";
      case "softener":
        return "bg-blue-100 text-blue-800";
      case "enzyme":
        return "bg-green-100 text-green-800";
      case "acid":
        return "bg-purple-100 text-purple-800";
      case "alkali":
        return "bg-yellow-100 text-yellow-800";
      case "fixative":
        return "bg-indigo-100 text-indigo-800";
      case "detergent":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Kategori adını Türkçe'ye çevirme
  const getCategoryText = (category) => {
    switch (category) {
      case "dye":
        return "Boya";
      case "softener":
        return "Yumuşatıcı";
      case "enzyme":
        return "Enzim";
      case "acid":
        return "Asit";
      case "alkali":
        return "Alkali";
      case "fixative":
        return "Fiksatör";
      case "detergent":
        return "Deterjan";
      case "other":
        return "Diğer";
      default:
        return category;
    }
  };

  return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <div className="flex items-center">
            <TestTube className="h-6 w-6 text-cyan-600 mr-2" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Kimyasallar</h1>
              <p className="text-muted-foreground">Boya reçetelerinde kullanılan kimyasalların listesi</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 mb-6">
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Kimyasal ara..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select defaultValue="all" onValueChange={(value) => setCategoryFilter(value)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Tüm Kategoriler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                <SelectItem value="dye">Boya</SelectItem>
                <SelectItem value="softener">Yumuşatıcı</SelectItem>
                <SelectItem value="enzyme">Enzim</SelectItem>
                <SelectItem value="acid">Asit</SelectItem>
                <SelectItem value="alkali">Alkali</SelectItem>
                <SelectItem value="fixative">Fiksatör</SelectItem>
                <SelectItem value="detergent">Deterjan</SelectItem>
                <SelectItem value="other">Diğer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => setIsAddingChemical(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Kimyasal Ekle
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {filteredChemicals ? filteredChemicals.length : 0} kimyasal bulundu
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">Kimyasal Kodu</TableHead>
                      <TableHead>Kimyasal Adı</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Birim</TableHead>
                      <TableHead>Tedarikçi</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredChemicals?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Kimyasal bulunamadı.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredChemicals?.map((chemical) => (
                        <TableRow key={chemical.id}>
                          <TableCell className="font-medium">{chemical.code}</TableCell>
                          <TableCell>{chemical.name}</TableCell>
                          <TableCell>
                            <Badge className={getCategoryColor(chemical.category)}>
                              {getCategoryText(chemical.category)}
                            </Badge>
                          </TableCell>
                          <TableCell>{chemical.unit || "g/L"}</TableCell>
                          <TableCell>{chemical.supplier || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditChemical(chemical)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-red-500">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Kimyasalı silmek istediğinizden emin misiniz?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bu işlem geri alınamaz. Kimyasal mevcut reçetelerde kullanılıyorsa bu işlem tamamlanamayabilir.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>İptal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteChemicalMutation.mutate(chemical.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Sil
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

        {/* Kimyasal Ekleme Dialog */}
        <Dialog open={isAddingChemical} onOpenChange={setIsAddingChemical}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Yeni Kimyasal Ekle</DialogTitle>
              <DialogDescription>
                Boya reçetelerinde kullanılacak yeni bir kimyasal ekleyin.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Kimyasal Adı*</Label>
                  <Input
                    id="name"
                    value={newChemical.name}
                    onChange={(e) =>
                      setNewChemical({ ...newChemical, name: e.target.value })
                    }
                    placeholder="Kimyasal adı girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Kimyasal Kodu*</Label>
                  <Input
                    id="code"
                    value={newChemical.code}
                    onChange={(e) =>
                      setNewChemical({ ...newChemical, code: e.target.value })
                    }
                    placeholder="Kimyasal kodu girin"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori*</Label>
                  <Select
                    value={newChemical.category}
                    onValueChange={(value) =>
                      setNewChemical({ ...newChemical, category: value })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dye">Boya</SelectItem>
                      <SelectItem value="softener">Yumuşatıcı</SelectItem>
                      <SelectItem value="enzyme">Enzim</SelectItem>
                      <SelectItem value="acid">Asit</SelectItem>
                      <SelectItem value="alkali">Alkali</SelectItem>
                      <SelectItem value="fixative">Fiksatör</SelectItem>
                      <SelectItem value="detergent">Deterjan</SelectItem>
                      <SelectItem value="other">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Birim</Label>
                  <Select
                    value={newChemical.unit}
                    onValueChange={(value) =>
                      setNewChemical({ ...newChemical, unit: value })
                    }
                  >
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="Birim seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g/L">g/L</SelectItem>
                      <SelectItem value="ml/L">ml/L</SelectItem>
                      <SelectItem value="%">%</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={newChemical.description}
                  onChange={(e) =>
                    setNewChemical({ ...newChemical, description: e.target.value })
                  }
                  placeholder="Kimyasal hakkında açıklama girin"
                  className="min-h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Tedarikçi</Label>
                  <Input
                    id="supplier"
                    value={newChemical.supplier}
                    onChange={(e) =>
                      setNewChemical({ ...newChemical, supplier: e.target.value })
                    }
                    placeholder="Tedarikçi firma"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="msdsLink">MSDS Link</Label>
                  <Input
                    id="msdsLink"
                    value={newChemical.msdsLink}
                    onChange={(e) =>
                      setNewChemical({ ...newChemical, msdsLink: e.target.value })
                    }
                    placeholder="Güvenlik bilgi formu linki"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  value={newChemical.notes}
                  onChange={(e) =>
                    setNewChemical({ ...newChemical, notes: e.target.value })
                  }
                  placeholder="Ekstra notlar"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingChemical(false);
                  resetForm();
                }}
              >
                <X className="mr-2 h-4 w-4" />
                İptal
              </Button>
              <Button
                onClick={() => addChemicalMutation.mutate(newChemical)}
                disabled={!newChemical.name || !newChemical.code}
              >
                <Save className="mr-2 h-4 w-4" />
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Kimyasal Düzenleme Dialog */}
        <Dialog open={isEditingChemical} onOpenChange={setIsEditingChemical}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Kimyasal Düzenle</DialogTitle>
              <DialogDescription>
                Kimyasal bilgilerini güncelleyin.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Kimyasal Adı*</Label>
                  <Input
                    id="name"
                    value={newChemical.name}
                    onChange={(e) =>
                      setNewChemical({ ...newChemical, name: e.target.value })
                    }
                    placeholder="Kimyasal adı girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Kimyasal Kodu*</Label>
                  <Input
                    id="code"
                    value={newChemical.code}
                    onChange={(e) =>
                      setNewChemical({ ...newChemical, code: e.target.value })
                    }
                    placeholder="Kimyasal kodu girin"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori*</Label>
                  <Select
                    value={newChemical.category}
                    onValueChange={(value) =>
                      setNewChemical({ ...newChemical, category: value })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dye">Boya</SelectItem>
                      <SelectItem value="softener">Yumuşatıcı</SelectItem>
                      <SelectItem value="enzyme">Enzim</SelectItem>
                      <SelectItem value="acid">Asit</SelectItem>
                      <SelectItem value="alkali">Alkali</SelectItem>
                      <SelectItem value="fixative">Fiksatör</SelectItem>
                      <SelectItem value="detergent">Deterjan</SelectItem>
                      <SelectItem value="other">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Birim</Label>
                  <Select
                    value={newChemical.unit}
                    onValueChange={(value) =>
                      setNewChemical({ ...newChemical, unit: value })
                    }
                  >
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="Birim seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g/L">g/L</SelectItem>
                      <SelectItem value="ml/L">ml/L</SelectItem>
                      <SelectItem value="%">%</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={newChemical.description}
                  onChange={(e) =>
                    setNewChemical({ ...newChemical, description: e.target.value })
                  }
                  placeholder="Kimyasal hakkında açıklama girin"
                  className="min-h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Tedarikçi</Label>
                  <Input
                    id="supplier"
                    value={newChemical.supplier}
                    onChange={(e) =>
                      setNewChemical({ ...newChemical, supplier: e.target.value })
                    }
                    placeholder="Tedarikçi firma"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="msdsLink">MSDS Link</Label>
                  <Input
                    id="msdsLink"
                    value={newChemical.msdsLink}
                    onChange={(e) =>
                      setNewChemical({ ...newChemical, msdsLink: e.target.value })
                    }
                    placeholder="Güvenlik bilgi formu linki"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  value={newChemical.notes}
                  onChange={(e) =>
                    setNewChemical({ ...newChemical, notes: e.target.value })
                  }
                  placeholder="Ekstra notlar"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditingChemical(false);
                  setSelectedChemical(null);
                  resetForm();
                }}
              >
                <X className="mr-2 h-4 w-4" />
                İptal
              </Button>
              <Button
                onClick={() => updateChemicalMutation.mutate(newChemical)}
                disabled={!newChemical.name || !newChemical.code}
              >
                <Save className="mr-2 h-4 w-4" />
                Güncelle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

  );
};

export default DyeRecipeChemicals;