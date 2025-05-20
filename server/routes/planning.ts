/**
 * Planlama API'leri
 * Üretim planlama için API rotaları
 */
import { Router, Request, Response } from "express";
import { db } from "../db";
import { eq, and, like, or, desc, asc, between, lte, gte } from "drizzle-orm";
import { storage } from "../storage";
import { dyeRecipesStorage } from "../storage/dye-recipes";
import { 
  productionPlans, 
  productionSteps,
  departments,
  machines
} from "@shared/schema";
import { dyeRecipes } from "@shared/schema-dye-recipes";
import { add, format } from "date-fns";

// Bildirim gönderme fonksiyonunu içe aktar (routes.ts'de global olarak tanımlandı)
declare function sendNotificationToUser(userId: number, notification: {
  title: string;
  content: string;
  type: string;
  entityId?: number | null;
  entityType?: string | null;
}): Promise<any>;

export const planningRouter = Router();

// Yardımcı fonksiyon - API yanıtı için ortak işlemler
const asyncHandler = (fn: (req: Request, res: Response) => Promise<any>) => {
  return async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (error: any) {
      console.error("API Error:", error);
      res.status(500).json({
        error: error.message || "Bir hata oluştu",
      });
    }
  };
};

// Tüm üretim planlarını getir
planningRouter.get(
  "/plans",
  asyncHandler(async (req: Request, res: Response) => {
    // Query parametreleri
    const { search, status, fromDate, toDate } = req.query;

    // Sorgu oluştur
    let query = db.select().from(productionPlans);

    // Arama filtresi
    if (search) {
      query = query.where(
        or(
          like(productionPlans.planNo, `%${search}%`),
          like(productionPlans.orderNumber, `%${search}%`),
          like(productionPlans.description, `%${search}%`)
        )
      );
    }

    // Durum filtresi
    if (status) {
      query = query.where(eq(productionPlans.status, status as string));
    }

    // Tarih filtresi
    if (fromDate && toDate) {
      query = query.where(
        and(
          gte(productionPlans.productionEndDate, new Date(fromDate as string)),
          lte(productionPlans.productionStartDate, new Date(toDate as string))
        )
      );
    }

    // Sıralama (varsayılan: en son planlara göre)
    query = query.orderBy(desc(productionPlans.createdAt));

    const plans = await query;
    res.json(plans);
  })
);

// Belirli bir planın detaylarını getir
planningRouter.get(
  "/plans/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const plan = await db
      .select()
      .from(productionPlans)
      .where(eq(productionPlans.id, parseInt(id)));

    if (plan.length === 0) {
      return res.status(404).json({ error: "Plan bulunamadı" });
    }

    res.json(plan[0]);
  })
);

// Bir planın görevlerini getir
planningRouter.get(
  "/tasks",
  asyncHandler(async (req: Request, res: Response) => {
    const { planId } = req.query;

    if (!planId) {
      // Plan ID belirtilmediyse, kullanıcının erişebileceği tüm görevleri getir
      const allTasks = await db
        .select()
        .from(productionSteps)
        .orderBy(asc(productionSteps.stepOrder));

      // Departman bilgilerini getir
      const departmentsData = await db.select().from(departments);
      const departmentMap = new Map(departmentsData.map(d => [d.id, d]));

      // Görevleri zenginleştir
      const enrichedTasks = allTasks.map(task => ({
        ...task,
        departmentName: departmentMap.get(task.departmentId)?.name || "Bilinmiyor"
      }));

      return res.json(enrichedTasks);
    }

    // Belirli bir planın görevlerini getir
    const tasks = await db
      .select()
      .from(productionSteps)
      .where(eq(productionSteps.productionPlanId, parseInt(planId as string)))
      .orderBy(asc(productionSteps.stepOrder));

    // Örnek veri oluşturma (normalde veritabanından gelir)
    // Bu örnekte, her plan için birkaç görev oluşturuyoruz
    const sampleTasks = [
      {
        id: "task1",
        planId: planId as string,
        title: "Hammadde Kontrolü",
        startDate: new Date(),
        endDate: add(new Date(), { days: 2 }),
        department: "3", // Üretim departmanı
        status: "in-progress" as const,
        assignedTo: 3,
        priority: "high" as const,
        order: 0
      },
      {
        id: "task2",
        planId: planId as string,
        title: "Üretim Başlangıcı",
        startDate: add(new Date(), { days: 3 }),
        endDate: add(new Date(), { days: 5 }),
        department: "11", // Dokuma departmanı
        status: "not-started" as const,
        assignedTo: 5,
        priority: "medium" as const,
        order: 1
      },
      {
        id: "task3",
        planId: planId as string,
        title: "Kalite Kontrol",
        startDate: add(new Date(), { days: 6 }),
        endDate: add(new Date(), { days: 7 }),
        department: "5", // Kalite kontrol departmanı
        status: "not-started" as const,
        assignedTo: 6,
        priority: "high" as const,
        order: 2
      },
      {
        id: "task4",
        planId: planId as string,
        title: "Paketleme",
        startDate: add(new Date(), { days: 8 }),
        endDate: add(new Date(), { days: 9 }),
        department: "4", // Depo departmanı
        status: "not-started" as const,
        assignedTo: 7,
        priority: "low" as const,
        order: 3
      }
    ];

    // Gerçek veritabanı entegrasyonu için, tasks dizisini döndürün
    // Şimdilik örnek veri gönderiyoruz
    res.json(sampleTasks);
  })
);

