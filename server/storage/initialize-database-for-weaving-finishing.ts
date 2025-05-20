/**
 * Dokuma/Terbiye/Apre Modülleri için Veritabanı Tablolarını Oluşturma
 */

import { db } from "../db";
import { migrationLogger } from "./migration-logger";
import { sql } from "drizzle-orm";

export async function initializeWeavingFinishingTables() {
  try {
    // Dokuma/Terbiye/Apre entegrasyonu için tablo oluşturma işlemleri
    await createTablesIfNotExist();
    console.log("Dokuma/Terbiye/Apre tabloları başarıyla oluşturuldu");
  } catch (error) {
    console.error("Dokuma/Terbiye/Apre tabloları oluşturulurken hata:", error);
    throw error;
  }
}

async function createTablesIfNotExist() {
  try {
    // Dokuma iş emirleri tablosu
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "weaving_orders" (
        "id" SERIAL PRIMARY KEY,
        "order_number" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "fabric_type" VARCHAR(255) NOT NULL,
        "quantity" FLOAT NOT NULL,
        "unit" VARCHAR(50) NOT NULL DEFAULT 'metre',
        "planned_start_date" TIMESTAMP,
        "planned_end_date" TIMESTAMP,
        "actual_start_date" TIMESTAMP,
        "actual_end_date" TIMESTAMP,
        "status" VARCHAR(50) DEFAULT 'planned',
        "machine_id" INTEGER,
        "operator_id" INTEGER,
        "department_id" INTEGER,
        "notes" TEXT,
        "order_id" INTEGER,
        "created_by" INTEGER,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);
    migrationLogger.log("'weaving_orders' tablosu kontrol edildi/oluşturuldu");

    // Dokuma operasyonları tablosu
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "weaving_operations" (
        "id" SERIAL PRIMARY KEY,
        "order_id" INTEGER NOT NULL REFERENCES "weaving_orders"("id") ON DELETE CASCADE,
        "operation_type" VARCHAR(100) NOT NULL,
        "sequence_number" INTEGER NOT NULL,
        "description" TEXT,
        "planned_start_date" TIMESTAMP,
        "planned_end_date" TIMESTAMP,
        "actual_start_date" TIMESTAMP,
        "actual_end_date" TIMESTAMP,
        "assigned_to" INTEGER,
        "status" VARCHAR(50) DEFAULT 'planned',
        "machine_id" INTEGER,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);
    migrationLogger.log("'weaving_operations' tablosu kontrol edildi/oluşturuldu");

    // Dokuma hataları tablosu
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "weaving_defects" (
        "id" SERIAL PRIMARY KEY,
        "order_id" INTEGER NOT NULL REFERENCES "weaving_orders"("id") ON DELETE CASCADE,
        "defect_type" VARCHAR(100) NOT NULL,
        "severity" VARCHAR(50) NOT NULL,
        "position_x" FLOAT,
        "position_y" FLOAT,
        "width" FLOAT,
        "height" FLOAT,
        "comments" TEXT,
        "detected_by" INTEGER,
        "detected_at" TIMESTAMP DEFAULT NOW(),
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);
    migrationLogger.log("'weaving_defects' tablosu kontrol edildi/oluşturuldu");

    // Terbiye/Apre işlemleri tablosu
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "finishing_processes" (
        "id" SERIAL PRIMARY KEY,
        "process_code" VARCHAR(255) NOT NULL,
        "process_type" VARCHAR(100) NOT NULL,
        "department_id" INTEGER NOT NULL,
        "fabric_type" VARCHAR(255) NOT NULL,
        "quantity" FLOAT NOT NULL,
        "unit" VARCHAR(50) NOT NULL DEFAULT 'metre',
        "planned_start_date" TIMESTAMP,
        "planned_end_date" TIMESTAMP,
        "actual_start_date" TIMESTAMP,
        "actual_end_date" TIMESTAMP,
        "status" VARCHAR(50) DEFAULT 'planned',
        "notes" TEXT,
        "created_by" INTEGER,
        "source_order_id" INTEGER,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);
    migrationLogger.log("'finishing_processes' tablosu kontrol edildi/oluşturuldu");

    // Terbiye/Apre operasyonları tablosu
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "finishing_operations" (
        "id" SERIAL PRIMARY KEY,
        "process_id" INTEGER NOT NULL REFERENCES "finishing_processes"("id") ON DELETE CASCADE,
        "operation_type" VARCHAR(100) NOT NULL,
        "sequence_number" INTEGER NOT NULL,
        "description" TEXT,
        "planned_start_date" TIMESTAMP,
        "planned_end_date" TIMESTAMP,
        "actual_start_date" TIMESTAMP,
        "actual_end_date" TIMESTAMP,
        "assigned_to" INTEGER,
        "status" VARCHAR(50) DEFAULT 'planned',
        "machine_id" INTEGER,
        "temperature" FLOAT,
        "pressure" FLOAT,
        "duration_minutes" INTEGER,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);
    migrationLogger.log("'finishing_operations' tablosu kontrol edildi/oluşturuldu");

    // Terbiye/Apre kalite testleri tablosu
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "finishing_quality_tests" (
        "id" SERIAL PRIMARY KEY,
        "process_id" INTEGER NOT NULL REFERENCES "finishing_processes"("id") ON DELETE CASCADE,
        "test_type" VARCHAR(100) NOT NULL,
        "test_date" TIMESTAMP,
        "tester_id" INTEGER,
        "result_value" FLOAT,
        "result_unit" VARCHAR(50),
        "pass_fail" BOOLEAN,
        "expected_min" FLOAT,
        "expected_max" FLOAT,
        "comments" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);
    migrationLogger.log("'finishing_quality_tests' tablosu kontrol edildi/oluşturuldu");

    // Terbiye/Apre reçeteleri tablosu
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "finishing_recipes" (
        "id" SERIAL PRIMARY KEY,
        "process_id" INTEGER NOT NULL REFERENCES "finishing_processes"("id") ON DELETE CASCADE,
        "recipe_name" VARCHAR(255) NOT NULL,
        "chemical_name" VARCHAR(255) NOT NULL,
        "quantity" FLOAT NOT NULL,
        "unit" VARCHAR(50) NOT NULL,
        "application_order" INTEGER NOT NULL,
        "application_method" VARCHAR(100),
        "temperature" FLOAT,
        "duration_minutes" INTEGER,
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);
    migrationLogger.log("'finishing_recipes' tablosu kontrol edildi/oluşturuldu");

    // Dokuma/Terbiye/Apre arası transfer işlemleri tablosu
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "process_transfers" (
        "id" SERIAL PRIMARY KEY,
        "source_process_id" INTEGER NOT NULL,
        "source_process_type" VARCHAR(100) NOT NULL,
        "target_process_id" INTEGER,
        "target_process_type" VARCHAR(100) NOT NULL,
        "target_department_id" INTEGER NOT NULL,
        "quantity" FLOAT NOT NULL,
        "unit" VARCHAR(50) NOT NULL DEFAULT 'metre',
        "transfer_date" TIMESTAMP,
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);
    migrationLogger.log("'process_transfers' tablosu kontrol edildi/oluşturuldu");

    return true;
  } catch (error) {
    console.error("Dokuma/Terbiye/Apre tabloları oluşturulurken hata:", error);
    throw error;
  }
}