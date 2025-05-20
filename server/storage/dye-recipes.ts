import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import { db } from "../db";
import { 
  dyeRecipes, 
  dyeRecipeSteps, 
  dyeRecipeChemicals, 
  dyeChemicals,
  dyeRecipeApplications,
  type DyeRecipe,
  type InsertDyeRecipe,
  type DyeRecipeStep,
  type InsertDyeRecipeStep,
  type DyeRecipeChemical,
  type InsertDyeRecipeChemical,
  type DyeChemical,
  type InsertDyeChemical,
  type DyeRecipeApplication,
  type InsertDyeRecipeApplication
} from "../../shared/schema-dye-recipes";

/**
 * Boya reçeteleri ile ilgili veritabanı işlemleri
 */
export class DyeRecipesStorage {
  
  /**
   * Tüm boya reçetelerini getirir
   */
  async getAllDyeRecipes(): Promise<DyeRecipe[]> {
    try {
      const recipes = await db
        .select()
        .from(dyeRecipes)
        .orderBy(desc(dyeRecipes.updatedAt));
      
      return recipes;
    } catch (error) {
      console.error("Boya reçeteleri alınırken hata:", error);
      throw new Error(`Boya reçeteleri alınamadı: ${(error as Error).message}`);
    }
  }

  /**
   * Belirli bir tipte (iplik/kumaş) boya reçetelerini getirir
   */
  async getDyeRecipesByType(recipeType: string): Promise<DyeRecipe[]> {
    try {
      const recipes = await db
        .select()
        .from(dyeRecipes)
        .where(eq(dyeRecipes.recipeType, recipeType))
        .orderBy(desc(dyeRecipes.updatedAt));
      
      return recipes;
    } catch (error) {
      console.error(`${recipeType} tipi boya reçeteleri alınırken hata:`, error);
      throw new Error(`${recipeType} tipi boya reçeteleri alınamadı: ${(error as Error).message}`);
    }
  }

  /**
   * ID'ye göre boya reçetesi getirir
   */
  async getDyeRecipeById(id: number): Promise<DyeRecipe | undefined> {
    try {
      const [recipe] = await db
        .select()
        .from(dyeRecipes)
        .where(eq(dyeRecipes.id, id));
      
      return recipe;
    } catch (error) {
      console.error(`Boya reçetesi (ID: ${id}) alınırken hata:`, error);
      throw new Error(`Boya reçetesi alınamadı: ${(error as Error).message}`);
    }
  }

  /**
   * Kod'a göre boya reçetesi getirir
   */
  async getDyeRecipeByCode(recipeCode: string): Promise<DyeRecipe | undefined> {
    try {
      const [recipe] = await db
        .select()
        .from(dyeRecipes)
        .where(eq(dyeRecipes.recipeCode, recipeCode));
      
      return recipe;
    } catch (error) {
      console.error(`Boya reçetesi (Kod: ${recipeCode}) alınırken hata:`, error);
      throw new Error(`Boya reçetesi alınamadı: ${(error as Error).message}`);
    }
  }

  /**
   * Belirli bir siparişe ait boya reçetelerini getirir
   */
  async getDyeRecipesByOrderId(orderId: number): Promise<DyeRecipe[]> {
    try {
      const recipes = await db
        .select()
        .from(dyeRecipes)
        .where(eq(dyeRecipes.orderId, orderId))
        .orderBy(desc(dyeRecipes.updatedAt));
      
      return recipes;
    } catch (error) {
      console.error(`Sipariş (ID: ${orderId}) için boya reçeteleri alınırken hata:`, error);
      throw new Error(`Sipariş için boya reçeteleri alınamadı: ${(error as Error).message}`);
    }
  }

  /**
   * Şablon reçeteleri getirir
   */
  async getTemplateDyeRecipes(): Promise<DyeRecipe[]> {
    try {
      const recipes = await db
        .select()
        .from(dyeRecipes)
        .where(eq(dyeRecipes.isTemplate, true))
        .orderBy(asc(dyeRecipes.name));
      
      return recipes;
    } catch (error) {
      console.error("Şablon boya reçeteleri alınırken hata:", error);
      throw new Error(`Şablon boya reçeteleri alınamadı: ${(error as Error).message}`);
    }
  }

