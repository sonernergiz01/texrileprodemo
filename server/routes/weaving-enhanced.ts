/**
 * Dokuma İşlemleri için Gelişmiş API Rotaları
 * Bu dosya, dokuma süreçleri ile terbiye/apre süreçleri arasındaki
 * entegrasyonu sağlayan API endpoint'lerini içerir.
 */

import { Router, Request, Response } from "express";
import { db } from "../db";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { 
  weavingOrders,
  processTransfers,
  finishingProcesses,
  insertProcessTransferSchema
} from "@shared/schema-updates";

export const weavingEnhancedRouter = Router();

// Yardımcı fonksiyon - asenkron hata yakalama
const asyncHandler = (fn: (req: Request, res: Response) => Promise<any>) => {
  return (req: Request, res: Response) => {
    Promise.resolve(fn(req, res)).catch(err => {
      console.error("Dokuma Entegrasyon API Hatası:", err);
      res.status(500).json({ 
        error: "İşlem sırasında bir hata oluştu",
        details: process.env.NODE_ENV === "development" ? err.message : undefined
      });
    });
  };
};

// Dokuma sürecinden terbiye sürecine transfer oluştur
weavingEnhancedRouter.post("/transfers", asyncHandler(async (req: Request, res: Response) => {
  try {
    const transferData = req.body;
    
    // Kaynak dokuma işlemini kontrol et
    const sourceId = transferData.sourceProcessId;
    const [sourceProcess] = await db
      .select()
      .from(weavingOrders)
      .where(eq(weavingOrders.id, sourceId));
    
    if (!sourceProcess) {
      return res.status(404).json({ error: "Kaynak dokuma işlemi bulunamadı" });
    }
    
    // Transfer miktarı geçerli mi kontrol et
    const { quantity } = transferData;
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      return res.status(400).json({ error: "Geçersiz transfer miktarı" });
    }
    
    const timestamp = new Date();
    
    // Önce transfer kaydı oluştur
    const [transfer] = await db.insert(processTransfers)
      .values({
        ...transferData,
        sourceProcessType: "weaving",
        transferDate: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp
      })
      .returning();
    
    // Eğer hedef terbiye işlemi oluşturulacaksa
    if (transferData.createTarget) {
      const dateStr = `${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, '0')}${String(timestamp.getDate()).padStart(2, '0')}`;
      const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const processCode = `TRB-${dateStr}-${randomPart}`;
      
      // Terbiye işlemi oluştur
      const [targetProcess] = await db.insert(finishingProcesses)
        .values({
          processCode,
          departmentId: transferData.targetDepartmentId,
          processType: transferData.targetProcessType || "finishing",
          fabricType: sourceProcess.fabricType,
          color: sourceProcess.color,
          quantity: Number(quantity),
          unit: transferData.unit || sourceProcess.unit,
          status: "planned",
          sourceOrderId: sourceProcess.id,
          sourceOrderType: "weaving",
          transferId: transfer.id,
          qualityRequirements: sourceProcess.properties ? JSON.parse(JSON.stringify(sourceProcess.properties)) : null,
          notes: `Dokuma işleminden (ID: ${sourceProcess.id}, Sipariş No: ${sourceProcess.orderNumber}) transfer edildi.`,
          createdAt: timestamp,
          updatedAt: timestamp
        })
        .returning();
      
      // Transfer kaydını güncelle
      await db.update(processTransfers)
        .set({
          targetProcessId: targetProcess.id,
          targetProcessType: "finishing",
          updatedAt: timestamp
        })
        .where(eq(processTransfers.id, transfer.id));
      
      // Güncel transfer kaydını al
      const [updatedTransfer] = await db
        .select()
        .from(processTransfers)
        .where(eq(processTransfers.id, transfer.id));
      
      return res.status(201).json({
        transfer: updatedTransfer,
        targetProcess
      });
    }
    
    res.status(201).json({ transfer });
  } catch (error) {
    res.status(400).json({ error: "Geçersiz veri formatı", details: (error as Error).message });
  }
}));

