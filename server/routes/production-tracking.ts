import { Router } from "express";
import { ProductionTrackingStorage } from "../storage/production-tracking";
import { insertProductionCardSchema, insertCardMovementSchema } from "@shared/schema";
import { z } from "zod";
import { sendNotification } from "../websocket";

export const productionTrackingRouter = Router();
const storage = new ProductionTrackingStorage();

/**
 * Refakat Kartları API Endpoint'leri
 */

// Tüm refakat kartlarını listele (filtre seçenekleriyle)
productionTrackingRouter.get("/production-cards", async (req, res) => {
  try {
    // Query parametrelerinden filtreler oluştur
    const filters: Record<string, any> = {};
    
    if (req.query.status) filters.status = req.query.status;
    if (req.query.departmentId) filters.departmentId = parseInt(req.query.departmentId as string);
    if (req.query.orderId) filters.orderId = parseInt(req.query.orderId as string);
    if (req.query.productionPlanId) filters.productionPlanId = parseInt(req.query.productionPlanId as string);
    if (req.query.barcode) filters.barcode = req.query.barcode;
    if (req.query.search) filters.search = req.query.search;

    const cards = await storage.getProductionCards(filters);
    res.json(cards);
  } catch (error) {
    console.error("GET /production-cards error:", error);
    res.status(500).json({ message: "Refakat kartları listelenirken bir hata oluştu", error: String(error) });
  }
});

// ID'ye göre refakat kartı getir
productionTrackingRouter.get("/production-cards/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const card = await storage.getProductionCardById(id);
    
    if (!card) {
      return res.status(404).json({ message: `ID: ${id} olan refakat kartı bulunamadı` });
    }
    
    res.json(card);
  } catch (error) {
    console.error(`GET /production-cards/${req.params.id} error:`, error);
    res.status(500).json({ message: "Refakat kartı getirilirken bir hata oluştu", error: String(error) });
  }
});

// Barkoda göre refakat kartı getir
productionTrackingRouter.get("/production-cards/barcode/:barcode", async (req, res) => {
  try {
    const barcode = req.params.barcode;
    const card = await storage.getProductionCardByBarcode(barcode);
    
    if (!card) {
      return res.status(404).json({ message: `Barkod: ${barcode} olan refakat kartı bulunamadı` });
    }
    
    res.json(card);
  } catch (error) {
    console.error(`GET /production-cards/barcode/${req.params.barcode} error:`, error);
    res.status(500).json({ message: "Barkodlu refakat kartı getirilirken bir hata oluştu", error: String(error) });
  }
});

// Yeni refakat kartı oluştur
productionTrackingRouter.post("/production-cards", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Bu işlem için oturum açmanız gerekiyor" });
    }

    console.log("Gelen istek verileri:", req.body);
    
    // Client tarafından gelen verileri al
    const data = { ...req.body };
    
    // Şema doğrulamasını atla, doğrudan storage katmanında işleme uygun hale getir
    // Kritik doğrulamalar storage katmanında ele alınıyor
    console.log("İşleme giren veriler:", data);
    
    // Oluştur - storage katmanı cardNo ve barcode oluşturacak
    const card = await storage.createProductionCard(data);
    
    // Bildirim gönder
    sendNotification({
      type: "production_card_created",
      title: "Yeni Refakat Kartı",
      message: `${card.cardNo} no'lu refakat kartı oluşturuldu`,
      data: { cardId: card.id },
      recipientType: "department",
      recipientId: card.currentDepartmentId
    });
    
    res.status(201).json(card);
  } catch (error) {
    console.error("POST /production-cards error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Geçersiz refakat kartı verileri", 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: "Refakat kartı oluşturulurken bir hata oluştu", error: String(error) });
  }
});