// Makineleri getir
planningRouter.get(
  "/machines",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const machinesList = await db.select().from(machines).orderBy(machines.name);
      res.json(machinesList);
    } catch (error) {
      console.error("Makineler alınırken hata:", error);
      res.status(500).json({ error: "Makineler alınırken bir hata oluştu" });
    }
  })
);

// Boya reçetelerini getir
planningRouter.get(
  "/dye-recipes",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const recipes = await dyeRecipesStorage.getAllDyeRecipes();
      res.json(recipes);
    } catch (error) {
      console.error("Boya reçeteleri alınırken hata:", error);
      res.status(500).json({ error: "Boya reçeteleri alınırken bir hata oluştu" });
    }
  })
);

// Tipi belirtilen boya reçetelerini getir
planningRouter.get(
  "/dye-recipes/:type",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      const recipes = await dyeRecipesStorage.getDyeRecipesByType(type);
      res.json(recipes);
    } catch (error) {
      console.error(`${req.params.type} tipi boya reçeteleri alınırken hata:`, error);
      res.status(500).json({ error: `${req.params.type} tipi boya reçeteleri alınırken bir hata oluştu` });
    }
  })
);

// Görev güncelleme
planningRouter.patch(
  "/tasks/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Örnek olarak başarılı yanıt dönüyoruz
    // Gerçek uygulamada veritabanını güncelleyin
    const updatedTask = { id, ...updateData, updated: true };
    
    // Görev durumu değiştiyse bildirim gönder
    if (updateData.status && req.user && (global as any).sendNotificationToUser) {
      try {
        // Görevin ait olduğu departmanı belirle
        const departmentId = updateData.department || req.body.department;
        
        if (departmentId) {
          // Durum mesajlarını hazırla
          const statusMessages: {[key: string]: string} = {
            'not-started': 'henüz başlanmadı',
            'in-progress': 'devam ediyor',
            'completed': 'tamamlandı',
            'cancelled': 'iptal edildi',
            'delayed': 'ertelendi'
          };
          
          // İlgili departmandaki kullanıcıları al
          const departmentUsers = await storage.getUsersByDepartmentId(parseInt(departmentId));
          
          if (departmentUsers && departmentUsers.length > 0) {
            // Görev detaylarını al (gerçek uygulamada veritabanından alınacak)
            const taskTitle = updateData.title || 'Üretim görevi';
            const planId = updateData.planId || req.body.planId || 'bilinmiyor';
            
            // Departmandaki tüm kullanıcılara bildirim gönder
            for (const user of departmentUsers) {
              // İşlemi yapan kullanıcı dışındakilere bildirim gönder
              if (user.id !== req.user?.id) {
                await (global as any).sendNotificationToUser(user.id, {
                  title: "Üretim Görevi Güncellendi",
                  content: `"${taskTitle}" görevi ${statusMessages[updateData.status] || updateData.status} durumuna güncellendi. Plan: ${planId}`,
                  type: "planning",
                  entityId: parseInt(id),
                  entityType: "production_task"
                });
              }
            }
            console.log(`Üretim görevi bildirimler gönderildi - Görev ID: ${id}, Departman: ${departmentId}`);
          }
        }
      } catch (error) {
        console.error("Planlama görevi bildirim hatası:", error);
        // Bildirim göndermede hata olsa bile API yanıtını etkilememesi için hata fırlatmıyoruz
      }
    }
    
    res.json(updatedTask);
  })
);