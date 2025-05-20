/**
 * Sipariş - Üretim - Sevkiyat Entegrasyonu API Rotaları
 */

import { Router, Request, Response } from "express";
import { db } from "../db";
import { eq, and, desc, asc, sql, like, not, isNull } from "drizzle-orm";
import { 
  orders,
  orderStatuses,
  productionPlans,
  shipments,
  users 
} from "@shared/schema";

import {
  orderTrackingStatuses,
  orderStatusTransitions,
  orderTracking,
  orderProductionSteps,
  orderShipments,
  orderStatusHistory,
  orderDelayReasons,
  productionPriorityRules,
  orderMaterialRequirements
} from "@shared/schema-orders-integration";

export const ordersIntegrationRouter = Router();

// Yardımcı fonksiyon - asenkron hata yakalama
const asyncHandler = (fn: (req: Request, res: Response) => Promise<any>) => {
  return (req: Request, res: Response) => {
    Promise.resolve(fn(req, res)).catch(err => {
      console.error("Sipariş Entegrasyon API Hatası:", err);
      res.status(500).json({ 
        error: "İşlem sırasında bir hata oluştu",
        details: process.env.NODE_ENV === "development" ? err.message : undefined
      });
    });
  };
};

/**
 * Bir siparişin detaylı takip bilgilerini alır
 * Üretim sürecinin her adımını ve durum değişikliklerini içerir
 */
