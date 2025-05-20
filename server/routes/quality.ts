import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { comPortService, measurementDeviceService } from '../com-port-service';

// Bildirim gönderme fonksiyonunu içe aktar (routes.ts'de global olarak tanımlandı)
declare function sendNotificationToUser(userId: number, notification: {
  title: string;
  content: string;
  type: string;
  entityId?: number | null;
  entityType?: string | null;
}): Promise<any>;

// Kalite Kontrol Router
export const qualityRouter = Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Oturum açmanız gerekmektedir" });
};

// Helper function for async route handlers
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware to check if user has a specific permission
const hasPermission = (permissionCode: string) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Oturum açmanız gerekmektedir" });
  }

  if (!req.user || !req.user.id) {
    return res.status(500).json({ message: "Kullanıcı bilgisi bulunamadı" });
  }

  storage.hasPermission(req.user.id, permissionCode)
    .then(hasPermission => {
      if (hasPermission) {
        return next();
      }
      res.status(403).json({ 
        message: "Bu işlem için yetkiniz bulunmamaktadır",
        details: `'${permissionCode}' yetkisine sahip değilsiniz`
      });
    })
    .catch(err => {
      console.error(`Yetki kontrolü hatası: ${err.message}`, err);
      res.status(500).json({ 
        message: "Yetki kontrolü sırasında bir hata oluştu",
        error: process.env.NODE_ENV === 'development' ? err.toString() : undefined
      });
    });
};

// COM Port ve Ölçüm Cihazları API'leri

// Kullanılabilir COM portlarını listeler
qualityRouter.get("/ports", isAuthenticated, hasPermission("quality:manage_devices"), asyncHandler(async (req, res) => {
  const ports = await comPortService.listPorts();
  res.json(ports);
}));

// COM port bağlantısı oluşturur
qualityRouter.post("/ports/connect", isAuthenticated, hasPermission("quality:manage_devices"), asyncHandler(async (req, res) => {
  const { portName, deviceType, baudRate = 9600, dataBits = 8, stopBits = 1, parity = 'none' } = req.body;
  
  if (!portName) {
    return res.status(400).json({ message: "Port adı belirtilmelidir" });
  }

  if (!deviceType || !['weight', 'meter'].includes(deviceType)) {
    return res.status(400).json({ message: "Geçerli bir cihaz tipi belirtilmelidir (weight veya meter)" });
  }

  let connected = false;
  if (deviceType === 'weight') {
    connected = await measurementDeviceService.connectWeightDevice(portName);
  } else if (deviceType === 'meter') {
    connected = await measurementDeviceService.connectMeterDevice(portName);
  }

  if (connected) {
    res.json({ success: true, message: `${deviceType === 'weight' ? 'Tartı' : 'Metre'} cihazı ${portName} portuna bağlandı` });
  } else {
    res.status(500).json({ success: false, message: `${deviceType === 'weight' ? 'Tartı' : 'Metre'} cihazı ${portName} portuna bağlanamadı` });
  }
}));

// COM port bağlantısını kapatır
qualityRouter.post("/ports/disconnect", isAuthenticated, hasPermission("quality:manage_devices"), asyncHandler(async (req, res) => {
  const { portName } = req.body;
  
  if (!portName) {
    return res.status(400).json({ message: "Port adı belirtilmelidir" });
  }

  const disconnected = await comPortService.disconnect(portName);
  if (disconnected) {
    res.json({ success: true, message: `${portName} portundan bağlantı kesildi` });
  } else {
    res.status(500).json({ success: false, message: `${portName} portundan bağlantı kesilemedi` });
  }
}));

// Tüm COM port bağlantılarını kapatır
qualityRouter.post("/ports/disconnect-all", isAuthenticated, hasPermission("quality:manage_devices"), asyncHandler(async (req, res) => {
  await comPortService.disconnectAll();
  await measurementDeviceService.disconnectDevices();
  res.json({ success: true, message: "Tüm port bağlantıları kapatıldı" });
}));

// Cihaz durumunu kontrol eder
qualityRouter.get("/device-status", isAuthenticated, asyncHandler(async (req, res) => {
  const status = measurementDeviceService.getDeviceStatus(req.user?.id);
  res.json(status);
}));

// Tartı değerini getirir
qualityRouter.get("/weight-value", isAuthenticated, asyncHandler(async (req, res) => {
  const value = measurementDeviceService.getLastWeightValue();
  res.json({ value });
}));

// Metre değerini getirir
qualityRouter.get("/meter-value", isAuthenticated, asyncHandler(async (req, res) => {
  const value = measurementDeviceService.getLastMeterValue();
  res.json({ value });
}));

