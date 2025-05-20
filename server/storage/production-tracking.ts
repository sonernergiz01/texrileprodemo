import { eq, and, desc, asc, sql, inArray, or, like, isNotNull } from "drizzle-orm";
import { db } from "../db";
import {
  type ProductionCard,
  type InsertProductionCard,
  productionCards,
  productionCardMovements,
  insertProductionCardSchema,
  insertCardMovementSchema,
  users,
  departments,
} from "@shared/schema";
import { generateUniqueId } from "../utils/generate-id";

/**
 * Üretim Takip (Refakat Kartları) Depolama Sınıfı
 */
export class ProductionTrackingStorage {
  /**
   * Refakat kartlarını listeler
   * @param filters Filtre parametreleri
   * @returns Refakat kartları
   */
  async getProductionCards(filters: Record<string, any> = {}): Promise<ProductionCard[]> {
    try {
      // Sorgu oluştur
      const query = db.select({
        id: productionCards.id,
        cardNo: productionCards.cardNo,
        barcode: productionCards.barcode,
        currentDepartmentId: productionCards.currentDepartmentId,
        orderId: productionCards.orderId,
        productionPlanId: productionCards.productionPlanId,
        currentStepId: productionCards.currentStepId,
        status: productionCards.status,
        length: productionCards.length,
        weight: productionCards.weight,
        color: productionCards.color,
        width: productionCards.width,
        fabricTypeId: productionCards.fabricTypeId,
        qualityGrade: productionCards.qualityGrade,
        notes: productionCards.notes,
        createdAt: productionCards.createdAt,
        updatedAt: productionCards.updatedAt,
        departmentName: departments.name
      })
      .from(productionCards)
      .leftJoin(departments, eq(productionCards.currentDepartmentId, departments.id));

      // Filtreleri uygula
      if (filters.status) {
        query.where(eq(productionCards.status, filters.status));
      }
      
      if (filters.departmentId) {
        query.where(eq(productionCards.currentDepartmentId, filters.departmentId));
      }
      
      if (filters.orderId) {
        query.where(eq(productionCards.orderId, filters.orderId));
      }
      
      if (filters.productionPlanId) {
        query.where(eq(productionCards.productionPlanId, filters.productionPlanId));
      }
      
      if (filters.barcode) {
        query.where(eq(productionCards.barcode, filters.barcode));
      }
      
      if (filters.search) {
        query.where(
          or(
            like(productionCards.cardNo, `%${filters.search}%`),
            like(productionCards.barcode, `%${filters.search}%`)
          )
        );
      }
      
      // Sırala (en son oluşturulanlar üstte)
      query.orderBy(desc(productionCards.createdAt));
      
      // Sorguyu çalıştır ve sonuçları döndür
      const result = await query;
      return result;
    } catch (error) {
      console.error("getProductionCards error:", error);
      throw error;
    }
  }

  /**
   * ID'ye göre refakat kartı getirir
   * @param id Kart ID
   * @returns Refakat kartı
   */
  async getProductionCardById(id: number): Promise<ProductionCard | undefined> {
    try {
      const [result] = await db.select({
        id: productionCards.id,
        cardNo: productionCards.cardNo,
        barcode: productionCards.barcode,
        currentDepartmentId: productionCards.currentDepartmentId,
        orderId: productionCards.orderId,
        productionPlanId: productionCards.productionPlanId,
        currentStepId: productionCards.currentStepId,
        status: productionCards.status,
        length: productionCards.length,
        weight: productionCards.weight,
        color: productionCards.color,
        width: productionCards.width,
        fabricTypeId: productionCards.fabricTypeId,
        qualityGrade: productionCards.qualityGrade,
        notes: productionCards.notes,
        createdAt: productionCards.createdAt,
        updatedAt: productionCards.updatedAt,
        departmentName: departments.name
      })
      .from(productionCards)
      .leftJoin(departments, eq(productionCards.currentDepartmentId, departments.id))
      .where(eq(productionCards.id, id));

      if (!result) return undefined;

      return result;
    } catch (error) {
      console.error(`getProductionCardById(${id}) error:`, error);
      throw error;
    }
  }

