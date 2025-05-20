import { Router } from "express";
import { storage } from "../storage";
import { asyncHandler } from "../utils/async-handler";
import { z } from "zod";
import { insertYarnIssueCardSchema } from "@shared/schema";

const router = Router();

// İplik çıkış kartlarını getir
router.get("/issue-cards", asyncHandler(async (req, res) => {
  const cards = await storage.getYarnIssueCards();
  res.json(cards);
}));

// Tek bir iplik çıkış kartını getir
router.get("/issue-cards/:id", asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new Error("Geçersiz kart ID");
  }
  
  const card = await storage.getYarnIssueCardById(id);
  if (!card) {
    return res.status(404).json({ message: "Çıkış kartı bulunamadı" });
  }
  
  res.json(card);
}));

// Barkod ile iplik çıkış kartı getir
router.get("/issue-cards/barcode/:barcodeData", asyncHandler(async (req, res) => {
  const { barcodeData } = req.params;
  
  const card = await storage.getYarnIssueCardByBarcode(barcodeData);
  if (!card) {
    return res.status(404).json({ message: "Çıkış kartı bulunamadı" });
  }
  
  res.json(card);
}));

// Yeni iplik çıkış kartı oluştur
router.post("/issue-cards", asyncHandler(async (req, res) => {
  // Z şeması ile doğrulama
  const validatedData = insertYarnIssueCardSchema.parse(req.body);
  
  // Kart numarası oluştur: YIC-yıl-ay-rastgele numara
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  const cardNumber = `YIC-${year}${month}-${random}`;
  
  // Barkod verisi oluştur (basit versiyonu)
  const barcodeData = cardNumber;
  
  // Kullanıcı kimliği ve departman bilgilerini ekle
  const userId = req.user?.id || 1;
  const departmentId = req.user?.departmentId || null;
  
  // Siparişe bağlıysa sipariş numarasını al
  let orderNumber = null;
  if (validatedData.orderId) {
    const order = await storage.getOrderById(validatedData.orderId);
    if (order) {
      orderNumber = order.orderNumber;
    }
  }
  
  // Kartı oluştur
  const card = await storage.createYarnIssueCard({
    ...validatedData,
    cardNumber,
    barcodeData,
    orderNumber,
    status: "created",
    userId,
    departmentId,
    createdAt: new Date(),
  });
  
  res.status(201).json(card);
}));

// Kart durumunu güncelle
router.put("/issue-cards/:id/status", asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new Error("Geçersiz kart ID");
  }
  
  const { status } = req.body;
  if (!status) {
    throw new Error("Durum bilgisi gerekli");
  }
  
  const card = await storage.updateYarnIssueCardStatus(id, status);
  if (!card) {
    return res.status(404).json({ message: "Çıkış kartı bulunamadı" });
  }
  
  res.json(card);
}));

// İplik Hareketlerini getir
router.get("/movements", asyncHandler(async (req, res) => {
  const movements = await storage.getYarnMovements();
  res.json(movements);
}));

// Yeni iplik hareketi ekle
router.post("/movements", asyncHandler(async (req, res) => {
  const { yarnTypeId, quantity, direction, sourceLocation, targetLocation, issueCardId, notes } = req.body;
  
  if (!yarnTypeId || !quantity || !direction) {
    throw new Error("İplik tipi, miktar ve yön bilgileri gereklidir");
  }
  
  const userId = req.user?.id || 1;
  
  const movement = await storage.createYarnMovement({
    yarnTypeId,
    quantity,
    direction,
    sourceLocation: sourceLocation || null,
    targetLocation: targetLocation || null,
    issueCardId: issueCardId || null,
    notes: notes || null,
    userId,
    timestamp: new Date(),
  });
  
  // İplik envanterini güncelle
  if (direction === "out") {
    await storage.updateYarnInventory(yarnTypeId, -quantity);
  } else if (direction === "in") {
    await storage.updateYarnInventory(yarnTypeId, quantity);
  }
  
  res.status(201).json(movement);
}));

// İplik Envanterini getir
router.get("/inventory", asyncHandler(async (req, res) => {
  const inventory = await storage.getYarnInventory();
  res.json(inventory);
}));

// İplik tipleri getir
router.get("/yarn-types", asyncHandler(async (req, res) => {
  const yarnTypes = await storage.getYarnTypes();
  res.json(yarnTypes);
}));

export const yarnWarehouseRouter = router;