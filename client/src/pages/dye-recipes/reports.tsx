import { useQuery } from "@tanstack/react-query";
import { BarChart3, Download, FileBarChart, PieChart, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageHeader from "@/components/layout/page-header";
import { useToast } from "@/hooks/use-toast";

// Raporlar sayfası
const DyeRecipeReports = () => {
  const [dateRange, setDateRange] = useState("last-30");
  const [recipeType, setRecipeType] = useState("all");
  const { toast } = useToast();

  // Reçete istatistiklerini getirme
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dye-recipes/stats", dateRange, recipeType],
    queryFn: async () => {
      const response = await fetch(
        `/api/dye-recipes/stats?dateRange=${dateRange}&recipeType=${recipeType}`
      );
      if (!response.ok) {
        throw new Error("İstatistikler yüklenirken hata oluştu");
      }
      return response.json();
    },
  });

  // En çok kullanılan kimyasalları getirme
  const { data: topChemicals, isLoading: chemicalsLoading } = useQuery({
    queryKey: ["/api/dye-recipes/top-chemicals", dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/dye-recipes/top-chemicals?dateRange=${dateRange}`);
      if (!response.ok) {
        throw new Error("Kimyasal kullanım verileri yüklenirken hata oluştu");
      }
      return response.json();
    },
  });

  // En çok kullanılan reçeteleri getirme
  const { data: topRecipes, isLoading: recipesLoading } = useQuery({
    queryKey: ["/api/dye-recipes/top-recipes", dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/dye-recipes/top-recipes?dateRange=${dateRange}`);
      if (!response.ok) {
        throw new Error("Reçete kullanım verileri yüklenirken hata oluştu");
      }
      return response.json();
    },
  });

  // Raporu dışa aktarma
  const handleExportReport = (reportType: string) => {
    toast({
      title: "Rapor dışa aktarılıyor",
      description: `${reportType} raporu excel dosyası olarak indiriliyor...`,
    });
    // Gerçek uygulamada burası file download API'sine bağlanır
  };

  // Veri yoksa uyarı kartı gösterme
  const NoDataCard = ({ message }: { message: string }) => (
    <Card className="col-span-2">
      <CardContent className="flex flex-col items-center justify-center h-48">
        <FileBarChart className="h-16 w-16 text-gray-300 mb-2" />
        <p className="text-gray-500 text-center font-medium">{message}</p>
        <p className="text-gray-400 text-center text-sm mt-2">
          Farklı bir tarih aralığı seçin veya veri olmayabilir
        </p>
      </CardContent>
    </Card>
  );

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

  return (
    <div className="container mx-auto py-6">
        <div className="mb-6">
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6 text-cyan-600 mr-2" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Boya Reçeteleri Raporları</h1>
              <p className="text-muted-foreground">Boya reçeteleri kullanım ve tüketim analizleri</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 mb-6">
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Tarih Aralığı" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-7">Son 7 Gün</SelectItem>
                <SelectItem value="last-30">Son 30 Gün</SelectItem>
                <SelectItem value="last-90">Son 90 Gün</SelectItem>
                <SelectItem value="year-to-date">Yıl Başından Bugüne</SelectItem>
              </SelectContent>
            </Select>
            <Select value={recipeType} onValueChange={setRecipeType}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Reçete Tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tipler</SelectItem>
                <SelectItem value="fabric">Kumaş</SelectItem>
                <SelectItem value="yarn">İplik</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={() => handleExportReport("Genel")}>
            <Download className="mr-2 h-4 w-4" />
            Raporu İndir
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="chemicals">Kimyasal Kullanımı</TabsTrigger>
            <TabsTrigger value="recipes">Reçete Kullanımı</TabsTrigger>
          </TabsList>

          {/* Genel Bakış Sekmesi */}
          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Reçete</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-cyan-600"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalRecipes || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats?.newRecipes || 0} yeni reçete
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Uygulama</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-cyan-600"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalApplications || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats?.successRate || 0}% başarı oranı
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Kimyasal Tüketimi</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-cyan-600"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalChemicalUsage || 0} kg</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.chemicalUsageChange || 0}% artış
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">İşlenen Miktar</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-cyan-600"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalProcessedAmount || 0} kg</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.processedAmountChange || 0}% artış
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 mt-4">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Reçete Tipi Dağılımı</CardTitle>
                  <CardDescription>
                    Farklı tipte reçetelerin sayısal dağılımı
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!stats?.recipeTypesDistribution ? (
                    <div className="flex flex-col items-center justify-center h-48">
                      <PieChart className="h-12 w-12 text-gray-300 mb-2" />
                      <p className="text-gray-500 text-center">Veri bulunamadı</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stats?.recipeTypesDistribution?.map((item) => (
                        <div key={item.type} className="flex items-center">
                          <div className="w-1/3 font-medium text-sm">
                            {getRecipeTypeText(item.type)}
                          </div>
                          <div className="w-2/3">
                            <div className="flex items-center">
                              <div
                                className="h-2 rounded"
                                style={{
                                  width: `${item.percentage}%`,
                                  backgroundColor:
                                    item.type === "fabric"
                                      ? "#3b82f6"
                                      : item.type === "yarn"
                                      ? "#10b981"
                                      : "#8b5cf6",
                                }}
                              />
                              <span className="ml-2 text-sm text-gray-600">
                                {item.percentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Reçete Uygulama Sonuçları</CardTitle>
                  <CardDescription>
                    Son uygulamaların başarı oranları
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!stats?.applicationResults ? (
                    <div className="flex flex-col items-center justify-center h-48">
                      <PieChart className="h-12 w-12 text-gray-300 mb-2" />
                      <p className="text-gray-500 text-center">Veri bulunamadı</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stats?.applicationResults?.map((item) => (
                        <div key={item.result} className="flex items-center">
                          <div className="w-1/3 font-medium text-sm">
                            {item.result === "success"
                              ? "Başarılı"
                              : item.result === "failed"
                              ? "Başarısız"
                              : "Devam Ediyor"}
                          </div>
                          <div className="w-2/3">
                            <div className="flex items-center">
                              <div
                                className="h-2 rounded"
                                style={{
                                  width: `${item.percentage}%`,
                                  backgroundColor:
                                    item.result === "success"
                                      ? "#10b981"
                                      : item.result === "failed"
                                      ? "#ef4444"
                                      : "#f59e0b",
                                }}
                              />
                              <span className="ml-2 text-sm text-gray-600">
                                {item.percentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Kimyasal Kullanımı Sekmesi */}
          <TabsContent value="chemicals">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>En Çok Kullanılan Kimyasallar</CardTitle>
                    <CardDescription>
                      En fazla tüketilen kimyasal maddeler (kg cinsinden)
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleExportReport("Kimyasal")}>
                    <Download className="mr-2 h-4 w-4" />
                    Excel
                  </Button>
                </CardHeader>
                <CardContent>
                  {!topChemicals || topChemicals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48">
                      <FileBarChart className="h-12 w-12 text-gray-300 mb-2" />
                      <p className="text-gray-500 text-center">Kimyasal kullanım verisi bulunamadı</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Kimyasal</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead>Tedarikçi</TableHead>
                          <TableHead className="text-right">
                            <div className="flex items-center justify-end">
                              Toplam Kullanım
                              <ArrowUpDown className="ml-1 h-4 w-4" />
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topChemicals.map((chemical, index) => (
                          <TableRow key={chemical.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>
                              <div className="font-medium">{chemical.name}</div>
                              <div className="text-xs text-gray-500">{chemical.code}</div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getCategoryColor(chemical.category)}>
                                {getCategoryText(chemical.category)}
                              </Badge>
                            </TableCell>
                            <TableCell>{chemical.supplier || "-"}</TableCell>
                            <TableCell className="text-right">
                              <span className="font-medium">{chemical.totalUsage.toFixed(2)} kg</span>
                              <span className="text-xs text-gray-500 block">
                                {chemical.usageRatio}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Kategori Bazlı Kimyasal Tüketimi</CardTitle>
                  <CardDescription>
                    Kimyasal kategorilerine göre tüketim miktarları
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!stats?.chemicalCategoryUsage || stats?.chemicalCategoryUsage.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48">
                      <BarChart3 className="h-12 w-12 text-gray-300 mb-2" />
                      <p className="text-gray-500 text-center">Kategori bazlı tüketim verisi bulunamadı</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {stats?.chemicalCategoryUsage?.map((category) => (
                        <div key={category.category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Badge className={getCategoryColor(category.category)}>
                                {getCategoryText(category.category)}
                              </Badge>
                            </div>
                            <div className="font-medium text-sm">{category.amount.toFixed(2)} kg</div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full`}
                              style={{
                                width: `${category.percentage}%`,
                                backgroundColor:
                                  category.category === "dye"
                                    ? "#ef4444"
                                    : category.category === "softener"
                                    ? "#3b82f6"
                                    : category.category === "enzyme"
                                    ? "#10b981"
                                    : category.category === "acid"
                                    ? "#8b5cf6"
                                    : category.category === "alkali"
                                    ? "#f59e0b"
                                    : category.category === "fixative"
                                    ? "#6366f1"
                                    : category.category === "detergent"
                                    ? "#14b8a6"
                                    : "#94a3b8",
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reçete Kullanımı Sekmesi */}
          <TabsContent value="recipes">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>En Çok Kullanılan Reçeteler</CardTitle>
                    <CardDescription>
                      En sık uygulanan boya reçeteleri
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleExportReport("Reçete")}>
                    <Download className="mr-2 h-4 w-4" />
                    Excel
                  </Button>
                </CardHeader>
                <CardContent>
                  {!topRecipes || topRecipes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48">
                      <FileBarChart className="h-12 w-12 text-gray-300 mb-2" />
                      <p className="text-gray-500 text-center">Reçete kullanım verisi bulunamadı</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Reçete</TableHead>
                          <TableHead>Tip</TableHead>
                          <TableHead>Uygulama Sayısı</TableHead>
                          <TableHead>Başarı Oranı</TableHead>
                          <TableHead className="text-right">İşlenen Miktar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topRecipes.map((recipe, index) => (
                          <TableRow key={recipe.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>
                              <div className="font-medium">{recipe.name}</div>
                              <div className="text-xs text-gray-500">{recipe.code}</div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  recipe.recipeType === "fabric"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                                }
                              >
                                {getRecipeTypeText(recipe.recipeType)}
                              </Badge>
                            </TableCell>
                            <TableCell>{recipe.applicationCount}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                                  <div
                                    className="bg-green-600 h-2.5 rounded-full"
                                    style={{ width: `${recipe.successRate}%` }}
                                  ></div>
                                </div>
                                <span>{recipe.successRate}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {recipe.processedAmount.toFixed(2)} kg
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Aylık Reçete Kullanımı</CardTitle>
                  <CardDescription>Son 6 ayda uygulanan reçete sayıları</CardDescription>
                </CardHeader>
                <CardContent>
                  {!stats?.monthlyUsage || stats?.monthlyUsage.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48">
                      <BarChart3 className="h-12 w-12 text-gray-300 mb-2" />
                      <p className="text-gray-500 text-center">Aylık kullanım verisi bulunamadı</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {stats?.monthlyUsage?.map((month) => (
                        <div key={month.month} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">{month.month}</div>
                            <div className="font-medium">{month.count} uygulama</div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div
                              className="bg-cyan-600 h-2.5 rounded-full"
                              style={{
                                width: `${(month.count / (stats?.maxMonthlyUsage || 1)) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reçete Tipi Kullanımı</CardTitle>
                  <CardDescription>
                    Tiplerine göre işlenen toplam miktarlar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!stats?.recipeTypeUsage || stats?.recipeTypeUsage.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48">
                      <PieChart className="h-12 w-12 text-gray-300 mb-2" />
                      <p className="text-gray-500 text-center">Reçete tipi kullanım verisi bulunamadı</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {stats?.recipeTypeUsage?.map((type) => (
                        <div key={type.type} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Badge
                                className={
                                  type.type === "fabric"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                                }
                              >
                                {getRecipeTypeText(type.type)}
                              </Badge>
                            </div>
                            <div className="font-medium">
                              {type.amount.toFixed(2)} kg
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${
                                type.type === "fabric"
                                  ? "bg-blue-600"
                                  : "bg-green-600"
                              }`}
                              style={{ width: `${type.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
};

export default DyeRecipeReports;