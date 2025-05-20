/**
 * Makine ve Makine Tipleri API Rotaları
 */
import { Router, Request, Response, NextFunction } from "express";
import { db } from "../../db";
import { machines, machineTypes } from "@shared/schema";
import { eq } from "drizzle-orm";

// İzin kontrolü middleware'i
const hasPermission = (permissionCode: string) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Oturum açmanız gerekmektedir" });
  }
  
  // Admin kullanıcısıysa doğrudan izin ver
  if (req.user.username === 'admin') {
    return next();
  }
  
  // Kullanıcı için izinleri kontrol et
  if (req.user.permissions && Array.isArray(req.user.permissions)) {
    if (req.user.permissions.includes(permissionCode)) {
      return next();
    }
  }
  
  return res.status(403).json({
    message: "Bu işlem için yetkiniz bulunmamaktadır",
    details: `'${permissionCode}' yetkisine sahip değilsiniz`
  });
};

export const machinesRouter = Router();

// Tüm makine tiplerini getir
machinesRouter.get("/types", hasPermission("admin:manage_settings"), async (req: Request, res: Response) => {
  try {
    const types = await db.select().from(machineTypes).orderBy(machineTypes.name);
    res.json(types);
  } catch (error) {
    console.error("Makine tipleri alınırken hata:", error);
    res.status(500).json({ error: "Makine tipleri alınırken bir hata oluştu" });
  }
});

// Yeni makine tipi ekle
machinesRouter.post("/types", hasPermission("admin:manage_settings"), async (req: Request, res: Response) => {
  try {
    const { name, code, description, departmentId } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ error: "Ad ve kod alanları zorunludur" });
    }
    
    // Aynı kodla kayıt var mı kontrol et
    const existingType = await db.select().from(machineTypes).where(eq(machineTypes.code, code));
    if (existingType.length > 0) {
      return res.status(400).json({ error: "Bu kod ile kayıtlı bir makine tipi zaten mevcut" });
    }
    
    const [newType] = await db.insert(machineTypes).values({
      name,
      code,
      description,
      departmentId: departmentId || null
    }).returning();
    
    res.status(201).json(newType);
  } catch (error) {
    console.error("Makine tipi eklenirken hata:", error);
    res.status(500).json({ error: "Makine tipi eklenirken bir hata oluştu" });
  }
});

// Makine tipini güncelle
machinesRouter.put("/types/:id", hasPermission("admin:manage_settings"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, code, description, departmentId } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ error: "Ad ve kod alanları zorunludur" });
    }
    
    // ID ile kayıt var mı kontrol et
    const existingType = await db.select().from(machineTypes).where(eq(machineTypes.id, id));
    if (existingType.length === 0) {
      return res.status(404).json({ error: "Makine tipi bulunamadı" });
    }
    
    // Aynı kodla başka kayıt var mı kontrol et (kendisi hariç)
    const duplicateCode = await db.select().from(machineTypes)
      .where(eq(machineTypes.code, code))
      .where(db.sql`${machineTypes.id} != ${id}`);
    
    if (duplicateCode.length > 0) {
      return res.status(400).json({ error: "Bu kod ile kayıtlı başka bir makine tipi zaten mevcut" });
    }
    
    const [updatedType] = await db.update(machineTypes)
      .set({
        name,
        code,
        description,
        departmentId: departmentId || null
      })
      .where(eq(machineTypes.id, id))
      .returning();
    
    res.json(updatedType);
  } catch (error) {
    console.error("Makine tipi güncellenirken hata:", error);
    res.status(500).json({ error: "Makine tipi güncellenirken bir hata oluştu" });
  }
});