// Kumaş kontrolleri ve hataları API'leri
// Kumaş toplarını listeler
qualityRouter.get("/fabric-rolls", isAuthenticated, asyncHandler(async (req, res) => {
  const { status, startDate, endDate } = req.query;
  
  const filters: any = {};
  if (status) filters.status = status.toString();
  if (startDate) filters.startDate = new Date(startDate.toString());
  if (endDate) filters.endDate = new Date(endDate.toString());

  const fabricRolls = await storage.getQualityFabricRolls(filters);
  res.json(fabricRolls);
}));

// Belirli bir kumaş topunu getirir
qualityRouter.get("/fabric-rolls/:id", isAuthenticated, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Geçerli bir ID belirtilmelidir" });
  }

  const fabricRoll = await storage.getQualityFabricRollById(id);
  if (!fabricRoll) {
    return res.status(404).json({ message: "Kumaş topu bulunamadı" });
  }

  res.json(fabricRoll);
}));

// Barkodla kumaş topu arar
qualityRouter.get("/fabric-rolls/barcode/:barcode", isAuthenticated, asyncHandler(async (req, res) => {
  const barcode = req.params.barcode;
  if (!barcode) {
    return res.status(400).json({ message: "Barkod belirtilmelidir" });
  }

  const fabricRoll = await storage.getQualityFabricRollByBarcode(barcode);
  if (!fabricRoll) {
    return res.status(404).json({ message: "Bu barkodla kumaş topu bulunamadı" });
  }

  res.json(fabricRoll);
}));

// Yeni kumaş topu oluşturur
qualityRouter.post("/fabric-rolls", isAuthenticated, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Oturum açmanız gerekmektedir" });
  }

  const fabricRollSchema = z.object({
    barCode: z.string().min(1, "Barkod gereklidir"),
    batchNo: z.string().min(1, "Parti no gereklidir"),
    fabricTypeId: z.number().int().positive("Geçerli bir kumaş tipi seçilmelidir"),
    width: z.string().optional(),
    length: z.string().optional(),
    weight: z.string().optional(),
    color: z.string().optional(),
    machineId: z.number().int().nullable().optional(),
    status: z.string().optional(),
    operatorId: z.number().int().positive().optional(),
    notes: z.string().optional(),
  });
  
  const validatedData = fabricRollSchema.parse(req.body);
  
  // Operatör ID'si belirtilmemişse, işlemi yapan kullanıcının ID'sini kullan
  if (!validatedData.operatorId && req.user.id) {
    validatedData.operatorId = req.user.id;
  }

  const fabricRoll = await storage.createQualityFabricRoll({
    ...validatedData,
    status: validatedData.status || "active", // Varsayılan durum
    createdAt: new Date(),
  });

  if (req.user && req.user.id) {
    await storage.recordActivity({
      type: "roll_created",
      description: `Kumaş topu oluşturuldu: ${fabricRoll.barCode}`,
      userId: req.user.id,
      userName: req.user.username || "Kullanıcı",
      entityId: fabricRoll.id,
      entityType: "quality_fabric_roll"
    });
  }

  res.status(201).json(fabricRoll);
}));

// Kumaş topu bilgilerini günceller
qualityRouter.put("/fabric-rolls/:id", isAuthenticated, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Geçerli bir ID belirtilmelidir" });
  }

  if (!req.user) {
    return res.status(401).json({ message: "Oturum açmanız gerekmektedir" });
  }

  const fabricRoll = await storage.getQualityFabricRollById(id);
  if (!fabricRoll) {
    return res.status(404).json({ message: "Kumaş topu bulunamadı" });
  }

  const updatedRoll = await storage.updateQualityFabricRoll(id, req.body);

  if (req.user && req.user.id) {
    await storage.recordActivity({
      type: "roll_updated",
      description: `Kumaş topu güncellendi: ${fabricRoll.barCode}`,
      userId: req.user.id,
      userName: req.user.username || "Kullanıcı",
      entityId: id,
      entityType: "quality_fabric_roll"
    });
  }

  res.json(updatedRoll);
}));

