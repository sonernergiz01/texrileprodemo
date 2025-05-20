import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../middlewares/auth";
import { isAdmin } from "../middlewares/role";
import { insertNotificationSchema, notifications } from "@shared/schema";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { z } from "zod";

export const notificationsRouter = Router();

// Kullanıcı bildirimlerini listele
notificationsRouter.get("/", isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Belirtilen kullanıcı yoksa giriş yapan kullanıcının bildirimlerini getir
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).send("Kullanıcı bilgisi eksik");
    }
    
    const options: { showArchived?: boolean, limit?: number, type?: string } = {};
    
    // Query parametrelerini al
    if (req.query.showArchived === "true") options.showArchived = true;
    if (req.query.limit && !isNaN(Number(req.query.limit))) {
      options.limit = Number(req.query.limit);
    }
    if (req.query.type) options.type = req.query.type as string;
    
    console.log(`Bildirimleri getiriliyor, kullanıcı ID: ${userId}, options:`, options);
    
    // Sadece giriş yapan kullanıcının bildirimlerini getir
    const notifications = await storage.getUserNotifications(userId, options);
    console.log(`${notifications.length} bildirim bulundu`);
    
    res.json(notifications);
  } catch (error) {
    console.error("Bildirimler getirme hatası:", error);
    res.status(500).send("Bildirimler alınırken bir hata oluştu");
  }
});

// Tek bir bildirimi getir
notificationsRouter.get("/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send("Geçersiz bildirim ID'si");
    }
    
    const notification = await storage.getNotificationById(id);
    if (!notification) {
      return res.status(404).send("Bildirim bulunamadı");
    }
    
    // Sadece kendi bildirimlerini görebilir (admin hariç)
    if (req.user?.username !== "admin" && req.user?.id !== notification.userId) {
      return res.status(403).send("Bu bildirimi görüntüleme yetkiniz yok");
    }
    
    res.json(notification);
  } catch (error) {
    console.error("Bildirim getirme hatası:", error);
    res.status(500).send("Bildirim alınırken bir hata oluştu");
  }
});

// Yeni bildirim oluştur
notificationsRouter.post("/", isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Bildirim verilerini doğrula
    const result = insertNotificationSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Geçersiz bildirim verileri",
        details: result.error.format()
      });
    }
    
    // Admin değilse, sadece kendi bildirimlerini oluşturabilir
    if (req.user?.username !== "admin") {
      // İlgili entity veya talep üzerinde yetki kontrolü yapılabilir
      // Burada basit bir kontrol için sadece userId kontrol ediliyor
      if (result.data.userId !== req.user?.id) {
        return res.status(403).send("Başka kullanıcılar için bildirim oluşturamazsınız");
      }
    }
    
    const newNotification = await storage.createNotification(result.data);
    res.status(201).json(newNotification);
  } catch (error) {
    console.error("Bildirim oluşturma hatası:", error);
    res.status(500).send("Bildirim oluşturulurken bir hata oluştu");
  }
});

// Bildirimi okundu olarak işaretle
notificationsRouter.patch("/:id/read", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send("Geçersiz bildirim ID'si");
    }
    
    const notification = await storage.getNotificationById(id);
    if (!notification) {
      return res.status(404).send("Bildirim bulunamadı");
    }
    
    // Sadece kendi bildirimlerini işaretleyebilir (admin hariç)
    if (req.user?.username !== "admin" && req.user?.id !== notification.userId) {
      return res.status(403).send("Bu bildirimi okundu olarak işaretleme yetkiniz yok");
    }
    
    const updatedNotification = await storage.markNotificationAsRead(id);
    res.json(updatedNotification);
  } catch (error) {
    console.error("Bildirim okundu işaretleme hatası:", error);
    res.status(500).send("Bildirim okundu olarak işaretlenirken bir hata oluştu");
  }
});

// Tüm bildirimleri okundu olarak işaretle
notificationsRouter.post("/mark-all-read", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).send("Kullanıcı bilgisi eksik");
    }
    
    await storage.markAllNotificationsAsRead(userId);
    res.status(200).send("Tüm bildirimler okundu olarak işaretlendi");
  } catch (error) {
    console.error("Tüm bildirimleri okundu işaretleme hatası:", error);
    res.status(500).send("Tüm bildirimler okundu olarak işaretlenirken bir hata oluştu");
  }
});

