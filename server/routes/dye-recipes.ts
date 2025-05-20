/**
 * Boya Reçeteleri API
 * 
 * Bu API modülü, iplik ve kumaş boyaması için reçete oluşturma, düzenleme ve
 * uygulama işlemlerini gerçekleştirmek için gerekli route'ları içerir.
 */
import { Router, Request, Response } from 'express';
import { dyeRecipesStorage } from '../storage/dye-recipes';
import { insertDyeRecipeSchema, insertDyeRecipeStepSchema, insertDyeRecipeChemicalSchema, insertDyeChemicalSchema, insertDyeRecipeApplicationSchema } from '../../shared/schema-dye-recipes';

export const dyeRecipesRouter = Router();

/**
 * Tüm boya reçetelerini getirir
 */
dyeRecipesRouter.get('/', async (req: Request, res: Response) => {
  try {
    // Query parametrelerinden filtreleme seçenekleri
    const recipeType = req.query.type as string;
    const isTemplate = req.query.template === 'true';
    const orderId = req.query.orderId ? parseInt(req.query.orderId as string) : undefined;
    
    let recipes;
    
    // Filtreleme seçeneklerine göre doğru fonksiyonu çağır
    if (orderId) {
      recipes = await dyeRecipesStorage.getDyeRecipesByOrderId(orderId);
    } else if (isTemplate) {
      recipes = await dyeRecipesStorage.getTemplateDyeRecipes();
    } else if (recipeType) {
      recipes = await dyeRecipesStorage.getDyeRecipesByType(recipeType);
    } else {
      recipes = await dyeRecipesStorage.getAllDyeRecipes();
    }
    
    res.json(recipes);
  } catch (error) {
    console.error("Boya reçeteleri getirme hatası:", error);
    res.status(500).json({ error: "Boya reçeteleri alınırken bir hata oluştu" });
  }
});

/**
 * ID'ye göre boya reçetesi getirir
 */
dyeRecipesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Geçersiz reçete ID'si" });
    }
    
    const recipe = await dyeRecipesStorage.getDyeRecipeById(id);
    if (!recipe) {
      return res.status(404).json({ error: "Reçete bulunamadı" });
    }
    
    // Tam reçete bilgilerini döndürmek için adımları ve kimyasalları da al
    const steps = await dyeRecipesStorage.getDyeRecipeSteps(id);
    const chemicals = await dyeRecipesStorage.getDyeRecipeChemicals(id);
    
    // Her adım için kimyasalları eşleştir
    const stepsWithChemicals = steps.map(step => {
      const stepChemicals = chemicals.filter(c => c.stepId === step.id);
      return {
        ...step,
        chemicals: stepChemicals
      };
    });
    
    // Tüm reçete bilgisini birleştir
    const fullRecipe = {
      ...recipe,
      steps: stepsWithChemicals,
      chemicals: chemicals.filter(c => !c.stepId) // Adıma bağlı olmayan kimyasallar
    };
    
    res.json(fullRecipe);
  } catch (error) {
    console.error("Boya reçetesi getirme hatası:", error);
    res.status(500).json({ error: "Boya reçetesi alınırken bir hata oluştu" });
  }
});

/**
 * Yeni boya reçetesi oluşturur
 */
