import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { Bell } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationCard } from "./notification-card";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  
  const { 
    notifications, 
    isLoading, 
    hasNewNotification,
    markAllAsRead,
    markAsRead,
    wsStatus
  } = useNotifications();
  
  // Okunmamış bildirim sayısını hesapla
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  // Bildirimleri grupla (en son okunmamışlar)
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);
  
  // Bildirime tıklandığında okundu olarak işaretle
  const handleNotificationClick = (id: number) => {
    markAsRead(id);
    setOpen(false);
  };
  
  // Tüm bildirimleri okundu olarak işaretle
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };
  
  if (!user) {
    return null;
  }
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={cn(
            "h-5 w-5", 
            unreadCount > 0 && "text-primary animate-pulse",
            hasNewNotification && "text-primary animate-pulse"
          )} />
          
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
          
          {/* WebSocket bağlantı durumu */}
          <span className={cn(
            "absolute bottom-0 right-0 w-2 h-2 rounded-full",
            wsStatus === WebSocket.OPEN ? "bg-green-500" : 
            wsStatus === WebSocket.CONNECTING ? "bg-yellow-500" : 
            "bg-gray-500"
          )} title={
            wsStatus === WebSocket.OPEN ? "Bağlı" : 
            wsStatus === WebSocket.CONNECTING ? "Bağlanıyor" : 
            "Bağlantı yok"
          } />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-72 md:w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Bildirimler</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={handleMarkAllAsRead}
            >
              Tümünü Okundu İşaretle
            </Button>
          )}
        </DropdownMenuLabel>
        
        <Separator />
        
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Bildirimler yükleniyor...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Henüz bildiriminiz bulunmuyor
            </div>
          ) : (
            <>
              {unreadNotifications.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Okunmamış Bildirimler
                  </DropdownMenuLabel>
                  
                  {unreadNotifications.map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id} 
                      className="focus:bg-muted cursor-pointer p-2"
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <NotificationCard notification={notification} unread />
                    </DropdownMenuItem>
                  ))}
                  
                  <DropdownMenuSeparator />
                </>
              )}
              
              {readNotifications.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Okunmuş Bildirimler
                  </DropdownMenuLabel>
                  
                  {readNotifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id} 
                      className="focus:bg-muted cursor-pointer p-2"
                    >
                      <NotificationCard notification={notification} />
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </>
          )}
        </ScrollArea>
        
        <Separator />
        
        <div className="p-2">
          <Link href="/notifications">
            <Button variant="outline" size="sm" className="w-full">
              Tüm Bildirimleri Görüntüle
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}