import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { pgTable, serial, text, integer, timestamp, boolean, numeric, json, index, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Kartelalar tablosu
 * Kumaş numuneleri kartela halinde gruplandırılır
 */
export const kartelas = pgTable('kartelas', {
  id: serial('id').primaryKey(),
  kartelaCode: text('kartela_code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  customerId: integer('customer_id').references(() => 'customers.id'),
  customerName: text('customer_name'),
  status: text('status').notNull().default('draft'),  // draft, sent, approved, rejected
  qrCode: text('qr_code').notNull(),
  notes: text('notes'),
  createdBy: integer('created_by').notNull().references(() => 'users.id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

/**
 * Kartela öğeleri tablosu
 * Her kartelada bulunan kumaş örnekleri
 */
export const kartelaItems = pgTable('kartela_items', {
  id: serial('id').primaryKey(),
  kartelaId: integer('kartela_id').notNull().references(() => kartelas.id, { onDelete: 'cascade' }),
  fabricTypeId: integer('fabric_type_id').notNull().references(() => 'fabric_types.id'),
  fabricTypeName: text('fabric_type_name').notNull(),
  fabricCode: text('fabric_code').notNull(),
  color: text('color'),
  weight: numeric('weight'),
  width: numeric('width'),
  composition: text('composition'),
  properties: json('properties'),
  qrCode: text('qr_code').notNull(),
  status: text('status').notNull().default('active'),  // active, inactive
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => {
  return {
    kartelaIdIdx: index('kartela_items_kartela_id_idx').on(table.kartelaId),
    fabricCodeIdx: index('kartela_items_fabric_code_idx').on(table.fabricCode)
  }
});

/**
 * Kartela stok hareketleri tablosu
 * Kartela kumaşlarının giriş/çıkış hareketleri
 */
export const kartelaStockMovements = pgTable('kartela_stock_movements', {
  id: serial('id').primaryKey(),
  kartelaId: integer('kartela_id').notNull().references(() => kartelas.id, { onDelete: 'cascade' }),
  kartelaItemId: integer('kartela_item_id').references(() => kartelaItems.id, { onDelete: 'set null' }),
  movementType: text('movement_type').notNull(),  // in, out
  quantity: numeric('quantity').notNull(),
  unit: text('unit').notNull(),  // adet, metre, kg
  customerId: integer('customer_id').references(() => 'customers.id'),
  notes: text('notes'),
  documentNumber: text('document_number'),
  createdBy: integer('created_by').notNull().references(() => 'users.id'),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => {
  return {
    kartelaIdIdx: index('kartela_stock_movements_kartela_id_idx').on(table.kartelaId),
    kartelaItemIdIdx: index('kartela_stock_movements_item_id_idx').on(table.kartelaItemId)
  }
});

/**
 * Kartela sevkiyatları tablosu
 * Müşterilere gönderilen kartela sevkiyatları
 */
export const kartelaShipments = pgTable('kartela_shipments', {
  id: serial('id').primaryKey(),
  kartelaId: integer('kartela_id').notNull().references(() => kartelas.id, { onDelete: 'cascade' }),
  customerId: integer('customer_id').notNull().references(() => 'customers.id'),
  customerName: text('customer_name').notNull(),
  shipmentDate: timestamp('shipment_date').notNull(),
  shipmentMethod: text('shipment_method').notNull(),  // cargo, courier, mail, hand
  trackingNumber: text('tracking_number'),
  status: text('status').notNull().default('pending'),  // pending, shipped, delivered
  notes: text('notes'),
  createdBy: integer('created_by').notNull().references(() => 'users.id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => {
  return {
    kartelaIdIdx: index('kartela_shipments_kartela_id_idx').on(table.kartelaId),
    customerIdIdx: index('kartela_shipments_customer_id_idx').on(table.customerId)
  }
});

// Tabloları ilişkilendirme
export const kartelasRelations = relations(kartelas, ({ many }) => ({
  items: many(kartelaItems),
  stockMovements: many(kartelaStockMovements),
  shipments: many(kartelaShipments)
}));

export const kartelaItemsRelations = relations(kartelaItems, ({ one, many }) => ({
  kartela: one(kartelas, {
    fields: [kartelaItems.kartelaId],
    references: [kartelas.id]
  }),
  stockMovements: many(kartelaStockMovements)
}));

export const kartelaStockMovementsRelations = relations(kartelaStockMovements, ({ one }) => ({
  kartela: one(kartelas, {
    fields: [kartelaStockMovements.kartelaId],
    references: [kartelas.id]
  }),
  item: one(kartelaItems, {
    fields: [kartelaStockMovements.kartelaItemId],
    references: [kartelaItems.id]
  })
}));

export const kartelaShipmentsRelations = relations(kartelaShipments, ({ one }) => ({
  kartela: one(kartelas, {
    fields: [kartelaShipments.kartelaId],
    references: [kartelas.id]
  })
}));

// Zod şemaları - Veri doğrulama için
export const insertKartelaSchema = createInsertSchema(kartelas, {
  customerId: z.number().optional().nullable(),
}).omit({ id: true });

export const insertKartelaItemSchema = createInsertSchema(kartelaItems, {
  properties: z.any().optional(),
}).omit({ id: true });

export const insertKartelaStockMovementSchema = createInsertSchema(kartelaStockMovements).omit({ id: true });

export const insertKartelaShipmentSchema = createInsertSchema(kartelaShipments).omit({ id: true });

// Tip tanımlamaları
export type Kartela = typeof kartelas.$inferSelect;
export type InsertKartela = z.infer<typeof insertKartelaSchema>;

export type KartelaItem = typeof kartelaItems.$inferSelect;
export type InsertKartelaItem = z.infer<typeof insertKartelaItemSchema>;

export type KartelaStockMovement = typeof kartelaStockMovements.$inferSelect;
export type InsertKartelaStockMovement = z.infer<typeof insertKartelaStockMovementSchema>;

export type KartelaShipment = typeof kartelaShipments.$inferSelect;
export type InsertKartelaShipment = z.infer<typeof insertKartelaShipmentSchema>;