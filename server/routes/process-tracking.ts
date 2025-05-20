/**
 * İşlem takibi ve refakat kartı okutma işlemleri API'leri
 */

import { Request, Response, Router } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { storage } from '../storage';

// Bildirim gönderme fonksiyonunu içe aktar (routes.ts'de global olarak tanımlandı)
declare function sendNotificationToUser(userId: number, notification: {
  title: string;
  content: string;
  type: string;
  entityId?: number | null;
  entityType?: string | null;
}): Promise<any>;

export const processTrackingRouter = Router();

// Basitleştirilmiş işlem başlatma (otomatik seçimli)
processTrackingRouter.post("/start-simple", async (req: Request, res: Response) => {
  try {
    const { cardNumber, operatorId, departmentId } = req.body;
    
    // Önce kart bilgisini sorgula
    const cards = await db.execute(sql`
      SELECT * FROM process_cards 
      WHERE card_number = ${cardNumber}
    `);
    
    if (!cards || !cards.rows || cards.rows.length === 0) {
      return res.status(404).json({ error: "Refakat kartı bulunamadı" });
    }
    
    const card = cards.rows[0];
    const stepOrder = card.current_step || 1;
    
    // Daha önce aynı adım için başlatılmış ama bitirilmemiş bir işlem var mı kontrol et
    const activeProcesses = await db.execute(sql`
      SELECT pt.*, pt2.name as process_type_name, m.name as machine_name 
      FROM process_tracking pt
      LEFT JOIN process_types pt2 ON pt.process_type_id = pt2.id
      LEFT JOIN machines m ON pt.machine_id = m.id
      WHERE pt.process_card_id = ${card.id} 
      AND pt.status = 'inProgress'
    `);
    
    // Aktif işlem var mı kontrol et
    if (activeProcesses && activeProcesses.rows && activeProcesses.rows.length > 0) {
      // Aktif işlem varsa bilgisini dön
      return res.status(200).json({ 
        isActive: true,
        activeProcess: activeProcesses.rows[0],
        message: "Bu kart için zaten aktif bir işlem var."
      });
    }
    
    // Departmandaki ilk uygun makineyi bul
    const machines = await db.execute(sql`
      SELECT * FROM machines
      WHERE department_id = ${departmentId} AND status = 'active'
      ORDER BY id ASC
      LIMIT 1
    `);
    
    if (!machines || !machines.rows || machines.rows.length === 0) {
      return res.status(404).json({ error: "Departmana ait makine bulunamadı" });
    }
    
    const machine = machines.rows[0];
    
    // Uygun bir işlem tipi bul (departmana ve sıra numarasına göre)
    const processTypes = await db.execute(sql`
      SELECT * FROM process_types
      WHERE department_id = ${departmentId}
      ORDER BY sequence ASC
      LIMIT 1
    `);
    
    if (!processTypes || !processTypes.rows || processTypes.rows.length === 0) {
      return res.status(404).json({ error: "Departmana ait işlem tipi bulunamadı" });
    }
    
    const processType = processTypes.rows[0];
    
    // Yeni işlem kaydı oluştur
    const result = await db.execute(sql`
      INSERT INTO process_tracking 
        (process_card_id, machine_id, operator_id, process_type_id, department_id, step_order, start_time, status, quantity_processed, notes) 
      VALUES 
        (${card.id}, ${machine.id}, ${operatorId}, ${processType.id}, ${departmentId}, ${stepOrder}, NOW(), 'inProgress', 0, 'Otomatik başlatıldı')
      RETURNING id
    `);
    
    // Refakat kartı durumunu güncelle
    await db.execute(sql`
      UPDATE process_cards 
      SET status = 'inProgress', current_step = ${stepOrder} 
      WHERE id = ${card.id}
    `);
    
    res.status(201).json({ 
      isActive: false,
      message: "İşlem başarıyla başlatıldı", 
      process: {
        id: result.rows[0].id,
        machineName: machine.name,
        processTypeName: processType.name,
        stepOrder: stepOrder
      }
    });
  } catch (error) {
    console.error("Basit işlem başlatma hatası:", error);
    res.status(500).json({ error: "İşlem başlatılamadı" });
  }
});

