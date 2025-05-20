import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Plus, MoreVertical, Search, Pencil, Trash2, Eye, Printer, Barcode, ChevronRight } from "lucide-react";

// Tip tanımları
interface ColorSwatch {
  id: number;
  name: string;
  code: string;
  hexCode: string;
  colorFamilyId: number;
  colorCategoryId: number;
  description: string;
  cmykValues: { c: number; m: number; y: number; k: number };
  rgbValues: { r: number; g: number; b: number };
  labValues: { l: number; a: number; b: number };
  pantoneReference: string;
  dyeingProcess: string;
  dyeingRequirements: string;
  colorFastness: { [key: string]: number };
  barcodeNumber: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
  updatedBy: number;
  imgUrl: string | null;
  availableFabrics: string[];
  minimumOrderQuantity: number;
  price: number | null;
  currency: string | null;
  notes: string | null;
}

interface ColorFamily {
  id: number;
  name: string;
  description: string;
}

interface ColorCategory {
  id: number;
  name: string;
  description: string;
}

const colorStatusColorMap: Record<string, string> = {
  "active": "bg-green-100 text-green-800",
  "inactive": "bg-gray-100 text-gray-800",
  "discontinued": "bg-red-100 text-red-800",
  "pending": "bg-yellow-100 text-yellow-800",
  "sample": "bg-blue-100 text-blue-800"
};

