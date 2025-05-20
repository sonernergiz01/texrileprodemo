/**
 * Sipariş - Üretim - Sevkiyat Entegrasyonu Şema Güncellemeleri
 * 
 * Bu dosya, sipariş, üretim ve sevkiyat modülleri arasındaki entegrasyonu sağlamak
 * için gerekli şema güncellemelerini içerir.
 */

import { pgTable, text, serial, integer, boolean, varchar, timestamp, 
         foreignKey, uniqueIndex, date, numeric, jsonb, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { orders, users, orderStatuses, departments, productionPlans, shipments } from "./schema";

/**
 * Sipariş Takip Durumları
 * Sipariş sürecinin her aşamasını detaylı olarak takip etmek için kullanılır
 */
export const orderTrackingStatuses = pgTable("order_tracking_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  color: text("color").default("#3b82f6"),
  sequence: integer("sequence").notNull(), // Statülerin sıralama numarası
  isActive: boolean("is_active").default(true).notNull(),
});

/**
 * Sipariş Geçiş Kuralları
 * Hangi sipariş durumundan hangi duruma geçilebileceğini belirler
 */
export const orderStatusTransitions = pgTable("order_status_transitions", {
  id: serial("id").primaryKey(), 
  fromStatusId: integer("from_status_id").notNull().references(() => orderTrackingStatuses.id),
  toStatusId: integer("to_status_id").notNull().references(() => orderTrackingStatuses.id),
  description: text("description"),
  isAutomated: boolean("is_automated").default(false), // Otomatik geçiş mi yoksa manuel mi?
  requiredPermission: text("required_permission"), // Geçiş için gerekli yetki
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Sipariş Takip Bilgileri
 * Siparişin tam hayat döngüsünün kaydını tutar
 */
export const orderTracking = pgTable("order_tracking", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  statusId: integer("status_id").notNull().references(() => orderTrackingStatuses.id),
  note: text("note"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  userId: integer("user_id").notNull().references(() => users.id),
  productionPlanId: integer("production_plan_id").references(() => productionPlans.id),
  shipmentId: integer("shipment_id").references(() => shipments.id),
  data: jsonb("data"), // Ek bilgiler veya olaylar için esnek alan
});

/**
 * Sipariş - Üretim Adımları İlişkisi
 * Hangi siparişin hangi üretim adımlarında olduğunu izler
 */
export const orderProductionSteps = pgTable("order_production_steps", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productionPlanId: integer("production_plan_id").notNull().references(() => productionPlans.id),
  step: text("step").notNull(), // Üretim adımı adı (dokuma, boyama, apre, vb.)
  stepOrder: integer("step_order").notNull(), // Adım sırası
  departmentId: integer("department_id").notNull().references(() => departments.id),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default("pending"),
  completionPercentage: integer("completion_percentage").default(0),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").notNull().references(() => users.id),
});

/**
 * Sipariş - Sevkiyat İlişkisi
 * Bir siparişe ait tüm sevkiyatları ve durumlarını izler
 */
export const orderShipments = pgTable("order_shipments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  shipmentId: integer("shipment_id").notNull().references(() => shipments.id),
  quantity: numeric("quantity").notNull(),
  unit: text("unit").notNull(),
  packageCount: integer("package_count"),
  palletCount: integer("pallet_count"),
  grossWeight: numeric("gross_weight"),
  netWeight: numeric("net_weight"),
  volumeM3: numeric("volume_m3"),
  isComplete: boolean("is_complete").default(false), // Siparişin tamamı mı sevk edildi?
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id),
});

/**
 * Sipariş Durumu Güncellemeleri Geçmişi
 * Bir siparişin durumunun ne zaman ve kim tarafından değiştirildiğini kaydeder
 */
export const orderStatusHistory = pgTable("order_status_history", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  oldStatusId: integer("old_status_id").references(() => orderStatuses.id),
  newStatusId: integer("new_status_id").notNull().references(() => orderStatuses.id),
  changeDate: timestamp("change_date").notNull().defaultNow(),
  userId: integer("user_id").notNull().references(() => users.id),
  reason: text("reason"),
  notes: text("notes"),
});

