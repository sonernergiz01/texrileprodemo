import { relations } from "drizzle-orm";
import { pgTable, serial, text, timestamp, integer, numeric, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Boya reçetesi ana tablosu
export const dyeRecipes = pgTable("dye_recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  recipeCode: text("recipe_code").notNull().unique(),
  recipeType: text("recipe_type").notNull(), // YARN, FABRIC
  colorCode: text("color_code"),
  colorName: text("color_name"),
  colorFamily: text("color_family"),
  processType: text("process_type"), // boyama türü: direkt, reaktif, dispers, vb.
  targetFabricType: text("target_fabric_type"), // hedef kumaş tipi için - pamuk, polyester, karışım vb.
  targetYarnType: text("target_yarn_type"), // hedef iplik tipi - pamuk, polyester, vb.
  materialAmount: numeric("material_amount"), // boyanacak malzeme miktarı
  materialUnit: text("material_unit").default("kg"), // kg, metre, vb.
  liquidRatio: numeric("liquid_ratio"), // flotte oranı - sıvı/kumaş oranı
  temperature: numeric("temperature"), // sıcaklık (Celsius)
  duration: numeric("duration"), // süre (dakika)
  pH: numeric("ph"), // pH değeri
  status: text("status").default("active"), // active, archived, draft
  notes: text("notes"),
  createdBy: integer("created_by").notNull(),
  updatedBy: integer("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isTemplate: boolean("is_template").default(false), // şablon mu yoksa özel reçete mi
  parentRecipeId: integer("parent_recipe_id"), // şablondan türetildiyse referans
  orderId: integer("order_id"), // bağlı olduğu sipariş varsa
  processParameters: json("process_parameters"), // ilave süreç parametreleri
});

// Reçete adımları - uygulama sırası, sıcaklık, süre vb.
export const dyeRecipeSteps = pgTable("dye_recipe_steps", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => dyeRecipes.id, { onDelete: "cascade" }),
  stepOrder: integer("step_order").notNull(), // uygulama sırası
  stepName: text("step_name").notNull(), // adım adı - ön yıkama, boyama, sabitleme, son yıkama vb.
  temperature: numeric("temperature"), // adım sıcaklığı
  duration: numeric("duration"), // adım süresi (dakika)
  notes: text("notes"),
  stepType: text("step_type").notNull(), // PREP, DYE, WASH, FIXATION, SOFTENING, etc.
  pH: numeric("ph"), // adımın pH değeri
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isOptional: boolean("is_optional").default(false),
  parameters: json("parameters"), // adıma özel diğer parametreler
});

// Reçete kimyasalları - hangi kimyasalın ne kadar kullanılacağı
export const dyeRecipeChemicals = pgTable("dye_recipe_chemicals", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => dyeRecipes.id, { onDelete: "cascade" }),
  stepId: integer("step_id").references(() => dyeRecipeSteps.id, { onDelete: "cascade" }),
  chemicalId: integer("chemical_id").notNull(), // kimyasal referansı
  chemicalName: text("chemical_name").notNull(), // kimyasal adı (yedekleme amaçlı)
  quantity: numeric("quantity").notNull(), // miktar
  unit: text("unit").default("g/L").notNull(), // g/L, %, ml/L vb.
  purpose: text("purpose"), // hangi amaçla kullanıldığı - boyama, pH ayarı, yumuşatma vb.
  additionTime: numeric("addition_time"), // ne zaman ekleneceği (dakika)
  additionTemperature: numeric("addition_temperature"), // hangi sıcaklıkta ekleneceği
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isOptional: boolean("is_optional").default(false), // opsiyonel mi
  isActive: boolean("is_active").default(true), // aktif mi
});

// Kimyasallar ana tablosu
export const dyeChemicals = pgTable("dye_chemicals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  category: text("category").notNull(), // DYE, AUXILIARY, ACID, ALKALI, SALT, SOFTENER, vb.
  description: text("description"),
  supplier: text("supplier"),
  defaultUnit: text("default_unit").default("g/L"),
  stockAmount: numeric("stock_amount").default("0"),
  minStockLevel: numeric("min_stock_level").default("0"),
  price: numeric("price"),
  priceCurrency: text("price_currency").default("TRY"),
  safetyNotes: text("safety_notes"),
  storageConditions: text("storage_conditions"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  properties: json("properties"),
});

