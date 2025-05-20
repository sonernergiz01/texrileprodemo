import { Router } from "express";
import { storage } from "../storage";
import { asyncHandler } from "../utils/async-handler";
import { 
  insertSampleRequestSchema, 
  insertSampleOrderSchema,
  insertSampleProductionStepSchema,
  insertSampleCardSchema,
  insertSampleCardMovementSchema,
  insertSampleFeedbackSchema
} from "@shared/schema";

const router = Router();

// Numune Talepleri (Sample Requests) Rotaları
router.get("/requests", asyncHandler(async (req, res) => {
  const { customerId, status } = req.query;
  const options: { customerId?: number; status?: string } = {};
  
  if (customerId) {
    options.customerId = Number(customerId);
  }
  
  if (status) {
    options.status = String(status);
  }
  
  const sampleRequests = await storage.getSampleRequests(options);
  res.json(sampleRequests);
}));

router.get("/requests/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const sampleRequest = await storage.getSampleRequestById(id);
  
  if (!sampleRequest) {
    return res.status(404).json({ error: "Numune talebi bulunamadı" });
  }
  
  res.json(sampleRequest);
}));

router.post("/requests", asyncHandler(async (req, res) => {
  try {
    // Tarihleri uygun formata dönüştür
    let requestData = { ...req.body };
    
    // dueDate alanı varsa ve string ise, Date nesnesine dönüştür
    if (requestData.dueDate && typeof requestData.dueDate === 'string') {
      requestData.dueDate = new Date(requestData.dueDate);
    }
    
    // targetDeliveryDate alanı varsa ve string ise, Date nesnesine dönüştür
    if (requestData.targetDeliveryDate && typeof requestData.targetDeliveryDate === 'string') {
      requestData.targetDeliveryDate = new Date(requestData.targetDeliveryDate);
    }
    
    // Veriyi doğrula
    const validatedData = insertSampleRequestSchema.parse(requestData);
    
    // Veritabanına kaydet
    const sampleRequest = await storage.createSampleRequest(validatedData);
    res.status(201).json(sampleRequest);
  } catch (error: any) {
    console.error("Numune talebi oluşturma hatası:", error);
    res.status(400).json({ 
      message: "Giriş doğrulama hatası", 
      errors: error.errors || [{ message: error.message }] 
    });
  }
}));

router.put("/requests/:id", asyncHandler(async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    // Tarihleri uygun formata dönüştür
    let requestData = { ...req.body };
    
    // dueDate alanı varsa ve string ise, Date nesnesine dönüştür
    if (requestData.dueDate && typeof requestData.dueDate === 'string') {
      requestData.dueDate = new Date(requestData.dueDate);
    }
    
    // targetDeliveryDate alanı varsa ve string ise, Date nesnesine dönüştür
    if (requestData.targetDeliveryDate && typeof requestData.targetDeliveryDate === 'string') {
      requestData.targetDeliveryDate = new Date(requestData.targetDeliveryDate);
    }
    
    // Veriyi doğrula
    const validatedData = insertSampleRequestSchema.partial().parse(requestData);
    const updatedRequest = await storage.updateSampleRequest(id, validatedData);
    
    if (!updatedRequest) {
      return res.status(404).json({ error: "Numune talebi bulunamadı" });
    }
    
    res.json(updatedRequest);
  } catch (error: any) {
    console.error("Numune talebi güncelleme hatası:", error);
    res.status(400).json({ 
      message: "Giriş doğrulama hatası", 
      errors: error.errors || [{ message: error.message }] 
    });
  }
}));

// Numune Siparişleri (Sample Orders) Rotaları
router.get("/orders", asyncHandler(async (req, res) => {
  const { sampleRequestId, status } = req.query;
  const options: { sampleRequestId?: number; status?: string } = {};
  
  if (sampleRequestId) {
    options.sampleRequestId = Number(sampleRequestId);
  }
  
  if (status) {
    options.status = String(status);
  }
  
  const sampleOrders = await storage.getSampleOrders(options);
  res.json(sampleOrders);
}));

router.get("/orders/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const sampleOrder = await storage.getSampleOrderById(id);
  
  if (!sampleOrder) {
    return res.status(404).json({ error: "Numune siparişi bulunamadı" });
  }
  
  res.json(sampleOrder);
}));

router.post("/orders", asyncHandler(async (req, res) => {
  const validatedData = insertSampleOrderSchema.parse(req.body);
  const sampleOrder = await storage.createSampleOrder(validatedData);
  res.status(201).json(sampleOrder);
}));

router.put("/orders/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const validatedData = insertSampleOrderSchema.partial().parse(req.body);
  const updatedOrder = await storage.updateSampleOrder(id, validatedData);
  
  if (!updatedOrder) {
    return res.status(404).json({ error: "Numune siparişi bulunamadı" });
  }
  
  res.json(updatedOrder);
}));

router.put("/orders/:id/status", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  
  if (!status || typeof status !== "string") {
    return res.status(400).json({ error: "Geçerli bir durum belirtilmelidir" });
  }
  
  const updatedOrder = await storage.updateSampleOrderStatus(id, status);
  
  if (!updatedOrder) {
    return res.status(404).json({ error: "Numune siparişi bulunamadı" });
  }
  
  res.json(updatedOrder);
}));

