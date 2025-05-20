import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  date, 
  timestamp, 
  integer, 
  json, 
  jsonb,
  numeric,
  boolean,
  primaryKey,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Refakat Kartları (Üretim Takip Kartları) tablosu
export const productionCards = pgTable("production_cards", {
  id: serial("id").primaryKey(),
  cardNo: varchar("card_no", { length: 50 }).notNull(),
  barcode: varchar("barcode", { length: 100 }).notNull(),
  currentDepartmentId: integer("current_department_id").notNull(),
  orderId: integer("order_id").notNull(),
  productionPlanId: integer("production_plan_id").notNull(),
  currentStepId: integer("current_step_id"),
  status: varchar("status", { length: 20 }).default("created").notNull(),
  length: numeric("length"),
  weight: numeric("weight"),
  color: varchar("color", { length: 50 }),
  width: numeric("width"),
  fabricTypeId: integer("fabric_type_id"),
  qualityGrade: varchar("quality_grade", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    cardNoIdx: uniqueIndex("production_cards_card_no_idx").on(table.cardNo),
    barcodeIdx: uniqueIndex("production_cards_barcode_idx").on(table.barcode),
  };
});

// Refakat Kartı Hareketleri tablosu
export const productionCardMovements = pgTable("production_card_movements", {
  id: serial("id").primaryKey(),
  productionCardId: integer("production_card_id").notNull(),
  operatorId: integer("operator_id").notNull(),
  fromDepartmentId: integer("from_department_id"),
  toDepartmentId: integer("to_department_id").notNull(),
  operationTypeId: integer("operation_type_id"),
  machineId: integer("machine_id"),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  status: varchar("status", { length: 20 }).notNull(),
  notes: text("notes"),
  defects: jsonb("defects"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// İlişkiler
export const productionCardsRelations = relations(productionCards, ({ many }) => ({
  movements: many(productionCardMovements),
}));

export const productionCardMovementsRelations = relations(productionCardMovements, ({ one }) => ({
  card: one(productionCards, {
    fields: [productionCardMovements.productionCardId],
    references: [productionCards.id],
  }),
}));

// TypeScript tipleri
export type ProductionCard = typeof productionCards.$inferSelect & {
  departmentName?: string;
  customerName?: string;
  productName?: string;
  orderNumber?: string;
};

export type InsertProductionCard = typeof productionCards.$inferInsert;
export type ProductionCardMovement = typeof productionCardMovements.$inferSelect & {
  departmentName?: string;
  operatorName?: string;
  machineName?: string;
};
export type InsertProductionCardMovement = typeof productionCardMovements.$inferInsert;

// Zod şemaları - Tamamen manuel oluşturuldu
export const insertProductionCardSchema = z.object({
  productionPlanId: z.number(),
  currentDepartmentId: z.number(),
  orderId: z.number(),
  currentStepId: z.number().optional(),
  status: z.enum(['created', 'in-process', 'completed', 'rejected']).default('created'),
  length: z.string().optional().nullable(),
  weight: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  width: z.string().optional().nullable(),
  fabricTypeId: z.number().optional().nullable(),
  qualityGrade: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  cardNo: z.string().optional(), // Server tarafında oluşturulacak
  barcode: z.string().optional(), // Server tarafında oluşturulacak
});

export const insertCardMovementSchema = createInsertSchema(productionCardMovements);