  /**
   * Belirli bir reçetenin adımlarını getirir
   */
  async getDyeRecipeSteps(recipeId: number): Promise<DyeRecipeStep[]> {
    try {
      const steps = await db
        .select()
        .from(dyeRecipeSteps)
        .where(eq(dyeRecipeSteps.recipeId, recipeId))
        .orderBy(asc(dyeRecipeSteps.stepOrder));
      
      return steps;
    } catch (error) {
      console.error(`Reçete (ID: ${recipeId}) adımları alınırken hata:`, error);
      throw new Error(`Reçete adımları alınamadı: ${(error as Error).message}`);
    }
  }

  /**
   * Belirli bir reçetenin kimyasallarını getirir
   */
  async getDyeRecipeChemicals(recipeId: number): Promise<DyeRecipeChemical[]> {
    try {
      const chemicals = await db
        .select()
        .from(dyeRecipeChemicals)
        .where(eq(dyeRecipeChemicals.recipeId, recipeId))
        .orderBy(asc(dyeRecipeChemicals.id));
      
      return chemicals;
    } catch (error) {
      console.error(`Reçete (ID: ${recipeId}) kimyasalları alınırken hata:`, error);
      throw new Error(`Reçete kimyasalları alınamadı: ${(error as Error).message}`);
    }
  }

  /**
   * Belirli bir adıma ait kimyasalları getirir
   */
  async getStepChemicals(stepId: number): Promise<DyeRecipeChemical[]> {
    try {
      const chemicals = await db
        .select()
        .from(dyeRecipeChemicals)
        .where(eq(dyeRecipeChemicals.stepId, stepId))
        .orderBy(asc(dyeRecipeChemicals.id));
      
      return chemicals;
    } catch (error) {
      console.error(`Adım (ID: ${stepId}) kimyasalları alınırken hata:`, error);
      throw new Error(`Adım kimyasalları alınamadı: ${(error as Error).message}`);
    }
  }

  /**
   * Tüm kimyasalları getirir
   */
  async getAllChemicals(): Promise<DyeChemical[]> {
    try {
      const chemicals = await db
        .select()
        .from(dyeChemicals)
        .where(eq(dyeChemicals.isActive, true))
        .orderBy(asc(dyeChemicals.name));
      
      return chemicals;
    } catch (error) {
      console.error("Kimyasallar alınırken hata:", error);
      throw new Error(`Kimyasallar alınamadı: ${(error as Error).message}`);
    }
  }

  /**
   * Kategoriye göre kimyasalları getirir
   */
  async getChemicalsByCategory(category: string): Promise<DyeChemical[]> {
    try {
      const chemicals = await db
        .select()
        .from(dyeChemicals)
        .where(and(
          eq(dyeChemicals.category, category),
          eq(dyeChemicals.isActive, true)
        ))
        .orderBy(asc(dyeChemicals.name));
      
      return chemicals;
    } catch (error) {
      console.error(`${category} kategorisindeki kimyasallar alınırken hata:`, error);
      throw new Error(`Kimyasallar alınamadı: ${(error as Error).message}`);
    }
  }

  /**
   * ID'ye göre kimyasal getirir
   */
  async getChemicalById(id: number): Promise<DyeChemical | undefined> {
    try {
      const [chemical] = await db
        .select()
        .from(dyeChemicals)
        .where(eq(dyeChemicals.id, id));
      
      return chemical;
    } catch (error) {
      console.error(`Kimyasal (ID: ${id}) alınırken hata:`, error);
      throw new Error(`Kimyasal alınamadı: ${(error as Error).message}`);
    }
  }

  /**
   * Kod'a göre kimyasal getirir
   */
  async getChemicalByCode(code: string): Promise<DyeChemical | undefined> {
    try {
      const [chemical] = await db
        .select()
        .from(dyeChemicals)
        .where(eq(dyeChemicals.code, code));
      
      return chemical;
    } catch (error) {
      console.error(`Kimyasal (Kod: ${code}) alınırken hata:`, error);
      throw new Error(`Kimyasal alınamadı: ${(error as Error).message}`);
    }
  }

