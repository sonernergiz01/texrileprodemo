import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CustomerList } from "@/components/customers/customer-list";
import { CustomerForm } from "@/components/customers/customer-form";
import { Plus, Search, UserPlus, Building, Mail, Phone, Users, Map } from "lucide-react";

export default function CustomerManagement() {
  const [newCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false);
  const [viewCustomerDialogOpen, setViewCustomerDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["/api/customers"],
  });
  
  const selectedCustomer = selectedCustomerId 
    ? customers.find(c => c.id === selectedCustomerId) 
    : null;
  
  const handleViewCustomer = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setViewCustomerDialogOpen(true);
  };
  
  const handleEditCustomer = (customerId: number) => {
    // In a real app, we would implement an edit form
    console.log("Edit customer:", customerId);
  };
  
  const customerSummary = {
    total: customers.length,
    active: customers.length, // In a real app, we would filter active customers
    newThisMonth: 2, // This would come from an API
    cities: [...new Set(customers.map(c => c.city))].length
  };
  
  return (
    <PageContainer
      title="Müşteri Yönetimi"
      subtitle="Müşterileri görüntüleyin, ekleyin, düzenleyin"
      breadcrumbs={[
        { label: "Ana Sayfa", href: "/" },
        { label: "Satış ve Pazarlama", href: "/sales" },
        { label: "Müşteri Yönetimi", href: "/sales/customers" },
      ]}
    >
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h2 className="text-lg font-bold text-gray-800">Müşteri Yönetimi</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Müşteri ara..."
                className="pl-9 w-full sm:w-60"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setNewCustomerDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Yeni Müşteri
            </Button>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Toplam Müşteri</p>
                  <p className="text-2xl font-bold text-gray-800">{customerSummary.total}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-md">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Aktif Müşteri</p>
                  <p className="text-2xl font-bold text-gray-800">{customerSummary.active}</p>
                </div>
                <div className="bg-green-100 p-2 rounded-md">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Bu Ay Yeni</p>
                  <p className="text-2xl font-bold text-gray-800">{customerSummary.newThisMonth}</p>
                </div>
                <div className="bg-purple-100 p-2 rounded-md">
                  <UserPlus className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Farklı Şehir</p>
                  <p className="text-2xl font-bold text-gray-800">{customerSummary.cities}</p>
                </div>
                <div className="bg-amber-100 p-2 rounded-md">
                  <Map className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Customer List */}
        <Card>
          <CardHeader className="px-6 py-4 border-b border-gray-200">
            <CardTitle className="text-base font-medium">Müşteri Listesi</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <CustomerList
              onViewCustomer={handleViewCustomer}
              onEditCustomer={handleEditCustomer}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* New Customer Dialog */}
      <Dialog open={newCustomerDialogOpen} onOpenChange={setNewCustomerDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Yeni Müşteri Ekle</DialogTitle>
            <DialogDescription>
              Yeni bir müşteri eklemek için aşağıdaki formu doldurun.
            </DialogDescription>
          </DialogHeader>
          <CustomerForm 
            onSuccess={() => setNewCustomerDialogOpen(false)}
            onCancel={() => setNewCustomerDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* View Customer Dialog */}
      {selectedCustomer && (
        <Dialog open={viewCustomerDialogOpen} onOpenChange={setViewCustomerDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Müşteri Detayı</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xl font-bold">{selectedCustomer.name}</h3>
                <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Aktif
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <UserPlus className="h-5 w-5 mr-2 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">İletişim Kişisi</p>
                    <p className="text-gray-900">{selectedCustomer.contactPerson}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className="h-5 w-5 mr-2 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Telefon</p>
                    <p className="text-gray-900">{selectedCustomer.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail className="h-5 w-5 mr-2 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">E-posta</p>
                    <p className="text-gray-900">{selectedCustomer.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Map className="h-5 w-5 mr-2 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Şehir</p>
                    <p className="text-gray-900">{selectedCustomer.city}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-500">Vergi Numarası</p>
                  <p className="text-gray-900">{selectedCustomer.taxNumber}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-500">Adres</p>
                  <p className="text-gray-900">{selectedCustomer.address}</p>
                </div>
              </div>
              
              {selectedCustomer.notes && (
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Notlar</p>
                    <p className="text-gray-900">{selectedCustomer.notes}</p>
                  </div>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t flex justify-between">
                <h4 className="font-medium">Sipariş Bilgileri</h4>
                <div className="text-sm text-gray-500">Toplam 3 sipariş</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium">Son Siparişler</p>
                  <Button variant="link" size="sm" className="h-auto p-0">
                    Tüm siparişleri gör
                  </Button>
                </div>
                <div className="text-sm text-gray-500">
                  Henüz bir sipariş kaydı bulunmamaktadır.
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setViewCustomerDialogOpen(false)}
                >
                  Kapat
                </Button>
                <Button
                  onClick={() => {
                    setViewCustomerDialogOpen(false);
                    handleEditCustomer(selectedCustomer.id);
                  }}
                >
                  Düzenle
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </PageContainer>
  );
}
