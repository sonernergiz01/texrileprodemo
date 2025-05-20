import { useQuery, useMutation } from "@tanstack/react-query";
import { Bookmark, PlusCircle, Search, Copy, Trash2, Download } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/layout/page-header";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Şablonlar sayfası
const DyeRecipeTemplates = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [recipeType, setRecipeType] = useState("all");
  const { toast } = useToast();

  // Şablonları getirme
  const { data: templates, isLoading } = useQuery({
    queryKey: ["/api/dye-recipes/templates"],
    queryFn: async () => {
      const response = await fetch("/api/dye-recipes/templates");
      if (!response.ok) {
        throw new Error("Şablonlar yüklenirken hata oluştu");
      }
      return response.json();
    },
  });

  // Şablon silme
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/dye-recipes/${id}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Şablon silindi",
        description: "Reçete şablonu başarıyla silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dye-recipes/templates"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Şablon silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Şablondan reçete oluşturma
  const createFromTemplateMutation = useMutation({
    mutationFn: async (params: { templateId: number, data: any }) => {
      const response = await apiRequest("POST", `/api/dye-recipes/from-template/${params.templateId}`, params.data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reçete oluşturuldu",
        description: "Şablondan yeni reçete başarıyla oluşturuldu",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dye-recipes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Reçete oluşturulurken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filtreleme
  const filteredTemplates = templates?.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = 
      recipeType === "all" || 
      template.recipeType === recipeType;
    
    return matchesSearch && matchesType;
  });

  // Reçete tipi rengini belirleme
  const getRecipeTypeColor = (type) => {
    switch (type) {
      case "fabric":
        return "bg-blue-100 text-blue-800";
      case "yarn":
        return "bg-green-100 text-green-800";
      case "template":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Reçete durum rengini belirleme
  const getRecipeStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-amber-100 text-amber-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Reçete tipinin Türkçe karşılığı
  const getRecipeTypeText = (type) => {
    switch (type) {
      case "fabric":
        return "Kumaş";
      case "yarn":
        return "İplik";
      case "template":
        return "Şablon";
      default:
        return type;
    }
  };

  // Reçete durumunun Türkçe karşılığı
  const getRecipeStatusText = (status) => {
    switch (status) {
      case "active":
        return "Aktif";
      case "draft":
        return "Taslak";
      case "archived":
        return "Arşivlenmiş";
      default:
        return status;
    }
  };

  // Şablonu kullanarak yeni reçete oluşturma
  const handleCreateFromTemplate = (templateId) => {
    const data = {
      name: `Kopyalanan Reçete ${new Date().toISOString().slice(0, 10)}`,
      code: `COPY-${Math.floor(Math.random() * 10000)}`,
      status: "draft"
    };
    
    createFromTemplateMutation.mutate({ templateId, data });
  };

  return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <div className="flex items-center">
            <Bookmark className="h-6 w-6 text-cyan-600 mr-2" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Reçete Şablonları</h1>
              <p className="text-muted-foreground">Boya reçeteleri için hazır şablonlar ve yeniden kullanılabilir formüller</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 mb-6">
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Şablon ara..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select defaultValue="all" onValueChange={(value) => setRecipeType(value)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Tüm Tipler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tipler</SelectItem>
                <SelectItem value="fabric">Kumaş</SelectItem>
                <SelectItem value="yarn">İplik</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button asChild>
            <Link href="/dye-recipes/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Yeni Şablon
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {filteredTemplates ? filteredTemplates.length : 0} şablon bulundu
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
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Şablon Kodu</TableHead>
                      <TableHead>Şablon Adı</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Oluşturan</TableHead>
                      <TableHead>Oluşturulma</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Şablon bulunamadı.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTemplates?.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/dye-recipes/${template.id}`}
                              className="text-blue-600 hover:underline flex items-center"
                            >
                              <Bookmark className="mr-2 h-4 w-4" />
                              {template.code}
                            </Link>
                          </TableCell>
                          <TableCell>{template.name}</TableCell>
                          <TableCell>
                            <Badge className={getRecipeTypeColor(template.recipeType)}>
                              {getRecipeTypeText(template.recipeType)}
                            </Badge>
                          </TableCell>
                          <TableCell>{template.createdByName || "-"}</TableCell>
                          <TableCell className="text-gray-500 text-sm">
                            {template.createdAt &&
                              format(new Date(template.createdAt), "dd MMM yyyy", {
                                locale: tr,
                              })}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleCreateFromTemplate(template.id)}
                              title="Şablondan reçete oluştur"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="Şablonu indir"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-red-500"
                                  title="Şablonu sil"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Şablonu silmek istediğinizden emin misiniz?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bu işlem geri alınamaz. Bu şablonu silmek istediğinizden emin misiniz?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>İptal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteTemplateMutation.mutate(template.id)}
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
      </div>

  );
};

export default DyeRecipeTemplates;