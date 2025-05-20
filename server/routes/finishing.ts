/**
 * Terbiye/Apre İşlemleri için API Rotaları
 */

import { Router, Request, Response } from "express";
import { db } from "../db";
import { eq, and, desc, asc } from "drizzle-orm";
import { 
  finishingProcesses, 
  finishingOperations,
  finishingQualityTests,
  finishingRecipes,
  insertFinishingProcessSchema,
  insertFinishingOperationSchema,
  insertFinishingQualityTestSchema,
  insertFinishingRecipeSchema
} from "@shared/schema-updates";

export const finishingRouter = Router();

// Yardımcı fonksiyon - asenkron hata yakalama
const asyncHandler = (fn: (req: Request, res: Response) => Promise<any>) => {
  return (req: Request, res: Response) => {
    Promise.resolve(fn(req, res)).catch(err => {
      console.error("Terbiye/Apre API Hatası:", err);
      res.status(500).json({ 
        error: "İşlem sırasında bir hata oluştu",
        details: process.env.NODE_ENV === "development" ? err.message : undefined
      });
    });
  };
};

// Tüm terbiye/apre işlemlerini getir
finishingRouter.get("/processes", asyncHandler(async (req: Request, res: Response) => {
  const { departmentId, status, processType } = req.query;
  
  let query = db.select().from(finishingProcesses);
  
  // Filtreleme
  if (departmentId !== undefined) {
    query = query.where(eq(finishingProcesses.departmentId, Number(departmentId)));
  }
  
  if (status !== undefined) {
    query = query.where(eq(finishingProcesses.status, String(status)));
  }
  
  if (processType !== undefined) {
    query = query.where(eq(finishingProcesses.processType, String(processType)));
  }
  
  // Tarihe göre sırala
  query = query.orderBy(desc(finishingProcesses.createdAt));
  
  const processes = await query;
  res.json(processes);
}));

// Tek bir terbiye/apre işlemini getir
finishingRouter.get("/processes/:id", asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const processId = parseInt(id);
  
  if (isNaN(processId)) {
    return res.status(400).json({ error: "Geçersiz ID formatı" });
  }
  
  const [process] = await db
    .select()
    .from(finishingProcesses)
    .where(eq(finishingProcesses.id, processId));
  
  if (!process) {
    return res.status(404).json({ error: "İşlem bulunamadı" });
  }
  
  res.json(process);
}));

// Yeni terbiye/apre işlemi oluştur
finishingRouter.post("/processes", asyncHandler(async (req: Request, res: Response) => {
  // Veri validasyonu
  try {
    const processData = req.body;
    
    // İşlem kodu oluştur
    const timestamp = new Date();
    const dateStr = `${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, '0')}${String(timestamp.getDate()).padStart(2, '0')}`;
    const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const processCode = `TRB-${dateStr}-${randomPart}`;
    
    const [process] = await db.insert(finishingProcesses)
      .values({
        ...processData,
        processCode,
        createdAt: timestamp,
        updatedAt: timestamp
      })
      .returning();
    
    res.status(201).json(process);
  } catch (error) {
    res.status(400).json({ error: "Geçersiz veri formatı", details: (error as Error).message });
  }
}));

// Terbiye/apre işlemini güncelle
finishingRouter.put("/processes/:id", asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const processId = parseInt(id);
  
  if (isNaN(processId)) {
    return res.status(400).json({ error: "Geçersiz ID formatı" });
  }
  
  try {
    const processData = req.body;
    
    const [updatedProcess] = await db.update(finishingProcesses)
      .set({
        ...processData,
        updatedAt: new Date()
      })
      .where(eq(finishingProcesses.id, processId))
      .returning();
    
    if (!updatedProcess) {
      return res.status(404).json({ error: "İşlem bulunamadı" });
    }
    
    res.json(updatedProcess);
  } catch (error) {
    res.status(400).json({ error: "Geçersiz veri formatı", details: (error as Error).message });
  }
}));

