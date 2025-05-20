import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { 
  dyeRecipes, 
  dyeRecipeSteps, 
  dyeRecipeChemicals, 
  dyeChemicals,
  dyeRecipeApplications 
} from "../../shared/schema-dye-recipes";

/**
 * Boya reçeteleri için gerekli tabloları oluşturur
 */
export async function createDyeRecipesTables() {
  console.log("Boya reçeteleri tabloları oluşturuluyor...");

  try {
    // Boya reçeteleri ana tablosu
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS dye_recipes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        recipe_code TEXT NOT NULL UNIQUE,
        recipe_type TEXT NOT NULL,
        color_code TEXT,
        color_name TEXT,
        color_family TEXT,
        process_type TEXT,
        target_fabric_type TEXT,
        target_yarn_type TEXT,
        material_amount DECIMAL,
        material_unit TEXT DEFAULT 'kg',
        liquid_ratio DECIMAL,
        temperature DECIMAL,
        duration DECIMAL,
        ph DECIMAL,
        status TEXT DEFAULT 'active',
        notes TEXT,
        created_by INTEGER NOT NULL,
        updated_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        is_template BOOLEAN DEFAULT false,
        parent_recipe_id INTEGER,
        order_id INTEGER,
        process_parameters JSONB
      )
    `);
    console.log("Migration: 'dye_recipes' tablosu kontrol edildi/oluşturuldu");

    // Reçete adımları tablosu
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS dye_recipe_steps (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER NOT NULL REFERENCES dye_recipes(id) ON DELETE CASCADE,
        step_order INTEGER NOT NULL,
        step_name TEXT NOT NULL,
        temperature DECIMAL,
        duration DECIMAL,
        notes TEXT,
        step_type TEXT NOT NULL,
        ph DECIMAL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        is_optional BOOLEAN DEFAULT false,
        parameters JSONB
      )
    `);
    console.log("Migration: 'dye_recipe_steps' tablosu kontrol edildi/oluşturuldu");

    // Kimyasallar ana tablosu
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS dye_chemicals (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        description TEXT,
        supplier TEXT,
        default_unit TEXT DEFAULT 'g/L',
        stock_amount DECIMAL DEFAULT 0,
        min_stock_level DECIMAL DEFAULT 0,
        price DECIMAL,
        price_currency TEXT DEFAULT 'TRY',
        safety_notes TEXT,
        storage_conditions TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        properties JSONB
      )
    `);
    console.log("Migration: 'dye_chemicals' tablosu kontrol edildi/oluşturuldu");

    // Reçete kimyasalları tablosu
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS dye_recipe_chemicals (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER NOT NULL REFERENCES dye_recipes(id) ON DELETE CASCADE,
        step_id INTEGER REFERENCES dye_recipe_steps(id) ON DELETE CASCADE,
        chemical_id INTEGER NOT NULL REFERENCES dye_chemicals(id) ON DELETE RESTRICT,
        chemical_name TEXT NOT NULL,
        quantity DECIMAL NOT NULL,
        unit TEXT DEFAULT 'g/L' NOT NULL,
        purpose TEXT,
        addition_time DECIMAL,
        addition_temperature DECIMAL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        is_optional BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true
      )
    `);
    console.log("Migration: 'dye_recipe_chemicals' tablosu kontrol edildi/oluşturuldu");

    // Reçete uygulama kaydı tablosu
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS dye_recipe_applications (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER NOT NULL REFERENCES dye_recipes(id),
        batch_number TEXT NOT NULL,
        order_id INTEGER,
        material_type TEXT NOT NULL,
        material_amount DECIMAL NOT NULL,
        material_unit TEXT DEFAULT 'kg',
        operator_id INTEGER NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        status TEXT DEFAULT 'in_progress',
        result_notes TEXT,
        quality_score INTEGER,
        color_deviation DECIMAL,
        machine_id INTEGER,
        parameters JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Migration: 'dye_recipe_applications' tablosu kontrol edildi/oluşturuldu");

    // Temel kimyasal kategorilerini ekle
    await createDefaultChemicalCategories();

    console.log("Boya reçeteleri tabloları başarıyla oluşturuldu");
  } catch (error) {
    console.error("Boya reçeteleri tabloları oluşturulurken hata:", error);
    throw error;
  }
}

/**
 * Varsayılan kimyasal kategorilerini oluştur
 */
async function createDefaultChemicalCategories() {
  try {
    // Kimyasal kategorileri
    const defaultChemicals = [
      { name: "Reaktif Boya - Mavi", code: "RB-BLUE-01", category: "DYE", description: "Reaktif mavi boya", defaultUnit: "g/L" },
      { name: "Reaktif Boya - Kırmızı", code: "RB-RED-01", category: "DYE", description: "Reaktif kırmızı boya", defaultUnit: "g/L" },
      { name: "Reaktif Boya - Sarı", code: "RB-YELLOW-01", category: "DYE", description: "Reaktif sarı boya", defaultUnit: "g/L" },
      { name: "Sodyum Karbonat", code: "SC-01", category: "ALKALI", description: "pH artırıcı", defaultUnit: "g/L" },
      { name: "Sodyum Sülfat", code: "SS-01", category: "SALT", description: "Tuz", defaultUnit: "g/L" },
      { name: "Islatıcı", code: "WA-01", category: "AUXILIARY", description: "Islatma ajanı", defaultUnit: "g/L" },
      { name: "Fiksatör", code: "FIX-01", category: "AUXILIARY", description: "Renk fiksasyonu", defaultUnit: "g/L" },
      { name: "Asetik Asit", code: "AA-01", category: "ACID", description: "pH düşürücü", defaultUnit: "ml/L" },
      { name: "Yumuşatıcı", code: "SOFT-01", category: "SOFTENER", description: "Kumaş yumuşatıcı", defaultUnit: "g/L" },
    ];

    // Varolan kimyasalları kontrol et
    const existingChemicals = await db.select().from(dyeChemicals);
    if (existingChemicals.length > 0) {
      console.log("Kimyasallar zaten mevcut, varsayılan kimyasallar oluşturulmadı.");
      return;
    }

    // Kimyasalları ekle
    for (const chemical of defaultChemicals) {
      await db.insert(dyeChemicals).values({
        name: chemical.name,
        code: chemical.code,
        category: chemical.category,
        description: chemical.description,
        defaultUnit: chemical.defaultUnit,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log("Varsayılan kimyasallar başarıyla oluşturuldu");
  } catch (error) {
    console.error("Varsayılan kimyasallar oluşturulurken hata:", error);
  }
}