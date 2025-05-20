import { db } from "../db";
import {
  kartelas,
  kartelaItems,
  kartelaStockMovements,
  kartelaShipments
} from "../../shared/schema-kartela";
import { sql } from "drizzle-orm";

/**
 * Kartela tabloları oluşturma fonksiyonu
 */
export async function createKartelaTables() {
  try {
    console.log("Kartela tabloları oluşturuluyor...");

    // Kartela tablosu
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "kartelas" (
        "id" SERIAL PRIMARY KEY,
        "kartela_code" TEXT NOT NULL UNIQUE,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "customer_id" INTEGER REFERENCES "customers"("id"),
        "customer_name" TEXT,
        "status" TEXT NOT NULL DEFAULT 'draft',
        "qr_code" TEXT NOT NULL,
        "notes" TEXT,
        "created_by" INTEGER NOT NULL REFERENCES "users"("id"),
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Migration: 'kartelas' tablosu kontrol edildi/oluşturuldu");

    // Kartela Öğeleri (kumaşlar) tablosu
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "kartela_items" (
        "id" SERIAL PRIMARY KEY,
        "kartela_id" INTEGER NOT NULL REFERENCES "kartelas"("id") ON DELETE CASCADE,
        "fabric_type_id" INTEGER NOT NULL REFERENCES "fabric_types"("id"),
        "fabric_type_name" TEXT NOT NULL,
        "fabric_code" TEXT NOT NULL,
        "color" TEXT,
        "weight" NUMERIC,
        "width" NUMERIC,
        "composition" TEXT,
        "properties" JSONB,
        "qr_code" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Migration: 'kartela_items' tablosu kontrol edildi/oluşturuldu");

    // Kartela Stok Hareketleri tablosu
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "kartela_stock_movements" (
        "id" SERIAL PRIMARY KEY,
        "kartela_id" INTEGER NOT NULL REFERENCES "kartelas"("id") ON DELETE CASCADE,
        "kartela_item_id" INTEGER REFERENCES "kartela_items"("id") ON DELETE SET NULL,
        "movement_type" TEXT NOT NULL,
        "quantity" NUMERIC NOT NULL,
        "unit" TEXT NOT NULL,
        "customer_id" INTEGER REFERENCES "customers"("id"),
        "notes" TEXT,
        "document_number" TEXT,
        "created_by" INTEGER NOT NULL REFERENCES "users"("id"),
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Migration: 'kartela_stock_movements' tablosu kontrol edildi/oluşturuldu");

    // Kartela Sevkiyatları tablosu
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "kartela_shipments" (
        "id" SERIAL PRIMARY KEY,
        "kartela_id" INTEGER NOT NULL REFERENCES "kartelas"("id") ON DELETE CASCADE,
        "customer_id" INTEGER NOT NULL REFERENCES "customers"("id"),
        "customer_name" TEXT NOT NULL,
        "shipment_date" TIMESTAMP NOT NULL,
        "shipment_method" TEXT NOT NULL,
        "tracking_number" TEXT,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "notes" TEXT,
        "created_by" INTEGER NOT NULL REFERENCES "users"("id"),
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Migration: 'kartela_shipments' tablosu kontrol edildi/oluşturuldu");

    // İndeksler oluştur
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "kartela_items_kartela_id_idx" ON "kartela_items" ("kartela_id");
      CREATE INDEX IF NOT EXISTS "kartela_items_fabric_code_idx" ON "kartela_items" ("fabric_code");
      CREATE INDEX IF NOT EXISTS "kartela_stock_movements_kartela_id_idx" ON "kartela_stock_movements" ("kartela_id");
      CREATE INDEX IF NOT EXISTS "kartela_stock_movements_item_id_idx" ON "kartela_stock_movements" ("kartela_item_id");
      CREATE INDEX IF NOT EXISTS "kartela_shipments_kartela_id_idx" ON "kartela_shipments" ("kartela_id");
      CREATE INDEX IF NOT EXISTS "kartela_shipments_customer_id_idx" ON "kartela_shipments" ("customer_id");
    `);

    console.log("Kartela tabloları başarıyla oluşturuldu");
    return { success: true };
  } catch (error) {
    console.error("Kartela tabloları oluşturulurken hata:", error);
    return { success: false, error };
  }
}