dyeRecipesRouter.post('/', async (req: Request, res: Response) => {
  try {
    // Kullanıcı kontrolü
    if (!req.user?.id) {
      return res.status(401).json({ error: "Bu işlem için giriş yapmalısınız" });
    }
    
    // Request verilerinin validasyonu
    let recipeData;
    try {
      recipeData = insertDyeRecipeSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
    } catch (validationError) {
      return res.status(400).json({ error: "Geçersiz reçete verisi", details: validationError });
    }
    
    // Eğer reçete kodu benzersiz değilse hata döndür
    const existingRecipe = await dyeRecipesStorage.getDyeRecipeByCode(recipeData.recipeCode);
    if (existingRecipe) {
      return res.status(400).json({ error: "Bu reçete kodu zaten kullanılıyor" });
    }
    
    // Reçeteyi oluştur
    const recipe = await dyeRecipesStorage.createDyeRecipe(recipeData);
    
    // Eğer steps ve chemicals verileri de gönderildiyse bunları da ekle
    if (req.body.steps && Array.isArray(req.body.steps)) {
      for (const stepData of req.body.steps) {
        try {
          const validStepData = insertDyeRecipeStepSchema.parse({
            ...stepData,
            recipeId: recipe.id
          });
          
          const step = await dyeRecipesStorage.createDyeRecipeStep(validStepData);
          
          // Bu adıma ait kimyasallar varsa onları da ekle
          if (stepData.chemicals && Array.isArray(stepData.chemicals)) {
            for (const chemicalData of stepData.chemicals) {
              try {
                const validChemicalData = insertDyeRecipeChemicalSchema.parse({
                  ...chemicalData,
                  recipeId: recipe.id,
                  stepId: step.id
                });
                
                await dyeRecipesStorage.createDyeRecipeChemical(validChemicalData);
              } catch (chemicalError) {
                console.error("Kimyasal eklenirken validasyon hatası:", chemicalError);
                // Kimyasal ekleme hatası kritik değil, devam et
              }
            }
          }
        } catch (stepError) {
          console.error("Adım eklenirken validasyon hatası:", stepError);
          // Adım ekleme hatası kritik değil, devam et
        }
      }
    }
    
    // Ana kimyasallar (adımlara bağlı olmayanlar) varsa ekle
    if (req.body.chemicals && Array.isArray(req.body.chemicals)) {
      for (const chemicalData of req.body.chemicals) {
        try {
          const validChemicalData = insertDyeRecipeChemicalSchema.parse({
            ...chemicalData,
            recipeId: recipe.id
          });
          
          await dyeRecipesStorage.createDyeRecipeChemical(validChemicalData);
        } catch (chemicalError) {
          console.error("Ana kimyasal eklenirken validasyon hatası:", chemicalError);
          // Kimyasal ekleme hatası kritik değil, devam et
        }
      }
    }
    
    res.status(201).json(recipe);
  } catch (error) {
    console.error("Boya reçetesi oluşturma hatası:", error);
    res.status(500).json({ error: "Boya reçetesi oluşturulurken bir hata oluştu" });
  }
});

/**
 * Boya reçetesini günceller
 */
dyeRecipesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Geçersiz reçete ID'si" });
    }
    
    // Mevcut reçeteyi kontrol et
    const existingRecipe = await dyeRecipesStorage.getDyeRecipeById(id);
    if (!existingRecipe) {
      return res.status(404).json({ error: "Reçete bulunamadı" });
    }
    
    // Kullanıcı kontrolü
    if (!req.user?.id) {
      return res.status(401).json({ error: "Bu işlem için giriş yapmalısınız" });
    }
    
    // Güncelleme verileri için validasyon şemasını oluştur (kısmi güncelleme için)
    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };
    
    // Reçeteyi güncelle
    const updatedRecipe = await dyeRecipesStorage.updateDyeRecipe(id, updateData);
    
    // Adımlar ve kimyasallar için güncelleme işlemleri burada da yapılabilir
    // Kompleks bir senaryoda, adım ve kimyasal güncellemeleri için ayrı endpoint'ler daha uygun olabilir
    
    res.json(updatedRecipe);
  } catch (error) {
    console.error("Boya reçetesi güncelleme hatası:", error);
    res.status(500).json({ error: "Boya reçetesi güncellenirken bir hata oluştu" });
  }
});

/**
 * Boya reçetesini siler
 */
dyeRecipesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Geçersiz reçete ID'si" });
    }
    
    // Mevcut reçeteyi kontrol et
    const existingRecipe = await dyeRecipesStorage.getDyeRecipeById(id);
    if (!existingRecipe) {
      return res.status(404).json({ error: "Reçete bulunamadı" });
    }
    
    // Kullanıcı kontrolü
    if (!req.user?.id) {
      return res.status(401).json({ error: "Bu işlem için giriş yapmalısınız" });
    }
    
    // Reçeteyi sil - cascade delete yapılandırması sayesinde adımlar ve kimyasallar da silinecek
    await dyeRecipesStorage.deleteDyeRecipe(id);
    
    res.status(204).end();
  } catch (error) {
    console.error("Boya reçetesi silme hatası:", error);
    res.status(500).json({ error: "Boya reçetesi silinirken bir hata oluştu" });
  }
});

// Reçete adımları için API
dyeRecipesRouter.post('/:recipeId/steps', async (req: Request, res: Response) => {
  try {
    const recipeId = parseInt(req.params.recipeId);
    if (isNaN(recipeId)) {
      return res.status(400).json({ error: "Geçersiz reçete ID'si" });
    }
    
    // Mevcut reçeteyi kontrol et
    const existingRecipe = await dyeRecipesStorage.getDyeRecipeById(recipeId);
    if (!existingRecipe) {
      return res.status(404).json({ error: "Reçete bulunamadı" });
    }
    
    // Kullanıcı kontrolü
    if (!req.user?.id) {
      return res.status(401).json({ error: "Bu işlem için giriş yapmalısınız" });
    }
    
    // Adım verilerinin validasyonu
    let stepData;
    try {
      stepData = insertDyeRecipeStepSchema.parse({
        ...req.body,
        recipeId
      });
    } catch (validationError) {
      return res.status(400).json({ error: "Geçersiz adım verisi", details: validationError });
    }
    
    // Adımı oluştur
    const step = await dyeRecipesStorage.createDyeRecipeStep(stepData);
    
    res.status(201).json(step);
  } catch (error) {
    console.error("Reçete adımı oluşturma hatası:", error);
    res.status(500).json({ error: "Reçete adımı oluşturulurken bir hata oluştu" });
  }
});

// Reçete adımını güncelleme
dyeRecipesRouter.put('/:recipeId/steps/:stepId', async (req: Request, res: Response) => {
  try {
    const recipeId = parseInt(req.params.recipeId);
    const stepId = parseInt(req.params.stepId);
    
    if (isNaN(recipeId) || isNaN(stepId)) {
      return res.status(400).json({ error: "Geçersiz reçete veya adım ID'si" });
    }
    
    // Kullanıcı kontrolü
    if (!req.user?.id) {
      return res.status(401).json({ error: "Bu işlem için giriş yapmalısınız" });
    }
    
    // Adımı güncelle
    const updatedStep = await dyeRecipesStorage.updateDyeRecipeStep(stepId, req.body);
    if (!updatedStep) {
      return res.status(404).json({ error: "Adım bulunamadı" });
    }
    
    res.json(updatedStep);
  } catch (error) {
    console.error("Reçete adımı güncelleme hatası:", error);
    res.status(500).json({ error: "Reçete adımı güncellenirken bir hata oluştu" });
  }
});

// Reçete adımını silme
dyeRecipesRouter.delete('/:recipeId/steps/:stepId', async (req: Request, res: Response) => {
  try {
    const recipeId = parseInt(req.params.recipeId);
    const stepId = parseInt(req.params.stepId);
    
    if (isNaN(recipeId) || isNaN(stepId)) {
      return res.status(400).json({ error: "Geçersiz reçete veya adım ID'si" });
    }
    
    // Kullanıcı kontrolü
    if (!req.user?.id) {
      return res.status(401).json({ error: "Bu işlem için giriş yapmalısınız" });
    }
    
    // Adımı sil
    await dyeRecipesStorage.deleteDyeRecipeStep(stepId);
    
    res.status(204).end();
  } catch (error) {
    console.error("Reçete adımı silme hatası:", error);
    res.status(500).json({ error: "Reçete adımı silinirken bir hata oluştu" });
  }
});

