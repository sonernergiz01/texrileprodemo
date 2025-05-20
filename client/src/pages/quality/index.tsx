import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RollingLines, Circle, Bars } from "@/components/ui/loading-indicators";
import { DataTable } from "@/components/ui/data-table";
import { useLocation, Link } from "wouter";
import { 
  ClipboardList, 
  Package, 
  Ruler, 
  BarChart4, 
  Database, 
  Settings, 
  FileText, 
  AlertTriangle,
  CheckCircle2,
  Circle as CircleIcon
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function QualityControlIndex() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [statsLoaded, setStatsLoaded] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalRolls: number;
    pendingInspection: number;
    passedInspection: number;
    failedInspection: number;
    totalDefects: number;
  }>({
    queryKey: ["/api/quality/stats"],
    enabled: user?.id !== undefined,
    onSuccess: () => {
      setStatsLoaded(true);
    },
    onError: (error: Error) => {
      toast({
        title: "İstatistikler Yüklenemedi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: fabricRolls, isLoading: fabricRollsLoading } = useQuery<any[]>({
    queryKey: ["/api/quality/fabric-rolls", { status: "active" }],
    enabled: user?.id !== undefined,
    onError: (error: Error) => {
      toast({
        title: "Kumaş Topları Yüklenemedi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: deviceStatus, isLoading: deviceStatusLoading } = useQuery<{
    weightConnected: boolean;
    meterConnected: boolean;
  }>({
    queryKey: ["/api/quality/device-status"],
    enabled: user?.id !== undefined,
    onError: (error: Error) => {
      toast({
        title: "Cihaz Durumu Yüklenemedi",
        description: error.message,
        variant: "destructive",
      });
    },
    refetchInterval: 10000, // 10 saniyede bir yenile
  });

  const navigateTo = (path: string) => () => {
    setLocation(path);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kalite Kontrol Yönetimi</h1>
          <p className="text-muted-foreground">
            Kumaş kalite kontrolü, hata tanımlama ve raporlama işlemleri
          </p>
        </div>
        <div className="flex items-center mt-4 md:mt-0 space-x-2">
          <Button 
            variant="outline" 
            onClick={navigateTo("/quality/settings")}
          >
            <Settings className="w-4 h-4 mr-2" />
            Ayarlar
          </Button>
          <Button 
            onClick={navigateTo("/quality/control")}
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Yeni Kontrol Başlat
          </Button>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Toplam Top</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex justify-center">
                <RollingLines width="60" />
              </div>
            ) : (
              <div className="text-2xl font-bold text-blue-900">{stats?.totalRolls || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Bekleyen</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex justify-center">
                <RollingLines width="60" />
              </div>
            ) : (
              <div className="text-2xl font-bold text-amber-900">{stats?.pendingInspection || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Geçen</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex justify-center">
                <RollingLines width="60" />
              </div>
            ) : (
              <div className="text-2xl font-bold text-green-900">{stats?.passedInspection || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Kalan</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex justify-center">
                <RollingLines width="60" />
              </div>
            ) : (
              <div className="text-2xl font-bold text-red-900">{stats?.failedInspection || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Toplam Hata</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex justify-center">
                <RollingLines width="60" />
              </div>
            ) : (
              <div className="text-2xl font-bold text-purple-900">{stats?.totalDefects || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Kumaş Topları */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Aktif Kumaş Topları</CardTitle>
            <CardDescription>Kontrolü devam eden veya bekleyen toplar</CardDescription>
          </CardHeader>
          <CardContent>
            {fabricRollsLoading ? (
              <div className="flex justify-center py-6">
                <Bars height="50" />
              </div>
            ) : fabricRolls?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Aktif Kumaş Topu Bulunamadı</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-2">
                  Kalite kontrolü bekleyen kumaş topu bulunmamaktadır. Yeni bir kontrol başlatmak için
                  "Yeni Kontrol Başlat" butonunu kullanabilirsiniz.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={navigateTo("/quality/control")}
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Yeni Kontrol Başlat
                </Button>
              </div>
            ) : (
              <div className="overflow-auto max-h-[400px]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left font-medium">Barkod</th>
                      <th className="px-4 py-2 text-left font-medium">Parti No</th>
                      <th className="px-4 py-2 text-left font-medium">Durum</th>
                      <th className="px-4 py-2 text-left font-medium">Operatör</th>
                      <th className="px-4 py-2 text-left font-medium">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fabricRolls?.map((roll) => (
                      <tr key={roll.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3">{roll.barCode}</td>
                        <td className="px-4 py-3">{roll.batchNo}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              roll.status === "active"
                                ? "outline"
                                : roll.status === "completed"
                                ? "success"
                                : roll.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {roll.status === "active" && <CircleIcon className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" />}
                            {roll.status === "completed" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {roll.status === "rejected" && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {roll.status === "active"
                              ? "Kontrol Bekliyor"
                              : roll.status === "completed"
                              ? "Tamamlandı"
                              : roll.status === "rejected"
                              ? "Reddedildi"
                              : roll.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{roll.operatorName || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setLocation(`/quality/control/${roll.id}`)}
                            >
                              <ClipboardList className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setLocation(`/quality/fabric-rolls/${roll.id}`)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cihaz Durumu */}
        <Card>
          <CardHeader>
            <CardTitle>Ölçüm Cihazları</CardTitle>
            <CardDescription>Tartı ve metre cihazları durumu</CardDescription>
          </CardHeader>
          <CardContent>
            {deviceStatusLoading ? (
              <div className="flex justify-center py-6">
                <Circle height="50" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${deviceStatus?.weightConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>Tartı Cihazı</span>
                  </div>
                  <Badge variant={deviceStatus?.weightConnected ? "success" : "destructive"}>
                    {deviceStatus?.weightConnected ? "Bağlı" : "Bağlı Değil"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${deviceStatus?.meterConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>Metre Cihazı</span>
                  </div>
                  <Badge variant={deviceStatus?.meterConnected ? "success" : "destructive"}>
                    {deviceStatus?.meterConnected ? "Bağlı" : "Bağlı Değil"}
                  </Badge>
                </div>
                <Separator className="my-4" />
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={() => setLocation("/quality/devices")}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Cihaz Ayarları
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Hızlı Erişim */}
        <Card>
          <CardHeader>
            <CardTitle>Hızlı Erişim</CardTitle>
            <CardDescription>Sık kullanılan işlemler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                className="flex flex-col h-24 space-y-2"
                onClick={() => setLocation("/quality/control")}
              >
                <ClipboardList className="h-6 w-6" />
                <span>Yeni Kontrol</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col h-24 space-y-2"
                onClick={() => setLocation("/quality/defect-codes")}
              >
                <Database className="h-6 w-6" />
                <span>Hata Kodları</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col h-24 space-y-2"
                onClick={() => setLocation("/quality/reports")}
              >
                <BarChart4 className="h-6 w-6" />
                <span>Raporlar</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col h-24 space-y-2"
                onClick={() => setLocation("/quality/fabric-rolls")}
              >
                <Package className="h-6 w-6" />
                <span>Kumaş Topları</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col h-24 space-y-2"
                onClick={() => setLocation("/quality/devices")}
              >
                <Ruler className="h-6 w-6" />
                <span>Ölçüm Cihazları</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col h-24 space-y-2"
                onClick={() => setLocation("/quality/settings")}
              >
                <Settings className="h-6 w-6" />
                <span>Ayarlar</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Son Aktiviteler */}
        <Card>
          <CardHeader>
            <CardTitle>Son Aktiviteler</CardTitle>
            <CardDescription>Son yapılan kalite kontrol işlemleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Aktiviteler burada listelenecek */}
              <div className="text-center py-6 text-muted-foreground">
                <p>Henüz aktivite kaydı bulunmamaktadır.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}