  /**
   * Reçete uygulamalarını getirir
   */
  async getDyeRecipeApplications(recipeId: number): Promise<DyeRecipeApplication[]> {
    try {
      const applications = await db
        .select()
        .from(dyeRecipeApplications)
        .where(eq(dyeRecipeApplications.recipeId, recipeId))
        .orderBy(desc(dyeRecipeApplications.startTime));
      
      return applications;
    } catch (error) {
      console.error(`Reçete (ID: ${recipeId}) uygulamaları alınırken hata:`, error);
      throw new Error(`Reçete uygulamaları alınamadı: ${(error as Error).message}`);
    }
  }

  /**
   * Sipariş için reçete uygulamalarını getirir
   */
  async getApplicationsByOrderId(orderId: number): Promise<DyeRecipeApplication[]> {
    try {
      const applications = await db
        .select()
        .from(dyeRecipeApplications)
        .where(eq(dyeRecipeApplications.orderId, orderId))
        .orderBy(desc(dyeRecipeApplications.startTime));
      
      return applications;
    } catch (error) {
      console.error(`Sipariş (ID: ${orderId}) için reçete uygulamaları alınırken hata:`, error);
      throw new Error(`Sipariş için reçete uygulamaları alınamadı: ${(error as Error).message}`);
    }
  }

  /**
   * Yeni boya reçetesi oluşturur
   */
  async createDyeRecipe(data: InsertDyeRecipe): Promise<DyeRecipe> {
    try {
      const currentDate = new Date();
      
      const [recipe] = await db
        .insert(dyeRecipes)
        .values({
          ...data,
          createdAt: currentDate,
          updatedAt: currentDate
        })
        .returning();
      
      return recipe;
    } catch (error) {
      console.error("Boya reçetesi oluşturulurken hata:", error);
      throw new Error(`Boya reçetesi oluşturulamadı: ${(error as Error).message}`);
    }
  }

  /**
   * Reçete adımı oluşturur
   */
  async createDyeRecipeStep(data: InsertDyeRecipeStep): Promise<DyeRecipeStep> {
    try {
      const currentDate = new Date();
      
      const [step] = await db
        .insert(dyeRecipeSteps)
        .values({
          ...data,
          createdAt: currentDate,
          updatedAt: currentDate
        })
        .returning();
      
      return step;
    } catch (error) {
      console.error("Reçete adımı oluşturulurken hata:", error);
      throw new Error(`Reçete adımı oluşturulamadı: ${(error as Error).message}`);
    }
  }

  /**
   * Reçete kimyasalı oluşturur
   */
  async createDyeRecipeChemical(data: InsertDyeRecipeChemical): Promise<DyeRecipeChemical> {
    try {
      const currentDate = new Date();
      
      // Kimyasal adını da ekle (silinen veya değişen bir kimyasal olursa referans kalması için)
      let chemicalName = data.chemicalName;
      if (!chemicalName) {
        const chemical = await this.getChemicalById(data.chemicalId);
        if (chemical) {
          chemicalName = chemical.name;
        } else {
          chemicalName = "Bilinmeyen Kimyasal";
        }
      }
      
      const [recipeChemical] = await db
        .insert(dyeRecipeChemicals)
        .values({
          ...data,
          chemicalName,
          createdAt: currentDate,
          updatedAt: currentDate
        })
        .returning();
      
      return recipeChemical;
    } catch (error) {
      console.error("Reçete kimyasalı oluşturulurken hata:", error);
      throw new Error(`Reçete kimyasalı oluşturulamadı: ${(error as Error).message}`);
    }
  }

  /**
   * Yeni kimyasal oluşturur
   */
  async createChemical(data: InsertDyeChemical): Promise<DyeChemical> {
    try {
      const currentDate = new Date();
      
      const [chemical] = await db
        .insert(dyeChemicals)
        .values({
          ...data,
          createdAt: currentDate,
          updatedAt: currentDate
        })
        .returning();
      
      return chemical;
    } catch (error) {
      console.error("Kimyasal oluşturulurken hata:", error);
      throw new Error(`Kimyasal oluşturulamadı: ${(error as Error).message}`);
    }
  }