// Reçete kimyasalları için API
dyeRecipesRouter.post('/:recipeId/chemicals', async (req: Request, res: Response) => {
  try {
    const recipeId = parseInt(req.params.recipeId);
    if (isNaN(recipeId)) {
      return res.status(400).json({ error: "Geçersiz reçete ID'si" });
    }
    
    // Kullanıcı kontrolü
    if (!req.user?.id) {
      return res.status(401).json({ error: "Bu işlem için giriş yapmalısınız" });
    }
    
    // Kimyasal verilerinin validasyonu
    let chemicalData;
    try {
      chemicalData = insertDyeRecipeChemicalSchema.parse({
        ...req.body,
        recipeId
      });
    } catch (validationError) {
      return res.status(400).json({ error: "Geçersiz kimyasal verisi", details: validationError });
    }
    
    // Kimyasalı oluştur
    const chemical = await dyeRecipesStorage.createDyeRecipeChemical(chemicalData);
    
    res.status(201).json(chemical);
  } catch (error) {
    console.error("Reçete kimyasalı oluşturma hatası:", error);
    res.status(500).json({ error: "Reçete kimyasalı oluşturulurken bir hata oluştu" });
  }
});

// Reçete kimyasalını güncelleme
dyeRecipesRouter.put('/:recipeId/chemicals/:chemicalId', async (req: Request, res: Response) => {
  try {
    const recipeId = parseInt(req.params.recipeId);
    const chemicalId = parseInt(req.params.chemicalId);
    
    if (isNaN(recipeId) || isNaN(chemicalId)) {
      return res.status(400).json({ error: "Geçersiz reçete veya kimyasal ID'si" });
    }
    
    // Kullanıcı kontrolü
    if (!req.user?.id) {
      return res.status(401).json({ error: "Bu işlem için giriş yapmalısınız" });
    }
    
    // Kimyasalı güncelle
    const updatedChemical = await dyeRecipesStorage.updateDyeRecipeChemical(chemicalId, req.body);
    if (!updatedChemical) {
      return res.status(404).json({ error: "Kimyasal bulunamadı" });
    }
    
    res.json(updatedChemical);
  } catch (error) {
    console.error("Reçete kimyasalı güncelleme hatası:", error);
    res.status(500).json({ error: "Reçete kimyasalı güncellenirken bir hata oluştu" });
  }
});

// Reçete kimyasalını silme
dyeRecipesRouter.delete('/:recipeId/chemicals/:chemicalId', async (req: Request, res: Response) => {
  try {
    const recipeId = parseInt(req.params.recipeId);
    const chemicalId = parseInt(req.params.chemicalId);
    
    if (isNaN(recipeId) || isNaN(chemicalId)) {
      return res.status(400).json({ error: "Geçersiz reçete veya kimyasal ID'si" });
    }
    
    // Kullanıcı kontrolü
    if (!req.user?.id) {
      return res.status(401).json({ error: "Bu işlem için giriş yapmalısınız" });
    }
    
    // Kimyasalı sil
    await dyeRecipesStorage.deleteDyeRecipeChemical(chemicalId);
    
    res.status(204).end();
  } catch (error) {
    console.error("Reçete kimyasalı silme hatası:", error);
    res.status(500).json({ error: "Reçete kimyasalı silinirken bir hata oluştu" });
  }
});

// Kimyasallar ana listesi API
dyeRecipesRouter.get('/chemicals/list', async (req: Request, res: Response) => {
  try {
    // Query parametrelerinden filtreleme seçenekleri
    const category = req.query.category as string;
    
    let chemicals;
    
    // Filtreleme seçeneklerine göre doğru fonksiyonu çağır
    if (category) {
      chemicals = await dyeRecipesStorage.getChemicalsByCategory(category);
    } else {
      chemicals = await dyeRecipesStorage.getAllChemicals();
    }
    
    res.json(chemicals);
  } catch (error) {
    console.error("Kimyasallar getirme hatası:", error);
    res.status(500).json({ error: "Kimyasallar alınırken bir hata oluştu" });
  }
});

