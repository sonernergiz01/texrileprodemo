import { Router } from "express";
import { storage } from "../storage";
import type { WebSocket } from "ws";
import { z } from "zod";

// Bildirim Testi API Router'ı
// Bu router, bildirim sistemini test etmek için kullanılır
const router = Router();

// TEST: Bütün aktif kullanıcıları getirir
router.get("/active-users", async (req, res) => {
  try {
    const users = await storage.getUsers();
    res.json(users);
  } catch (error) {
    console.error("Aktif kullanıcılar alınırken hata:", error);
    res.status(500).json({ message: "Aktif kullanıcılar alınırken bir hata oluştu" });
  }
});

// TEST: Kullanıcıya test bildirimi gönderir
router.post("/send", async (req, res) => {
  try {
    const { userId, title, content, type } = req.body;
    
    if (!userId || !title || !content) {
      return res.status(400).json({ message: "userId, title ve content alanları zorunludur" });
    }
    
    // Kullanıcının varlığını kontrol et
    const user = await storage.getUser(parseInt(userId));
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    
    // Bildirim tipi doğrulama
    const validTypes = ["info", "alert", "maintenance", "system", "other", "device_connect", "device_disconnect"];
    const notificationType = validTypes.includes(type) ? type : "info";
    
    console.log(`Test bildirimi oluşturuluyor: Kullanıcı=${userId}, Başlık=${title}, Tip=${notificationType}`);
    
    // Benzer içerikli bildirim olup olmadığını kontrol et (son 5 dakikadaki gönderilmiş bildirimler)
    const recentNotifications = await storage.getUserNotifications(parseInt(userId), { limit: 5 });
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Son 5 dakika içinde aynı başlık ve içerikle bildirim var mı kontrol et
    const duplicateNotification = recentNotifications.find(notification => 
      notification.title === title && 
      notification.content === content &&
      notification.type === notificationType &&
      new Date(notification.created_at) > fiveMinutesAgo
    );
    
    if (duplicateNotification) {
      console.log(`Benzer bildirim son 5 dakika içinde zaten gönderilmiş. ID: ${duplicateNotification.id}`);
      return res.json({
        success: true,
        message: "Benzer içerikli bildirim son 5 dakika içinde zaten gönderilmiş",
        notification: duplicateNotification,
        isDuplicate: true
      });
    }
    
    // Bildirim oluşturma verilerini hazırla
    const notificationData = {
      user_id: parseInt(userId),
      title,
      content,
      type: notificationType,
      is_read: false,
      is_archived: false,
      related_entity_id: null,
      related_entity_type: null,
      created_at: new Date()
    };
    
    console.log('Bildirim oluşturuluyor:', notificationData);
    
    // Bildirim oluştur - veritabanı sütun yapısına uygun anahtar kullanımı
    const notification = await storage.createNotification(notificationData);
    
    // Global olarak tanımlanmış sendNotificationToClient fonksiyonunu kullan
    // Bu fonksiyon sadece WebSocket gönderimi yapar, veritabanına kaydetmez
    const globalSendNotificationToClient = (global as any).sendNotificationToClient;
    
    if (!globalSendNotificationToClient) {
      console.error("sendNotificationToClient fonksiyonu global olarak bulunamadı");
      console.log("Bildirim veritabanına kaydedildi, ancak WebSocket üzerinden gönderilemedi");
      return res.status(200).json({
        success: true,
        message: "Bildirim veritabanına kaydedildi, ancak WebSocket üzerinden gönderilemedi",
        notification
      });
    }
    
    // Bildirimi WebSocket üzerinden gönder (veritabanına kaydetmeden)
    await globalSendNotificationToClient(parseInt(userId), {
      id: notification.id,
      title,
      content, 
      notificationType,
      entityId: null,
      entityType: null,
      timestamp: new Date().toISOString(),
    });
    
    res.json({
      success: true,
      message: "Bildirim başarıyla kaydedildi ve gönderildi (eğer kullanıcı WebSocket üzerinden bağlıysa)",
      notification
    });
  } catch (error) {
    console.error("Test bildirimi gönderilirken hata:", error);
    res.status(500).json({ message: "Bildirim gönderilirken bir hata oluştu" });
  }
});