ordersIntegrationRouter.get("/order-tracking/:id", asyncHandler(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id);
  
  if (isNaN(orderId)) {
    return res.status(400).json({ error: "Geçersiz sipariş ID formatı" });
  }
  
  // Önce siparişi kontrol et
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));
  
  if (!order) {
    return res.status(404).json({ error: "Sipariş bulunamadı" });
  }
  
  // Sipariş takip kayıtlarını getir
  const trackingRecords = await db
    .select({
      id: orderTracking.id,
      orderId: orderTracking.orderId,
      statusId: orderTracking.statusId,
      statusName: orderTrackingStatuses.name,
      statusCode: orderTrackingStatuses.code,
      statusColor: orderTrackingStatuses.color,
      note: orderTracking.note,
      timestamp: orderTracking.timestamp,
      userId: orderTracking.userId,
      userName: users.fullName,
      productionPlanId: orderTracking.productionPlanId,
      shipmentId: orderTracking.shipmentId,
      data: orderTracking.data
    })
    .from(orderTracking)
    .innerJoin(orderTrackingStatuses, eq(orderTracking.statusId, orderTrackingStatuses.id))
    .leftJoin(users, eq(orderTracking.userId, users.id))
    .where(eq(orderTracking.orderId, orderId))
    .orderBy(desc(orderTracking.timestamp));
  
  // Üretim adımlarını getir
  const productionSteps = await db
    .select({
      id: orderProductionSteps.id,
      orderId: orderProductionSteps.orderId,
      productionPlanId: orderProductionSteps.productionPlanId,
      step: orderProductionSteps.step,
      stepOrder: orderProductionSteps.stepOrder,
      departmentId: orderProductionSteps.departmentId,
      departmentName: sql<string>`(SELECT name FROM departments WHERE id = ${orderProductionSteps.departmentId})`,
      startDate: orderProductionSteps.startDate,
      endDate: orderProductionSteps.endDate,
      status: orderProductionSteps.status,
      completionPercentage: orderProductionSteps.completionPercentage,
      notes: orderProductionSteps.notes,
      updatedAt: orderProductionSteps.updatedAt,
      updatedBy: orderProductionSteps.updatedBy,
      updatedByName: sql<string>`(SELECT full_name FROM users WHERE id = ${orderProductionSteps.updatedBy})`
    })
    .from(orderProductionSteps)
    .where(eq(orderProductionSteps.orderId, orderId))
    .orderBy(asc(orderProductionSteps.stepOrder));
  
  // Sevkiyat bilgilerini getir
  const shipmentRecords = await db
    .select({
      id: orderShipments.id,
      orderId: orderShipments.orderId,
      shipmentId: orderShipments.shipmentId,
      shipmentNo: shipments.shipmentNo,
      quantity: orderShipments.quantity,
      unit: orderShipments.unit,
      packageCount: orderShipments.packageCount,
      palletCount: orderShipments.palletCount,
      grossWeight: orderShipments.grossWeight,
      netWeight: orderShipments.netWeight,
      volumeM3: orderShipments.volumeM3,
      isComplete: orderShipments.isComplete,
      notes: orderShipments.notes,
      createdAt: orderShipments.createdAt,
      shipmentDate: shipments.actualDate,
      shipmentStatus: shipments.status
    })
    .from(orderShipments)
    .leftJoin(shipments, eq(orderShipments.shipmentId, shipments.id))
    .where(eq(orderShipments.orderId, orderId));
  
  // Durum değişikliği geçmişini getir
  const statusHistory = await db
    .select({
      id: orderStatusHistory.id,
      orderId: orderStatusHistory.orderId,
      oldStatusId: orderStatusHistory.oldStatusId,
      oldStatusName: sql<string>`(SELECT name FROM order_statuses WHERE id = ${orderStatusHistory.oldStatusId})`,
      newStatusId: orderStatusHistory.newStatusId,
      newStatusName: sql<string>`(SELECT name FROM order_statuses WHERE id = ${orderStatusHistory.newStatusId})`,
      changeDate: orderStatusHistory.changeDate,
      userId: orderStatusHistory.userId,
      userName: users.fullName,
      reason: orderStatusHistory.reason,
      notes: orderStatusHistory.notes
    })
    .from(orderStatusHistory)
    .leftJoin(users, eq(orderStatusHistory.userId, users.id))
    .where(eq(orderStatusHistory.orderId, orderId))
    .orderBy(desc(orderStatusHistory.changeDate));
  
  // Ertelenme/iptal nedenlerini getir
  const delayReasons = await db
    .select({
      id: orderDelayReasons.id,
      orderId: orderDelayReasons.orderId,
      reason: orderDelayReasons.reason,
      description: orderDelayReasons.description,
      delayDays: orderDelayReasons.delayDays,
      newDueDate: orderDelayReasons.newDueDate,
      isCancelled: orderDelayReasons.isCancelled,
      reportedBy: orderDelayReasons.reportedBy,
      reportedByName: sql<string>`(SELECT full_name FROM users WHERE id = ${orderDelayReasons.reportedBy})`,
      reportedDate: orderDelayReasons.reportedDate,
      approvedBy: orderDelayReasons.approvedBy,
      approvedByName: sql<string>`(SELECT full_name FROM users WHERE id = ${orderDelayReasons.approvedBy})`,
      approvedDate: orderDelayReasons.approvedDate
    })
    .from(orderDelayReasons)
    .where(eq(orderDelayReasons.orderId, orderId))
    .orderBy(desc(orderDelayReasons.reportedDate));
  
  // Malzeme ihtiyaçlarını getir
  const materialRequirements = await db
    .select()
    .from(orderMaterialRequirements)
    .where(eq(orderMaterialRequirements.orderId, orderId))
    .orderBy(asc(orderMaterialRequirements.materialType));
  
  // Müşteri bilgilerini getir
  const customerInfo = await db.execute(sql`
    SELECT c.* 
    FROM customers c
    JOIN orders o ON o.customer_id = c.id
    WHERE o.id = ${orderId}
  `);
  
  // Tüm verileri birleştir
  res.json({
    order,
    tracking: {
      records: trackingRecords,
      currentStatus: trackingRecords.length > 0 ? trackingRecords[0] : null
    },
    production: {
      steps: productionSteps,
      currentStep: productionSteps.find(step => step.status === 'in-progress') || 
                  productionSteps.find(step => step.status === 'pending')
    },
    shipments: shipmentRecords,
    statusHistory,
    delayReasons,
    materialRequirements,
    customer: customerInfo.length > 0 ? customerInfo[0] : null
  });
}));

