/**
 * Sipariş - Üretim - Sevkiyat Entegrasyon Tabloları Oluşturma
 * 
 * Bu dosya, sipariş-üretim-sevkiyat bütünlüğü için oluşturulan
 * yeni tabloların veritabanında oluşturulmasını sağlar.
 */

import { sql } from "drizzle-orm";
import { db } from "../db";
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

/**
 * Sipariş-Üretim-Sevkiyat Entegrasyon tablolarını oluşturur veya günceller
 */
export async function initializeOrdersIntegrationTables() {
  try {
    console.log("Sipariş-Üretim-Sevkiyat entegrasyon tabloları oluşturuluyor...");

    // orderTrackingStatuses tablosunu oluştur
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "order_tracking_statuses" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "code" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "color" TEXT DEFAULT '#3b82f6',
        "sequence" INTEGER NOT NULL,
        "is_active" BOOLEAN DEFAULT TRUE NOT NULL
      )
    `);
    console.log("Migration: 'order_tracking_statuses' tablosu kontrol edildi/oluşturuldu");

    // orderStatusTransitions tablosunu oluştur
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "order_status_transitions" (
        "id" SERIAL PRIMARY KEY,
        "from_status_id" INTEGER NOT NULL REFERENCES "order_tracking_statuses"("id"),
        "to_status_id" INTEGER NOT NULL REFERENCES "order_tracking_statuses"("id"),
        "description" TEXT,
        "is_automated" BOOLEAN DEFAULT FALSE,
        "required_permission" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Migration: 'order_status_transitions' tablosu kontrol edildi/oluşturuldu");

    // orderTracking tablosunu oluştur
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "order_tracking" (
        "id" SERIAL PRIMARY KEY,
        "order_id" INTEGER NOT NULL REFERENCES "orders"("id"),
        "status_id" INTEGER NOT NULL REFERENCES "order_tracking_statuses"("id"),
        "note" TEXT,
        "timestamp" TIMESTAMP DEFAULT NOW() NOT NULL,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
        "production_plan_id" INTEGER REFERENCES "production_plans"("id"),
        "shipment_id" INTEGER,
        "data" JSONB
      )
    `);
    console.log("Migration: 'order_tracking' tablosu kontrol edildi/oluşturuldu");

    // orderProductionSteps tablosunu oluştur
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "order_production_steps" (
        "id" SERIAL PRIMARY KEY,
        "order_id" INTEGER NOT NULL REFERENCES "orders"("id"),
        "production_plan_id" INTEGER NOT NULL REFERENCES "production_plans"("id"),
        "step" TEXT NOT NULL,
        "step_order" INTEGER NOT NULL,
        "department_id" INTEGER NOT NULL REFERENCES "departments"("id"),
        "start_date" TIMESTAMP,
        "end_date" TIMESTAMP,
        "status" TEXT DEFAULT 'pending' NOT NULL,
        "completion_percentage" INTEGER DEFAULT 0,
        "notes" TEXT,
        "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_by" INTEGER NOT NULL REFERENCES "users"("id")
      )
    `);
    console.log("Migration: 'order_production_steps' tablosu kontrol edildi/oluşturuldu");

    // orderShipments tablosunu oluştur
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "order_shipments" (
        "id" SERIAL PRIMARY KEY,
        "order_id" INTEGER NOT NULL REFERENCES "orders"("id"),
        "shipment_id" INTEGER,
        "quantity" NUMERIC NOT NULL,
        "unit" TEXT NOT NULL,
        "package_count" INTEGER,
        "pallet_count" INTEGER,
        "gross_weight" NUMERIC,
        "net_weight" NUMERIC,
        "volume_m3" NUMERIC,
        "is_complete" BOOLEAN DEFAULT FALSE,
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "created_by" INTEGER NOT NULL REFERENCES "users"("id")
      )
    `);
    console.log("Migration: 'order_shipments' tablosu kontrol edildi/oluşturuldu");

    // orderStatusHistory tablosunu oluştur
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "order_status_history" (
        "id" SERIAL PRIMARY KEY,
        "order_id" INTEGER NOT NULL REFERENCES "orders"("id"),
        "old_status_id" INTEGER REFERENCES "order_statuses"("id"),
        "new_status_id" INTEGER NOT NULL REFERENCES "order_statuses"("id"),
        "change_date" TIMESTAMP DEFAULT NOW() NOT NULL,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
        "reason" TEXT,
        "notes" TEXT
      )
    `);
    console.log("Migration: 'order_status_history' tablosu kontrol edildi/oluşturuldu");

    // orderDelayReasons tablosunu oluştur
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "order_delay_reasons" (
        "id" SERIAL PRIMARY KEY,
        "order_id" INTEGER NOT NULL REFERENCES "orders"("id"),
        "reason" TEXT NOT NULL,
        "description" TEXT,
        "delay_days" INTEGER,
        "new_due_date" DATE,
        "is_cancelled" BOOLEAN DEFAULT FALSE,
        "reported_by" INTEGER NOT NULL REFERENCES "users"("id"),
        "reported_date" TIMESTAMP DEFAULT NOW() NOT NULL,
        "approved_by" INTEGER REFERENCES "users"("id"),
        "approved_date" TIMESTAMP
      )
    `);
    console.log("Migration: 'order_delay_reasons' tablosu kontrol edildi/oluşturuldu");

    // productionPriorityRules tablosunu oluştur
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "production_priority_rules" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "priority_level" INTEGER NOT NULL,
        "conditions" JSONB,
        "is_active" BOOLEAN DEFAULT TRUE,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "created_by" INTEGER NOT NULL REFERENCES "users"("id")
      )
    `);
    console.log("Migration: 'production_priority_rules' tablosu kontrol edildi/oluşturuldu");

    // orderMaterialRequirements tablosunu oluştur
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "order_material_requirements" (
        "id" SERIAL PRIMARY KEY,
        "order_id" INTEGER NOT NULL REFERENCES "orders"("id"),
        "material_type" TEXT NOT NULL,
        "material_id" INTEGER,
        "description" TEXT NOT NULL,
        "quantity" NUMERIC NOT NULL,
        "unit" TEXT NOT NULL,
        "is_available" BOOLEAN DEFAULT FALSE,
        "estimated_arrival_date" DATE,
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log("Migration: 'order_material_requirements' tablosu kontrol edildi/oluşturuldu");

    console.log("Sipariş-Üretim-Sevkiyat entegrasyonu tabloları başarıyla oluşturuldu");
    
    return true;
  } catch (error) {
    console.error("Sipariş-Üretim-Sevkiyat entegrasyonu tabloları oluşturulurken hata:", error);
    return false;
  }
}

/**
 * Varsayılan sipariş takip durumlarını oluşturur
 */
export async function createDefaultOrderTrackingStatuses() {
  try {
    // Mevcut kayıtları kontrol et
    const existingStatuses = await db.select().from(orderTrackingStatuses);
    
    if (existingStatuses.length > 0) {
      console.log("Sipariş takip durumları zaten oluşturulmuş, atlanıyor...");
      return true;
    }
    
    console.log("Varsayılan sipariş takip durumları oluşturuluyor...");
    
    // Varsayılan durumlar
    const defaultStatuses = [
      { name: "Sipariş Alındı", code: "ORDER_RECEIVED", description: "Sipariş sisteme kaydedildi", color: "#3b82f6", sequence: 1, isActive: true },
      { name: "Planlama Başladı", code: "PLANNING_STARTED", description: "Üretim planlama süreci başladı", color: "#10b981", sequence: 2, isActive: true },
      { name: "Hammadde Hazırlanıyor", code: "MATERIALS_PREPARATION", description: "Üretim için gerekli hammaddeler hazırlanıyor", color: "#f59e0b", sequence: 3, isActive: true },
      { name: "Dokuma Başladı", code: "WEAVING_STARTED", description: "Dokuma süreci başladı", color: "#6366f1", sequence: 4, isActive: true },
      { name: "Dokuma Tamamlandı", code: "WEAVING_COMPLETED", description: "Dokuma süreci tamamlandı", color: "#8b5cf6", sequence: 5, isActive: true },
      { name: "Ham Kalite Kontrolde", code: "RAW_QUALITY_CHECK", description: "Ham kumaş kalite kontrolünde", color: "#ec4899", sequence: 6, isActive: true },
      { name: "Ön Depoda", code: "PRE_STORAGE", description: "Kumaş terbiye öncesi ön depoda", color: "#d946ef", sequence: 7, isActive: true },
      { name: "Terbiye/Apre Başladı", code: "FINISHING_STARTED", description: "Terbiye/apre süreci başladı", color: "#14b8a6", sequence: 8, isActive: true },
      { name: "Terbiye/Apre Tamamlandı", code: "FINISHING_COMPLETED", description: "Terbiye/apre süreci tamamlandı", color: "#0ea5e9", sequence: 9, isActive: true },
      { name: "Son Kalite Kontrolde", code: "FINAL_QUALITY_CHECK", description: "Son kalite kontrolü yapılıyor", color: "#ef4444", sequence: 10, isActive: true },
      { name: "Depoda", code: "IN_STORAGE", description: "Ürün depoda, sevkiyata hazır", color: "#84cc16", sequence: 11, isActive: true },
      { name: "Sevkiyat Hazırlığında", code: "SHIPPING_PREPARATION", description: "Sevkiyat için paketleme ve hazırlık", color: "#f97316", sequence: 12, isActive: true },
      { name: "Sevk Edildi", code: "SHIPPED", description: "Ürün müşteriye sevk edildi", color: "#06b6d4", sequence: 13, isActive: true },
      { name: "Teslim Edildi", code: "DELIVERED", description: "Müşteriye teslim edildi", color: "#22c55e", sequence: 14, isActive: true },
      { name: "İptal Edildi", code: "CANCELLED", description: "Sipariş iptal edildi", color: "#dc2626", sequence: 15, isActive: true },
      { name: "Askıya Alındı", code: "ON_HOLD", description: "Sipariş askıya alındı", color: "#eab308", sequence: 16, isActive: true },
    ];
    
    // Durumları ekle
    for (const status of defaultStatuses) {
      await db.insert(orderTrackingStatuses).values({
        name: status.name,
        code: status.code,
        description: status.description,
        color: status.color,
        sequence: status.sequence,
        isActive: status.isActive
      });
    }
    
    console.log("Varsayılan sipariş takip durumları başarıyla oluşturuldu");
    return true;
  } catch (error) {
    console.error("Varsayılan sipariş takip durumları oluşturulurken hata:", error);
    return false;
  }
}

/**
 * Durum geçiş kurallarını oluşturur
 */
export async function createDefaultStatusTransitions() {
  try {
    // Mevcut kayıtları kontrol et
    const existingTransitions = await db.select().from(orderStatusTransitions);
    
    if (existingTransitions.length > 0) {
      console.log("Durum geçiş kuralları zaten oluşturulmuş, atlanıyor...");
      return true;
    }
    
    console.log("Varsayılan durum geçiş kuralları oluşturuluyor...");
    
    // Önce tüm durum kodlarını ve ID'lerini al
    const allStatuses = await db.select().from(orderTrackingStatuses);
    const statusMap = new Map(allStatuses.map(status => [status.code, status.id]));
    
    // Varsayılan geçiş kuralları - [fromStatusCode, toStatusCode, description, isAutomated, requiredPermission]
    const defaultTransitions = [
      ["ORDER_RECEIVED", "PLANNING_STARTED", "Sipariş planlamaya alındı", false, "planning:manage_plans"],
      ["PLANNING_STARTED", "MATERIALS_PREPARATION", "Planlama tamamlandı, hammadde hazırlığı başladı", false, "inventory:manage_materials"],
      ["MATERIALS_PREPARATION", "WEAVING_STARTED", "Hammaddeler hazır, dokuma başlatıldı", false, "weaving:manage_workorders"],
      ["WEAVING_STARTED", "WEAVING_COMPLETED", "Dokuma tamamlandı", false, "weaving:manage_workorders"],
      ["WEAVING_COMPLETED", "RAW_QUALITY_CHECK", "Ham kumaş kalite kontrole gönderildi", false, "quality:manage_checks"],
      ["RAW_QUALITY_CHECK", "PRE_STORAGE", "Kalite kontrol tamamlandı, ön depoya alındı", false, "inventory:manage_storage"],
      ["PRE_STORAGE", "FINISHING_STARTED", "Terbiye/apre süreci başlatıldı", false, "finishing:manage_processes"],
      ["FINISHING_STARTED", "FINISHING_COMPLETED", "Terbiye/apre tamamlandı", false, "finishing:manage_processes"],
      ["FINISHING_COMPLETED", "FINAL_QUALITY_CHECK", "Son kalite kontrole gönderildi", false, "quality:manage_checks"],
      ["FINAL_QUALITY_CHECK", "IN_STORAGE", "Kalite kontrol tamamlandı, depoya alındı", false, "inventory:manage_storage"],
      ["IN_STORAGE", "SHIPPING_PREPARATION", "Sevkiyat hazırlığı başlatıldı", false, "shipping:manage_shipments"],
      ["SHIPPING_PREPARATION", "SHIPPED", "Ürün sevk edildi", false, "shipping:manage_shipments"],
      ["SHIPPED", "DELIVERED", "Müşteriye teslim edildi", false, "shipping:manage_shipments"],
      ["ORDER_RECEIVED", "CANCELLED", "Sipariş iptal edildi", false, "sales:manage_orders"],
      ["ORDER_RECEIVED", "ON_HOLD", "Sipariş askıya alındı", false, "sales:manage_orders"],
      ["PLANNING_STARTED", "CANCELLED", "Sipariş iptal edildi", false, "sales:manage_orders"],
      ["PLANNING_STARTED", "ON_HOLD", "Sipariş askıya alındı", false, "sales:manage_orders"],
      ["MATERIALS_PREPARATION", "ON_HOLD", "Hammadde tedariki bekleniyor", false, "inventory:manage_materials"],
      ["ON_HOLD", "PLANNING_STARTED", "Askıdaki sipariş yeniden aktifleştirildi", false, "planning:manage_plans"],
    ];
    
    // Geçiş kurallarını ekle
    for (const transition of defaultTransitions) {
      const [fromCode, toCode, description, isAutomated, requiredPermission] = transition;
      
      // ID'leri kontrol et
      const fromStatusId = statusMap.get(fromCode);
      const toStatusId = statusMap.get(toCode);
      
      if (!fromStatusId || !toStatusId) {
        console.warn(`Geçersiz durum kodu: ${fromCode} -> ${toCode}`);
        continue;
      }
      
      await db.insert(orderStatusTransitions).values({
        fromStatusId,
        toStatusId,
        description,
        isAutomated: isAutomated === true,
        requiredPermission,
        createdAt: new Date()
      });
    }
    
    console.log("Varsayılan durum geçiş kuralları başarıyla oluşturuldu");
    return true;
  } catch (error) {
    console.error("Durum geçiş kuralları oluşturulurken hata:", error);
    return false;
  }
}