  /**
   * Reçete uygulaması oluşturur
   */
  async createDyeRecipeApplication(data: InsertDyeRecipeApplication): Promise<DyeRecipeApplication> {
    try {
      const currentDate = new Date();
      
      const [application] = await db
        .insert(dyeRecipeApplications)
        .values({
          ...data,
          createdAt: currentDate,
          updatedAt: currentDate
        })
        .returning();
      
      return application;
    } catch (error) {
      console.error("Reçete uygulaması oluşturulurken hata:", error);
      throw new Error(`Reçete uygulaması oluşturulamadı: ${(error as Error).message}`);
    }
  }
  
  /**
   * Boya reçetesini günceller
   */
  async updateDyeRecipe(id: number, data: Partial<DyeRecipe>): Promise<DyeRecipe | undefined> {
    try {
      const [updatedRecipe] = await db
        .update(dyeRecipes)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(dyeRecipes.id, id))
        .returning();
      
      return updatedRecipe;
    } catch (error) {
      console.error(`Boya reçetesi (ID: ${id}) güncellenirken hata:`, error);
      throw new Error(`Boya reçetesi güncellenemedi: ${(error as Error).message}`);
    }
  }
  
  /**
   * Reçete adımını günceller
   */
  async updateDyeRecipeStep(id: number, data: Partial<DyeRecipeStep>): Promise<DyeRecipeStep | undefined> {
    try {
      const [updatedStep] = await db
        .update(dyeRecipeSteps)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(dyeRecipeSteps.id, id))
        .returning();
      
      return updatedStep;
    } catch (error) {
      console.error(`Reçete adımı (ID: ${id}) güncellenirken hata:`, error);
      throw new Error(`Reçete adımı güncellenemedi: ${(error as Error).message}`);
    }
  }
  
  /**
   * Reçete kimyasalını günceller
   */
  async updateDyeRecipeChemical(id: number, data: Partial<DyeRecipeChemical>): Promise<DyeRecipeChemical | undefined> {
    try {
      // Eğer kimyasal ID değiştiyse, kimyasal adını da güncelle
      let chemicalName = data.chemicalName;
      if (data.chemicalId && !chemicalName) {
        const chemical = await this.getChemicalById(data.chemicalId);
        if (chemical) {
          chemicalName = chemical.name;
        }
      }
      
      const [updatedChemical] = await db
        .update(dyeRecipeChemicals)
        .set({
          ...data,
          ...(chemicalName ? { chemicalName } : {}),
          updatedAt: new Date()
        })
        .where(eq(dyeRecipeChemicals.id, id))
        .returning();
      
      return updatedChemical;
    } catch (error) {
      console.error(`Reçete kimyasalı (ID: ${id}) güncellenirken hata:`, error);
      throw new Error(`Reçete kimyasalı güncellenemedi: ${(error as Error).message}`);
    }
  }
  
  /**
   * Kimyasalı günceller
   */
  async updateChemical(id: number, data: Partial<DyeChemical>): Promise<DyeChemical | undefined> {
    try {
      const [updatedChemical] = await db
        .update(dyeChemicals)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(dyeChemicals.id, id))
        .returning();
      
      return updatedChemical;
    } catch (error) {
      console.error(`Kimyasal (ID: ${id}) güncellenirken hata:`, error);
      throw new Error(`Kimyasal güncellenemedi: ${(error as Error).message}`);
    }
  }
  
  /**
   * Reçete uygulamasını günceller
   */
  async updateDyeRecipeApplication(id: number, data: Partial<DyeRecipeApplication>): Promise<DyeRecipeApplication | undefined> {
    try {
      const [updatedApplication] = await db
        .update(dyeRecipeApplications)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(dyeRecipeApplications.id, id))
        .returning();
      
      return updatedApplication;
    } catch (error) {
      console.error(`Reçete uygulaması (ID: ${id}) güncellenirken hata:`, error);
      throw new Error(`Reçete uygulaması güncellenemedi: ${(error as Error).message}`);
    }
  }
  
  /**
   * Boya reçetesini siler
   */
  async deleteDyeRecipe(id: number): Promise<boolean> {
    try {
      // Cascade delete sayesinde ilişkili adımlar ve kimyasallar da silinecek
      await db
        .delete(dyeRecipes)
        .where(eq(dyeRecipes.id, id));
      
      return true;
    } catch (error) {
      console.error(`Boya reçetesi (ID: ${id}) silinirken hata:`, error);
      throw new Error(`Boya reçetesi silinemedi: ${(error as Error).message}`);
    }
  }
  
  /**
   * Reçete adımını siler
   */
  async deleteDyeRecipeStep(id: number): Promise<boolean> {
    try {
      // Cascade delete sayesinde ilişkili kimyasallar da silinecek
      await db
        .delete(dyeRecipeSteps)
        .where(eq(dyeRecipeSteps.id, id));
      
      return true;
    } catch (error) {
      console.error(`Reçete adımı (ID: ${id}) silinirken hata:`, error);
      throw new Error(`Reçete adımı silinemedi: ${(error as Error).message}`);
    }
  }
  
  /**
   * Reçete kimyasalını siler
   */
  async deleteDyeRecipeChemical(id: number): Promise<boolean> {
    try {
      await db
        .delete(dyeRecipeChemicals)
        .where(eq(dyeRecipeChemicals.id, id));
      
      return true;
    } catch (error) {
      console.error(`Reçete kimyasalı (ID: ${id}) silinirken hata:`, error);
      throw new Error(`Reçete kimyasalı silinemedi: ${(error as Error).message}`);
    }
  }
  
  /**
   * Bir reçeteden şablon oluşturur
   */
  async createTemplateFromRecipe(recipeId: number, createdBy: number): Promise<DyeRecipe | undefined> {
    try {
      // Orijinal reçeteyi al
      const originalRecipe = await this.getDyeRecipeById(recipeId);
      if (!originalRecipe) {
        throw new Error(`Kaynak reçete (ID: ${recipeId}) bulunamadı`);
      }
      
      // Şablon reçeteyi oluştur
      const templateCode = `TPL-${originalRecipe.recipeCode}`;
      const templateName = `Şablon: ${originalRecipe.name}`;
      
      const templateRecipe = await this.createDyeRecipe({
        name: templateName,
        recipeCode: templateCode,
        recipeType: originalRecipe.recipeType,
        colorCode: originalRecipe.colorCode,
        colorName: originalRecipe.colorName,
        colorFamily: originalRecipe.colorFamily,
        processType: originalRecipe.processType,
        targetFabricType: originalRecipe.targetFabricType,
        targetYarnType: originalRecipe.targetYarnType,
        materialAmount: originalRecipe.materialAmount,
        materialUnit: originalRecipe.materialUnit,
        liquidRatio: originalRecipe.liquidRatio,
        temperature: originalRecipe.temperature,
        duration: originalRecipe.duration,
        pH: originalRecipe.pH,
        status: "active",
        notes: `${originalRecipe.recipeCode} kodlu reçeteden oluşturulmuş şablon`,
        createdBy: createdBy,
        isTemplate: true,
        parentRecipeId: recipeId,
        processParameters: originalRecipe.processParameters
      });
      
      // Adımları kopyala
      const originalSteps = await this.getDyeRecipeSteps(recipeId);
      for (const step of originalSteps) {
        const newStep = await this.createDyeRecipeStep({
          recipeId: templateRecipe.id,
          stepOrder: step.stepOrder,
          stepName: step.stepName,
          temperature: step.temperature,
          duration: step.duration,
          notes: step.notes,
          stepType: step.stepType,
          pH: step.pH,
          isOptional: step.isOptional,
          parameters: step.parameters
        });
        
        // Adımın kimyasallarını kopyala
        const stepChemicals = await this.getStepChemicals(step.id);
        for (const chemical of stepChemicals) {
          await this.createDyeRecipeChemical({
            recipeId: templateRecipe.id,
            stepId: newStep.id,
            chemicalId: chemical.chemicalId,
            chemicalName: chemical.chemicalName,
            quantity: chemical.quantity,
            unit: chemical.unit,
            purpose: chemical.purpose,
            additionTime: chemical.additionTime,
            additionTemperature: chemical.additionTemperature,
            notes: chemical.notes,
            isOptional: chemical.isOptional,
            isActive: chemical.isActive
          });
        }
      }
      
      return templateRecipe;
    } catch (error) {
      console.error(`Reçeteden şablon oluşturulurken hata (ID: ${recipeId}):`, error);
      throw new Error(`Şablon oluşturulamadı: ${(error as Error).message}`);
    }
  }
  
  /**
   * Şablondan yeni reçete oluşturur
   */
  async createRecipeFromTemplate(templateId: number, data: {
    name: string;
    recipeCode: string;
    colorCode?: string;
    colorName?: string;
    orderId?: number;
    createdBy: number;
  }): Promise<DyeRecipe | undefined> {
    try {
      // Şablon reçeteyi al
      const templateRecipe = await this.getDyeRecipeById(templateId);
      if (!templateRecipe || !templateRecipe.isTemplate) {
        throw new Error(`Şablon reçete (ID: ${templateId}) bulunamadı veya şablon değil`);
      }
      
      // Yeni reçeteyi oluştur
      const newRecipe = await this.createDyeRecipe({
        name: data.name,
        recipeCode: data.recipeCode,
        recipeType: templateRecipe.recipeType,
        colorCode: data.colorCode || templateRecipe.colorCode,
        colorName: data.colorName || templateRecipe.colorName,
        colorFamily: templateRecipe.colorFamily,
        processType: templateRecipe.processType,
        targetFabricType: templateRecipe.targetFabricType,
        targetYarnType: templateRecipe.targetYarnType,
        materialAmount: templateRecipe.materialAmount,
        materialUnit: templateRecipe.materialUnit,
        liquidRatio: templateRecipe.liquidRatio,
        temperature: templateRecipe.temperature,
        duration: templateRecipe.duration,
        pH: templateRecipe.pH,
        status: "active",
        notes: `${templateRecipe.recipeCode} kodlu şablondan oluşturulmuş reçete`,
        createdBy: data.createdBy,
        isTemplate: false,
        parentRecipeId: templateId,
        orderId: data.orderId,
        processParameters: templateRecipe.processParameters
      });
      
      // Adımları kopyala
      const templateSteps = await this.getDyeRecipeSteps(templateId);
      for (const step of templateSteps) {
        const newStep = await this.createDyeRecipeStep({
          recipeId: newRecipe.id,
          stepOrder: step.stepOrder,
          stepName: step.stepName,
          temperature: step.temperature,
          duration: step.duration,
          notes: step.notes,
          stepType: step.stepType,
          pH: step.pH,
          isOptional: step.isOptional,
          parameters: step.parameters
        });
        
        // Adımın kimyasallarını kopyala
        const stepChemicals = await this.getStepChemicals(step.id);
        for (const chemical of stepChemicals) {
          await this.createDyeRecipeChemical({
            recipeId: newRecipe.id,
            stepId: newStep.id,
            chemicalId: chemical.chemicalId,
            chemicalName: chemical.chemicalName,
            quantity: chemical.quantity,
            unit: chemical.unit,
            purpose: chemical.purpose,
            additionTime: chemical.additionTime,
            additionTemperature: chemical.additionTemperature,
            notes: chemical.notes,
            isOptional: chemical.isOptional,
            isActive: chemical.isActive
          });
        }
      }
      
      return newRecipe;
    } catch (error) {
      console.error(`Şablondan reçete oluşturulurken hata (ID: ${templateId}):`, error);
      throw new Error(`Reçete oluşturulamadı: ${(error as Error).message}`);
    }
  }
}

// Singleton instance oluştur
export const dyeRecipesStorage = new DyeRecipesStorage();