/**
 * Etiket ve Barkod Yönetimi API'leri
 */

import { Router, Request, Response } from 'express';
import { db } from '../db';
import { labelTypes, labelPrints, insertLabelTypeSchema, insertLabelPrintsSchema } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

export const labelsRouter = Router();

// Etiket tiplerini listele
labelsRouter.get('/types', async (req: Request, res: Response) => {
  try {
    const departmentId = req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined;
    
    let query = db.select().from(labelTypes);
    if (departmentId) {
      query = query.where(eq(labelTypes.departmentId, departmentId));
    }
    
    const labelTypesList = await query.orderBy(labelTypes.name);
    res.json(labelTypesList);
  } catch (error) {
    console.error('Etiket tipleri alınamadı:', error);
    res.status(500).json({ error: 'Etiket tipleri alınamadı' });
  }
});

// Yeni etiket tipi ekle
labelsRouter.post('/types', async (req: Request, res: Response) => {
  try {
    const validatedData = insertLabelTypeSchema.parse(req.body);
    
    const [newLabelType] = await db
      .insert(labelTypes)
      .values(validatedData)
      .returning();
    
    res.status(201).json(newLabelType);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.flatten() });
      return;
    }
    console.error('Etiket tipi eklenemedi:', error);
    res.status(500).json({ error: 'Etiket tipi eklenemedi' });
  }
});

// Etiket tipi detayını getir
labelsRouter.get('/types/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [labelType] = await db
      .select()
      .from(labelTypes)
      .where(eq(labelTypes.id, id));
    
    if (!labelType) {
      return res.status(404).json({ error: 'Etiket tipi bulunamadı' });
    }
    
    res.json(labelType);
  } catch (error) {
    console.error('Etiket tipi alınamadı:', error);
    res.status(500).json({ error: 'Etiket tipi alınamadı' });
  }
});

// Etiket tipi güncelle
labelsRouter.put('/types/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertLabelTypeSchema.parse(req.body);
    
    const [updatedLabelType] = await db
      .update(labelTypes)
      .set(validatedData)
      .where(eq(labelTypes.id, id))
      .returning();
    
    if (!updatedLabelType) {
      return res.status(404).json({ error: 'Etiket tipi bulunamadı' });
    }
    
    res.json(updatedLabelType);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.flatten() });
      return;
    }
    console.error('Etiket tipi güncellenemedi:', error);
    res.status(500).json({ error: 'Etiket tipi güncellenemedi' });
  }
});

// Etiket yazdırma işlemlerini listele
labelsRouter.get('/prints', async (req: Request, res: Response) => {
  try {
    const entityId = req.query.entityId ? parseInt(req.query.entityId as string) : undefined;
    const entityType = req.query.entityType as string | undefined;
    const labelTypeId = req.query.labelTypeId ? parseInt(req.query.labelTypeId as string) : undefined;
    
    let query = db.select().from(labelPrints);
    
    // Filtreleri uygula
    if (entityId && entityType) {
      query = query.where(
        and(
          eq(labelPrints.relatedEntityId, entityId),
          eq(labelPrints.relatedEntityType, entityType)
        )
      );
    } else if (labelTypeId) {
      query = query.where(eq(labelPrints.labelTypeId, labelTypeId));
    }
    
    const labelPrintsList = await query.orderBy(desc(labelPrints.printedAt));
    res.json(labelPrintsList);
  } catch (error) {
    console.error('Etiket yazdırma kayıtları alınamadı:', error);
    res.status(500).json({ error: 'Etiket yazdırma kayıtları alınamadı' });
  }
});

// Yeni etiket yazdırma kaydı ekle
labelsRouter.post('/print', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
    }
    
    const printData = {
      ...req.body,
      userId: req.user.id // Oturum açmış kullanıcının ID'si
    };
    
    const validatedData = insertLabelPrintsSchema.parse(printData);
    
    const [newLabelPrint] = await db
      .insert(labelPrints)
      .values(validatedData)
      .returning();
    
    res.status(201).json(newLabelPrint);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.flatten() });
      return;
    }
    console.error('Etiket yazdırma kaydı eklenemedi:', error);
    res.status(500).json({ error: 'Etiket yazdırma kaydı eklenemedi' });
  }
});

// Etiket yazdırma detayını getir
labelsRouter.get('/prints/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [labelPrint] = await db
      .select()
      .from(labelPrints)
      .where(eq(labelPrints.id, id));
    
    if (!labelPrint) {
      return res.status(404).json({ error: 'Etiket yazdırma kaydı bulunamadı' });
    }
    
    res.json(labelPrint);
  } catch (error) {
    console.error('Etiket yazdırma kaydı alınamadı:', error);
    res.status(500).json({ error: 'Etiket yazdırma kaydı alınamadı' });
  }
});