// Reçete uygulama kaydı - reçetenin hangi parti için kullanıldığı, sonuç vb.
export const dyeRecipeApplications = pgTable("dye_recipe_applications", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => dyeRecipes.id),
  batchNumber: text("batch_number").notNull(),
  orderId: integer("order_id"),
  materialType: text("material_type").notNull(), // YARN, FABRIC
  materialAmount: numeric("material_amount").notNull(),
  materialUnit: text("material_unit").default("kg"),
  operatorId: integer("operator_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  status: text("status").default("in_progress"), // in_progress, completed, failed
  resultNotes: text("result_notes"),
  qualityScore: integer("quality_score"), // 1-10 arası kalite puanı
  colorDeviation: numeric("color_deviation"), // renk sapması (delta E)
  machineId: integer("machine_id"), // hangi makinede yapıldığı
  parameters: json("parameters"), // uygulama sırasındaki özel parametreler
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// İlişkiler
export const dyeRecipesRelations = relations(dyeRecipes, ({ many, one }) => ({
  steps: many(dyeRecipeSteps),
  chemicals: many(dyeRecipeChemicals),
  applications: many(dyeRecipeApplications),
  parentRecipe: one(dyeRecipes, {
    fields: [dyeRecipes.parentRecipeId],
    references: [dyeRecipes.id],
  }),
}));

export const dyeRecipeStepsRelations = relations(dyeRecipeSteps, ({ one, many }) => ({
  recipe: one(dyeRecipes, {
    fields: [dyeRecipeSteps.recipeId],
    references: [dyeRecipes.id],
  }),
  chemicals: many(dyeRecipeChemicals)
}));

export const dyeRecipeChemicalsRelations = relations(dyeRecipeChemicals, ({ one }) => ({
  recipe: one(dyeRecipes, {
    fields: [dyeRecipeChemicals.recipeId],
    references: [dyeRecipes.id],
  }),
  step: one(dyeRecipeSteps, {
    fields: [dyeRecipeChemicals.stepId],
    references: [dyeRecipeSteps.id],
  }),
  chemical: one(dyeChemicals, {
    fields: [dyeRecipeChemicals.chemicalId],
    references: [dyeChemicals.id],
  })
}));

export const dyeChemicalsRelations = relations(dyeChemicals, ({ many }) => ({
  recipeChemicals: many(dyeRecipeChemicals)
}));

export const dyeRecipeApplicationsRelations = relations(dyeRecipeApplications, ({ one }) => ({
  recipe: one(dyeRecipes, {
    fields: [dyeRecipeApplications.recipeId],
    references: [dyeRecipes.id],
  })
}));

// Zod şemaları
export const insertDyeRecipeSchema = createInsertSchema(dyeRecipes).omit({ id: true });
export const insertDyeRecipeStepSchema = createInsertSchema(dyeRecipeSteps).omit({ id: true });
export const insertDyeRecipeChemicalSchema = createInsertSchema(dyeRecipeChemicals).omit({ id: true });
export const insertDyeChemicalSchema = createInsertSchema(dyeChemicals).omit({ id: true });
export const insertDyeRecipeApplicationSchema = createInsertSchema(dyeRecipeApplications).omit({ id: true });

// TypeScript türleri
export type DyeRecipe = typeof dyeRecipes.$inferSelect;
export type InsertDyeRecipe = z.infer<typeof insertDyeRecipeSchema>;

export type DyeRecipeStep = typeof dyeRecipeSteps.$inferSelect;
export type InsertDyeRecipeStep = z.infer<typeof insertDyeRecipeStepSchema>;

export type DyeRecipeChemical = typeof dyeRecipeChemicals.$inferSelect;
export type InsertDyeRecipeChemical = z.infer<typeof insertDyeRecipeChemicalSchema>;

export type DyeChemical = typeof dyeChemicals.$inferSelect;
export type InsertDyeChemical = z.infer<typeof insertDyeChemicalSchema>;

export type DyeRecipeApplication = typeof dyeRecipeApplications.$inferSelect;
export type InsertDyeRecipeApplication = z.infer<typeof insertDyeRecipeApplicationSchema>;