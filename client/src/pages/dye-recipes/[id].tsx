import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { 
  TestTube, 
  ArrowLeft, 
  Save, 
  PlusCircle, 
  Trash2, 
  Edit, 
  X, 
  Check, 
  Download,
  Beaker,
  Thermometer,
  Clock
} from "lucide-react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import PageHeader from "@/components/layout/page-header";
import DashboardLayout from "@/components/layout/dashboard-layout";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

// Boya reçetesi detay sayfası
const DyeRecipeDetails = () => {
  const params = useParams();
  const recipeId = params.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [newStep, setNewStep] = useState({
    name: "",
    duration: "",
    temperature: "",
    description: "",
  });
  const [isAddingChemical, setIsAddingChemical] = useState(false);
  const [newChemical, setNewChemical] = useState({
    chemicalId: "",
    amount: "",
    unit: "g/L",
    addTime: "",
  });

  // Reçeteyi getirme
  const { data: recipe, isLoading } = useQuery({
    queryKey: ["/api/dye-recipes", recipeId],
    queryFn: async () => {
      const response = await fetch(`/api/dye-recipes/${recipeId}`);
      if (!response.ok) {
        throw new Error("Reçete yüklenirken hata oluştu");
      }
      return response.json();
    },
  });

  // Reçete adımlarını getirme
  const { data: steps } = useQuery({
    queryKey: ["/api/dye-recipes", recipeId, "steps"],
    queryFn: async () => {
      const response = await fetch(`/api/dye-recipes/${recipeId}/steps`);
      if (!response.ok) {
        throw new Error("Reçete adımları yüklenirken hata oluştu");
      }
      return response.json();
    },
    enabled: !!recipeId,
  });

  // Reçete kimyasallarını getirme
  const { data: chemicals } = useQuery({
    queryKey: ["/api/dye-recipes", recipeId, "chemicals"],
    queryFn: async () => {
      const response = await fetch(`/api/dye-recipes/${recipeId}/chemicals`);
      if (!response.ok) {
        throw new Error("Reçete kimyasalları yüklenirken hata oluştu");
      }
      return response.json();
    },
    enabled: !!recipeId,
  });

  // Tüm kimyasal maddeleri getirme
  const { data: allChemicals } = useQuery({
    queryKey: ["/api/dye-recipes/chemicals/list"],
    queryFn: async () => {
      const response = await fetch("/api/dye-recipes/chemicals/list");
      if (!response.ok) {
        throw new Error("Kimyasallar yüklenirken hata oluştu");
      }
      return response.json();
    },
  });

  // Reçete uygulamalarını getirme
  const { data: applications } = useQuery({
    queryKey: ["/api/dye-recipes", recipeId, "applications"],
    queryFn: async () => {
      const response = await fetch(`/api/dye-recipes/${recipeId}/applications`);
      if (!response.ok) {
        throw new Error("Reçete uygulamaları yüklenirken hata oluştu");
      }
      return response.json();
    },
    enabled: !!recipeId,
  });

  // Reçeteyi silme
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/dye-recipes/${recipeId}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Reçete silindi",
        description: "Boya reçetesi başarıyla silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dye-recipes"] });
      navigate("/dye-recipes/list");
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Reçete silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Reçete adımı ekleme
  const addStepMutation = useMutation({
    mutationFn: async (stepData) => {
      const response = await apiRequest("POST", `/api/dye-recipes/${recipeId}/steps`, stepData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Adım eklendi",
        description: "Reçete adımı başarıyla eklendi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dye-recipes", recipeId, "steps"] });
      setIsAddingStep(false);
      setNewStep({
        name: "",
        duration: "",
        temperature: "",
        description: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Adım eklenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Reçete kimyasalı ekleme
  const addChemicalMutation = useMutation({
    mutationFn: async (chemicalData) => {
      const response = await apiRequest("POST", `/api/dye-recipes/${recipeId}/chemicals`, chemicalData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Kimyasal eklendi",
        description: "Reçete kimyasalı başarıyla eklendi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dye-recipes", recipeId, "chemicals"] });
      setIsAddingChemical(false);
      setNewChemical({
        chemicalId: "",
        amount: "",
        unit: "g/L",
        addTime: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Kimyasal eklenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Ekleme işlemlerini yönetme
  const handleAddStep = () => {
    addStepMutation.mutate(newStep);
  };

  const handleAddChemical = () => {
    addChemicalMutation.mutate(newChemical);
  };

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

  // Yükleniyor durumu
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center mb-6">
            <Skeleton className="h-10 w-40" />
          </div>
          <Skeleton className="h-12 w-96 mb-6" />
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-40 w-full mb-6" />
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-40 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <PageHeader
          title={recipe?.name || "Boya Reçetesi"}
          description={recipe?.description || "Boya reçetesi detayları"}
          icon={<TestTube className="h-6 w-6 text-cyan-600" />}
        />

        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" asChild className="mr-2">
            <Link href="/dye-recipes/list">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Listeye Dön
            </Link>
          </Button>

          <Button variant="outline" size="sm" className="mr-2">
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Sil
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reçeteyi silmek istediğinizden emin misiniz?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu işlem geri alınamaz. Bu reçeteyi silmek istediğinizden emin misiniz?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Sil
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button variant="outline" size="sm" className="mr-2 ml-auto">
            <Download className="mr-2 h-4 w-4" />
            PDF İndir
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <Card className="w-full md:w-1/2">
            <CardHeader>
              <CardTitle>Reçete Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Reçete Kodu</p>
                    <p className="text-lg font-bold">{recipe?.code}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Durum</p>
                    <Badge className={getRecipeStatusColor(recipe?.status)}>
                      {getRecipeStatusText(recipe?.status)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Reçete Tipi</p>
                    <Badge className={getRecipeTypeColor(recipe?.recipeType)}>
                      {getRecipeTypeText(recipe?.recipeType)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Renk</p>
                    <p>{recipe?.color || "-"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Sıcaklık</p>
                    <p>{recipe?.temperature ? `${recipe.temperature}°C` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Banyo Oranı</p>
                    <p>{recipe?.bathRatio || "-"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {recipe?.recipeType === "fabric" ? "Kumaş Tipi" : "İplik Tipi"}
                  </p>
                  <p>
                    {recipe?.recipeType === "fabric"
                      ? recipe?.fabricType || "-"
                      : recipe?.yarnType || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Makine Tipi</p>
                  <p>{recipe?.machineType || "-"}</p>
                </div>

                {recipe?.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Notlar</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {recipe.notes}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="w-full md:w-1/2">
            <CardHeader>
              <CardTitle>Sipariş ve Zamanlama</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">İlişkili Sipariş</p>
                    <p>
                      {recipe?.orderNumber ? (
                        <Link
                          href={`/sales/orders/${recipe.orderId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {recipe.orderNumber}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Müşteri</p>
                    <p>{recipe?.customerName || "-"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</p>
                    <p>
                      {recipe?.createdAt &&
                        format(new Date(recipe.createdAt), "dd MMMM yyyy", {
                          locale: tr,
                        })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Son Güncelleme</p>
                    <p>
                      {recipe?.updatedAt &&
                        format(new Date(recipe.updatedAt), "dd MMMM yyyy", {
                          locale: tr,
                        })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Oluşturan</p>
                    <p>{recipe?.createdByName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Son Uygulama</p>
                    <p>
                      {applications && applications.length > 0
                        ? format(
                            new Date(
                              applications[applications.length - 1].applicationDate
                            ),
                            "dd MMMM yyyy",
                            { locale: tr }
                          )
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="steps" className="mt-6" onValueChange={setActiveTab}>
          <TabsList className="grid w-full md:w-auto grid-cols-3 mb-4">
            <TabsTrigger value="steps">Adımlar</TabsTrigger>
            <TabsTrigger value="chemicals">Kimyasallar</TabsTrigger>
            <TabsTrigger value="applications">Uygulamalar</TabsTrigger>
          </TabsList>

          <TabsContent value="steps" className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Reçete Adımları</h3>
              <Button onClick={() => setIsAddingStep(true)} disabled={isAddingStep}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adım Ekle
              </Button>
            </div>

            {isAddingStep && (
              <Card className="mb-4 border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">Yeni Adım Ekle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label htmlFor="stepName">Adım Adı*</Label>
                      <Input
                        id="stepName"
                        value={newStep.name}
                        onChange={(e) =>
                          setNewStep({ ...newStep, name: e.target.value })
                        }
                        placeholder="Adım adı girin"
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">Süre (dk)*</Label>
                      <Input
                        id="duration"
                        value={newStep.duration}
                        onChange={(e) =>
                          setNewStep({ ...newStep, duration: e.target.value })
                        }
                        placeholder="Süre girin"
                        type="number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="temperature">Sıcaklık (°C)</Label>
                      <Input
                        id="temperature"
                        value={newStep.temperature}
                        onChange={(e) =>
                          setNewStep({ ...newStep, temperature: e.target.value })
                        }
                        placeholder="Sıcaklık girin"
                        type="number"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label htmlFor="description">Açıklama</Label>
                    <Input
                      id="description"
                      value={newStep.description}
                      onChange={(e) =>
                        setNewStep({ ...newStep, description: e.target.value })
                      }
                      placeholder="Adım için detaylı açıklama girin"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingStep(false)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      İptal
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddStep}
                      disabled={!newStep.name || !newStep.duration}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Adımı Ekle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {steps && steps.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-40">
                  <Clock className="h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-gray-500 text-center">
                    Bu reçete için tanımlanmış adım bulunmamaktadır.
                    <br />
                    "Adım Ekle" butonuna tıklayarak yeni adım ekleyebilirsiniz.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Sıra</TableHead>
                        <TableHead>Adım Adı</TableHead>
                        <TableHead>Süre</TableHead>
                        <TableHead>Sıcaklık</TableHead>
                        <TableHead>Açıklama</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {steps?.map((step, index) => (
                        <TableRow key={step.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{step.name}</TableCell>
                          <TableCell>{step.duration} dk</TableCell>
                          <TableCell>
                            {step.temperature ? `${step.temperature}°C` : "-"}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {step.description || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="chemicals" className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Reçete Kimyasalları</h3>
              <Button
                onClick={() => setIsAddingChemical(true)}
                disabled={isAddingChemical}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Kimyasal Ekle
              </Button>
            </div>

            {isAddingChemical && (
              <Card className="mb-4 border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">Yeni Kimyasal Ekle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <Label htmlFor="chemicalId">Kimyasal*</Label>
                      <select
                        id="chemicalId"
                        value={newChemical.chemicalId}
                        onChange={(e) =>
                          setNewChemical({ ...newChemical, chemicalId: e.target.value })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Kimyasal Seçin</option>
                        {allChemicals?.map((chemical) => (
                          <option key={chemical.id} value={chemical.id}>
                            {chemical.name} ({chemical.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="amount">Miktar*</Label>
                      <Input
                        id="amount"
                        value={newChemical.amount}
                        onChange={(e) =>
                          setNewChemical({ ...newChemical, amount: e.target.value })
                        }
                        placeholder="Miktar girin"
                        type="number"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit">Birim</Label>
                      <select
                        id="unit"
                        value={newChemical.unit}
                        onChange={(e) =>
                          setNewChemical({ ...newChemical, unit: e.target.value })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="g/L">g/L</option>
                        <option value="ml/L">ml/L</option>
                        <option value="%">%</option>
                        <option value="kg">kg</option>
                        <option value="L">L</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="addTime">Ekleme Zamanı</Label>
                      <Input
                        id="addTime"
                        value={newChemical.addTime}
                        onChange={(e) =>
                          setNewChemical({ ...newChemical, addTime: e.target.value })
                        }
                        placeholder="Ekleme zamanı (dk)"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingChemical(false)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      İptal
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddChemical}
                      disabled={!newChemical.chemicalId || !newChemical.amount}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Kimyasal Ekle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {chemicals && chemicals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-40">
                  <Beaker className="h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-gray-500 text-center">
                    Bu reçete için tanımlanmış kimyasal bulunmamaktadır.
                    <br />
                    "Kimyasal Ekle" butonuna tıklayarak yeni kimyasal ekleyebilirsiniz.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kimyasal</TableHead>
                        <TableHead>Kodu</TableHead>
                        <TableHead>Miktar</TableHead>
                        <TableHead>Ekleme Zamanı</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chemicals?.map((chemical) => (
                        <TableRow key={chemical.id}>
                          <TableCell className="font-medium">
                            {chemical.chemicalName}
                          </TableCell>
                          <TableCell>{chemical.chemicalCode}</TableCell>
                          <TableCell>
                            {chemical.amount} {chemical.unit}
                          </TableCell>
                          <TableCell>
                            {chemical.addTime ? `${chemical.addTime} dk` : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{chemical.category || "-"}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Reçete Uygulamaları</h3>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Uygulama Kaydet
              </Button>
            </div>

            {applications && applications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-40">
                  <Thermometer className="h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-gray-500 text-center">
                    Bu reçete için kayıtlı uygulama bulunmamaktadır.
                    <br />
                    "Uygulama Kaydet" butonuna tıklayarak yeni uygulama ekleyebilirsiniz.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Parti No</TableHead>
                        <TableHead>Sipariş No</TableHead>
                        <TableHead>Operatör</TableHead>
                        <TableHead>Miktar</TableHead>
                        <TableHead>Sonuç</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications?.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell>
                            {format(new Date(app.applicationDate), "dd.MM.yyyy", {
                              locale: tr,
                            })}
                          </TableCell>
                          <TableCell className="font-medium">{app.batchNumber}</TableCell>
                          <TableCell>
                            {app.orderNumber && (
                              <Link
                                href={`/sales/orders/${app.orderId}`}
                                className="text-blue-600 hover:underline"
                              >
                                {app.orderNumber}
                              </Link>
                            )}
                          </TableCell>
                          <TableCell>{app.operatorName}</TableCell>
                          <TableCell>
                            {app.quantity} {app.unit}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                app.result === "success"
                                  ? "bg-green-100 text-green-800"
                                  : app.result === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-orange-100 text-orange-800"
                              }
                            >
                              {app.result === "success"
                                ? "Başarılı"
                                : app.result === "failed"
                                ? "Başarısız"
                                : "Devam Ediyor"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DyeRecipeDetails;