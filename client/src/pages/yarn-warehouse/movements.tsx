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
  AlertTriangle,
  BarChart,
  MoveRight,
  PlusCircle,
  MinusCircle,
  CalendarRange,
  Calendar,
  PackageCheck,
  FileDown,
  FileUp,
  RefreshCw
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
import { format } from "date-fns";

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

const YarnMovementsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<any>(null);
  const [yarnFilter, setYarnFilter] = useState<string | null>(null);

  // Form tanımlama
  const form = useForm<z.infer<typeof yarnMovementSchema>>({
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

  // Düzenleme formu
  const editForm = useForm<z.infer<typeof yarnMovementSchema>>({
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
      moveDate: "",
      movedBy: "",
    },
  });

  // İplik hareketleri verisini çek
  const { data: yarnMovements = [], isLoading: isLoadingMovements } = useQuery({
    queryKey: ["/api/yarn-warehouse/movements"],
  });

  // İplik envanteri verisini çek
  const { data: yarnInventory = [] } = useQuery({
    queryKey: ["/api/yarn-warehouse/inventory"],
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
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-warehouse/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-warehouse/inventory"] });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "İplik hareketi kaydedilirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // İplik hareketi güncelle
  const updateMovementMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/yarn-warehouse/movements/${selectedMovement.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "İplik hareketi başarıyla güncellendi",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-warehouse/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-warehouse/inventory"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "İplik hareketi güncellenirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // İplik hareketi sil
  const deleteMovementMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/yarn-warehouse/movements/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "İplik hareketi başarıyla silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-warehouse/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-warehouse/inventory"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "İplik hareketi silinirken bir hata meydana geldi",
        variant: "destructive",
      });
    },
  });

  // Form gönderme
  const onSubmit = (data: z.infer<typeof yarnMovementSchema>) => {
    createMovementMutation.mutate(data);
  };

  // Form güncelleme
  const onEditSubmit = (data: z.infer<typeof yarnMovementSchema>) => {
    updateMovementMutation.mutate(data);
  };

  // İplik hareketini görüntüleme
  const handleViewMovement = (movement: any) => {
    setSelectedMovement(movement);
    setIsViewDialogOpen(true);
  };

  // İplik hareketini düzenleme
  const handleEditMovement = (movement: any) => {
    setSelectedMovement(movement);
    editForm.reset({
      yarnId: movement.yarnId,
      movementType: movement.movementType,
      quantity: movement.quantity,
      unitOfMeasure: movement.unitOfMeasure,
      fromLocation: movement.fromLocation || "",
      toLocation: movement.toLocation || "",
      referenceNumber: movement.referenceNumber || "",
      orderId: movement.orderId,
      departmentId: movement.departmentId,
      reason: movement.reason,
      notes: movement.notes || "",
      moveDate: movement.moveDate,
      movedBy: movement.movedBy,
    });
    setIsEditDialogOpen(true);
  };

  // İplik hareketini silme
  const handleDeleteMovement = (movement: any) => {
    if (window.confirm("Bu iplik hareketini silmek istediğinizden emin misiniz? Bu işlem stok miktarını da etkileyecektir.")) {
      deleteMovementMutation.mutate(movement.id);
    }
  };

  // Filtreleme
  const getFilteredMovements = () => {
    let filtered = yarnMovements;
    
    // Arama terimine göre filtrele
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((movement: any) => 
        movement.yarnId?.toLowerCase().includes(searchLower) ||
        movement.referenceNumber?.toLowerCase().includes(searchLower) ||
        movement.reason?.toLowerCase().includes(searchLower) ||
        movement.movedBy?.toLowerCase().includes(searchLower) ||
        movement.notes?.toLowerCase().includes(searchLower)
      );
    }
    
    // Hareket tipine göre filtrele
    if (typeFilter) {
      filtered = filtered.filter((movement: any) => movement.movementType === typeFilter);
    }
    
    // Tarihe göre filtrele
    if (dateFilter !== "all") {
      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0));
      
      // Son 7 gün
      if (dateFilter === "week") {
        const lastWeek = new Date(startOfToday);
        lastWeek.setDate(lastWeek.getDate() - 7);
        filtered = filtered.filter((movement: any) => {
          const moveDate = new Date(movement.moveDate);
          return moveDate >= lastWeek;
        });
      } 
      // Son 30 gün
      else if (dateFilter === "month") {
        const lastMonth = new Date(startOfToday);
        lastMonth.setDate(lastMonth.getDate() - 30);
        filtered = filtered.filter((movement: any) => {
          const moveDate = new Date(movement.moveDate);
          return moveDate >= lastMonth;
        });
      }
      // Bugün
      else if (dateFilter === "today") {
        filtered = filtered.filter((movement: any) => {
          const moveDate = new Date(movement.moveDate);
          const moveDateStart = new Date(moveDate.setHours(0, 0, 0, 0));
          return moveDateStart.getTime() === startOfToday.getTime();
        });
      }
    }
    
    // Konuma göre filtrele
    if (locationFilter) {
      filtered = filtered.filter((movement: any) => 
        (movement.fromLocation === locationFilter) || 
        (movement.toLocation === locationFilter)
      );
    }
    
    // İpliğe göre filtrele
    if (yarnFilter) {
      filtered = filtered.filter((movement: any) => movement.yarnId === yarnFilter);
    }
    
    return filtered;
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
        return <RefreshCw className="h-4 w-4 text-yellow-500" />;
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

  // Sipariş numarasını getir
  const getOrderNumber = (orderId?: number) => {
    if (!orderId) return null;
    const order = orders.find((o: any) => o.id === orderId);
    return order ? order.orderNumber : null;
  };

  // Departman adını getir
  const getDepartmentName = (departmentId?: number) => {
    if (!departmentId) return null;
    const department = departments.find((d: any) => d.id === departmentId);
    return department ? department.name : null;
  };

  // İplik adını getir
  const getYarnName = (yarnId: string) => {
    const yarn = yarnInventory.find((y: any) => y.yarnId === yarnId);
    return yarn ? `${yarn.yarnType} ${yarn.count}` : yarnId;
  };

  // Hareket raporunu indir
  const handleDownloadReport = (format: string) => {
    toast({
      title: "Rapor indiriliyor",
      description: `İplik hareketleri raporu ${format.toUpperCase()} formatında indiriliyor...`,
    });
    // Gerçek uygulamada burada API'ye istek atılacak
  };

  // Yükleme durumu
  if (isLoadingMovements) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filtrelenmiş iplik hareketleri
  const filteredMovements = getFilteredMovements();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="İplik Hareketleri" 
        description="İplik giriş, çıkış ve transfer işlemlerini takip edin"
      />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={typeFilter === null ? "default" : "outline"} 
            onClick={() => setTypeFilter(null)}
          >
            Tümü
          </Button>
          <Button 
            variant={typeFilter === "Giriş" ? "default" : "outline"}
            onClick={() => setTypeFilter("Giriş")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <PlusCircle className="mr-1 h-4 w-4" /> Giriş
          </Button>
          <Button 
            variant={typeFilter === "Çıkış" ? "default" : "outline"}
            onClick={() => setTypeFilter("Çıkış")}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <MinusCircle className="mr-1 h-4 w-4" /> Çıkış
          </Button>
          <Button 
            variant={typeFilter === "Transfer" ? "default" : "outline"}
            onClick={() => setTypeFilter("Transfer")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <MoveRight className="mr-1 h-4 w-4" /> Transfer
          </Button>
          <Button 
            variant={typeFilter === "Düzeltme" ? "default" : "outline"}
            onClick={() => setTypeFilter("Düzeltme")}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <RefreshCw className="mr-1 h-4 w-4" /> Düzeltme
          </Button>
        </div>
          
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="İplik ID, Referans, Neden..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[120px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Tarihler</SelectItem>
              <SelectItem value="today">Bugün</SelectItem>
              <SelectItem value="week">Son 7 Gün</SelectItem>
              <SelectItem value="month">Son 30 Gün</SelectItem>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtreler
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Konum</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setLocationFilter(null)}>
                Tüm Konumlar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {locations.map((location: any) => (
                <DropdownMenuItem 
                  key={location.id} 
                  onClick={() => setLocationFilter(location.name)}
                >
                  {location.name}
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>İplik</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setYarnFilter(null)}>
                Tüm İplikler
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {yarnInventory.slice(0, 10).map((yarn: any) => (
                <DropdownMenuItem 
                  key={yarn.id} 
                  onClick={() => setYarnFilter(yarn.yarnId)}
                >
                  {yarn.yarnId} - {yarn.yarnType}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Yeni Hareket
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>İplik Hareketleri</CardTitle>
            <CardDescription>
              Toplam {filteredMovements.length} hareket kaydı
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Rapor
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownloadReport("excel")}>
                <FileDown className="h-4 w-4 mr-2" />
                Excel olarak indir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadReport("pdf")}>
                <FileDown className="h-4 w-4 mr-2" />
                PDF olarak indir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          {filteredMovements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || typeFilter || dateFilter !== "all" || locationFilter || yarnFilter ? 
                "Arama kriterlerine uygun hareket kaydı bulunamadı." : 
                "Henüz iplik hareket kaydı bulunmamaktadır. Yeni bir hareket eklemek için 'Yeni Hareket' butonunu kullanın."
              }
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>İplik</TableHead>
                  <TableHead>Hareket Tipi</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Konum Bilgisi</TableHead>
                  <TableHead>Referans/Neden</TableHead>
                  <TableHead>İşlemi Yapan</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement: any) => (
                  <TableRow key={movement.id}>
                    <TableCell>{movement.moveDate}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{movement.yarnId}</span>
                        <span className="text-xs text-muted-foreground">{getYarnName(movement.yarnId)}</span>
                      </div>
                    </TableCell>
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
                    <TableCell className="font-medium">{movement.quantity} {movement.unitOfMeasure}</TableCell>
                    <TableCell>
                      {movement.movementType === "Transfer" ? (
                        <span>{movement.fromLocation} → {movement.toLocation}</span>
                      ) : movement.movementType === "Giriş" ? (
                        <span>→ {movement.toLocation}</span>
                      ) : (
                        <span>{movement.fromLocation} →</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {movement.referenceNumber && (
                          <span className="text-xs font-medium">{movement.referenceNumber}</span>
                        )}
                        <span>{movement.reason}</span>
                        {movement.orderId && (
                          <span className="text-xs text-muted-foreground">Sipariş: {getOrderNumber(movement.orderId)}</span>
                        )}
                        {movement.departmentId && (
                          <span className="text-xs text-muted-foreground">Dept: {getDepartmentName(movement.departmentId)}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{movement.movedBy}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleViewMovement(movement)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Görüntüle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditMovement(movement)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteMovement(movement)}
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
      
      {/* Hareket İstatistikleri Kartı */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Giriş ve Çıkışlar</CardTitle>
            <CardDescription>Son 30 gün içinde</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <PlusCircle className="h-4 w-4 mr-2 text-green-500" />
                  Toplam Giriş
                </span>
                <span className="font-medium">
                  {yarnMovements
                    .filter((m: any) => m.movementType === "Giriş")
                    .reduce((sum: number, m: any) => sum + m.quantity, 0)
                  } kg
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <MinusCircle className="h-4 w-4 mr-2 text-red-500" />
                  Toplam Çıkış
                </span>
                <span className="font-medium">
                  {yarnMovements
                    .filter((m: any) => m.movementType === "Çıkış")
                    .reduce((sum: number, m: any) => sum + m.quantity, 0)
                  } kg
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Net Değişim</span>
                <span className="font-bold">
                  {(
                    yarnMovements
                      .filter((m: any) => m.movementType === "Giriş")
                      .reduce((sum: number, m: any) => sum + m.quantity, 0) -
                    yarnMovements
                      .filter((m: any) => m.movementType === "Çıkış")
                      .reduce((sum: number, m: any) => sum + m.quantity, 0)
                  ).toFixed(2)} kg
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Hareket Dağılımı</CardTitle>
            <CardDescription>Hareket tiplerine göre</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <PlusCircle className="h-4 w-4 mr-2 text-green-500" />
                  Giriş
                </span>
                <span className="font-medium">
                  {yarnMovements.filter((m: any) => m.movementType === "Giriş").length} adet
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <MinusCircle className="h-4 w-4 mr-2 text-red-500" />
                  Çıkış
                </span>
                <span className="font-medium">
                  {yarnMovements.filter((m: any) => m.movementType === "Çıkış").length} adet
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <MoveRight className="h-4 w-4 mr-2 text-blue-500" />
                  Transfer
                </span>
                <span className="font-medium">
                  {yarnMovements.filter((m: any) => m.movementType === "Transfer").length} adet
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2 text-yellow-500" />
                  Düzeltme
                </span>
                <span className="font-medium">
                  {yarnMovements.filter((m: any) => m.movementType === "Düzeltme").length} adet
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Konum Bazlı Hareketler</CardTitle>
            <CardDescription>En aktif lokasyonlar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {locations.slice(0, 4).map((location: any) => {
                const movementCount = yarnMovements.filter((m: any) => 
                  m.fromLocation === location.name || m.toLocation === location.name
                ).length;
                
                return (
                  <div key={location.id} className="flex justify-between items-center">
                    <span>{location.name}</span>
                    <span className="font-medium">{movementCount} hareket</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Yeni İplik Hareketi Modalı */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yeni İplik Hareketi</DialogTitle>
            <DialogDescription>
              Yeni bir iplik stok hareketi oluşturun.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="yarnId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İplik*</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="İplik seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {yarnInventory.map((yarn: any) => (
                          <SelectItem key={yarn.id} value={yarn.yarnId}>
                            {yarn.yarnId} - {yarn.yarnType} {yarn.count}
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
                  control={form.control}
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
              </div>
              
              {(form.watch("movementType") === "Çıkış" || form.watch("movementType") === "Transfer") && (
                <FormField
                  control={form.control}
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
              
              {(form.watch("movementType") === "Giriş" || form.watch("movementType") === "Transfer") && (
                <FormField
                  control={form.control}
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
                  control={form.control}
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
                  control={form.control}
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
              
              {form.watch("movementType") === "Çıkış" && (
                <>
                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departman</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
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
                    control={form.control}
                    name="orderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sipariş</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
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
                control={form.control}
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
                        {form.watch("movementType") === "Giriş" && (
                          <>
                            <SelectItem value="Satın Alma">Satın Alma</SelectItem>
                            <SelectItem value="İade">İade</SelectItem>
                            <SelectItem value="Üretim">Üretim</SelectItem>
                          </>
                        )}
                        {form.watch("movementType") === "Çıkış" && (
                          <>
                            <SelectItem value="Üretim">Üretime Gönderim</SelectItem>
                            <SelectItem value="Iade">Tedarikçiye İade</SelectItem>
                            <SelectItem value="Fire">Fire/Kayıp</SelectItem>
                          </>
                        )}
                        {form.watch("movementType") === "Transfer" && (
                          <>
                            <SelectItem value="Depo Düzenleme">Depo Düzenleme</SelectItem>
                            <SelectItem value="Optimizasyon">Optimizasyon</SelectItem>
                          </>
                        )}
                        {form.watch("movementType") === "Düzeltme" && (
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
                control={form.control}
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
                control={form.control}
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
                  onClick={() => setIsCreateDialogOpen(false)}
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
      
      {/* İplik Hareketi Görüntüleme Modalı */}
      {selectedMovement && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <div className="flex items-center space-x-2">
                <DialogTitle>Hareket Detayı</DialogTitle>
                <Badge variant={getMovementTypeBadgeVariant(selectedMovement.movementType)}>
                  {selectedMovement.movementType}
                </Badge>
              </div>
              <DialogDescription>
                {selectedMovement.moveDate} - {selectedMovement.yarnId}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <p className="text-sm font-medium">İplik:</p>
                <p>{selectedMovement.yarnId}</p>
                <p className="text-sm text-muted-foreground">{getYarnName(selectedMovement.yarnId)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Miktar:</p>
                <p>{selectedMovement.quantity} {selectedMovement.unitOfMeasure}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Hareket Tipi:</p>
                <div className="flex items-center mt-1">
                  {getMovementTypeIcon(selectedMovement.movementType)}
                  <span className="ml-1">{selectedMovement.movementType}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium">Tarih:</p>
                <p>{selectedMovement.moveDate}</p>
              </div>
              
              <div className="col-span-2">
                <p className="text-sm font-medium">Konum:</p>
                <p>
                  {selectedMovement.movementType === "Transfer" ? (
                    <span>{selectedMovement.fromLocation} → {selectedMovement.toLocation}</span>
                  ) : selectedMovement.movementType === "Giriş" ? (
                    <span>→ {selectedMovement.toLocation}</span>
                  ) : (
                    <span>{selectedMovement.fromLocation} →</span>
                  )}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Referans:</p>
                <p>{selectedMovement.referenceNumber || "-"}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">İşlemi Yapan:</p>
                <p>{selectedMovement.movedBy}</p>
              </div>
              
              <div className="col-span-2">
                <p className="text-sm font-medium">Hareket Nedeni:</p>
                <p>{selectedMovement.reason}</p>
              </div>
              
              {selectedMovement.orderId && (
                <div>
                  <p className="text-sm font-medium">Sipariş:</p>
                  <p>{getOrderNumber(selectedMovement.orderId)}</p>
                </div>
              )}
              
              {selectedMovement.departmentId && (
                <div>
                  <p className="text-sm font-medium">Departman:</p>
                  <p>{getDepartmentName(selectedMovement.departmentId)}</p>
                </div>
              )}
              
              {selectedMovement.notes && (
                <div className="col-span-2 mt-2">
                  <p className="text-sm font-medium">Notlar:</p>
                  <p className="text-sm text-muted-foreground">{selectedMovement.notes}</p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsViewDialogOpen(false)}
              >
                Kapat
              </Button>
              <Button
                onClick={() => {
                  setIsViewDialogOpen(false);
                  setTimeout(() => {
                    handleEditMovement(selectedMovement);
                  }, 100);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Düzenle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const YarnMovements = YarnMovementsPage;
export default YarnMovements;