import express from 'express';
import { db } from '../db';
import { productionRouteTemplateSteps, productionRouteTemplates, users } from '@shared/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';

// Bildirim fonksiyonunu routes.ts'den doğrudan kullanmak yerine storage üzerinden kullanacağız
import { storage } from '../storage';

const router = express.Router();

// Bekleyen görevleri getir
router.get('/pending-assignments', async (req, res) => {
  try {
    // Sadece oturum açmış kullanıcılara izin ver
    if (!req.isAuthenticated()) {
      return res.status(401).send('Unauthorized');
    }
    
    // Yetkilendirme kontrolü (Basitleştirilmiş)
    // 1: Admin departmanı ID
    const isAdmin = req.user?.departmentId === 1; 
    // 13: Boya departmanı ID
    const isDyeDepartmentUser = req.user?.departmentId === 13;
    
    if (!isDyeDepartmentUser && !isAdmin) {
      return res.status(403).send('Yetkiniz bulunmuyor');
    }
    
    // Reçete ataması yapılmamış adımları getir
    // Burada 13 Boya departmanının ID'si olarak varsayılmıştır
    const pendingSteps = await db.select({
      id: productionRouteTemplateSteps.id,
      templateId: productionRouteTemplateSteps.templateId,
      processTypeId: productionRouteTemplateSteps.processTypeId,
      departmentId: productionRouteTemplateSteps.departmentId,
      stepOrder: productionRouteTemplateSteps.stepOrder,
      dayOffset: productionRouteTemplateSteps.dayOffset,
      estimatedDuration: productionRouteTemplateSteps.estimatedDuration,
      notes: productionRouteTemplateSteps.notes,
      dyeRecipeId: productionRouteTemplateSteps.dyeRecipeId,
      duration: productionRouteTemplateSteps.duration,
      templateName: productionRouteTemplates.name,
      isRequired: productionRouteTemplateSteps.isRequired
    })
    .from(productionRouteTemplateSteps)
    .leftJoin(
      productionRouteTemplates,
      eq(productionRouteTemplateSteps.templateId, productionRouteTemplates.id)
    )
    .where(
      and(
        eq(productionRouteTemplateSteps.departmentId, 13), // Boya departmanı ID'si
        isNull(productionRouteTemplateSteps.dyeRecipeId)   // Reçete atanmamış
      )
    );
    
    // Bitiş süresini hesapla ve aciliyet durumuna göre işaretle
    const today = new Date();
    const enrichedSteps = pendingSteps.map(step => {
      // Tahmini bitiş tarihi
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + step.dayOffset + (step.estimatedDuration || 1));
      
      // Bitiş tarihine kalan gün sayısı
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Aciliyet durumları
      const isUrgent = diffDays <= 2;  // 2 gün veya daha az kaldıysa acil
      const isDueToday = diffDays === 0; // Bugün bitiyorsa
      
      return {
        ...step,
        dueDate,
        daysToDue: diffDays,
        isUrgent,
        isDueToday
      };
    });
    
    // Acil olanlara göre sırala
    enrichedSteps.sort((a, b) => {
      // Önce acil olanlar
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      
      // Sonra bitiş tarihine göre
      return a.daysToDue - b.daysToDue;
    });
    
    res.json(enrichedSteps);
  } catch (error) {
    console.error('Bekleyen görevleri getirirken hata:', error);
    res.status(500).json({ error: 'Bekleyen görevler getirilemedi' });
  }
});

// Adıma reçete atama
router.put('/route-template-steps/:stepId/assign-recipe', async (req, res) => {
  try {
    // Sadece oturum açmış kullanıcılara izin ver
    if (!req.isAuthenticated()) {
      return res.status(401).send('Unauthorized');
    }
    
    const { stepId } = req.params;
    const { dyeRecipeId, notes } = req.body;
    
    // Reçete ID'sini kontrol et
    if (!dyeRecipeId || !(typeof dyeRecipeId === 'number') || dyeRecipeId <= 0) {
      return res.status(400).json({ error: 'Geçersiz reçete ID\'si' });
    }
    
    // Gerekli alanları kontrol et
    if (!stepId) {
      return res.status(400).json({ error: 'Eksik bilgi: stepId gerekli' });
    }
    
    // Yetkilendirme (1: Admin departmanı ID)
    const isAdmin = req.user?.departmentId === 1; 
    // 13: Boya departmanı ID
    const isDyeDepartmentUser = req.user?.departmentId === 13;
    
    if (!isDyeDepartmentUser && !isAdmin) {
      return res.status(403).send('Yetkiniz bulunmuyor');
    }
    
    // Adım mevcut mu kontrol et
    const step = await db.query.productionRouteTemplateSteps.findFirst({
      where: eq(productionRouteTemplateSteps.id, parseInt(stepId))
    });
    
    if (!step) {
      return res.status(404).json({ error: 'Adım bulunamadı' });
    }
    
    // Adımı güncelle
    const updatedStep = await db
      .update(productionRouteTemplateSteps)
      .set({ 
        dyeRecipeId: dyeRecipeId
      })
      .where(eq(productionRouteTemplateSteps.id, parseInt(stepId)))
      .returning();
    
    // Template bilgilerini al
    const template = await db.query.productionRouteTemplates.findFirst({
      where: eq(productionRouteTemplates.id, step.templateId)
    });
    
    // Planlama departmanına bildirim gönder
    if (template) {
      // Planlama departmanı kullanıcılarını bul (departmentId = 10 varsayıldı)
      const planningDeptUsers = await db.query.users.findMany({
        where: eq(db.users.departmentId, 10) // Planlama departmanı ID'si
      });
      
      // Bildirim gönder
      for (const user of planningDeptUsers) {
        await storage.createNotification({
          userId: user.id,
          title: 'Reçete ataması yapıldı',
          content: `"${template.name}" rotasının ${step.stepOrder}. adımına reçete ataması yapıldı.`,
          type: 'info',
          is_read: false,
          is_archived: false,
          related_entity_id: step.id,
          related_entity_type: 'routeTemplateStep',
          created_at: new Date()
        });
      }
    }
    
    res.json(updatedStep[0]);
  } catch (error) {
    console.error('Reçete atanırken hata:', error);
    res.status(500).json({ error: 'Reçete atanamadı' });
  }
});

export default router;