// Makine tipini sil
machinesRouter.delete("/types/:id", hasPermission("admin:manage_settings"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    // Bu makine tipine bağlı makineler var mı kontrol et
    const relatedMachines = await db.select().from(machines).where(eq(machines.machineTypeId, id));
    if (relatedMachines.length > 0) {
      return res.status(400).json({ 
        error: "Bu makine tipine bağlı makineler bulunmaktadır. Önce bu makineleri silmelisiniz." 
      });
    }
    
    const [deletedType] = await db.delete(machineTypes)
      .where(eq(machineTypes.id, id))
      .returning();
    
    if (!deletedType) {
      return res.status(404).json({ error: "Makine tipi bulunamadı" });
    }
    
    res.json(deletedType);
  } catch (error) {
    console.error("Makine tipi silinirken hata:", error);
    res.status(500).json({ error: "Makine tipi silinirken bir hata oluştu" });
  }
});

// Tüm makineleri getir
machinesRouter.get("/", hasPermission("admin:manage_settings"), async (req: Request, res: Response) => {
  try {
    const machinesList = await db.select().from(machines).orderBy(machines.name);
    res.json(machinesList);
  } catch (error) {
    console.error("Makineler alınırken hata:", error);
    res.status(500).json({ error: "Makineler alınırken bir hata oluştu" });
  }
});

// Yeni makine ekle
machinesRouter.post("/", hasPermission("admin:manage_settings"), async (req: Request, res: Response) => {
  try {
    const { name, code, machineTypeId, departmentId, status, details } = req.body;
    
    if (!name || !code || !machineTypeId) {
      return res.status(400).json({ error: "Ad, kod ve makine tipi alanları zorunludur" });
    }
    
    // Aynı kodla kayıt var mı kontrol et
    const existingMachine = await db.select().from(machines).where(eq(machines.code, code));
    if (existingMachine.length > 0) {
      return res.status(400).json({ error: "Bu kod ile kayıtlı bir makine zaten mevcut" });
    }
    
    const [newMachine] = await db.insert(machines).values({
      name,
      code,
      machineTypeId,
      departmentId: departmentId || null,
      status: status || "active",
      details
    }).returning();
    
    res.status(201).json(newMachine);
  } catch (error) {
    console.error("Makine eklenirken hata:", error);
    res.status(500).json({ error: "Makine eklenirken bir hata oluştu" });
  }
});

// Makineyi güncelle
machinesRouter.put("/:id", hasPermission("admin:manage_settings"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, code, machineTypeId, departmentId, status, details } = req.body;
    
    if (!name || !code || !machineTypeId) {
      return res.status(400).json({ error: "Ad, kod ve makine tipi alanları zorunludur" });
    }
    
    // ID ile kayıt var mı kontrol et
    const existingMachine = await db.select().from(machines).where(eq(machines.id, id));
    if (existingMachine.length === 0) {
      return res.status(404).json({ error: "Makine bulunamadı" });
    }
    
    // Aynı kodla başka kayıt var mı kontrol et (kendisi hariç)
    const duplicateCode = await db.select().from(machines)
      .where(eq(machines.code, code))
      .where(db.sql`${machines.id} != ${id}`);
    
    if (duplicateCode.length > 0) {
      return res.status(400).json({ error: "Bu kod ile kayıtlı başka bir makine zaten mevcut" });
    }
    
    const [updatedMachine] = await db.update(machines)
      .set({
        name,
        code,
        machineTypeId,
        departmentId: departmentId || null,
        status: status || "active",
        details
      })
      .where(eq(machines.id, id))
      .returning();
    
    res.json(updatedMachine);
  } catch (error) {
    console.error("Makine güncellenirken hata:", error);
    res.status(500).json({ error: "Makine güncellenirken bir hata oluştu" });
  }
});

// Makineyi sil
machinesRouter.delete("/:id", hasPermission("admin:manage_settings"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    // Bu makineye referans veren kayıtlar var mı kontrol edilebilir
    // Şu an için bu kontrol atlanıyor, gerekirse eklenebilir
    
    const [deletedMachine] = await db.delete(machines)
      .where(eq(machines.id, id))
      .returning();
    
    if (!deletedMachine) {
      return res.status(404).json({ error: "Makine bulunamadı" });
    }
    
    res.json(deletedMachine);
  } catch (error) {
    console.error("Makine silinirken hata:", error);
    res.status(500).json({ error: "Makine silinirken bir hata oluştu" });
  }
});