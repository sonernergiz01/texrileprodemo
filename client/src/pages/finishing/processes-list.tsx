import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, Filter, CheckCircle, ArrowUpDown, ChevronDown, ChevronUp, Eye, Edit, Trash2 } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function ProcessesListPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Filtreler için state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [processTypeFilter, setProcessTypeFilter] = useState<string>("");
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Process silme için dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  
  // İşlem tiplerini getir
  const processTypes = [
    { id: "boyama", name: "Boyama" },
    { id: "apre", name: "Apre İşlemi" },
    { id: "yikama", name: "Yıkama" },
    { id: "kurutma", name: "Kurutma" },
    { id: "sanfor", name: "Sanfor" },
    { id: "fikse", name: "Fikse" },
    { id: "kalender", name: "Kalender" }
  ];
  
  // Terbiye/Apre işlemlerini getir
  const { data: processes, isLoading: isLoadingProcesses, error } = useQuery({
    queryKey: ["/api/finishing/processes", statusFilter, processTypeFilter],
    queryFn: async () => {
      const url = new URL("/api/finishing/processes", window.location.origin);
      
      if (statusFilter) url.searchParams.append("status", statusFilter);
      if (processTypeFilter) url.searchParams.append("processType", processTypeFilter);
      
      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error("İşlemler yüklenirken hata oluştu");
      }
      return res.json();
    }
  });
  
  // İşlem silme mutasyonu
  const deleteProcessMutation = useMutation({
    mutationFn: async (processId: number) => {
      const res = await apiRequest("DELETE", `/api/finishing/processes/${processId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "İşlem silindi",
        description: "Terbiye/apre işlemi başarıyla silindi.",
        variant: "default",
      });
      
      // İşlemleri yeniden getir
      queryClient.invalidateQueries({ queryKey: ["/api/finishing/processes"] });
      
      // Dialog'u kapat
      setDeleteDialogOpen(false);
      setSelectedProcessId(null);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "İşlem silinirken bir hata oluştu: " + (error instanceof Error ? error.message : "Bilinmeyen hata"),
        variant: "destructive",
      });
    }
  });
  
  // İşlem durumunu güncelleme mutasyonu
  const updateStatusMutation = useMutation({
    mutationFn: async ({ processId, status }: { processId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/finishing/processes/${processId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Durum güncellendi",
        description: "İşlem durumu başarıyla güncellendi.",
        variant: "default",
      });
      
      // İşlemleri yeniden getir
      queryClient.invalidateQueries({ queryKey: ["/api/finishing/processes"] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Durum güncellenirken bir hata oluştu: " + (error instanceof Error ? error.message : "Bilinmeyen hata"),
        variant: "destructive",
      });
    }
  });
  
  // Sıralama işlevi
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  // Silme dialog'unu aç
  const openDeleteDialog = (processId: number) => {
    setSelectedProcessId(processId);
    setDeleteDialogOpen(true);
  };
  
  // İşlem silme işlevi
  const handleDeleteProcess = () => {
    if (selectedProcessId) {
      deleteProcessMutation.mutate(selectedProcessId);
    }
  };
  
  // İşlem durumu güncelleme işlevi
  const handleUpdateStatus = (processId: number, status: string) => {
    updateStatusMutation.mutate({ processId, status });
  };
  
  // İşlemleri filtrele ve sırala
  const filteredProcesses = processes 
    ? processes
        .filter(process => 
          (searchTerm === "" || 
            process.processCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            process.fabricType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (process.notes && process.notes.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        )
        .sort((a, b) => {
          let comparison = 0;
          
          if (sortField === "createdAt") {
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          } else if (sortField === "plannedStartDate") {
            if (a.plannedStartDate && b.plannedStartDate) {
              comparison = new Date(a.plannedStartDate).getTime() - new Date(b.plannedStartDate).getTime();
            }
          } else if (sortField === "processCode") {
            comparison = a.processCode.localeCompare(b.processCode);
          } else if (sortField === "quantity") {
            comparison = a.quantity - b.quantity;
          }
          
          return sortDirection === "asc" ? comparison : -comparison;
        })
    : [];
  
  // Durum badge'i render işlevi
  const renderStatusBadge = (status: string) => {
    let badgeClass = "";
    let displayStatus = status;
    
    switch (status.toLowerCase()) {
      case "planned":
      case "planlandı":
        badgeClass = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
        displayStatus = "Planlandı";
        break;
      case "in_progress":
      case "devam ediyor":
        badgeClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
        displayStatus = "Devam Ediyor";
        break;
      case "completed":
      case "tamamlandı":
        badgeClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
        displayStatus = "Tamamlandı";
        break;
      case "cancelled":
      case "iptal edildi":
        badgeClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
        displayStatus = "İptal Edildi";
        break;
      default:
        badgeClass = "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
    
    return <span className={`px-2 py-1 text-xs rounded-full ${badgeClass}`}>{displayStatus}</span>;
  };
  
  // İşlem tipi görüntüleme işlevi
  const getProcessTypeName = (processTypeId: string) => {
    const processType = processTypes.find(pt => pt.id === processTypeId);
    return processType ? processType.name : processTypeId;
  };
  
  // Durum menüsü işlemi
  const StatusMenu = ({ process }: { process: any }) => {
    const statuses = [
      { value: "planned", label: "Planlandı" },
      { value: "in_progress", label: "Devam Ediyor" },
      { value: "completed", label: "Tamamlandı" },
      { value: "cancelled", label: "İptal Edildi" }
    ];
    
    return (
      <Select
        defaultValue={process.status}
        onValueChange={(value) => handleUpdateStatus(process.id, value)}
        disabled={updateStatusMutation.isPending}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Durum seçin">
            {renderStatusBadge(process.status)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {statuses.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              <div className="flex items-center">
                {renderStatusBadge(status.value)}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };
  
  // Hata durumunu kontrol et
  if (error) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-red-500">Hata</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Terbiye/apre işlemleri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.</p>
              <Button variant="secondary" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/finishing/processes"] })}>
                Yeniden Dene
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <Card className="w-full">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Terbiye/Apre İşlemleri</CardTitle>
                <CardDescription>
                  Tüm terbiye ve apre işlemlerini görüntüleyin ve yönetin
                </CardDescription>
              </div>
              <Button onClick={() => navigate("/finishing/new-process")}>
                <Plus className="mr-2 h-4 w-4" /> Yeni İşlem
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Filtreleme alanı */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="İşlem kodu, kumaş tipi veya notlarda ara..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-1 gap-4">
                <div className="w-1/2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Durum filtresi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tüm Durumlar</SelectItem>
                      <SelectItem value="planned">Planlandı</SelectItem>
                      <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                      <SelectItem value="completed">Tamamlandı</SelectItem>
                      <SelectItem value="cancelled">İptal Edildi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-1/2">
                  <Select value={processTypeFilter} onValueChange={setProcessTypeFilter}>
                    <SelectTrigger>
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="İşlem tipi filtresi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tüm İşlem Tipleri</SelectItem>
                      {processTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* İşlemler tablosu */}
            {isLoadingProcesses ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3">İşlemler yükleniyor...</span>
              </div>
            ) : (
              <>
                {filteredProcesses.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">
                    <div className="text-xl mb-2">Hiç terbiye/apre işlemi bulunamadı</div>
                    <p>Yeni bir işlem ekleyin veya filtreleri değiştirin</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[150px] cursor-pointer" onClick={() => handleSort("processCode")}>
                            <div className="flex items-center">
                              İşlem Kodu
                              {sortField === "processCode" && (
                                sortDirection === "asc" ? (
                                  <ChevronUp className="ml-1 h-4 w-4" />
                                ) : (
                                  <ChevronDown className="ml-1 h-4 w-4" />
                                )
                              )}
                            </div>
                          </TableHead>
                          <TableHead className="w-[150px]">İşlem Tipi</TableHead>
                          <TableHead>Kumaş Tipi</TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort("quantity")}>
                            <div className="flex items-center">
                              Miktar
                              {sortField === "quantity" && (
                                sortDirection === "asc" ? (
                                  <ChevronUp className="ml-1 h-4 w-4" />
                                ) : (
                                  <ChevronDown className="ml-1 h-4 w-4" />
                                )
                              )}
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort("plannedStartDate")}>
                            <div className="flex items-center">
                              Planlanan Başlangıç
                              {sortField === "plannedStartDate" && (
                                sortDirection === "asc" ? (
                                  <ChevronUp className="ml-1 h-4 w-4" />
                                ) : (
                                  <ChevronDown className="ml-1 h-4 w-4" />
                                )
                              )}
                            </div>
                          </TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProcesses.map((process) => (
                          <TableRow key={process.id}>
                            <TableCell className="font-medium">{process.processCode}</TableCell>
                            <TableCell>{getProcessTypeName(process.processType)}</TableCell>
                            <TableCell>{process.fabricType}</TableCell>
                            <TableCell>{formatNumber(process.quantity)} {process.unit}</TableCell>
                            <TableCell>
                              {process.plannedStartDate ? formatDate(process.plannedStartDate) : "-"}
                            </TableCell>
                            <TableCell>
                              <StatusMenu process={process} />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => navigate(`/finishing/processes/${process.id}`)}
                                  title="Görüntüle"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => navigate(`/finishing/processes/${process.id}/edit`)}
                                  title="Düzenle"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => openDeleteDialog(process.id)}
                                  title="Sil"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </CardContent>
          
          <CardFooter>
            <div className="text-sm text-muted-foreground">
              Toplam: {filteredProcesses.length} işlem
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Silme onay dialog'u */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İşlemi Sil</DialogTitle>
            <DialogDescription>
              Bu terbiye/apre işlemini silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz ve tüm ilişkili veriler silinecektir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProcess}
              disabled={deleteProcessMutation.isPending}
            >
              {deleteProcessMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}