// Terbiye/apre işlemi durumunu güncelle
finishingRouter.patch("/processes/:id/status", asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const processId = parseInt(id);
  
  if (isNaN(processId)) {
    return res.status(400).json({ error: "Geçersiz ID formatı" });
  }
  
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: "Durum bilgisi zorunludur" });
  }
  
  const [updatedProcess] = await db.update(finishingProcesses)
    .set({
      status,
      updatedAt: new Date()
    })
    .where(eq(finishingProcesses.id, processId))
    .returning();
  
  if (!updatedProcess) {
    return res.status(404).json({ error: "İşlem bulunamadı" });
  }
  
  res.json(updatedProcess);
}));

// Terbiye/apre işlemini sil
finishingRouter.delete("/processes/:id", asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const processId = parseInt(id);
  
  if (isNaN(processId)) {
    return res.status(400).json({ error: "Geçersiz ID formatı" });
  }
  
  // Önce ilgili operasyonları, testleri ve reçeteleri sil
  await db.delete(finishingOperations)
    .where(eq(finishingOperations.processId, processId));
  
  await db.delete(finishingQualityTests)
    .where(eq(finishingQualityTests.processId, processId));
  
  await db.delete(finishingRecipes)
    .where(eq(finishingRecipes.processId, processId));
  
  // Sonra işlemi sil
  const [deletedProcess] = await db.delete(finishingProcesses)
    .where(eq(finishingProcesses.id, processId))
    .returning();
  
  if (!deletedProcess) {
    return res.status(404).json({ error: "İşlem bulunamadı" });
  }
  
  res.json({ success: true, message: "İşlem ve ilgili kayıtlar başarıyla silindi" });
}));

// İşleme ait operasyonları getir
finishingRouter.get("/processes/:id/operations", asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const processId = parseInt(id);
  
  if (isNaN(processId)) {
    return res.status(400).json({ error: "Geçersiz ID formatı" });
  }
  
  const operations = await db
    .select()
    .from(finishingOperations)
    .where(eq(finishingOperations.processId, processId))
    .orderBy(asc(finishingOperations.sequenceNumber));
  
  res.json(operations);
}));

// İşleme yeni operasyon ekle
finishingRouter.post("/processes/:id/operations", asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const processId = parseInt(id);
  
  if (isNaN(processId)) {
    return res.status(400).json({ error: "Geçersiz ID formatı" });
  }
  
  try {
    const operationData = req.body;
    
    // İşlemin var olduğunu kontrol et
    const [process] = await db
      .select()
      .from(finishingProcesses)
      .where(eq(finishingProcesses.id, processId));
    
    if (!process) {
      return res.status(404).json({ error: "İşlem bulunamadı" });
    }
    
    const timestamp = new Date();
    
    const [operation] = await db.insert(finishingOperations)
      .values({
        ...operationData,
        processId,
        createdAt: timestamp,
        updatedAt: timestamp
      })
      .returning();
    
    res.status(201).json(operation);
  } catch (error) {
    res.status(400).json({ error: "Geçersiz veri formatı", details: (error as Error).message });
  }
}));

// Operasyonu güncelle
finishingRouter.put("/operations/:id", asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const operationId = parseInt(id);
  
  if (isNaN(operationId)) {
    return res.status(400).json({ error: "Geçersiz ID formatı" });
  }
  
  try {
    const operationData = req.body;
    
    const [updatedOperation] = await db.update(finishingOperations)
      .set({
        ...operationData,
        updatedAt: new Date()
      })
      .where(eq(finishingOperations.id, operationId))
      .returning();
    
    if (!updatedOperation) {
      return res.status(404).json({ error: "Operasyon bulunamadı" });
    }
    
    res.json(updatedOperation);
  } catch (error) {
    res.status(400).json({ error: "Geçersiz veri formatı", details: (error as Error).message });
  }
}));

