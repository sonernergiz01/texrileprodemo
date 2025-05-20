import { Router } from "express";
import { storage } from "../storage";
import { asyncHandler } from "../utils/async-handler";
import { z } from "zod";
import { insertWeaveProductionCardSchema } from "@shared/schema";

const router = Router();

// Dokuma üretim kartlarını getir
router.get("/production-cards", asyncHandler(async (req, res) => {
  const cards = await storage.getWeaveProductionCards();
  res.json(cards);
}));

// Tek bir dokuma üretim kartını getir
router.get("/production-cards/:id", asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new Error("Geçersiz kart ID");
  }
  
  const card = await storage.getWeaveProductionCardById(id);
  if (!card) {
    return res.status(404).json({ message: "Üretim kartı bulunamadı" });
  }
  
  res.json(card);
}));

// Yeni dokuma üretim kartı oluştur
router.post("/production-cards", asyncHandler(async (req, res) => {
  // Z şeması ile doğrulama 
  const validatedData = insertWeaveProductionCardSchema.parse(req.body);
  
  // Kart numarası oluştur: WPC-yıl-ay-rastgele numara
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  const cardNumber = `WPC-${year}${month}-${random}`;
  
  // Kullanıcı kimliği ve departman bilgilerini ekle
  const userId = req.user?.id || 1;
  const departmentId = req.user?.departmentId || null;
  
  // Kartı oluştur
  const card = await storage.createWeaveProductionCard({
    ...validatedData,
    cardNumber,
    status: "created",
    userId,
    departmentId,
    createdAt: new Date(),
  });
  
  res.status(201).json(card);
}));

// Kart durumunu güncelle
router.put("/production-cards/:id/status", asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new Error("Geçersiz kart ID");
  }
  
  const { status } = req.body;
  if (!status) {
    throw new Error("Durum bilgisi gerekli");
  }
  
  const card = await storage.updateWeaveProductionCardStatus(id, status);
  if (!card) {
    return res.status(404).json({ message: "Üretim kartı bulunamadı" });
  }
  
  res.json(card);
}));

// Üretim kartı için izleme olayı ekle
router.post("/tracking-events", asyncHandler(async (req, res) => {
  const { cardId, eventType, machineId, details } = req.body;
  
  if (!cardId || !eventType) {
    throw new Error("Kart ID ve olay tipi gereklidir");
  }
  
  const userId = req.user?.id || 1;
  const departmentId = req.user?.departmentId || null;
  
  const event = await storage.createWeaveCardTrackingEvent({
    productionCardId: cardId,
    type: eventType,
    userId,
    departmentId,
    machineId: machineId || null,
    details: details || null,
    timestamp: new Date(),
  });
  
  // Kart durumunu güncelle
  let status = "in-progress";
  if (eventType === "completed") {
    status = "completed";
  }
  
  await storage.updateWeaveProductionCardStatus(cardId, status);
  
  res.status(201).json(event);
}));

// Kart izleme olaylarını getir
router.get("/production-cards/:id/tracking-events", asyncHandler(async (req, res) => {
  const cardId = parseInt(req.params.id);
  if (isNaN(cardId)) {
    throw new Error("Geçersiz kart ID");
  }
  
  const events = await storage.getWeaveCardTrackingEvents(cardId);
  res.json(events);
}));

export const weavingRouter = router;