// Basitleştirilmiş işlem tamamlama
processTrackingRouter.post("/complete-simple", async (req: Request, res: Response) => {
  try {
    const { cardNumber, operatorId, departmentId, quantity } = req.body;
    
    // Önce kart bilgisini sorgula
    const cards = await db.execute(sql`
      SELECT * FROM process_cards 
      WHERE card_number = ${cardNumber}
    `);
    
    if (!cards || !cards.rows || cards.rows.length === 0) {
      return res.status(404).json({ error: "Refakat kartı bulunamadı" });
    }
    
    const card = cards.rows[0];
    
    // Aktif işlemi bul
    const activeProcesses = await db.execute(sql`
      SELECT * FROM process_tracking 
      WHERE process_card_id = ${card.id} 
      AND status = 'inProgress'
      AND department_id = ${departmentId}
    `);
    
    if (!activeProcesses || !activeProcesses.rows || activeProcesses.rows.length === 0) {
      return res.status(404).json({ error: "Bu kart için aktif işlem bulunamadı" });
    }
    
    const process = activeProcesses.rows[0];
    
    // İşlemi tamamla
    await db.execute(sql`
      UPDATE process_tracking 
      SET 
        end_time = NOW(), 
        status = 'completed', 
        quantity_processed = ${quantity || card.quantity},
        quantity_defect = 0
      WHERE id = ${process.id}
    `);
    
    // Sonraki adım var mı kontrol et (burada sabit bir değer kullanıldı, gerçek uygulamada rota bilgisi kullanılmalı)
    const nextStepOrder = process.step_order + 1;
    
    // Refakat kartı durumunu güncelle
    await db.execute(sql`
      UPDATE process_cards 
      SET 
        status = CASE WHEN ${nextStepOrder} > 3 THEN 'completed' ELSE 'inProgress' END, 
        current_step = CASE WHEN ${nextStepOrder} > 3 THEN ${process.step_order} ELSE ${nextStepOrder} END
      WHERE id = ${card.id}
    `);
    
    // İşlem tamamlandığında bildirim gönder
    if (req.user && (global as any).sendNotificationToUser) {
      try {
        // İşlemin departmanı
        const departmentDetails = await db.execute(sql`
          SELECT * FROM departments WHERE id = ${departmentId}
        `);
        
        const department = departmentDetails.rows && departmentDetails.rows.length > 0 ? departmentDetails.rows[0] : null;
        
        // Bildirim göndermek için yeterli bilgi var mı kontrol et
        if (department) {
          // Sonraki adım tamamlandı mı yoksa devam mı edecek
          if (nextStepOrder > 3) {
            // Tüm adımlar tamamlandı - Planlama departmanına (id=10) bildirim gönder
            const planningDeptId = 10;
            const planningUsers = await storage.getUsersByDepartmentId(planningDeptId);
            
            if (planningUsers && planningUsers.length > 0) {
              for (const user of planningUsers) {
                if (user.id !== req.user.id) {
                  await (global as any).sendNotificationToUser(user.id, {
                    title: "Üretim Kartı Tamamlandı",
                    content: `${cardNumber} numaralı refakat kartı tüm adımları tamamlayarak üretimi bitirdi.`,
                    type: "process",
                    entityId: card.id,
                    entityType: "process_card"
                  });
                }
              }
              console.log(`Refakat kartı tamamlama bildirimi gönderildi - Planlama departmanına`);
            }
          } else {
            // Bir sonraki adımın departmanını bul (örnek data, gerçekte departman rotasını kontrol etmek gerekir)
            const nextDeptId = departmentId + 1;
            
            // Bir sonraki departmandaki kullanıcılara bildir
            const nextDeptUsers = await storage.getUsersByDepartmentId(nextDeptId);
            
            if (nextDeptUsers && nextDeptUsers.length > 0) {
              for (const user of nextDeptUsers) {
                await (global as any).sendNotificationToUser(user.id, {
                  title: "Yeni Üretim Kartı Geldi",
                  content: `${cardNumber} numaralı refakat kartı ${department.name || ''} departmanında işlemi tamamladı ve departmanınıza geldi.`,
                  type: "process",
                  entityId: card.id,
                  entityType: "process_card"
                });
              }
              console.log(`Refakat kartı bildirim gönderildi - Sonraki departman ID: ${nextDeptId}`);
            }
          }
        }
      } catch (error) {
        console.error("İşlem tamamlama bildirim hatası:", error);
        // Bildirim göndermede hata olsa bile API yanıtını etkilememesi için hata fırlatmıyoruz
      }
    }
    
    res.json({ 
      message: "İşlem başarıyla tamamlandı", 
      nextStep: nextStepOrder <= 3 ? nextStepOrder : null,
      isCompleted: nextStepOrder > 3
    });
  } catch (error) {
    console.error("Basit işlem tamamlama hatası:", error);
    res.status(500).json({ error: "İşlem tamamlanamadı" });
  }
});

