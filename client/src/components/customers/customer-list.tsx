import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Edit, Trash, MoreVertical, AlertTriangle, User, Mail, Phone, MapPin } from "lucide-react";

interface CustomerListProps {
  onViewCustomer?: (customerId: number) => void;
  onEditCustomer?: (customerId: number) => void;
}

export const CustomerList = ({ onViewCustomer, onEditCustomer }: CustomerListProps) => {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  
  const {
    data: customers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/customers"],
  });
  
  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: number) => {
      // This would be an API call if the endpoint existed
      // For now, we'll just simulate success
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Müşteri Silindi",
        description: "Müşteri başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "Müşteri silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  const handleDeleteCustomer = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteCustomer = () => {
    if (selectedCustomerId) {
      deleteCustomerMutation.mutate(selectedCustomerId);
    }
  };
  
  // Pagination
  const totalPages = Math.ceil(customers.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedCustomers = customers.slice(startIndex, endIndex);
  
  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Müşteri Adı</TableHead>
              <TableHead>İletişim Kişisi</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Şehir</TableHead>
              <TableHead>Vergi No</TableHead>
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
                  Müşteriler yüklenirken bir hata oluştu.
                </TableCell>
              </TableRow>
            ) : paginatedCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                  Müşteri bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              paginatedCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.contactPerson}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1 text-gray-400" />
                      <span className="text-sm truncate max-w-[120px]">{customer.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{customer.city}</TableCell>
                  <TableCell>{customer.taxNumber}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Menü</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewCustomer && onViewCustomer(customer.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          <span>Görüntüle</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditCustomer && onEditCustomer(customer.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          <span>Düzenle</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCustomer(customer.id)}
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
      {!isLoading && !error && customers.length > 0 && (
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
              {startIndex + 1}-{Math.min(endIndex, customers.length)} / {customers.length} kayıt gösteriliyor
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
            <DialogTitle>Müşteriyi Sil</DialogTitle>
            <DialogDescription>
              Bu müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center p-4 bg-red-50 rounded-md mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
            <p className="text-sm text-red-700">
              Bu işlem müşteri ve ilgili tüm verileri kalıcı olarak silecektir.
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
              onClick={confirmDeleteCustomer}
              disabled={deleteCustomerMutation.isPending}
            >
              {deleteCustomerMutation.isPending ? "Siliniyor..." : "Evet, Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