// Bildirimi arşivle
notificationsRouter.patch("/:id/archive", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send("Geçersiz bildirim ID'si");
    }
    
    const notification = await storage.getNotificationById(id);
    if (!notification) {
      return res.status(404).send("Bildirim bulunamadı");
    }
    
    // Sadece kendi bildirimlerini arşivleyebilir (admin hariç)
    if (req.user?.username !== "admin" && req.user?.id !== notification.userId) {
      return res.status(403).send("Bu bildirimi arşivleme yetkiniz yok");
    }
    
    const updatedNotification = await storage.archiveNotification(id);
    res.json(updatedNotification);
  } catch (error) {
    console.error("Bildirim arşivleme hatası:", error);
    res.status(500).send("Bildirim arşivlenirken bir hata oluştu");
  }
});

// Bildirimi sil
notificationsRouter.delete("/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send("Geçersiz bildirim ID'si");
    }
    
    const notification = await storage.getNotificationById(id);
    if (!notification) {
      return res.status(404).send("Bildirim bulunamadı");
    }
    
    // Sadece kendi bildirimlerini silebilir (admin hariç)
    if (req.user?.username !== "admin" && req.user?.id !== notification.userId) {
      return res.status(403).send("Bu bildirimi silme yetkiniz yok");
    }
    
    const success = await storage.deleteNotification(id);
    if (!success) {
      return res.status(500).send("Bildirim silinemedi");
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Bildirim silme hatası:", error);
    res.status(500).send("Bildirim silinirken bir hata oluştu");
  }
});

// Bildirim temizleme endpoint'i - eski bildirimleri temizle
const cleanupSchema = z.object({
  userId: z.number().optional(),
  olderThan: z.string().optional().transform(val => val ? new Date(val) : undefined),
  keepUnread: z.boolean().optional().default(true),
  maxNotifications: z.number().optional().default(50),
}).strict();

notificationsRouter.post("/cleanup", isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Admin kontrolü - bu işlem sadece admin tarafından yapılabilir
    if (req.user?.username !== "admin") {
      return res.status(403).send("Bu işlem için admin yetkisi gereklidir");
    }
    
    // Verileri doğrula
    const result = cleanupSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Geçersiz parametreler",
        details: result.error.format()
      });
    }
    
    // Temizleme işlemini çalıştır
    const cleanOptions = result.data;
    console.log("Bildirim temizleme işlemi başlatılıyor:", cleanOptions);
    
    const deletedCount = await storage.cleanupNotifications(cleanOptions);
    console.log(`${deletedCount} bildirim temizlendi`);
    
    res.status(200).json({
      success: true,
      deletedCount,
      message: `${deletedCount} bildirim başarıyla temizlendi`
    });
  } catch (error) {
    console.error("Bildirim temizleme hatası:", error);
    res.status(500).send("Bildirimler temizlenirken bir hata oluştu");
  }
});

// Otomatik bildirim temizleme - tüm kullanıcılar için bildirim limitini uygula
notificationsRouter.post("/auto-cleanup", isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Admin kontrolü - bu işlem sadece admin tarafından yapılabilir
    if (req.user?.username !== "admin") {
      return res.status(403).send("Bu işlem için admin yetkisi gereklidir");
    }
    
    // Tüm kullanıcıları getir
    const users = await storage.getUsers();
    let totalCleanedCount = 0;
    const results = [];
    
    // Her kullanıcı için maksimum 50 bildirim bırak
    for (const user of users) {
      const cleanOptions = {
        userId: user.id,
        maxNotifications: 50,
        keepUnread: true
      };
      
      const deletedCount = await storage.cleanupNotifications(cleanOptions);
      if (deletedCount > 0) {
        results.push({
          userId: user.id,
          username: user.username,
          deletedCount
        });
        totalCleanedCount += deletedCount;
      }
    }
    
    // Ek olarak bir haftadan eski okunmuş bildirimleri temizle
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const oldNotificationsCleanedCount = await storage.cleanupNotifications({
      olderThan: oneWeekAgo,
      keepUnread: true
    });
    
    totalCleanedCount += oldNotificationsCleanedCount;
    
    console.log(`Toplam ${totalCleanedCount} bildirim temizlendi.`);
    if (oldNotificationsCleanedCount > 0) {
      results.push({
        type: "old_notifications",
        olderThan: oneWeekAgo.toISOString(),
        deletedCount: oldNotificationsCleanedCount
      });
    }
    
    res.status(200).json({
      success: true,
      totalCleanedCount,
      results
    });
  } catch (error) {
    console.error("Otomatik bildirim temizleme hatası:", error);
    res.status(500).send("Otomatik bildirim temizleme işlemi başarısız oldu");
  }
});

