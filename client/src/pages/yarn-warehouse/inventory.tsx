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
  Eye,
  Download,
  Upload,
  Trash2,
  Filter,
  ChevronDown,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Package,
  Truck,
  Boxes,
  BarChart,
  CalendarDays,
  Scale,
  Tag,
  MoveRight,
  PlusCircle,
  MinusCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// İplik envanteri şeması
const yarnInventorySchema = z.object({
  yarnId: z.string().min(1, "İplik ID gereklidir"),
  yarnType: z.string().min(1, "İplik türü gereklidir"),
  count: z.string().min(1, "Numara gereklidir"),
  composition: z.string().min(1, "Kompozisyon gereklidir"),
  color: z.string().optional(),
  supplier: z.string().min(1, "Tedarikçi gereklidir"),
  lotNumber: z.string().min(1, "Lot numarası gereklidir"),
  stockQuantity: z.number().min(0, "Stok miktarı negatif olamaz"),
  unitOfMeasure: z.string().min(1, "Ölçü birimi gereklidir"),
  location: z.string().min(1, "Depo konumu gereklidir"), 
  receiptDate: z.string().min(1, "Alım tarihi gereklidir"),
  status: z.enum(["Aktif", "Rezerve", "Düşük Stok", "Tükenmiş"]).default("Aktif"),
  minStockLevel: z.number().min(0, "Minimum stok seviyesi negatif olamaz"),
  notes: z.string().optional(),
  batchResults: z.object({
    tensileStrength: z.number().optional(),
    elongation: z.number().optional(),
    unevenness: z.number().optional(),
    imperfections: z.number().optional(),
    hairiness: z.number().optional(),
  }).optional(),
  unitPrice: z.number().min(0, "Birim fiyat negatif olamaz"),
});

// İplik hareket şeması
const yarnMovementSchema = z.object({
  yarnId: z.string().min(1, "İplik ID gereklidir"),
  movementType: z.enum(["Giriş", "Çıkış", "Transfer", "Düzeltme"]),
  quantity: z.number().min(0.1, "Miktar 0'dan büyük olmalıdır"),
  unitOfMeasure: z.string().min(1, "Ölçü birimi gereklidir"),
  fromLocation: z.string().optional(),
  toLocation: z.string().min(1, "Hedef konum gereklidir"),
  referenceNumber: z.string().optional(),
  orderId: z.number().optional(),
  departmentId: z.number().optional(),
  reason: z.string().min(1, "Hareket nedeni gereklidir"),
  notes: z.string().optional(),
  moveDate: z.string().min(1, "Hareket tarihi gereklidir"),
  movedBy: z.string().min(1, "İşlemi yapan gereklidir"),
});

const YarnInventoryPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [supplierFilter, setSupplierFilter] = useState<string | null>(null);
  const [yarnTypeFilter, setYarnTypeFilter] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [movementType, setMovementType] = useState<"Giriş" | "Çıkış" | "Transfer" | "Düzeltme">("Giriş");

  // Form tanımlama
  const form = useForm<z.infer<typeof yarnInventorySchema>>({
    resolver: zodResolver(yarnInventorySchema),
    defaultValues: {
      yarnId: "",
      yarnType: "",
      count: "",
      composition: "",
      color: "",
      supplier: "",
      lotNumber: "",
      stockQuantity: 0,
      unitOfMeasure: "kg",
      location: "",
      receiptDate: new Date().toISOString().split('T')[0],
      status: "Aktif",
      minStockLevel: 0,
      notes: "",
      batchResults: {
        tensileStrength: undefined,
        elongation: undefined,
        unevenness: undefined,
        imperfections: undefined,
        hairiness: undefined,
      },
      unitPrice: 0,
    },
  });

  // Düzenleme formu
  const editForm = useForm<z.infer<typeof yarnInventorySchema>>({
    resolver: zodResolver(yarnInventorySchema),
    defaultValues: {
      yarnId: "",
      yarnType: "",
      count: "",
      composition: "",
      color: "",
      supplier: "",
      lotNumber: "",
      stockQuantity: 0,
      unitOfMeasure: "kg",
      location: "",
      receiptDate: "",
      status: "Aktif",
      minStockLevel: 0,
      notes: "",
      batchResults: {
        tensileStrength: undefined,
        elongation: undefined,
        unevenness: undefined,
        imperfections: undefined,
        hairiness: undefined,
      },
      unitPrice: 0,
    },
  });

  // Hareket formu
  const movementForm = useForm<z.infer<typeof yarnMovementSchema>>({
    resolver: zodResolver(yarnMovementSchema),
    defaultValues: {
      yarnId: "",
      movementType: "Giriş",
      quantity: 0,
      unitOfMeasure: "kg",
      fromLocation: "",
      toLocation: "",
      referenceNumber: "",
      orderId: undefined,
      departmentId: undefined,
      reason: "",
      notes: "",
      moveDate: new Date().toISOString().split('T')[0],
      movedBy: "",
    },
  });

  // İplik envanteri verisini çek
  const { data: yarnInventory = [], isLoading: isLoadingInventory } = useQuery({
    queryKey: ["/api/yarn-warehouse/inventory"],
  });

  // İplik hareketleri verisini çek
  const { data: yarnMovements = [], isLoading: isLoadingMovements } = useQuery({
    queryKey: ["/api/yarn-warehouse/movements"],
  });

  // İplik tipleri verisini çek
  const { data: yarnTypes = [] } = useQuery({
    queryKey: ["/api/admin/yarn-types"],
  });

  // Tedarikçiler verisini çek
  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/admin/suppliers"],
  });

  // Depo konumları verisini çek
  const { data: locations = [] } = useQuery({
    queryKey: ["/api/yarn-warehouse/locations"],
  });

  // Departmanlar verisini çek
  const { data: departments = [] } = useQuery({
    queryKey: ["/api/admin/departments"],
  });

  // Siparişleri çek
  const { data: orders = [] } = useQuery({
    queryKey: ["/api/sales/orders"],
  });

  // Personeli çek
  const { data: staff = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Yeni iplik envanteri oluştur
  const createInventoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof yarnInventorySchema>) => {
      const res = await apiRequest("POST", "/api/yarn-warehouse/inventory", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "İplik envanteri başarıyla oluşturuldu",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-warehouse/inventory"] });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "İplik envanteri oluşturulurken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // İplik envanteri güncelle
  const updateInventoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/yarn-warehouse/inventory/${selectedInventory.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "İplik envanteri başarıyla güncellendi",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-warehouse/inventory"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "İplik envanteri güncellenirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // İplik envanteri sil
  const deleteInventoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/yarn-warehouse/inventory/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "İplik envanteri başarıyla silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-warehouse/inventory"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "İplik envanteri silinirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // İplik hareketi oluştur
  const createMovementMutation = useMutation({
    mutationFn: async (data: z.infer<typeof yarnMovementSchema>) => {
      const res = await apiRequest("POST", "/api/yarn-warehouse/movements", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "İplik hareketi başarıyla kaydedildi",
      });
      setIsMovementDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-warehouse/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-warehouse/movements"] });
      movementForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "İplik hareketi kaydedilirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Form gönderme
  const onSubmit = (data: z.infer<typeof yarnInventorySchema>) => {
    createInventoryMutation.mutate(data);
  };

  // Form güncelleme
  const onEditSubmit = (data: z.infer<typeof yarnInventorySchema>) => {
    updateInventoryMutation.mutate(data);
  };

  // Hareket formu gönderme
  const onMovementSubmit = (data: z.infer<typeof yarnMovementSchema>) => {
    createMovementMutation.mutate(data);
  };

  // İplik envanterini görüntüleme
  const handleViewInventory = (inventory: any) => {
    setSelectedInventory(inventory);
    setIsViewDialogOpen(true);
  };

  // İplik envanterini düzenleme
  const handleEditInventory = (inventory: any) => {
    setSelectedInventory(inventory);
    editForm.reset({
      yarnId: inventory.yarnId,
      yarnType: inventory.yarnType,
      count: inventory.count,
      composition: inventory.composition,
      color: inventory.color || "",
      supplier: inventory.supplier,
      lotNumber: inventory.lotNumber,
      stockQuantity: inventory.stockQuantity,
      unitOfMeasure: inventory.unitOfMeasure,
      location: inventory.location,
      receiptDate: inventory.receiptDate,
      status: inventory.status,
      minStockLevel: inventory.minStockLevel,
      notes: inventory.notes || "",
      batchResults: inventory.batchResults || {
        tensileStrength: undefined,
        elongation: undefined,
        unevenness: undefined,
        imperfections: undefined,
        hairiness: undefined,
      },
      unitPrice: inventory.unitPrice,
    });
    setIsEditDialogOpen(true);
  };

  // İplik envanterini silme
  const handleDeleteInventory = (inventory: any) => {
    if (window.confirm("Bu iplik envanterini silmek istediğinizden emin misiniz?")) {
      deleteInventoryMutation.mutate(inventory.id);
    }
  };

  // İplik hareketi oluştur
  const handleCreateMovement = (inventory: any, type: "Giriş" | "Çıkış" | "Transfer" | "Düzeltme") => {
    setSelectedInventory(inventory);
    setMovementType(type);
    movementForm.reset({
      yarnId: inventory.yarnId,
      movementType: type,
      quantity: 0,
      unitOfMeasure: inventory.unitOfMeasure,
      fromLocation: type === "Çıkış" || type === "Transfer" ? inventory.location : "",
      toLocation: type === "Giriş" || type === "Transfer" ? "" : inventory.location,
      referenceNumber: "",
      orderId: undefined,
      departmentId: undefined,
      reason: "",
      notes: "",
      moveDate: new Date().toISOString().split('T')[0],
      movedBy: "",
    });
    setIsMovementDialogOpen(true);
  };

  // Filtreleme
  const getFilteredInventory = () => {
    let filtered = yarnInventory;
    
    // Arama terimine göre filtrele
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((item: any) => 
        item.yarnId?.toLowerCase().includes(searchLower) ||
        item.yarnType?.toLowerCase().includes(searchLower) ||
        item.count?.toLowerCase().includes(searchLower) ||
        item.composition?.toLowerCase().includes(searchLower) ||
        item.lotNumber?.toLowerCase().includes(searchLower) ||
        item.color?.toLowerCase().includes(searchLower)
      );
    }
    
    // Duruma göre filtrele
    if (statusFilter) {
      filtered = filtered.filter((item: any) => item.status === statusFilter);
    }
    
    // Tedarikçiye göre filtrele
    if (supplierFilter) {
      filtered = filtered.filter((item: any) => item.supplier === supplierFilter);
    }

    // İplik tipine göre filtrele
    if (yarnTypeFilter) {
      filtered = filtered.filter((item: any) => item.yarnType === yarnTypeFilter);
    }
    
    return filtered;
  };

  // Durum rozeti renkleri
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Aktif":
        return "success";
      case "Rezerve":
        return "warning";
      case "Düşük Stok":
        return "warning";
      case "Tükenmiş":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Durum ikonu
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Aktif":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "Rezerve":
        return <Tag className="h-4 w-4 text-yellow-500" />;
      case "Düşük Stok":
        return <Scale className="h-4 w-4 text-yellow-500" />;
      case "Tükenmiş":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Hareket tipi ikonu
  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case "Giriş":
        return <PlusCircle className="h-4 w-4 text-green-500" />;
      case "Çıkış":
        return <MinusCircle className="h-4 w-4 text-red-500" />;
      case "Transfer":
        return <MoveRight className="h-4 w-4 text-blue-500" />;
      case "Düzeltme":
        return <Edit className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  // Hareket tipi rozeti renkleri
  const getMovementTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "Giriş":
        return "success";
      case "Çıkış":
        return "destructive";
      case "Transfer":
        return "default";
      case "Düzeltme":
        return "warning";
      default:
        return "secondary";
    }
  };

  // Yükleme durumu
  if (isLoadingInventory) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filtrelenmiş iplik envanteri
  const filteredInventory = getFilteredInventory();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="İplik Depo Envanteri" 
        description="İplik stoklarını ve hareketlerini yönetin"
      />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={statusFilter === null ? "default" : "outline"} 
            onClick={() => setStatusFilter(null)}
          >
            Tümü
          </Button>
          <Button 
            variant={statusFilter === "Aktif" ? "default" : "outline"}
            onClick={() => setStatusFilter("Aktif")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle2 className="mr-1 h-4 w-4" /> Aktif
          </Button>
          <Button 
            variant={statusFilter === "Rezerve" ? "default" : "outline"}
            onClick={() => setStatusFilter("Rezerve")}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <Tag className="mr-1 h-4 w-4" /> Rezerve
          </Button>
          <Button 
            variant={statusFilter === "Düşük Stok" ? "default" : "outline"}
            onClick={() => setStatusFilter("Düşük Stok")}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <Scale className="mr-1 h-4 w-4" /> Düşük Stok
          </Button>
          <Button 
            variant={statusFilter === "Tükenmiş" ? "default" : "outline"}
            onClick={() => setStatusFilter("Tükenmiş")}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <XCircle className="mr-1 h-4 w-4" /> Tükenmiş
          </Button>
        </div>
          
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="İplik ID, Tür, Numara..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtreler
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>İplik Tipi</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setYarnTypeFilter(null)}>
                Tümü
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {yarnTypes.map((type: any) => (
                <DropdownMenuItem 
                  key={type.id} 
                  onClick={() => setYarnTypeFilter(type.name)}
                >
                  {type.name}
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Tedarikçi</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSupplierFilter(null)}>
                Tümü
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {suppliers.map((supplier: any) => (
                <DropdownMenuItem 
                  key={supplier.id} 
                  onClick={() => setSupplierFilter(supplier.name)}
                >
                  {supplier.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Yeni İplik Ekle
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>İplik Envanteri</CardTitle>
          <CardDescription>
            Toplam {filteredInventory.length} iplik kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInventory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter || supplierFilter || yarnTypeFilter ? 
                "Arama kriterlerine uygun iplik kaydı bulunamadı." : 
                "Henüz iplik kaydı bulunmamaktadır. Yeni bir iplik eklemek için 'Yeni İplik Ekle' butonunu kullanın."
              }
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">İplik ID</TableHead>
                  <TableHead>İplik Türü</TableHead>
                  <TableHead>Numara/Kompozisyon</TableHead>
                  <TableHead>Lot No</TableHead>
                  <TableHead>Stok Miktarı</TableHead>
                  <TableHead>Konum</TableHead>
                  <TableHead>Tedarikçi</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((inventory: any) => (
                  <TableRow key={inventory.id}>
                    <TableCell className="font-medium">{inventory.yarnId}</TableCell>
                    <TableCell>{inventory.yarnType}</TableCell>
                    <TableCell>{inventory.count}<br /><span className="text-xs text-muted-foreground">{inventory.composition}</span></TableCell>
                    <TableCell>{inventory.lotNumber}</TableCell>
                    <TableCell>{inventory.stockQuantity} {inventory.unitOfMeasure}</TableCell>
                    <TableCell>{inventory.location}</TableCell>
                    <TableCell>{inventory.supplier}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getStatusIcon(inventory.status)}
                        <Badge 
                          variant={getStatusBadgeVariant(inventory.status)} 
                          className="ml-1"
                        >
                          {inventory.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Menüyü aç</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewInventory(inventory)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Görüntüle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditInventory(inventory)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleCreateMovement(inventory, "Giriş")}>
                            <PlusCircle className="h-4 w-4 mr-2 text-green-500" />
                            Stok Girişi
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCreateMovement(inventory, "Çıkış")}>
                            <MinusCircle className="h-4 w-4 mr-2 text-red-500" />
                            Stok Çıkışı
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCreateMovement(inventory, "Transfer")}>
                            <MoveRight className="h-4 w-4 mr-2 text-blue-500" />
                            Transfer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteInventory(inventory)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Son Hareketler Kartı */}
      <Card>
        <CardHeader>
          <CardTitle>Son İplik Hareketleri</CardTitle>
          <CardDescription>
            Envanter giriş-çıkış ve transfer kayıtları
          </CardDescription>
        </CardHeader>
        <CardContent>
          {yarnMovements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz iplik hareket kaydı bulunmamaktadır.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>İplik ID</TableHead>
                  <TableHead>Hareket Tipi</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Konum Bilgisi</TableHead>
                  <TableHead>Referans</TableHead>
                  <TableHead>İşlemi Yapan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yarnMovements.slice(0, 5).map((movement: any) => (
                  <TableRow key={movement.id}>
                    <TableCell>{movement.moveDate}</TableCell>
                    <TableCell>{movement.yarnId}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getMovementTypeIcon(movement.movementType)}
                        <Badge 
                          variant={getMovementTypeBadgeVariant(movement.movementType)} 
                          className="ml-1"
                        >
                          {movement.movementType}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{movement.quantity} {movement.unitOfMeasure}</TableCell>
                    <TableCell>
                      {movement.movementType === "Transfer" ? (
                        <span>{movement.fromLocation} → {movement.toLocation}</span>
                      ) : movement.movementType === "Giriş" ? (
                        <span>→ {movement.toLocation}</span>
                      ) : (
                        <span>{movement.fromLocation} →</span>
                      )}
                    </TableCell>
                    <TableCell>{movement.referenceNumber || "-"}</TableCell>
                    <TableCell>{movement.movedBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Yeni İplik Envanteri Modalı */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni İplik Kaydı</DialogTitle>
            <DialogDescription>
              Envantere yeni bir iplik kaydı ekleyin.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Temel Bilgiler</TabsTrigger>
              <TabsTrigger value="details">Detaylar</TabsTrigger>
              <TabsTrigger value="test">Test Sonuçları</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="yarnId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>İplik ID*</FormLabel>
                          <FormControl>
                            <Input placeholder="ör: YRN-2025-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="yarnType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>İplik Türü*</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="İplik türü seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {yarnTypes.map((type: any) => (
                                <SelectItem key={type.id} value={type.name}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numara*</FormLabel>
                          <FormControl>
                            <Input placeholder="ör: Ne 30/1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="composition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kompozisyon*</FormLabel>
                          <FormControl>
                            <Input placeholder="ör: %100 Pamuk" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Renk</FormLabel>
                          <FormControl>
                            <Input placeholder="ör: Beyaz" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lotNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lot Numarası*</FormLabel>
                          <FormControl>
                            <Input placeholder="ör: L-12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="supplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tedarikçi*</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Tedarikçi seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {suppliers.map((supplier: any) => (
                                <SelectItem key={supplier.id} value={supplier.name}>
                                  {supplier.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="stockQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stok Miktarı*</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="unitOfMeasure"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ölçü Birimi*</FormLabel>
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
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="tops">tops</SelectItem>
                              <SelectItem value="cone">koni</SelectItem>
                              <SelectItem value="bobin">bobin</SelectItem>
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
                          <FormLabel>Minimum Stok Seviyesi*</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Depo Konumu*</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Konum seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {locations.map((location: any) => (
                                <SelectItem key={location.id} value={location.name}>
                                  {location.name}
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
                      name="receiptDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alım Tarihi*</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durum*</FormLabel>
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
                            <SelectItem value="Aktif">Aktif</SelectItem>
                            <SelectItem value="Rezerve">Rezerve</SelectItem>
                            <SelectItem value="Düşük Stok">Düşük Stok</SelectItem>
                            <SelectItem value="Tükenmiş">Tükenmiş</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birim Fiyat*</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                            placeholder="Ekstra bilgiler..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="test" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="batchResults.tensileStrength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kopma Mukavemeti (cN/tex)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="ör: 18.5"
                              {...field}
                              value={field.value === undefined ? "" : field.value}
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="batchResults.elongation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kopma Uzaması (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="ör: 6.8"
                              {...field}
                              value={field.value === undefined ? "" : field.value}
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="batchResults.unevenness"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Düzgünsüzlük (U%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="ör: 9.2"
                              {...field}
                              value={field.value === undefined ? "" : field.value}
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="batchResults.imperfections"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hatalar (IPK/1000m)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="ör: 95"
                              {...field}
                              value={field.value === undefined ? "" : field.value}
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="batchResults.hairiness"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tüylülük (H)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="ör: 5.6"
                              {...field}
                              value={field.value === undefined ? "" : field.value}
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
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
                    disabled={createInventoryMutation.isPending}
                  >
                    {createInventoryMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Kaydet
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* İplik Hareketi Oluşturma Modalı */}
      <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {movementType === "Giriş" && "İplik Stok Girişi"}
              {movementType === "Çıkış" && "İplik Stok Çıkışı"}
              {movementType === "Transfer" && "İplik Transfer"}
              {movementType === "Düzeltme" && "Stok Düzeltme"}
            </DialogTitle>
            <DialogDescription>
              {selectedInventory?.yarnId} - {selectedInventory?.yarnType} ({selectedInventory?.count})
            </DialogDescription>
          </DialogHeader>
          
          <Form {...movementForm}>
            <form onSubmit={movementForm.handleSubmit(onMovementSubmit)} className="space-y-4">
              <FormField
                control={movementForm.control}
                name="movementType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hareket Tipi*</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Hareket tipi seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Giriş">Stok Girişi</SelectItem>
                        <SelectItem value="Çıkış">Stok Çıkışı</SelectItem>
                        <SelectItem value="Transfer">Transfer</SelectItem>
                        <SelectItem value="Düzeltme">Stok Düzeltme</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={movementForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Miktar*</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={movementForm.control}
                  name="unitOfMeasure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ölçü Birimi*</FormLabel>
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
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="tops">tops</SelectItem>
                          <SelectItem value="cone">koni</SelectItem>
                          <SelectItem value="bobin">bobin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {(movementForm.watch("movementType") === "Çıkış" || movementForm.watch("movementType") === "Transfer") && (
                <FormField
                  control={movementForm.control}
                  name="fromLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Çıkış Konumu*</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Konum seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((location: any) => (
                            <SelectItem key={location.id} value={location.name}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {(movementForm.watch("movementType") === "Giriş" || movementForm.watch("movementType") === "Transfer") && (
                <FormField
                  control={movementForm.control}
                  name="toLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hedef Konum*</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Konum seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((location: any) => (
                            <SelectItem key={location.id} value={location.name}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={movementForm.control}
                  name="referenceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referans Numarası</FormLabel>
                      <FormControl>
                        <Input placeholder="ör: REF-12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={movementForm.control}
                  name="moveDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hareket Tarihi*</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {movementForm.watch("movementType") === "Çıkış" && (
                <>
                  <FormField
                    control={movementForm.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departman</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Departman seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Seçilmedi</SelectItem>
                            {departments.map((dept: any) => (
                              <SelectItem key={dept.id} value={dept.id.toString()}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={movementForm.control}
                    name="orderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sipariş</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sipariş seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Seçilmedi</SelectItem>
                            {orders.map((order: any) => (
                              <SelectItem key={order.id} value={order.id.toString()}>
                                {order.orderNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              <FormField
                control={movementForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hareket Nedeni*</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Neden seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {movementForm.watch("movementType") === "Giriş" && (
                          <>
                            <SelectItem value="Satın Alma">Satın Alma</SelectItem>
                            <SelectItem value="İade">İade</SelectItem>
                            <SelectItem value="Üretim">Üretim</SelectItem>
                          </>
                        )}
                        {movementForm.watch("movementType") === "Çıkış" && (
                          <>
                            <SelectItem value="Üretim">Üretime Gönderim</SelectItem>
                            <SelectItem value="Iade">Tedarikçiye İade</SelectItem>
                            <SelectItem value="Fire">Fire/Kayıp</SelectItem>
                          </>
                        )}
                        {movementForm.watch("movementType") === "Transfer" && (
                          <>
                            <SelectItem value="Depo Düzenleme">Depo Düzenleme</SelectItem>
                            <SelectItem value="Optimizasyon">Optimizasyon</SelectItem>
                          </>
                        )}
                        {movementForm.watch("movementType") === "Düzeltme" && (
                          <>
                            <SelectItem value="Sayım Hatası">Sayım Hatası</SelectItem>
                            <SelectItem value="Kayıt Hatası">Kayıt Hatası</SelectItem>
                          </>
                        )}
                        <SelectItem value="Diğer">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={movementForm.control}
                name="movedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İşlemi Yapan*</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Personel seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {staff.map((person: any) => (
                          <SelectItem key={person.id} value={person.fullName || person.username}>
                            {person.fullName || person.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={movementForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ek açıklamalar..."
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
                  onClick={() => setIsMovementDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button 
                  type="submit"
                  disabled={createMovementMutation.isPending}
                >
                  {createMovementMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Kaydet
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const YarnInventory = YarnInventoryPage;
export default YarnInventory;