/**
 * Mevcut sipariş takip durumlarını listeler
 */
ordersIntegrationRouter.get("/tracking-statuses", asyncHandler(async (req: Request, res: Response) => {
  const statuses = await db
    .select()
    .from(orderTrackingStatuses)
    .where(eq(orderTrackingStatuses.isActive, true))
    .orderBy(asc(orderTrackingStatuses.sequence));
  
  res.json(statuses);
}));

/**
 * Belirli bir durum için geçiş yapılabilecek durumları listeler
 */
ordersIntegrationRouter.get("/status-transitions/:statusId", asyncHandler(async (req: Request, res: Response) => {
  const statusId = parseInt(req.params.statusId);
  
  if (isNaN(statusId)) {
    return res.status(400).json({ error: "Geçersiz durum ID formatı" });
  }
  
  const transitions = await db
    .select({
      id: orderStatusTransitions.id,
      fromStatusId: orderStatusTransitions.fromStatusId,
      fromStatusName: sql<string>`(SELECT name FROM order_tracking_statuses WHERE id = ${orderStatusTransitions.fromStatusId})`,
      fromStatusCode: sql<string>`(SELECT code FROM order_tracking_statuses WHERE id = ${orderStatusTransitions.fromStatusId})`,
      toStatusId: orderStatusTransitions.toStatusId,
      toStatusName: sql<string>`(SELECT name FROM order_tracking_statuses WHERE id = ${orderStatusTransitions.toStatusId})`,
      toStatusCode: sql<string>`(SELECT code FROM order_tracking_statuses WHERE id = ${orderStatusTransitions.toStatusId})`,
      description: orderStatusTransitions.description,
      isAutomated: orderStatusTransitions.isAutomated,
      requiredPermission: orderStatusTransitions.requiredPermission
    })
    .from(orderStatusTransitions)
    .where(eq(orderStatusTransitions.fromStatusId, statusId));
  
  res.json(transitions);
}));

/**
 * Sipariş durumunu günceller ve takip kaydı oluşturur
 */
ordersIntegrationRouter.post("/order-status-update/:id", asyncHandler(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id);
  
  if (isNaN(orderId)) {
    return res.status(400).json({ error: "Geçersiz sipariş ID formatı" });
  }
  
  const { statusId, note, productionPlanId, shipmentId, data } = req.body;
  
  if (!statusId) {
    return res.status(400).json({ error: "Durum ID'si zorunludur" });
  }
  
  // Siparişi kontrol et
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));
  
  if (!order) {
    return res.status(404).json({ error: "Sipariş bulunamadı" });
  }
  
  // Durumu kontrol et
  const [status] = await db
    .select()
    .from(orderTrackingStatuses)
    .where(eq(orderTrackingStatuses.id, statusId));
  
  if (!status) {
    return res.status(404).json({ error: "Durum bulunamadı" });
  }
  
  // Takip kaydı oluştur
  const [trackingRecord] = await db
    .insert(orderTracking)
    .values({
      orderId,
      statusId,
      note: note || null,
      timestamp: new Date(),
      userId: req.user?.id || 1, // Varsayılan olarak sistemi kullan
      productionPlanId: productionPlanId || null,
      shipmentId: shipmentId || null,
      data: data || null
    })
    .returning();
  
  // Sipariş durumunu güncelle (orderStatuses ve orders tabloları arasındaki ilişki)
  // Burada takip durumunu ilgili sipariş durumuna çevirme mantığı eklenebilir
  
  res.status(201).json(trackingRecord);
}));

/**
 * Sipariş üretim adımı ekler veya günceller
 */