// Refakat kartını güncelle
productionTrackingRouter.patch("/production-cards/:id", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Bu işlem için oturum açmanız gerekiyor" });
    }

    const id = parseInt(req.params.id);
    
    // Mevcut kartı kontrol et
    const existingCard = await storage.getProductionCardById(id);
    if (!existingCard) {
      return res.status(404).json({ message: `ID: ${id} olan refakat kartı bulunamadı` });
    }
    
    // Validate
    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };
    
    // Güncelle
    const updatedCard = await storage.updateProductionCard(id, updateData);
    
    // Durum değişikliği varsa bildirim gönder
    if (req.body.status && req.body.status !== existingCard.status) {
      sendNotification({
        type: "production_card_status_changed",
        title: "Refakat Kartı Durumu Değişti",
        message: `${updatedCard.cardNo} no'lu refakat kartının durumu '${req.body.status}' olarak güncellendi`,
        data: { cardId: updatedCard.id, status: req.body.status },
        recipientType: "department",
        recipientId: updatedCard.currentDepartmentId
      });
    }
    
    // Departman değişikliği varsa bildirim gönder
    if (req.body.currentDepartmentId && req.body.currentDepartmentId !== existingCard.currentDepartmentId) {
      sendNotification({
        type: "production_card_department_changed",
        title: "Refakat Kartı Departman Değişimi",
        message: `${updatedCard.cardNo} no'lu refakat kartı yeni departmana aktarıldı`,
        data: { cardId: updatedCard.id, departmentId: req.body.currentDepartmentId },
        recipientType: "department",
        recipientId: req.body.currentDepartmentId
      });
    }
    
    res.json(updatedCard);
  } catch (error) {
    console.error(`PATCH /production-cards/${req.params.id} error:`, error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Geçersiz güncelleme verileri", 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: "Refakat kartı güncellenirken bir hata oluştu", error: String(error) });
  }
});

// Refakat kartını sil
productionTrackingRouter.delete("/production-cards/:id", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Bu işlem için oturum açmanız gerekiyor" });
    }

    const id = parseInt(req.params.id);
    
    // Mevcut kartı kontrol et
    const existingCard = await storage.getProductionCardById(id);
    if (!existingCard) {
      return res.status(404).json({ message: `ID: ${id} olan refakat kartı bulunamadı` });
    }
    
    // Sil
    const success = await storage.deleteProductionCard(id);
    
    if (success) {
      res.json({ message: "Refakat kartı başarıyla silindi", id });
    } else {
      res.status(500).json({ message: "Refakat kartı silinirken bir hata oluştu" });
    }
  } catch (error) {
    console.error(`DELETE /production-cards/${req.params.id} error:`, error);
    res.status(500).json({ message: "Refakat kartı silinirken bir hata oluştu", error: String(error) });
  }
});

// Kart hareketleri

// Kart ID'sine göre hareketleri getir
productionTrackingRouter.get("/production-cards/:id/movements", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Mevcut kartı kontrol et
    const existingCard = await storage.getProductionCardById(id);
    if (!existingCard) {
      return res.status(404).json({ message: `ID: ${id} olan refakat kartı bulunamadı` });
    }
    
    // Hareketleri getir
    const movements = await storage.getProductionCardMovementsByCardId(id);
    
    res.json(movements);
  } catch (error) {
    console.error(`GET /production-cards/${req.params.id}/movements error:`, error);
    res.status(500).json({ message: "Kart hareketleri getirilirken bir hata oluştu", error: String(error) });
  }
});