// Departman bazlı varsayılan etiket tipleri oluştur (seed)
export async function createDefaultLabelTypes() {
  try {
    const existingTypes = await db.select().from(labelTypes);
    
    // Zaten etiket tipleri varsa oluşturma
    if (existingTypes.length > 0) {
      console.log('Etiket tipleri zaten mevcut, varsayılan tipler oluşturulmadı.');
      return;
    }
    
    const defaultTemplates = [
      {
        name: 'İplik Depo Etiketi',
        code: 'YRN-DEPOT',
        description: 'İplik depo için standart etiket',
        template: JSON.stringify({
          title: 'İPLİK DEPO ETİKETİ',
          barcodeType: 'code128'
        }),
        fields: JSON.stringify([
          'yarnCode', 'yarnType', 'yarnCount', 'color', 'weight', 'supplier', 'arrivalDate', 'lotNumber'
        ]),
        departmentId: 19, // İplik Depo departman ID'si
      },
      {
        name: 'Dokuma Kumaş Etiketi',
        code: 'WVF-PROD',
        description: 'Dokuma için standart kumaş etiketi',
        template: JSON.stringify({
          title: 'DOKUMA KUMAŞ ETİKETİ',
          barcodeType: 'code128'
        }),
        fields: JSON.stringify([
          'fabricCode', 'fabricType', 'width', 'length', 'machineId', 'operatorId', 'productionDate'
        ]),
        departmentId: 11, // Dokuma departman ID'si
      },
      {
        name: 'Ham Kalite Kontrol Etiketi',
        code: 'RQC-INSP',
        description: 'Ham kalite kontrol için standart etiket',
        template: JSON.stringify({
          title: 'HAM KALİTE KONTROL ETİKETİ',
          barcodeType: 'code128'
        }),
        fields: JSON.stringify([
          'fabricCode', 'fabricType', 'rollNumber', 'width', 'length', 'weight', 'inspectorId', 'status'
        ]),
        departmentId: 13, // Ham Kalite departman ID'si
      },
      {
        name: 'Üretim Refakat Kartı',
        code: 'PRD-CARD',
        description: 'Üretim süreçleri için refakat kartı',
        template: JSON.stringify({
          title: 'ÜRETİM REFAKAT KARTI',
          barcodeType: 'qrcode'
        }),
        fields: JSON.stringify([
          'orderNumber', 'planNo', 'fabricType', 'quantity', 'unit', 'startDate', 'endDate', 'currentStep', 'priority'
        ]),
        departmentId: 3, // Üretim departman ID'si
      },
      {
        name: 'Kartela Etiketi',
        code: 'SMP-CARD',
        description: 'Kartela için standart etiket',
        template: JSON.stringify({
          title: 'KARTELA ETİKETİ',
          barcodeType: 'qrcode'
        }),
        fields: JSON.stringify([
          'sampleCode', 'customerName', 'fabricType', 'color', 'width', 'createdBy', 'status'
        ]),
        departmentId: 18, // Kartela departman ID'si
      },
      {
        name: 'Kumaş Depo Etiketi',
        code: 'STK-DEPOT',
        description: 'Kumaş depo için standart etiket',
        template: JSON.stringify({
          title: 'KUMAŞ DEPO ETİKETİ',
          barcodeType: 'code128'
        }),
        fields: JSON.stringify([
          'fabricCode', 'fabricType', 'rollNumber', 'width', 'length', 'weight', 'color', 'quality', 'location'
        ]),
        departmentId: 4, // Depo ve Stok departman ID'si
      },
      {
        name: 'Kalite Kontrol Etiketi',
        code: 'QCL-INSP',
        description: 'Kalite kontrol için standart etiket',
        template: JSON.stringify({
          title: 'KALİTE KONTROL ETİKETİ',
          barcodeType: 'code128'
        }),
        fields: JSON.stringify([
          'fabricCode', 'fabricType', 'rollNumber', 'width', 'length', 'weight', 'inspector', 'quality', 'defectPoints', 'grade'
        ]),
        departmentId: 5, // Kalite Kontrol departman ID'si
      }
    ];
    
    await db.insert(labelTypes).values(defaultTemplates);
    
    console.log('Varsayılan etiket tipleri başarıyla oluşturuldu.');
  } catch (error) {
    console.error('Varsayılan etiket tipleri oluşturulamadı:', error);
  }
}