ordersIntegrationRouter.post("/production-step/:orderId", asyncHandler(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.orderId);
  
  if (isNaN(orderId)) {
    return res.status(400).json({ error: "Geçersiz sipariş ID formatı" });
  }
  
  const stepData = req.body;
  
  if (!stepData.productionPlanId || !stepData.step || !stepData.departmentId) {
    return res.status(400).json({ error: "Eksik veri. productionPlanId, step ve departmentId zorunludur" });
  }
  
  // Siparişi kontrol et
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));
  
  if (!order) {
    return res.status(404).json({ error: "Sipariş bulunamadı" });
  }
  
  // Üretim adımını oluştur veya güncelle
  let productionStep;
  
  if (stepData.id) {
    // Güncelleme
    const [updated] = await db
      .update(orderProductionSteps)
      .set({
        ...stepData,
        updatedAt: new Date(),
        updatedBy: req.user?.id || 1
      })
      .where(eq(orderProductionSteps.id, stepData.id))
      .returning();
    
    productionStep = updated;
  } else {
    // Yeni oluşturma
    const [created] = await db
      .insert(orderProductionSteps)
      .values({
        orderId,
        productionPlanId: stepData.productionPlanId,
        step: stepData.step,
        stepOrder: stepData.stepOrder || 1,
        departmentId: stepData.departmentId,
        plannedStartDate: stepData.plannedStartDate,
        plannedEndDate: stepData.plannedEndDate,
        actualStartDate: stepData.actualStartDate,
        actualEndDate: stepData.actualEndDate,
        machineId: stepData.machineId,
        status: stepData.status || "pending",
        notes: stepData.notes,
        completionPercentage: stepData.completionPercentage || 0,
        updatedAt: new Date(),
        updatedBy: req.user?.id || 1
      })
      .returning();
    
    productionStep = created;
  }
  
  res.status(201).json(productionStep);
}));

/**
 * Sipariş - Sevkiyat ilişkisi oluşturur
 */
ordersIntegrationRouter.post("/shipment-record/:orderId", asyncHandler(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.orderId);
  
  if (isNaN(orderId)) {
    return res.status(400).json({ error: "Geçersiz sipariş ID formatı" });
  }
  
  const shipmentData = req.body;
  
  if (!shipmentData.shipmentId || !shipmentData.quantity || !shipmentData.unit) {
    return res.status(400).json({ error: "Eksik veri. shipmentId, quantity ve unit zorunludur" });
  }
  
  // Siparişi kontrol et
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));
  
  if (!order) {
    return res.status(404).json({ error: "Sipariş bulunamadı" });
  }
  
  // Sevkiyatı kontrol et
  const [shipment] = await db
    .select()
    .from(shipments)
    .where(eq(shipments.id, shipmentData.shipmentId));
  
  if (!shipment) {
    return res.status(404).json({ error: "Sevkiyat bulunamadı" });
  }
  
  // Sevkiyat kaydı oluştur
  const [shipmentRecord] = await db
    .insert(orderShipments)
    .values({
      orderId,
      shipmentId: shipmentData.shipmentId,
      quantity: shipmentData.quantity,
      unit: shipmentData.unit,
      packageCount: shipmentData.packageCount,
      palletCount: shipmentData.palletCount,
      grossWeight: shipmentData.grossWeight,
      netWeight: shipmentData.netWeight,
      volumeM3: shipmentData.volumeM3,
      isComplete: shipmentData.isComplete || false,
      notes: shipmentData.notes,
      createdAt: new Date(),
      createdBy: req.user?.id || 1
    })
    .returning();
  
  res.status(201).json(shipmentRecord);
}));

/**
 * Sipariş durum değişikliği geçmişi kaydeder
 */
ordersIntegrationRouter.post("/status-history/:orderId", asyncHandler(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.orderId);
  
  if (isNaN(orderId)) {
    return res.status(400).json({ error: "Geçersiz sipariş ID formatı" });
  }
  
  const { oldStatusId, newStatusId, reason, notes } = req.body;
  
  if (!newStatusId) {
    return res.status(400).json({ error: "Yeni durum ID'si zorunludur" });
  }
  
  // Siparişi kontrol et
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));
  
  if (!order) {
    return res.status(404).json({ error: "Sipariş bulunamadı" });
  }
  
  // Geçmiş kaydı oluştur
  const [historyRecord] = await db
    .insert(orderStatusHistory)
    .values({
      orderId,
      oldStatusId: oldStatusId || null,
      newStatusId,
      changeDate: new Date(),
      userId: req.user?.id || 1,
      reason: reason || null,
      notes: notes || null
    })
    .returning();
  
  res.status(201).json(historyRecord);
}));