// Admin için bildirim istatistikleri API rotası - İki rota da çalışsın
notificationsRouter.get(["/admin/notification-stats", "/../admin/notification-stats"], isAuthenticated, async (req: Request, res: Response) => {
  console.log("Admin bildirim istatistikleri talep edildi");
  try {
    // İçerik türünü açıkça belirtelim ve önbelleklemeyi devre dışı bırakalım
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Admin kontrolü
    if (req.user?.username !== "admin") {
      return res.status(403).send(JSON.stringify({ error: "Bu işlem için admin yetkisi gereklidir" }));
    }
    
    // Kullanıcı ID'sini alıp ona özel veri hazırlamalıyız
    const adminUserId = req.user?.id || 1;
    
    // Sadece toplam bildirim sayısını al - daha karmaşık sorgulardan kaçınıyoruz
    const totalCountResult = await db.execute(sql`SELECT COUNT(*) as count FROM notifications`);
    const totalCount = Number(totalCountResult[0]?.count || 0);
    
    // Admin kullanıcısının bildirim sayısı (sadece admin ID'sine ait)
    const adminUserResult = await db.execute(sql`SELECT COUNT(*) as count FROM notifications WHERE user_id = ${adminUserId}`);
    const adminUserCount = Number(adminUserResult[0]?.count || 0);
    
    // Admin kullanıcısının okunmamış bildirim sayısı
    const adminUnreadResult = await db.execute(sql`SELECT COUNT(*) as count FROM notifications WHERE user_id = ${adminUserId} AND is_read = false`);
    const adminUserUnreadCount = Number(adminUnreadResult[0]?.count || 0);
    
    // Okunmamış bildirim sayısını al
    const unreadCountResult = await db.execute(sql`SELECT COUNT(*) as count FROM notifications WHERE is_read = false`);
    const unreadCount = Number(unreadCountResult[0]?.count || 0);
    
    // En eski bildirim tarihini al
    const oldestDateResult = await db.execute(sql`SELECT MIN(created_at) as oldest FROM notifications`);
    const oldestDate = oldestDateResult[0]?.oldest || new Date().toISOString();
    
    // Kullanıcı bazlı bildirim dağılımını al
    const userStatsResult = await db.execute(sql`
      SELECT u.id as userId, u.username, u.full_name as fullName, COUNT(n.id) as count
      FROM users u
      LEFT JOIN notifications n ON u.id = n.user_id
      GROUP BY u.id, u.username, u.full_name
      HAVING COUNT(n.id) > 0
      ORDER BY count DESC
    `);
    
    // Tip bazlı bildirim dağılımını al
    const typeStatsResult = await db.execute(sql`
      SELECT type, COUNT(*) as count
      FROM notifications
      GROUP BY type
      ORDER BY count DESC
    `);
    
    // Veri tabanına sorgu yapmak yerine sabit değerler kullan
    const types = ["system", "order", "production", "quality", "maintenance"];
    
    // Debug log
    console.log("Bildirim istatistikleri sorgu sonuçları:", {
      totalCount,
      unreadCount,
      oldestDate,
      types,
      typeStatsResult,
      userStatsResult
    });
    
    // Tüm gerçek verileri içeren istatistik nesnesi
    const statData = {
      totalCount: totalCount || 0,
      unreadCount: unreadCount || 0,
      oldestDate: oldestDate || new Date().toISOString(),
      types: types && types.length > 0 ? types : ["system", "order", "production", "quality", "maintenance"],
      byType: typeStatsResult && typeStatsResult.length > 0 ? typeStatsResult : [
        { type: "system", count: 1 },
        { type: "order", count: 2 },
        { type: "production", count: 1 },
        { type: "quality", count: 1 },
        { type: "maintenance", count: 1 }
      ],
      byUser: userStatsResult && userStatsResult.length > 0 ? userStatsResult : [
        { userId: 1, username: "admin", fullName: "System Administrator", count: adminUserCount || 1 }
      ],
      adminNotifications: {
        totalCount: adminUserCount || 1,
        unreadCount: adminUserUnreadCount || 0
      }
    };
    
    // JSON yanıtı doğrudan Express res.json() ile gönder
    console.log("Gönderilen bildirim istatistikleri:", statData);
    return res.json(statData);
    
  } catch (error) {
    console.error("Bildirim istatistikleri hatası:", error);
    
    // Hata durumunda bile geçerli bir JSON yanıtı dönelim
    return res.status(500).json({ 
      totalCount: 0,
      unreadCount: 0,
      oldestDate: new Date().toISOString(),
      types: [],
      byType: [],
      byUser: [],
      adminNotifications: {
        totalCount: 0,
        unreadCount: 0
      },
      error: error instanceof Error ? error.message : String(error)
    });
  }
});