// Yeni kimyasal oluşturma
dyeRecipesRouter.post('/chemicals', async (req: Request, res: Response) => {
  try {
    // Kullanıcı kontrolü
    if (!req.user?.id) {
      return res.status(401).json({ error: "Bu işlem için giriş yapmalısınız" });
    }
    
    // Kimyasal verilerinin validasyonu
    let chemicalData;
    try {
      chemicalData = insertDyeChemicalSchema.parse(req.body);
    } catch (validationError) {
      return res.status(400).json({ error: "Geçersiz kimyasal verisi", details: validationError });
    }
    
    // Eğer kimyasal kodu benzersiz değilse hata döndür
    const existingChemical = await dyeRecipesStorage.getChemicalByCode(chemicalData.code);
    if (existingChemical) {
      return res.status(400).json({ error: "Bu kimyasal kodu zaten kullanılıyor" });
    }
    
    // Kimyasalı oluştur
    const chemical = await dyeRecipesStorage.createChemical(chemicalData);
    
    res.status(201).json(chemical);
  } catch (error) {
    console.error("Kimyasal oluşturma hatası:", error);
    res.status(500).json({ error: "Kimyasal oluşturulurken bir hata oluştu" });
  }
});

// Kimyasal güncelleme
dyeRecipesRouter.put('/chemicals/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Geçersiz kimyasal ID'si" });
    }
    
    // Kullanıcı kontrolü
    if (!req.user?.id) {
      return res.status(401).json({ error: "Bu işlem için giriş yapmalısınız" });
    }
    
    // Kimyasalı güncelle
    const updatedChemical = await dyeRecipesStorage.updateChemical(id, req.body);
    if (!updatedChemical) {
      return res.status(404).json({ error: "Kimyasal bulunamadı" });
    }
    
    res.json(updatedChemical);
  } catch (error) {
    console.error("Kimyasal güncelleme hatası:", error);
    res.status(500).json({ error: "Kimyasal güncellenirken bir hata oluştu" });
  }
});

// Şablondan reçete oluşturma
dyeRecipesRouter.post('/from-template/:templateId', async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.templateId);
    if (isNaN(templateId)) {
      return res.status(400).json({ error: "Geçersiz şablon ID'si" });
    }
    
    // Kullanıcı kontrolü
    if (!req.user?.id) {
      return res.status(401).json({ error: "Bu işlem için giriş yapmalısınız" });
    }
    
    // Gerekli alanların varlığını kontrol et
    const { name, recipeCode, colorCode, colorName, orderId } = req.body;
    if (!name || !recipeCode) {
      return res.status(400).json({ error: "Reçete adı ve kodu gereklidir" });
    }
    
    // Şablondan reçete oluştur
    const recipe = await dyeRecipesStorage.createRecipeFromTemplate(templateId, {
      name,
      recipeCode,
      colorCode,
      colorName,
      orderId: orderId ? parseInt(orderId) : undefined,
      createdBy: req.user.id
    });
    
    if (!recipe) {
      return res.status(404).json({ error: "Şablon bulunamadı veya reçete oluşturulamadı" });
    }
    
    res.status(201).json(recipe);
  } catch (error) {
    console.error("Şablondan reçete oluşturma hatası:", error);
    res.status(500).json({ error: "Şablondan reçete oluşturulurken bir hata oluştu" });
  }
});

// Reçeteden şablon oluşturma
dyeRecipesRouter.post('/:id/to-template', async (req: Request, res: Response) => {
  try {
    const recipeId = parseInt(req.params.id);
    if (isNaN(recipeId)) {
      return res.status(400).json({ error: "Geçersiz reçete ID'si" });
    }
    
    // Kullanıcı kontrolü
    if (!req.user?.id) {
      return res.status(401).json({ error: "Bu işlem için giriş yapmalısınız" });
    }
    
    // Reçeteden şablon oluştur
    const template = await dyeRecipesStorage.createTemplateFromRecipe(recipeId, req.user.id);
    
    if (!template) {
      return res.status(404).json({ error: "Reçete bulunamadı veya şablon oluşturulamadı" });
    }
    
    res.status(201).json(template);
  } catch (error) {
    console.error("Reçeteden şablon oluşturma hatası:", error);
    res.status(500).json({ error: "Reçeteden şablon oluşturulurken bir hata oluştu" });
  }
});

