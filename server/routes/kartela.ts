/**
 * Kartela API Routes
 * 
 * Kumaş numune ve kartela yönetimi API rotaları
 */

import { Router } from "express";
import { db } from "../db";
import {
  kartelas,
  kartelaItems,
  kartelaStockMovements,
  kartelaShipments,
  kartelasRelations,
  kartelaItemsRelations,
  kartelaStockMovementsRelations,
  kartelaShipmentsRelations
} from "../../shared/schema-kartela";
import { eq, and, desc, asc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const kartelaRouter = Router();

// Tüm kartelaları listele
kartelaRouter.get("/", async (req, res) => {
  try {
    // Tüm kartelaları getir
    const results = await db.select().from(kartelas).orderBy(desc(kartelas.createdAt));
    
    // Her kartela için ilgili öğeleri getir ve sayılarını hesapla
    const kartelasWithCounts = await Promise.all(results.map(async (kartela) => {
      const items = await db.select().from(kartelaItems).where(eq(kartelaItems.kartelaId, kartela.id));
      return {
        ...kartela,
        itemCount: items.length
      };
    }));

    res.json(kartelasWithCounts);
  } catch (error) {
    console.error("Kartela listeleme hatası:", error);
    res.status(500).json({ error: "Kartelalar listelenirken bir hata oluştu" });
  }
});

// Yeni kartela oluştur
kartelaRouter.post("/", async (req, res) => {
  try {
    const { name, description, customerId, customerName, notes } = req.body;

    // Eksik alanları kontrol et
    if (!name) {
      return res.status(400).json({ error: "Kartela adı zorunludur" });
    }

    // Benzersiz kartela kodu oluştur (prefix + timestamp + random)
    const prefix = "KRT";
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const kartelaCode = `${prefix}-${timestamp}-${random}`;

    // QR kodu oluştur
    const qrCode = uuidv4();

    // Kartela oluştur
    const newKartela = await db.insert(kartelas).values({
      kartelaCode,
      name,
      description,
      customerId: customerId ? parseInt(customerId) : null,
      customerName,
      status: "draft",
      qrCode,
      notes,
      createdBy: req.user?.id || 1, // Varsayılan kullanıcı ID
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    res.status(201).json(newKartela[0]);
  } catch (error) {
    console.error("Kartela oluşturma hatası:", error);
    res.status(500).json({ error: "Kartela oluşturulurken bir hata oluştu" });
  }
});

// Kartela detayını getir
kartelaRouter.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Geçersiz kartela ID" });
    }

    // Kartelayı getir
    const [kartela] = await db.select().from(kartelas).where(eq(kartelas.id, id));
    
    if (!kartela) {
      return res.status(404).json({ error: "Kartela bulunamadı" });
    }
    
    // İlgili kumaş öğelerini getir
    const items = await db.select().from(kartelaItems).where(eq(kartelaItems.kartelaId, id));
    
    // Kartela ve kumaşları birleştir
    const kartelaWithItems = {
      ...kartela,
      items
    };

    res.json(kartelaWithItems);
  } catch (error) {
    console.error("Kartela detay hatası:", error);
    res.status(500).json({ error: "Kartela detayı getirilirken bir hata oluştu" });
  }
});

// Kartela güncelle
kartelaRouter.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Geçersiz kartela ID" });
    }

    const { name, description, customerId, customerName, notes, status } = req.body;

    // Mevcut kartelayı kontrol et
    const [existingKartela] = await db.select().from(kartelas).where(eq(kartelas.id, id));

    if (!existingKartela) {
      return res.status(404).json({ error: "Kartela bulunamadı" });
    }

    // Kartela güncelle
    const updatedKartela = await db.update(kartelas)
      .set({
        name: name || existingKartela.name,
        description,
        customerId: customerId ? parseInt(customerId) : null,
        customerName,
        notes,
        status: status || existingKartela.status,
        updatedAt: new Date()
      })
      .where(eq(kartelas.id, id))
      .returning();

    res.json(updatedKartela[0]);
  } catch (error) {
    console.error("Kartela güncelleme hatası:", error);
    res.status(500).json({ error: "Kartela güncellenirken bir hata oluştu" });
  }
});

