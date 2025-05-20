import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  AlertCircle, 
  Bell,
  Info, 
  Settings, 
  Wrench,
  PlugZap,
  Cable,
  Weight,
  Ruler,
  ShoppingBag,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Notification } from "@shared/schema";

interface NotificationCardProps {
  notification: Notification;
  unread?: boolean;
  showFullDate?: boolean;
}

export function NotificationCard({ 
  notification, 
  unread = false,
  showFullDate = false 
}: NotificationCardProps) {
  // İlgili bildirim tipine göre icon seç
  const icon = (() => {
    switch (notification.type) {
      case "maintenance":
        return <Wrench className="h-5 w-5 text-amber-500" />;
      case "system":
        return <Settings className="h-5 w-5 text-blue-500" />;
      case "alert":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "info":
        return <Info className="h-5 w-5 text-primary" />;
      case "device_connect":
        return <PlugZap className="h-5 w-5 text-green-500" />;
      case "device_disconnect":
        return <Cable className="h-5 w-5 text-red-500" />;
      case "process":
        return <Ruler className="h-5 w-5 text-indigo-500" />;
      case "planning":
        return <Ruler className="h-5 w-5 text-purple-500" />;
      case "sales":
        return <ShoppingBag className="h-5 w-5 text-blue-500" />;
      case "warehouse":
        return <Package className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  })();
  
  // Bildirim tipine göre stil belirle
  const typeColor = (() => {
    switch (notification.type) {
      case "alert":
        return "border-l-4 border-l-destructive";
      case "maintenance":
        return "border-l-4 border-l-amber-500";
      case "info":
        return "border-l-4 border-l-primary";
      case "system":
        return "border-l-4 border-l-blue-500";
      case "device_connect":
        return "border-l-4 border-l-green-500";
      case "device_disconnect":
        return "border-l-4 border-l-red-500";
      default:
        return "border-l-4 border-l-muted";
    }
  })();
  
  // Tarih bilgisini formatla (geçersiz tarih kontrolü ile)
  const formatDate = () => {
    try {
      const date = new Date(notification.createdAt);
      
      // Tarih geçerli mi kontrol et
      if (isNaN(date.getTime())) {
        console.warn("Geçersiz tarih:", notification.createdAt);
        return "Tarih bilgisi yok";
      }
      
      if (showFullDate) {
        return format(date, "d MMMM yyyy HH:mm", { locale: tr });
      } else {
        return formatDistanceToNow(date, { 
          addSuffix: true, 
          locale: tr 
        });
      }
    } catch (error) {
      console.error("Tarih format hatası:", error);
      return "Tarih bilgisi yok";
    }
  };
  
  const formattedDate = formatDate();

  return (
    <div 
      className={cn(
        "w-full flex space-x-3 p-2 rounded-md", 
        unread ? "bg-muted/50" : "",
        typeColor
      )}
    >
      <div className="flex-shrink-0 mt-1">
        {icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          unread ? "text-foreground" : "text-muted-foreground"
        )}>
          {notification.title}
        </p>
        
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.content}
        </p>
        
        <p className="text-xs text-muted-foreground mt-1">
          {formattedDate}
        </p>
      </div>
      
      {unread && (
        <div className="flex-shrink-0 self-center">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
        </div>
      )}
    </div>
  );
}