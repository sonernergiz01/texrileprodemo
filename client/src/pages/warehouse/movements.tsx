import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Search, Filter, Plus, RefreshCw, FileText } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function WarehouseMovementsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newMovementDialog, setNewMovementDialog] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [filterType, setFilterType] = useState("all");

  // Stok hareketlerini çek
  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/warehouse/transactions', tab, startDate, endDate, filterType],
    queryFn: async () => {
      let url = "/api/warehouse/transactions";
      const params = new URLSearchParams();
      
      if (tab !== "all") {
        params.append("itemType", tab);
      }
      
      if (filterType !== "all") {
        params.append("type", filterType);
      }
      
      if (startDate) {
        params.append("startDate", startDate.toISOString());
      }
      
      if (endDate) {
        params.append("endDate", endDate.toISOString());
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const res = await apiRequest("GET", url);
      return await res.json();
    }
  });

  // Envanter öğelerini çek
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['/api/warehouse/inventory'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/warehouse/inventory");
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

  // Yeni stok hareketi form state'i
  const [newMovementForm, setNewMovementForm] = useState({
    transactionType: "in", // in, out, transfer, adjustment
    inventoryItemId: "",
    quantity: "",
    targetLocationId: "",
    sourceLocationId: "",
    notes: "",
    referenceCode: "",
    status: "pending"
  });

  // Stok hareketi ekle
  const addMovementMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/warehouse/transactions", data);
      return await res.json();
    },
    onSuccess: () => {
      // Başarılı olduğunda listeyi güncelle
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/inventory'] });
      setNewMovementDialog(false);
      
      // Formu sıfırla
      setNewMovementForm({
        transactionType: "in",
        inventoryItemId: "",
        quantity: "",
        targetLocationId: "",
        sourceLocationId: "",
        notes: "",
        referenceCode: "",
        status: "pending"
      });
      
      toast({
        title: "Stok hareketi eklendi",
        description: "Stok hareketi başarıyla kaydedildi.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Stok hareketi eklenirken hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Durumu güncelleme
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number, status: string, notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/warehouse/transactions/${id}/status`, { status, notes });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/transactions'] });
      toast({
        title: "Durum güncellendi",
        description: "Stok hareketi durumu başarıyla güncellendi.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Durum güncellenirken hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Filtrelenmiş stok hareketleri
  const filteredTransactions = transactions.filter((transaction: any) => {
    // Arama filtreleme
    const searchMatches = 
      transaction.itemCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.referenceCode?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return searchMatches;
  });

  // Yeni stok hareketi ekleme
  const handleAddMovement = () => {
    addMovementMutation.mutate(newMovementForm);
  };

  // Durumu onaylama veya reddetme
  const handleUpdateStatus = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  // Form güncellemesi
  const handleFormChange = (field: string, value: string) => {
    setNewMovementForm(prev => ({ ...prev, [field]: value }));
  };

  // Tarih formatı
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMMM yyyy HH:mm", { locale: tr });
  };

  // Hareket tipine göre renk
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "in": return "bg-green-100 text-green-800";
      case "out": return "bg-orange-100 text-orange-800";
      case "transfer": return "bg-blue-100 text-blue-800";
      case "adjustment": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Durum badge'ı
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": 
        return <Badge variant="secondary">Beklemede</Badge>;
      case "approved": 
        return <Badge>Onaylandı</Badge>;
      case "rejected": 
        return <Badge variant="destructive">Reddedildi</Badge>;
      case "completed": 
        return <Badge variant="outline">Tamamlandı</Badge>;
      default: 
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Hareket tipi Türkçe karşılığı
  const getTransactionTypeName = (type: string) => {
    switch (type) {
      case "in": return "Giriş";
      case "out": return "Çıkış";
      case "transfer": return "Transfer";
      case "adjustment": return "Düzeltme";
      default: return type;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stok Hareketleri</h1>
          <p className="text-muted-foreground">
            Depo giriş, çıkış ve transfer işlemlerini görüntüleyin ve yönetin.
          </p>
        </div>
        <Button onClick={() => setNewMovementDialog(true)} className="flex items-center gap-2">
          <Plus size={16} />
          <span>Yeni Hareket Ekle</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Hareket Listesi</CardTitle>
            <div className="flex gap-2">
              <div className="flex gap-2 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[190px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd.MM.yyyy") : (
                        <span>Başlangıç Tarihi</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <span>-</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[190px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd.MM.yyyy") : (
                        <span>Bitiş Tarihi</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Select
                value={filterType}
                onValueChange={value => setFilterType(value)}
              >
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="İşlem Tipi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="in">Giriş</SelectItem>
                  <SelectItem value="out">Çıkış</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="adjustment">Düzeltme</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Ara..."
                  className="pl-8 w-64"
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
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Tüm Ürünler</TabsTrigger>
              <TabsTrigger value="fabric">Kumaş</TabsTrigger>
              <TabsTrigger value="yarn">İplik</TabsTrigger>
              <TabsTrigger value="rawMaterial">Hammadde</TabsTrigger>
            </TabsList>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İşlem No</TableHead>
                  <TableHead>Referans</TableHead>
                  <TableHead>İşlem Tipi</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">Yükleniyor...</TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">Hareket kaydı bulunamadı</TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell>#{transaction.id}</TableCell>
                      <TableCell>{transaction.referenceCode || "-"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTransactionTypeColor(transaction.transactionType)}`}>
                          {getTransactionTypeName(transaction.transactionType)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{transaction.itemName}</div>
                        <div className="text-muted-foreground text-xs">{transaction.itemCode}</div>
                      </TableCell>
                      <TableCell>{transaction.quantity} {transaction.unit}</TableCell>
                      <TableCell>{formatDate(transaction.transactionDate)}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        {transaction.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleUpdateStatus(transaction.id, 'approved')}
                            >
                              Onayla
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs text-red-600"
                              onClick={() => handleUpdateStatus(transaction.id, 'rejected')}
                            >
                              Reddet
                            </Button>
                          </div>
                        )}
                        {transaction.status !== 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Detay
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Tabs>
        </CardContent>
      </Card>

      {/* Yeni Stok Hareketi Dialog */}
      <Dialog open={newMovementDialog} onOpenChange={setNewMovementDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yeni Stok Hareketi</DialogTitle>
            <DialogDescription>
              Depoya giriş, depodan çıkış veya depolar arası transfer işlemi ekleyin.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <Label htmlFor="transactionType">İşlem Tipi</Label>
                <Select 
                  value={newMovementForm.transactionType} 
                  onValueChange={(value) => handleFormChange('transactionType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="İşlem tipi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Giriş</SelectItem>
                    <SelectItem value="out">Çıkış</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="adjustment">Düzeltme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="inventoryItemId">Ürün</Label>
                <Select 
                  value={newMovementForm.inventoryItemId} 
                  onValueChange={(value) => handleFormChange('inventoryItemId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ürün seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryItems.map((item: any) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.itemCode} - {item.name} ({item.quantity} {item.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="quantity">Miktar</Label>
                <Input 
                  id="quantity" 
                  type="number"
                  value={newMovementForm.quantity}
                  onChange={(e) => handleFormChange('quantity', e.target.value)}
                  placeholder="Miktar" 
                />
              </div>
              
              <div>
                <Label htmlFor="referenceCode">Referans Kodu</Label>
                <Input 
                  id="referenceCode" 
                  value={newMovementForm.referenceCode}
                  onChange={(e) => handleFormChange('referenceCode', e.target.value)}
                  placeholder="Sipariş/İş Emri No" 
                />
              </div>
              
              {newMovementForm.transactionType === 'transfer' ? (
                <>
                  <div>
                    <Label htmlFor="sourceLocationId">Kaynak Lokasyon</Label>
                    <Select 
                      value={newMovementForm.sourceLocationId} 
                      onValueChange={(value) => handleFormChange('sourceLocationId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kaynak seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location: any) => (
                          <SelectItem key={location.id} value={location.id.toString()}>
                            {location.code} - {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="targetLocationId">Hedef Lokasyon</Label>
                    <Select 
                      value={newMovementForm.targetLocationId} 
                      onValueChange={(value) => handleFormChange('targetLocationId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Hedef seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location: any) => (
                          <SelectItem key={location.id} value={location.id.toString()}>
                            {location.code} - {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="col-span-2">
                  <Label htmlFor="locationId">
                    {newMovementForm.transactionType === 'in' ? 'Hedef Lokasyon' : 'Kaynak Lokasyon'}
                  </Label>
                  <Select 
                    value={newMovementForm.transactionType === 'in' ? 
                      newMovementForm.targetLocationId : newMovementForm.sourceLocationId} 
                    onValueChange={(value) => 
                      newMovementForm.transactionType === 'in' ? 
                        handleFormChange('targetLocationId', value) : 
                        handleFormChange('sourceLocationId', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Lokasyon seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location: any) => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.code} - {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="col-span-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea 
                  id="notes" 
                  value={newMovementForm.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder="İşlem ile ilgili notlar" 
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewMovementDialog(false)}>
              İptal
            </Button>
            <Button 
              type="submit" 
              onClick={handleAddMovement}
              disabled={addMovementMutation.isPending}
            >
              {addMovementMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}