// TEST: Tüm kullanıcılara test bildirimi gönderir
router.post("/send-all", async (req, res) => {
  try {
    const { title, content, type } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: "title ve content alanları zorunludur" });
    }
    
    // Tüm aktif kullanıcıları al
    const users = await storage.getUsers();
    
    // Bildirim tipi doğrulama
    const validTypes = ["info", "alert", "maintenance", "system", "other", "device_connect", "device_disconnect"];
    const notificationType = validTypes.includes(type) ? type : "info";
    
    console.log(`Toplu bildirim oluşturuluyor: Başlık=${title}, Tip=${notificationType}, Kullanıcı sayısı=${users.length}`);
    
    const results = [];
    const skippedUsers = [];
    
    // Global olarak tanımlanmış sendNotificationToUser fonksiyonunu kullan
    const globalSendNotification = (global as any).sendNotificationToUser;
    
    if (!globalSendNotification) {
      console.error("sendNotificationToUser fonksiyonu global olarak bulunamadı");
      return res.status(500).json({ message: "Bildirim sistemi hazır değil" });
    }
    
    // Her kullanıcıya bildirim gönder
    for (const user of users) {
      try {
        // Son 5 dakika içinde aynı içerikli bildirim olup olmadığını kontrol et
        const recentNotifications = await storage.getUserNotifications(user.id, { limit: 5 });
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        const duplicateNotification = recentNotifications.find(notification => 
          notification.title === title && 
          notification.content === content &&
          notification.type === notificationType &&
          new Date(notification.created_at) > fiveMinutesAgo
        );
        
        if (duplicateNotification) {
          console.log(`Kullanıcı ${user.id} için benzer bildirim son 5 dakika içinde zaten gönderilmiş.`);
          skippedUsers.push({
            userId: user.id,
            username: user.username,
            notificationId: duplicateNotification.id,
            reason: "duplicate"
          });
          continue;
        }
        
        // Bildirim oluşturma verilerini hazırla
        const notificationData = {
          user_id: user.id,
          title,
          content,
          type: notificationType,
          is_read: false,
          is_archived: false,
          related_entity_id: null,
          related_entity_type: null,
          created_at: new Date()
        };
        
        console.log(`Topluca bildirim oluşturuluyor - Kullanıcı ${user.id} için:`, notificationData);
        
        // Bildirimi oluştur - veritabanı sütun yapısına uygun anahtar kullanımı
        const notification = await storage.createNotification(notificationData);
        
        // Global olarak tanımlanmış sendNotificationToClient fonksiyonunu kullan
        // Bu fonksiyon sadece WebSocket gönderimi yapar, veritabanına kaydetmez
        const globalSendNotificationToClient = (global as any).sendNotificationToClient;
        
        if (globalSendNotificationToClient) {
          // Bildirimi WebSocket üzerinden gönder (veritabanına kaydetmeden)
          await globalSendNotificationToClient(user.id, {
            id: notification.id,
            title,
            content, 
            notificationType,
            entityId: null,
            entityType: null,
            timestamp: new Date().toISOString(),
          });
        } else {
          console.log(`WebSocket bildirimi gönderilemiyor - sendNotificationToClient fonksiyonu bulunmuyor - Kullanıcı: ${user.id}`);
        }
        
        results.push({
          userId: user.id,
          username: user.username,
          notificationId: notification.id,
        });
      } catch (err) {
        console.error(`Kullanıcıya bildirim gönderilemedi (ID: ${user.id}):`, err);
        skippedUsers.push({
          userId: user.id,
          username: user.username,
          reason: "error",
          error: err.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `${results.length} kullanıcıya bildirim gönderildi, ${skippedUsers.length} kullanıcı atlandı`,
      results,
      skippedUsers
    });
  } catch (error) {
    console.error("Toplu bildirim gönderilirken hata:", error);
    res.status(500).json({ message: "Bildirim gönderilirken bir hata oluştu" });
  }
});

export default router;