export default function ColorSwatchesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedColorFamily, setSelectedColorFamily] = useState<string>("all");
  const [selectedColorCategory, setSelectedColorCategory] = useState<string>("all");
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [selectedSwatch, setSelectedSwatch] = useState<ColorSwatch | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Renk kartelalarını getir
  const { 
    data: colorSwatches, 
    isLoading: isLoadingColors, 
    error: colorsError
  } = useQuery<ColorSwatch[]>({ 
    queryKey: ["/api/kartela/color-swatches"],
    retry: 1,
  });

  // Renk ailelerini getir
  const { 
    data: colorFamilies, 
    isLoading: isLoadingFamilies
  } = useQuery<ColorFamily[]>({ 
    queryKey: ["/api/kartela/color-families"],
    retry: 1,
  });

  // Renk kategorilerini getir
  const { 
    data: colorCategories, 
    isLoading: isLoadingCategories
  } = useQuery<ColorCategory[]>({ 
    queryKey: ["/api/kartela/color-categories"],
    retry: 1,
  });

  // Renk kartelası oluşturma mutasyonu
  const createMutation = useMutation({
    mutationFn: async (data: Partial<ColorSwatch>) => {
      const response = await apiRequest("POST", "/api/kartela/color-swatches", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Renk kartelası başarıyla oluşturuldu",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/kartela/color-swatches"] });
      setOpenCreateDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Renk kartelası oluşturulamadı: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Renk kartelası silme mutasyonu
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/kartela/color-swatches/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Renk kartelası başarıyla silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/kartela/color-swatches"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Renk kartelası silinemedi: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filtreleme fonksiyonu
  const filteredSwatches = colorSwatches?.filter(swatch => {
    // Metin bazlı arama
    const textMatch = 
      swatch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      swatch.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      swatch.barcodeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      swatch.hexCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Renk ailesi filtresi
    const familyMatch = 
      selectedColorFamily === "all" || 
      swatch.colorFamilyId.toString() === selectedColorFamily;
    
    // Renk kategorisi filtresi
    const categoryMatch = 
      selectedColorCategory === "all" || 
      swatch.colorCategoryId.toString() === selectedColorCategory;
    
    return textMatch && familyMatch && categoryMatch;
  });

  // Yükleme durumu
  if (isLoadingColors || isLoadingFamilies || isLoadingCategories) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Hata durumu
  if (colorsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <p className="text-red-500">Hata oluştu: {(colorsError as Error).message}</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/kartela/color-swatches"] })}>
          Yeniden Dene
        </Button>
      </div>
    );
  }

  // Renk ailesinin adını bul
  const getColorFamilyName = (id: number): string => {
    const family = colorFamilies?.find(f => f.id === id);
    return family ? family.name : "Bilinmeyen";
  };

  // Renk kategorisinin adını bul
  const getColorCategoryName = (id: number): string => {
    const category = colorCategories?.find(c => c.id === id);
    return category ? category.name : "Bilinmeyen";
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Renk Kartelaları</h1>
          <p className="text-muted-foreground">
            Mevcut tüm renk kartelalarını görüntüleyin, oluşturun ve yönetin.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Arama..."
              className="pl-8 w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button onClick={() => setOpenCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Renk Kartelası
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="colorFamily">Renk Ailesi</Label>
          <Select value={selectedColorFamily} onValueChange={setSelectedColorFamily}>
            <SelectTrigger id="colorFamily">
              <SelectValue placeholder="Tüm renk aileleri" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm renk aileleri</SelectItem>
              {colorFamilies?.map((family) => (
                <SelectItem key={family.id} value={family.id.toString()}>
                  {family.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="colorCategory">Renk Kategorisi</Label>
          <Select value={selectedColorCategory} onValueChange={setSelectedColorCategory}>
            <SelectTrigger id="colorCategory">
              <SelectValue placeholder="Tüm renk kategorileri" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm renk kategorileri</SelectItem>
              {colorCategories?.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="my-6" />

      {filteredSwatches?.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
          <p className="text-muted-foreground">Hiç renk kartelası bulunamadı.</p>
          <Button onClick={() => setOpenCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Renk Kartelası Oluştur
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredSwatches?.map((swatch) => (
            <Card key={swatch.id} className="overflow-hidden">
              <div className="relative">
                <div 
                  className="w-full h-40" 
                  style={{ backgroundColor: swatch.hexCode }}
                />
                <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${colorStatusColorMap[swatch.status] || 'bg-gray-100'}`}>
                  {swatch.status}
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{swatch.name}</CardTitle>
                    <CardDescription>
                      Kod: {swatch.code} | HEX: {swatch.hexCode}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        setSelectedSwatch(swatch);
                        setOpenViewDialog(true);
                      }}>
                        <Eye className="h-4 w-4 mr-2" /> Görüntüle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/kartela/color-swatches/${swatch.id}/edit`)}>
                        <Pencil className="h-4 w-4 mr-2" /> Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => {
                          if (window.confirm('Bu renk kartelasını silmek istediğinizden emin misiniz?')) {
                            deleteMutation.mutate(swatch.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Sil
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => console.log(`Print ${swatch.id}`)}>
                        <Printer className="h-4 w-4 mr-2" /> Yazdır
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => console.log(`Barcode ${swatch.barcodeNumber}`)}>
                        <Barcode className="h-4 w-4 mr-2" /> Barkod
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pb-2">
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <div className="text-muted-foreground">Renk Ailesi:</div>
                  <div>{getColorFamilyName(swatch.colorFamilyId)}</div>
                  <div className="text-muted-foreground">Kategori:</div>
                  <div>{getColorCategoryName(swatch.colorCategoryId)}</div>
                  <div className="text-muted-foreground">CMYK:</div>
                  <div>
                    {swatch.cmykValues.c}%, {swatch.cmykValues.m}%, 
                    {swatch.cmykValues.y}%, {swatch.cmykValues.k}%
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" className="w-full" onClick={() => {
                  setSelectedSwatch(swatch);
                  setOpenViewDialog(true);
                }}>
                  Detayları Görüntüle
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Renk Kartelası Ekleme Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Renk Kartelası Ekle</DialogTitle>
            <DialogDescription>
              Yeni bir renk kartelası eklemek için aşağıdaki formu doldurun.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Renk Adı</Label>
                <Input id="name" placeholder="Renk adını girin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Renk Kodu</Label>
                <Input id="code" placeholder="Renk kodunu girin" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hexCode">HEX Kodu</Label>
                <div className="flex gap-2">
                  <Input id="hexCode" placeholder="#FFFFFF" />
                  <div className="h-10 w-10 rounded border border-input" style={{ backgroundColor: '#FFFFFF' }} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Durum</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Pasif</SelectItem>
                    <SelectItem value="discontinued">Üretimi Durduruldu</SelectItem>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="sample">Numune</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="colorFamily">Renk Ailesi</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Renk ailesi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorFamilies?.map((family) => (
                      <SelectItem key={family.id} value={family.id.toString()}>
                        {family.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="colorCategory">Renk Kategorisi</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Renk kategorisi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorCategories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Input id="description" placeholder="Renk açıklaması" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>CMYK Değerleri</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="C" />
                  <Input placeholder="M" />
                  <Input placeholder="Y" />
                  <Input placeholder="K" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>RGB Değerleri</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="R" />
                  <Input placeholder="G" />
                  <Input placeholder="B" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pantone">Pantone Referansı</Label>
                <Input id="pantone" placeholder="Pantone No" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Görsel URL</Label>
              <Input id="image" placeholder="Görsel URL'si (opsiyonel)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <textarea
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Renk hakkında ek notlar"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreateDialog(false)}>
              İptal
            </Button>
            <Button type="submit" onClick={() => {
              // Form verilerini topla ve mutasyonu çağır
              // Bu sadece bir örnek implementasyondur
              createMutation.mutate({
                name: "Örnek Renk", 
                code: "RK001",
                hexCode: "#3366CC",
                colorFamilyId: 1,
                colorCategoryId: 1,
                description: "Koyu mavi renk tonu",
                cmykValues: { c: 75, m: 50, y: 0, k: 20 },
                rgbValues: { r: 51, g: 102, b: 204 },
                labValues: { l: 45, a: 10, b: -50 },
                pantoneReference: "2935 C",
                dyeingProcess: "Reactive",
                dyeingRequirements: "Standard process",
                colorFastness: { washing: 4, light: 5, rubbing: 4 },
                barcodeNumber: "R" + Math.floor(1000000 + Math.random() * 9000000).toString(),
                status: "active",
                availableFabrics: ["Pamuk", "Polyester", "Viskon"],
                minimumOrderQuantity: 50,
                price: 7.5,
                currency: "USD",
                notes: "Örnek renk numunesi"
              })
            }}>
              {createMutation.isPending ? 
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                <Plus className="mr-2 h-4 w-4" />
              }
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renk Kartelası Görüntüleme Dialog */}
      <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedSwatch && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedSwatch.name}</DialogTitle>
                <DialogDescription>
                  Kod: {selectedSwatch.code} | HEX: {selectedSwatch.hexCode} | Barkod: {selectedSwatch.barcodeNumber}
                </DialogDescription>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-6 py-4">
                <div>
                  <div 
                    className="w-full h-64 rounded-md"
                    style={{ backgroundColor: selectedSwatch.hexCode }}
                  />
                  <div className="mt-4">
                    <h3 className="font-medium">Rengin Kullanılabileceği Kumaşlar</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedSwatch.availableFabrics.map((fabric, index) => (
                        <div key={index} className="px-3 py-1 bg-gray-100 rounded text-sm">
                          {fabric}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Renk Bilgileri</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Renk Ailesi:</div>
                      <div>{getColorFamilyName(selectedSwatch.colorFamilyId)}</div>
                      <div className="text-muted-foreground">Renk Kategorisi:</div>
                      <div>{getColorCategoryName(selectedSwatch.colorCategoryId)}</div>
                      <div className="text-muted-foreground">HEX Kod:</div>
                      <div className="flex items-center gap-2">
                        {selectedSwatch.hexCode}
                        <div className="h-4 w-4 rounded" style={{ backgroundColor: selectedSwatch.hexCode }} />
                      </div>
                      <div className="text-muted-foreground">CMYK:</div>
                      <div>
                        C: {selectedSwatch.cmykValues.c}%, M: {selectedSwatch.cmykValues.m}%, 
                        Y: {selectedSwatch.cmykValues.y}%, K: {selectedSwatch.cmykValues.k}%
                      </div>
                      <div className="text-muted-foreground">RGB:</div>
                      <div>
                        R: {selectedSwatch.rgbValues.r}, G: {selectedSwatch.rgbValues.g}, 
                        B: {selectedSwatch.rgbValues.b}
                      </div>
                      <div className="text-muted-foreground">LAB:</div>
                      <div>
                        L: {selectedSwatch.labValues.l}, a: {selectedSwatch.labValues.a}, 
                        b: {selectedSwatch.labValues.b}
                      </div>
                      <div className="text-muted-foreground">Pantone:</div>
                      <div>{selectedSwatch.pantoneReference}</div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2">Boyama Bilgileri</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Boyama Prosesi:</div>
                      <div>{selectedSwatch.dyeingProcess}</div>
                      <div className="text-muted-foreground">Boyama Gereksinimleri:</div>
                      <div>{selectedSwatch.dyeingRequirements}</div>
                      <div className="text-muted-foreground">Renk Haslığı:</div>
                      <div className="flex gap-2">
                        {Object.entries(selectedSwatch.colorFastness).map(([key, value]) => (
                          <Badge key={key} variant="outline">
                            {key}: {value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2">Ticari Bilgiler</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {selectedSwatch.price && (
                        <>
                          <div className="text-muted-foreground">Fiyat:</div>
                          <div>{selectedSwatch.price} {selectedSwatch.currency}</div>
                        </>
                      )}
                      <div className="text-muted-foreground">Minimum Sipariş:</div>
                      <div>{selectedSwatch.minimumOrderQuantity} kg</div>
                      <div className="text-muted-foreground">Durum:</div>
                      <div className={`inline-flex px-2 py-1 rounded text-xs font-medium ${colorStatusColorMap[selectedSwatch.status] || 'bg-gray-100'}`}>
                        {selectedSwatch.status}
                      </div>
                    </div>
                  </div>
                  {selectedSwatch.notes && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-medium mb-2">Notlar</h3>
                        <p className="text-sm">{selectedSwatch.notes}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => navigate(`/kartela/color-swatches/${selectedSwatch.id}/edit`)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Düzenle
                </Button>
                <Button variant="outline" onClick={() => navigate("/kartela/fabric-swatches?color=" + selectedSwatch.id)}>
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Uyumlu Kumaşları Göster
                </Button>
                <Button variant="outline" onClick={() => console.log(`Print ${selectedSwatch.id}`)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Yazdır
                </Button>
                <Button variant="outline" onClick={() => console.log(`Barcode ${selectedSwatch.barcodeNumber}`)}>
                  <Barcode className="h-4 w-4 mr-2" />
                  Barkod
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}