import { Router } from "express";
import { storage } from "../storage";
import { asyncHandler } from "../utils/async-handler";
import { z } from "zod";
import { insertFabricSampleSchema, insertFabricSampleApprovalSchema } from "@shared/schema";

const router = Router();

// Kumaş numunelerini getir
router.get("/samples", asyncHandler(async (req, res) => {
  const samples = await storage.getFabricSamples();
  res.json(samples);
}));

// Tek bir kumaş numunesini getir
router.get("/samples/:id", asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new Error("Geçersiz numune ID");
  }
  
  const sample = await storage.getFabricSampleById(id);
  if (!sample) {
    return res.status(404).json({ message: "Kumaş numunesi bulunamadı" });
  }
  
  res.json(sample);
}));

// Yeni kumaş numunesi oluştur
router.post("/samples", asyncHandler(async (req, res) => {
  // Z şeması ile doğrulama
  const validatedData = insertFabricSampleSchema.parse(req.body);
  
  // Numune kodu oluştur: FSC-yıl-ay-rastgele numara
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  const sampleNumber = `FSC-${year}${month}-${random}`;
  
  // Barkod verisi oluştur - basit olarak kart numarasını kullan
  const barcodeData = sampleNumber;
  
  // Kullanıcı kimliği ve departman bilgilerini ekle
  const userId = req.user?.id || 1;
  const departmentId = req.user?.departmentId || null;
  
  // Numuneyi oluştur
  const sample = await storage.createFabricSample({
    ...validatedData,
    sampleNumber,
    barcodeData,
    status: "draft",
    createdBy: userId,
    createdAt: new Date(),
  });
  
  res.status(201).json(sample);
}));

// Numune durumunu güncelle
router.put("/samples/:id/status", asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new Error("Geçersiz numune ID");
  }
  
  const { status } = req.body;
  if (!status) {
    throw new Error("Durum bilgisi gerekli");
  }
  
  const sample = await storage.updateFabricSampleStatus(id, status);
  if (!sample) {
    return res.status(404).json({ message: "Kumaş numunesi bulunamadı" });
  }
  
  res.json(sample);
}));

// Numune onay bilgilerini ekle
router.post("/samples/:id/approvals", asyncHandler(async (req, res) => {
  const sampleId = parseInt(req.params.id);
  if (isNaN(sampleId)) {
    throw new Error("Geçersiz numune ID");
  }
  
  // Z şeması ile doğrulama
  const validatedData = insertFabricSampleApprovalSchema.parse({
    ...req.body,
    sampleId,
  });
  
  const userId = req.user?.id || 1;
  
  // Onay ekle
  const approval = await storage.createFabricSampleApproval({
    ...validatedData,
    userId,
    createdAt: new Date(),
  });
  
  // Numune durumunu güncelle
  if (validatedData.approved) {
    await storage.updateFabricSampleStatus(sampleId, "approved");
  } else {
    await storage.updateFabricSampleStatus(sampleId, "rejected");
  }
  
  res.status(201).json(approval);
}));

// Numune onaylarını getir
router.get("/samples/:id/approvals", asyncHandler(async (req, res) => {
  const sampleId = parseInt(req.params.id);
  if (isNaN(sampleId)) {
    throw new Error("Geçersiz numune ID");
  }
  
  const approvals = await storage.getFabricSampleApprovals(sampleId);
  res.json(approvals);
}));

export const fabricSamplesRouter = router;