/**
 * Sipariş ertelenme veya iptal kaydı oluşturur
 */
ordersIntegrationRouter.post("/delay-reason/:orderId", asyncHandler(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.orderId);
  
  if (isNaN(orderId)) {
    return res.status(400).json({ error: "Geçersiz sipariş ID formatı" });
  }
  
  const { reason, description, delayDays, newDueDate, isCancelled } = req.body;
  
  if (!reason) {
    return res.status(400).json({ error: "Neden zorunludur" });
  }
  
  // Siparişi kontrol et
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));
  
  if (!order) {
    return res.status(404).json({ error: "Sipariş bulunamadı" });
  }
  
  // Gecikme/iptal kaydı oluştur
  const [delayRecord] = await db
    .insert(orderDelayReasons)
    .values({
      orderId,
      reason,
      description: description || null,
      delayDays: delayDays || null,
      newDueDate: newDueDate ? new Date(newDueDate) : null,
      isCancelled: isCancelled === true,
      reportedBy: req.user?.id || 1,
      reportedDate: new Date(),
      approvedBy: null,
      approvedDate: null
    })
    .returning();
  
  res.status(201).json(delayRecord);
}));

/**
 * Sipariş ertelenme/iptal kaydını onaylar
 */
ordersIntegrationRouter.patch("/approve-delay/:id", asyncHandler(async (req: Request, res: Response) => {
  const delayId = parseInt(req.params.id);
  
  if (isNaN(delayId)) {
    return res.status(400).json({ error: "Geçersiz gecikme/iptal kaydı ID formatı" });
  }
  
  // Kaydı kontrol et
  const [delayRecord] = await db
    .select()
    .from(orderDelayReasons)
    .where(eq(orderDelayReasons.id, delayId));
  
  if (!delayRecord) {
    return res.status(404).json({ error: "Gecikme/iptal kaydı bulunamadı" });
  }
  
  // Kaydı onayla
  const [updatedRecord] = await db
    .update(orderDelayReasons)
    .set({
      approvedBy: req.user?.id || 1,
      approvedDate: new Date()
    })
    .where(eq(orderDelayReasons.id, delayId))
    .returning();
  
  // Sipariş teslim tarihini güncelle (opsiyonel)
  if (updatedRecord.newDueDate && !updatedRecord.isCancelled) {
    await db
      .update(orders)
      .set({ dueDate: updatedRecord.newDueDate })
      .where(eq(orders.id, updatedRecord.orderId));
  }
  
  // Sipariş durumunu iptal olarak işaretle (opsiyonel)
  if (updatedRecord.isCancelled) {
    // İptal durum kodunu bul
    const [cancelledStatus] = await db
      .select()
      .from(orderStatuses)
      .where(eq(orderStatuses.code, "CANCELLED"));
    
    if (cancelledStatus) {
      await db
        .update(orders)
        .set({ statusId: cancelledStatus.id })
        .where(eq(orders.id, updatedRecord.orderId));
    }
  }
  
  res.json(updatedRecord);
}));

/**
 * Sipariş malzeme ihtiyacı ekler
 */
