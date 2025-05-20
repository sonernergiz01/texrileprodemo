// Barkod ve Etiket Şema Tanımları
import { relations, sql } from 'drizzle-orm';
import { pgEnum, pgTable, serial, text, timestamp, integer, varchar, boolean, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Etiket tipleri için enum
export const labelTypeEnum = pgEnum('label_type', [
  'iplik_depo',
  'dokuma',
  'ham_kalite',
  'refakat_karti',
  'kartela',
  'kumas_depo',
  'kalite_kontrol',
  'sevkiyat',
  'diger'
]);

// Barkod tipleri için enum
export const barcodeTypeEnum = pgEnum('barcode_type', [
  'code128',
  'ean13',
  'qrcode',
  'datamatrix',
  'code39'
]);

// Etiket tipleri tablosu
export const labelTypes = pgTable('label_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  type: labelTypeEnum('type').notNull(),
  description: text('description'),
  template: jsonb('template').notNull(), // Şablon verileri JSON olarak saklanacak
  isActive: boolean('is_active').notNull().default(true),
  departmentId: integer('department_id').notNull().references(() => departments.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Etiket yazdırma tablosu
export const labelPrints = pgTable('label_prints', {
  id: serial('id').primaryKey(),
  labelTypeId: integer('label_type_id').notNull().references(() => labelTypes.id),
  entityId: integer('entity_id').notNull(), // İlgili varlığın ID'si (iplik, kumaş, sipariş vb.)
  entityType: varchar('entity_type', { length: 50 }).notNull(), // Varlık tipi (iplik, kumaş, sipariş vb.)
  barcodeType: barcodeTypeEnum('barcode_type').notNull(),
  barcodeValue: varchar('barcode_value', { length: 255 }).notNull(), // Barkod içeriği
  printData: jsonb('print_data'), // Yazdırma verilerinin detayları JSON olarak
  status: varchar('status', { length: 50 }).notNull().default('created'),
  printedBy: integer('printed_by').notNull(), // Kullanıcı ID
  printCount: integer('print_count').notNull().default(1),
  lastPrintedAt: timestamp('last_printed_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Departments tablosu referansı (schema.ts'den gelen)
export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  color: varchar('color', { length: 20 })
});

// İlişkileri tanımla
export const labelTypesRelations = relations(labelTypes, ({ one }) => ({
  department: one(departments, {
    fields: [labelTypes.departmentId],
    references: [departments.id]
  })
}));

export const labelPrintsRelations = relations(labelPrints, ({ one }) => ({
  labelType: one(labelTypes, {
    fields: [labelPrints.labelTypeId],
    references: [labelTypes.id]
  })
}));

// Zod şemaları
export const insertLabelTypeSchema = createInsertSchema(labelTypes)
  .extend({
    template: z.record(z.string(), z.any())
  });

export const insertLabelPrintSchema = createInsertSchema(labelPrints)
  .extend({
    printData: z.record(z.string(), z.any()).optional()
  });

// TypeScript tipleri
export type LabelType = typeof labelTypes.$inferSelect;
export type InsertLabelType = z.infer<typeof insertLabelTypeSchema>;
export type LabelPrint = typeof labelPrints.$inferSelect;
export type InsertLabelPrint = z.infer<typeof insertLabelPrintSchema>;