// Bir dokuma sürecinin tüm transferlerini listele
weavingEnhancedRouter.get("/weaving/:id/transfers", asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const weavingId = parseInt(id);
  
  if (isNaN(weavingId)) {
    return res.status(400).json({ error: "Geçersiz ID formatı" });
  }
  
  // Önce dokuma işleminin var olduğunu kontrol et
  const [weavingOrder] = await db
    .select()
    .from(weavingOrders)
    .where(eq(weavingOrders.id, weavingId));
  
  if (!weavingOrder) {
    return res.status(404).json({ error: "Dokuma işlemi bulunamadı" });
  }
  
  // Bu dokuma işleminden yapılan tüm transferleri getir
  const transfers = await db
    .select()
    .from(processTransfers)
    .where(and(
      eq(processTransfers.sourceProcessId, weavingId),
      eq(processTransfers.sourceProcessType, "weaving")
    ))
    .orderBy(desc(processTransfers.transferDate));
  
  // Hedef işlem detaylarını da getir
  const transfersWithTargets = await Promise.all(transfers.map(async (transfer) => {
    if (transfer.targetProcessId && transfer.targetProcessType === "finishing") {
      const [targetProcess] = await db
        .select()
        .from(finishingProcesses)
        .where(eq(finishingProcesses.id, transfer.targetProcessId));
      
      return {
        ...transfer,
        targetProcess: targetProcess || null
      };
    }
    
    return {
      ...transfer,
      targetProcess: null
    };
  }));
  
  res.json(transfersWithTargets);
}));

// Tek bir transfer detayını getir
weavingEnhancedRouter.get("/transfers/:id", asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const transferId = parseInt(id);
  
  if (isNaN(transferId)) {
    return res.status(400).json({ error: "Geçersiz ID formatı" });
  }
  
  // Transfer kaydını getir
  const [transfer] = await db
    .select()
    .from(processTransfers)
    .where(eq(processTransfers.id, transferId));
  
  if (!transfer) {
    return res.status(404).json({ error: "Transfer kaydı bulunamadı" });
  }
  
  // Kaynak ve hedef işlem detaylarını getir
  let sourceProcess = null;
  let targetProcess = null;
  
  if (transfer.sourceProcessType === "weaving") {
    const [source] = await db
      .select()
      .from(weavingOrders)
      .where(eq(weavingOrders.id, transfer.sourceProcessId));
    
    sourceProcess = source;
  }
  
  if (transfer.targetProcessId && transfer.targetProcessType === "finishing") {
    const [target] = await db
      .select()
      .from(finishingProcesses)
      .where(eq(finishingProcesses.id, transfer.targetProcessId));
    
    targetProcess = target;
  }
  
  res.json({
    transfer,
    sourceProcess,
    targetProcess
  });
}));

// Transfer kaydını güncelle
weavingEnhancedRouter.put("/transfers/:id", asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const transferId = parseInt(id);
  
  if (isNaN(transferId)) {
    return res.status(400).json({ error: "Geçersiz ID formatı" });
  }
  
  try {
    const updateData = req.body;
    
    // Önce transfer kaydının var olduğunu kontrol et
    const [existingTransfer] = await db
      .select()
      .from(processTransfers)
      .where(eq(processTransfers.id, transferId));
    
    if (!existingTransfer) {
      return res.status(404).json({ error: "Transfer kaydı bulunamadı" });
    }
    
    // Transfer kaydını güncelle
    const [updatedTransfer] = await db.update(processTransfers)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(processTransfers.id, transferId))
      .returning();
    
    // Hedef terbiye işlemi de varsa, onu da güncelle
    if (updatedTransfer.targetProcessId && updatedTransfer.targetProcessType === "finishing") {
      if (updateData.quantity) {
        await db.update(finishingProcesses)
          .set({
            quantity: Number(updateData.quantity),
            updatedAt: new Date()
          })
          .where(eq(finishingProcesses.id, updatedTransfer.targetProcessId));
      }
      
      // Güncel hedef işlem bilgilerini getir
      const [targetProcess] = await db
        .select()
        .from(finishingProcesses)
        .where(eq(finishingProcesses.id, updatedTransfer.targetProcessId));
      
      return res.json({
        transfer: updatedTransfer,
        targetProcess
      });
    }
    
    res.json({ transfer: updatedTransfer });
  } catch (error) {
    res.status(400).json({ error: "Geçersiz veri formatı", details: (error as Error).message });
  }
}));