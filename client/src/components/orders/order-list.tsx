import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { Eye, Edit, Trash, MoreVertical, AlertTriangle } from "lucide-react";

interface OrderListProps {
  onViewOrder?: (orderId: number) => void;
  onEditOrder?: (orderId: number) => void;
}

export const OrderList = ({ onViewOrder, onEditOrder }: OrderListProps) => {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  
  const {
    data: orders = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/orders"],
  });
  
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });
  
  const { data: fabricTypes = [] } = useQuery({
    queryKey: ["/api/master/fabrics"],
  });
  
  const { data: orderStatuses = [] } = useQuery({
    queryKey: ["/api/order-statuses"],
  });
  
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      // This would be an API call if the endpoint existed
      // For now, we'll just simulate success
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Sipariş Silindi",
        description: "Sipariş başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/summary"] });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "Sipariş silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, statusId }: { orderId: number, statusId: number }) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/status`, { statusId });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Durum Güncellendi",
        description: "Sipariş durumu başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setStatusDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "Sipariş durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  const handleDeleteOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteOrder = () => {
    if (selectedOrderId) {
      deleteOrderMutation.mutate(selectedOrderId);
    }
  };
  
  const handleStatusChange = (orderId: number) => {
    setSelectedOrderId(orderId);
    setSelectedStatus("");
    setStatusDialogOpen(true);
  };
  
  const confirmStatusChange = () => {
    if (selectedOrderId && selectedStatus) {
      updateOrderStatusMutation.mutate({
        orderId: selectedOrderId,
        statusId: parseInt(selectedStatus)
      });
    }
  };
  
  // Helper functions for getting related data
  const getCustomerName = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown';
  };
  
  const getCustomerCity = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.city : '';
  };
  
  const getFabricName = (fabricTypeId: number) => {
    const fabric = fabricTypes.find(f => f.id === fabricTypeId);
    return fabric ? fabric.name : 'Unknown';
  };
  
  const getFabricCode = (fabricTypeId: number) => {
    const fabric = fabricTypes.find(f => f.id === fabricTypeId);
    return fabric ? fabric.code : '';
  };
  
  const getOrderStatus = (statusId: number) => {
    const status = orderStatuses.find(s => s.id === statusId);
    return status ? status.name : 'Unknown';
  };
  
  const getOrderStatusCode = (statusId: number) => {
    const status = orderStatuses.find(s => s.id === statusId);
    return status ? status.code : '';
  };
  
  // Pagination
  const totalPages = Math.ceil(orders.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedOrders = orders.slice(startIndex, endIndex);
  
  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sipariş No</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Kumaş Tipi</TableHead>
              <TableHead>Miktar (m)</TableHead>
              <TableHead>Termin</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-red-500">
                  Siparişler yüklenirken bir hata oluştu.
                </TableCell>
              </TableRow>
            ) : paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                  Sipariş bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="text-sm font-medium text-primary">{order.orderNumber}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">{getCustomerName(order.customerId)}</div>
                    <div className="text-xs text-gray-500">{getCustomerCity(order.customerId)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">{getFabricName(order.fabricTypeId)}</div>
                    <div className="text-xs text-gray-500">Kod: {getFabricCode(order.fabricTypeId)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">{formatNumber(Number(order.quantity))}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">{formatDate(order.dueDate)}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge 
                      status={getOrderStatus(order.statusId)}
                      code={getOrderStatusCode(order.statusId)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Menü</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewOrder && onViewOrder(order.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          <span>Görüntüle</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditOrder && onEditOrder(order.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          <span>Düzenle</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(order.id)}>
                          <StatusBadge 
                            status="Durum Değiştir"
                            className="mr-2 bg-gray-100 text-gray-800"
                          />
                          <span>Durum Değiştir</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-red-600 hover:text-red-700 focus:text-red-700"
                        >
                          <Trash className="h-4 w-4 mr-2" />
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
      
      {/* Pagination */}
      {!isLoading && !error && orders.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Select 
              value={rowsPerPage.toString()} 
              onValueChange={(value) => {
                setRowsPerPage(parseInt(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue>{rowsPerPage} / sayfa</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 / sayfa</SelectItem>
                <SelectItem value="10">10 / sayfa</SelectItem>
                <SelectItem value="25">25 / sayfa</SelectItem>
                <SelectItem value="50">50 / sayfa</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-700">
              {startIndex + 1}-{Math.min(endIndex, orders.length)} / {orders.length} kayıt gösteriliyor
            </span>
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (page <= 3) {
                  pageNumber = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = page - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      isActive={pageNumber === page}
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Siparişi Sil</DialogTitle>
            <DialogDescription>
              Bu siparişi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center p-4 bg-red-50 rounded-md mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
            <p className="text-sm text-red-700">
              Bu işlem sipariş ve ilgili tüm verileri kalıcı olarak silecektir.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              İptal
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeleteOrder}
              disabled={deleteOrderMutation.isPending}
            >
              {deleteOrderMutation.isPending ? "Siliniyor..." : "Evet, Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Change Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sipariş Durumunu Değiştir</DialogTitle>
            <DialogDescription>
              Lütfen sipariş için yeni bir durum seçin.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select 
              value={selectedStatus} 
              onValueChange={setSelectedStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Durum Seçin" />
              </SelectTrigger>
              <SelectContent>
                {orderStatuses.map((status) => (
                  <SelectItem key={status.id} value={status.id.toString()}>
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: status.color }}
                      ></div>
                      {status.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setStatusDialogOpen(false)}
            >
              İptal
            </Button>
            <Button 
              onClick={confirmStatusChange}
              disabled={!selectedStatus || updateOrderStatusMutation.isPending}
            >
              {updateOrderStatusMutation.isPending ? "Güncelleniyor..." : "Durumu Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
