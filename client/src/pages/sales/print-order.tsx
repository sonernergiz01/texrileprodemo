import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';
import { OrderPrintForm } from '@/components/sales/order-print-form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

const PrintOrderPage: React.FC = () => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [orderId, setOrderId] = useState<number | null>(null);
  
  // URL'den sipariş ID'sini çıkart
  useEffect(() => {
    const path = window.location.pathname;
    const segments = path.split('/');
    const id = parseInt(segments[segments.length - 1]);
    if (!isNaN(id)) {
      setOrderId(id);
    } else {
      toast({
        title: "Hata",
        description: "Geçerli bir sipariş ID'si bulunamadı.",
        variant: "destructive"
      });
      navigate('/sales/orders');
    }
  }, []);

  // Sipariş verilerini çek
  const { data: order, isLoading: isOrderLoading, error: orderError } = useQuery({
    queryKey: ['/api/orders', orderId],
    queryFn: () => fetch(`/api/orders/${orderId}`).then(res => res.json()),
    enabled: !!orderId,
  });

  // Müşteri verilerini çek
  const { data: customer, isLoading: isCustomerLoading } = useQuery({
    queryKey: ['/api/customers', order?.customerId],
    queryFn: () => fetch(`/api/customers/${order.customerId}`).then(res => res.json()),
    enabled: !!order?.customerId,
  });

  // Kumaş tipi verilerini çek
  const { data: fabric, isLoading: isFabricLoading } = useQuery({
    queryKey: ['/api/master/fabrics', order?.fabricTypeId],
    queryFn: () => fetch(`/api/master/fabrics/${order.fabricTypeId}`).then(res => res.json()),
    enabled: !!order?.fabricTypeId,
  });

  // Oluşturan kullanıcıyı çek
  const { data: createdByUser, isLoading: isUserLoading } = useQuery({
    queryKey: ['/api/admin/users', order?.createdBy],
    queryFn: () => fetch(`/api/admin/users/${order.createdBy}`).then(res => res.json()),
    enabled: !!order?.createdBy,
  });

  // Yazdırma işlemi
  const handlePrint = () => {
    window.print();
  };

  const isLoading = isOrderLoading || isCustomerLoading || isFabricLoading || isUserLoading;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="ml-2">Sipariş verileri yükleniyor...</span>
        </div>
      </PageContainer>
    );
  }

  if (orderError) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-96">
          <div className="text-red-500">
            Sipariş yüklenirken bir hata oluştu: {orderError.message}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto">
        <div className="flex justify-between items-center mb-4 print:hidden">
          <Button 
            variant="outline" 
            onClick={() => navigate('/sales/orders')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Siparişler'e Dön
          </Button>
          
          <Button 
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Yazdır
          </Button>
        </div>
        
        {order && (
          <OrderPrintForm 
            order={order} 
            customer={customer} 
            fabric={fabric}
            createdByUser={user || createdByUser}
          />
        )}
      </div>

      {/* Yazdırma stili için global CSS */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Yazdırma esnasında gereksiz elementleri gizle */
          nav, header, footer, aside, .print-hidden {
            display: none !important;
          }
        }
      `}</style>
    </PageContainer>
  );
};

export default PrintOrderPage;