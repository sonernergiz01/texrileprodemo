import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import PageTitle from "@/components/ui/page-title";
import { DataTable } from "@/components/ui/data-table/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Filter, RefreshCw, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

const TwistingOrdersPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState<boolean>(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Büküm siparişlerini getir
  const { data: twistingOrders = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/yarn-spinning/twisting-orders", { status: filterStatus }],
  });

  // Durum güncelleme mutasyonu
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/yarn-spinning/twisting-orders/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error("Sipariş durumu güncellenirken bir hata oluştu.");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Durum güncellendi",
        description: "Büküm siparişi durumu başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-spinning/twisting-orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Detay bilgisini getir
  const { data: orderDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ["/api/yarn-spinning/twisting-orders", selectedOrderId],
    enabled: selectedOrderId !== null && isDetailsOpen,
  });

  // Durum değişikliği yap
  const handleStatusChange = (id: number, newStatus: string) => {
    updateOrderStatusMutation.mutate({ id, newStatus });
  };

  // Durum Badge'i
  const StatusBadge = ({ status }: { status: string }) => {
    let color;
    let text;

    switch (status) {
      case "pending":
        color = "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
        text = "Beklemede";
        break;
      case "in-progress":
        color = "bg-blue-100 text-blue-800 hover:bg-blue-200";
        text = "İşlemde";
        break;
      case "completed":
        color = "bg-green-100 text-green-800 hover:bg-green-200";
        text = "Tamamlandı";
        break;
      case "cancelled":
        color = "bg-red-100 text-red-800 hover:bg-red-200";
        text = "İptal Edildi";
        break;
      default:
        color = "bg-gray-100 text-gray-800 hover:bg-gray-200";
        text = status;
    }

    return <Badge className={cn(color)}>{text}</Badge>;
  };

  // Tablo sütunları
  const columns = [
    {
      header: "ID",
      accessorKey: "id",
      cell: ({ row }: any) => <span>#{row.original.id}</span>,
    },
    {
      header: "İplik Tipi",
      accessorKey: "yarnTypeName",
    },
    {
      header: "Makine",
      accessorKey: "machineName",
    },
    {
      header: "Operatör",
      accessorKey: "operatorName",
    },
    {
      header: "Ne",
      accessorKey: "yarnCount",
    },
    {
      header: "Büküm Yönü",
      accessorKey: "twistDirection",
      cell: ({ row }: any) => (
        <span>
          {row.original.twistDirection === "S" ? "S (Sol)" : "Z (Sağ)"}
        </span>
      ),
    },
    {
      header: "Miktar",
      accessorKey: "quantity",
      cell: ({ row }: any) => <span>{row.original.quantity} kg</span>,
    },
    {
      header: "Durum",
      accessorKey: "status",
      cell: ({ row }: any) => <StatusBadge status={row.original.status} />,
    },
    {
      header: "Başlangıç",
      accessorKey: "startTime",
      cell: ({ row }: any) => (
        <span>
          {row.original.startTime 
            ? formatDistanceToNow(new Date(row.original.startTime), { 
                addSuffix: true, 
                locale: tr 
              }) 
            : "-"}
        </span>
      ),
    },
    {
      header: "İşlemler",
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedOrderId(row.original.id);
              setIsDetailsOpen(true);
            }}
          >
            Detay
          </Button>
          {row.original.status === "pending" && (
            <Button
              variant="outline"
              size="sm"
              className="bg-blue-50 text-blue-600 hover:bg-blue-100"
              onClick={() => handleStatusChange(row.original.id, "in-progress")}
            >
              Başlat
            </Button>
          )}
          {row.original.status === "in-progress" && (
            <Button
              variant="outline"
              size="sm"
              className="bg-green-50 text-green-600 hover:bg-green-100"
              onClick={() => handleStatusChange(row.original.id, "completed")}
            >
              Tamamla
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <PageTitle title="İplik Büküm Siparişleri" subtitle="İplik büküm işlemlerini yönetin" />

        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Button variant="default" onClick={() => setIsNewOrderOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Büküm Siparişi
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setFilterStatus(value === "all" ? null : value)}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Tümü</TabsTrigger>
          <TabsTrigger value="pending">Bekleyen</TabsTrigger>
          <TabsTrigger value="in-progress">İşlemde</TabsTrigger>
          <TabsTrigger value="completed">Tamamlanan</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="w-full">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Tüm Büküm Siparişleri</CardTitle>
              <CardDescription>
                Sistemdeki tüm büküm siparişlerini görüntüleyin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="w-full h-12" />
                  ))}
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={twistingOrders}
                  searchPlaceholder="Büküm siparişlerinde ara..."
                  searchColumn="yarnTypeName"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending" className="w-full">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Bekleyen Siparişler</CardTitle>
              <CardDescription>
                Henüz başlatılmamış büküm siparişleri.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="w-full h-12" />
                  ))}
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={twistingOrders}
                  searchPlaceholder="Büküm siparişlerinde ara..."
                  searchColumn="yarnTypeName"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="in-progress" className="w-full">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>İşlemdeki Siparişler</CardTitle>
              <CardDescription>
                Şu anda makinalarda işlenen büküm siparişleri.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="w-full h-12" />
                  ))}
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={twistingOrders}
                  searchPlaceholder="Büküm siparişlerinde ara..."
                  searchColumn="yarnTypeName"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed" className="w-full">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Tamamlanan Siparişler</CardTitle>
              <CardDescription>
                Tamamlanmış büküm siparişleri.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="w-full h-12" />
                  ))}
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={twistingOrders}
                  searchPlaceholder="Büküm siparişlerinde ara..."
                  searchColumn="yarnTypeName"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sipariş Detay Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isDetailsLoading ? (
                <Skeleton className="h-6 w-48" />
              ) : (
                `Büküm Siparişi #${orderDetails?.id}`
              )}
            </DialogTitle>
            <DialogDescription>
              Büküm siparişi detayları
            </DialogDescription>
          </DialogHeader>

          {isDetailsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">İplik Tipi</h3>
                <p>{orderDetails?.yarnTypeName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Makina</h3>
                <p>{orderDetails?.machineName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">İplik Numarası</h3>
                <p>{orderDetails?.yarnCount}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Büküm Yönü</h3>
                <p>{orderDetails?.twistDirection === "S" ? "S (Sol)" : "Z (Sağ)"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Büküm Miktarı</h3>
                <p>{orderDetails?.twistAmount} T/m</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Miktar</h3>
                <p>{orderDetails?.quantity} kg</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Operatör</h3>
                <p>{orderDetails?.operatorName || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Makine Hızı</h3>
                <p>{orderDetails?.speed || "-"} d/dk</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Durum</h3>
                <StatusBadge status={orderDetails?.status} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Proses</h3>
                <p>{orderDetails?.processName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Başlangıç Zamanı</h3>
                <p>
                  {orderDetails?.startTime
                    ? new Date(orderDetails.startTime).toLocaleString("tr-TR")
                    : "-"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Bitiş Zamanı</h3>
                <p>
                  {orderDetails?.endTime
                    ? new Date(orderDetails.endTime).toLocaleString("tr-TR")
                    : "-"}
                </p>
              </div>
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Notlar</h3>
                <p>{orderDetails?.notes || "-"}</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Kapat
            </Button>
            <div className="space-x-2">
              {orderDetails?.status === "pending" && (
                <Button 
                  className="bg-blue-50 text-blue-600 hover:bg-blue-100"
                  onClick={() => {
                    handleStatusChange(orderDetails.id, "in-progress");
                    setIsDetailsOpen(false);
                  }}
                >
                  İşleme Başlat
                </Button>
              )}
              {orderDetails?.status === "in-progress" && (
                <Button 
                  className="bg-green-50 text-green-600 hover:bg-green-100"
                  onClick={() => {
                    handleStatusChange(orderDetails.id, "completed");
                    setIsDetailsOpen(false);
                  }}
                >
                  Tamamlandı Olarak İşaretle
                </Button>
              )}
              <Button onClick={() => {
                navigate(`/yarn-spinning/twisting-orders/edit/${orderDetails?.id}`);
              }}>
                Düzenle
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Yeni Sipariş Dialog - Bu şimdilik boş, yeni sipariş sayfası için ayrı bir component oluşturacağız */}
      <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Büküm Siparişi</DialogTitle>
            <DialogDescription>
              Bu özellik henüz tam olarak uygulanmadı. İlerleyen aşamalarda eklenecek.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => navigate("/yarn-spinning/twisting-orders/new")}>
            Yeni Sipariş Sayfasına Git
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TwistingOrdersPage;