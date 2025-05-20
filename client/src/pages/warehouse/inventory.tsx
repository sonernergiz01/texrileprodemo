import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowDownUp, 
  Boxes, 
  Edit, 
  Eye, 
  File, 
  Filter, 
  MoreHorizontal, 
  Plus, 
  Printer, 
  RefreshCw, 
  Search, 
  Tag, 
  Trash 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Form şemaları
const inventoryItemSchema = z.object({
  name: z.string().min(1, "Ürün adı zorunludur"),
  itemType: z.string().min(1, "Ürün tipi zorunludur"),
  itemCode: z.string().min(1, "Ürün kodu zorunludur"),
  unit: z.string().min(1, "Birim zorunludur"),
  quantity: z.string().min(1, "Miktar zorunludur"),
  minStockLevel: z.string().optional(),
  locationId: z.string().min(1, "Lokasyon zorunludur"),
  status: z.string().min(1, "Durum zorunludur"),
  description: z.string().optional(),
  tags: z.string().optional()
});

type InventoryItem = z.infer<typeof inventoryItemSchema>;

export default function WarehouseInventoryPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addItemDialog, setAddItemDialog] = useState(false);
  const [editItemDialog, setEditItemDialog] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Form tanımı
  const form = useForm<InventoryItem>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: "",
      itemType: "fabric",
      itemCode: "",
      unit: "metre",
      quantity: "0",
      minStockLevel: "0",
      locationId: "",
      status: "active",
      description: "",
      tags: ""
    }
  });

  // Envanter öğelerini çek
  const { data: inventoryItems = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/warehouse/inventory', selectedTab, locationFilter, statusFilter],
    queryFn: async () => {
      let url = "/api/warehouse/inventory";
      const params = new URLSearchParams();
      
      if (selectedTab !== "all") {
        params.append("itemType", selectedTab);
      }
      
      if (locationFilter !== "all") {
        params.append("locationId", locationFilter);
      }
      
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const res = await apiRequest("GET", url);
      return await res.json();
    }
  });

  // Lokasyonları çek
  const { data: locations = [] } = useQuery({
    queryKey: ['/api/warehouse/locations'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/warehouse/locations");
      return await res.json();
    }
  });

  // Yeni envanter ürünü ekle
  const addItemMutation = useMutation({
    mutationFn: async (data: InventoryItem) => {
      const res = await apiRequest("POST", "/api/warehouse/inventory", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/inventory'] });
      form.reset();
      setAddItemDialog(false);
      toast({
        title: "Ürün eklendi",
        description: "Envanter ürünü başarıyla eklenmiştir.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Ürün eklenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Envanter ürününü güncelle
  const updateItemMutation = useMutation({
    mutationFn: async (data: InventoryItem & { id: number }) => {
      const { id, ...updateData } = data;
      const res = await apiRequest("PATCH", `/api/warehouse/inventory/${id}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/inventory'] });
      form.reset();
      setEditItemDialog(false);
      toast({
        title: "Ürün güncellendi",
        description: "Envanter ürünü başarıyla güncellenmiştir.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Ürün güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Envanter ürününü sil
  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/warehouse/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/inventory'] });
      toast({
        title: "Ürün silindi",
        description: "Envanter ürünü başarıyla silinmiştir.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Ürün silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Envanter durumunu güncelle
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/warehouse/inventory/${id}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/inventory'] });
      toast({
        title: "Durum güncellendi",
        description: "Ürün durumu başarıyla güncellenmiştir.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Durum güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Filtrelenmiş envanter öğeleri
  const filteredItems = inventoryItems.filter((item: any) => {
    const searchMatches = 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return searchMatches;
  });

  // Form gönderimi
  const onSubmit = (data: InventoryItem) => {
    if (selectedItemId) {
      updateItemMutation.mutate({ ...data, id: selectedItemId });
    } else {
      addItemMutation.mutate(data);
    }
  };

  // Düzenleme için ürün seç
  const handleEditItem = (item: any) => {
    setSelectedItemId(item.id);
    form.reset({
      name: item.name,
      itemType: item.itemType,
      itemCode: item.itemCode,
      unit: item.unit,
      quantity: item.quantity.toString(),
      minStockLevel: item.minStockLevel?.toString() || "0",
      locationId: item.locationId.toString(),
      status: item.status,
      description: item.description || "",
      tags: item.tags || ""
    });
    setEditItemDialog(true);
  };

  // Yeni ürün ekle dialog
  const handleAddNewItem = () => {
    setSelectedItemId(null);
    form.reset({
      name: "",
      itemType: "fabric",
      itemCode: "",
      unit: "metre",
      quantity: "0",
      minStockLevel: "0",
      locationId: "",
      status: "active",
      description: "",
      tags: ""
    });
    setAddItemDialog(true);
  };

  // Ürün sil
  const handleDeleteItem = (id: number) => {
    if (confirm("Bu ürünü silmek istediğinizden emin misiniz?")) {
      deleteItemMutation.mutate(id);
    }
  };

  // Durumu değiştir
  const handleStatusChange = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  // Ürün tipi Türkçe karşılığı
  const getItemTypeName = (type: string) => {
    switch (type) {
      case "fabric": return "Kumaş";
      case "yarn": return "İplik";
      case "rawMaterial": return "Hammadde";
      default: return type;
    }
  };
  
  // Durum Türkçe karşılığı
  const getStatusName = (status: string) => {
    switch (status) {
      case "active": return "Aktif";
      case "inactive": return "Pasif";
      case "low": return "Kritik Stok";
      case "quarantine": return "Karantina";
      case "reserved": return "Rezerve";
      default: return status;
    }
  };

  // Durum badgesi
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": 
        return <Badge className="bg-green-100 text-green-800">Aktif</Badge>;
      case "inactive": 
        return <Badge variant="secondary">Pasif</Badge>;
      case "low": 
        return <Badge className="bg-orange-100 text-orange-800">Kritik Stok</Badge>;
      case "quarantine": 
        return <Badge className="bg-purple-100 text-purple-800">Karantina</Badge>;
      case "reserved": 
        return <Badge className="bg-blue-100 text-blue-800">Rezerve</Badge>;
      default: 
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kumaş Depo Envanter</h1>
          <p className="text-muted-foreground">
            Kumaş depodaki stok kalemleri, miktarlar ve lokasyonları görüntüleyin ve yönetin.
          </p>
        </div>
        <Button onClick={handleAddNewItem} className="flex items-center gap-2">
          <Plus size={16} />
          <span>Yeni Ürün Ekle</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Envanter Listesi</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select
                value={locationFilter}
                onValueChange={value => setLocationFilter(value)}
              >
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Lokasyon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Lokasyonlar</SelectItem>
                  {locations.map((location: any) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={statusFilter}
                onValueChange={value => setStatusFilter(value)}
              >
                <SelectTrigger className="w-[150px]">
                  <Tag className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                  <SelectItem value="low">Kritik Stok</SelectItem>
                  <SelectItem value="quarantine">Karantina</SelectItem>
                  <SelectItem value="reserved">Rezerve</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Ara..."
                  className="pl-8 w-full md:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Tüm Ürünler</TabsTrigger>
              <TabsTrigger value="fabric">Kumaş</TabsTrigger>
              <TabsTrigger value="yarn">İplik</TabsTrigger>
              <TabsTrigger value="rawMaterial">Hammadde</TabsTrigger>
            </TabsList>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün Kodu</TableHead>
                    <TableHead>Ürün Adı</TableHead>
                    <TableHead>Tipi</TableHead>
                    <TableHead>Miktar</TableHead>
                    <TableHead>Birim</TableHead>
                    <TableHead>Lokasyon</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">Yükleniyor...</TableCell>
                    </TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">Envanter kaydı bulunamadı</TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.itemCode}</TableCell>
                        <TableCell>
                          <div>{item.name}</div>
                          {item.tags && (
                            <div className="text-xs text-muted-foreground">
                              {item.tags}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getItemTypeName(item.itemType)}</TableCell>
                        <TableCell>
                          <div className={item.quantity <= item.minStockLevel ? "text-red-600 font-medium" : ""}>
                            {item.quantity}
                          </div>
                          {item.minStockLevel > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Min: {item.minStockLevel}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>
                          {locations.find((loc: any) => loc.id === item.locationId)?.name || "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Menü</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEditItem(item)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Düzenle</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Durum Değiştir</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleStatusChange(item.id, "active")}>
                                <Badge className="bg-green-100 text-green-800 mr-2">Aktif</Badge>
                                <span>Aktif</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(item.id, "inactive")}>
                                <Badge variant="secondary" className="mr-2">Pasif</Badge>
                                <span>Pasif</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(item.id, "quarantine")}>
                                <Badge className="bg-purple-100 text-purple-800 mr-2">Karantina</Badge>
                                <span>Karantina</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(item.id, "reserved")}>
                                <Badge className="bg-blue-100 text-blue-800 mr-2">Rezerve</Badge>
                                <span>Rezerve</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600" 
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                <span>Sil</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Yeni Ürün Ekle Dialog */}
      <Dialog open={addItemDialog} onOpenChange={setAddItemDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yeni Envanter Ürünü Ekle</DialogTitle>
            <DialogDescription>
              Depoya yeni bir ürün ekleyin. Tüm zorunlu alanları doldurun.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Ürün Adı</FormLabel>
                      <FormControl>
                        <Input placeholder="Ürün adı" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="itemType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ürün Tipi</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Ürün tipi seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fabric">Kumaş</SelectItem>
                          <SelectItem value="yarn">İplik</SelectItem>
                          <SelectItem value="rawMaterial">Hammadde</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="itemCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ürün Kodu</FormLabel>
                      <FormControl>
                        <Input placeholder="Ürün kodu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Miktar</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birim</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Birim seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="metre">Metre</SelectItem>
                          <SelectItem value="kg">Kg</SelectItem>
                          <SelectItem value="adet">Adet</SelectItem>
                          <SelectItem value="paket">Paket</SelectItem>
                          <SelectItem value="top">Top</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="minStockLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Stok Seviyesi</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lokasyon</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Lokasyon seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((location: any) => (
                            <SelectItem key={location.id} value={location.id.toString()}>
                              {location.code} - {location.name}
                            </SelectItem>
                          ))}
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
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="inactive">Pasif</SelectItem>
                          <SelectItem value="low">Kritik Stok</SelectItem>
                          <SelectItem value="quarantine">Karantina</SelectItem>
                          <SelectItem value="reserved">Rezerve</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Etiketler</FormLabel>
                      <FormControl>
                        <Input placeholder="Etiketler (virgülle ayırın)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Açıklama</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Ürün açıklaması" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setAddItemDialog(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={addItemMutation.isPending}>
                  {addItemMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Ürün Düzenle Dialog */}
      <Dialog open={editItemDialog} onOpenChange={setEditItemDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Envanter Ürününü Düzenle</DialogTitle>
            <DialogDescription>
              Envanter ürününün bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Ürün Adı</FormLabel>
                      <FormControl>
                        <Input placeholder="Ürün adı" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="itemType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ürün Tipi</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Ürün tipi seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fabric">Kumaş</SelectItem>
                          <SelectItem value="yarn">İplik</SelectItem>
                          <SelectItem value="rawMaterial">Hammadde</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="itemCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ürün Kodu</FormLabel>
                      <FormControl>
                        <Input placeholder="Ürün kodu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Miktar</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birim</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Birim seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="metre">Metre</SelectItem>
                          <SelectItem value="kg">Kg</SelectItem>
                          <SelectItem value="adet">Adet</SelectItem>
                          <SelectItem value="paket">Paket</SelectItem>
                          <SelectItem value="top">Top</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="minStockLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Stok Seviyesi</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lokasyon</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Lokasyon seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((location: any) => (
                            <SelectItem key={location.id} value={location.id.toString()}>
                              {location.code} - {location.name}
                            </SelectItem>
                          ))}
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
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="inactive">Pasif</SelectItem>
                          <SelectItem value="low">Kritik Stok</SelectItem>
                          <SelectItem value="quarantine">Karantina</SelectItem>
                          <SelectItem value="reserved">Rezerve</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Etiketler</FormLabel>
                      <FormControl>
                        <Input placeholder="Etiketler (virgülle ayırın)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Açıklama</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Ürün açıklaması" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setEditItemDialog(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={updateItemMutation.isPending}>
                  {updateItemMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}