// Numune Üretim Adımları (Sample Production Steps) Rotaları
router.get("/orders/:orderId/steps", asyncHandler(async (req, res) => {
  const orderId = Number(req.params.orderId);
  const steps = await storage.getSampleProductionSteps(orderId);
  res.json(steps);
}));

router.get("/steps/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const step = await storage.getSampleProductionStepById(id);
  
  if (!step) {
    return res.status(404).json({ error: "Üretim adımı bulunamadı" });
  }
  
  res.json(step);
}));

router.post("/orders/:orderId/steps", asyncHandler(async (req, res) => {
  const orderId = Number(req.params.orderId);
  const validatedData = insertSampleProductionStepSchema.parse({
    ...req.body,
    sampleOrderId: orderId
  });
  
  const step = await storage.createSampleProductionStep(validatedData);
  res.status(201).json(step);
}));

router.put("/steps/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const validatedData = insertSampleProductionStepSchema.partial().parse(req.body);
  const updatedStep = await storage.updateSampleProductionStep(id, validatedData);
  
  if (!updatedStep) {
    return res.status(404).json({ error: "Üretim adımı bulunamadı" });
  }
  
  res.json(updatedStep);
}));

router.put("/steps/:id/status", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  
  if (!status || typeof status !== "string") {
    return res.status(400).json({ error: "Geçerli bir durum belirtilmelidir" });
  }
  
  const updatedStep = await storage.updateSampleProductionStepStatus(id, status);
  
  if (!updatedStep) {
    return res.status(404).json({ error: "Üretim adımı bulunamadı" });
  }
  
  res.json(updatedStep);
}));

// Numune Kartları (Sample Cards) Rotaları
router.get("/cards", asyncHandler(async (req, res) => {
  const cards = await storage.getAllSampleCards();
  res.json(cards);
}));

router.get("/orders/:orderId/cards", asyncHandler(async (req, res) => {
  const orderId = Number(req.params.orderId);
  const cards = await storage.getSampleCards(orderId);
  res.json(cards);
}));

router.get("/cards/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const card = await storage.getSampleCardById(id);
  
  if (!card) {
    return res.status(404).json({ error: "Numune kartı bulunamadı" });
  }
  
  res.json(card);
}));

router.get("/cards/barcode/:barcode", asyncHandler(async (req, res) => {
  const barcode = req.params.barcode;
  const card = await storage.getSampleCardByBarcode(barcode);
  
  if (!card) {
    return res.status(404).json({ error: "Numune kartı bulunamadı" });
  }
  
  res.json(card);
}));

router.post("/orders/:orderId/cards", asyncHandler(async (req, res) => {
  const orderId = Number(req.params.orderId);
  const validatedData = insertSampleCardSchema.parse({
    ...req.body,
    sampleOrderId: orderId
  });
  
  const card = await storage.createSampleCard(validatedData);
  res.status(201).json(card);
}));

router.put("/cards/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const validatedData = insertSampleCardSchema.partial().parse(req.body);
  const updatedCard = await storage.updateSampleCard(id, validatedData);
  
  if (!updatedCard) {
    return res.status(404).json({ error: "Numune kartı bulunamadı" });
  }
  
  res.json(updatedCard);
}));

// Numune Kart Hareketleri (Sample Card Movements) Rotaları
router.get("/cards/:cardId/movements", asyncHandler(async (req, res) => {
  const cardId = Number(req.params.cardId);
  const movements = await storage.getSampleCardMovements(cardId);
  res.json(movements);
}));

router.post("/cards/:cardId/movements", asyncHandler(async (req, res) => {
  const cardId = Number(req.params.cardId);
  const validatedData = insertSampleCardMovementSchema.parse({
    ...req.body,
    sampleCardId: cardId
  });
  
  const movement = await storage.createSampleCardMovement(validatedData);
  res.status(201).json(movement);
}));

router.put("/movements/:id/complete", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { notes, defects } = req.body;
  
  const updatedMovement = await storage.completeSampleCardMovement(id, {
    endTime: new Date(),
    notes,
    defects
  });
  
  if (!updatedMovement) {
    return res.status(404).json({ error: "Kart hareketi bulunamadı" });
  }
  
  res.json(updatedMovement);
}));

// Numune Geri Bildirimleri (Sample Feedback) Rotaları
router.get("/orders/:orderId/feedback", asyncHandler(async (req, res) => {
  const orderId = Number(req.params.orderId);
  const feedback = await storage.getSampleFeedback(orderId);
  res.json(feedback);
}));

router.get("/feedback/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const feedback = await storage.getSampleFeedbackById(id);
  
  if (!feedback) {
    return res.status(404).json({ error: "Geri bildirim bulunamadı" });
  }
  
  res.json(feedback);
}));

router.post("/orders/:orderId/feedback", asyncHandler(async (req, res) => {
  const orderId = Number(req.params.orderId);
  const validatedData = insertSampleFeedbackSchema.parse({
    ...req.body,
    sampleOrderId: orderId
  });
  
  const feedback = await storage.createSampleFeedback(validatedData);
  res.status(201).json(feedback);
}));

router.put("/feedback/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const validatedData = insertSampleFeedbackSchema.partial().parse(req.body);
  const updatedFeedback = await storage.updateSampleFeedback(id, validatedData);
  
  if (!updatedFeedback) {
    return res.status(404).json({ error: "Geri bildirim bulunamadı" });
  }
  
  res.json(updatedFeedback);
}));

export default router;