ordersIntegrationRouter.post("/material-requirement/:orderId", asyncHandler(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.orderId);
  
  if (isNaN(orderId)) {
    return res.status(400).json({ error: "Geçersiz sipariş ID formatı" });
  }
  
  const { materialType, materialId, description, quantity, unit, isAvailable, estimatedArrivalDate, notes } = req.body;
  
  if (!materialType || !description || !quantity || !unit) {
    return res.status(400).json({ error: "Eksik veri. materialType, description, quantity ve unit zorunludur" });
  }
  
  // Siparişi kontrol et
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));
  
  if (!order) {
    return res.status(404).json({ error: "Sipariş bulunamadı" });
  }
  
  // Malzeme ihtiyacı oluştur
  const [materialRequirement] = await db
    .insert(orderMaterialRequirements)
    .values({
      orderId,
      materialType,
      materialId: materialId || null,
      description,
      quantity,
      unit,
      isAvailable: isAvailable === true,
      estimatedArrivalDate: estimatedArrivalDate ? new Date(estimatedArrivalDate) : null,
      notes: notes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();
  
  res.status(201).json(materialRequirement);
}));

/**
 * Malzeme ihtiyacını günceller
 */
ordersIntegrationRouter.patch("/material-requirement/:id", asyncHandler(async (req: Request, res: Response) => {
  const materialId = parseInt(req.params.id);
  
  if (isNaN(materialId)) {
    return res.status(400).json({ error: "Geçersiz malzeme ihtiyacı ID formatı" });
  }
  
  // Malzeme ihtiyacını kontrol et
  const [materialRequirement] = await db
    .select()
    .from(orderMaterialRequirements)
    .where(eq(orderMaterialRequirements.id, materialId));
  
  if (!materialRequirement) {
    return res.status(404).json({ error: "Malzeme ihtiyacı bulunamadı" });
  }
  
  // Malzeme ihtiyacını güncelle
  const [updatedMaterial] = await db
    .update(orderMaterialRequirements)
    .set({
      ...req.body,
      updatedAt: new Date()
    })
    .where(eq(orderMaterialRequirements.id, materialId))
    .returning();
  
  res.json(updatedMaterial);
}));

/**
 * Öncelik kuralı ekler
 */
ordersIntegrationRouter.post("/priority-rule", asyncHandler(async (req: Request, res: Response) => {
  const { name, description, priorityLevel, conditions, isActive } = req.body;
  
  if (!name || !priorityLevel) {
    return res.status(400).json({ error: "Eksik veri. name ve priorityLevel zorunludur" });
  }
  
  // Öncelik kuralı oluştur
  const [priorityRule] = await db
    .insert(productionPriorityRules)
    .values({
      name,
      description: description || null,
      priorityLevel,
      conditions: conditions || null,
      isActive: isActive !== false,
      createdAt: new Date(),
      createdBy: req.user?.id || 1
    })
    .returning();
  
  res.status(201).json(priorityRule);
}));

/**
 * Öncelik kurallarını listeler
 */
ordersIntegrationRouter.get("/priority-rules", asyncHandler(async (req: Request, res: Response) => {
  const rules = await db
    .select({
      id: productionPriorityRules.id,
      name: productionPriorityRules.name,
      description: productionPriorityRules.description,
      priorityLevel: productionPriorityRules.priorityLevel,
      conditions: productionPriorityRules.conditions,
      isActive: productionPriorityRules.isActive,
      createdAt: productionPriorityRules.createdAt,
      createdBy: productionPriorityRules.createdBy,
      createdByName: sql<string>`(SELECT full_name FROM users WHERE id = ${productionPriorityRules.createdBy})`
    })
    .from(productionPriorityRules)
    .orderBy(asc(productionPriorityRules.priorityLevel));
  
  res.json(rules);
}));

/**
 * Entegre sipariş arama
 * Çeşitli kriterlere göre siparişleri aramak ve filtrelemek için
 */
