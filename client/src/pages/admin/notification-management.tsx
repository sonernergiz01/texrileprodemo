import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { BarChart, PieChart, Calendar, Users, AlertTriangle, Check, Trash2, RefreshCw, ArchiveIcon } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { PageContainer } from "@/components/layout/page-container";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/loading-spinner";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

// Varsayılan bildirim istatistikleri
const defaultNotificationStats = {
  totalCount: 0,
  byUser: [],
  byType: [],
  oldestDate: new Date().toISOString(),
  unreadCount: 0,
  types: ["system", "order", "production", "quality", "maintenance"],
  adminNotifications: {
    totalCount: 0,
    unreadCount: 0
  }
};

// Notification Management Page
export default function NotificationManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [autoCleanupLoading, setAutoCleanupLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [olderThan, setOlderThan] = useState<string>("");
  const [keepUnread, setKeepUnread] = useState<boolean>(true);
  const [maxNotifications, setMaxNotifications] = useState<number>(50);
  const [cleanupResults, setCleanupResults] = useState<any>(null);

  // Fetch all users
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Fetch notification statistics - Debug için
  console.log("Bildirim istatistikleri sorgusu başlatılıyor...");
  
  const { data: notificationStats = defaultNotificationStats, isLoading: isNotificationsLoading, error: notificationStatsError } = useQuery({
    queryKey: ["/api/notifications/admin/notification-stats"],
    retry: 5,        // Daha fazla yeniden deneme
    retryDelay: 2000, // 2 saniye sonra yeniden dene
    refetchInterval: 15000, // 15 saniyede bir yenile
    staleTime: 5000, // 5 saniye geçerli kalır - daha hızlı veri güncellemesi için 
    refetchOnWindowFocus: true,
    select: (data) => {
      console.log("Alınan bildirim istatistikleri:", data);
      // Gelen verinin geçerli olduğundan emin ol
      if (!data) return defaultNotificationStats;
      if (!data.adminNotifications) {
        data.adminNotifications = { totalCount: 0, unreadCount: 0 };
      }
      return data;
    },
    placeholderData: defaultNotificationStats,
    onError: (error) => {
      console.error("Bildirim istatistikleri alınamadı:", error);
      toast({
        title: "Hata",
        description: `Bildirim istatistikleri alınamadı: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
        variant: "destructive"
      });
    }
  });

  // Bildirim temizleme işlemi
  const handleCleanupNotifications = async () => {
    try {
      setCleanupLoading(true);
      
      const cleanupOptions: any = {
        keepUnread,
        maxNotifications
      };
      
      // Kullanıcı seçiliyse ekle
      if (selectedUser !== "all") {
        cleanupOptions.userId = parseInt(selectedUser);
      }
      
      // Tarih seçiliyse ekle
      if (olderThan) {
        cleanupOptions.olderThan = new Date(olderThan).toISOString();
      }
      
      console.log("Temizleme seçenekleri:", cleanupOptions);
      
      const response = await apiRequest('POST', '/api/notifications/cleanup', cleanupOptions);
      const result = await response.json();
      
      toast({
        title: "Bildirim Temizleme",
        description: `${result.deletedCount} bildirim başarıyla temizlendi.`,
        variant: "default"
      });
      
      setCleanupResults(result);
    } catch (error) {
      console.error("Bildirim temizleme hatası:", error);
      toast({
        title: "Hata",
        description: "Bildirim temizleme işlemi sırasında bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setCleanupLoading(false);
    }
  };

  // Otomatik bildirim temizleme fonksiyonu
  const handleAutoCleanup = async () => {
    try {
      setAutoCleanupLoading(true);
      
      const response = await apiRequest('POST', '/api/notifications/auto-cleanup');
      const result = await response.json();
      
      toast({
        title: "Otomatik Bildirim Temizleme",
        description: `Toplam ${result.totalCleanedCount} bildirim temizlendi.`,
        variant: "default"
      });
      
      setCleanupResults(result);
    } catch (error) {
      console.error("Otomatik bildirim temizleme hatası:", error);
      toast({
        title: "Hata",
        description: "Otomatik bildirim temizleme işlemi sırasında bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setAutoCleanupLoading(false);
    }
  };

  if (isNotificationsLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner size="lg" centered />
        </div>
      </PageContainer>
    );
  }

  // Renk paleti
  const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6'];

  return (
    <PageContainer
      title="Bildirim Yönetimi"
      subtitle="Sistem bildirimlerini görüntüleyin ve yönetin"
      icon={<AlertTriangle className="h-6 w-6 text-blue-500" />}
    >
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Gösterge Paneli</TabsTrigger>
          <TabsTrigger value="cleanup">Temizleme</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sizin Bildirimleriniz</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{notificationStats.adminNotifications?.totalCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {notificationStats.adminNotifications?.unreadCount || 0} okunmamış bildirim
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sistemdeki Toplam Bildirim</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{notificationStats.totalCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {notificationStats.unreadCount || 0} okunmamış bildirim
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tür Sayısı</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{notificationStats.types?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Farklı bildirim türü
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Kullanıcı Sayısı</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{notificationStats.byUser?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Farklı kullanıcılarla ilişkili
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Eski Bildirim</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {notificationStats.oldestDate ? 
                    formatDistanceToNow(new Date(notificationStats.oldestDate), {
                      addSuffix: true,
                      locale: tr
                    })
                    : "Bildirim yok"}
                </div>
                <p className="text-xs text-muted-foreground">
                  En eski bildirim tarihi
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Bildirim Türleri</CardTitle>
                <CardDescription>
                  Türlerine göre bildirim dağılımı
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notificationStats.byType?.length > 0 ? (
                  <div className="space-y-4">
                    {notificationStats.byType.map((type: any, index: number) => (
                      <div key={type.type} className="flex items-center">
                        <div className="w-16">
                          <Badge style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                            {type.type}
                          </Badge>
                        </div>
                        <div className="flex-1 ml-4">
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full" 
                              style={{
                                width: `${(type.count / notificationStats.totalCount) * 100}%`,
                                backgroundColor: COLORS[index % COLORS.length]
                              }}
                            />
                          </div>
                        </div>
                        <span className="ml-4 text-sm font-medium">{type.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 text-gray-500">
                    Bildirim türü bulunamadı
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Kullanıcı Dağılımı</CardTitle>
                <CardDescription>
                  Kullanıcılara göre bildirim dağılımı
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notificationStats.byUser?.length > 0 ? (
                  <div className="space-y-4">
                    {notificationStats.byUser.slice(0, 8).map((user: any, index: number) => (
                      <div key={user.userId} className="flex items-center">
                        <div className="w-32 truncate">
                          <span className="text-sm font-medium">{user.username || `Kullanıcı #${user.userId}`}</span>
                        </div>
                        <div className="flex-1 ml-4">
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full" 
                              style={{
                                width: `${(user.count / notificationStats.totalCount) * 100}%`,
                                backgroundColor: COLORS[index % COLORS.length]
                              }}
                            />
                          </div>
                        </div>
                        <span className="ml-4 text-sm font-medium">{user.count}</span>
                      </div>
                    ))}
                    
                    {notificationStats.byUser.length > 8 && (
                      <div className="text-sm text-center text-gray-500 mt-2">
                        +{notificationStats.byUser.length - 8} daha fazla kullanıcı
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 text-gray-500">
                    Kullanıcı bilgisi bulunamadı
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="cleanup" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Bildirim Temizleme</CardTitle>
              <CardDescription>
                Sistemden eski bildirimleri temizleyin. Bu işlem geri alınamaz.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="user">Kullanıcı Seçin</Label>
                    <Select 
                      value={selectedUser} 
                      onValueChange={setSelectedUser}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kullanıcı seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                        {users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.username} ({user.fullName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="olderThan">Şu Tarihten Eski</Label>
                    <Input
                      id="olderThan"
                      type="date"
                      value={olderThan}
                      onChange={(e) => setOlderThan(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="keepUnread">Okunmamışları Tut</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="keepUnread"
                        checked={keepUnread}
                        onCheckedChange={setKeepUnread}
                      />
                      <Label htmlFor="keepUnread" className="text-sm text-gray-500">
                        {keepUnread ? "Okunmamış bildirimler korunacak" : "Tüm bildirimler temizlenecek"}
                      </Label>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxNotifications">Kullanıcı Başına Maksimum Bildirim</Label>
                    <Input
                      id="maxNotifications"
                      type="number"
                      min={10}
                      max={1000}
                      value={maxNotifications}
                      onChange={(e) => setMaxNotifications(parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleAutoCleanup}
                  disabled={autoCleanupLoading}
                  className="font-medium"
                >
                  {autoCleanupLoading ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" /> Otomatik Temizleniyor...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" /> Otomatik Temizle
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleCleanupNotifications}
                  disabled={cleanupLoading}
                  className="font-medium"
                >
                  {cleanupLoading ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" /> Temizleniyor...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" /> Bildirimleri Temizle
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {cleanupResults && (
            <Card>
              <CardHeader>
                <CardTitle>Temizleme Sonuçları</CardTitle>
                <CardDescription>
                  {cleanupResults.message || `${cleanupResults.deletedCount || cleanupResults.totalCleanedCount || 0} bildirim temizlendi`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cleanupResults.results ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Kullanıcı Bazlı Temizleme:</h3>
                    <div className="space-y-2">
                      {cleanupResults.results.map((result: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          {result.type === "old_notifications" ? (
                            <span>Eski bildirimler ({new Date(result.olderThan).toLocaleDateString()} öncesi)</span>
                          ) : (
                            <span>{result.username || `Kullanıcı #${result.userId}`}</span>
                          )}
                          <Badge variant="outline">{result.deletedCount} bildirim</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p>Toplam: {cleanupResults.deletedCount || 0} bildirim</p>
                    <p className="text-sm text-gray-500 mt-2">Detaylı bilgi bulunmuyor</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}