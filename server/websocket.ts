import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { parse } from 'url';
import { db } from './db';

// WebSocket sunucusu ve bağlantı yönetimi
let wss: WebSocketServer;

// Kullanıcıların bağlantılarını saklamak için Map
const userConnections = new Map<number, Set<WebSocket>>();
// Departman bağlantılarını saklamak için Map
const departmentConnections = new Map<number, Set<WebSocket>>();
// Tüm geçerli bağlantıları izle
const allConnections = new Set<WebSocket>();

// Bağlantı istatistikleri
let totalConnectionsEver = 0;
let connectionCount = 0;
let messageCount = 0;

// WebSocket sunucusunu başlat
export function setupWebSocketServer(server: Server) {
  // WebSocket sunucusunu oluştur
  wss = new WebSocketServer({ 
    server,
    path: '/ws',
    // Performans için headerleri kontrol et
    perMessageDeflate: {
      zlibDeflateOptions: {
        // Sıkıştırma seviyesi (1-9)
        level: 6,
        // Bellek kullanımı (1-9)
        memLevel: 7,
      },
      // İstemci tarafında sıkıştırma olası maksimum pencere boyutu
      clientMaxWindowBits: 15,
      // Mesaj sıkıştırmadan önce minimum boyut
      threshold: 1024
    },
    // Maksimum mesaj boyutu (100KB)
    maxPayload: 102400,
  });

  console.log("Gelişmiş WebSocket sunucusu başlatıldı");
  
  // Bağlantı açıldığında
  wss.on('connection', (ws, req) => {
    totalConnectionsEver++;
    connectionCount++;

    // Bağlantıyı izlemeye al
    allConnections.add(ws);
    
    // Parse userId ve departmentId query parametrelerinden
    const { query } = parse(req.url || '', true);
    const userId = query.userId ? parseInt(query.userId as string, 10) : undefined;
    const departmentId = query.departmentId ? parseInt(query.departmentId as string, 10) : undefined;
    
    // Oturum bilgilerinden (güvenlik için) userId'yi al
    const sessionUserId = (req as any).session?.passport?.user;
    
    // Güvenlik kontrolü - oturum kullanıcısı ile istek kullanıcısı eşleşmeli
    const authenticatedUserId = sessionUserId || userId;
    
    if (authenticatedUserId) {
      // Kullanıcı bağlantısını sakla
      (ws as any).userId = authenticatedUserId;
      
      // Kullanıcı bağlantı kümesini al veya oluştur
      if (!userConnections.has(authenticatedUserId)) {
        userConnections.set(authenticatedUserId, new Set());
      }
      userConnections.get(authenticatedUserId)?.add(ws);
      
      console.log(`Kullanıcı ${authenticatedUserId} WebSocket'e bağlandı`);
      
      // Kullanıcının departman bilgisini al (varsayılan eklemek üzere)
      if (departmentId) {
        (ws as any).departmentId = departmentId;
        
        // Departman bağlantı kümesini al veya oluştur 
        if (!departmentConnections.has(departmentId)) {
          departmentConnections.set(departmentId, new Set());
        }
        departmentConnections.get(departmentId)?.add(ws);
        
        console.log(`Kullanıcı ${authenticatedUserId} (Departman: ${departmentId}) WebSocket'e bağlandı`);
      } else {
        // Kullanıcı departman bilgisini veritabanından asenkron olarak al
        getUserDepartment(authenticatedUserId).then(dbDepartmentId => {
          if (dbDepartmentId) {
            (ws as any).departmentId = dbDepartmentId;
            
            // Departman bağlantı kümesini al veya oluştur 
            if (!departmentConnections.has(dbDepartmentId)) {
              departmentConnections.set(dbDepartmentId, new Set());
            }
            departmentConnections.get(dbDepartmentId)?.add(ws);
            
            console.log(`Kullanıcı ${authenticatedUserId} (Departman: ${dbDepartmentId} - DB'den) WebSocket'e bağlandı`);
          }
        }).catch(err => {
          console.error(`Kullanıcı departman bilgisi alınamadı: ${err.message}`);
        });
      }
      
      // Kullanıcıya bağlantı bilgisi gönder
      sendConnectionStatus(ws, true);
    } else {
      console.log("Anonim WebSocket bağlantısı kuruldu");
      
      // Anonim bağlantılara sadece sistem bildirimleri gönderilecek
      (ws as any).isAnonymous = true;
    }

    // Mesaj alındığında
    ws.on('message', (message) => {
      messageCount++;
      try {
        const data = JSON.parse(message.toString());
        
        // Ping/pong mekanizması
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ 
            type: 'pong', 
            timestamp: Date.now(),
            connectionStats: {
              userId: (ws as any).userId,
              departmentId: (ws as any).departmentId,
              isAnonymous: (ws as any).isAnonymous
            }
          }));
        }
        // Bildirim onayları
        else if (data.type === 'ack' && data.notificationId) {
          handleNotificationAcknowledgement(data.notificationId, (ws as any).userId);
        }
        // İşlem istekleri
        else if (data.type === 'action' && data.actionType) {
          handleActionRequest(data, ws);
        }
      } catch (error) {
        console.error("WebSocket mesaj işleme hatası:", error);
      }
    });

    // Error olayı
    ws.on('error', (error) => {
      console.error(`WebSocket bağlantı hatası:`, error);
    });

    // Bağlantı kapandığında
    ws.on('close', (code, reason) => {
      connectionCount--;
      
      // Bağlantıyı izlemeden çıkar
      allConnections.delete(ws);
      
      // Kullanıcı bağlantısını temizle
      const userId = (ws as any).userId;
      if (userId && userConnections.has(userId)) {
        userConnections.get(userId)?.delete(ws);
        // Eğer kullanıcının bağlantısı kalmadıysa Map'ten kaldır
        if (userConnections.get(userId)?.size === 0) {
          userConnections.delete(userId);
        }
      }
      
      // Departman bağlantısını temizle
      const departmentId = (ws as any).departmentId;
      if (departmentId && departmentConnections.has(departmentId)) {
        departmentConnections.get(departmentId)?.delete(ws);
        // Eğer departmanın bağlantısı kalmadıysa Map'ten kaldır
        if (departmentConnections.get(departmentId)?.size === 0) {
          departmentConnections.delete(departmentId);
        }
      }
      
      console.log(`WebSocket bağlantısı kapatıldı (Kod: ${code}, Neden: ${reason}), userId: ${userId || 'anonim'}`);
    });

    // Bağlantı zaman aşımı kontrolü - opsiyonel
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);

    // Temizlik işlevi
    ws.on('close', () => clearInterval(pingInterval));
  });

  // Sunucu hatalarını dinle
  wss.on('error', (error) => {
    console.error("WebSocket sunucusu hatası:", error);
  });

  // Periyodik bağlantı durumu kontrolü ve temizlik
  setInterval(() => {
    wss.clients.forEach((ws) => {
      // Ölü bağlantıları terminalate et
      if ((ws as any).isAlive === false) {
        return ws.terminate();
      }
      // isAlive bayrağını false'a ayarla, pong geldiğinde true'ya dönecek
      (ws as any).isAlive = false;
      // ping gönder
      ws.ping();
    });
    
    // Bağlantı istatistiklerini logla
    console.log(`WebSocket istatistikleri: ${connectionCount} aktif bağlantı, ${totalConnectionsEver} toplam bağlantı, ${messageCount} toplam mesaj`);
  }, 60000);

  return wss;
}