// Kumaş topu durumunu günceller (tamamlandı/reddedildi)
qualityRouter.put("/fabric-rolls/:id/status", isAuthenticated, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Geçerli bir ID belirtilmelidir" });
  }

  if (!req.user) {
    return res.status(401).json({ message: "Oturum açmanız gerekmektedir" });
  }

  const { status } = req.body;
  if (!status || !['active', 'completed', 'rejected'].includes(status)) {
    return res.status(400).json({ message: "Geçerli bir durum belirtilmelidir (active, completed, rejected)" });
  }

  const fabricRoll = await storage.getQualityFabricRollById(id);
  if (!fabricRoll) {
    return res.status(404).json({ message: "Kumaş topu bulunamadı" });
  }

  const updatedRoll = await storage.updateQualityFabricRollStatus(id, status);

  if (req.user && req.user.id) {
    await storage.recordActivity({
      type: `roll_${status}`,
      description: `Kumaş topu durumu değiştirildi: ${fabricRoll.barCode} - Yeni durum: ${status}`,
      userId: req.user.id,
      userName: req.user.username || "Kullanıcı",
      entityId: id,
      entityType: "quality_fabric_roll"
    });
    
    // Kumaş top durumu güncellendiğinde ilgili departmanlara bildirim gönder
    try {
      // Duruma göre bildirim gönderilecek departmanları belirle
      let targetDepartmentIds: number[] = [];
      const statusMessages: {[key: string]: string} = {
        'completed': 'tamamlandı ve sevkiyata hazır',
        'rejected': 'reddedildi ve kalite standartlarını karşılamıyor',
        'active': 'yeniden aktif edildi'
      };
      
      // Tamamlanan toplar için depo departmanına (id=4) bildirim gönder
      if (status === 'completed') {
        targetDepartmentIds.push(4); // Depo ve Stok departmanı
      }
      
      // Reddedilen toplar için üretim departmanına (id=3) bildirim gönder
      if (status === 'rejected') {
        targetDepartmentIds.push(3); // Üretim departmanı
      }
      
      if (targetDepartmentIds.length > 0 && (global as any).sendNotificationToUser) {
        // Her bir hedef departman için kullanıcıları al ve bildirim gönder
        for (const departmentId of targetDepartmentIds) {
          const departmentUsers = await storage.getUsersByDepartmentId(departmentId);
          
          if (departmentUsers && departmentUsers.length > 0) {
            for (const user of departmentUsers) {
              await (global as any).sendNotificationToUser(user.id, {
                title: "Kumaş Topu Durum Değişikliği",
                content: `${fabricRoll.barCode} barkodlu kumaş topu ${statusMessages[status] || status + ' durumuna getirildi'}.`,
                type: "quality",
                entityId: fabricRoll.id,
                entityType: "fabric_roll"
              });
            }
            console.log(`Kumaş topu durum değişikliği bildirimleri gönderildi - Departman: ${departmentId}`);
          }
        }
      }
    } catch (error) {
      console.error("Kumaş topu durum değişikliği bildirim hatası:", error);
      // Bildirim göndermede hata olsa bile API yanıtını etkilememesi için hata fırlatmıyoruz
    }
  }

  res.json(updatedRoll);
}));

// Kumaş topu hatalarını getirir
qualityRouter.get("/fabric-defects/:rollId", isAuthenticated, asyncHandler(async (req, res) => {
  const rollId = parseInt(req.params.rollId);
  if (isNaN(rollId)) {
    return res.status(400).json({ message: "Geçerli bir kumaş topu ID'si belirtilmelidir" });
  }

  const defects = await storage.getQualityFabricDefects(rollId);
  res.json(defects);
}));

// Yeni kumaş hatası kaydeder
qualityRouter.post("/fabric-defects", isAuthenticated, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Oturum açmanız gerekmektedir" });
  }

  const defectSchema = z.object({
    fabricRollId: z.number().int().positive("Geçerli bir kumaş topu ID'si belirtilmelidir"),
    defectCode: z.string().min(1, "Hata kodu gereklidir"),
    startMeter: z.number().nonnegative("Başlangıç metresi 0 veya daha büyük olmalıdır"),
    endMeter: z.number().nonnegative("Bitiş metresi 0 veya daha büyük olmalıdır"),
    width: z.number().optional(),
    severity: z.enum(["low", "medium", "high"], { invalid_type_error: "Geçerli bir şiddet belirtilmelidir (low, medium, high)" }),
    description: z.string().optional(),
    createdBy: z.number().int().positive().optional(),
  });
  
  const validatedData = defectSchema.parse(req.body);
  
  // Yaratan ID'si belirtilmemişse, işlemi yapan kullanıcının ID'sini kullan
  if (!validatedData.createdBy && req.user.id) {
    validatedData.createdBy = req.user.id;
  }

  const defect = await storage.createQualityFabricDefect({
    ...validatedData,
    createdAt: new Date(),
  });

  if (req.user && req.user.id) {
    await storage.recordActivity({
      type: "defect_created",
      description: `Kumaş hatası eklendi: ${validatedData.defectCode} (${validatedData.startMeter}-${validatedData.endMeter}m)`,
      userId: req.user.id,
      userName: req.user.username || "Kalite Operatörü",
      entityId: defect.id,
      entityType: "quality_fabric_defect"
    });
    
    // Hata kaydedildiğinde kalite departmanı yöneticilerine bildirim gönder
    try {
      // Kalite departmanı (id=5) yöneticilerini al
      const qualityDepartmentId = 5; // Kalite Kontrol departmanı ID'si
      const qualityManagers = await storage.getDepartmentManagers(qualityDepartmentId);
      
      // Kumaş topu bilgilerini al
      const fabricRoll = await storage.getQualityFabricRollById(validatedData.fabricRollId);
      
      if (fabricRoll && qualityManagers.length > 0 && (global as any).sendNotificationToUser) {
        const severityText = {
          'low': 'Düşük',
          'medium': 'Orta',
          'high': 'Yüksek'
        }[validatedData.severity] || validatedData.severity;
        
        // Kalite yöneticilerine bildirim gönder
        for (const manager of qualityManagers) {
          // Bildirimi oluşturan kişi dışındaki yöneticilere gönder
          if (manager.id !== req.user.id) {
            await (global as any).sendNotificationToUser(manager.id, {
              title: "Yeni Kumaş Hatası Kaydedildi",
              content: `${fabricRoll.barCode} barkodlu kumaşta ${validatedData.defectCode} kodlu ${severityText} şiddetinde yeni hata kaydedildi.`,
              type: "quality",
              entityId: defect.id,
              entityType: "fabric_defect"
            });
          }
        }
      }
    } catch (error) {
      console.error("Kumaş hatası bildirim gönderme hatası:", error);
      // Bildirim göndermede hata olsa bile API yanıtını etkilememesi için hata fırlatmıyoruz
    }
  }

  res.status(201).json(defect);
}));

