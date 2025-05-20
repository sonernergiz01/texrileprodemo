import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderList } from "@/components/orders/order-list";
import { OrderForm } from "@/components/orders/order-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { ShoppingCart, Filter, Clock, Cog, Truck, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function OrderEntry() {
  const [newOrderDialogOpen, setNewOrderDialogOpen] = useState(false);
  const [activitiesDialogOpen, setActivitiesDialogOpen] = useState(false);
  
  // Fetch order summary data
  const { data: orderSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["/api/orders/summary"],
  });
  
  // Fetch recent activities
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ["/api/activities"],
  });
  
  return (
    <PageContainer
      title="Sipariş Girişi"
      subtitle="Siparişleri görüntüleyin, oluşturun ve yönetin"
      breadcrumbs={[
        { label: "Ana Sayfa", href: "/" },
        { label: "Satış ve Pazarlama", href: "/sales" },
        { label: "Sipariş Girişi", href: "/sales/orders" },
      ]}
    >
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Sipariş Girişi</h2>
          <div>
            <Button className="mr-2" onClick={() => setNewOrderDialogOpen(true)}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Yeni Sipariş
            </Button>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtrele
            </Button>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isLoadingSummary ? (
            Array(4).fill(0).map((_, index) => (
              <Card key={index} className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="h-16 animate-pulse bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card className="border-l-4 border-department-sales">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">Bekleyen Siparişler</p>
                      <p className="text-2xl font-bold text-gray-800">{orderSummary?.pending || 0}</p>
                    </div>
                    <div className="bg-blue-100 p-2 rounded-md">
                      <Clock className="h-5 w-5 text-department-sales" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">Toplam Tutar:</span>
                    <span className="text-sm font-medium text-gray-800 ml-1">
                      {formatCurrency(orderSummary?.pendingValue || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-department-production">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">Üretimdeki Siparişler</p>
                      <p className="text-2xl font-bold text-gray-800">{orderSummary?.production || 0}</p>
                    </div>
                    <div className="bg-green-100 p-2 rounded-md">
                      <Cog className="h-5 w-5 text-department-production" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">Toplam Tutar:</span>
                    <span className="text-sm font-medium text-gray-800 ml-1">
                      {formatCurrency(orderSummary?.productionValue || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-department-inventory">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">Sevkiyat Bekleyen</p>
                      <p className="text-2xl font-bold text-gray-800">{orderSummary?.shipping || 0}</p>
                    </div>
                    <div className="bg-yellow-100 p-2 rounded-md">
                      <Truck className="h-5 w-5 text-department-inventory" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">Toplam Tutar:</span>
                    <span className="text-sm font-medium text-gray-800 ml-1">
                      {formatCurrency(orderSummary?.shippingValue || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-green-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">Tamamlanan Siparişler</p>
                      <p className="text-2xl font-bold text-gray-800">{orderSummary?.completed || 0}</p>
                    </div>
                    <div className="bg-green-100 p-2 rounded-md">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">Toplam Tutar:</span>
                    <span className="text-sm font-medium text-gray-800 ml-1">
                      {formatCurrency(orderSummary?.completedValue || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        
        {/* Order List */}
        <Card>
          <CardHeader className="px-6 py-4 border-b border-gray-200">
            <CardTitle className="text-base font-medium">Sipariş Listesi</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <OrderList
              onViewOrder={(id) => console.log("View order:", id)}
              onEditOrder={(id) => console.log("Edit order:", id)}
            />
          </CardContent>
        </Card>
        
        {/* Additional Features Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <Card>
            <CardHeader className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <CardTitle className="text-base font-medium">Son Aktiviteler</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {isLoadingActivities ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ActivityTimeline 
                  activities={activities}
                  onViewAllClick={() => setActivitiesDialogOpen(true)}
                />
              )}
            </CardContent>
          </Card>
          
          {/* Quick Information */}
          <Card>
            <CardHeader className="px-6 py-4 border-b border-gray-200">
              <CardTitle className="text-base font-medium">Hızlı Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {/* Stock Status */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Stok Durumu (En Çok Kullanılan)</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Pamuklu Örme (KMS-PA-0023)</span>
                      <span className="text-xs font-medium text-gray-800">12.500 m</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: "75%" }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Polyester Dokuma (KMS-PL-0015)</span>
                      <span className="text-xs font-medium text-gray-800">5.800 m</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: "45%" }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Pamuklu Gabardin (KMS-GB-0042)</span>
                      <span className="text-xs font-medium text-gray-800">2.100 m</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-red-500 h-1.5 rounded-full" style={{ width: "20%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Upcoming Deliveries */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Yaklaşan Teslimatlar</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-800">SIP-2023-001</p>
                      <p className="text-xs text-gray-600">ABC Tekstil Ltd.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-800">23.08.2023</p>
                      <p className="text-xs text-gray-600">5.000 m</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-800">SIP-2023-003</p>
                      <p className="text-xs text-gray-600">XYZ Konfeksiyon</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-800">30.08.2023</p>
                      <p className="text-xs text-gray-600">2.800 m</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Top Customers */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">En Aktif Müşteriler (Son 30 gün)</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-800">ABC Tekstil Ltd.</p>
                    <p className="text-sm font-medium text-gray-800">124.500 ₺</p>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                    <p className="text-sm text-gray-800">Moda Tekstil A.Ş.</p>
                    <p className="text-sm font-medium text-gray-800">98.700 ₺</p>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                    <p className="text-sm text-gray-800">XYZ Konfeksiyon</p>
                    <p className="text-sm font-medium text-gray-800">76.200 ₺</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* New Order Dialog */}
      <Dialog open={newOrderDialogOpen} onOpenChange={setNewOrderDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Yeni Sipariş Oluştur</DialogTitle>
            <DialogDescription>
              Yeni bir sipariş oluşturmak için aşağıdaki formu doldurun.
            </DialogDescription>
          </DialogHeader>
          <OrderForm 
            onSuccess={() => setNewOrderDialogOpen(false)}
            onCancel={() => setNewOrderDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* All Activities Dialog */}
      <Dialog open={activitiesDialogOpen} onOpenChange={setActivitiesDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Tüm Aktiviteler</DialogTitle>
            <DialogDescription>
              Sistemde gerçekleşen tüm aktivitelerin listesi.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[70vh] overflow-y-auto pr-2">
            <ActivityTimeline 
              activities={activities}
              showViewAll={false}
              limit={50}
            />
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