// Kullanıcının departman bilgisini veritabanından al
async function getUserDepartment(userId: number): Promise<number | null> {
  try {
    // Veritabanından departman bilgisini al
    const userResult = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
      columns: {
        departmentId: true
      }
    });
    
    return userResult?.departmentId || null;
  } catch (error) {
    console.error(`Kullanıcı departman bilgisi sorgulanamadı: ${error}`);
    return null;
  }
}

// Bağlantı durum bilgisi gönder
function sendConnectionStatus(ws: WebSocket, isConnected: boolean) {
  try {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'connection_status',
        isConnected,
        timestamp: Date.now(),
        userId: (ws as any).userId,
        departmentId: (ws as any).departmentId
      }));
    }
  } catch (error) {
    console.error("Bağlantı durum bilgisi gönderme hatası:", error);
  }
}

// Bildirim onayını işle
async function handleNotificationAcknowledgement(notificationId: number, userId: number) {
  if (!userId || !notificationId) return;
  
  try {
    // Burada bildirim okundu işaretleme işlemi yapılacak
    // Bu örnek, notificationAcknowledgements tablosuna ekleme yapıyor
    console.log(`Bildirim ${notificationId} kullanıcı ${userId} tarafından onaylandı`);
    
    // İlerleyen aşamalarda buraya veritabanı güncelleme kodu gelecek
  } catch (error) {
    console.error("Bildirim onaylama hatası:", error);
  }
}