// Kartela sil
kartelaRouter.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Geçersiz kartela ID" });
    }

    // Mevcut kartelayı kontrol et
    const [existingKartela] = await db.select().from(kartelas).where(eq(kartelas.id, id));

    if (!existingKartela) {
      return res.status(404).json({ error: "Kartela bulunamadı" });
    }

    // Kartela sil (ilişkili veriler cascade ile silinecek)
    await db.delete(kartelas).where(eq(kartelas.id, id));

    res.json({ success: true, message: "Kartela başarıyla silindi" });
  } catch (error) {
    console.error("Kartela silme hatası:", error);
    res.status(500).json({ error: "Kartela silinirken bir hata oluştu" });
  }
});

// Kartelaya kumaş ekle
kartelaRouter.post("/:id/items", async (req, res) => {
  try {
    const kartelaId = parseInt(req.params.id);
    if (isNaN(kartelaId)) {
      return res.status(400).json({ error: "Geçersiz kartela ID" });
    }

    const { fabricTypeId, fabricTypeName, color, weight, width, composition, properties } = req.body;

    // Mevcut kartelayı kontrol et
    const [existingKartela] = await db.select().from(kartelas).where(eq(kartelas.id, kartelaId));

    if (!existingKartela) {
      return res.status(404).json({ error: "Kartela bulunamadı" });
    }

    // Benzersiz kumaş kodu oluştur
    const prefix = "FAB";
    const timestamp = new Date().getTime().toString().slice(-4);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const fabricCode = `${prefix}-${timestamp}-${random}`;

    // QR kodu oluştur
    const qrCode = uuidv4();

    // Kumaş ekle
    const newItem = await db.insert(kartelaItems).values({
      kartelaId,
      fabricTypeId,
      fabricTypeName,
      fabricCode,
      color,
      weight,
      width,
      composition,
      properties,
      qrCode,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Kartelanın updated_at alanını güncelle
    await db.update(kartelas)
      .set({ updatedAt: new Date() })
      .where(eq(kartelas.id, kartelaId));

    res.status(201).json(newItem[0]);
  } catch (error) {
    console.error("Kumaş ekleme hatası:", error);
    res.status(500).json({ error: "Kumaş eklenirken bir hata oluştu" });
  }
});

// Karteladan kumaş sil
kartelaRouter.delete("/:id/items/:itemId", async (req, res) => {
  try {
    const kartelaId = parseInt(req.params.id);
    const itemId = parseInt(req.params.itemId);
    
    if (isNaN(kartelaId) || isNaN(itemId)) {
      return res.status(400).json({ error: "Geçersiz kartela veya kumaş ID" });
    }

    // Kumaş var mı kontrol et
    const [existingItem] = await db.select()
      .from(kartelaItems)
      .where(
        and(
          eq(kartelaItems.id, itemId),
          eq(kartelaItems.kartelaId, kartelaId)
        )
      );

    if (!existingItem) {
      return res.status(404).json({ error: "Kumaş bulunamadı" });
    }

    // Kumaşı sil
    await db.delete(kartelaItems).where(eq(kartelaItems.id, itemId));

    // Kartelanın updated_at alanını güncelle
    await db.update(kartelas)
      .set({ updatedAt: new Date() })
      .where(eq(kartelas.id, kartelaId));

    res.json({ success: true, message: "Kumaş başarıyla silindi" });
  } catch (error) {
    console.error("Kumaş silme hatası:", error);
    res.status(500).json({ error: "Kumaş silinirken bir hata oluştu" });
  }
});

// Kartela stok hareketlerini getir
kartelaRouter.get("/:id/stock", async (req, res) => {
  try {
    const kartelaId = parseInt(req.params.id);
    if (isNaN(kartelaId)) {
      return res.status(400).json({ error: "Geçersiz kartela ID" });
    }

    // Stok hareketlerini getir
    const movements = await db.select()
      .from(kartelaStockMovements)
      .where(eq(kartelaStockMovements.kartelaId, kartelaId))
      .orderBy(desc(kartelaStockMovements.createdAt));

    res.json(movements);
  } catch (error) {
    console.error("Stok hareketleri hatası:", error);
    res.status(500).json({ error: "Stok hareketleri getirilirken bir hata oluştu" });
  }
});

// Yeni stok hareketi ekle
kartelaRouter.post("/:id/stock", async (req, res) => {
  try {
    const kartelaId = parseInt(req.params.id);
    if (isNaN(kartelaId)) {
      return res.status(400).json({ error: "Geçersiz kartela ID" });
    }

    const { kartelaItemId, movementType, quantity, unit, customerId, notes, documentNumber } = req.body;

    // Mevcut kartelayı kontrol et
    const [existingKartela] = await db.select().from(kartelas).where(eq(kartelas.id, kartelaId));

    if (!existingKartela) {
      return res.status(404).json({ error: "Kartela bulunamadı" });
    }

    // Stok hareketi ekle
    const newMovement = await db.insert(kartelaStockMovements).values({
      kartelaId,
      kartelaItemId: kartelaItemId ? parseInt(kartelaItemId) : null,
      movementType,
      quantity,
      unit,
      customerId: customerId ? parseInt(customerId) : null,
      notes,
      documentNumber,
      createdBy: req.user?.id || 1, // Varsayılan kullanıcı ID
      createdAt: new Date()
    }).returning();

    res.status(201).json(newMovement[0]);
  } catch (error) {
    console.error("Stok hareketi ekleme hatası:", error);
    res.status(500).json({ error: "Stok hareketi eklenirken bir hata oluştu" });
  }
});

// Kartela sevkiyatlarını getir
kartelaRouter.get("/:id/shipments", async (req, res) => {
  try {
    const kartelaId = parseInt(req.params.id);
    if (isNaN(kartelaId)) {
      return res.status(400).json({ error: "Geçersiz kartela ID" });
    }

    // Sevkiyatları getir
    const shipments = await db.select()
      .from(kartelaShipments)
      .where(eq(kartelaShipments.kartelaId, kartelaId))
      .orderBy(desc(kartelaShipments.createdAt));

    res.json(shipments);
  } catch (error) {
    console.error("Sevkiyat listesi hatası:", error);
    res.status(500).json({ error: "Sevkiyatlar getirilirken bir hata oluştu" });
  }
});

// Yeni sevkiyat ekle
kartelaRouter.post("/:id/shipments", async (req, res) => {
  try {
    const kartelaId = parseInt(req.params.id);
    if (isNaN(kartelaId)) {
      return res.status(400).json({ error: "Geçersiz kartela ID" });
    }

    const { customerId, customerName, shipmentDate, shipmentMethod, trackingNumber, notes } = req.body;

    // Mevcut kartelayı kontrol et
    const [existingKartela] = await db.select().from(kartelas).where(eq(kartelas.id, kartelaId));

    if (!existingKartela) {
      return res.status(404).json({ error: "Kartela bulunamadı" });
    }

    // Sevkiyat ekle
    const newShipment = await db.insert(kartelaShipments).values({
      kartelaId,
      customerId,
      customerName,
      shipmentDate: new Date(shipmentDate),
      shipmentMethod,
      trackingNumber,
      status: "pending",
      notes,
      createdBy: req.user?.id || 1, // Varsayılan kullanıcı ID
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Kartelanın durumunu "sent" olarak güncelle
    await db.update(kartelas)
      .set({ 
        status: "sent",
        updatedAt: new Date()
      })
      .where(eq(kartelas.id, kartelaId));

    res.status(201).json(newShipment[0]);
  } catch (error) {
    console.error("Sevkiyat ekleme hatası:", error);
    res.status(500).json({ error: "Sevkiyat eklenirken bir hata oluştu" });
  }
});