/**
 * Sipariş Ertelenme veya İptal Nedenleri
 * Siparişin ertelenme veya iptal edilme nedenlerini kaydeder
 */
export const orderDelayReasons = pgTable("order_delay_reasons", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  reason: text("reason").notNull(),
  description: text("description"),
  delayDays: integer("delay_days"),
  newDueDate: date("new_due_date"),
  isCancelled: boolean("is_cancelled").default(false),
  reportedBy: integer("reported_by").notNull().references(() => users.id),
  reportedDate: timestamp("reported_date").notNull().defaultNow(),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedDate: timestamp("approved_date"),
});

/**
 * Üretim Önceliklendirme Kuralları
 * Hangi siparişlerin daha öncelikli olarak üretileceğini belirleyen kurallar
 */
export const productionPriorityRules = pgTable("production_priority_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  priorityLevel: integer("priority_level").notNull(), // 1 en yüksek öncelik
  conditions: jsonb("conditions"), // Koşul kuralları için JSON
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id),
});

/**
 * Sipariş Malzeme İhtiyaçları
 * Siparişin tamamlanması için gereken malzemeleri belirtir
 */
export const orderMaterialRequirements = pgTable("order_material_requirements", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  materialType: text("material_type").notNull(), // iplik, boya, yardımcı malzeme, vb.
  materialId: integer("material_id"), // İlgili malzeme tablosundaki ID
  description: text("description").notNull(),
  quantity: numeric("quantity").notNull(),
  unit: text("unit").notNull(),
  isAvailable: boolean("is_available").default(false),
  estimatedArrivalDate: date("estimated_arrival_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Şemaları oluşturma ve tip tanımlamalarını dışa aktarma
export const insertOrderTrackingStatusSchema = createInsertSchema(orderTrackingStatuses);
export type InsertOrderTrackingStatus = z.infer<typeof insertOrderTrackingStatusSchema>;
export type OrderTrackingStatus = typeof orderTrackingStatuses.$inferSelect;

export const insertOrderStatusTransitionSchema = createInsertSchema(orderStatusTransitions);
export type InsertOrderStatusTransition = z.infer<typeof insertOrderStatusTransitionSchema>;
export type OrderStatusTransition = typeof orderStatusTransitions.$inferSelect;

export const insertOrderTrackingSchema = createInsertSchema(orderTracking);
export type InsertOrderTracking = z.infer<typeof insertOrderTrackingSchema>;
export type OrderTracking = typeof orderTracking.$inferSelect;

export const insertOrderProductionStepSchema = createInsertSchema(orderProductionSteps);
export type InsertOrderProductionStep = z.infer<typeof insertOrderProductionStepSchema>;
export type OrderProductionStep = typeof orderProductionSteps.$inferSelect;

export const insertOrderShipmentSchema = createInsertSchema(orderShipments);
export type InsertOrderShipment = z.infer<typeof insertOrderShipmentSchema>;
export type OrderShipment = typeof orderShipments.$inferSelect;

export const insertOrderStatusHistorySchema = createInsertSchema(orderStatusHistory);
export type InsertOrderStatusHistory = z.infer<typeof insertOrderStatusHistorySchema>;
export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;

export const insertOrderDelayReasonSchema = createInsertSchema(orderDelayReasons);
export type InsertOrderDelayReason = z.infer<typeof insertOrderDelayReasonSchema>;
export type OrderDelayReason = typeof orderDelayReasons.$inferSelect;

export const insertProductionPriorityRuleSchema = createInsertSchema(productionPriorityRules);
export type InsertProductionPriorityRule = z.infer<typeof insertProductionPriorityRuleSchema>;
export type ProductionPriorityRule = typeof productionPriorityRules.$inferSelect;

export const insertOrderMaterialRequirementSchema = createInsertSchema(orderMaterialRequirements);
export type InsertOrderMaterialRequirement = z.infer<typeof insertOrderMaterialRequirementSchema>;
export type OrderMaterialRequirement = typeof orderMaterialRequirements.$inferSelect;