// Refakat kartı bilgilerini getir
processTrackingRouter.get("/cards/:cardNumber", async (req: Request, res: Response) => {
  try {
    const { cardNumber } = req.params;
    
    // Refakat kartı bilgilerini sorgula
    const cardInfo = await db.execute(sql`
      SELECT 
        pc.*,
        pp.plan_no,
        pp.order_number,
        pp.description,
        o.customer_id,
        c.name as customer_name,
        f.name as fabric_name,
        f.code as fabric_code
      FROM process_cards pc
      LEFT JOIN production_plans pp ON pc.production_plan_id = pp.id
      LEFT JOIN orders o ON pp.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN fabric_types f ON pc.fabric_type_id = f.id
      WHERE pc.card_number = ${cardNumber}
    `);
    
    console.log("Kart sorgusu sonucu:", JSON.stringify(cardInfo));
    
    if (!cardInfo || !cardInfo.rows || cardInfo.rows.length === 0) {
      return res.status(404).json({ error: "Refakat kartı bulunamadı" });
    }
    
    // Kartın işlem geçmişini sorgula
    let processHistory = [];
    if (cardInfo.rows && cardInfo.rows.length > 0 && cardInfo.rows[0].id) {
      processHistory = await db.execute(sql`
        SELECT 
          pt.*,
          m.name as machine_name,
          m.code as machine_code,
          u.full_name as operator_name,
          d.name as department_name,
          pt2.name as process_type_name
        FROM process_tracking pt
        LEFT JOIN machines m ON pt.machine_id = m.id
        LEFT JOIN users u ON pt.operator_id = u.id
        LEFT JOIN departments d ON pt.department_id = d.id
        LEFT JOIN process_types pt2 ON pt.process_type_id = pt2.id
        WHERE pt.process_card_id = ${cardInfo.rows[0].id}
        ORDER BY pt.step_order ASC
      `);
    }
    
    res.json({
      card: cardInfo.rows[0],
      processHistory: processHistory && processHistory.rows ? processHistory.rows : []
    });
  } catch (error) {
    console.error("Refakat kartı sorgulama hatası:", error);
    res.status(500).json({ error: "Refakat kartı bilgileri alınamadı" });
  }
});

// İşleme başla - Okutma
processTrackingRouter.post("/start", async (req: Request, res: Response) => {
  try {
    const { cardNumber, machineId, operatorId, processTypeId, departmentId, stepOrder, notes } = req.body;
    
    // Önce kart bilgisini sorgula
    const cards = await db.execute(sql`
      SELECT * FROM process_cards 
      WHERE card_number = ${cardNumber}
    `);
    
    console.log("Card bilgisi sorgusu:", JSON.stringify(cards));
    
    if (!cards || !cards.rows || cards.rows.length === 0) {
      return res.status(404).json({ error: "Refakat kartı bulunamadı" });
    }
    
    const card = cards.rows[0];
    
    // Daha önce aynı adım için başlatılmış ama bitirilmemiş bir işlem var mı kontrol et
    const activeProcesses = await db.execute(sql`
      SELECT * FROM process_tracking 
      WHERE process_card_id = ${card.id} 
      AND step_order = ${stepOrder} 
      AND status = 'inProgress'
    `);
    
    if (activeProcesses && activeProcesses.rows && activeProcesses.rows.length > 0) {
      return res.status(400).json({ error: "Bu işlem adımı zaten başlatılmış ve devam ediyor" });
    }
    
    // Yeni işlem kaydı oluştur
    const result = await db.execute(sql`
      INSERT INTO process_tracking 
        (process_card_id, machine_id, operator_id, process_type_id, department_id, step_order, start_time, status, quantity_processed, notes) 
      VALUES 
        (${card.id}, ${machineId}, ${operatorId}, ${processTypeId}, ${departmentId}, ${stepOrder}, NOW(), 'inProgress', 0, ${notes})
      RETURNING id
    `);
    
    // Refakat kartı durumunu güncelle
    await db.execute(sql`
      UPDATE process_cards 
      SET status = 'inProgress', current_step = ${stepOrder} 
      WHERE id = ${card.id}
    `);
    
    res.status(201).json({ 
      message: "İşlem başarıyla başlatıldı", 
      trackingId: result.rows[0].id,
      cardId: card.id,
      currentStep: stepOrder 
    });
  } catch (error) {
    console.error("İşlem başlatma hatası:", error);
    res.status(500).json({ error: "İşlem başlatılamadı" });
  }
});

