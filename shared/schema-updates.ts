/**
 * Dokuma, Terbiye/Apre ve Süreç Transferi için DB Şema Tanımlamaları
 */

import { 
  pgTable, 
  serial, 
  varchar, 
  integer, 
  text, 
  timestamp, 
  decimal, 
  boolean,
  json,
  jsonb,
  index,
  foreignKey
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { type } from "os";

/**
 * Dokuma işlemleri tablosu
 */
export const weavingOrders = pgTable("weaving_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 100 }).notNull(),
  fabricType: varchar("fabric_type", { length: 100 }).notNull(),
  designCode: varchar("design_code", { length: 100 }),
  color: varchar("color", { length: 100 }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 20 }).default("metre"),
  width: decimal("width", { precision: 10, scale: 2 }),
  gsm: integer("gsm"),
  numberOfFrames: integer("number_of_frames"),
  status: varchar("status", { length: 50 }).default("planned"),
  customerId: integer("customer_id").references(() => customers.id),
  requestedDate: timestamp("requested_date"),
  dueDate: timestamp("due_date"),
  plannedStartDate: timestamp("planned_start_date"),
  plannedEndDate: timestamp("planned_end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  yarnDetails: jsonb("yarn_details"),
  attachments: jsonb("attachments"),
  notes: text("notes"),
  departmentId: integer("department_id"),
  assignedToUserId: integer("assigned_to_user_id"),
  machineId: integer("machine_id"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertWeavingOrderSchema = createInsertSchema(weavingOrders)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertWeavingOrder = z.infer<typeof insertWeavingOrderSchema>;
export type WeavingOrder = typeof weavingOrders.$inferSelect;

/**
 * Dokuma işlemleri - operasyonlar tablosu
 */
export const weavingOperations = pgTable("weaving_operations", {
  id: serial("id").primaryKey(),
  weavingOrderId: integer("weaving_order_id").notNull().references(() => weavingOrders.id),
  operationType: varchar("operation_type", { length: 50 }).notNull(),
  description: text("description"),
  sequenceNumber: integer("sequence_number").notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  duration: integer("duration"),
  machineId: integer("machine_id"),
  operatorId: integer("operator_id"),
  instructions: text("instructions"),
  result: text("result"),
  quality: decimal("quality", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertWeavingOperationSchema = createInsertSchema(weavingOperations)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertWeavingOperation = z.infer<typeof insertWeavingOperationSchema>;
export type WeavingOperation = typeof weavingOperations.$inferSelect;

/**
 * Dokuma işlemleri - defects (hatalar) tablosu
 */
export const weavingDefects = pgTable("weaving_defects", {
  id: serial("id").primaryKey(),
  weavingOrderId: integer("weaving_order_id").notNull().references(() => weavingOrders.id),
  defectType: varchar("defect_type", { length: 50 }).notNull(),
  description: text("description"),
  severity: varchar("severity", { length: 20 }).default("minor"),
  position: jsonb("position"),
  detectedAt: timestamp("detected_at").defaultNow(),
  detectedBy: integer("detected_by"),
  status: varchar("status", { length: 50 }).default("open"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by"),
  resolutionDetails: text("resolution_details"),
  affectedArea: decimal("affected_area", { precision: 10, scale: 2 }),
  images: jsonb("images"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertWeavingDefectSchema = createInsertSchema(weavingDefects)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertWeavingDefect = z.infer<typeof insertWeavingDefectSchema>;
export type WeavingDefect = typeof weavingDefects.$inferSelect;

/**
 * Terbiye/Apre işlemleri tablosu
 */
export const finishingProcesses = pgTable("finishing_processes", {
  id: serial("id").primaryKey(),
  processCode: varchar("process_code", { length: 100 }).notNull(),
  departmentId: integer("department_id").notNull(),
  processType: varchar("process_type", { length: 50 }).notNull(),
  fabricType: varchar("fabric_type", { length: 100 }).notNull(),
  color: varchar("color", { length: 100 }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 20 }).default("metre"),
  status: varchar("status", { length: 50 }).default("planned"),
  sourceOrderId: integer("source_order_id"),
  sourceOrderType: varchar("source_order_type", { length: 50 }),
  transferId: integer("transfer_id"),
  plannedStartDate: timestamp("planned_start_date"),
  plannedEndDate: timestamp("planned_end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  assignedToUserId: integer("assigned_to_user_id"),
  machineId: integer("machine_id"),
  qualityRequirements: jsonb("quality_requirements"),
  notes: text("notes"),
  attachments: jsonb("attachments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertFinishingProcessSchema = createInsertSchema(finishingProcesses)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertFinishingProcess = z.infer<typeof insertFinishingProcessSchema>;
export type FinishingProcess = typeof finishingProcesses.$inferSelect;

/**
 * Terbiye/Apre işlemleri - operasyonlar tablosu
 */
export const finishingOperations = pgTable("finishing_operations", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").notNull().references(() => finishingProcesses.id),
  operationType: varchar("operation_type", { length: 50 }).notNull(),
  description: text("description"),
  sequenceNumber: integer("sequence_number").notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  duration: integer("duration"),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  pressure: decimal("pressure", { precision: 5, scale: 2 }),
  speed: decimal("speed", { precision: 5, scale: 2 }),
  machineId: integer("machine_id"),
  operatorId: integer("operator_id"),
  instructions: text("instructions"),
  result: text("result"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertFinishingOperationSchema = createInsertSchema(finishingOperations)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertFinishingOperation = z.infer<typeof insertFinishingOperationSchema>;
export type FinishingOperation = typeof finishingOperations.$inferSelect;

/**
 * Terbiye/Apre işlemleri - kalite testleri tablosu
 */
export const finishingQualityTests = pgTable("finishing_quality_tests", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").notNull().references(() => finishingProcesses.id),
  testType: varchar("test_type", { length: 50 }).notNull(),
  testDate: timestamp("test_date").defaultNow(),
  testerUserId: integer("tester_user_id"),
  parameters: jsonb("parameters"),
  results: jsonb("results"),
  status: varchar("status", { length: 50 }).default("pending"),
  passed: boolean("passed"),
  notes: text("notes"),
  attachments: jsonb("attachments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertFinishingQualityTestSchema = createInsertSchema(finishingQualityTests)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertFinishingQualityTest = z.infer<typeof insertFinishingQualityTestSchema>;
export type FinishingQualityTest = typeof finishingQualityTests.$inferSelect;

/**
 * Terbiye/Apre işlemleri - reçeteler tablosu
 */
export const finishingRecipes = pgTable("finishing_recipes", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").notNull().references(() => finishingProcesses.id),
  recipeCode: varchar("recipe_code", { length: 100 }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  applicationOrder: integer("application_order").notNull(),
  chemicalName: varchar("chemical_name", { length: 100 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 20 }).default("kg"),
  applicationMethod: varchar("application_method", { length: 100 }),
  applicationDuration: integer("application_duration"),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  pressure: decimal("pressure", { precision: 5, scale: 2 }),
  hazardLevel: varchar("hazard_level", { length: 50 }),
  safetyInstructions: text("safety_instructions"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertFinishingRecipeSchema = createInsertSchema(finishingRecipes)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertFinishingRecipe = z.infer<typeof insertFinishingRecipeSchema>;
export type FinishingRecipe = typeof finishingRecipes.$inferSelect;

/**
 * Süreç transferleri tablosu (dokumadan terbiyeye, terbiyeden boyamaya vb.)
 */
export const processTransfers = pgTable("process_transfers", {
  id: serial("id").primaryKey(),
  sourceProcessId: integer("source_process_id").notNull(),
  sourceProcessType: varchar("source_process_type", { length: 50 }).notNull(),
  targetProcessId: integer("target_process_id"),
  targetProcessType: varchar("target_process_type", { length: 50 }),
  targetDepartmentId: integer("target_department_id").notNull(),
  transferDate: timestamp("transfer_date").defaultNow(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 20 }).default("metre"),
  transferUserId: integer("transfer_user_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertProcessTransferSchema = createInsertSchema(processTransfers)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertProcessTransfer = z.infer<typeof insertProcessTransferSchema>;
export type ProcessTransfer = typeof processTransfers.$inferSelect;

/**
 * Var olan tabloları dışa aktarma
 * Not: Bu kısım önceden tanımlanmış tablolara atıflar içerir
 * (Eğer bu tablolar schema.ts'de tanımlanmışsa)
 */
import { customers } from "./schema";

export { customers };