// Operasyonu sil
finishingRouter.delete("/operations/:id", asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const operationId = parseInt(id);
  
  if (isNaN(operationId)) {
    return res.status(400).json({ error: "Geçersiz ID formatı" });
  }
  
  const [deletedOperation] = await db.delete(finishingOperations)
    .where(eq(finishingOperations.id, operationId))
    .returning();
  
  if (!deletedOperation) {
    return res.status(404).json({ error: "Operasyon bulunamadı" });
  }
  
  res.json({ success: true, message: "Operasyon başarıyla silindi" });
}));

// İşleme ait kalite testlerini getir
finishingRouter.get("/processes/:id/quality-tests", asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const processId = parseInt(id);
  
  if (isNaN(processId)) {
    return res.status(400).json({ error: "Geçersiz ID formatı" });
  }
  
  const tests = await db
    .select()
    .from(finishingQualityTests)
    .where(eq(finishingQualityTests.processId, processId))
    .orderBy(desc(finishingQualityTests.testDate));
  
  res.json(tests);
}));

// İşleme yeni kalite testi ekle
finishingRouter.post("/processes/:id/quality-tests", asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const processId = parseInt(id);
  
  if (isNaN(processId)) {
    return res.status(400).json({ error: "Geçersiz ID formatı" });
  }
  
  try {
    const testData = req.body;
    
    // İşlemin var olduğunu kontrol et
    const [process] = await db
      .select()
      .from(finishingProcesses)
      .where(eq(finishingProcesses.id, processId));
    
    if (!process) {
      return res.status(404).json({ error: "İşlem bulunamadı" });
    }
    
    const timestamp = new Date();
    
    const [test] = await db.insert(finishingQualityTests)
      .values({
        ...testData,
        processId,
        testDate: testData.testDate || timestamp,
        createdAt: timestamp,
        updatedAt: timestamp
      })
      .returning();
    
    res.status(201).json(test);
  } catch (error) {
    res.status(400).json({ error: "Geçersiz veri formatı", details: (error as Error).message });
  }
}));

// İşleme ait reçeteleri getir
finishingRouter.get("/processes/:id/recipes", asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const processId = parseInt(id);
  
  if (isNaN(processId)) {
    return res.status(400).json({ error: "Geçersiz ID formatı" });
  }
  
  const recipes = await db
    .select()
    .from(finishingRecipes)
    .where(eq(finishingRecipes.processId, processId))
    .orderBy(asc(finishingRecipes.applicationOrder));
  
  res.json(recipes);
}));

// İşleme yeni reçete ekle
finishingRouter.post("/processes/:id/recipes", asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const processId = parseInt(id);
  
  if (isNaN(processId)) {
    return res.status(400).json({ error: "Geçersiz ID formatı" });
  }
  
  try {
    const recipeData = req.body;
    
    // İşlemin var olduğunu kontrol et
    const [process] = await db
      .select()
      .from(finishingProcesses)
      .where(eq(finishingProcesses.id, processId));
    
    if (!process) {
      return res.status(404).json({ error: "İşlem bulunamadı" });
    }
    
    const timestamp = new Date();
    
    // Reçete kodu oluştur (eğer yoksa)
    let recipeCode = recipeData.recipeCode;
    if (!recipeCode) {
      const dateStr = `${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, '0')}${String(timestamp.getDate()).padStart(2, '0')}`;
      const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      recipeCode = `REC-${dateStr}-${randomPart}`;
    }
    
    const [recipe] = await db.insert(finishingRecipes)
      .values({
        ...recipeData,
        recipeCode,
        processId,
        createdAt: timestamp,
        updatedAt: timestamp
      })
      .returning();
    
    res.status(201).json(recipe);
  } catch (error) {
    res.status(400).json({ error: "Geçersiz veri formatı", details: (error as Error).message });
  }
}));