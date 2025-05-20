import { useQuery } from "@tanstack/react-query";
import { Beaker, PlusCircle, Search, TestTube } from "lucide-react";
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
import { format } from "date-fns";
import { tr } from "date-fns/locale";

// Boya reçeteleri liste sayfası
const DyeRecipesList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [recipeType, setRecipeType] = useState("all");

  // Reçeteleri getirme
  const { data: recipes, isLoading } = useQuery({
    queryKey: ["/api/dye-recipes"],
    queryFn: async () => {
      const response = await fetch("/api/dye-recipes");
      if (!response.ok) {
        throw new Error("Reçeteler yüklenirken hata oluştu");
      }
      return response.json();
    },
  });

  // Filtreleme
  const filteredRecipes = recipes?.filter((recipe) => {
    const matchesSearch =
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = 
      recipeType === "all" || 
      recipe.recipeType === recipeType;
    
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

  return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <div className="flex items-center">
            <TestTube className="h-6 w-6 text-cyan-600 mr-2" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Reçete Listesi</h1>
              <p className="text-muted-foreground">Bütün boya reçetelerini görüntüleyin</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 mb-6">
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Reçete ara..."
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
                <SelectItem value="template">Şablon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button asChild className="ml-auto">
            <Link href="/dye-recipes/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Yeni Reçete
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {filteredRecipes ? filteredRecipes.length : 0} reçete bulundu
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
                      <TableHead>Reçete Kodu</TableHead>
                      <TableHead>Reçete Adı</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Oluşturulma</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecipes?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          Reçete bulunamadı.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRecipes?.map((recipe) => (
                        <TableRow key={recipe.id}>
                          <TableCell className="font-medium">
                            <Link 
                              href={`/dye-recipes/${recipe.id}`}
                              className="text-blue-600 hover:underline flex items-center"
                            >
                              <Beaker className="mr-2 h-4 w-4" />
                              {recipe.code}
                            </Link>
                          </TableCell>
                          <TableCell>{recipe.name}</TableCell>
                          <TableCell>
                            <Badge className={getRecipeTypeColor(recipe.recipeType)}>
                              {getRecipeTypeText(recipe.recipeType)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRecipeStatusColor(recipe.status)}>
                              {getRecipeStatusText(recipe.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm">
                            {recipe.createdAt && format(new Date(recipe.createdAt), 'dd MMM yyyy', { locale: tr })}
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

export default DyeRecipesList;