ordersIntegrationRouter.get("/search", asyncHandler(async (req: Request, res: Response) => {
  const {
    orderNumber,
    customerName,
    status,
    trackingStatus,
    fromDate,
    toDate,
    delayed,
    hasIssues,
    department,
    limit = 50
  } = req.query;
  
  // Dinamik sorgu oluşturma
  let query = db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerId: orders.customerId,
      customerName: sql<string>`(SELECT name FROM customers WHERE id = ${orders.customerId})`,
      orderDate: orders.orderDate,
      dueDate: orders.dueDate,
      statusId: orders.statusId,
      statusName: sql<string>`(SELECT name FROM order_statuses WHERE id = ${orders.statusId})`,
      quantity: orders.quantity,
      unit: orders.unit,
      currentTrackingStatus: sql<string>`(
        SELECT name FROM order_tracking_statuses ots
        JOIN order_tracking ot ON ots.id = ot.status_id
        WHERE ot.order_id = ${orders.id}
        ORDER BY ot.timestamp DESC
        LIMIT 1
      )`,
      // Teslimat zamanı için kalan gün
      daysRemaining: sql<number>`CASE WHEN (due_date - CURRENT_DATE) >= 0 THEN (due_date - CURRENT_DATE) ELSE 0 END`,
      hasDelay: sql<boolean>`EXISTS (
        SELECT 1 FROM order_delay_reasons
        WHERE order_id = ${orders.id}
      )`,
      currentPlanId: sql<number>`(
        SELECT id FROM production_plans
        WHERE order_id = ${orders.id}
        ORDER BY created_at DESC
        LIMIT 1
      )`,
      currentDepartment: sql<string>`(
        SELECT d.name FROM departments d
        JOIN order_production_steps ops ON d.id = ops.department_id
        WHERE ops.order_id = ${orders.id} AND ops.status = 'in-progress'
        LIMIT 1
      )`
    })
    .from(orders);
  
  // Filtreleri uygula
  if (orderNumber) {
    query = query.where(like(orders.orderNumber, `%${orderNumber}%`));
  }
  
  if (customerName) {
    query = query.where(sql`(SELECT name FROM customers WHERE id = ${orders.customerId}) LIKE ${`%${customerName}%`}`);
  }
  
  if (status) {
    query = query.where(sql`(SELECT code FROM order_statuses WHERE id = ${orders.statusId}) = ${status}`);
  }
  
  if (trackingStatus) {
    query = query.where(sql`
      EXISTS (
        SELECT 1 FROM order_tracking ot
        JOIN order_tracking_statuses ots ON ot.status_id = ots.id
        WHERE ot.order_id = ${orders.id} AND ots.code = ${trackingStatus}
        ORDER BY ot.timestamp DESC
        LIMIT 1
      )
    `);
  }
  
  if (fromDate) {
    const parsedFromDate = new Date(fromDate as string);
    if (!isNaN(parsedFromDate.getTime())) {
      query = query.where(sql`${orders.orderDate} >= ${parsedFromDate}`);
    }
  }
  
  if (toDate) {
    const parsedToDate = new Date(toDate as string);
    if (!isNaN(parsedToDate.getTime())) {
      query = query.where(sql`${orders.orderDate} <= ${parsedToDate}`);
    }
  }
  
  if (delayed === 'true') {
    query = query.where(sql`EXISTS (
      SELECT 1 FROM order_delay_reasons
      WHERE order_id = ${orders.id}
    )`);
  }
  
  if (hasIssues === 'true') {
    // Sorunlu siparişleri tanımla, örneğin teslim tarihi geçmiş olanlar
    query = query.where(sql`${orders.dueDate} < CURRENT_DATE AND (
      SELECT code FROM order_statuses WHERE id = ${orders.statusId}
    ) NOT IN ('COMPLETED', 'CANCELLED')`);
  }
  
  if (department) {
    query = query.where(sql`
      EXISTS (
        SELECT 1 FROM order_production_steps ops
        WHERE ops.order_id = ${orders.id} AND ops.department_id = ${department} AND ops.status = 'in-progress'
      )
    `);
  }
  
  // Sıralama
  query = query.orderBy(desc(orders.orderDate));
  
  // Limit
  const limitValue = parseInt(limit as string);
  if (!isNaN(limitValue) && limitValue > 0) {
    query = query.limit(limitValue);
  }
  
  // Sorguyu çalıştır
  const results = await query;
  
  res.json(results);
}));

export default ordersIntegrationRouter;