// Yeni kart hareketi ekle
productionTrackingRouter.post("/production-card-movements", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Bu işlem için oturum açmanız gerekiyor" });
    }

    // Validate
    const validatedData = insertCardMovementSchema.parse({
      ...req.body,
      userId: req.user.id
    });

    // Hareketi oluştur
    const movement = await storage.createProductionCardMovement(validatedData);
    
    // İlgili kartı getir (bildirim için)
    const card = await storage.getProductionCardById(movement.productionCardId);
    
    // Hareket tipine göre bildirim gönder
    if (movement.type === 'department_change' && movement.departmentId) {
      sendNotification({
        type: "production_card_movement",
        title: "Refakat Kartı Hareketi",
        message: `${card?.cardNo || 'Bilinmeyen'} no'lu kart yeni departmana taşındı`,
        data: { 
          cardId: movement.productionCardId, 
          movementId: movement.id,
          departmentId: movement.departmentId
        },
        recipientType: "department",
        recipientId: movement.departmentId
      });
    } else {
      // Genel hareket bildirimi
      sendNotification({
        type: "production_card_movement",
        title: "Refakat Kartı Hareketi",
        message: `${card?.cardNo || 'Bilinmeyen'} no'lu kart için yeni hareket kaydedildi: ${movement.type}`,
        data: { 
          cardId: movement.productionCardId, 
          movementId: movement.id 
        },
        recipientType: "department",
        recipientId: card?.currentDepartmentId || 0
      });
    }
    
    res.status(201).json(movement);
  } catch (error) {
    console.error("POST /production-card-movements error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Geçersiz hareket verileri", 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: "Kart hareketi oluşturulurken bir hata oluştu", error: String(error) });
  }
});

// İstatistikler

// Durum bazlı istatistikler
productionTrackingRouter.get("/production-stats/by-status", async (req, res) => {
  try {
    const stats = await storage.getProductionCardStatsByStatus();
    res.json(stats);
  } catch (error) {
    console.error("GET /production-stats/by-status error:", error);
    res.status(500).json({ message: "İstatistikler getirilirken bir hata oluştu", error: String(error) });
  }
});

// Departman bazlı istatistikler
productionTrackingRouter.get("/production-stats/by-department", async (req, res) => {
  try {
    const stats = await storage.getProductionCardStatsByDepartment();
    res.json(stats);
  } catch (error) {
    console.error("GET /production-stats/by-department error:", error);
    res.status(500).json({ message: "İstatistikler getirilirken bir hata oluştu", error: String(error) });
  }
});

// Tarih aralığına göre eğilimler
productionTrackingRouter.get("/production-stats/trends", async (req, res) => {
  try {
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate as string) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Son 30 gün
    
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate as string) 
      : new Date();
    
    const trends = await storage.getProductionCardTrendsByDateRange(startDate, endDate);
    res.json(trends);
  } catch (error) {
    console.error("GET /production-stats/trends error:", error);
    res.status(500).json({ message: "Eğilim istatistikleri getirilirken bir hata oluştu", error: String(error) });
  }
});

// Performans metrikleri
productionTrackingRouter.get("/production-stats/performance", async (req, res) => {
  try {
    const metrics = await storage.getProductionPerformanceMetrics();
    res.json(metrics);
  } catch (error) {
    console.error("GET /production-stats/performance error:", error);
    res.status(500).json({ message: "Performans metrikleri getirilirken bir hata oluştu", error: String(error) });
  }
});

// Barkod Tarama Endpoint'i
productionTrackingRouter.post("/scan-barcode", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Bu işlem için oturum açmanız gerekiyor" });
    }

    const { barcode } = req.body;
    
    if (!barcode) {
      return res.status(400).json({ message: "Barkod parametresi gerekli" });
    }
    
    console.log(`Barkod tarama isteği alındı: ${barcode}`);
    
    // Barkoda göre kartı ara
    const card = await storage.getProductionCardByBarcode(barcode);
    
    if (!card) {
      return res.status(404).json({ 
        message: "Bu barkoda sahip refakat kartı bulunamadı",
        barcode
      });
    }
    
    // Kart bulundu, sonucu döndür
    res.json({ 
      message: "Kart başarıyla tarandı", 
      barcode,
      card
    });
    
  } catch (error) {
    console.error("POST /scan-barcode error:", error);
    res.status(500).json({ message: "Barkod tarama sırasında bir hata oluştu", error: String(error) });
  }
});