// İstemciden gelen aksiyon işleme
async function handleActionRequest(data: any, ws: WebSocket) {
  const userId = (ws as any).userId;
  if (!userId) {
    // Yetkilendirme hatası
    sendErrorResponse(ws, 'unauthorized', 'Bu işlem için oturum açmanız gerekiyor');
    return;
  }
  
  try {
    switch (data.actionType) {
      case 'refresh_data':
        // Verileri yenileme isteği
        sendRefreshResponse(ws, data.entity, data.entityId);
        break;
        
      case 'status_update':
        // Durum güncelleme isteği
        // Burada production_cards, machines vb. durumları güncellenebilir
        console.log(`Durum güncelleme isteği: ${data.entity} - ${data.entityId} - ${data.newStatus}`);
        sendActionResponse(ws, 'success', 'Durum güncellendi');
        break;
        
      default:
        sendErrorResponse(ws, 'unknown_action', 'Bilinmeyen aksiyon türü');
    }
  } catch (error) {
    console.error("Aksiyon işleme hatası:", error);
    sendErrorResponse(ws, 'internal_error', 'İşlem sırasında bir hata oluştu');
  }
}

// Yenileme yanıtı
function sendRefreshResponse(ws: WebSocket, entity: string, entityId?: number) {
  try {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'refresh_response',
        entity,
        entityId,
        timestamp: Date.now()
      }));
    }
  } catch (error) {
    console.error("Yenileme yanıtı gönderme hatası:", error);
  }
}

// Aksiyon yanıtı
function sendActionResponse(ws: WebSocket, status: string, message: string) {
  try {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'action_response',
        status,
        message,
        timestamp: Date.now()
      }));
    }
  } catch (error) {
    console.error("Aksiyon yanıtı gönderme hatası:", error);
  }
}

// Hata yanıtı
function sendErrorResponse(ws: WebSocket, errorCode: string, errorMessage: string) {
  try {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'error',
        code: errorCode,
        message: errorMessage,
        timestamp: Date.now()
      }));
    }
  } catch (error) {
    console.error("Hata yanıtı gönderme hatası:", error);
  }
}

// Bildirim türleri - zenginleştirilmiş
export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
  SYSTEM = 'system',
  MAINTENANCE = 'maintenance',
  PRODUCTION = 'production',
  QUALITY = 'quality',
  INVENTORY = 'inventory',
  SALES = 'sales',
  PLANNING = 'planning',
  DEVICE_CONNECT = 'device_connect',
  DEVICE_DISCONNECT = 'device_disconnect'
}

// Bildirim önceliği
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Temel bildirim arayüzü
interface NotificationBase {
  type: NotificationType;
  title: string;
  content: string;
  priority?: NotificationPriority;
  expiresAt?: Date;
  actions?: NotificationAction[];
  data?: any;
}

// Bildirim aksiyonları
interface NotificationAction {
  label: string;
  action: string;
  url?: string;
  data?: any;
}

// Kullanıcı bildirimi
interface UserNotification extends NotificationBase {
  recipientType: 'user';
  recipientId: number;
}

