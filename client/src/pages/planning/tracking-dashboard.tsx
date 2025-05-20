import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Activity, Tag, Clock, ArrowLeft, ArrowRight, BarChart3, FileBarChart2, CalendarRange } from "lucide-react";
import { format } from "date-fns";

import PageHeader from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function TrackingDashboardPage() {
  const [location, setLocation] = useLocation();

  // İzleme özeti verisini çek
  const { data: trackingSummary, isLoading } = useQuery({
    queryKey: ['/api/planning/tracking-summary'],
    staleTime: 30000,
  });

  // Departmanlara göre kullanılan renkleri belirle
  const getDepartmentColor = (departmentId: number) => {
    const colorMap: Record<number, string> = {
      1: "bg-primary-100", // Admin
      2: "bg-blue-100",    // Satış
      3: "bg-green-100",   // Üretim
      4: "bg-amber-100",   // Depo
      5: "bg-red-100",     // Kalite
      10: "bg-emerald-100", // Planlama
      11: "bg-orange-100",  // Dokuma
      12: "bg-purple-100",  // ÜRGE
      13: "bg-rose-100",    // Ham Kalite
    };
    
    return colorMap[departmentId] || "bg-gray-100";
  };

  // İzleme olayının türüne göre simge belirle
  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case "entry":
        return <ArrowRight className="h-5 w-5 text-green-500" />;
      case "exit":
        return <ArrowLeft className="h-5 w-5 text-amber-500" />;
      case "process":
        return <Activity className="h-5 w-5 text-blue-500" />;
      case "quality":
        return <FileBarChart2 className="h-5 w-5 text-purple-500" />;
      case "schedule":
        return <CalendarRange className="h-5 w-5 text-indigo-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // İzleme olayı türünü Türkçe'ye çevir
  const getEventTypeLabel = (eventType: string) => {
    const eventLabels: Record<string, string> = {
      "entry": "Giriş",
      "exit": "Çıkış",
      "process": "İşlem",
      "quality": "Kalite Kontrol",
      "schedule": "Planlama",
    };
    
    return eventLabels[eventType] || eventType;
  };

  // Durum için renk belirle
  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "waiting":
        return "bg-amber-100 text-amber-800";
      case "on-hold":
        return "bg-gray-100 text-gray-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Durum etiketini Türkçe'ye çevir
  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      "in-progress": "Üretimde",
      "completed": "Tamamlandı",
      "waiting": "Beklemede",
      "on-hold": "Durduruldu",
      "rejected": "Reddedildi",
    };
    
    return statusLabels[status] || status;
  };

  // Tarihi formatla
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd.MM.yyyy HH:mm");
  };

  return (
    <>
      <PageHeader 
        title="Üretim İzleme Paneli" 
        subtitle="Üretim sürecindeki refakat kartlarını ve hareketleri gerçek zamanlı takip edin"
        icon={<BarChart3 className="h-6 w-6" />}
      />

      <div className="p-4 md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">İzleme Özeti</h2>
            <p className="text-muted-foreground">
              Üretim sürecindeki ürünlerin durum ve konum bilgileri
            </p>
          </div>
          <Button onClick={() => setLocation("/planning/production-cards")}>
            Refakat Kartlarına Dön
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Kart Sayısı</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{trackingSummary?.totalCards || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Sistemde kayıtlı toplam refakat kartı
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Üretimdeki Kartlar</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{trackingSummary?.inProcessCards || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Şu an üretim sürecinde olan kartlar
                </p>
                {trackingSummary && trackingSummary.totalCards > 0 && (
                  <Progress 
                    className="mt-2" 
                    value={(trackingSummary.inProcessCards / trackingSummary.totalCards) * 100} 
                  />
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tamamlanan Kartlar</CardTitle>
                <FileBarChart2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{trackingSummary?.completedCards || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Üretimi tamamlanmış kartlar
                </p>
                {trackingSummary && trackingSummary.totalCards > 0 && (
                  <Progress 
                    className="mt-2" 
                    value={(trackingSummary.completedCards / trackingSummary.totalCards) * 100} 
                  />
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktif Departmanlar</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {trackingSummary?.departmentStats?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Kartların bulunduğu aktif departman sayısı
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mt-8">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Son Hareketler</CardTitle>
              <CardDescription>
                Üretim sürecindeki son izleme olayları
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {trackingSummary?.recentEvents?.map((event: any) => (
                    <div 
                      key={event.id} 
                      className="flex items-start space-x-4 rounded-md border p-4"
                    >
                      <div className={`rounded-full p-2 ${getDepartmentColor(event.departmentId)}`}>
                        {getEventTypeIcon(event.eventType)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {getEventTypeLabel(event.eventType)} - Kart ID: {event.cardId}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(event.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {event.departmentName} bölümünde işlem gerçekleşti
                        </p>
                        {event.status && (
                          <Badge className={`${getStatusColor(event.status)}`}>
                            {getStatusLabel(event.status)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}

                  {(!trackingSummary?.recentEvents || trackingSummary.recentEvents.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Activity className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Henüz izleme olayı kaydedilmemiş</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Departman Dağılımı</CardTitle>
              <CardDescription>
                Üretimdeki kartların departmanlara göre dağılımı
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {trackingSummary?.departmentStats?.map((dept: any) => (
                    <div key={dept.departmentId} className="flex items-center">
                      <div className={`h-2 w-2 rounded-full mr-2 ${getDepartmentColor(dept.departmentId)}`}></div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{dept.departmentName}</p>
                          <span className="text-sm font-medium">{dept.count}</span>
                        </div>
                        <Progress 
                          value={dept.count / (trackingSummary.inProcessCards || 1) * 100}
                          className="h-1" 
                        />
                      </div>
                    </div>
                  ))}

                  {(!trackingSummary?.departmentStats || trackingSummary.departmentStats.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <BarChart3 className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Aktif departman yok</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}