  /**
   * Barkoda göre refakat kartı getirir
   * @param barcode Barkod
   * @returns Refakat kartı
   */
  async getProductionCardByBarcode(barcode: string): Promise<ProductionCard | undefined> {
    try {
      const [result] = await db.select({
        id: productionCards.id,
        cardNo: productionCards.cardNo,
        barcode: productionCards.barcode,
        currentDepartmentId: productionCards.currentDepartmentId,
        orderId: productionCards.orderId,
        productionPlanId: productionCards.productionPlanId,
        currentStepId: productionCards.currentStepId,
        status: productionCards.status,
        length: productionCards.length,
        weight: productionCards.weight,
        color: productionCards.color,
        width: productionCards.width,
        fabricTypeId: productionCards.fabricTypeId,
        qualityGrade: productionCards.qualityGrade,
        notes: productionCards.notes,
        createdAt: productionCards.createdAt,
        updatedAt: productionCards.updatedAt,
        departmentName: departments.name
      })
      .from(productionCards)
      .leftJoin(departments, eq(productionCards.currentDepartmentId, departments.id))
      .where(eq(productionCards.barcode, barcode));

      if (!result) return undefined;

      return result;
    } catch (error) {
      console.error(`getProductionCardByBarcode(${barcode}) error:`, error);
      throw error;
    }
  }