// İşlemi bitir - Okutma
processTrackingRouter.post("/complete", async (req: Request, res: Response) => {
  try {
    const { trackingId, quantityProcessed, quantityDefect, notes } = req.body;
    
    // İşlem kaydını bul
    const processes = await db.execute(sql`
      SELECT * FROM process_tracking 
      WHERE id = ${trackingId} AND status = 'inProgress'
    `);
    
    console.log("İşlem kaydı sorgusu:", JSON.stringify(processes));
    
    if (!processes || !processes.rows || processes.rows.length === 0) {
      return res.status(404).json({ error: "Aktif işlem kaydı bulunamadı" });
    }
    
    const process = processes.rows[0];
    
    // İşlemi tamamla
    await db.execute(sql`
      UPDATE process_tracking 
      SET 
        end_time = NOW(), 
        status = 'completed', 
        quantity_processed = ${quantityProcessed},
        quantity_defect = ${quantityDefect},
        notes = CASE WHEN ${notes} IS NOT NULL THEN ${notes} ELSE notes END
      WHERE id = ${trackingId}
    `);
    
    // Sonraki adım var mı kontrol et (burada sabit bir değer kullanıldı, gerçek uygulamada rota bilgisi kullanılmalı)
    const nextStepOrder = process.step_order + 1;
    
    // Refakat kartı durumunu güncelle
    await db.execute(sql`
      UPDATE process_cards 
      SET 
        status = CASE WHEN ${nextStepOrder} > 3 THEN 'completed' ELSE 'inProgress' END, 
        current_step = CASE WHEN ${nextStepOrder} > 3 THEN ${process.step_order} ELSE ${nextStepOrder} END
      WHERE id = ${process.process_card_id}
    `);
    
    // İşlem tamamlandığında bir sonraki departmana bildirim gönder
    if (req.user && (global as any).sendNotificationToUser) {
      try {
        // Kartla ilgili detaylı bilgileri getir
        const cardDetails = await db.execute(sql`
          SELECT 
            pc.*, 
            pp.plan_no, 
            pp.description as plan_description
          FROM process_cards pc
          LEFT JOIN production_plans pp ON pc.production_plan_id = pp.id
          WHERE pc.id = ${process.process_card_id}
        `);
        
        // İşlemin departmanı
        const departmentDetails = await db.execute(sql`
          SELECT * FROM departments WHERE id = ${process.department_id}
        `);
        
        // Süreç tipi
        const processTypeDetails = await db.execute(sql`
          SELECT * FROM process_types WHERE id = ${process.process_type_id}
        `);
        
        const card = cardDetails.rows && cardDetails.rows.length > 0 ? cardDetails.rows[0] : null;
        const department = departmentDetails.rows && departmentDetails.rows.length > 0 ? departmentDetails.rows[0] : null;
        const processType = processTypeDetails.rows && processTypeDetails.rows.length > 0 ? processTypeDetails.rows[0] : null;
        
        // Bildirim göndermek için yeterli bilgi var mı kontrol et
        if (card && department) {
          // Sonraki adım tamamlandı mı yoksa devam mı edecek
          if (nextStepOrder > 3) {
            // Tüm adımlar tamamlandı - Planlama departmanına (id=10) bildirim gönder
            const planningDeptId = 10;
            const planningUsers = await storage.getUsersByDepartmentId(planningDeptId);
            
            if (planningUsers && planningUsers.length > 0) {
              for (const user of planningUsers) {
                if (user.id !== req.user.id) {
                  await (global as any).sendNotificationToUser(user.id, {
                    title: "Üretim Kartı Tamamlandı",
                    content: `${card.card_number} numaralı refakat kartı tüm adımları tamamlayarak üretimi bitirdi. Plan: ${card.plan_no || ''}`,
                    type: "process",
                    entityId: card.id,
                    entityType: "process_card"
                  });
                }
              }
              console.log(`Refakat kartı tamamlama bildirimi gönderildi - Planlama departmanına`);
            }
          } else {
            // Bir sonraki adımın departmanını bul
            const nextStepDeptQuery = await db.execute(sql`
              SELECT d.* FROM process_types pt
              JOIN departments d ON pt.department_id = d.id
              WHERE pt.sequence = ${nextStepOrder}
              LIMIT 1
            `);
            
            const nextDepartment = nextStepDeptQuery.rows && nextStepDeptQuery.rows.length > 0 ? nextStepDeptQuery.rows[0] : null;
            
            if (nextDepartment && nextDepartment.id) {
              // Bir sonraki departmandaki kullanıcılara bildir
              const nextDeptUsers = await storage.getUsersByDepartmentId(nextDepartment.id);
              
              if (nextDeptUsers && nextDeptUsers.length > 0) {
                for (const user of nextDeptUsers) {
                  await (global as any).sendNotificationToUser(user.id, {
                    title: "Yeni Üretim Kartı Geldi",
                    content: `${card.card_number} numaralı refakat kartı ${department.name || ''} departmanında ${processType ? processType.name : ''} işlemini tamamladı ve departmanınıza geldi.`,
                    type: "process",
                    entityId: card.id,
                    entityType: "process_card"
                  });
                }
                console.log(`Refakat kartı bildirim gönderildi - Sonraki departman: ${nextDepartment.name}`);
              }
            }
          }
        }
      } catch (error) {
        console.error("İşlem tamamlama bildirim hatası:", error);
        // Bildirim göndermede hata olsa bile API yanıtını etkilememesi için hata fırlatmıyoruz
      }
    }
    
    res.json({ 
      message: "İşlem başarıyla tamamlandı", 
      nextStep: nextStepOrder <= 3 ? nextStepOrder : null,
      isCompleted: nextStepOrder > 3
    });
  } catch (error) {
    console.error("İşlem tamamlama hatası:", error);
    res.status(500).json({ error: "İşlem tamamlanamadı" });
  }
});