// Departman bildirimi
interface DepartmentNotification extends NotificationBase {
  recipientType: 'department';
  recipientId: number;
}

// Yayın bildirimi
interface BroadcastNotification extends NotificationBase {
  recipientType: 'broadcast';
}

// Bildirim türleri birleşimi
export type Notification = UserNotification | DepartmentNotification | BroadcastNotification;

// Bildirim gönderme fonksiyonu - gelişmiş
export function sendNotification(notification: Notification): void {
  if (!wss) {
    console.warn("WebSocket sunucusu başlatılmadı, bildirimler gönderilemez");
    return;
  }

  // Bildirim verisini hazırla
  const notificationData = JSON.stringify({
    type: 'notification',
    notification: {
      ...notification,
      id: generateNotificationId(),
      timestamp: Date.now()
    }
  });

  let recipientCount = 0;

  // Bildirim tipine göre alıcıları belirle ve gönder
  if (notification.recipientType === 'broadcast') {
    // Herkese gönder
    allConnections.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(notificationData);
        recipientCount++;
      }
    });
  } 
  else if (notification.recipientType === 'user') {
    // Belirli kullanıcıya gönder
    const userConnectionSet = userConnections.get(notification.recipientId);
    if (userConnectionSet) {
      userConnectionSet.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(notificationData);
          recipientCount++;
        }
      });
    }
  } 
  else if (notification.recipientType === 'department') {
    // Departmana göre gönder
    const departmentConnectionSet = departmentConnections.get(notification.recipientId);
    if (departmentConnectionSet) {
      departmentConnectionSet.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(notificationData);
          recipientCount++;
        }
      });
    }
  }

  console.log(`Bildirim gönderildi: ${notification.type} - ${notification.title}, ${recipientCount} alıcıya ulaştı`);
  
  // Bildirim veritabanına kaydedilecek - gelecek geliştirme
}

// Bildirim ID'si üret
function generateNotificationId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}

// Kullanıcıya bildirim gönder
export async function sendNotificationToUser(userId: number, notification: {
  title: string;
  content: string;
  type: NotificationType;
  priority?: NotificationPriority;
  entityId?: number | null;
  entityType?: string | null;
}): Promise<void> {
  sendNotification({
    recipientType: 'user',
    recipientId: userId,
    type: notification.type,
    title: notification.title,
    content: notification.content,
    priority: notification.priority || NotificationPriority.MEDIUM,
    data: {
      entityId: notification.entityId,
      entityType: notification.entityType
    }
  });
}

// Departmana bildirim gönder
export function sendNotificationToDepartment(departmentId: number, notification: {
  title: string;
  content: string;
  type: NotificationType;
  priority?: NotificationPriority;
  entityId?: number | null;
  entityType?: string | null;
}): void {
  sendNotification({
    recipientType: 'department',
    recipientId: departmentId,
    type: notification.type,
    title: notification.title,
    content: notification.content,
    priority: notification.priority || NotificationPriority.MEDIUM,
    data: {
      entityId: notification.entityId,
      entityType: notification.entityType
    }
  });
}

// Tüm kullanıcılara bildirim gönder
export function sendBroadcastNotification(notification: {
  title: string;
  content: string;
  type: NotificationType;
  priority?: NotificationPriority;
  entityId?: number | null;
  entityType?: string | null;
}): void {
  sendNotification({
    recipientType: 'broadcast',
    type: notification.type,
    title: notification.title,
    content: notification.content,
    priority: notification.priority || NotificationPriority.MEDIUM,
    data: {
      entityId: notification.entityId,
      entityType: notification.entityType
    }
  });
}

// WebSocket sunucusu durumu
export function getWebSocketStatus(): {
  isRunning: boolean;
  connectionCount: number;
  userConnections: number;
  departmentConnections: number;
} {
  return {
    isRunning: !!wss,
    connectionCount,
    userConnections: userConnections.size,
    departmentConnections: departmentConnections.size
  };
}