// Reçete uygulaması oluşturma
dyeRecipesRouter.post('/:id/applications', async (req: Request, res: Response) => {
  try {
    const recipeId = parseInt(req.params.id);
    if (isNaN(recipeId)) {
      return res.status(400).json({ error: "Geçersiz reçete ID'si" });
    }
    
    // Kullanıcı kontrolü
    if (!req.user?.id) {
      return res.status(401).json({ error: "Bu işlem için giriş yapmalısınız" });
    }
    
    // Reçetenin varlığını kontrol et
    const recipe = await dyeRecipesStorage.getDyeRecipeById(recipeId);
    if (!recipe) {
      return res.status(404).json({ error: "Reçete bulunamadı" });
    }
    
    // Uygulama verilerinin validasyonu
    let applicationData;
    try {
      applicationData = insertDyeRecipeApplicationSchema.parse({
        ...req.body,
        recipeId,
        operatorId: req.user.id,
        startTime: req.body.startTime || new Date()
      });
    } catch (validationError) {
      return res.status(400).json({ error: "Geçersiz uygulama verisi", details: validationError });
    }
    
    // Uygulamayı oluştur
    const application = await dyeRecipesStorage.createDyeRecipeApplication(applicationData);
    
    res.status(201).json(application);
  } catch (error) {
    console.error("Reçete uygulaması oluşturma hatası:", error);
    res.status(500).json({ error: "Reçete uygulaması oluşturulurken bir hata oluştu" });
  }
});

// Reçete uygulamalarını getirme
dyeRecipesRouter.get('/:id/applications', async (req: Request, res: Response) => {
  try {
    const recipeId = parseInt(req.params.id);
    if (isNaN(recipeId)) {
      return res.status(400).json({ error: "Geçersiz reçete ID'si" });
    }
    
    // Uygulamaları getir
    const applications = await dyeRecipesStorage.getDyeRecipeApplications(recipeId);
    
    res.json(applications);
  } catch (error) {
    console.error("Reçete uygulamaları getirme hatası:", error);
    res.status(500).json({ error: "Reçete uygulamaları alınırken bir hata oluştu" });
  }
});

// Reçete uygulamasını güncelleme (tamamlama, puanlama vb.)
dyeRecipesRouter.put('/:recipeId/applications/:applicationId', async (req: Request, res: Response) => {
  try {
    const recipeId = parseInt(req.params.recipeId);
    const applicationId = parseInt(req.params.applicationId);
    
    if (isNaN(recipeId) || isNaN(applicationId)) {
      return res.status(400).json({ error: "Geçersiz reçete veya uygulama ID'si" });
    }
    
    // Kullanıcı kontrolü
    if (!req.user?.id) {
      return res.status(401).json({ error: "Bu işlem için giriş yapmalısınız" });
    }
    
    // Eğer uygulama tamamlanıyorsa endTime ekle
    let updateData = req.body;
    if (updateData.status === 'completed' && !updateData.endTime) {
      updateData = {
        ...updateData,
        endTime: new Date()
      };
    }
    
    // Uygulamayı güncelle
    const updatedApplication = await dyeRecipesStorage.updateDyeRecipeApplication(applicationId, updateData);
    if (!updatedApplication) {
      return res.status(404).json({ error: "Uygulama bulunamadı" });
    }
    
    res.json(updatedApplication);
  } catch (error) {
    console.error("Reçete uygulaması güncelleme hatası:", error);
    res.status(500).json({ error: "Reçete uygulaması güncellenirken bir hata oluştu" });
  }
});