// Aktif refakat kartlarını listele
processTrackingRouter.get("/active-cards", async (req: Request, res: Response) => {
  try {
    const activeCards = await db.execute(sql`
      SELECT 
        pc.*,
        pp.plan_no,
        pp.order_number,
        o.customer_id,
        c.name as customer_name,
        f.name as fabric_name,
        d.name as department_name
      FROM process_cards pc
      LEFT JOIN production_plans pp ON pc.production_plan_id = pp.id
      LEFT JOIN orders o ON pp.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN fabric_types f ON pc.fabric_type_id = f.id
      LEFT JOIN departments d ON d.id = (
        SELECT department_id FROM process_tracking 
        WHERE process_card_id = pc.id 
        ORDER BY id DESC LIMIT 1
      )
      WHERE pc.status IN ('created', 'inProgress')
      ORDER BY pc.created_at DESC
    `);
    
    res.json(activeCards.rows);
  } catch (error) {
    console.error("Aktif refakat kartları listeleme hatası:", error);
    res.status(500).json({ error: "Aktif refakat kartları listelenemedi" });
  }
});

// Operatörün makine listesini getir (departmana göre)
processTrackingRouter.get("/machines/:departmentId", async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;
    
    const machines = await db.execute(sql`
      SELECT * FROM machines
      WHERE department_id = ${departmentId} AND status = 'active'
      ORDER BY name ASC
    `);
    
    res.json(machines.rows);
  } catch (error) {
    console.error("Makine listesi hatası:", error);
    res.status(500).json({ error: "Makine listesi alınamadı" });
  }
});

// İşlem tiplerini getir
processTrackingRouter.get("/process-types", async (req: Request, res: Response) => {
  try {
    const processTypes = await db.execute(sql`
      SELECT * FROM process_types
      ORDER BY name ASC
    `);
    
    // API yanıtını düzeltmek için .rows özelliğini doğrudan dönüyoruz
    res.json(processTypes.rows);
  } catch (error) {
    console.error("İşlem tipleri hatası:", error);
    res.status(500).json({ error: "İşlem tipleri alınamadı" });
  }
});