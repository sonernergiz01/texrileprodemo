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
  DialogTrigger,
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
import { Loader2, Plus, MoreVertical, Search, Pencil, Trash2, Eye, Printer, Barcode } from "lucide-react";
import { BarcodeModal } from "@/components/barcode/barcode-modal";

// Tip tanımları
interface FabricSwatch {
  id: number;
  name: string;
  code: string;
  fabricTypeId: number;
  weight: number;
  width: number;
  composition: string;
  construction: string;
  color: string;
  pattern: string;
  finish: string;
  imgUrl: string | null;
  availableColors: string[];
  finishingOptions: string[];
  minimumOrderQuantity: number;
  price: number;
  currency: string;
  leadTime: number;
  usageAreas: string[];
  notes: string;
  barcodeNumber: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
  updatedBy: number;
}

const fabricStatusColorMap: Record<string, string> = {
  "active": "bg-green-100 text-green-800",
  "inactive": "bg-gray-100 text-gray-800",
  "discontinued": "bg-red-100 text-red-800",
  "pending": "bg-yellow-100 text-yellow-800",
  "sample": "bg-blue-100 text-blue-800"
};

export default function FabricSwatchesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [selectedSwatch, setSelectedSwatch] = useState<FabricSwatch | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  // Barkod modal durumu
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState<string>("");
  const [selectedCardInfo, setSelectedCardInfo] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // State'ler
  const [selectedFabricTypeId, setSelectedFabricTypeId] = useState<number | null>(null);
  
  // Kumaş kartelalarını getir
  const { 
    data: fabricSwatches, 
    isLoading, 
    error 
  } = useQuery<FabricSwatch[]>({ 
    queryKey: ["/api/kartela/fabric-swatches"],
    retry: 1,
  });

  // Kumaş tiplerini ÜRGE modülünden getir
  const {
    data: fabricTypes = [],
    isLoading: isLoadingFabricTypes,
  } = useQuery<any[]>({
    queryKey: ["/api/product-development/fabric-types"],
    retry: 1,
    onSuccess: (data) => {
      if (data.length > 0 && !selectedFabricTypeId) {
        setSelectedFabricTypeId(data[0].id);
      }
    }
  });

  // Kumaş kartelası oluşturma mutasyonu
  const createMutation = useMutation({
    mutationFn: async (data: Partial<FabricSwatch>) => {
      const response = await apiRequest("POST", "/api/kartela/fabric-swatches", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Kumaş kartelası başarıyla oluşturuldu",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/kartela/fabric-swatches"] });
      setOpenCreateDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Kumaş kartelası oluşturulamadı: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Kumaş kartelası silme mutasyonu
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/kartela/fabric-swatches/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Kumaş kartelası başarıyla silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/kartela/fabric-swatches"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Kumaş kartelası silinemedi: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filtreleme fonksiyonu
  const filteredSwatches = fabricSwatches?.filter(swatch => 
    swatch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    swatch.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    swatch.barcodeNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Yükleme durumu
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <p className="text-red-500">Hata oluştu: {(error as Error).message}</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/kartela/fabric-swatches"] })}>
          Yeniden Dene
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kumaş Kartelaları</h1>
          <p className="text-muted-foreground">
            Mevcut tüm kumaş kartelalarını görüntüleyin, oluşturun ve yönetin.
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
            Yeni Kumaş Kartelası
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      {filteredSwatches?.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
          <p className="text-muted-foreground">Hiç kumaş kartelası bulunamadı.</p>
          <Button onClick={() => setOpenCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Kumaş Kartelası Oluştur
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSwatches?.map((swatch) => (
            <Card key={swatch.id} className="overflow-hidden">
              {swatch.imgUrl ? (
                <div className="relative w-full h-48 overflow-hidden">
                  <img 
                    src={swatch.imgUrl} 
                    alt={swatch.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${fabricStatusColorMap[swatch.status] || 'bg-gray-100'}`}>
                    {swatch.status}
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-48 bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-400">Görsel Yok</p>
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${fabricStatusColorMap[swatch.status] || 'bg-gray-100'}`}>
                    {swatch.status}
                  </div>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{swatch.name}</CardTitle>
                    <CardDescription>Kod: {swatch.code}</CardDescription>
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
                      <DropdownMenuItem onClick={() => navigate(`/kartela/fabric-swatches/${swatch.id}/edit`)}>
                        <Pencil className="h-4 w-4 mr-2" /> Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => {
                          if (window.confirm('Bu kumaş kartelasını silmek istediğinizden emin misiniz?')) {
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
                      <DropdownMenuItem onClick={() => {
                        // Barkod modalını açmak için gerekli bilgileri ayarla
                        setSelectedBarcode(swatch.barcodeNumber || `KK-${swatch.id}`);
                        setSelectedCardInfo({
                          "Kumaş Adı": swatch.name,
                          "Kod": swatch.code,
                          "Ağırlık": `${swatch.weight} g/m²`,
                          "En": `${swatch.width} cm`,
                          "Kompozisyon": swatch.composition || "-"
                        });
                        setIsBarcodeModalOpen(true);
                      }}>
                        <Barcode className="h-4 w-4 mr-2" /> Barkod
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pb-2">
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <div className="text-muted-foreground">Komposizyon:</div>
                  <div>{swatch.composition}</div>
                  <div className="text-muted-foreground">Ağırlık:</div>
                  <div>{swatch.weight} g/m²</div>
                  <div className="text-muted-foreground">En:</div>
                  <div>{swatch.width} cm</div>
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

      {/* Kumaş Kartelası Ekleme Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Kumaş Kartelası Ekle</DialogTitle>
            <DialogDescription>
              Yeni bir kumaş kartelası eklemek için aşağıdaki formu doldurun.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Kumaş Adı</Label>
                <Input id="name" placeholder="Kumaş adını girin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Kumaş Kodu</Label>
                <Input id="code" placeholder="Kumaş kodunu girin" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fabric-type">Kumaş Tipi</Label>
                <Select onValueChange={(value) => setSelectedFabricTypeId(Number(value))} value={selectedFabricTypeId ? selectedFabricTypeId.toString() : ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kumaş tipini seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingFabricTypes ? (
                      <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
                    ) : fabricTypes.length === 0 ? (
                      <SelectItem value="none" disabled>Kumaş tipi bulunamadı</SelectItem>
                    ) : (
                      fabricTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name} ({type.code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                  Bu liste Ürün Geliştirme departmanı tarafından tanımlanan kumaş tiplerini içerir
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
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Ağırlık (g/m²)</Label>
                <Input type="number" id="weight" placeholder="Ağırlık" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">En (cm)</Label>
                <Input type="number" id="width" placeholder="En" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Fiyat</Label>
                <Input type="number" id="price" placeholder="Fiyat" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="composition">Kompozisyon</Label>
              <Input id="composition" placeholder="Örn: %100 Pamuk, %65 Pamuk %35 Polyester" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="construction">Konstrüksiyon</Label>
              <Input id="construction" placeholder="Konstrüksiyon detayları" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Renk</Label>
                <Input id="color" placeholder="Ana renk" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pattern">Desen</Label>
                <Input id="pattern" placeholder="Desen tipi" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Görsel URL</Label>
              <Input id="image" placeholder="Görsel URL'si" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <textarea
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Kumaş hakkında ek notlar"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreateDialog(false)}>
              İptal
            </Button>
            <Button type="submit" onClick={() => {
              // Form verilerini topla
              const name = document.getElementById("name") as HTMLInputElement;
              const code = document.getElementById("code") as HTMLInputElement;
              const weight = document.getElementById("weight") as HTMLInputElement;
              const width = document.getElementById("width") as HTMLInputElement;
              const price = document.getElementById("price") as HTMLInputElement;
              const composition = document.getElementById("composition") as HTMLInputElement;
              const construction = document.getElementById("construction") as HTMLInputElement;
              const color = document.getElementById("color") as HTMLInputElement;
              const pattern = document.getElementById("pattern") as HTMLInputElement;
              const image = document.getElementById("image") as HTMLInputElement;
              const notes = document.getElementById("notes") as HTMLTextAreaElement;

              // Seçilen kumaş tipini kullan
              const fabricTypeId = selectedFabricTypeId;
              
              // Mutasyonu çağır
              createMutation.mutate({
                name: name.value || "Yeni Kumaş", 
                code: code.value || `K${Date.now().toString().substring(6)}`,
                fabricTypeId: fabricTypeId,
                fabricType: fabricTypes.find(t => t.id === fabricTypeId)?.name || "Belirtilmemiş",
                weight: weight.value || "0",
                width: width.value || "0",
                composition: composition.value || "Belirtilmemiş",
                construction: construction.value || "Belirtilmemiş",
                color: color.value || "Belirtilmemiş",
                pattern: pattern.value || "Belirtilmemiş",
                finish: "Standard",
                imgUrl: image.value || null,
                availableColors: ["Beyaz", "Siyah", "Kırmızı"],
                finishingOptions: ["Standard"],
                minimumOrderQuantity: "100",
                collection: "Genel",
                season: "2025-Yaz",
                pricePerMeter: price.value || "0",
                leadTime: "15",
                usageAreas: ["Genel"],
                notes: notes.value || "",
                status: "Aktif",
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 1, // Admin kullanıcısı
                updatedBy: 1,
                // Barkod numarası otomatik oluşturulacak
                barcodeNumber: `KART-${Date.now().toString().substring(6)}`,
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

      {/* Kumaş Kartelası Görüntüleme Dialog */}
      {/* Barkod Modal */}
      <BarcodeModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        barcodeValue={selectedBarcode}
        title="Kumaş Kartelası Barkodu"
        description="Kumaş kartelası barkodunu yazdırabilir veya PDF olarak indirebilirsiniz."
        additionalInfo={selectedCardInfo}
      />
      
      <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedSwatch && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedSwatch.name}</DialogTitle>
                <DialogDescription>
                  Kod: {selectedSwatch.code} | Barkod: {selectedSwatch.barcodeNumber}
                </DialogDescription>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-6 py-4">
                <div>
                  {selectedSwatch.imgUrl ? (
                    <div className="w-full h-64 overflow-hidden rounded-md">
                      <img 
                        src={selectedSwatch.imgUrl} 
                        alt={selectedSwatch.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-md">
                      <p className="text-gray-400">Görsel Yok</p>
                    </div>
                  )}
                  <div className="mt-4">
                    <h3 className="font-medium">Mevcut Renkler</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedSwatch.availableColors.map((color, index) => (
                        <div key={index} className="px-3 py-1 bg-gray-100 rounded text-sm">
                          {color}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Kumaş Özellikleri</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Kumaş Tipi:</div>
                      <div>
                        {isLoadingFabricTypes ? (
                          <span className="text-muted-foreground italic">Yükleniyor...</span>
                        ) : (
                          <span className="font-medium">
                            {fabricTypes.find(t => t.id === selectedSwatch.fabricTypeId)?.name || 
                            "Belirtilmemiş"}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground block">
                          ID: {selectedSwatch.fabricTypeId}
                        </span>
                      </div>
                      <div className="text-muted-foreground">Kompozisyon:</div>
                      <div>{selectedSwatch.composition}</div>
                      <div className="text-muted-foreground">Konstrüksiyon:</div>
                      <div>{selectedSwatch.construction}</div>
                      <div className="text-muted-foreground">Ağırlık:</div>
                      <div>{selectedSwatch.weight} g/m²</div>
                      <div className="text-muted-foreground">En:</div>
                      <div>{selectedSwatch.width} cm</div>
                      <div className="text-muted-foreground">Renk:</div>
                      <div>{selectedSwatch.color}</div>
                      <div className="text-muted-foreground">Desen:</div>
                      <div>{selectedSwatch.pattern}</div>
                      <div className="text-muted-foreground">Apreler:</div>
                      <div>{selectedSwatch.finish}</div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2">Ticari Bilgiler</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Fiyat:</div>
                      <div>{selectedSwatch.price} {selectedSwatch.currency}</div>
                      <div className="text-muted-foreground">Minimum Sipariş:</div>
                      <div>{selectedSwatch.minimumOrderQuantity} metre</div>
                      <div className="text-muted-foreground">Üretim Süresi:</div>
                      <div>{selectedSwatch.leadTime} gün</div>
                      <div className="text-muted-foreground">Durum:</div>
                      <div className={`inline-flex px-2 py-1 rounded text-xs font-medium ${fabricStatusColorMap[selectedSwatch.status] || 'bg-gray-100'}`}>
                        {selectedSwatch.status}
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2">Kullanım Alanları</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSwatch.usageAreas.map((area, index) => (
                        <div key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {area}
                        </div>
                      ))}
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
                <Button variant="outline" onClick={() => navigate(`/kartela/fabric-swatches/${selectedSwatch.id}/edit`)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Düzenle
                </Button>
                <Button variant="outline" onClick={() => console.log(`Print ${selectedSwatch.id}`)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Yazdır
                </Button>
                <Button variant="outline" onClick={() => {
                  // Barkod modalını açmak için gerekli bilgileri ayarla
                  setSelectedBarcode(selectedSwatch.barcodeNumber || `KK-${selectedSwatch.id}`);
                  setSelectedCardInfo({
                    "Kumaş Adı": selectedSwatch.name,
                    "Kod": selectedSwatch.code,
                    "Ağırlık": `${selectedSwatch.weight} g/m²`,
                    "En": `${selectedSwatch.width} cm`,
                    "Kompozisyon": selectedSwatch.composition || "-"
                  });
                  setIsBarcodeModalOpen(true);
                  setOpenViewDialog(false); // Detay diyaloğunu kapat
                }}>
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