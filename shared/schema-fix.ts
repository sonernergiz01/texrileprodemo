/**
 * Orders şemasındaki veri tipi uyumsuzluğunu gidermek için ek şema tanımları
 */

import { z } from "zod";
import { orders, type Order } from "./schema";
import { createInsertSchema } from "drizzle-zod";

// Numeric değerleri string olarak değil, number olarak alacak şekilde güncelle
export const insertOrderSchemaFixed = createInsertSchema(orders, {
  orderNumber: z.string().min(3, "Sipariş numarası en az 3 karakter olmalıdır"),
  customerId: z.number().int().positive("Müşteri seçimi zorunludur"),
  fabricTypeId: z.number().int().positive("Kumaş tipi seçimi zorunludur").optional().nullable(),
  quantity: z.coerce.number().positive("Miktar sıfırdan büyük olmalıdır"), // string -> number dönüşümü
  unit: z.string().default("metre"),
  unitPrice: z.coerce.number().optional().nullable(), // string -> number dönüşümü
  orderDate: z.coerce.date(), // string -> date dönüşümü
  dueDate: z.coerce.date(), // string -> date dönüşümü
  statusId: z.number().int().positive("Durum seçimi zorunludur"),
  notes: z.string().optional().nullable(),
  createdBy: z.number().int().positive(),
  parentOrderId: z.number().int().positive().optional().nullable(),
  orderType: z.enum(["direct", "block", "block_color"]).default("direct"),
  marketType: z.enum(["iç", "dış"]).default("iç"),
  width: z.coerce.number().optional().nullable(), // string -> number dönüşümü
  weight: z.coerce.number().optional().nullable(), // string -> number dönüşümü
  color: z.string().optional().nullable(),
  variant: z.string().optional().nullable(),
  feel: z.string().optional().nullable(),
  blend: z.string().optional().nullable(),
  groupName: z.string().optional().nullable(),
  pattern: z.string().optional().nullable(),
  properties: z.any().optional().nullable(),
}).omit({ id: true });

// Veritabanından gelen sayısal değeri string olarak formatla
export function formatNumeric(value: any): string {
  if (value === null || value === undefined) return '';
  return value.toString();
}

// String'i veritabanı için sayısal değere dönüştür
export function parseNumeric(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const parsed = parseFloat(value.replace(',', '.'));
  return isNaN(parsed) ? null : parsed;
}

export type InsertOrderFixed = z.infer<typeof insertOrderSchemaFixed>;

// CreateChildOrder için özel şema (daha az alan içerir)
export const createChildOrderSchema = insertOrderSchemaFixed.omit({
  orderNumber: true,
  customerId: true,
  fabricTypeId: true,
  statusId: true,
}).extend({
  parentOrderId: z.number().int().positive("Ana sipariş seçimi zorunludur"),
  orderType: z.literal('block_color'),
  quantity: z.coerce.number().positive("Miktar sıfırdan büyük olmalıdır"),
  color: z.string().min(1, "Renk belirtilmelidir").optional(),
});

export type CreateChildOrder = z.infer<typeof createChildOrderSchema>;