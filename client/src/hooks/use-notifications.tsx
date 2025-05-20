import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "./use-toast";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./use-auth";

// Bildirim tipi tanımları - hem API yanıtı hem de iç kullanım için
export interface ApiNotification {
  id: number;
  user_id: number;
  title: string;
  content: string;
  type: string;
  is_read: boolean;
  is_archived: boolean;
  related_entity_id: number | null;
  related_entity_type: string | null;
  created_at: string;
}

// İç kullanım için camelCase tipi
export interface Notification {
  id: number;
  userId: number;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  isArchived: boolean;
  relatedEntityId: number | null;
  relatedEntityType: string | null;
  createdAt: Date;
}

export function useNotifications(options: { limit?: number, showArchived?: boolean } = {}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Bildirimleri getir
  const queryKey = ['/api/notifications'];
  const { data = [], isLoading, error } = useQuery<Notification[]>({
    queryKey,
    queryFn: async () => {
      try {
        // Kullanıcı yoksa boş dizi döndür (beyaz ekran hatasını önle)
        if (!user) {
          console.warn("useNotifications: Kullanıcı oturum açmamış, boş bildirim dizisi döndürülüyor");
          return [];
        }
        
        const params = new URLSearchParams();
        if (options.limit) params.append('limit', options.limit.toString());
        if (options.showArchived) params.append('showArchived', 'true');
        
        const queryString = params.toString();
        const url = queryString ? `/api/notifications?${queryString}` : '/api/notifications';
        
        // getQueryFn yerine manuel fetch kullanıldığı için, tüm hata durumlarını ele almalıyız
        try {
          const res = await fetch(url, {
            credentials: "include", // Oturum çerezlerini ekle
            headers: {
              "Accept": "application/json"
            }
          });
          
          if (res.status === 401) {
            console.warn("useNotifications: Yetkilendirme hatası, boş bildirim dizisi döndürülüyor");
            return [];
          }
          
          if (!res.ok) {
            console.error(`useNotifications: API hatası ${res.status} ${res.statusText}`);
            return []; // Hata durumunda boş dizi döndür, beyaz ekranı önle
          }
          
          let rawNotifications = [];
          
          try {
            // JSON parse hatalarını ele al
            rawNotifications = await res.json();
          } catch (jsonError) {
            console.error("useNotifications: JSON ayrıştırma hatası:", jsonError);
            return []; // Parse hatası durumunda boş dizi döndür
          }
          
          // Gelen veri dizi değilse, boş dizi döndür
          if (!Array.isArray(rawNotifications)) {
            console.error("useNotifications: API beklenmeyen bir yanıt döndürdü (dizi değil):", rawNotifications);
            return [];
          }
          
          // API'den dönen snake_case verileri camelCase'e dönüştür
          const notifications = rawNotifications.map((n: any) => ({
            id: n.id || 0,
            userId: n.user_id || user.id,
            title: n.title || 'Bildirim',
            content: n.content || '',
            type: n.type || 'info',
            isRead: Boolean(n.is_read),
            isArchived: Boolean(n.is_archived),
            relatedEntityId: n.related_entity_id || null,
            relatedEntityType: n.related_entity_type || null,
            createdAt: n.created_at ? new Date(n.created_at) : new Date()
          }));
          
          setHasNewNotification(notifications.some((n: Notification) => !n.isRead));
          return notifications;
        } catch (fetchError) {
          console.error("useNotifications: Fetch hatası:", fetchError);
          return []; // Fetch hatası durumunda boş dizi döndür
        }
      } catch (generalError) {
        console.error("useNotifications: Genel hata:", generalError);
        return []; // Genel hata durumunda boş dizi döndür, beyaz ekranı önle
      }
    },
    // Bildirimlerin olmaması uygulama için kritik değil, hata olsa bile devam et
    retry: false,
    retryOnMount: false
  });
  
  // Son oturum süresini yerel depolama alanında sakla
  useEffect(() => {
    if (user) {
      localStorage.setItem('lastLoginTime', new Date().toISOString());
    }
  }, [user]);
  
  // Sayfa yüklendiğinde okunmamış bildirimleri kontrol et
  useEffect(() => {
    if (user) {
      const lastLoginTime = localStorage.getItem('lastLoginTime');
      
      // Eğer bu ilk giriş değilse ve son giriş zamanı varsa, o zaman kullanıcı geri gelmiş demektir
      if (lastLoginTime) {
        const lastLogin = new Date(lastLoginTime);
        const now = new Date();
        
        // Eğer son girişten bu yana 5 dakikadan fazla zaman geçmişse, bildirim kontrolü yap
        if ((now.getTime() - lastLogin.getTime()) > 5 * 60 * 1000) {
          console.log("Kullanıcı geri döndü, bildirimler yenileniyor...");
          // Bildirimleri yeniden getir
          queryClient.invalidateQueries({ queryKey });
        }
      }
      
      // Son giriş zamanını güncelle
      localStorage.setItem('lastLoginTime', new Date().toISOString());
    }
  }, [user, queryKey]);

  // WebSocket bağlantısını kur
  useEffect(() => {
    if (!user) return;
    
    // Yeniden bağlanma mantığı için değişkenler
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    let isIntentionalClose = false;
    const MAX_RECONNECT_ATTEMPTS = 10; // Daha fazla yeniden deneme
    const INITIAL_RECONNECT_DELAY = 1000; // 1 saniye başlangıç
    const MAX_RECONNECT_DELAY = 30000; // En fazla 30 saniye bekleme
    
    // Üstel geri çekilme ile gecikmeli yeniden bağlanma (exponential backoff)
    const getReconnectDelay = (): number => {
      // 2^n * 1000 ms, en fazla MAX_RECONNECT_DELAY
      return Math.min(Math.pow(2, reconnectAttempts) * INITIAL_RECONNECT_DELAY, MAX_RECONNECT_DELAY);
    };
    
    // WebSocket bağlantısını oluşturan fonksiyon
    const connectWebSocket = () => {
      try {
        // Kullanıcı kimliği kontrolü - bu da bir beyaz ekran kaynağı olabilir
        if (!user || !user.id) {
          console.error("WebSocket bağlantısı için kullanıcı kimliği eksik");
          return; // Kullanıcı yoksa bağlanma girişimini iptal et
        }
        
        // Önceki bağlantıyı ve zamanlayıcıları temizle
        if (ws) {
          try {
            isIntentionalClose = true; // Kasıtlı kapatma işareti
            ws.onclose = null; // Bağlantı kapatıldığında otomatik yeniden bağlanmayı engelle
            ws.close();
          } catch (closeError) {
            console.error("WebSocket kapatılırken hata:", closeError);
          } finally {
            isIntentionalClose = false; // İşareti sıfırla
          }
        }
        
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
        
        // Güvenilir URL oluşturma
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}`;
        
        // WebSocket nesnesini oluştur ve event handler'ları tanımla
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;
      } catch (setupError) {
        console.error("WebSocket bağlantısı kurulurken hata:", setupError);
        // Hata durumunda tekrar bağlanmayı dene
        reconnectAttempts++;
        const delay = getReconnectDelay();
        console.log(`WebSocket bağlantı hatası, yeniden deneme ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}, ${delay}ms sonra...`);
        
        reconnectTimeout = setTimeout(() => {
          connectWebSocket();
        }, delay);
        return; // Hata durumunda erken çık
      }
      
      // WebSocket null olmamalı ama güvenlik için kontrol et
      if (!ws) {
        console.error("WebSocket nesnesi oluşturulamadı");
        return;
      }
      
      ws.onopen = () => {
        console.log('WebSocket bağlantısı kuruldu');
        reconnectAttempts = 0; // Bağlantı başarılı, yeniden deneme sayacını sıfırla
        
        // Ping/Pong mekanizması ile bağlantıyı canlı tut (her 30 saniyede bir)
        const pingInterval = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
            } catch (err) {
              console.error('Ping gönderme hatası:', err);
              clearInterval(pingInterval);
            }
          } else {
            clearInterval(pingInterval);
          }
        }, 30000);
        
        // Bağlantı kapandığında interval'i temizle
        ws.onclose = () => {
          clearInterval(pingInterval);
          handleClose();
        };
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket mesajı alındı:', message);
          
          if (message.type === 'notification') {
            // Yeni bildirim geldi
            setHasNewNotification(true);
            // Bildirimleri yeniden getir
            queryClient.invalidateQueries({ queryKey });
            
            // Bildirim göster
            toast({
              title: message.title || 'Yeni Bildirim',
              description: message.content,
              variant: "default"
            });
          }
        } catch (error) {
          console.error('WebSocket mesajı işlenirken hata:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket hatası:', error);
        // WebSocket bağlantısındaki hatayı ele al - genellikle wsRef'i sıfırlamayız çünkü onclose zaten tetiklenecek
        // Ağ durumunu kontrol et
        if (!navigator.onLine) {
          console.log('Ağ bağlantısı yok. Çevrimiçi olduğunuzda tekrar bağlanmayı deneyeceğiz.');
        }
      };
      
      // Bağlantı kapanma olayını işleme fonksiyonu
      const handleClose = (event?: CloseEvent) => {
        if (event) {
          console.log(`WebSocket bağlantısı kapatıldı (Kod: ${event.code}, Neden: ${event.reason})`);
        } else {
          console.log(`WebSocket bağlantısı kapatıldı`);
        }
        
        wsRef.current = null;
        
        // Kasıtlı olarak kapatılmışsa yeniden bağlanma yapma
        if (isIntentionalClose) {
          console.log('Kasıtlı kapatma, yeniden bağlanma denemesi yapılmayacak');
          return;
        }
        
        // Başarısız bağlantı durumunda, yeniden bağlanmayı dene (belirli bir limite kadar)
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          const delay = getReconnectDelay();
          console.log(`Yeniden bağlanma denemesi ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}, ${delay}ms sonra...`);
          
          reconnectTimeout = setTimeout(() => {
            console.log('Yeniden bağlanma girişimi yapılıyor...');
            connectWebSocket();
          }, delay);
        } else {
          console.log('Maksimum yeniden bağlanma denemesi aşıldı, daha fazla deneme yapılmayacak');
          // Kullanıcıya bildirim göster
          toast({
            title: "Bildirim sistemi bağlantısı kesildi",
            description: "Bildirimleri alabilmek için sayfayı yenileyin",
            variant: "destructive"
          });
        }
      };
      
      ws.onclose = handleClose;
    };
    
    // İlk bağlantıyı başlat
    connectWebSocket();
    
    // Online/offline durumunu kontrol etmek için ağ event listener'ları
    const handleOnline = () => {
      console.log('Ağ bağlantısı yeniden kuruldu. WebSocket yeniden bağlanıyor...');
      reconnectAttempts = 0; // Yeniden bağlantı sayacını sıfırla
      connectWebSocket(); // Çevrimiçi olduğumuzda bağlantıyı yeniden kur
    };
    
    const handleOffline = () => {
      console.log('Ağ bağlantısı kesildi. WebSocket bağlantısı durduruldu.');
      // Ağ bağlantısı kesildiğinde yeniden bağlanma girişimlerini durdur
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    };
    
    // Ağ durumu değişikliği dinleyicilerini ekle
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Temizleme işlevi
    return () => {
      // Ağ dinleyicilerini kaldır
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (ws) {
        ws.onclose = null; // Otomatik yeniden bağlanmayı engelle
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      }
      
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [user, queryKey, toast]);
  
  // Bildirimi okundu olarak işaretle
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => {
      toast({
        title: "Bildirim işaretlenemedi",
        description: err.message,
        variant: "destructive"
      });
    }
  });
  
  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/notifications/mark-all-read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Bildirimler okundu olarak işaretlendi",
        variant: "default"
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Bildirimler işaretlenemedi",
        description: err.message,
        variant: "destructive"
      });
    }
  });
  
  // Bildirimi arşivle
  const archiveNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/notifications/${id}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Bildirim arşivlendi",
        variant: "default"
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Bildirim arşivlenemedi",
        description: err.message,
        variant: "destructive"
      });
    }
  });
  
  // Bildirimi sil
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Bildirim silindi",
        variant: "default"
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Bildirim silinemedi",
        description: err.message,
        variant: "destructive"
      });
    }
  });
  
  // Bildirim onaylama (WebSocket üzerinden) - iyileştirilmiş, hata kontrolü ile
  const acknowledgeNotification = useCallback((notificationId: number) => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ack',
          notificationId,
          timestamp: Date.now()
        }));
      } else {
        console.log('WebSocket bağlantısı yok veya hazır değil, bildirim onaylanamadı');
        // Bildirim yine de API üzerinden işaretlenecek (markAsRead işlevi)
      }
    } catch (error) {
      console.error('Bildirim onaylama hatası:', error);
    }
  }, []);
  
  // Bildirimi okundu olarak işaretleme ve WebSocket'e bildirim gönderme - iyileştirilmiş, hata kontrolü ile
  const markAsRead = useCallback((id: number) => {
    try {
      // Önce API üzerinden işaretle
      markAsReadMutation.mutate(id);
      
      // Sonra WebSocket üzerinden bildirim gönder (isteğe bağlı)
      acknowledgeNotification(id);
    } catch (error) {
      console.error('Bildirim işaretleme hatası:', error);
      
      // Hata durumunda yine de API çağrısını gerçekleştir
      markAsReadMutation.mutate(id);
    }
  }, [markAsReadMutation, acknowledgeNotification]);
  
  return {
    notifications: data,
    isLoading,
    error,
    hasNewNotification,
    markAsRead,
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    archiveNotification: (id: number) => archiveNotificationMutation.mutate(id),
    deleteNotification: (id: number) => deleteNotificationMutation.mutate(id),
    wsStatus: wsRef.current ? wsRef.current.readyState : null
  };
}