// Kumaş hatasını siler
qualityRouter.delete("/fabric-defects/:id", isAuthenticated, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Geçerli bir hata ID'si belirtilmelidir" });
  }

  if (!req.user) {
    return res.status(401).json({ message: "Oturum açmanız gerekmektedir" });
  }

  const defect = await storage.getQualityFabricDefectById(id);
  if (!defect) {
    return res.status(404).json({ message: "Hata bulunamadı" });
  }

  await storage.deleteQualityFabricDefect(id);

  if (req.user && req.user.id) {
    await storage.recordActivity({
      type: "defect_deleted",
      description: `Kumaş hatası silindi: ${defect.defectCode}`,
      userId: req.user.id,
      userName: req.user.username || "Kalite Operatörü",
      entityId: defect.fabricRollId,
      entityType: "quality_fabric_roll"
    });
  }

  res.status(204).send();
}));

// Hata kodlarını getirir
qualityRouter.get("/defect-codes", isAuthenticated, asyncHandler(async (req, res) => {
  const defectCodes = await storage.getQualityDefectCodes();
  res.json(defectCodes);
}));

// Yeni hata kodu oluşturur
qualityRouter.post("/defect-codes", isAuthenticated, hasPermission("quality:manage_defect_codes"), asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Oturum açmanız gerekmektedir" });
  }

  const defectCodeSchema = z.object({
    code: z.string().min(1, "Kod gereklidir"),
    name: z.string().min(1, "İsim gereklidir"),
    description: z.string().optional(),
    severity: z.enum(["low", "medium", "high"], { invalid_type_error: "Geçerli bir şiddet belirtilmelidir (low, medium, high)" }),
    points: z.number().int().nonnegative().optional(),
    createdBy: z.number().int().positive().optional(),
  });
  
  const validatedData = defectCodeSchema.parse(req.body);
  
  // Yaratan ID'si belirtilmemişse, işlemi yapan kullanıcının ID'sini kullan
  if (!validatedData.createdBy && req.user.id) {
    validatedData.createdBy = req.user.id;
  }

  const defectCode = await storage.createQualityDefectCode({
    ...validatedData,
    createdAt: new Date(),
  });

  res.status(201).json(defectCode);
}));

// Kalite kontrol istatistiklerini getirir
qualityRouter.get("/stats", isAuthenticated, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const filters: any = {};
  if (startDate) filters.startDate = new Date(startDate.toString());
  if (endDate) filters.endDate = new Date(endDate.toString());

  const stats = await storage.getQualityStats();
  res.json(stats);
}));

// Kalite aktivitelerini getirir
qualityRouter.get("/activities", isAuthenticated, asyncHandler(async (req, res) => {
  const { startDate, endDate, userId, limit } = req.query;
  
  const filters: any = {};
  if (startDate) filters.startDate = new Date(startDate.toString());
  if (endDate) filters.endDate = new Date(endDate.toString());
  if (userId) filters.userId = parseInt(userId.toString());
  if (limit) filters.limit = parseInt(limit.toString());

  const activities = await storage.getQualityActivities(filters);
  res.json(activities);
}));