  /**
   * Yeni refakat kartı oluşturur
   * @param data Kart verileri
   * @returns Oluşturulan kart
   */
  async createProductionCard(data: any): Promise<ProductionCard> {
    try {
      // Şema doğrulaması yapmadan direkt işlem yap
      
      // Benzersiz cardNo ve barcode oluştur (prefix + üretim planı id + 3 haneli rastgele sayı)
      const prefix = "RK";
      const cardNo = `${prefix}-${data.productionPlanId}-${generateUniqueId(3)}`;
      const barcode = `${prefix}${data.productionPlanId}${generateUniqueId(6)}`;

      // Kart verisini oluştur ve zorunlu alanları doldur
      const insertData = {
        productionPlanId: data.productionPlanId,
        currentDepartmentId: data.currentDepartmentId,
        orderId: data.orderId,
        currentStepId: data.currentStepId || null,
        status: data.status || 'created',
        length: data.length || null,
        weight: data.weight || null,
        color: data.color || null,
        width: data.width || null,
        fabricTypeId: data.fabricTypeId || null,
        qualityGrade: data.qualityGrade || null,
        notes: data.notes || null,
        cardNo,  // Her zaman otomatik oluştur
        barcode, // Her zaman otomatik oluştur
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Veritabanına ekle
      const [result] = await db.insert(productionCards).values(insertData).returning();
      
      return result;
    } catch (error) {
      console.error("createProductionCard error:", error);
      throw error;
    }
  }

  /**
   * Refakat kartını günceller
   * @param id Kart ID
   * @param data Güncellenecek veriler
   * @returns Güncellenmiş kart
   */
  async updateProductionCard(id: number, data: Partial<ProductionCard>): Promise<ProductionCard> {
    try {
      // Güncelleme verilerini oluştur
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      // Veritabanında güncelle
      const [result] = await db
        .update(productionCards)
        .set(updateData)
        .where(eq(productionCards.id, id))
        .returning();
      
      return result;
    } catch (error) {
      console.error(`updateProductionCard(${id}) error:`, error);
      throw error;
    }
  }

  /**
   * Refakat kartını siler
   * @param id Kart ID
   * @returns İşlem başarılı ise true
   */
  async deleteProductionCard(id: number): Promise<boolean> {
    try {
      // İlişkili hareketleri sil
      await db
        .delete(productionCardMovements)
        .where(eq(productionCardMovements.productionCardId, id));
      
      // Kartı sil
      const result = await db
        .delete(productionCards)
        .where(eq(productionCards.id, id))
        .returning({ id: productionCards.id });
      
      return result.length > 0;
    } catch (error) {
      console.error(`deleteProductionCard(${id}) error:`, error);
      throw error;
    }
  }

  /**
   * Refakat kartı hareketi oluşturur
   * @param data Hareket verileri
   * @returns Oluşturulan hareket
   */
  async createProductionCardMovement(data: any): Promise<any> {
    try {
      // Validate
      insertCardMovementSchema.parse(data);

      // Hareket verisini oluştur
      const insertData = {
        ...data,
        createdAt: new Date(),
      };

      // Veritabanına ekle
      const [result] = await db.insert(productionCardMovements).values(insertData).returning();
      
      return result;
    } catch (error) {
      console.error("createProductionCardMovement error:", error);
      throw error;
    }
  }

  /**
   * Kart ID'sine göre hareketleri getirir
   * @param cardId Kart ID
   * @returns Hareketler listesi
   */
  async getProductionCardMovementsByCardId(cardId: number): Promise<any[]> {
    try {
      const movements = await db.select({
        id: productionCardMovements.id,
        productionCardId: productionCardMovements.productionCardId,
        operatorId: productionCardMovements.operatorId,
        fromDepartmentId: productionCardMovements.fromDepartmentId,
        toDepartmentId: productionCardMovements.toDepartmentId,
        operationTypeId: productionCardMovements.operationTypeId,
        machineId: productionCardMovements.machineId,
        startTime: productionCardMovements.startTime,
        endTime: productionCardMovements.endTime,
        status: productionCardMovements.status,
        notes: productionCardMovements.notes,
        defects: productionCardMovements.defects,
        createdAt: productionCardMovements.createdAt,
        departmentName: departments.name,
        operatorName: users.fullName,
      })
        .from(productionCardMovements)
        .leftJoin(departments, eq(productionCardMovements.toDepartmentId, departments.id))
        .leftJoin(users, eq(productionCardMovements.operatorId, users.id))
        .where(eq(productionCardMovements.productionCardId, cardId))
        .orderBy(desc(productionCardMovements.startTime));

      return movements;
    } catch (error) {
      console.error(`getProductionCardMovementsByCardId(${cardId}) error:`, error);
      throw error;
    }
  }

  /**
   * Durum bazlı istatistikleri döndürür
   * @returns Durum bazlı istatistikler
   */
  async getProductionCardStatsByStatus(): Promise<any> {
    try {
      const stats = await db.execute(sql`
        SELECT status, COUNT(*) as count
        FROM production_cards
        GROUP BY status
        ORDER BY COUNT(*) DESC
      `);
      
      return stats.rows;
    } catch (error) {
      console.error("getProductionCardStatsByStatus error:", error);
      throw error;
    }
  }

  /**
   * Departman bazlı istatistikleri döndürür
   * @returns Departman bazlı istatistikler
   */
  async getProductionCardStatsByDepartment(): Promise<any> {
    try {
      const stats = await db.execute(sql`
        SELECT d.name as department, COUNT(*) as count
        FROM production_cards pc
        JOIN departments d ON pc.current_department_id = d.id
        GROUP BY d.name
        ORDER BY COUNT(*) DESC
      `);
      
      return stats.rows;
    } catch (error) {
      console.error("getProductionCardStatsByDepartment error:", error);
      throw error;
    }
  }

  /**
   * Belirli bir tarih aralığındaki üretim istatistiklerini döndürür
   * @param startDate Başlangıç tarihi
   * @param endDate Bitiş tarihi
   * @returns Üretim eğilimleri
   */
  async getProductionCardTrendsByDateRange(startDate: Date, endDate: Date): Promise<any> {
    try {
      const trends = await db.execute(sql`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as created_count,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count
        FROM production_cards
        WHERE created_at BETWEEN ${startDate} AND ${endDate}
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
      `);
      
      return trends.rows;
    } catch (error) {
      console.error("getProductionCardTrendsByDateRange error:", error);
      throw error;
    }
  }

  /**
   * Performans metriklerini döndürür
   * @returns Performans metrikleri
   */
  async getProductionPerformanceMetrics(): Promise<any> {
    try {
      // Ortalama tamamlanma süresi
      const avgCompletionTime = await db.execute(sql`
        WITH card_times AS (
          SELECT 
            pc.id,
            pc.created_at as start_time,
            (SELECT MAX(start_time) FROM production_card_movements WHERE production_card_id = pc.id AND status = 'completed') as end_time
          FROM production_cards pc
          WHERE pc.status = 'completed'
        )
        SELECT AVG(EXTRACT(EPOCH FROM (end_time - start_time))/3600)::numeric(10,2) as avg_hours
        FROM card_times
        WHERE end_time IS NOT NULL
      `);

      // Departman bazlı performans
      const deptPerformance = await db.execute(sql`
        WITH dept_times AS (
          SELECT 
            d.name as department,
            pc.id,
            pc.created_at as card_created,
            pcm.start_time as completed_time
          FROM production_cards pc
          JOIN departments d ON pc.current_department_id = d.id
          JOIN production_card_movements pcm ON pc.id = pcm.production_card_id
          WHERE pc.status = 'completed'
          AND pcm.status = 'completed'
        )
        SELECT 
          department,
          COUNT(*) as completed_count,
          AVG(EXTRACT(EPOCH FROM (completed_time - card_created))/3600)::numeric(10,2) as avg_hours
        FROM dept_times
        GROUP BY department
        ORDER BY completed_count DESC
      `);
      
      return {
        averageCompletionTimeHours: avgCompletionTime.rows[0]?.avg_hours || 0,
        departmentPerformance: deptPerformance.rows || []
      };
    } catch (error) {
      console.error("getProductionPerformanceMetrics error:", error);
      throw error;
    }
  }
}