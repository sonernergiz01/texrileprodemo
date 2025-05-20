import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

// Dashboard veri yükleme hooku
export function useDashboardData() {
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Genel bakış sayfası verileri
  const orderSummary = useQuery({
    queryKey: ["/api/yonetim/order-summary"],
  });

  const salesOrders = useQuery({
    queryKey: ["/api/yonetim/sales-orders"],
  });

  const duedateOrders = useQuery({
    queryKey: ["/api/yonetim/duedate-orders"],
  });

  const machineQueues = useQuery({
    queryKey: ["/api/yonetim/machine-queues"],
  });

  // Üretim sayfası verileri
  const productionPlans = useQuery({
    queryKey: ["/api/yonetim/production-plans"],
  });

  // Kalite sayfası verileri
  const qualityReports = useQuery({
    queryKey: ["/api/yonetim/quality-reports"],
  });

  // Satış sayfası verileri
  const salesTrends = useQuery({
    queryKey: ["/api/yonetim/sales-trends"],
  });

  const shipmentReports = useQuery({
    queryKey: ["/api/yonetim/shipment-reports"],
  });

  // Tüm veri yüklemeleri tamamlandığında isDataLoaded'ı true yap
  useEffect(() => {
    if (
      !orderSummary.isLoading &&
      !salesOrders.isLoading &&
      !duedateOrders.isLoading &&
      !machineQueues.isLoading &&
      !productionPlans.isLoading &&
      !qualityReports.isLoading &&
      !salesTrends.isLoading &&
      !shipmentReports.isLoading
    ) {
      setIsDataLoaded(true);
    }
  }, [
    orderSummary.isLoading,
    salesOrders.isLoading,
    duedateOrders.isLoading,
    machineQueues.isLoading,
    productionPlans.isLoading,
    qualityReports.isLoading,
    salesTrends.isLoading,
    shipmentReports.isLoading,
  ]);

  // Yükleme durumunu ve tüm verileri döndür
  return {
    isLoading: !isDataLoaded,
    orderSummary: orderSummary.data,
    salesOrders: salesOrders.data,
    duedateOrders: duedateOrders.data,
    machineQueues: machineQueues.data,
    productionPlans: productionPlans.data,
    qualityReports: qualityReports.data,
    salesTrends: salesTrends.data,
    shipmentReports: shipmentReports.data,
    refreshData: () => {
      orderSummary.refetch();
      salesOrders.refetch();
      duedateOrders.refetch();
      machineQueues.refetch();
      productionPlans.refetch();
      qualityReports.refetch();
      salesTrends.refetch();
      shipmentReports.refetch();
    },
  };
}