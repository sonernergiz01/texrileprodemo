import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  Bell, 
  CheckCircle2, 
  Info, 
  AlertCircle, 
  ArrowUp, 
  Trash2, 
  CheckCheck,
  Filter
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Notification } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread" | "system" | "maintenance">("all");
  const [showArchived, setShowArchived] = useState(false);
  
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications", { showArchived }],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("PATCH", `/api/notifications/${notificationId}/read`, {});
      if (!res.ok) {
        throw new Error("Bildirim okundu olarak işaretlenirken bir hata oluştu");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/notifications/mark-all-read", {});
      if (!res.ok) {
        throw new Error("Tüm bildirimler okundu olarak işaretlenirken bir hata oluştu");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Başarılı",
        description: "Tüm bildirimler okundu olarak işaretlendi",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const archiveNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("PATCH", `/api/notifications/${notificationId}/archive`, {});
      if (!res.ok) {
        throw new Error("Bildirim arşivlenirken bir hata oluştu");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("DELETE", `/api/notifications/${notificationId}`, {});
      if (!res.ok) {
        throw new Error("Bildirim silinirken bir hata oluştu");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Başarılı",
        description: "Bildirim başarıyla silindi",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.isRead;
    if (filter === "system") return notification.type === "system";
    if (filter === "maintenance") return notification.type === "maintenance";
    return true; // "all" durumunda hepsi
  });

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  function handleMarkAsRead(notificationId: number) {
    markAsReadMutation.mutate(notificationId);
  }

  function handleArchive(notificationId: number) {
    archiveNotificationMutation.mutate(notificationId);
  }

  function handleDelete(notificationId: number) {
    deleteNotificationMutation.mutate(notificationId);
  }

  function handleMarkAllAsRead() {
    markAllAsReadMutation.mutate();
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case "system":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "alert":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "maintenance":
        return <ArrowUp className="h-5 w-5 text-amber-500" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  }

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Bildirimler"
        description="Sistem bildirimleri ve güncellemeleri"
        icon={<Bell className="h-6 w-6" />}
      />

      <div className="flex justify-between flex-wrap gap-2 items-center mb-6">
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>
                  {filter === "all" && "Tüm Bildirimler"}
                  {filter === "unread" && "Okunmamış"}
                  {filter === "system" && "Sistem"}
                  {filter === "maintenance" && "Bakım"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilter("all")}>
                Tüm Bildirimler
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("unread")}>
                Okunmamış
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("system")}>
                Sistem
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("maintenance")}>
                Bakım
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center space-x-2">
            <Switch 
              id="show-archived" 
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <Label htmlFor="show-archived">Arşivlenenleri Göster</Label>
          </div>
        </div>

        <Button 
          variant="ghost" 
          onClick={handleMarkAllAsRead} 
          disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          Tümünü Okundu İşaretle
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 order-2 lg:order-1">
          <Card>
            <CardHeader>
              <CardTitle>Bildirimler</CardTitle>
              <CardDescription>
                Toplam {notifications.length} bildirim
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Okunmamış</span>
                  <Badge variant="secondary">{unreadCount}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Sistem</span>
                  <Badge variant="secondary">
                    {notifications.filter(n => n.type === "system").length}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Bakım</span>
                  <Badge variant="secondary">
                    {notifications.filter(n => n.type === "maintenance").length}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Arşivlenen</span>
                  <Badge variant="secondary">
                    {notifications.filter(n => n.isArchived).length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 order-1 lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {filter === "all" && "Tüm Bildirimler"}
                {filter === "unread" && "Okunmamış Bildirimler"}
                {filter === "system" && "Sistem Bildirimleri"}
                {filter === "maintenance" && "Bakım Bildirimleri"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <span>Bildirimler yükleniyor...</span>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {showArchived ? "Gösterilecek bildirim bulunamadı" : "Gösterilecek bildirim bulunamadı"}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredNotifications.map((notification) => (
                      <Card 
                        key={notification.id} 
                        className={`relative ${!notification.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div className="flex items-center gap-2">
                              {getNotificationIcon(notification.type)}
                              <CardTitle className="text-base">
                                {notification.title}
                              </CardTitle>
                            </div>
                            {notification.isArchived && (
                              <Badge variant="outline" className="text-xs">Arşivlendi</Badge>
                            )}
                          </div>
                          <CardDescription className={notification.isRead ? "text-muted-foreground" : "font-medium"}>
                            {notification.content}
                          </CardDescription>
                        </CardHeader>
                        <CardFooter className="pt-0 pb-3 flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            {notification.createdAt 
                              ? formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                  locale: tr,
                                })
                              : "Tarih bulunamadı"
                            }
                          </span>
                          <div className="flex gap-2">
                            {!notification.isRead && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleMarkAsRead(notification.id)}
                                title="Okundu olarak işaretle"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            {!notification.isArchived && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleArchive(notification.id)}
                                title="Arşivle"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(notification.id)}
                              className="text-red-500"
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}