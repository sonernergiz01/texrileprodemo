import {
  users,
  type User,
  type InsertUser,
  roles,
  type Role,
  type InsertRole,
  departments,
  type Department,
  type InsertDepartment,
  permissions,
  rolePermissions,
  
  // Üretim takip ve refakat kartları için gerekli importlar
  productionCards,
  type ProductionCard,
  type InsertProductionCard,
  productionCardMovements,
  type CardMovement,
  type InsertCardMovement,
  processTypes,
  
  // Dokuma/Terbiye/Apre modülleri için gereken importları sonradan ekle
  fabricTypes,
  type FabricType,
  type InsertFabricType,
  yarnTypes,
  type YarnType,
  type InsertYarnType,
  rawMaterials,
  type RawMaterial,
  type TwistingOrder,
  type InsertTwistingOrder,
  type InsertRawMaterial,
  customers,
  type Customer,
  type InsertCustomer,
  orderStatuses,
  type OrderStatus,
  type InsertOrderStatus,
  orders,
  type Order,
  type InsertOrder,
  maintenanceRequests,
  type MaintenanceRequest,
  type InsertMaintenanceRequest,
  maintenanceActivities,
  type MaintenanceActivity, 
  type InsertMaintenanceActivity,
  notifications,
  type Notification,
  type InsertNotification,
  // Etiket Tabloları
  labelTypes,
  type LabelType,
  type InsertLabelType,
  labelPrints,
  type LabelPrint,
  type InsertLabelPrint,
  // Numune Modülü
  sampleRequests,
  type SampleRequest,
  type InsertSampleRequest,
  sampleOrders,
  type SampleOrder,
  type InsertSampleOrder,
  sampleProductionSteps,
  type SampleProductionStep,
  type InsertSampleProductionStep,
  sampleCards,
  type SampleCard,
  type InsertSampleCard,
  sampleCardMovements,
  type SampleCardMovement,
  type InsertSampleCardMovement,
  sampleFeedback,
  type SampleFeedback,
  type InsertSampleFeedback,
  productionCards,
  type ProductionCard,
  type InsertProductionCard,
  trackingEvents,
  type TrackingEvent,
  type InsertTrackingEvent,
  customerInteractions,
  type CustomerInteraction,
  type InsertCustomerInteraction,
  opportunities,
  type Opportunity,
  shipments,
  type Shipment,
  type InsertShipment,
  type InsertOpportunity,
  userRoles,
  processTypes,
  type ProcessType,
  type InsertProcessType,
  machineTypes,
  type MachineType,
  type InsertMachineType,
  machines,
  type Machine,
  type InsertMachine,
  productionPlans,
  type ProductionPlan,
  type InsertProductionPlan,
  productionSteps,
  type ProductionStep,
  type InsertProductionStep,
  productionRouteTemplates,
  type ProductionRouteTemplate,
  type InsertProductionRouteTemplate,
  productionRouteTemplateSteps,
  type ProductionRouteTemplateStep,
  type InsertProductionRouteTemplateStep
} from "@shared/schema";
import { IStorage } from "../storage";
import { db } from "../db";
import { eq, and, sql, gte, lte, asc, desc, inArray, or, count, like, isNull, isNotNull } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import { pool } from "../db";

const scryptAsync = promisify(scrypt);

// Fix Store type
type SessionStore = session.Store;

// Use connect-pg-simple for storing sessions in PostgreSQL
const PostgresSessionStore = connectPgSimple(session);

// Activity type for tracking system activities
interface Activity {
  id: number;
  type: string;
  description: string;
  userId: number;
  userName: string;
  timestamp: Date;
  entityId?: number;
  entityType?: string;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  // Numune Modülü Yöntemleri
  async getSampleRequests(options?: { customerId?: number; status?: string; }): Promise<SampleRequest[]> {
    let query = db.select().from(sampleRequests);
    
    if (options) {
      if (options.customerId) {
        query = query.where(eq(sampleRequests.customerId, options.customerId));
      }
      
      if (options.status) {
        query = query.where(eq(sampleRequests.status, options.status));
      }
    }
    
    return await query.orderBy(sql`${sampleRequests.createdAt} DESC`);
  }
  
  async getSampleRequestById(id: number): Promise<SampleRequest | undefined> {
    const [request] = await db.select().from(sampleRequests).where(eq(sampleRequests.id, id));
    return request;
  }
  
  async createSampleRequest(data: InsertSampleRequest): Promise<SampleRequest> {
    // Numune talebi kodu oluştur (NR-YIL+AYAY+00X formatında)
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    // Otomatik kod oluştur
    const [lastRequest] = await db.select({ id: sampleRequests.id })
      .from(sampleRequests)
      .orderBy(sql`${sampleRequests.id} DESC`)
      .limit(1);
    
    const requestNumber = lastRequest ? (lastRequest.id + 1) : 1;
    const requestCode = `NR-${year}${month}${String(requestNumber).padStart(3, '0')}`;
    
    // Veriyi hazırla ve kaydet
    const insertData = {
      ...data,
      requestCode
    };
    
    const [request] = await db.insert(sampleRequests)
      .values(insertData)
      .returning();
    
    return request;
  }
  
  async updateSampleRequest(id: number, data: Partial<InsertSampleRequest>): Promise<SampleRequest | undefined> {
    const [request] = await db.update(sampleRequests)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(sampleRequests.id, id))
      .returning();
    
    return request;
  }
  
  async getSampleOrders(options?: { sampleRequestId?: number; status?: string; }): Promise<SampleOrder[]> {
    let query = db.select().from(sampleOrders);
    
    if (options) {
      if (options.sampleRequestId) {
        query = query.where(eq(sampleOrders.sampleRequestId, options.sampleRequestId));
      }
      
      if (options.status) {
        query = query.where(eq(sampleOrders.status, options.status));
      }
    }
    
    return await query.orderBy(sql`${sampleOrders.createdAt} DESC`);
  }
  
  async getSampleOrderById(id: number): Promise<SampleOrder | undefined> {
    const [order] = await db.select().from(sampleOrders).where(eq(sampleOrders.id, id));
    return order;
  }
  
  async createSampleOrder(data: InsertSampleOrder): Promise<SampleOrder> {
    // Numune sipariş kodu oluştur (NS-YIL+AYAY+00X formatında)
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    // Otomatik kod oluştur
    const [lastOrder] = await db.select({ id: sampleOrders.id })
      .from(sampleOrders)
      .orderBy(sql`${sampleOrders.id} DESC`)
      .limit(1);
    
    const orderNumber = lastOrder ? (lastOrder.id + 1) : 1;
    const orderCode = `NS-${year}${month}${String(orderNumber).padStart(3, '0')}`;
    
    // Veriyi hazırla ve kaydet
    const insertData = {
      ...data,
      orderCode
    };
    
    const [order] = await db.insert(sampleOrders)
      .values(insertData)
      .returning();
    
    return order;
  }
  
  async updateSampleOrder(id: number, data: Partial<InsertSampleOrder>): Promise<SampleOrder | undefined> {
    const [order] = await db.update(sampleOrders)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(sampleOrders.id, id))
      .returning();
    
    return order;
  }
  
  async updateSampleOrderStatus(id: number, status: string): Promise<SampleOrder | undefined> {
    const [order] = await db.update(sampleOrders)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(sampleOrders.id, id))
      .returning();
    
    return order;
  }
  
  async getSampleProductionSteps(sampleOrderId: number): Promise<SampleProductionStep[]> {
    return await db.select()
      .from(sampleProductionSteps)
      .where(eq(sampleProductionSteps.sampleOrderId, sampleOrderId))
      .orderBy(asc(sampleProductionSteps.sequence));
  }
  
  async getSampleProductionStepById(id: number): Promise<SampleProductionStep | undefined> {
    const [step] = await db.select().from(sampleProductionSteps).where(eq(sampleProductionSteps.id, id));
    return step;
  }
  
  async createSampleProductionStep(data: InsertSampleProductionStep): Promise<SampleProductionStep> {
    const [step] = await db.insert(sampleProductionSteps)
      .values(data)
      .returning();
    
    return step;
  }
  
  async updateSampleProductionStep(id: number, data: Partial<InsertSampleProductionStep>): Promise<SampleProductionStep | undefined> {
    const [step] = await db.update(sampleProductionSteps)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(sampleProductionSteps.id, id))
      .returning();
    
    return step;
  }
  
  async updateSampleProductionStepStatus(id: number, status: string): Promise<SampleProductionStep | undefined> {
    const [step] = await db.update(sampleProductionSteps)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(sampleProductionSteps.id, id))
      .returning();
    
    return step;
  }
  
  async getAllSampleCards(): Promise<SampleCard[]> {
    return await db.select()
      .from(sampleCards)
      .orderBy(sql`${sampleCards.id} DESC`);
  }

  async getSampleCards(sampleOrderId: number): Promise<SampleCard[]> {
    return await db.select()
      .from(sampleCards)
      .where(eq(sampleCards.sampleOrderId, sampleOrderId));
  }
  
  async getSampleCardById(id: number): Promise<SampleCard | undefined> {
    const [card] = await db.select().from(sampleCards).where(eq(sampleCards.id, id));
    return card;
  }
  
  async getSampleCardByBarcode(barcode: string): Promise<SampleCard | undefined> {
    const [card] = await db.select().from(sampleCards).where(eq(sampleCards.barcode, barcode));
    return card;
  }
  
  async createSampleCard(data: InsertSampleCard): Promise<SampleCard> {
    // Kart numarası oluştur (NC-YIL+AYAY+00X formatında)
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    // Otomatik kod oluştur
    const [lastCard] = await db.select({ id: sampleCards.id })
      .from(sampleCards)
      .orderBy(sql`${sampleCards.id} DESC`)
      .limit(1);
    
    const cardNumber = lastCard ? (lastCard.id + 1) : 1;
    const cardNo = `NC-${year}${month}${String(cardNumber).padStart(3, '0')}`;
    
    // Benzersiz barkod oluştur
    const barcode = `NSBC${year}${month}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}${String(cardNumber).padStart(3, '0')}`;
    
    // Veriyi hazırla ve kaydet
    const insertData = {
      ...data,
      cardNo,
      barcode
    };
    
    const [card] = await db.insert(sampleCards)
      .values(insertData)
      .returning();
    
    return card;
  }
  
  async updateSampleCard(id: number, data: Partial<InsertSampleCard>): Promise<SampleCard | undefined> {
    const [card] = await db.update(sampleCards)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(sampleCards.id, id))
      .returning();
    
    return card;
  }
  
  async getSampleCardMovements(sampleCardId: number): Promise<SampleCardMovement[]> {
    return await db.select()
      .from(sampleCardMovements)
      .where(eq(sampleCardMovements.sampleCardId, sampleCardId))
      .orderBy(sql`${sampleCardMovements.startTime} DESC`);
  }
  
  async createSampleCardMovement(data: InsertSampleCardMovement): Promise<SampleCardMovement> {
    const [movement] = await db.insert(sampleCardMovements)
      .values(data)
      .returning();
    
    return movement;
  }
  
  async completeSampleCardMovement(id: number, data: { endTime: Date; notes?: string; defects?: any[] }): Promise<SampleCardMovement | undefined> {
    const [movement] = await db.update(sampleCardMovements)
      .set({
        endTime: data.endTime,
        notes: data.notes || null,
        defects: data.defects || null,
        status: "Tamamlandı",
        updatedAt: new Date()
      })
      .where(eq(sampleCardMovements.id, id))
      .returning();
    
    return movement;
  }
  
  async getSampleFeedback(sampleOrderId: number): Promise<SampleFeedback[]> {
    return await db.select()
      .from(sampleFeedback)
      .where(eq(sampleFeedback.sampleOrderId, sampleOrderId))
      .orderBy(sql`${sampleFeedback.createdAt} DESC`);
  }
  
  async getSampleFeedbackById(id: number): Promise<SampleFeedback | undefined> {
    const [feedback] = await db.select().from(sampleFeedback).where(eq(sampleFeedback.id, id));
    return feedback;
  }
  
  async createSampleFeedback(data: InsertSampleFeedback): Promise<SampleFeedback> {
    const [feedback] = await db.insert(sampleFeedback)
      .values(data)
      .returning();
    
    return feedback;
  }
  
  async updateSampleFeedback(id: number, data: Partial<InsertSampleFeedback>): Promise<SampleFeedback | undefined> {
    const [feedback] = await db.update(sampleFeedback)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(sampleFeedback.id, id))
      .returning();
    
    return feedback;
  }
  
  // Bildirim (Notifications) yöntemleri
  async getUserNotifications(userId: number, options?: { showArchived?: boolean, limit?: number, type?: string }): Promise<Notification[]> {
    let query = db.select().from(notifications).where(eq(notifications.user_id, userId));
    
    if (options) {
      if (!options.showArchived) {
        query = query.where(eq(notifications.is_archived, false));
      }
      
      if (options.type) {
        query = query.where(eq(notifications.type, options.type));
      }
    }
    
    query = query.orderBy(sql`${notifications.created_at} DESC`);
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return await query;
  }
  
  async getNotificationById(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }
  
  async createNotification(data: any): Promise<Notification> {
    try {
      // Alan adlarını veritabanı sütunlarına göre uyarla
      // Hem snake_case hem camelCase desteği sağla
      const notificationData = {
        user_id: data.user_id || data.userId, // Eski uygulamalardan gelen camelCase kullanımı için fallback
        title: data.title,
        content: data.content,
        type: data.type,
        is_read: data.is_read !== undefined ? data.is_read : (data.isRead !== undefined ? data.isRead : false),
        is_archived: data.is_archived !== undefined ? data.is_archived : (data.isArchived !== undefined ? data.isArchived : false),
        related_entity_id: data.related_entity_id || data.relatedEntityId || null,
        related_entity_type: data.related_entity_type || data.relatedEntityType || null,
        created_at: data.created_at || data.createdAt || new Date()
      };
      
      console.log("Bildirim oluşturuluyor:", notificationData);
      
      const [notification] = await db.insert(notifications)
        .values(notificationData)
        .returning();
      
      return notification;
    } catch (error) {
      console.error("Bildirim oluşturma hatası:", error);
      throw error;
    }
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    try {
      const [notification] = await db.update(notifications)
        .set({ is_read: true })
        .where(eq(notifications.id, id))
        .returning();
      
      return notification;
    } catch (error) {
      console.error("Bildirim okuma hatası:", error);
      return undefined;
    }
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<void> {
    try {
      await db.update(notifications)
        .set({ is_read: true })
        .where(and(
          eq(notifications.user_id, userId),
          eq(notifications.is_read, false)
        ));
    } catch (error) {
      console.error("Tüm bildirimleri okuma hatası:", error);
      throw error;
    }
  }
  
  async archiveNotification(id: number): Promise<Notification | undefined> {
    try {
      const [notification] = await db.update(notifications)
        .set({ is_archived: true })
        .where(eq(notifications.id, id))
        .returning();
      
      return notification;
    } catch (error) {
      console.error("Bildirim arşivleme hatası:", error);
      return undefined;
    }
  }
  
  async deleteNotification(id: number): Promise<boolean> {
    try {
      await db.delete(notifications).where(eq(notifications.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  }
  
  async cleanupNotifications(options: { 
    userId?: number, 
    olderThan?: Date, 
    keepUnread?: boolean, 
    maxNotifications?: number 
  } = {}): Promise<number> {
    try {
      let query = db.delete(notifications);
      const conditions = [];
      
      // Belirli bir kullanıcının bildirimlerini temizle
      if (options.userId) {
        conditions.push(eq(notifications.user_id, options.userId));
      }
      
      // Belirli bir tarihten eski bildirimleri temizle
      if (options.olderThan) {
        conditions.push(sql`${notifications.created_at} < ${options.olderThan}`);
      }
      
      // Okunmamış bildirimleri koru
      if (options.keepUnread) {
        conditions.push(eq(notifications.is_read, true));
      }
      
      // Koşul yoksa, varsayılan olarak bir hafta önceki bildirimleri temizle
      if (conditions.length === 0 && !options.maxNotifications) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        conditions.push(sql`${notifications.created_at} < ${oneWeekAgo}`);
      }
      
      // Koşulları ekle
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Maksimum bildirim sayısı kontrolü
      if (options.maxNotifications && options.userId) {
        // Kullanıcının bildirimlerini sayfa sayfa alarak fazla olanları sil
        const userNotifications = await db.select({id: notifications.id})
          .from(notifications)
          .where(eq(notifications.user_id, options.userId))
          .orderBy(sql`${notifications.created_at} DESC`)
          .limit(1000); // Güvenlik için limit
        
        if (userNotifications.length > options.maxNotifications) {
          // Korunacak bildirimlerin ID'lerini belirle
          const keepNotificationIds = userNotifications
            .slice(0, options.maxNotifications)
            .map(n => n.id);
          
          // Korunacak bildirimler dışındakileri sil
          return await db.delete(notifications)
            .where(and(
              eq(notifications.user_id, options.userId),
              sql`${notifications.id} NOT IN (${keepNotificationIds.join(',')})`
            ))
            .execute()
            .then(() => userNotifications.length - options.maxNotifications);
        }
        
        return 0; // Silinecek bildirim yok
      }
      
      // Silme işlemini gerçekleştir
      const result = await query.execute();
      return result.rowCount ?? 0;
    } catch (error) {
      console.error("Bildirim temizleme hatası:", error);
      return 0;
    }
  }
  
  // Sevkiyat işlemleri metodları
  async getShipments(filters?: Record<string, any>): Promise<Shipment[]> {
    let query = db.select().from(shipments);
    
    if (filters) {
      if (filters.status) {
        query = query.where(eq(shipments.status, filters.status));
      }
      
      if (filters.customerId) {
        query = query.where(eq(shipments.customerId, filters.customerId));
      }
      
      if (filters.from && filters.to) {
        query = query.where(
          and(
            gte(shipments.plannedDate, filters.from),
            lte(shipments.plannedDate, filters.to)
          )
        );
      }
    }
    
    return await query.orderBy(sql`${shipments.createdAt} DESC`);
  }
  
  async getShipmentById(id: number): Promise<Shipment | undefined> {
    const [shipment] = await db.select().from(shipments).where(eq(shipments.id, id));
    return shipment;
  }
  
  async getShipmentItemsByShipmentId(id: number): Promise<any[]> {
    // Şimdilik boş bir dizi döndürelim, ileride sevkiyat kalemleri tablosu eklenebilir
    return [];
  }
  
  async createShipment(shipmentData: InsertShipment): Promise<Shipment> {
    const [shipment] = await db.insert(shipments).values(shipmentData).returning();
    return shipment;
  }
  
  async updateShipment(id: number, shipmentData: Partial<Shipment>): Promise<Shipment> {
    const [updatedShipment] = await db
      .update(shipments)
      .set({
        ...shipmentData,
        updatedAt: new Date()
      })
      .where(eq(shipments.id, id))
      .returning();
    return updatedShipment;
  }
  
  async deleteShipment(id: number): Promise<void> {
    await db.delete(shipments).where(eq(shipments.id, id));
  }
  
  async deleteShipmentItemsByShipmentId(id: number): Promise<void> {
    // Sevkiyat kalemleri tablosu oluşturulduğunda burada silme işlemi yapılacak
  }
  
  // Depo raporları metodları
  async getWarehouseStockReport(): Promise<any[]> {
    // Depo stok raporu örnek verisi - gerçek veriler için SQL sorguları eklenecek
    // Bu yöntem ileride SQL sorgularıyla değiştirilecek
    return [
      { id: 1, productName: "İplik A", quantity: 1500, unit: "kg", location: "A-01-01", lastUpdate: new Date() },
      { id: 2, productName: "İplik B", quantity: 2200, unit: "kg", location: "A-02-03", lastUpdate: new Date() },
      { id: 3, productName: "Kumaş X", quantity: 3000, unit: "m", location: "B-05-02", lastUpdate: new Date() }
    ];
  }
  
  async getWarehouseMovementsReport(): Promise<any[]> {
    // Depo hareketleri raporu örnek verisi - gerçek veriler için SQL sorguları eklenecek
    // Bu yöntem ileride SQL sorgularıyla değiştirilecek
    return [
      { id: 1, date: new Date(), type: "Giriş", productName: "İplik A", quantity: 500, unit: "kg", user: "Ahmet Yılmaz" },
      { id: 2, date: new Date(), type: "Çıkış", productName: "Kumaş X", quantity: 1200, unit: "m", user: "Mehmet Kaya" },
      { id: 3, date: new Date(), type: "Transfer", productName: "İplik B", quantity: 800, unit: "kg", user: "Ayşe Demir" }
    ];
  }
  
  async getWarehouseSupplierReport(): Promise<any[]> {
    // Tedarikçi raporu örnek verisi - gerçek veriler için SQL sorguları eklenecek
    // Bu yöntem ileride SQL sorgularıyla değiştirilecek
    return [
      { id: 1, supplierName: "ABC İplik Ltd.", orderCount: 15, totalAmount: 125000, lastOrderDate: new Date() },
      { id: 2, supplierName: "XYZ Tekstil A.Ş.", orderCount: 8, totalAmount: 78500, lastOrderDate: new Date() },
      { id: 3, supplierName: "Mega Kumaş San.", orderCount: 12, totalAmount: 96000, lastOrderDate: new Date() }
    ];
  }
  
  async getWarehouseMetrics(): Promise<any> {
    // Depo metrikleri örnek verisi - gerçek veriler için SQL sorguları eklenecek
    // Bu yöntem ileride SQL sorgularıyla değiştirilecek
    return {
      totalProducts: 1256,
      totalValue: 1250000,
      lowStockItems: 23,
      newArrivals: 45,
      pendingOrders: 12,
      stockUtilization: 78 // yüzde
    };
  }
  
  // Bakım Talepleri (Maintenance) yöntemleri
  async getMaintenanceRequests(filters?: any): Promise<MaintenanceRequest[]> {
    let query = db.select().from(maintenanceRequests);
    
    if (filters) {
      if (filters.departmentId) {
        query = query.where(eq(maintenanceRequests.departmentId, filters.departmentId));
      }
      
      if (filters.status) {
        query = query.where(eq(maintenanceRequests.status, filters.status));
      }
      
      if (filters.requestType) {
        query = query.where(eq(maintenanceRequests.requestType, filters.requestType));
      }
      
      if (filters.priority) {
        query = query.where(eq(maintenanceRequests.priority, filters.priority));
      }
      
      if (filters.requesterId) {
        query = query.where(eq(maintenanceRequests.requesterId, filters.requesterId));
      }
      
      if (filters.assignedToId) {
        query = query.where(eq(maintenanceRequests.assignedToId, filters.assignedToId));
      }
    }
    
    return await query.orderBy(sql`${maintenanceRequests.createdAt} DESC`);
  }
  
  async getMaintenanceRequestById(id: number): Promise<MaintenanceRequest | undefined> {
    // NaN kontrolü ekleyelim
    if (isNaN(id)) {
      console.warn("getMaintenanceRequestById için geçersiz ID:", id);
      return undefined;
    }
    
    const [request] = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.id, id));
    return request;
  }
  
  async createMaintenanceRequest(data: InsertMaintenanceRequest): Promise<MaintenanceRequest> {
    const [request] = await db.insert(maintenanceRequests)
      .values(data)
      .returning();
    
    return request;
  }
  
  async updateMaintenanceRequest(id: number, data: Partial<MaintenanceRequest>): Promise<MaintenanceRequest | undefined> {
    const [request] = await db.update(maintenanceRequests)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(maintenanceRequests.id, id))
      .returning();
    
    return request;
  }
  
  async deleteMaintenanceRequest(id: number): Promise<boolean> {
    try {
      // Önce ilişkili aktiviteleri sil
      await db.delete(maintenanceActivities)
        .where(eq(maintenanceActivities.maintenanceRequestId, id));
      
      // Sonra talebi sil
      await db.delete(maintenanceRequests)
        .where(eq(maintenanceRequests.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting maintenance request:", error);
      return false;
    }
  }
  
  async getMaintenanceActivities(requestId: number): Promise<MaintenanceActivity[]> {
    return await db.select()
      .from(maintenanceActivities)
      .where(eq(maintenanceActivities.maintenanceRequestId, requestId))
      .orderBy(sql`${maintenanceActivities.createdAt} DESC`);
  }
  
  async createMaintenanceActivity(data: InsertMaintenanceActivity): Promise<MaintenanceActivity> {
    const [activity] = await db.insert(maintenanceActivities)
      .values(data)
      .returning();
    
    return activity;
  }
  
  async getUsersByDepartmentId(departmentId: number): Promise<User[]> {
    return await db.select()
      .from(users)
      .where(eq(users.departmentId, departmentId));
  }
  
  async userHasDepartment(userId: number, departmentId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    return user?.departmentId === departmentId;
  }
  
  async getMaintenanceStats(departmentId?: number | null, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      console.log("Bakım istatistikleri hesaplanıyor...", { departmentId, startDate, endDate });
      
      // Departman ve tarih kontrolü
      if (departmentId !== null && departmentId !== undefined && isNaN(departmentId)) {
        console.warn("getMaintenanceStats için geçersiz departman ID:", departmentId);
        departmentId = null;
      }
      
      if (startDate && isNaN(startDate.getTime())) {
        console.warn("getMaintenanceStats için geçersiz başlangıç tarihi:", startDate);
        startDate = undefined;
      }
      
      if (endDate && isNaN(endDate.getTime())) {
        console.warn("getMaintenanceStats için geçersiz bitiş tarihi:", endDate);
        endDate = undefined;
      }
    
      // Temel sorgular için filtre koşulları
      const filters = [];
      
      if (departmentId) {
        // Departman filtresi - burada targetDepartmentId kullanıyoruz çünkü bakım departmanlarına gönderilen talepleri görmek istiyoruz
        filters.push(eq(maintenanceRequests.targetDepartmentId, departmentId));
      }
      
      if (startDate && endDate) {
        // Tarih aralığı filtresi
        filters.push(
          and(
            gte(maintenanceRequests.requestDate, startDate),
            lte(maintenanceRequests.requestDate, endDate)
          )
        );
      }
      
      // Filtreleri birleştir
      const whereCondition = filters.length > 0 ? and(...filters) : undefined;
      
      // İstatistik bilgilerini veritabanından çek
      const totalFilters = [];
      
      if (departmentId) {
        totalFilters.push(eq(maintenanceRequests.targetDepartmentId, departmentId));
      }
      
      if (startDate && endDate) {
        totalFilters.push(
          and(
            gte(maintenanceRequests.requestDate, startDate),
            lte(maintenanceRequests.requestDate, endDate)
          )
        );
      }
      
      let query = db.select({ count: sql`count(*)` }).from(maintenanceRequests);
      if (totalFilters.length > 0) {
        query = query.where(and(...totalFilters));
      }
      
      const totalRequests = await query;
      
      // Talep durumlarına göre sayılar
      const statusCounts = await Promise.all([
        "pending", "in-progress", "completed", "rejected"
      ].map(async (status) => {
        const statusFilters = [eq(maintenanceRequests.status, status)];
        
        if (departmentId) {
          statusFilters.push(eq(maintenanceRequests.targetDepartmentId, departmentId));
        }
        
        if (startDate && endDate) {
          statusFilters.push(
            and(
              gte(maintenanceRequests.requestDate, startDate),
              lte(maintenanceRequests.requestDate, endDate)
            )
          );
        }
        
        const result = await db.select({ count: sql`count(*)` })
          .from(maintenanceRequests)
          .where(and(...statusFilters));
        
        return { status, count: Number(result[0]?.count || 0) };
      }));
      
      // Öncelik seviyesine göre istatistikler
      const priorityCounts = await Promise.all([
        "low", "normal", "high", "critical"
      ].map(async (priority) => {
        const priorityFilters = [eq(maintenanceRequests.priority, priority)];
        
        if (departmentId) {
          priorityFilters.push(eq(maintenanceRequests.targetDepartmentId, departmentId));
        }
        
        if (startDate && endDate) {
          priorityFilters.push(
            and(
              gte(maintenanceRequests.requestDate, startDate),
              lte(maintenanceRequests.requestDate, endDate)
            )
          );
        }
        
        const result = await db.select({ count: sql`count(*)` })
          .from(maintenanceRequests)
          .where(and(...priorityFilters));
        
        return { priority, count: Number(result[0]?.count || 0) };
      }));
      
      // Departman bazlı istatistikler (hedef departmanlar - bakım bölümleri)
      const deptFilters = [];
      
      if (departmentId) {
        deptFilters.push(eq(maintenanceRequests.targetDepartmentId, departmentId));
      }
      
      if (startDate && endDate) {
        deptFilters.push(
          and(
            gte(maintenanceRequests.requestDate, startDate),
            lte(maintenanceRequests.requestDate, endDate)
          )
        );
      }
      
      let deptQuery = db.select({
          departmentId: maintenanceRequests.targetDepartmentId,
          departmentName: departments.name,
          count: sql`count(*)`
        })
        .from(maintenanceRequests)
        .leftJoin(departments, eq(maintenanceRequests.targetDepartmentId, departments.id));
      
      if (deptFilters.length > 0) {
        deptQuery = deptQuery.where(and(...deptFilters));
      }
      
      const departmentStats = await deptQuery.groupBy(maintenanceRequests.targetDepartmentId, departments.name);
      
      // Zaman dilimlerine göre istatistikler (son 6 ay)
      const monthlyStats = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        let monthlyQuery = db.select({ count: sql`count(*)` })
          .from(maintenanceRequests)
          .where(
            and(
              gte(maintenanceRequests.requestDate, month),
              lte(maintenanceRequests.requestDate, nextMonth)
            )
          );
        
        if (departmentId) {
          monthlyQuery = monthlyQuery.where(eq(maintenanceRequests.targetDepartmentId, departmentId));
        }
        
        const result = await monthlyQuery;
        
        // Ay isimlerini Türkçe olarak ekle
        const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        
        monthlyStats.push({
          month: monthNames[month.getMonth()],
          year: month.getFullYear(),
          count: Number(result[0]?.count || 0)
        });
      }
      
      // Tür bazlı istatistikler
      const typeFilters = [];
      
      if (departmentId) {
        typeFilters.push(eq(maintenanceRequests.targetDepartmentId, departmentId));
      }
      
      if (startDate && endDate) {
        typeFilters.push(
          and(
            gte(maintenanceRequests.requestDate, startDate),
            lte(maintenanceRequests.requestDate, endDate)
          )
        );
      }
      
      let typeQuery = db.select({
          requestType: maintenanceRequests.requestType,
          count: sql`count(*)`
        })
        .from(maintenanceRequests);
      
      if (typeFilters.length > 0) {
        typeQuery = typeQuery.where(and(...typeFilters));
      }
      
      const typeStats = await typeQuery.groupBy(maintenanceRequests.requestType);
      
      // Ortalama tamamlanma süresi (saat olarak)
      const avgTimeFilters = [eq(maintenanceRequests.status, "completed")];
      
      if (departmentId) {
        avgTimeFilters.push(eq(maintenanceRequests.targetDepartmentId, departmentId));
      }
      
      if (startDate && endDate) {
        avgTimeFilters.push(
          and(
            gte(maintenanceRequests.requestDate, startDate),
            lte(maintenanceRequests.requestDate, endDate)
          )
        );
      }
      
      let avgCompletionTimeQuery = db.select({
        avgTime: sql`avg(EXTRACT(EPOCH FROM (completion_date - request_date)) / 3600)`
      })
      .from(maintenanceRequests)
      .where(and(...avgTimeFilters));
      
      const avgCompletionTimeResult = await avgCompletionTimeQuery;
      const avgCompletionTime = Number(avgCompletionTimeResult[0]?.avgTime || 0).toFixed(2);
      
      return {
        totalRequests: Number(totalRequests[0]?.count || 0),
        statusCounts,
        priorityCounts,
        departmentStats,
        typeStats,
        monthlyStats,
        avgCompletionTime
      };
    } catch (error) {
      console.error("Bakım istatistiklerini hesaplarken hata:", error);
      // Hata durumunda boş veri şablonu döndür
      return {
        totalRequests: 0,
        statusCounts: [
          { status: "pending", count: 0 },
          { status: "in-progress", count: 0 },
          { status: "completed", count: 0 },
          { status: "rejected", count: 0 }
        ],
        priorityCounts: [
          { priority: "low", count: 0 },
          { priority: "normal", count: 0 },
          { priority: "high", count: 0 },
          { priority: "critical", count: 0 }
        ],
        departmentStats: [],
        typeStats: [],
        monthlyStats: [],
        avgCompletionTime: "0"
      };
    }
  }
  
  // Refakat Kartları (Production Cards) yöntemleri
  
  // Refakat Kartları (Production Cards) yöntemleri
  async getProductionCards(filters?: any): Promise<ProductionCard[]> {
    let query = db.select().from(productionCards);
    
    if (filters) {
      if (filters.orderId) {
        query = query.where(eq(productionCards.orderId, filters.orderId));
      }
      if (filters.status) {
        query = query.where(eq(productionCards.status, filters.status));
      }
      if (filters.currentDepartmentId) {
        query = query.where(eq(productionCards.currentDepartmentId, filters.currentDepartmentId));
      }
    }
    
    return await query.orderBy(sql`${productionCards.createdAt} DESC`);
  }
  
  async getProductionCardById(id: number): Promise<ProductionCard | undefined> {
    const [card] = await db.select().from(productionCards).where(eq(productionCards.id, id));
    return card;
  }
  
  async getProductionCardByBarcode(barcodeData: string): Promise<ProductionCard | undefined> {
    const [card] = await db.select()
      .from(productionCards)
      .where(eq(productionCards.barcodeData, barcodeData));
    return card;
  }
  
  async createProductionCard(card: InsertProductionCard): Promise<ProductionCard> {
    // Kart için QR kod ve barkod bilgilerini oluştur
    const qrData = JSON.stringify({
      cardNumber: card.cardNumber,
      batchNumber: card.batchNumber,
      orderId: card.orderId
    });
    
    const [newCard] = await db.insert(productionCards)
      .values({
        ...card,
        qrCodeData: card.qrCodeData || qrData,
        barcodeData: card.barcodeData || card.cardNumber,
        printCount: 0
      })
      .returning();
    
    return newCard;
  }
  
  async updateProductionCardStatus(id: number, updateData: any): Promise<ProductionCard | undefined> {
    const [updatedCard] = await db.update(productionCards)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(productionCards.id, id))
      .returning();
    
    return updatedCard;
  }
  
  async incrementProductionCardPrintCount(id: number): Promise<ProductionCard | undefined> {
    const card = await this.getProductionCardById(id);
    if (!card) return undefined;
    
    const [updatedCard] = await db.update(productionCards)
      .set({
        printCount: card.printCount + 1,
        lastPrintDate: new Date()
      })
      .where(eq(productionCards.id, id))
      .returning();
    
    return updatedCard;
  }
  
  // İzleme Olayları (Tracking Events) yöntemleri
  async getTrackingEventsByCardId(cardId: number): Promise<TrackingEvent[]> {
    return await db.select()
      .from(trackingEvents)
      .where(eq(trackingEvents.cardId, cardId))
      .orderBy(sql`${trackingEvents.timestamp} DESC`);
  }
  
  async createTrackingEvent(event: InsertTrackingEvent): Promise<TrackingEvent> {
    const [newEvent] = await db.insert(trackingEvents)
      .values(event)
      .returning();
    
    return newEvent;
  }
  
  // Bakım Planları (Maintenance Plans) yöntemleri
  async getMaintenancePlans({ departmentId, status }: { departmentId?: number | null, status?: string } = {}): Promise<MaintenancePlan[]> {
    try {
      let query = db.select({
        id: maintenancePlans.id,
        name: maintenancePlans.name,
        description: maintenancePlans.description,
        departmentId: maintenancePlans.departmentId,
        createdById: maintenancePlans.createdById,
        assignedToId: maintenancePlans.assignedToId,
        startDate: maintenancePlans.startDate,
        endDate: maintenancePlans.endDate,
        frequency: maintenancePlans.frequency,
        status: maintenancePlans.status,
        createdAt: maintenancePlans.createdAt,
        updatedAt: maintenancePlans.updatedAt
      })
      .from(maintenancePlans)
      .orderBy(sql`${maintenancePlans.createdAt} DESC`);
      
      // Departman filtresi uygula
      if (departmentId) {
        query = query.where(eq(maintenancePlans.departmentId, departmentId));
      }
      
      // Durum filtresi uygula
      if (status) {
        query = query.where(eq(maintenancePlans.status, status));
      }
      
      return await query;
    } catch (error) {
      console.error("Bakım planları alınırken hata:", error);
      return [];
    }
  }
  
  async getMaintenancePlanById(id: number): Promise<MaintenancePlan | undefined> {
    try {
      const [plan] = await db.select()
        .from(maintenancePlans)
        .where(eq(maintenancePlans.id, id));
      
      return plan;
    } catch (error) {
      console.error(`Bakım planı (ID: ${id}) alınırken hata:`, error);
      return undefined;
    }
  }
  
  async createMaintenancePlan(plan: InsertMaintenancePlan): Promise<MaintenancePlan> {
    try {
      const [newPlan] = await db.insert(maintenancePlans)
        .values(plan)
        .returning();
      
      return newPlan;
    } catch (error) {
      console.error("Bakım planı oluşturulurken hata:", error);
      throw new Error("Bakım planı oluşturulamadı: " + (error as Error).message);
    }
  }
  
  async updateMaintenancePlan(id: number, plan: Partial<MaintenancePlan>): Promise<MaintenancePlan | undefined> {
    try {
      const [updatedPlan] = await db.update(maintenancePlans)
        .set({
          ...plan,
          updatedAt: new Date()
        })
        .where(eq(maintenancePlans.id, id))
        .returning();
      
      return updatedPlan;
    } catch (error) {
      console.error(`Bakım planı (ID: ${id}) güncellenirken hata:`, error);
      return undefined;
    }
  }
  
  async deleteMaintenancePlan(id: number): Promise<boolean> {
    try {
      // Önce plan öğelerini sil
      await db.delete(maintenancePlanItems)
        .where(eq(maintenancePlanItems.planId, id));
      
      // Sonra planı sil
      const result = await db.delete(maintenancePlans)
        .where(eq(maintenancePlans.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error(`Bakım planı (ID: ${id}) silinirken hata:`, error);
      return false;
    }
  }
  
  // Bakım Plan Öğeleri (Maintenance Plan Items) yöntemleri
  async getMaintenancePlanItems({ planId }: { planId: number }): Promise<MaintenancePlanItem[]> {
    try {
      return await db.select()
        .from(maintenancePlanItems)
        .where(eq(maintenancePlanItems.planId, planId))
        .orderBy(asc(maintenancePlanItems.id));
    } catch (error) {
      console.error(`Plan öğeleri (Plan ID: ${planId}) alınırken hata:`, error);
      return [];
    }
  }
  
  async getMaintenancePlanItemById(id: number): Promise<MaintenancePlanItem | undefined> {
    try {
      const [item] = await db.select()
        .from(maintenancePlanItems)
        .where(eq(maintenancePlanItems.id, id));
      return item;
    } catch (error) {
      console.error(`Bakım planı öğesi (ID: ${id}) alınırken hata:`, error);
      return undefined;
    }
  }
  
  async updateMaintenancePlanItem(id: number, item: Partial<MaintenancePlanItem>): Promise<MaintenancePlanItem | undefined> {
    try {
      const [updatedItem] = await db.update(maintenancePlanItems)
        .set(item)
        .where(eq(maintenancePlanItems.id, id))
        .returning();
      return updatedItem;
    } catch (error) {
      console.error(`Bakım planı öğesi (ID: ${id}) güncellenirken hata:`, error);
      return undefined;
    }
  }
  
  async createMaintenancePlanItem(item: InsertMaintenancePlanItem): Promise<MaintenancePlanItem> {
    try {
      const [newItem] = await db.insert(maintenancePlanItems)
        .values(item)
        .returning();
      
      return newItem;
    } catch (error) {
      console.error("Plan öğesi oluşturulurken hata:", error);
      throw new Error("Plan öğesi oluşturulamadı: " + (error as Error).message);
    }
  }
  
  async getTrackingSummary(): Promise<any> {
    // İstatistik bilgilerini veritabanından çek
    const totalCards = await db.select({ count: sql`count(*)` }).from(productionCards);
    const inProcessCards = await db.select({ count: sql`count(*)` })
      .from(productionCards)
      .where(eq(productionCards.status, "in-progress"));
    const completedCards = await db.select({ count: sql`count(*)` })
      .from(productionCards)
      .where(eq(productionCards.status, "completed"));
    
    // Departman bazlı istatistikler
    const departmentStats = await db.select({
        departmentId: productionCards.currentDepartmentId,
        departmentName: departments.name,
        count: sql`count(*)`
      })
      .from(productionCards)
      .leftJoin(departments, eq(productionCards.currentDepartmentId, departments.id))
      .where(eq(productionCards.status, "in-progress"))
      .groupBy(productionCards.currentDepartmentId, departments.name);
    
    // Son olaylar
    const recentEvents = await db.select({
        id: trackingEvents.id,
        cardId: trackingEvents.cardId,
        eventType: trackingEvents.eventType,
        departmentId: trackingEvents.departmentId,
        departmentName: departments.name,
        timestamp: trackingEvents.timestamp,
        status: trackingEvents.status
      })
      .from(trackingEvents)
      .leftJoin(departments, eq(trackingEvents.departmentId, departments.id))
      .orderBy(sql`${trackingEvents.timestamp} DESC`)
      .limit(10);
    
    return {
      totalCards: Number(totalCards[0]?.count || 0),
      inProcessCards: Number(inProcessCards[0]?.count || 0),
      completedCards: Number(completedCards[0]?.count || 0),
      departmentStats,
      recentEvents
    };
  }

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true, // Automatically create the session table
    });
  }

  // Password helpers
  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }

  async comparePasswords(supplied: string, stored: string): Promise<boolean> {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        isActive: insertUser.isActive ?? true,
        departmentId: insertUser.departmentId ?? null
      })
      .returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) return undefined;
    
    // Aktivite kaydı - burada bir activities tablosu varsa eklenebilir
    return updatedUser;
  }
  
  async updateUserStatus(id: number, isActive: boolean): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ isActive })
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) return undefined;
    
    // Aktivite kaydı - burada bir activities tablosu varsa eklenebilir
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    // Admin kullanıcısını korumak için
    if (id === 1) return false;
    
    try {
      // Önce kullanıcının rollerini sil (user_roles tablosundan)
      await db
        .delete(userRoles)
        .where(eq(userRoles.userId, id));
      
      // Sonra kullanıcıyı sil
      const result = await db
        .delete(users)
        .where(eq(users.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  // Role management
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db
      .insert(roles)
      .values(insertRole)
      .returning();
    return role;
  }
  
  async deleteRole(id: number): Promise<boolean> {
    // Admin rolünü korumak için
    if (id === 1) return false;
    
    try {
      // Önce rol-izin ilişkilerini temizle
      await this.clearRolePermissions(id);
      
      // Sonra kullanıcı-rol ilişkilerini temizle
      await db
        .delete(userRoles)
        .where(eq(userRoles.roleId, id));
      
      // En son rolü sil
      const result = await db
        .delete(roles)
        .where(eq(roles.id, id));
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting role:", error);
      return false;
    }
  }
  
  async getRolePermissions(roleId: number): Promise<any[]> {
    try {
      const permissionList = await db
        .select({
          id: permissions.id,
          code: permissions.code,
          description: permissions.description
        })
        .from(permissions)
        .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
        .where(eq(rolePermissions.roleId, roleId));
      
      return permissionList;
    } catch (error) {
      console.error(`Error getting permissions for role ${roleId}:`, error);
      return [];
    }
  }
  
  async clearRolePermissions(roleId: number): Promise<void> {
    try {
      await db
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));
    } catch (error) {
      console.error(`Error clearing permissions for role ${roleId}:`, error);
      throw error;
    }
  }

  async getUserRoles(userId: number): Promise<Role[]> {
    try {
      const userRolesWithDetails = await db
        .select({
          id: roles.id,
          name: roles.name,
          description: roles.description
        })
        .from(roles)
        .innerJoin(userRoles, eq(roles.id, userRoles.roleId))
        .where(eq(userRoles.userId, userId));

      console.log(`Retrieved ${userRolesWithDetails.length} roles for userId: ${userId}`);
      return userRolesWithDetails;
    } catch (error) {
      console.error(`Error getting roles for user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Belirli bir role sahip kullanıcıları getirir
   * @param roleIdentifier Rol ID'si veya rol adı
   * @returns Role sahip kullanıcılar listesi
   */
  async getUsersByRole(roleIdentifier: number | string): Promise<User[]> {
    try {
      let query = db
        .select({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          email: users.email,
          isActive: users.isActive,
          departmentId: users.departmentId
        })
        .from(users)
        .innerJoin(userRoles, eq(users.id, userRoles.userId))
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(users.isActive, true));
      
      // Rol kimliği tipine göre filtreleme
      if (typeof roleIdentifier === 'number') {
        query = query.where(eq(roles.id, roleIdentifier));
      } else {
        query = query.where(eq(roles.name, roleIdentifier));
      }
      
      const usersWithRole = await query;
      return usersWithRole;
    } catch (error) {
      console.error(`Error getting users with role ${roleIdentifier}:`, error);
      return [];
    }
  }
  
  async getUsersByDepartmentAndRole(departmentId: number, roleName: string): Promise<User[]> {
    try {
      const usersWithRoleAndDept = await db
        .select({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          email: users.email,
          isActive: users.isActive,
          departmentId: users.departmentId
        })
        .from(users)
        .innerJoin(userRoles, eq(users.id, userRoles.userId))
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(users.departmentId, departmentId))
        .where(eq(roles.name, roleName))
        .where(eq(users.isActive, true));
        
      return usersWithRoleAndDept;
    } catch (error) {
      console.error(`Error getting users with department ${departmentId} and role ${roleName}:`, error);
      return [];
    }
  }

  async assignRoleToUser(userId: number, roleId: number): Promise<void> {
    await db
      .insert(userRoles)
      .values({ userId, roleId })
      .onConflictDoNothing();
  }

  // Department management
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async getDepartmentByCode(code: string): Promise<Department | undefined> {
    const [department] = await db
      .select()
      .from(departments)
      .where(eq(departments.code, code));
    return department;
  }
  
  async getDepartmentById(id: number): Promise<Department | undefined> {
    const [department] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id));
    return department;
  }

  async getUsersByDepartmentId(departmentId: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.departmentId, departmentId))
      .where(eq(users.isActive, true));
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const [department] = await db
      .insert(departments)
      .values(insertDepartment)
      .returning();
    return department;
  }

  async assignUserToDepartment(userId: number, departmentId: number): Promise<void> {
    await db
      .update(users)
      .set({ departmentId })
      .where(eq(users.id, userId));
  }

  // Permission management
  async getPermissions(): Promise<any[]> {
    return await db.select().from(permissions);
  }

  async createPermission(permission: { code: string, description: string }): Promise<any> {
    const [newPermission] = await db
      .insert(permissions)
      .values(permission)
      .returning();
    return newPermission;
  }

  async getUserPermissions(userId: number): Promise<any[]> {
    try {
      // Debugging log
      console.log(`Getting permissions for userId: ${userId}`);
      
      const result = await db
        .select({
          code: permissions.code,
          description: permissions.description
        })
        .from(permissions)
        .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
        .innerJoin(userRoles, eq(rolePermissions.roleId, userRoles.roleId))
        .where(eq(userRoles.userId, userId));

      // Debugging log
      console.log(`Found ${result.length} permissions for userId: ${userId}`);
      
      return result;
    } catch (error) {
      console.error('Error in getUserPermissions:', error);
      throw error;
    }
  }

  async assignPermissionToRole(roleId: number, permissionId: number): Promise<void> {
    await db
      .insert(rolePermissions)
      .values({ roleId, permissionId })
      .onConflictDoNothing();
  }

  async hasPermission(userId: number, permissionCode: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.some(p => p.code === permissionCode);
  }

  // Fabric types
  async getFabricTypes(): Promise<FabricType[]> {
    try {
      const result = await db.select().from(fabricTypes);
      return result;
    } catch (error) {
      console.error("Kumaş tipleri alınırken hata:", error);
      throw new Error("Kumaş tipleri alınamadı: " + (error as Error).message);
    }
  }
  
  async getFabricType(id: number): Promise<FabricType | undefined> {
    try {
      const [fabric] = await db.select().from(fabricTypes).where(eq(fabricTypes.id, id));
      return fabric;
    } catch (error) {
      console.error(`Kumaş tipi ID:${id} alınırken hata:`, error);
      throw new Error("Kumaş tipi alınamadı: " + (error as Error).message);
    }
  }
  
  async createFabricType(insertFabricType: InsertFabricType & { properties?: Record<string, any> }): Promise<FabricType> {
    try {
      // Properties alanını uygun formata çevirelim
      const dataToInsert = { ...insertFabricType };
      
      // Eğer properties içerisinde fabPropertiesSchema değerleri varsa JSON olarak properties alanına ekleyelim
      if (dataToInsert.properties) {
        // properties zaten var, değiştirmemize gerek yok
      } else {
        // Properties alanı yoksa boş bir nesne ekleyelim
        dataToInsert.properties = {};
      }
      
      const [fabric] = await db
        .insert(fabricTypes)
        .values(dataToInsert)
        .returning();
      return fabric;
    } catch (error) {
      console.error("Kumaş tipi oluşturulurken hata:", error);
      throw new Error("Kumaş tipi oluşturulamadı: " + (error as Error).message);
    }
  }
  
  async updateFabricType(id: number, data: Partial<InsertFabricType> & { properties?: Record<string, any> }): Promise<FabricType | undefined> {
    try {
      // Önce mevcut fabric'i alalım
      const [existingFabric] = await db
        .select()
        .from(fabricTypes)
        .where(eq(fabricTypes.id, id));
      
      if (!existingFabric) {
        throw new Error(`ID:${id} olan kumaş tipi bulunamadı`);
      }
      
      // Verileri güncelleyelim
      const dataToUpdate = { ...data };
      
      // Properties alanını özel olarak ele alalım
      if (dataToUpdate.properties) {
        // Eğer mevcut properties varsa, onunla birleştirelim
        if (existingFabric.properties) {
          dataToUpdate.properties = {
            ...existingFabric.properties,
            ...dataToUpdate.properties
          };
        }
      }
      
      const [updatedFabric] = await db
        .update(fabricTypes)
        .set(dataToUpdate)
        .where(eq(fabricTypes.id, id))
        .returning();
      return updatedFabric;
    } catch (error) {
      console.error(`Kumaş tipi ID:${id} güncellenirken hata:`, error);
      throw new Error("Kumaş tipi güncellenemedi: " + (error as Error).message);
    }
  }
  
  // KARTELA SİSTEMİ FONKSİYONLARI
  
  // Kumaş Kartela İşlemleri
  async getFabricSwatches(): Promise<FabricSwatch[]> {
    try {
      const { fabricSwatches } = await import("@shared/schema");
      const results = await db
        .select()
        .from(fabricSwatches)
        .orderBy(desc(fabricSwatches.createdAt));
      return results;
    } catch (error) {
      console.error("Kumaş kartelaları alınırken hata:", error);
      return [];
    }
  }

  async getFabricSwatchById(id: number): Promise<FabricSwatch | undefined> {
    try {
      const { fabricSwatches } = await import("@shared/schema");
      const [result] = await db
        .select()
        .from(fabricSwatches)
        .where(eq(fabricSwatches.id, id));
      return result;
    } catch (error) {
      console.error(`Kumaş kartelası (ID: ${id}) alınırken hata:`, error);
      return undefined;
    }
  }

  async getFabricSwatchByBarcodeNumber(barcodeNumber: string): Promise<FabricSwatch | undefined> {
    try {
      const { fabricSwatches } = await import("@shared/schema");
      const [result] = await db
        .select()
        .from(fabricSwatches)
        .where(eq(fabricSwatches.barcodeNumber, barcodeNumber));
      return result;
    } catch (error) {
      console.error(`Kumaş kartelası (Barkod: ${barcodeNumber}) alınırken hata:`, error);
      return undefined;
    }
  }

  async createFabricSwatch(data: InsertFabricSwatch): Promise<FabricSwatch> {
    try {
      const { fabricSwatches } = await import("@shared/schema");
      const timestamp = new Date();
      
      // Barkod numarası oluştur
      if (!data.barcodeNumber) {
        data.barcodeNumber = `FS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }
      
      // Kullanılabilir renkleri JSON olarak işle
      const availableColors = Array.isArray(data.availableColors) 
        ? data.availableColors
        : (data.availableColors ? JSON.parse(data.availableColors as unknown as string) : []);
        
      // Terbiye seçeneklerini JSON olarak işle  
      const finishingOptions = Array.isArray(data.finishingOptions)
        ? data.finishingOptions
        : (data.finishingOptions ? JSON.parse(data.finishingOptions as unknown as string) : []);
        
      // Kullanım alanlarını JSON olarak işle
      const usageAreas = Array.isArray(data.usageAreas)
        ? data.usageAreas
        : (data.usageAreas ? JSON.parse(data.usageAreas as unknown as string) : []);
      
      const [result] = await db
        .insert(fabricSwatches)
        .values({
          ...data,
          availableColors: availableColors as any,
          finishingOptions: finishingOptions as any,
          usageAreas: usageAreas as any,
          createdAt: timestamp,
          updatedAt: timestamp
        })
        .returning();
        
      return result;
    } catch (error) {
      console.error("Kumaş kartelası oluşturulurken hata:", error);
      throw new Error(`Kumaş kartelası oluşturulamadı: ${(error as Error).message}`);
    }
  }

  async updateFabricSwatch(id: number, data: Partial<FabricSwatch>): Promise<FabricSwatch> {
    try {
      const { fabricSwatches } = await import("@shared/schema");
      
      // Kullanılabilir renkleri JSON olarak işle
      if (data.availableColors && !Array.isArray(data.availableColors)) {
        data.availableColors = JSON.parse(data.availableColors as unknown as string);
      }
      
      // Terbiye seçeneklerini JSON olarak işle
      if (data.finishingOptions && !Array.isArray(data.finishingOptions)) {
        data.finishingOptions = JSON.parse(data.finishingOptions as unknown as string);
      }
      
      // Kullanım alanlarını JSON olarak işle
      if (data.usageAreas && !Array.isArray(data.usageAreas)) {
        data.usageAreas = JSON.parse(data.usageAreas as unknown as string);
      }
      
      const [result] = await db
        .update(fabricSwatches)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(fabricSwatches.id, id))
        .returning();
        
      return result;
    } catch (error) {
      console.error(`Kumaş kartelası (ID: ${id}) güncellenirken hata:`, error);
      throw new Error(`Kumaş kartelası güncellenemedi: ${(error as Error).message}`);
    }
  }

  async deleteFabricSwatch(id: number): Promise<FabricSwatch> {
    try {
      const { fabricSwatches, fabricColorRelations } = await import("@shared/schema");
      
      // İlişkili kayıtları sil
      await db
        .delete(fabricColorRelations)
        .where(eq(fabricColorRelations.fabricSwatchId, id));
        
      // Kumaş kartelasını sil
      const [result] = await db
        .delete(fabricSwatches)
        .where(eq(fabricSwatches.id, id))
        .returning();
        
      return result;
    } catch (error) {
      console.error(`Kumaş kartelası (ID: ${id}) silinirken hata:`, error);
      throw new Error(`Kumaş kartelası silinemedi: ${(error as Error).message}`);
    }
  }

  // Renk Kartela İşlemleri
  async getColorSwatches(): Promise<ColorSwatch[]> {
    try {
      const { colorSwatches } = await import("@shared/schema");
      const results = await db
        .select()
        .from(colorSwatches)
        .orderBy(desc(colorSwatches.createdAt));
      return results;
    } catch (error) {
      console.error("Renk kartelaları alınırken hata:", error);
      return [];
    }
  }

  async getColorSwatchById(id: number): Promise<ColorSwatch | undefined> {
    try {
      const { colorSwatches } = await import("@shared/schema");
      const [result] = await db
        .select()
        .from(colorSwatches)
        .where(eq(colorSwatches.id, id));
      return result;
    } catch (error) {
      console.error(`Renk kartelası (ID: ${id}) alınırken hata:`, error);
      return undefined;
    }
  }

  async getColorSwatchByBarcodeNumber(barcodeNumber: string): Promise<ColorSwatch | undefined> {
    try {
      const { colorSwatches } = await import("@shared/schema");
      const [result] = await db
        .select()
        .from(colorSwatches)
        .where(eq(colorSwatches.barcodeNumber, barcodeNumber));
      return result;
    } catch (error) {
      console.error(`Renk kartelası (Barkod: ${barcodeNumber}) alınırken hata:`, error);
      return undefined;
    }
  }

  async createColorSwatch(data: InsertColorSwatch): Promise<ColorSwatch> {
    try {
      const { colorSwatches } = await import("@shared/schema");
      const timestamp = new Date();
      
      // Barkod numarası oluştur
      if (!data.barcodeNumber) {
        data.barcodeNumber = `CS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }
      
      // Mevcut kumaşları JSON olarak işle
      const availableFabrics = Array.isArray(data.availableFabrics) 
        ? data.availableFabrics
        : (data.availableFabrics ? JSON.parse(data.availableFabrics as unknown as string) : []);
      
      // Uyumlu renkleri JSON olarak işle
      const colorCompatibility = Array.isArray(data.colorCompatibility)
        ? data.colorCompatibility
        : (data.colorCompatibility ? JSON.parse(data.colorCompatibility as unknown as string) : []);
      
      const [result] = await db
        .insert(colorSwatches)
        .values({
          ...data,
          availableFabrics: availableFabrics as any,
          colorCompatibility: colorCompatibility as any,
          createdAt: timestamp,
          updatedAt: timestamp
        })
        .returning();
        
      return result;
    } catch (error) {
      console.error("Renk kartelası oluşturulurken hata:", error);
      throw new Error(`Renk kartelası oluşturulamadı: ${(error as Error).message}`);
    }
  }

  async updateColorSwatch(id: number, data: Partial<ColorSwatch>): Promise<ColorSwatch> {
    try {
      const { colorSwatches } = await import("@shared/schema");
      
      // Mevcut kumaşları JSON olarak işle
      if (data.availableFabrics && !Array.isArray(data.availableFabrics)) {
        data.availableFabrics = JSON.parse(data.availableFabrics as unknown as string);
      }
      
      // Uyumlu renkleri JSON olarak işle
      if (data.colorCompatibility && !Array.isArray(data.colorCompatibility)) {
        data.colorCompatibility = JSON.parse(data.colorCompatibility as unknown as string);
      }
      
      const [result] = await db
        .update(colorSwatches)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(colorSwatches.id, id))
        .returning();
        
      return result;
    } catch (error) {
      console.error(`Renk kartelası (ID: ${id}) güncellenirken hata:`, error);
      throw new Error(`Renk kartelası güncellenemedi: ${(error as Error).message}`);
    }
  }

  async deleteColorSwatch(id: number): Promise<ColorSwatch> {
    try {
      const { colorSwatches, fabricColorRelations } = await import("@shared/schema");
      
      // İlişkili kayıtları sil
      await db
        .delete(fabricColorRelations)
        .where(eq(fabricColorRelations.colorSwatchId, id));
      
      // Renk kartelasını sil
      const [result] = await db
        .delete(colorSwatches)
        .where(eq(colorSwatches.id, id))
        .returning();
        
      return result;
    } catch (error) {
      console.error(`Renk kartelası (ID: ${id}) silinirken hata:`, error);
      throw new Error(`Renk kartelası silinemedi: ${(error as Error).message}`);
    }
  }

  // Koleksiyon İşlemleri
  async getCollections(): Promise<Collection[]> {
    try {
      const { collections } = await import("@shared/schema");
      const results = await db
        .select()
        .from(collections)
        .orderBy(desc(collections.createdAt));
      return results;
    } catch (error) {
      console.error("Koleksiyonlar alınırken hata:", error);
      return [];
    }
  }

  async createCollection(data: InsertCollection): Promise<Collection> {
    try {
      const { collections } = await import("@shared/schema");
      const timestamp = new Date();
      
      const [result] = await db
        .insert(collections)
        .values({
          ...data,
          createdAt: timestamp,
          updatedAt: timestamp
        })
        .returning();
        
      return result;
    } catch (error) {
      console.error("Koleksiyon oluşturulurken hata:", error);
      throw new Error(`Koleksiyon oluşturulamadı: ${(error as Error).message}`);
    }
  }

  // Renk Kategorileri İşlemleri
  async getColorCategories(): Promise<ColorCategory[]> {
    try {
      const { colorCategories } = await import("@shared/schema");
      const results = await db
        .select()
        .from(colorCategories)
        .orderBy(asc(colorCategories.name));
      return results;
    } catch (error) {
      console.error("Renk kategorileri alınırken hata:", error);
      return [];
    }
  }

  async createColorCategory(data: InsertColorCategory): Promise<ColorCategory> {
    try {
      const { colorCategories } = await import("@shared/schema");
      const timestamp = new Date();
      
      const [result] = await db
        .insert(colorCategories)
        .values({
          ...data,
          createdAt: timestamp,
          updatedAt: timestamp
        })
        .returning();
        
      return result;
    } catch (error) {
      console.error("Renk kategorisi oluşturulurken hata:", error);
      throw new Error(`Renk kategorisi oluşturulamadı: ${(error as Error).message}`);
    }
  }

  // Renk Aileleri İşlemleri
  async getColorFamilies(): Promise<ColorFamily[]> {
    try {
      const { colorFamilies } = await import("@shared/schema");
      const results = await db
        .select()
        .from(colorFamilies)
        .orderBy(asc(colorFamilies.name));
      return results;
    } catch (error) {
      console.error("Renk aileleri alınırken hata:", error);
      return [];
    }
  }

  async createColorFamily(data: InsertColorFamily): Promise<ColorFamily> {
    try {
      const { colorFamilies } = await import("@shared/schema");
      const timestamp = new Date();
      
      const [result] = await db
        .insert(colorFamilies)
        .values({
          ...data,
          createdAt: timestamp,
          updatedAt: timestamp
        })
        .returning();
        
      return result;
    } catch (error) {
      console.error("Renk ailesi oluşturulurken hata:", error);
      throw new Error(`Renk ailesi oluşturulamadı: ${(error as Error).message}`);
    }
  }

  // Kumaş-Renk İlişki İşlemleri
  async getFabricColorRelations(fabricSwatchId: number): Promise<FabricColorRelation[]> {
    try {
      const { fabricColorRelations } = await import("@shared/schema");
      const results = await db
        .select()
        .from(fabricColorRelations)
        .where(eq(fabricColorRelations.fabricSwatchId, fabricSwatchId));
      return results;
    } catch (error) {
      console.error(`Kumaş-renk ilişkileri (FabricID: ${fabricSwatchId}) alınırken hata:`, error);
      return [];
    }
  }

  async createFabricColorRelation(data: InsertFabricColorRelation): Promise<FabricColorRelation> {
    try {
      const { fabricColorRelations } = await import("@shared/schema");
      const timestamp = new Date();
      
      const [result] = await db
        .insert(fabricColorRelations)
        .values({
          ...data,
          createdAt: timestamp,
          updatedAt: timestamp
        })
        .returning();
        
      return result;
    } catch (error) {
      console.error("Kumaş-renk ilişkisi oluşturulurken hata:", error);
      throw new Error(`Kumaş-renk ilişkisi oluşturulamadı: ${(error as Error).message}`);
    }
  }

  async updateFabricColorRelation(id: number, data: Partial<FabricColorRelation>): Promise<FabricColorRelation> {
    try {
      const { fabricColorRelations } = await import("@shared/schema");
      
      const [result] = await db
        .update(fabricColorRelations)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(fabricColorRelations.id, id))
        .returning();
        
      return result;
    } catch (error) {
      console.error(`Kumaş-renk ilişkisi (ID: ${id}) güncellenirken hata:`, error);
      throw new Error(`Kumaş-renk ilişkisi güncellenemedi: ${(error as Error).message}`);
    }
  }

  async deleteFabricColorRelation(id: number): Promise<FabricColorRelation> {
    try {
      const { fabricColorRelations } = await import("@shared/schema");
      
      const [result] = await db
        .delete(fabricColorRelations)
        .where(eq(fabricColorRelations.id, id))
        .returning();
        
      return result;
    } catch (error) {
      console.error(`Kumaş-renk ilişkisi (ID: ${id}) silinirken hata:`, error);
      throw new Error(`Kumaş-renk ilişkisi silinemedi: ${(error as Error).message}`);
    }
  }
  
  async deleteFabricType(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(fabricTypes)
        .where(eq(fabricTypes.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error(`Kumaş tipi ID:${id} silinirken hata:`, error);
      throw new Error("Kumaş tipi silinemedi: " + (error as Error).message);
    }
  }



  // Yarn types
  async getYarnTypes(): Promise<YarnType[]> {
    return await db.select().from(yarnTypes);
  }

  async createYarnType(insertYarnType: InsertYarnType): Promise<YarnType> {
    const [yarnType] = await db
      .insert(yarnTypes)
      .values(insertYarnType)
      .returning();
    return yarnType;
  }

  // Raw materials
  async getRawMaterials(): Promise<RawMaterial[]> {
    return await db.select().from(rawMaterials);
  }

  async createRawMaterial(insertRawMaterial: InsertRawMaterial): Promise<RawMaterial> {
    const [rawMaterial] = await db
      .insert(rawMaterials)
      .values(insertRawMaterial)
      .returning();
    return rawMaterial;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    try {
      // Tablodan sadece var olan sütunları seçiyoruz
      const result = await db.select().from(customers);
      
      // isActive ve assignedToUserId alanları olmadığından varsayılan olarak ekliyoruz
      const customersWithDefaults = result.map(customer => ({
        ...customer,
        isActive: true,
        assignedToUserId: null
      }));
      
      return customersWithDefaults;
    } catch (error) {
      console.error("Getting customers...");
      console.error("Error fetching customers:", error);
      return [];
    }
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values({
        ...insertCustomer,
        address: insertCustomer.address ?? null,
        email: insertCustomer.email ?? null,
        contactPerson: insertCustomer.contactPerson ?? null,
        phone: insertCustomer.phone ?? null,
        city: insertCustomer.city ?? null,
        taxNumber: insertCustomer.taxNumber ?? null,
        // paymentTerms removed since it doesn't exist in database 
        notes: insertCustomer.notes ?? null
      })
      .returning();
    return customer;
  }
  
  // Order status by code
  async getOrderStatusByCode(code: string): Promise<OrderStatus | undefined> {
    const [status] = await db
      .select()
      .from(orderStatuses)
      .where(eq(orderStatuses.code, code));
    return status;
  }

  // Order statuses
  async getOrderStatuses(): Promise<OrderStatus[]> {
    return await db.select().from(orderStatuses);
  }

  async createOrderStatus(insertOrderStatus: InsertOrderStatus): Promise<OrderStatus> {
    const [orderStatus] = await db
      .insert(orderStatuses)
      .values(insertOrderStatus)
      .returning();
    return orderStatus;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    try {
      // Join ile müşteri adlarını da çekelim
      const result = await db
        .select({
          ...orders,
          customerName: customers.name
        })
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id));
      
      // Diğer alanlar için UI'da kullanılan özellikleri ekleyelim
      const ordersWithDefaults = result.map(order => ({
        ...order,
        qualityStandard: null,
        width: null,
        weight: null,
        deliveryTerms: null,
        paymentTerms: null,
        documentNo: null,
        firmaPoNo: null,
        isUrgent: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      return ordersWithDefaults;
    } catch (error) {
      console.error("Siparişler alınırken hata:", error);
      return [];
    }
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    try {
      const [order] = await db
        .select({
          ...orders,
          customerName: customers.name
        })
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .where(eq(orders.id, id));
        
      if (!order) return undefined;
      
      // Eksik alanları ekleyelim
      const orderWithDefaults = {
        ...order,
        qualityStandard: null,
        width: null,
        weight: null,
        deliveryTerms: null,
        paymentTerms: null,
        documentNo: null,
        firmaPoNo: null,
        isUrgent: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return orderWithDefaults;
    } catch (error) {
      console.error(`Sipariş ID:${id} alınırken hata:`, error);
      return undefined;
    }
  }

  // Son siparişi getir (sipariş numarası oluşturmak için)
  async getLastOrder(): Promise<Order | undefined> {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.id))
        .limit(1);
      
      return order;
    } catch (error) {
      console.error("Son sipariş alınırken hata:", error);
      return undefined;
    }
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    try {
      // Eğer sipariş numarası verilmişse ve TEMP ile başlamıyorsa, doğrudan kullan
      let finalOrderNumber = insertOrder.orderNumber;
      let nextId = 1;  // Varsayılan değer olarak 1'i atayalım
      
      if (!finalOrderNumber || finalOrderNumber.startsWith('TEMP-')) {
        // Generate order number based on current date + id
        const date = new Date();
        const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        // Benzersiz bir sipariş numarası oluşturmak için son ID ile timestamp kombinasyonu kullanalım
        const timestamp = Date.now();
        const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        nextId = timestamp % 10000; // Son 4 hane
        finalOrderNumber = `ORD-${yearMonth}-${nextId.toString().padStart(4, '0')}-${randomPart}`;
      }
      
      // Doğrudan SQL sorgusu ile manuel olarak ekleyelim
      // ve unit_price için varsayılan 0 değerini kullanarak casting yapalım
      // PostgreSQL'in bekleyeceği formatta
      console.log("Veritabanına siparişimizi manuel SQL ile ekliyoruz.");
      
      const queryResult = await db.execute(sql`
        INSERT INTO orders (
          order_number, customer_id, fabric_type_id, quantity, unit, order_date, due_date, 
          status_id, notes, created_by, order_type, market_type, variant, feel, width, 
          weight, blend, group_name, color, pattern, parent_order_id
        ) 
        VALUES (
          ${finalOrderNumber}, 
          ${insertOrder.customerId}, 
          ${insertOrder.fabricTypeId}, 
          ${insertOrder.quantity}, 
          ${insertOrder.unit || 'metre'}, 
          ${insertOrder.orderDate}, 
          ${insertOrder.dueDate}, 
          ${insertOrder.statusId || 1}, 
          ${insertOrder.notes || null}, 
          ${insertOrder.createdBy}, 
          ${insertOrder.orderType || 'direct'}, 
          ${insertOrder.marketType || 'iç'}, 
          ${insertOrder.variant || null}, 
          ${insertOrder.feel || null}, 
          ${insertOrder.width || null}, 
          ${insertOrder.weight || null}, 
          ${insertOrder.blend || null}, 
          ${insertOrder.groupName || null}, 
          ${insertOrder.color || null}, 
          ${insertOrder.pattern || null},
          ${insertOrder.parentOrderId || null}
        ) 
        RETURNING *
      `);
      
      // Dönen sonuçları işle
      const order = queryResult[0];
      
      console.log("Sipariş başarıyla oluşturuldu:", order);
      
      // order olup olmadığını kontrol edelim ve döndürelim
      if (!order) {
        console.error("Sipariş oluşturuldu ama dönen sonuç boş!");
        return {
          id: nextId,
          orderNumber: finalOrderNumber,
          customerId: insertOrder.customerId,
          fabricTypeId: insertOrder.fabricTypeId,
          quantity: insertOrder.quantity,
          unit: insertOrder.unit || 'metre',
          unitPrice: insertOrder.unitPrice || '0',
          orderDate: insertOrder.orderDate,
          dueDate: insertOrder.dueDate,
          statusId: insertOrder.statusId || 1,
          notes: insertOrder.notes || '',
          createdBy: insertOrder.createdBy,
          orderType: insertOrder.orderType || 'direct',
          marketType: insertOrder.marketType || 'iç'
        };
      }
      
      // İlgili kullanıcıyı bulalım
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, order.createdBy));
        
      // Aktivite kaydı oluştur
      await this.recordActivity({
        type: "order_created",
        description: `${user?.username || "Kullanıcı"} tarafından ${finalOrderNumber} numaralı sipariş oluşturuldu`,
        userId: order.createdBy,
        userName: user?.fullName || "Sistem Kullanıcısı",
        entityId: order.id,
        entityType: "order",
      });
      
      // Planlama departmanına siparişi otomatik aktar
      try {
        // Planlama departmanını bul
        const planningDept = await this.getDepartmentByCode("PLANNING");
        if (planningDept) {
          // Planlama departmanındaki kullanıcıları bul
          const planningUsers = await this.getUsersByDepartmentId(planningDept.id);
          
          // Varsayılan değerlerle otomatik üretim planı oluştur
          if (planningUsers.length > 0) {
            // Departman yöneticisini veya ilk kullanıcıyı seç
            const assignedTo = planningUsers[0].id;
            
            // Tahmini başlangıç ve bitiş tarihleri
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 15); // Varsayılan 15 gün üretim süresi
            
            // Üretim planı oluştur
            const date = new Date();
            const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const planNo = `PP-${yearMonth}-${nextId.toString().padStart(4, '0')}`;
            await this.createProductionPlan({
              planNo,
              orderId: order.id,
              orderNumber: order.orderNumber,
              description: `${order.orderNumber} numaralı sipariş için üretim planı`,
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
              status: "created",
              priority: "normal",
              createdBy: order.createdBy,
              assignedTo,
              notes: "Siparişten otomatik oluşturulan üretim planı"
            });
            
            // Planlama departmanı için aktivite kaydı oluştur
            await this.recordActivity({
              type: "plan_created",
              description: `${finalOrderNumber} numaralı sipariş için otomatik üretim planı oluşturuldu`,
              userId: order.createdBy,
              userName: user?.fullName || "Sistem Kullanıcısı",
              entityId: order.id,
              entityType: "order",
            });
            
            console.log(`${finalOrderNumber} numaralı sipariş planlama departmanına aktarıldı ve üretim planı oluşturuldu`);
          } else {
            console.warn(`Planlama departmanında aktif kullanıcı bulunamadı. Üretim planı otomatik oluşturulamadı.`);
          }
        } else {
          console.warn(`Planlama departmanı bulunamadı. Üretim planı otomatik oluşturulamadı.`);
        }
      } catch (planError) {
        console.error("Üretim planı otomatik oluşturulurken hata:", planError);
        // Ana akışı etkilememesi için hatayı burada yakala ama throw etme
      }
      
      return order;
    } catch (error) {
      console.error("Sipariş oluşturulurken hata:", error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: number, statusId: number): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ statusId })
      .where(eq(orders.id, orderId))
      .returning();
    
    return updatedOrder;
  }

  async getOrderSummary(): Promise<{
    pending: number;
    production: number;
    shipping: number;
    completed: number;
    pendingValue: number;
    productionValue: number;
    shippingValue: number;
    completedValue: number;
  }> {
    // Get status IDs from the database
    const statuses = await this.getOrderStatuses();
    
    const pendingStatus = statuses.find(s => s.code === 'PENDING')?.id ?? 1;
    const productionStatus = statuses.find(s => s.code === 'PRODUCTION')?.id ?? 2;
    const shippingStatus = statuses.find(s => s.code === 'SHIPPING')?.id ?? 3;
    const completedStatus = statuses.find(s => s.code === 'COMPLETED')?.id ?? 4;
    
    // Get counts and sums for each status
    const [pendingResult] = await db
      .select({
        count: sql<number>`count(*)`,
        value: sql<number>`sum(cast(coalesce(${orders.unitPrice}, 0) as decimal) * cast(${orders.quantity} as decimal))`
      })
      .from(orders)
      .where(eq(orders.statusId, pendingStatus));
    
    const [productionResult] = await db
      .select({
        count: sql<number>`count(*)`,
        value: sql<number>`sum(cast(coalesce(${orders.unitPrice}, 0) as decimal) * cast(${orders.quantity} as decimal))`
      })
      .from(orders)
      .where(eq(orders.statusId, productionStatus));
    
    const [shippingResult] = await db
      .select({
        count: sql<number>`count(*)`,
        value: sql<number>`sum(cast(coalesce(${orders.unitPrice}, 0) as decimal) * cast(${orders.quantity} as decimal))`
      })
      .from(orders)
      .where(eq(orders.statusId, shippingStatus));
    
    const [completedResult] = await db
      .select({
        count: sql<number>`count(*)`,
        value: sql<number>`sum(cast(coalesce(${orders.unitPrice}, 0) as decimal) * cast(${orders.quantity} as decimal))`
      })
      .from(orders)
      .where(eq(orders.statusId, completedStatus));
    
    return {
      pending: pendingResult?.count ?? 0,
      production: productionResult?.count ?? 0,
      shipping: shippingResult?.count ?? 0,
      completed: completedResult?.count ?? 0,
      pendingValue: pendingResult?.value ?? 0,
      productionValue: productionResult?.value ?? 0,
      shippingValue: shippingResult?.value ?? 0,
      completedValue: completedResult?.value ?? 0
    };
  }

  // Activities
  private async recordActivity(activity: Omit<Activity, 'id' | 'timestamp'>): Promise<Activity> {
    // In a real implementation, this would insert into an activities table
    // For now, we'll just return a mock activity
    return {
      ...activity,
      id: Date.now(),
      timestamp: new Date()
    };
  }

  async getRecentActivities(): Promise<any[]> {
    // In a real implementation, this would query from an activities table
    // For now, we'll return an empty array
    return [];
  }
  
  // =========================================================
  // PLANLAMA BÖLÜMÜ FONKSİYONLARI
  // =========================================================
  
  // Process Types (Süreç Tipleri)
  async getProcessTypes(): Promise<ProcessType[]> {
    return await db.select().from(processTypes);
  }
  
  async createProcessType(insertProcessType: InsertProcessType): Promise<ProcessType> {
    const [processType] = await db
      .insert(processTypes)
      .values(insertProcessType)
      .returning();
    return processType;
  }
  
  // Machine Types (Makine Tipleri)
  async getMachineTypes(): Promise<MachineType[]> {
    return await db.select().from(machineTypes);
  }
  
  async createMachineType(insertMachineType: InsertMachineType): Promise<MachineType> {
    const [machineType] = await db
      .insert(machineTypes)
      .values(insertMachineType)
      .returning();
    return machineType;
  }
  
  // Machines (Makineler)
  async getMachines(): Promise<Machine[]> {
    return await db.select().from(machines);
  }
  
  async getMachinesByType(typeId: number): Promise<Machine[]> {
    return await db
      .select()
      .from(machines)
      .where(eq(machines.machineTypeId, typeId));
  }
  
  async createMachine(insertMachine: InsertMachine): Promise<Machine> {
    const [machine] = await db
      .insert(machines)
      .values(insertMachine)
      .returning();
    return machine;
  }
  
  // Production Plans (Üretim Planları)
  async getProductionPlans(): Promise<(ProductionPlan & { customerName?: string, fabricTypeName?: string })[]> {
    try {
      const { productionPlans, orders, customers, fabricTypes } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const result = await db.select({
        ...productionPlans,
        customerName: customers.name,
        fabricTypeName: fabricTypes.name
      })
      .from(productionPlans)
      .leftJoin(orders, eq(productionPlans.orderId, orders.id))
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(fabricTypes, eq(orders.fabricTypeId, fabricTypes.id));
      
      return result;
    } catch (error) {
      console.error("Üretim planları alınırken hata oluştu:", error);
      throw new Error("Üretim planları alınamadı: " + (error as Error).message);
    }
  }
  
  async getProductionPlanById(id: number): Promise<ProductionPlan | undefined> {
    try {
      const { productionPlans } = await import("@shared/schema");
      
      console.log(`Üretim planı getiriliyor, ID: ${id}`);
      
      const [plan] = await db
        .select()
        .from(productionPlans)
        .where(eq(productionPlans.id, id));
      
      console.log("Bulunan plan:", plan ? "Bulundu" : "Bulunamadı");
      
      return plan;
    } catch (error) {
      console.error("Üretim planı alınırken hata oluştu:", error);
      throw new Error("Üretim planı alınamadı: " + (error as Error).message);
    }
  }
  
  async createProductionPlan(insertPlan: InsertProductionPlan): Promise<ProductionPlan> {
    try {
      const { productionPlans, orders } = await import("@shared/schema");
      const { customers } = await import("@shared/schema");
      
      // oldStartDate ve oldEndDate'i string olarak bırakalım, artık text tipi
      if (!insertPlan.oldStartDate) {
        insertPlan.oldStartDate = new Date().toISOString().split('T')[0];
      } else if (insertPlan.oldStartDate instanceof Date) {
        // Date nesnesini string'e dönüştür
        insertPlan.oldStartDate = insertPlan.oldStartDate.toISOString().split('T')[0];
      }
      
      if (!insertPlan.oldEndDate) {
        insertPlan.oldEndDate = new Date().toISOString().split('T')[0];
      } else if (insertPlan.oldEndDate instanceof Date) {
        // Date nesnesini string'e dönüştür
        insertPlan.oldEndDate = insertPlan.oldEndDate.toISOString().split('T')[0];
      }
      
      console.log("Temizlenmiş planData:", {
        ...insertPlan,
        oldStartDate: insertPlan.oldStartDate,
        oldEndDate: insertPlan.oldEndDate
      });
      
      // Sipariş bilgilerini al
      let orderInfo = null;
      if (insertPlan.orderId) {
        const [orderData] = await db
          .select({
            ...orders,
            customerName: customers.name
          })
          .from(orders)
          .leftJoin(customers, eq(orders.customerId, customers.id))
          .where(eq(orders.id, insertPlan.orderId));
        
        if (orderData) {
          orderInfo = orderData;
          
          // Sipariş durumunu üretimde olarak güncelle
          const productionStatusId = 2; // Production statüsü ID
          await this.updateOrderStatus(orderData.id, productionStatusId);
        }
      }
      
      // Kesin çözüm: Sadece gerekli alanları tek tek tanımlıyoruz, problemi otomatik yayılmada engelliyoruz
      const [plan] = await db
        .insert(productionPlans)
        .values({
          planNo: insertPlan.planNo,
          orderId: insertPlan.orderId,
          orderNumber: insertPlan.orderNumber,
          description: insertPlan.description,
          productionStartDate: new Date(insertPlan.productionStartDate),
          productionEndDate: new Date(insertPlan.productionEndDate),
          oldStartDate: insertPlan.oldStartDate,  // Bu zaten string olacak
          oldEndDate: insertPlan.oldEndDate,      // Bu zaten string olacak
          status: insertPlan.status || "Beklemede",
          priority: insertPlan.priority || "Normal",
          createdBy: insertPlan.createdBy,
          assignedTo: insertPlan.assignedTo || null,
          notes: insertPlan.notes || "",
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      // Aktivite kaydı oluştur
      if (orderInfo) {
        await this.recordActivity({
          type: "production_plan_created",
          description: `${orderInfo.orderNumber} numaralı sipariş için üretim planı oluşturuldu`,
          userId: 1, // Varsayılan sistem kullanıcısı
          userName: "Sistem Yöneticisi",
          entityId: plan.id,
          entityType: "production_plan",
        });
      }
      
      return plan;
    } catch (error) {
      console.error("Üretim planı oluşturulurken hata oluştu:", error);
      throw new Error("Üretim planı oluşturulamadı: " + (error as Error).message);
    }
  }
  
  async updateProductionPlan(id: number, planData: Partial<ProductionPlan>): Promise<ProductionPlan | undefined> {
    try {
      const { productionPlans } = await import("@shared/schema");
      const [updatedPlan] = await db
        .update(productionPlans)
        .set({
          ...planData,
          updatedAt: new Date()
        })
        .where(eq(productionPlans.id, id))
        .returning();
      
      return updatedPlan;
    } catch (error) {
      console.error("Üretim planı güncellenirken hata oluştu:", error);
      throw new Error("Üretim planı güncellenemedi: " + (error as Error).message);
    }
  }
  
  // Production Steps (Üretim Adımları)
  async getProductionSteps(planId?: number): Promise<ProductionStep[]> {
    try {
      if (planId) {
        return await db
          .select()
          .from(productionSteps)
          .where(eq(productionSteps.productionPlanId, planId));
      }
      
      return await db.select().from(productionSteps);
    } catch (error) {
      console.error("Üretim adımları alınırken hata oluştu:", error);
      throw new Error("Üretim adımları alınamadı: " + (error as Error).message);
    }
  }
  
  async createProductionStep(insertStep: InsertProductionStep): Promise<ProductionStep> {
    try {
      const { productionSteps } = await import("@shared/schema");
      const [step] = await db
        .insert(productionSteps)
        .values({
          ...insertStep,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return step;
    } catch (error) {
      console.error("Üretim adımı oluşturulurken hata oluştu:", error);
      throw new Error("Üretim adımı oluşturulamadı: " + (error as Error).message);
    }
  }
  
  async updateProductionStep(id: number, stepData: Partial<ProductionStep>): Promise<ProductionStep | undefined> {
    try {
      const { productionSteps } = await import("@shared/schema");
      const [updatedStep] = await db
        .update(productionSteps)
        .set({
          ...stepData,
          updatedAt: new Date()
        })
        .where(eq(productionSteps.id, id))
        .returning();
      
      return updatedStep;
    } catch (error) {
      console.error("Üretim adımı güncellenirken hata oluştu:", error);
      throw new Error("Üretim adımı güncellenemedi: " + (error as Error).message);
    }
  }
  
  // Customer Interactions
  async getCustomerInteractions(): Promise<CustomerInteraction[]> {
    try {
      return await db.select().from(customerInteractions);
    } catch (error) {
      console.error("Müşteri etkileşimleri alınırken hata:", error);
      return [];
    }
  }
  
  async createCustomerInteraction(insertInteraction: InsertCustomerInteraction): Promise<CustomerInteraction> {
    try {
      const [interaction] = await db
        .insert(customerInteractions)
        .values({
          ...insertInteraction,
          details: insertInteraction.details ?? null,
          followUpRequired: insertInteraction.followUpRequired ?? false,
          followUpDate: insertInteraction.followUpDate ?? null,
          status: insertInteraction.status || "açık"
        })
        .returning();
      
      // İlgili kullanıcıyı bulalım
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, interaction.userId));
      
      // Müşteri bilgisini alalım
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, interaction.customerId));
      
      // Record activity
      await this.recordActivity({
        type: "customer_interaction_created",
        description: `Müşteri etkileşimi oluşturuldu: ${interaction.subject} (${customer?.name || 'Bilinmeyen Müşteri'})`,
        userId: interaction.userId,
        userName: user?.fullName || "Bilinmeyen Kullanıcı",
        entityId: interaction.id,
        entityType: "customer_interaction",
      });
      
      return interaction;
    } catch (error) {
      console.error("Müşteri etkileşimi oluşturulurken hata:", error);
      throw error;
    }
  }
  
  // Opportunities
  async getOpportunities(): Promise<Opportunity[]> {
    try {
      return await db.select().from(opportunities);
    } catch (error) {
      console.error("Fırsatlar alınırken hata:", error);
      return [];
    }
  }
  
  async createOpportunity(insertOpportunity: InsertOpportunity): Promise<Opportunity> {
    try {
      const [opportunity] = await db
        .insert(opportunities)
        .values({
          ...insertOpportunity,
          description: insertOpportunity.description ?? null,
          estimatedValue: insertOpportunity.estimatedValue ?? null,
          probability: insertOpportunity.probability ?? null,
          expectedCloseDate: insertOpportunity.expectedCloseDate ?? null,
          assignedToUserId: insertOpportunity.assignedToUserId ?? null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      // Müşteri bilgisini alalım
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, opportunity.customerId));
      
      // Atanan kullanıcı bilgisini alalım
      const [assignedUser] = opportunity.assignedToUserId 
        ? await db.select().from(users).where(eq(users.id, opportunity.assignedToUserId))
        : [null];
      
      // Record activity
      await this.recordActivity({
        type: "opportunity_created",
        description: `Yeni fırsat oluşturuldu: ${opportunity.title} (${customer?.name || 'Bilinmeyen Müşteri'})`,
        userId: opportunity.assignedToUserId || 1,
        userName: assignedUser?.fullName || "Sistem Kullanıcısı",
        entityId: opportunity.id,
        entityType: "opportunity",
      });
      
      return opportunity;
    } catch (error) {
      console.error("Fırsat oluşturulurken hata:", error);
      throw error;
    }
  }
  
  // Production Steps (Planlama Bölümü)
  async getProductionSteps(planId?: number): Promise<ProductionStep[]> {
    try {
      let query = db.select().from(productionSteps);
      
      if (planId) {
        query = query.where(eq(productionSteps.productionPlanId, planId));
      }
      
      return await query.orderBy(productionSteps.stepOrder);
    } catch (error) {
      console.error("Üretim adımları alınırken hata:", error);
      throw error;
    }
  }
  
  async createProductionStep(insertStep: InsertProductionStep): Promise<ProductionStep> {
    try {
      const [step] = await db
        .insert(productionSteps)
        .values({
          ...insertStep,
          actualStartDate: insertStep.actualStartDate || null,
          actualEndDate: insertStep.actualEndDate || null,
          machineId: insertStep.machineId || null,
          notes: insertStep.notes || null
        })
        .returning();
      
      return step;
    } catch (error) {
      console.error("Üretim adımı oluşturulurken hata:", error);
      throw error;
    }
  }
  
  async updateProductionStep(id: number, stepData: Partial<ProductionStep>): Promise<ProductionStep | undefined> {
    try {
      const [updatedStep] = await db
        .update(productionSteps)
        .set(stepData)
        .where(eq(productionSteps.id, id))
        .returning();
      
      if (!updatedStep) return undefined;
      
      // İlgili üretim planını güncelle
      if (updatedStep.productionPlanId) {
        await db
          .update(productionPlans)
          .set({ updatedAt: new Date() })
          .where(eq(productionPlans.id, updatedStep.productionPlanId));
      }
      
      return updatedStep;
    } catch (error) {
      console.error(`Üretim adımı güncellenirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  // Production Route Template methods (Planlama Bölümü - Rota Yönetimi)
  async getProductionRouteTemplates(): Promise<ProductionRouteTemplate[]> {
    try {
      return await db.select().from(productionRouteTemplates);
    } catch (error) {
      console.error("Üretim rota şablonları alınırken hata:", error);
      throw error;
    }
  }
  
  async getProductionRouteTemplateById(id: number): Promise<ProductionRouteTemplate | undefined> {
    try {
      const [template] = await db
        .select()
        .from(productionRouteTemplates)
        .where(eq(productionRouteTemplates.id, id));
      return template;
    } catch (error) {
      console.error(`Üretim rota şablonu getirilirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  async createProductionRouteTemplate(insertTemplate: InsertProductionRouteTemplate): Promise<ProductionRouteTemplate> {
    try {
      const now = new Date();
      const [template] = await db
        .insert(productionRouteTemplates)
        .values({
          ...insertTemplate,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      
      // Record activity
      await this.recordActivity({
        type: "route_template_created",
        description: `Üretim rotası şablonu oluşturuldu: ${template.name}`,
        userId: 1, // Default admin user
        userName: "Sistem Yöneticisi",
        entityId: template.id,
        entityType: "production_route_template",
      });
      
      return template;
    } catch (error) {
      console.error("Üretim rota şablonu oluşturulurken hata:", error);
      throw error;
    }
  }
  
  async updateProductionRouteTemplate(id: number, templateData: Partial<ProductionRouteTemplate>): Promise<ProductionRouteTemplate | undefined> {
    try {
      const [updatedTemplate] = await db
        .update(productionRouteTemplates)
        .set({
          ...templateData,
          updatedAt: new Date()
        })
        .where(eq(productionRouteTemplates.id, id))
        .returning();
      
      if (!updatedTemplate) return undefined;
      
      // Record activity
      await this.recordActivity({
        type: "route_template_updated",
        description: `Üretim rotası şablonu güncellendi: ${updatedTemplate.name}`,
        userId: 1, // Default admin user
        userName: "Sistem Yöneticisi",
        entityId: id,
        entityType: "production_route_template",
      });
      
      return updatedTemplate;
    } catch (error) {
      console.error(`Üretim rota şablonu güncellenirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  async deleteProductionRouteTemplate(id: number): Promise<boolean> {
    try {
      // Önce şablona ait adımları bul ve sil
      await db
        .delete(productionRouteTemplateSteps)
        .where(eq(productionRouteTemplateSteps.templateId, id));
      
      // Şablonu adı için tutalım
      const [template] = await db
        .select()
        .from(productionRouteTemplates)
        .where(eq(productionRouteTemplates.id, id));
      
      if (!template) return false;
      
      // Şablonu sil
      await db
        .delete(productionRouteTemplates)
        .where(eq(productionRouteTemplates.id, id));
      
      // Record activity
      await this.recordActivity({
        type: "route_template_deleted",
        description: `Üretim rotası şablonu silindi: ${template.name}`,
        userId: 1, // Default admin user
        userName: "Sistem Yöneticisi",
        entityId: id,
        entityType: "production_route_template",
      });
      
      return true;
    } catch (error) {
      console.error(`Üretim rota şablonu silinirken hata (id: ${id}):`, error);
      return false;
    }
  }
  
  // Production Route Template Step methods (Planlama Bölümü - Rota Adımları)
  async getProductionRouteTemplateSteps(templateId: number): Promise<ProductionRouteTemplateStep[]> {
    try {
      return await db
        .select()
        .from(productionRouteTemplateSteps)
        .where(eq(productionRouteTemplateSteps.templateId, templateId))
        .orderBy(productionRouteTemplateSteps.stepOrder);
    } catch (error) {
      console.error(`Üretim rota şablonu adımları alınırken hata (templateId: ${templateId}):`, error);
      throw error;
    }
  }
  
  async createProductionRouteTemplateStep(insertStep: InsertProductionRouteTemplateStep): Promise<ProductionRouteTemplateStep> {
    try {
      const [step] = await db
        .insert(productionRouteTemplateSteps)
        .values(insertStep)
        .returning();
      
      // İlgili şablonu al
      const [template] = await db
        .select()
        .from(productionRouteTemplates)
        .where(eq(productionRouteTemplates.id, step.templateId));
      
      if (template) {
        // Şablonu güncelle
        await db
          .update(productionRouteTemplates)
          .set({ updatedAt: new Date() })
          .where(eq(productionRouteTemplates.id, template.id));
      }
      
      return step;
    } catch (error) {
      console.error("Üretim rota şablonu adımı oluşturulurken hata:", error);
      throw error;
    }
  }
  
  async updateProductionRouteTemplateStep(id: number, stepData: Partial<ProductionRouteTemplateStep>): Promise<ProductionRouteTemplateStep | undefined> {
    try {
      const [updatedStep] = await db
        .update(productionRouteTemplateSteps)
        .set(stepData)
        .where(eq(productionRouteTemplateSteps.id, id))
        .returning();
      
      if (!updatedStep) return undefined;
      
      // İlgili şablonu al
      const [template] = await db
        .select()
        .from(productionRouteTemplates)
        .where(eq(productionRouteTemplates.id, updatedStep.templateId));
      
      if (template) {
        // Şablonu güncelle
        await db
          .update(productionRouteTemplates)
          .set({ updatedAt: new Date() })
          .where(eq(productionRouteTemplates.id, template.id));
      }
      
      return updatedStep;
    } catch (error) {
      console.error(`Üretim rota şablonu adımı güncellenirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  async deleteProductionRouteTemplateStep(id: number): Promise<boolean> {
    try {
      // Adımı al (şablon id'si için)
      const [step] = await db
        .select()
        .from(productionRouteTemplateSteps)
        .where(eq(productionRouteTemplateSteps.id, id));
      
      if (!step) return false;
      
      // Adımı sil
      await db
        .delete(productionRouteTemplateSteps)
        .where(eq(productionRouteTemplateSteps.id, id));
      
      // İlgili şablonu al
      const [template] = await db
        .select()
        .from(productionRouteTemplates)
        .where(eq(productionRouteTemplates.id, step.templateId));
      
      if (template) {
        // Şablonu güncelle
        await db
          .update(productionRouteTemplates)
          .set({ updatedAt: new Date() })
          .where(eq(productionRouteTemplates.id, template.id));
      }
      
      return true;
    } catch (error) {
      console.error(`Üretim rota şablonu adımı silinirken hata (id: ${id}):`, error);
      return false;
    }
  }
  
  // Rota şablonunu üretim planına uygulama
  async applyRouteTemplateToProductionPlan(productionPlanId: number, templateId: number, startDate: Date): Promise<ProductionStep[]> {
    try {
      // Üretim planını kontrol et
      const [plan] = await db
        .select()
        .from(productionPlans)
        .where(eq(productionPlans.id, productionPlanId));
      
      if (!plan) throw new Error("Üretim planı bulunamadı");
      
      // Rota şablonunu kontrol et
      const [template] = await db
        .select()
        .from(productionRouteTemplates)
        .where(eq(productionRouteTemplates.id, templateId));
      
      if (!template) throw new Error("Rota şablonu bulunamadı");
      
      // Şablonun adımlarını al
      const templateSteps = await this.getProductionRouteTemplateSteps(templateId);
      if (templateSteps.length === 0) throw new Error("Şablonda hiç adım bulunmuyor");
      
      // Plan için mevcut üretim adımlarını al ve sil
      await db
        .delete(productionSteps)
        .where(eq(productionSteps.productionPlanId, productionPlanId));
      
      // Uygulanacak tarihi belirle
      const startDateObj = new Date(startDate);
      
      // Şablon adımlarını plana ekle
      const createdSteps: ProductionStep[] = [];
      
      for (const templateStep of templateSteps) {
        // Proses tipini al
        const [processType] = await db
          .select()
          .from(processTypes)
          .where(eq(processTypes.id, templateStep.processTypeId));
        
        if (!processType) continue;
        
        // Adım için süreyi hesapla (gün cinsinden)
        const durationDays = templateStep.estimatedDuration || 1;
        
        // Adımın planlanan başlangıç ve bitiş tarihini belirle
        const plannedStartDate = new Date(startDateObj);
        plannedStartDate.setDate(plannedStartDate.getDate() + templateStep.dayOffset);
        
        const plannedEndDate = new Date(plannedStartDate);
        plannedEndDate.setDate(plannedEndDate.getDate() + durationDays);
        
        // Yeni üretim adımı oluştur
        const newStep = await this.createProductionStep({
          productionPlanId,
          department_id: templateStep.department_id,
          processTypeId: templateStep.processTypeId,
          machineId: templateStep.machineId || null,
          stepOrder: templateStep.stepOrder,
          status: "Planlandı",
          plannedStartDate,
          plannedEndDate,
          actualStartDate: null,
          actualEndDate: null,
          notes: templateStep.notes || null
        });
        
        createdSteps.push(newStep);
      }
      
      // Üretim planının durumunu güncelle
      await db
        .update(productionPlans)
        .set({
          status: "Planlandı",
          updatedAt: new Date()
        })
        .where(eq(productionPlans.id, productionPlanId));
      
      // Aktiviteyi kaydet
      await this.recordActivity({
        type: "route_template_applied",
        description: `Şablon uygulandı: ${template.name} -> ${plan.planNo}`,
        userId: 1, // Default admin user
        userName: "Sistem Yöneticisi",
        entityId: plan.id,
        entityType: "production_plan",
      });
      
      return createdSteps;
    } catch (error) {
      console.error(`Rota şablonu üretim planına uygulanırken hata:`, error);
      throw error;
    }
  }
  
  // Activity record helper
  private async recordActivity(activity: { type: string, description: string, userId: number, userName: string, entityId?: number, entityType?: string }): Promise<void> {
    try {
      // Burada activities tablosu varsa aktivite kaydedebiliriz
      // Bu örnek için sadece konsola logluyoruz
      console.log(`[Activity] ${activity.type}: ${activity.description} by ${activity.userName} (${activity.userId})`);
      
      if (activity.entityId && activity.entityType) {
        console.log(`[Activity] Related to: ${activity.entityType}#${activity.entityId}`);
      }
    } catch (error) {
      console.error("Aktivite kaydedilirken hata:", error);
    }
  }
  
  // Envanter Yönetimi (İplik Deposu, Kumaş Deposu)
  async getInventoryItems(params?: {
    itemType?: string;
    orderId?: number;
    productionPlanId?: number;
    status?: string;
  }): Promise<InventoryItem[]> {
    try {
      const { inventoryItems } = await import("@shared/schema");
      
      let query = db.select().from(inventoryItems);
      
      if (params?.itemType) {
        query = query.where(eq(inventoryItems.itemType, params.itemType));
      }
      
      if (params?.orderId) {
        query = query.where(eq(inventoryItems.orderId, params.orderId));
      }
      
      if (params?.productionPlanId) {
        query = query.where(eq(inventoryItems.productionPlanId, params.productionPlanId));
      }
      
      if (params?.status) {
        query = query.where(eq(inventoryItems.status, params.status));
      }
      
      return await query;
    } catch (error) {
      console.error("Envanter öğeleri alınırken hata:", error);
      return [];
    }
  }
  
  // Barkod Sistemi - Dokuma Üretim Kartları
  async getWeaveProductionCards(filters?: Record<string, any>): Promise<WeaveProductionCard[]> {
    try {
      const { weaveProductionCards } = await import("@shared/schema");
      
      let query = db.select().from(weaveProductionCards);
      
      // Filtreleri uygula
      if (filters) {
        if (filters.status) {
          query = query.where(eq(weaveProductionCards.status, filters.status));
        }
        
        if (filters.orderId) {
          query = query.where(eq(weaveProductionCards.orderId, filters.orderId));
        }
        
        if (filters.currentDepartmentId) {
          query = query.where(eq(weaveProductionCards.currentDepartmentId, filters.currentDepartmentId));
        }
        
        if (filters.customerId) {
          query = query.where(eq(weaveProductionCards.customerId, filters.customerId));
        }
      }
      
      const results = await query.orderBy(desc(weaveProductionCards.createdAt));
      return results;
    } catch (error) {
      console.error("Dokuma üretim kartları alınırken hata:", error);
      return [];
    }
  }
  
  async getWeaveProductionCardById(id: number): Promise<WeaveProductionCard | undefined> {
    try {
      const { weaveProductionCards } = await import("@shared/schema");
      
      const [card] = await db
        .select()
        .from(weaveProductionCards)
        .where(eq(weaveProductionCards.id, id));
      
      return card;
    } catch (error) {
      console.error(`Dokuma üretim kartı alınırken hata (id: ${id}):`, error);
      return undefined;
    }
  }
  
  async getWeaveProductionCardByBarcode(barcodeData: string): Promise<WeaveProductionCard | undefined> {
    try {
      const { weaveProductionCards } = await import("@shared/schema");
      
      const [card] = await db
        .select()
        .from(weaveProductionCards)
        .where(eq(weaveProductionCards.barcodeData, barcodeData));
      
      return card;
    } catch (error) {
      console.error(`Dokuma üretim kartı alınırken hata (barkod: ${barcodeData}):`, error);
      return undefined;
    }
  }
  
  async createWeaveProductionCard(card: InsertWeaveProductionCard): Promise<WeaveProductionCard> {
    try {
      const { weaveProductionCards } = await import("@shared/schema");
      
      // Kart numarası oluştur
      if (!card.cardNumber) {
        const date = new Date();
        const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const randomId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        card.cardNumber = `WPC-${yearMonth}-${randomId}`;
      }
      
      // Barkod verisi oluştur (kart numarasıyla aynı olabilir ya da daha karmaşık bir yapı kullanılabilir)
      if (!card.barcodeData) {
        card.barcodeData = card.cardNumber;
      }
      
      // QR kod verileri
      if (!card.qrCodeData) {
        card.qrCodeData = {
          cardNumber: card.cardNumber,
          orderNumber: card.orderNumber,
          fabricType: card.fabricType,
          createdAt: new Date().toISOString()
        };
      }
      
      const [result] = await db
        .insert(weaveProductionCards)
        .values(card)
        .returning();
      
      return result;
    } catch (error) {
      console.error("Dokuma üretim kartı oluşturulurken hata:", error);
      throw new Error("Dokuma üretim kartı oluşturulamadı: " + (error as Error).message);
    }
  }
  
  async updateWeaveProductionCardStatus(id: number, status: string, departmentId?: number): Promise<WeaveProductionCard | undefined> {
    try {
      const { weaveProductionCards } = await import("@shared/schema");
      
      let updateData: any = {
        status,
        updatedAt: new Date()
      };
      
      if (departmentId) {
        updateData.currentDepartmentId = departmentId;
      }
      
      const [updated] = await db
        .update(weaveProductionCards)
        .set(updateData)
        .where(eq(weaveProductionCards.id, id))
        .returning();
      
      return updated;
    } catch (error) {
      console.error(`Dokuma üretim kartı durumu güncellenirken hata (id: ${id}):`, error);
      return undefined;
    }
  }
  
  // Barkod Sistemi - Dokuma Kart İzleme Olayları
  async getWeaveCardTrackingEvents(cardId: number): Promise<WeaveCardTrackingEvent[]> {
    try {
      const { weaveCardTrackingEvents } = await import("@shared/schema");
      
      return await db
        .select()
        .from(weaveCardTrackingEvents)
        .where(eq(weaveCardTrackingEvents.cardId, cardId))
        .orderBy(desc(weaveCardTrackingEvents.timestamp));
    } catch (error) {
      console.error(`Dokuma kartı izleme olayları alınırken hata (cardId: ${cardId}):`, error);
      return [];
    }
  }
  
  async createWeaveCardTrackingEvent(event: InsertWeaveCardTrackingEvent): Promise<WeaveCardTrackingEvent> {
    try {
      const { weaveCardTrackingEvents } = await import("@shared/schema");
      
      const [result] = await db
        .insert(weaveCardTrackingEvents)
        .values(event)
        .returning();
      
      return result;
    } catch (error) {
      console.error("Dokuma kartı izleme olayı oluşturulurken hata:", error);
      throw new Error("Dokuma kartı izleme olayı oluşturulamadı: " + (error as Error).message);
    }
  }
  
  async getInventoryItemById(id: number): Promise<InventoryItem | undefined> {
    try {
      const { inventoryItems } = await import("@shared/schema");
      const [item] = await db
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.id, id));
      
      return item;
    } catch (error) {
      console.error(`Envanter öğesi alınırken hata (id: ${id}):`, error);
      return undefined;
    }
  }
  
  // İplik Envanter metodları
  async getYarnInventory(filters?: Record<string, any>): Promise<YarnInventory[]> {
    try {
      const { yarnInventory } = await import("@shared/schema");
      
      let query = db.select().from(yarnInventory);
      
      // Filtreleri uygula
      if (filters) {
        if (filters.status) {
          query = query.where(eq(yarnInventory.status, filters.status));
        }
        
        if (filters.supplier) {
          query = query.where(eq(yarnInventory.supplier, filters.supplier));
        }
        
        if (filters.yarnType) {
          query = query.where(eq(yarnInventory.yarnType, filters.yarnType));
        }
      }
      
      // desc import edilmiş olmalı. Eğer import edilmemişse, 'sql' kullanabiliriz
      try {
        return await query.orderBy(yarnInventory.updatedAt, { direction: 'desc' });
      } catch (e) {
        // Alternatif yöntem
        return await query.orderBy(sql`${yarnInventory.updatedAt} DESC`);
      }
    } catch (error) {
      console.error("İplik envanteri alınırken hata:", error);
      return [];
    }
  }
  
  // Barkod Sistemi - İplik Depo Çıkış Kartları
  async getYarnIssueCards(filters?: Record<string, any>): Promise<YarnIssueCard[]> {
    try {
      const { yarnIssueCards } = await import("@shared/schema");
      
      let query = db.select().from(yarnIssueCards);
      
      // Filtreleri uygula
      if (filters) {
        if (filters.status) {
          query = query.where(eq(yarnIssueCards.status, filters.status));
        }
        
        if (filters.orderId) {
          query = query.where(eq(yarnIssueCards.orderId, filters.orderId));
        }
        
        if (filters.currentDepartmentId) {
          query = query.where(eq(yarnIssueCards.currentDepartmentId, filters.currentDepartmentId));
        }
        
        if (filters.destinationDepartmentId) {
          query = query.where(eq(yarnIssueCards.destinationDepartmentId, filters.destinationDepartmentId));
        }
        
        if (filters.yarnInventoryId) {
          query = query.where(eq(yarnIssueCards.yarnInventoryId, filters.yarnInventoryId));
        }
      }
      
      // Alternatif yöntem ile sıralama
      const results = await query.orderBy(sql`${yarnIssueCards.createdAt} DESC`);
      return results;
    } catch (error) {
      console.error("İplik çıkış kartları alınırken hata:", error);
      return [];
    }
  }
  
  async getYarnIssueCardById(id: number): Promise<YarnIssueCard | undefined> {
    try {
      const { yarnIssueCards } = await import("@shared/schema");
      
      const [card] = await db
        .select()
        .from(yarnIssueCards)
        .where(eq(yarnIssueCards.id, id));
      
      return card;
    } catch (error) {
      console.error(`İplik çıkış kartı alınırken hata (id: ${id}):`, error);
      return undefined;
    }
  }
  
  async getYarnIssueCardByBarcode(barcodeData: string): Promise<YarnIssueCard | undefined> {
    try {
      const { yarnIssueCards } = await import("@shared/schema");
      
      const [card] = await db
        .select()
        .from(yarnIssueCards)
        .where(eq(yarnIssueCards.barcodeData, barcodeData));
      
      return card;
    } catch (error) {
      console.error(`İplik çıkış kartı alınırken hata (barkod: ${barcodeData}):`, error);
      return undefined;
    }
  }
  
  async createYarnIssueCard(card: InsertYarnIssueCard): Promise<YarnIssueCard> {
    try {
      const { yarnIssueCards, yarnInventory, yarnMovements } = await import("@shared/schema");
      
      // Kart numarası oluştur
      if (!card.cardNumber) {
        const date = new Date();
        const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const randomId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        card.cardNumber = `YIC-${yearMonth}-${randomId}`;
      }
      
      // Barkod verisi oluştur (kart numarasıyla aynı olabilir ya da daha karmaşık bir yapı kullanılabilir)
      if (!card.barcodeData) {
        card.barcodeData = card.cardNumber;
      }
      
      // QR kod verileri
      if (!card.qrCodeData) {
        card.qrCodeData = {
          cardNumber: card.cardNumber,
          yarnType: card.yarnType,
          quantity: card.quantity.toString(),
          batchNumber: card.batchNumber,
          createdAt: new Date().toISOString()
        };
      }
      
      // İplik stok durumunu kontrol et
      const [yarnStock] = await db
        .select()
        .from(yarnInventory)
        .where(eq(yarnInventory.id, card.yarnInventoryId));
      
      if (!yarnStock || yarnStock.stockQuantity < card.quantity) {
        throw new Error("Yetersiz iplik stoku. İşlem yapılamadı.");
      }
      
      // Veritabanı işlemleri
      const [result] = await db
        .insert(yarnIssueCards)
        .values(card)
        .returning();
      
      // İplik stok miktarını güncelle
      await db
        .update(yarnInventory)
        .set({
          stockQuantity: sql`${yarnInventory.stockQuantity} - ${card.quantity}`,
          updatedAt: new Date()
        })
        .where(eq(yarnInventory.id, card.yarnInventoryId));
      
      // İplik hareketi kaydı oluştur
      await db
        .insert(yarnMovements)
        .values({
          yarnInventoryId: card.yarnInventoryId,
          movementType: "Çıkış",
          quantity: card.quantity,
          unitOfMeasure: card.unitOfMeasure,
          source: "İplik Çıkış Kartı",
          sourceId: result.cardNumber,
          departmentId: card.currentDepartmentId,
          destinationDepartmentId: card.destinationDepartmentId,
          userId: card.createdBy,
          moveDate: new Date(),
          notes: `İplik çıkış kartı: ${card.cardNumber}`
        });
      
      return result;
    } catch (error) {
      console.error("İplik çıkış kartı oluşturulurken hata:", error);
      throw new Error("İplik çıkış kartı oluşturulamadı: " + (error as Error).message);
    }
  }
  
  async updateYarnIssueCardStatus(id: number, status: string, departmentId?: number): Promise<YarnIssueCard | undefined> {
    try {
      const { yarnIssueCards } = await import("@shared/schema");
      
      let updateData: any = {
        status,
        updatedAt: new Date()
      };
      
      if (departmentId) {
        updateData.currentDepartmentId = departmentId;
      }
      
      const [updated] = await db
        .update(yarnIssueCards)
        .set(updateData)
        .where(eq(yarnIssueCards.id, id))
        .returning();
      
      return updated;
    } catch (error) {
      console.error(`İplik çıkış kartı durumu güncellenirken hata (id: ${id}):`, error);
      return undefined;
    }
  }
  
  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    try {
      const { inventoryItems, orders, productionPlans } = await import("@shared/schema");
      
      // Otomatik lot numarası oluştur
      const lotNumber = insertItem.lotNumber || `LOT-${Date.now().toString().substring(5)}`;
      
      const [item] = await db
        .insert(inventoryItems)
        .values({
          ...insertItem,
          lotNumber,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      // Sipariş veya üretim planı bilgisini eklediyse ilgili kaydı güncelle
      let orderNumber = "";
      if (item.orderId) {
        const completedStatusId = 4; // "COMPLETED" statüsü için ID
        await this.updateOrderStatus(item.orderId, completedStatusId);
        
        // Sipariş numarasını al
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, item.orderId));
        
        if (order) {
          orderNumber = order.orderNumber;
        }
      }
      
      let planCode = "";
      if (item.productionPlanId) {
        // Üretim planı bilgisini al
        const [plan] = await db
          .select()
          .from(productionPlans)
          .where(eq(productionPlans.id, item.productionPlanId));
        
        if (plan) {
          planCode = plan.planCode || `PLAN-${plan.id}`;
          
          // Plan durumunu tamamlandı olarak güncelle
          await db
            .update(productionPlans)
            .set({ 
              status: "completed",
              updatedAt: new Date()
            })
            .where(eq(productionPlans.id, plan.id));
        }
      }
      
      // Aktivite kaydı oluştur
      let description = `Depoya yeni öğe eklendi: ${item.itemType} (Lot: ${item.lotNumber})`;
      if (orderNumber) {
        description += ` - Sipariş: ${orderNumber}`;
      }
      if (planCode) {
        description += ` - Üretim Planı: ${planCode}`;
      }
      
      await this.recordActivity({
        type: "inventory_item_created",
        description,
        userId: 1, // Sistem kullanıcısı
        userName: "Sistem Yöneticisi",
        entityId: item.id,
        entityType: "inventory_item",
      });
      
      return item;
    } catch (error) {
      console.error("Envanter öğesi oluşturulurken hata:", error);
      throw error;
    }
  }
  
  async updateInventoryItemStatus(id: number, status: string): Promise<InventoryItem | undefined> {
    try {
      const { inventoryItems } = await import("@shared/schema");
      
      const [updatedItem] = await db
        .update(inventoryItems)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(eq(inventoryItems.id, id))
        .returning();
      
      if (updatedItem) {
        // Aktivite kaydı oluştur
        await this.recordActivity({
          type: "inventory_status_updated",
          description: `Envanter öğesi durumu güncellendi (ID: ${id}): ${status}`,
          userId: 1, // Sistem kullanıcısı
          userName: "Sistem Yöneticisi",
          entityId: id,
          entityType: "inventory_item",
        });
      }
      
      return updatedItem;
    } catch (error) {
      console.error(`Envanter öğesi durumu güncellenirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  async updateInventoryItem(id: number, itemData: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    try {
      const { inventoryItems } = await import("@shared/schema");
      
      const [updatedItem] = await db
        .update(inventoryItems)
        .set({ 
          ...itemData,
          updatedAt: new Date()
        })
        .where(eq(inventoryItems.id, id))
        .returning();
      
      return updatedItem;
    } catch (error) {
      console.error(`Envanter öğesi güncellenirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  // Barkod Sistemi - Kumaş Numuneleri
  async getFabricSamples(filters?: Record<string, any>): Promise<FabricSample[]> {
    try {
      const { fabricSamples } = await import("@shared/schema");
      
      let query = db.select().from(fabricSamples);
      
      // Filtreleri uygula
      if (filters) {
        if (filters.status) {
          query = query.where(eq(fabricSamples.status, filters.status));
        }
        
        if (filters.customerId) {
          query = query.where(eq(fabricSamples.customerId, filters.customerId));
        }
        
        if (filters.departmentId) {
          query = query.where(eq(fabricSamples.departmentId, filters.departmentId));
        }
        
        if (filters.fabricTypeId) {
          query = query.where(eq(fabricSamples.fabricTypeId, filters.fabricTypeId));
        }
      }
      
      const results = await query.orderBy(desc(fabricSamples.createdAt));
      return results;
    } catch (error) {
      console.error("Kumaş numuneleri alınırken hata:", error);
      return [];
    }
  }
  
  async getFabricSampleById(id: number): Promise<FabricSample | undefined> {
    try {
      const { fabricSamples } = await import("@shared/schema");
      
      const [sample] = await db
        .select()
        .from(fabricSamples)
        .where(eq(fabricSamples.id, id));
      
      return sample;
    } catch (error) {
      console.error(`Kumaş numunesi alınırken hata (id: ${id}):`, error);
      return undefined;
    }
  }
  
  async getFabricSampleByBarcode(barcodeData: string): Promise<FabricSample | undefined> {
    try {
      const { fabricSamples } = await import("@shared/schema");
      
      const [sample] = await db
        .select()
        .from(fabricSamples)
        .where(eq(fabricSamples.barcodeData, barcodeData));
      
      return sample;
    } catch (error) {
      console.error(`Kumaş numunesi alınırken hata (barkod: ${barcodeData}):`, error);
      return undefined;
    }
  }
  
  async createFabricSample(sample: InsertFabricSample): Promise<FabricSample> {
    try {
      const { fabricSamples } = await import("@shared/schema");
      
      // Numune numarası oluştur
      if (!sample.sampleNumber) {
        const date = new Date();
        const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const randomId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        sample.sampleNumber = `SMP-${yearMonth}-${randomId}`;
      }
      
      // Barkod verisi oluştur (numune numarasıyla aynı olabilir ya da daha karmaşık bir yapı kullanılabilir)
      if (!sample.barcodeData) {
        sample.barcodeData = sample.sampleNumber;
      }
      
      // QR kod verileri
      if (!sample.qrCodeData) {
        sample.qrCodeData = {
          sampleNumber: sample.sampleNumber,
          fabricType: sample.fabricType,
          customerName: sample.customerName,
          createdAt: new Date().toISOString()
        };
      }
      
      const [result] = await db
        .insert(fabricSamples)
        .values(sample)
        .returning();
      
      return result;
    } catch (error) {
      console.error("Kumaş numunesi oluşturulurken hata:", error);
      throw new Error("Kumaş numunesi oluşturulamadı: " + (error as Error).message);
    }
  }
  
  async updateFabricSampleStatus(id: number, status: string): Promise<FabricSample | undefined> {
    try {
      const { fabricSamples } = await import("@shared/schema");
      
      const [updated] = await db
        .update(fabricSamples)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(fabricSamples.id, id))
        .returning();
      
      return updated;
    } catch (error) {
      console.error(`Kumaş numunesi durumu güncellenirken hata (id: ${id}):`, error);
      return undefined;
    }
  }
  
  async getFabricSampleApprovals(sampleId: number): Promise<FabricSampleApproval[]> {
    try {
      const { fabricSampleApprovals } = await import("@shared/schema");
      
      return await db
        .select()
        .from(fabricSampleApprovals)
        .where(eq(fabricSampleApprovals.sampleId, sampleId))
        .orderBy(desc(fabricSampleApprovals.createdAt));
    } catch (error) {
      console.error(`Kumaş numunesi onayları alınırken hata (sampleId: ${sampleId}):`, error);
      return [];
    }
  }
  
  async createFabricSampleApproval(approval: InsertFabricSampleApproval): Promise<FabricSampleApproval> {
    try {
      const { fabricSampleApprovals, fabricSamples, users } = await import("@shared/schema");
      
      // Kullanıcı bilgisini al
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, approval.userId));
      
      if (!user) {
        throw new Error("Kullanıcı bulunamadı");
      }
      
      // userName alanını doldur
      const approvalData: InsertFabricSampleApproval = {
        ...approval,
        userName: user.fullName
      };
      
      const [result] = await db
        .insert(fabricSampleApprovals)
        .values(approvalData)
        .returning();
      
      // Numune durumunu güncelle
      await db
        .update(fabricSamples)
        .set({
          status: approval.status,
          updatedAt: new Date()
        })
        .where(eq(fabricSamples.id, approval.sampleId));
      
      return result;
    } catch (error) {
      console.error("Kumaş numunesi onayı oluşturulurken hata:", error);
      throw new Error("Kumaş numunesi onayı oluşturulamadı: " + (error as Error).message);
    }
  }

  // Stok Hareketleri ile ilgili metodlar
  async getInventoryTransactions(params?: {
    transactionType?: string;
    itemType?: string;
    startDate?: Date;
    endDate?: Date;
    locationId?: number;
  }): Promise<InventoryTransaction[]> {
    try {
      const { inventoryTransactions } = await import("@shared/schema");
      
      let query = db.select().from(inventoryTransactions);
      
      if (params?.transactionType) {
        query = query.where(eq(inventoryTransactions.transactionType, params.transactionType));
      }
      
      if (params?.itemType) {
        query = query.where(eq(inventoryTransactions.itemType, params.itemType));
      }
      
      if (params?.locationId) {
        query = query.where(eq(inventoryTransactions.locationId, params.locationId));
      }
      
      if (params?.startDate) {
        query = query.where(gte(inventoryTransactions.transactionDate, params.startDate));
      }
      
      if (params?.endDate) {
        query = query.where(lte(inventoryTransactions.transactionDate, params.endDate));
      }
      
      query = query.orderBy(desc(inventoryTransactions.transactionDate));
      
      return await query;
    } catch (error) {
      console.error("Stok hareketleri alınırken hata:", error);
      return [];
    }
  }
  
  async getInventoryTransactionById(id: number): Promise<InventoryTransaction | undefined> {
    try {
      const { inventoryTransactions } = await import("@shared/schema");
      const [transaction] = await db
        .select()
        .from(inventoryTransactions)
        .where(eq(inventoryTransactions.id, id));
      
      return transaction;
    } catch (error) {
      console.error(`Stok hareketi alınırken hata (id: ${id}):`, error);
      return undefined;
    }
  }
  
  async createInventoryTransaction(insertTransaction: InsertInventoryTransaction): Promise<InventoryTransaction> {
    try {
      const { inventoryTransactions, inventoryItems } = await import("@shared/schema");
      
      // Hareket tipine bağlı olarak stok güncellemesi yap
      if (insertTransaction.inventoryItemId) {
        const [item] = await db
          .select()
          .from(inventoryItems)
          .where(eq(inventoryItems.id, insertTransaction.inventoryItemId));
        
        if (item) {
          let newQuantity = item.quantity;
          
          // Hareket tipine göre miktar güncelle
          if (insertTransaction.transactionType === 'in') {
            newQuantity += insertTransaction.quantity;
          } else if (insertTransaction.transactionType === 'out') {
            newQuantity -= insertTransaction.quantity;
            
            // Negatif stok kontrolü
            if (newQuantity < 0) {
              throw new Error(`Yetersiz stok. Mevcut: ${item.quantity}, İstenen: ${insertTransaction.quantity}`);
            }
          }
          
          // Stok miktarını güncelle
          await db
            .update(inventoryItems)
            .set({ 
              quantity: newQuantity,
              updatedAt: new Date()
            })
            .where(eq(inventoryItems.id, item.id));
        }
      }
      
      // İşlem kaydı oluştur
      const [transaction] = await db
        .insert(inventoryTransactions)
        .values({
          ...insertTransaction,
          transactionDate: insertTransaction.transactionDate || new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return transaction;
    } catch (error) {
      console.error("Stok hareketi oluşturulurken hata:", error);
      throw error;
    }
  }
  
  async updateInventoryTransactionStatus(id: number, status: string, approvedBy?: number, notes?: string): Promise<InventoryTransaction | undefined> {
    try {
      const { inventoryTransactions } = await import("@shared/schema");
      
      const [updatedTransaction] = await db
        .update(inventoryTransactions)
        .set({ 
          status,
          approvedBy,
          notes,
          updatedAt: new Date()
        })
        .where(eq(inventoryTransactions.id, id))
        .returning();
      
      return updatedTransaction;
    } catch (error) {
      console.error(`Stok hareketi durumu güncellenirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  // Depo Lokasyonları ile ilgili metodlar
  async getInventoryLocations(params?: {
    warehouseType?: string;
    isActive?: boolean;
  }): Promise<InventoryLocation[]> {
    try {
      const { inventoryLocations } = await import("@shared/schema");
      
      let query = db.select().from(inventoryLocations);
      
      if (params?.warehouseType) {
        query = query.where(eq(inventoryLocations.warehouseType, params.warehouseType));
      }
      
      if (params?.isActive !== undefined) {
        query = query.where(eq(inventoryLocations.isActive, params.isActive));
      }
      
      return await query;
    } catch (error) {
      console.error("Depo lokasyonları alınırken hata:", error);
      return [];
    }
  }
  
  async createInventoryLocation(locationData: InsertInventoryLocation): Promise<InventoryLocation> {
    try {
      const { inventoryLocations } = await import("@shared/schema");
      
      const [location] = await db
        .insert(inventoryLocations)
        .values({
          ...locationData,
          isActive: locationData.isActive ?? true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return location;
    } catch (error) {
      console.error("Depo lokasyonu oluşturulurken hata:", error);
      throw error;
    }
  }
  
  async updateInventoryLocation(id: number, updateData: Partial<InventoryLocation>): Promise<InventoryLocation | undefined> {
    try {
      const { inventoryLocations } = await import("@shared/schema");
      
      const [updatedLocation] = await db
        .update(inventoryLocations)
        .set({ 
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(inventoryLocations.id, id))
        .returning();
      
      return updatedLocation;
    } catch (error) {
      console.error(`Depo lokasyonu güncellenirken hata (id: ${id}):`, error);
      throw error;
    }
  }

  // Kalite Kontrol Modülü İşlemleri

  // Kumaş Topları
  async getQualityFabricRolls(filters: Record<string, any> = {}): Promise<QualityFabricRoll[]> {
    try {
      const { qualityFabricRolls } = await import("@shared/schema");
      
      let query = db.select().from(qualityFabricRolls);
      
      // Filtreler varsa uygula
      if (filters.status) {
        query = query.where(eq(qualityFabricRolls.status, filters.status));
      }
      
      if (filters.operatorId) {
        query = query.where(eq(qualityFabricRolls.operatorId, filters.operatorId));
      }
      
      if (filters.machineId) {
        query = query.where(eq(qualityFabricRolls.machineId, filters.machineId));
      }
      
      if (filters.batchNo) {
        query = query.where(eq(qualityFabricRolls.batchNo, filters.batchNo));
      }
      
      if (filters.createdAfter) {
        query = query.where(gte(qualityFabricRolls.createdAt, new Date(filters.createdAfter)));
      }
      
      if (filters.createdBefore) {
        query = query.where(lte(qualityFabricRolls.createdAt, new Date(filters.createdBefore)));
      }
      
      const rolls = await query.orderBy(desc(qualityFabricRolls.createdAt));
      return rolls;
      
    } catch (error) {
      console.error('Kalite kumaş topları getirilirken hata:', error);
      throw error;
    }
  }
  
  async getQualityFabricRollById(id: number): Promise<QualityFabricRoll | undefined> {
    try {
      const { qualityFabricRolls } = await import("@shared/schema");
      
      const [roll] = await db
        .select()
        .from(qualityFabricRolls)
        .where(eq(qualityFabricRolls.id, id));
        
      return roll;
    } catch (error) {
      console.error(`Kalite kumaş topu getirilirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  async getQualityFabricRollByBarcode(barcode: string): Promise<QualityFabricRoll | undefined> {
    try {
      const { qualityFabricRolls } = await import("@shared/schema");
      
      const [roll] = await db
        .select()
        .from(qualityFabricRolls)
        .where(eq(qualityFabricRolls.barCode, barcode));
        
      return roll;
    } catch (error) {
      console.error(`Barkodlu kalite kumaş topu getirilirken hata (barkod: ${barcode}):`, error);
      throw error;
    }
  }
  
  async createQualityFabricRoll(roll: InsertQualityFabricRoll): Promise<QualityFabricRoll> {
    try {
      const { qualityFabricRolls } = await import("@shared/schema");
      
      const [newRoll] = await db
        .insert(qualityFabricRolls)
        .values({
          ...roll,
          createdAt: new Date()
        })
        .returning();
      
      // Aktivite kaydı oluştur
      await this.recordActivity({
        type: "quality_roll_created",
        description: `Kalite kumaş topu oluşturuldu (Barkod: ${roll.barCode})`,
        userId: roll.operatorId || 1,
        userName: "Operatör",
        entityId: newRoll.id,
        entityType: "quality_fabric_roll"
      });
      
      return newRoll;
    } catch (error) {
      console.error('Kalite kumaş topu oluşturulurken hata:', error);
      throw error;
    }
  }
  
  async updateQualityFabricRoll(id: number, rollData: Partial<QualityFabricRoll>): Promise<QualityFabricRoll | undefined> {
    try {
      const { qualityFabricRolls } = await import("@shared/schema");
      
      const [updatedRoll] = await db
        .update(qualityFabricRolls)
        .set({
          ...rollData,
          updatedAt: new Date()
        })
        .where(eq(qualityFabricRolls.id, id))
        .returning();
      
      if (updatedRoll) {
        // Aktivite kaydı oluştur
        await this.recordActivity({
          type: "quality_roll_updated",
          description: `Kalite kumaş topu güncellendi (ID: ${id})`,
          userId: rollData.operatorId || 1,
          userName: "Operatör",
          entityId: id,
          entityType: "quality_fabric_roll"
        });
      }
      
      return updatedRoll;
    } catch (error) {
      console.error(`Kalite kumaş topu güncellenirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  async updateQualityFabricRollStatus(id: number, status: string): Promise<QualityFabricRoll | undefined> {
    try {
      const { qualityFabricRolls } = await import("@shared/schema");
      
      const [updatedRoll] = await db
        .update(qualityFabricRolls)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(qualityFabricRolls.id, id))
        .returning();
      
      if (updatedRoll) {
        // Aktivite kaydı oluştur
        await this.recordActivity({
          type: "quality_roll_status_updated",
          description: `Kalite kumaş topu durumu güncellendi (ID: ${id}): ${status}`,
          userId: 1,
          userName: "Sistem",
          entityId: id,
          entityType: "quality_fabric_roll"
        });
      }
      
      return updatedRoll;
    } catch (error) {
      console.error(`Kalite kumaş topu durumu güncellenirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  async deleteQualityFabricRoll(id: number): Promise<boolean> {
    try {
      const { qualityFabricRolls, qualityFabricDefects } = await import("@shared/schema");
      
      // Önce bağlı hataları siliyoruz
      await db
        .delete(qualityFabricDefects)
        .where(eq(qualityFabricDefects.fabricRollId, id));
      
      // Sonra topu siliyoruz
      const result = await db
        .delete(qualityFabricRolls)
        .where(eq(qualityFabricRolls.id, id));
      
      if (result) {
        // Aktivite kaydı oluştur
        await this.recordActivity({
          type: "quality_roll_deleted",
          description: `Kalite kumaş topu silindi (ID: ${id})`,
          userId: 1,
          userName: "Sistem",
          entityId: id,
          entityType: "quality_fabric_roll"
        });
      }
      
      return true;
    } catch (error) {
      console.error(`Kalite kumaş topu silinirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  // Kumaş Hataları
  async getQualityFabricDefects(fabricRollId: number): Promise<QualityFabricDefect[]> {
    try {
      const { qualityFabricDefects } = await import("@shared/schema");
      
      const defects = await db
        .select()
        .from(qualityFabricDefects)
        .where(eq(qualityFabricDefects.fabricRollId, fabricRollId))
        .orderBy(asc(qualityFabricDefects.startMeter));
      
      return defects;
    } catch (error) {
      console.error(`Kalite kumaş hataları getirilirken hata (topId: ${fabricRollId}):`, error);
      throw error;
    }
  }
  
  async getQualityFabricDefectById(id: number): Promise<QualityFabricDefect | undefined> {
    try {
      const { qualityFabricDefects } = await import("@shared/schema");
      
      const [defect] = await db
        .select()
        .from(qualityFabricDefects)
        .where(eq(qualityFabricDefects.id, id));
      
      return defect;
    } catch (error) {
      console.error(`Kalite kumaş hatası getirilirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  async createQualityFabricDefect(defect: InsertQualityFabricDefect): Promise<QualityFabricDefect> {
    try {
      const { qualityFabricDefects } = await import("@shared/schema");
      
      const [newDefect] = await db
        .insert(qualityFabricDefects)
        .values({
          ...defect,
          createdAt: new Date()
        })
        .returning();
      
      // Aktivite kaydı oluştur
      await this.recordActivity({
        type: "quality_defect_created",
        description: `Kalite kumaş hatası eklendi (${defect.defectCode}: ${defect.startMeter}-${defect.endMeter}m)`,
        userId: defect.createdBy,
        userName: "Operatör",
        entityId: newDefect.id,
        entityType: "quality_fabric_defect"
      });
      
      return newDefect;
    } catch (error) {
      console.error('Kalite kumaş hatası oluşturulurken hata:', error);
      throw error;
    }
  }
  
  async updateQualityFabricDefect(id: number, defectData: Partial<QualityFabricDefect>): Promise<QualityFabricDefect | undefined> {
    try {
      const { qualityFabricDefects } = await import("@shared/schema");
      
      const [updatedDefect] = await db
        .update(qualityFabricDefects)
        .set(defectData)
        .where(eq(qualityFabricDefects.id, id))
        .returning();
      
      return updatedDefect;
    } catch (error) {
      console.error(`Kalite kumaş hatası güncellenirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  async deleteQualityFabricDefect(id: number): Promise<boolean> {
    try {
      const { qualityFabricDefects } = await import("@shared/schema");
      
      await db
        .delete(qualityFabricDefects)
        .where(eq(qualityFabricDefects.id, id));
      
      return true;
    } catch (error) {
      console.error(`Kalite kumaş hatası silinirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  // Kalite Sistemleri
  async getQualitySystems(includeInactive: boolean = false): Promise<QualitySystem[]> {
    try {
      const { qualitySystems } = await import("@shared/schema");
      
      let query = db.select().from(qualitySystems);
      
      if (!includeInactive) {
        query = query.where(eq(qualitySystems.isActive, true));
      }
      
      const systems = await query;
      return systems;
    } catch (error) {
      console.error('Kalite sistemleri getirilirken hata:', error);
      throw error;
    }
  }
  
  async getQualitySystemById(id: number): Promise<QualitySystem | undefined> {
    try {
      const { qualitySystems } = await import("@shared/schema");
      
      const [system] = await db
        .select()
        .from(qualitySystems)
        .where(eq(qualitySystems.id, id));
      
      return system;
    } catch (error) {
      console.error(`Kalite sistemi getirilirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  async createQualitySystem(system: InsertQualitySystem): Promise<QualitySystem> {
    try {
      const { qualitySystems } = await import("@shared/schema");
      
      const [newSystem] = await db
        .insert(qualitySystems)
        .values(system)
        .returning();
      
      return newSystem;
    } catch (error) {
      console.error('Kalite sistemi oluşturulurken hata:', error);
      throw error;
    }
  }
  
  async updateQualitySystem(id: number, systemData: Partial<QualitySystem>): Promise<QualitySystem | undefined> {
    try {
      const { qualitySystems } = await import("@shared/schema");
      
      const [updatedSystem] = await db
        .update(qualitySystems)
        .set(systemData)
        .where(eq(qualitySystems.id, id))
        .returning();
      
      return updatedSystem;
    } catch (error) {
      console.error(`Kalite sistemi güncellenirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  async deleteQualitySystem(id: number): Promise<boolean> {
    try {
      const { qualitySystems } = await import("@shared/schema");
      
      await db
        .delete(qualitySystems)
        .where(eq(qualitySystems.id, id));
      
      return true;
    } catch (error) {
      console.error(`Kalite sistemi silinirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  // Hata Kodları
  async getQualityDefectCodes(includeInactive: boolean = false): Promise<QualityDefectCode[]> {
    try {
      const { qualityDefectCodes } = await import("@shared/schema");
      
      let query = db.select().from(qualityDefectCodes);
      
      if (!includeInactive) {
        query = query.where(eq(qualityDefectCodes.isActive, true));
      }
      
      const codes = await query.orderBy(asc(qualityDefectCodes.code));
      return codes;
    } catch (error) {
      console.error('Hata kodları getirilirken hata:', error);
      throw error;
    }
  }
  
  async getQualityDefectCodeById(id: number): Promise<QualityDefectCode | undefined> {
    try {
      const { qualityDefectCodes } = await import("@shared/schema");
      
      const [code] = await db
        .select()
        .from(qualityDefectCodes)
        .where(eq(qualityDefectCodes.id, id));
      
      return code;
    } catch (error) {
      console.error(`Hata kodu getirilirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  async createQualityDefectCode(code: InsertQualityDefectCode): Promise<QualityDefectCode> {
    try {
      const { qualityDefectCodes } = await import("@shared/schema");
      
      const [newCode] = await db
        .insert(qualityDefectCodes)
        .values(code)
        .returning();
      
      return newCode;
    } catch (error) {
      console.error('Hata kodu oluşturulurken hata:', error);
      throw error;
    }
  }
  
  async updateQualityDefectCode(id: number, codeData: Partial<QualityDefectCode>): Promise<QualityDefectCode | undefined> {
    try {
      const { qualityDefectCodes } = await import("@shared/schema");
      
      const [updatedCode] = await db
        .update(qualityDefectCodes)
        .set(codeData)
        .where(eq(qualityDefectCodes.id, id))
        .returning();
      
      return updatedCode;
    } catch (error) {
      console.error(`Hata kodu güncellenirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  async deleteQualityDefectCode(id: number): Promise<boolean> {
    try {
      const { qualityDefectCodes } = await import("@shared/schema");
      
      await db
        .delete(qualityDefectCodes)
        .where(eq(qualityDefectCodes.id, id));
      
      return true;
    } catch (error) {
      console.error(`Hata kodu silinirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  // Ölçüm Cihazları
  async getQualityMeasurementDevices(includeInactive: boolean = false): Promise<QualityMeasurementDevice[]> {
    try {
      const { qualityMeasurementDevices } = await import("@shared/schema");
      
      let query = db.select().from(qualityMeasurementDevices);
      
      if (!includeInactive) {
        query = query.where(eq(qualityMeasurementDevices.isActive, true));
      }
      
      const devices = await query;
      return devices;
    } catch (error) {
      console.error('Ölçüm cihazları getirilirken hata:', error);
      throw error;
    }
  }
  
  async getQualityMeasurementDeviceById(id: number): Promise<QualityMeasurementDevice | undefined> {
    try {
      const { qualityMeasurementDevices } = await import("@shared/schema");
      
      const [device] = await db
        .select()
        .from(qualityMeasurementDevices)
        .where(eq(qualityMeasurementDevices.id, id));
      
      return device;
    } catch (error) {
      console.error(`Ölçüm cihazı getirilirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  async createQualityMeasurementDevice(device: InsertQualityMeasurementDevice): Promise<QualityMeasurementDevice> {
    try {
      const { qualityMeasurementDevices } = await import("@shared/schema");
      
      const [newDevice] = await db
        .insert(qualityMeasurementDevices)
        .values(device)
        .returning();
      
      return newDevice;
    } catch (error) {
      console.error('Ölçüm cihazı oluşturulurken hata:', error);
      throw error;
    }
  }
  
  async updateQualityMeasurementDevice(id: number, deviceData: Partial<QualityMeasurementDevice>): Promise<QualityMeasurementDevice | undefined> {
    try {
      const { qualityMeasurementDevices } = await import("@shared/schema");
      
      const [updatedDevice] = await db
        .update(qualityMeasurementDevices)
        .set(deviceData)
        .where(eq(qualityMeasurementDevices.id, id))
        .returning();
      
      return updatedDevice;
    } catch (error) {
      console.error(`Ölçüm cihazı güncellenirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  async deleteQualityMeasurementDevice(id: number): Promise<boolean> {
    try {
      const { qualityMeasurementDevices } = await import("@shared/schema");
      
      await db
        .delete(qualityMeasurementDevices)
        .where(eq(qualityMeasurementDevices.id, id));
      
      return true;
    } catch (error) {
      console.error(`Ölçüm cihazı silinirken hata (id: ${id}):`, error);
      throw error;
    }
  }
  
  // Kalite Kontrol İstatistikleri
  async getQualityStats(filters?: any): Promise<{ totalRolls: number, pendingInspection: number, passedInspection: number, failedInspection: number, totalDefects: number }> {
    try {
      const { qualityFabricRolls, qualityFabricDefects } = await import("@shared/schema");
      
      // Toplam top sayısı
      const [{ count: totalRolls }] = await db
        .select({ count: count() })
        .from(qualityFabricRolls);
      
      // Durum bazında top sayıları
      const [{ count: pendingInspection }] = await db
        .select({ count: count() })
        .from(qualityFabricRolls)
        .where(eq(qualityFabricRolls.status, "active"));
      
      const [{ count: passedInspection }] = await db
        .select({ count: count() })
        .from(qualityFabricRolls)
        .where(eq(qualityFabricRolls.status, "completed"));
      
      const [{ count: failedInspection }] = await db
        .select({ count: count() })
        .from(qualityFabricRolls)
        .where(eq(qualityFabricRolls.status, "rejected"));
      
      // Toplam hata sayısı
      const [{ count: totalDefects }] = await db
        .select({ count: count() })
        .from(qualityFabricDefects);
      
      return {
        totalRolls: Number(totalRolls) || 0,
        pendingInspection: Number(pendingInspection) || 0,
        passedInspection: Number(passedInspection) || 0,
        failedInspection: Number(failedInspection) || 0,
        totalDefects: Number(totalDefects) || 0
      };
    } catch (error) {
      console.error('Kalite istatistikleri getirilirken hata:', error);
      throw error;
    }
  }
  
  // Aktivite kayıtları için metod
  async recordActivity(activity: { type: string, description: string, userId: number, userName: string, entityId?: number, entityType?: string }): Promise<void> {
    try {
      await db.insert(activities).values({
        action: activity.type,
        description: activity.description,
        userId: activity.userId,
        entityId: activity.entityId,
        entityType: activity.entityType,
        details: JSON.stringify({
          userName: activity.userName,
          timestamp: new Date()
        })
      });
    } catch (error) {
      console.error('Aktivite kaydedilemedi:', error);
    }
  }

  // İplik hareketlerini getir
  async getYarnMovements(filters?: Record<string, any>): Promise<any[]> {
    try {
      const { yarnMovements } = await import("@shared/schema");
      const { and, eq, gte, lte, desc } = await import("drizzle-orm");
      
      let query = db.select().from(yarnMovements);
      
      // Filtreleme işlemleri
      if (filters) {
        if (filters.inventoryId) {
          query = query.where(eq(yarnMovements.inventoryId, filters.inventoryId));
        }
        
        if (filters.movementType) {
          query = query.where(eq(yarnMovements.movementType, filters.movementType));
        }
        
        if (filters.toDepartmentId) {
          query = query.where(eq(yarnMovements.toDepartmentId, filters.toDepartmentId));
        }
        
        if (filters.referenceDocument) {
          query = query.where(eq(yarnMovements.referenceDocument, filters.referenceDocument));
        }
        
        if (filters.referenceId) {
          query = query.where(eq(yarnMovements.referenceId, filters.referenceId));
        }
        
        // Tarih aralığı filtreleme
        if (filters.startDate && filters.endDate) {
          query = query.where(
            and(
              gte(yarnMovements.transactionDate, new Date(filters.startDate)),
              lte(yarnMovements.transactionDate, new Date(filters.endDate))
            )
          );
        } else if (filters.startDate) {
          query = query.where(gte(yarnMovements.transactionDate, new Date(filters.startDate)));
        } else if (filters.endDate) {
          query = query.where(lte(yarnMovements.transactionDate, new Date(filters.endDate)));
        }
      }
      
      const results = await query.orderBy(desc(yarnMovements.transactionDate));
      return results;
    } catch (error) {
      console.error("İplik hareketleri alınırken hata:", error);
      return [];
    }
  }

  // İplik Büküm Bölümü İşlemleri
  
  // Tüm büküm siparişlerini getir
  async getYarnTwistingOrders(filters?: Record<string, any>): Promise<TwistingOrder[]> {
    try {
      const { twistingOrders, users, machines, yarnTypes, productionSteps } = await import("@shared/schema");
      const { eq, desc, and, gte, lte } = await import("drizzle-orm");
      
      let query = db.select({
        id: twistingOrders.id,
        productionStepId: twistingOrders.productionStepId,
        machineId: twistingOrders.machineId,
        yarnTypeId: twistingOrders.yarnTypeId,
        twistLevel: twistingOrders.twistLevel,
        yarnCount: twistingOrders.yarnCount,
        twistDirection: twistingOrders.twistDirection,
        twistAmount: twistingOrders.twistAmount,
        quantity: twistingOrders.quantity,
        assignedOperatorId: twistingOrders.assignedOperatorId,
        speed: twistingOrders.speed,
        startTime: twistingOrders.startTime,
        endTime: twistingOrders.endTime,
        status: twistingOrders.status,
        notes: twistingOrders.notes,
        createdAt: twistingOrders.createdAt,
        updatedAt: twistingOrders.updatedAt,
        machineName: machines.name,
        operatorName: users.fullName,
        yarnTypeName: yarnTypes.name,
        processName: productionSteps.processName
      })
      .from(twistingOrders)
      .leftJoin(machines, eq(twistingOrders.machineId, machines.id))
      .leftJoin(users, eq(twistingOrders.assignedOperatorId, users.id))
      .leftJoin(yarnTypes, eq(twistingOrders.yarnTypeId, yarnTypes.id))
      .leftJoin(productionSteps, eq(twistingOrders.productionStepId, productionSteps.id));
      
      // Filtreleme işlemleri
      if (filters) {
        const conditions = [];
        
        if (filters.machineId) {
          conditions.push(eq(twistingOrders.machineId, filters.machineId));
        }
        
        if (filters.status) {
          conditions.push(eq(twistingOrders.status, filters.status));
        }
        
        if (filters.assignedOperatorId) {
          conditions.push(eq(twistingOrders.assignedOperatorId, filters.assignedOperatorId));
        }
        
        if (filters.yarnTypeId) {
          conditions.push(eq(twistingOrders.yarnTypeId, filters.yarnTypeId));
        }
        
        if (filters.productionStepId) {
          conditions.push(eq(twistingOrders.productionStepId, filters.productionStepId));
        }
        
        // Tarih aralığı filtreleme
        if (filters.startDate && filters.endDate) {
          conditions.push(
            and(
              gte(twistingOrders.startTime, new Date(filters.startDate)),
              lte(twistingOrders.startTime, new Date(filters.endDate))
            )
          );
        } else if (filters.startDate) {
          conditions.push(gte(twistingOrders.startTime, new Date(filters.startDate)));
        } else if (filters.endDate) {
          conditions.push(lte(twistingOrders.startTime, new Date(filters.endDate)));
        }
        
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
      }
      
      const results = await query.orderBy(desc(twistingOrders.createdAt));
      return results as TwistingOrder[];
    } catch (error) {
      console.error("Büküm siparişleri alınırken hata:", error);
      return [];
    }
  }
  
  // Büküm siparişi detayını getir
  async getYarnTwistingOrderById(id: number): Promise<TwistingOrder | undefined> {
    try {
      const { twistingOrders, users, machines, yarnTypes, productionSteps } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const [result] = await db.select({
        id: twistingOrders.id,
        productionStepId: twistingOrders.productionStepId,
        machineId: twistingOrders.machineId,
        yarnTypeId: twistingOrders.yarnTypeId,
        twistLevel: twistingOrders.twistLevel,
        yarnCount: twistingOrders.yarnCount,
        twistDirection: twistingOrders.twistDirection,
        twistAmount: twistingOrders.twistAmount,
        quantity: twistingOrders.quantity,
        assignedOperatorId: twistingOrders.assignedOperatorId,
        speed: twistingOrders.speed,
        startTime: twistingOrders.startTime,
        endTime: twistingOrders.endTime,
        status: twistingOrders.status,
        notes: twistingOrders.notes,
        createdAt: twistingOrders.createdAt,
        updatedAt: twistingOrders.updatedAt,
        machineName: machines.name,
        operatorName: users.fullName,
        yarnTypeName: yarnTypes.name,
        processName: productionSteps.processName
      })
      .from(twistingOrders)
      .leftJoin(machines, eq(twistingOrders.machineId, machines.id))
      .leftJoin(users, eq(twistingOrders.assignedOperatorId, users.id))
      .leftJoin(yarnTypes, eq(twistingOrders.yarnTypeId, yarnTypes.id))
      .leftJoin(productionSteps, eq(twistingOrders.productionStepId, productionSteps.id))
      .where(eq(twistingOrders.id, id));
      
      return result as TwistingOrder;
    } catch (error) {
      console.error(`Büküm siparişi (ID: ${id}) alınırken hata:`, error);
      return undefined;
    }
  }
  
  // Yeni büküm siparişi oluştur
  async createYarnTwistingOrder(data: InsertTwistingOrder): Promise<TwistingOrder> {
    try {
      const { twistingOrders } = await import("@shared/schema");
      
      const [result] = await db.insert(twistingOrders)
        .values(data)
        .returning();
      
      return result;
    } catch (error) {
      console.error("Büküm siparişi oluşturulurken hata:", error);
      throw new Error("Büküm siparişi oluşturulamadı");
    }
  }
  
  // Büküm siparişini güncelle
  async updateYarnTwistingOrder(id: number, data: Partial<InsertTwistingOrder>): Promise<TwistingOrder | undefined> {
    try {
      const { twistingOrders } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      // Önce siparişin var olduğunu kontrol et
      const existingOrder = await this.getYarnTwistingOrderById(id);
      if (!existingOrder) {
        return undefined;
      }
      
      const [result] = await db.update(twistingOrders)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(twistingOrders.id, id))
        .returning();
      
      return result;
    } catch (error) {
      console.error(`Büküm siparişi (ID: ${id}) güncellenirken hata:`, error);
      throw new Error("Büküm siparişi güncellenemedi");
    }
  }
  
  // Büküm siparişi durumunu güncelle
  async updateYarnTwistingOrderStatus(id: number, status: string): Promise<TwistingOrder | undefined> {
    try {
      const { twistingOrders } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      // Önce siparişin var olduğunu kontrol et
      const existingOrder = await this.getYarnTwistingOrderById(id);
      if (!existingOrder) {
        return undefined;
      }
      
      // Durum değişikliğine göre ek alanları güncelle
      const updateData: any = { status, updatedAt: new Date() };
      
      if (status === "in-progress" && !existingOrder.startTime) {
        updateData.startTime = new Date();
      } else if (status === "completed" && !existingOrder.endTime) {
        updateData.endTime = new Date();
      }
      
      const [result] = await db.update(twistingOrders)
        .set(updateData)
        .where(eq(twistingOrders.id, id))
        .returning();
      
      return result;
    } catch (error) {
      console.error(`Büküm siparişi durumu (ID: ${id}) güncellenirken hata:`, error);
      throw new Error("Büküm siparişi durumu güncellenemedi");
    }
  }
  
  // Departmana göre makineleri getir
  async getMachinesByDepartment(departmentId: number): Promise<any[]> {
    try {
      const { machines } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const results = await db.select()
        .from(machines)
        .where(eq(machines.departmentId, departmentId));
      
      return results;
    } catch (error) {
      console.error(`Departmana (ID: ${departmentId}) göre makineler alınırken hata:`, error);
      return [];
    }
  }
  
  // Proses tipine göre üretim adımlarını getir
  async getProductionStepsByProcessType(processTypeId: number): Promise<any[]> {
    try {
      const { productionSteps } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const results = await db.select()
        .from(productionSteps)
        .where(eq(productionSteps.processTypeId, processTypeId));
      
      return results;
    } catch (error) {
      console.error(`Proses tipine (ID: ${processTypeId}) göre üretim adımları alınırken hata:`, error);
      return [];
    }
  }

  // Etiket Yönetimi Fonksiyonları
  
  // Labels tablosu için etiket yönetimi
  
  // Tüm etiketleri getir
  async getAllLabels(): Promise<Label[]> {
    try {
      const { labels } = await import("@shared/schema");
      const { asc } = await import("drizzle-orm");
      
      return await db.select()
        .from(labels)
        .orderBy(asc(labels.name));
    } catch (error) {
      console.error("Etiketler alınırken hata:", error);
      throw new Error("Etiket listesi alınamadı");
    }
  }
  
  // ID'ye göre etiket getir
  async getLabelById(id: number): Promise<Label | undefined> {
    try {
      const { labels } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const [label] = await db.select()
        .from(labels)
        .where(eq(labels.id, id));
        
      return label;
    } catch (error) {
      console.error(`Etiket (ID: ${id}) alınırken hata:`, error);
      throw new Error("Etiket alınamadı");
    }
  }
  
  // Departmana göre etiketleri getir
  async getLabelsByDepartment(departmentId: number): Promise<Label[]> {
    try {
      const { labels } = await import("@shared/schema");
      const { eq, asc } = await import("drizzle-orm");
      
      return await db.select()
        .from(labels)
        .where(eq(labels.departmentId, departmentId))
        .orderBy(asc(labels.name));
    } catch (error) {
      console.error(`Departmana (ID: ${departmentId}) göre etiketler alınırken hata:`, error);
      return [];
    }
  }
  
  // Yeni etiket oluştur
  async createLabel(data: InsertLabel & {createdBy?: number}): Promise<Label> {
    try {
      const { labels } = await import("@shared/schema");
      const timestamp = new Date();
      
      const [result] = await db.insert(labels)
        .values({
          ...data,
          createdAt: timestamp,
          updatedAt: timestamp
        })
        .returning();
        
      return result;
    } catch (error) {
      console.error("Etiket oluşturulurken hata:", error);
      throw new Error("Etiket oluşturulamadı");
    }
  }
  
  // Etiketi güncelle
  async updateLabel(id: number, data: Partial<InsertLabel> & {updatedBy?: number}): Promise<Label | undefined> {
    try {
      const { labels } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const [result] = await db.update(labels)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(labels.id, id))
        .returning();
        
      return result;
    } catch (error) {
      console.error(`Etiket (ID: ${id}) güncellenirken hata:`, error);
      throw new Error("Etiket güncellenemedi");
    }
  }
  
  // Etiketi sil
  async deleteLabel(id: number): Promise<boolean> {
    try {
      const { labels } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      await db.delete(labels)
        .where(eq(labels.id, id));
        
      return true;
    } catch (error) {
      console.error(`Etiket (ID: ${id}) silinirken hata:`, error);
      throw new Error("Etiket silinemedi");
    }
  }
  
  // Etiket yazdırma kaydı oluştur
  async createLabelPrintRecord(data: {labelId: number, userId?: number, quantity: number, data?: Record<string, any>}): Promise<any> {
    try {
      const { labels, labelPrints } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      // Etiketi kontrol et
      const [label] = await db.select()
        .from(labels)
        .where(eq(labels.id, data.labelId));
        
      if (!label) {
        throw new Error("Yazdırılmak istenen etiket bulunamadı");
      }
      
      // Yazdırma kaydını oluştur
      const [result] = await db.insert(labelPrints)
        .values({
          labelTypeId: data.labelId, // labels tablosundaki ID'yi kullanıyoruz
          userId: data.userId,
          quantity: data.quantity,
          data: data.data || {},
          printedAt: new Date()
        })
        .returning();
        
      return {
        id: result.id,
        labelId: result.labelTypeId,
        quantity: result.quantity,
        data: result.data,
        createdAt: result.printedAt
      };
    } catch (error) {
      console.error("Etiket yazdırma kaydı oluşturulurken hata:", error);
      throw new Error("Etiket yazdırma kaydı oluşturulamadı");
    }
  }
  
  // LabelTypes tablosu için etiket yönetimi
  
  // Tüm etiket tiplerini getir
  async getLabelTypes(): Promise<LabelType[]> {
    try {
      return await db.select()
        .from(labelTypes)
        .orderBy(asc(labelTypes.name));
    } catch (error) {
      console.error("Etiket tipleri alınırken hata:", error);
      return [];
    }
  }
  
  // Departmana göre etiket tiplerini getir
  async getLabelTypesByDepartment(departmentId: number): Promise<LabelType[]> {
    try {
      return await db.select()
        .from(labelTypes)
        .where(eq(labelTypes.departmentId, departmentId))
        .orderBy(asc(labelTypes.name));
    } catch (error) {
      console.error(`Departmana (ID: ${departmentId}) göre etiket tipleri alınırken hata:`, error);
      return [];
    }
  }
  
  // ID'ye göre etiket tipini getir
  async getLabelTypeById(id: number): Promise<LabelType | undefined> {
    try {
      const [labelType] = await db.select()
        .from(labelTypes)
        .where(eq(labelTypes.id, id));
      
      return labelType;
    } catch (error) {
      console.error(`Etiket tipi (ID: ${id}) alınırken hata:`, error);
      return undefined;
    }
  }
  
  // Yeni etiket tipi oluştur
  async createLabelType(data: InsertLabelType): Promise<LabelType> {
    try {
      const [result] = await db.insert(labelTypes)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return result;
    } catch (error) {
      console.error("Etiket tipi oluşturulurken hata:", error);
      throw new Error("Etiket tipi oluşturulamadı");
    }
  }
  
  // Etiket tipini güncelle
  async updateLabelType(id: number, data: Partial<InsertLabelType>): Promise<LabelType | undefined> {
    try {
      const [result] = await db.update(labelTypes)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(labelTypes.id, id))
        .returning();
      
      return result;
    } catch (error) {
      console.error(`Etiket tipi (ID: ${id}) güncellenirken hata:`, error);
      return undefined;
    }
  }
  
  // Etiket tipini sil
  async deleteLabelType(id: number): Promise<boolean> {
    try {
      const result = await db.delete(labelTypes)
        .where(eq(labelTypes.id, id));
      
      return true;
    } catch (error) {
      console.error(`Etiket tipi (ID: ${id}) silinirken hata:`, error);
      return false;
    }
  }
  
  // Etiket yazdırma geçmişini getir
  async getLabelPrintHistory(options?: { userId?: number; labelTypeId?: number; limit?: number }): Promise<LabelPrint[]> {
    try {
      let query = db.select({
        id: labelPrints.id,
        labelTypeId: labelPrints.labelTypeId,
        userId: labelPrints.userId,
        data: labelPrints.data,
        quantity: labelPrints.quantity,
        printedAt: labelPrints.printedAt,
        relatedEntityType: labelPrints.relatedEntityType,
        relatedEntityId: labelPrints.relatedEntityId,
        labelTypeName: labelTypes.name,
        userName: users.fullName
      })
      .from(labelPrints)
      .leftJoin(labelTypes, eq(labelPrints.labelTypeId, labelTypes.id))
      .leftJoin(users, eq(labelPrints.userId, users.id));
      
      if (options) {
        if (options.userId) {
          query = query.where(eq(labelPrints.userId, options.userId));
        }
        
        if (options.labelTypeId) {
          query = query.where(eq(labelPrints.labelTypeId, options.labelTypeId));
        }
      }
      
      const limit = options?.limit || 100;
      
      const results = await query
        .orderBy(desc(labelPrints.printedAt))
        .limit(limit);
      
      return results as LabelPrint[];
    } catch (error) {
      console.error("Etiket yazdırma geçmişi alınırken hata:", error);
      return [];
    }
  }
  
  // Departman bazlı etiket yazdırma geçmişini getir
  async getLabelPrintHistoryByDepartment(departmentId: number, options?: { limit?: number }): Promise<LabelPrint[]> {
    try {
      // Önce departmana ait etiketleri bul
      const departmentLabels = await db
        .select({ id: labelTypes.id })
        .from(labelTypes)
        .where(eq(labelTypes.departmentId, departmentId));
      
      // Departmana ait etiket ID'lerini çıkar
      const labelTypeIds = departmentLabels.map(label => label.id);
      
      // Eğer departmana ait etiket yoksa boş dizi döndür
      if (labelTypeIds.length === 0) {
        return [];
      }
      
      // Bu etiketlere ait yazdırma geçmişini getir
      let query = db.select({
        id: labelPrints.id,
        labelTypeId: labelPrints.labelTypeId,
        userId: labelPrints.userId,
        data: labelPrints.data,
        quantity: labelPrints.quantity,
        printedAt: labelPrints.printedAt,
        relatedEntityType: labelPrints.relatedEntityType,
        relatedEntityId: labelPrints.relatedEntityId,
        labelTypeName: labelTypes.name,
        userName: users.fullName
      })
      .from(labelPrints)
      .leftJoin(labelTypes, eq(labelPrints.labelTypeId, labelTypes.id))
      .leftJoin(users, eq(labelPrints.userId, users.id))
      .where(inArray(labelPrints.labelTypeId, labelTypeIds));
      
      const limit = options?.limit || 100;
      
      const results = await query
        .orderBy(desc(labelPrints.printedAt))
        .limit(limit);
      
      return results as LabelPrint[];
    } catch (error) {
      console.error(`Departman (${departmentId}) için etiket yazdırma geçmişi alınırken hata:`, error);
      return [];
    }
  }
  
  // Yeni etiket yazdırma kaydı oluştur
  async createLabelPrint(data: InsertLabelPrint & { userId: number }): Promise<LabelPrint> {
    try {
      const [result] = await db.insert(labelPrints)
        .values({
          ...data,
          printedAt: new Date()
        })
        .returning();
      
      return result;
    } catch (error) {
      console.error("Etiket yazdırma kaydı oluşturulurken hata:", error);
      throw new Error("Etiket yazdırma kaydı oluşturulamadı");
    }
  }

  // Üretim Takip ve Refakat Kartları İşlemleri
  // --------------------------------------------

  /**
   * Tüm üretim refakat kartlarını getirir
   */
  async getProductionCards(filters?: Record<string, any>): Promise<ProductionCard[]> {
    try {
      // Üretim kartları için ürün özelleştirilmiş metodu kullan
      const { getProductionCards } = await import("./production-tracking");
      return await getProductionCards(filters);
    } catch (error) {
      console.error("Üretim kartları alınırken hata oluştu:", error);
      throw error;
    }
  }

  /**
   * ID'ye göre üretim refakat kartı getirir
   */
  async getProductionCardById(id: number): Promise<ProductionCard | undefined> {
    try {
      const { getProductionCardById } = await import("./production-tracking");
      return await getProductionCardById(id);
    } catch (error) {
      console.error(`ID:${id} kartı alınırken hata oluştu:`, error);
      throw error;
    }
  }

  /**
   * Barkod numarasına göre üretim refakat kartı getirir
   */
  async getProductionCardByBarcode(barcode: string): Promise<ProductionCard | undefined> {
    try {
      const { getProductionCardByBarcode } = await import("./production-tracking");
      return await getProductionCardByBarcode(barcode);
    } catch (error) {
      console.error(`Barkod:${barcode} kartı alınırken hata oluştu:`, error);
      throw error;
    }
  }

  /**
   * Yeni üretim refakat kartı oluşturur
   */
  async createProductionCard(card: InsertProductionCard): Promise<ProductionCard> {
    try {
      const { createProductionCard } = await import("./production-tracking");
      const newCard = await createProductionCard(card);
      
      // Refakat kartı oluşturma aktivitesini kaydet
      await this.recordActivity({
        type: "production_card_created",
        description: `Yeni refakat kartı oluşturuldu (Kart No: ${newCard.cardNo})`,
        userId: card.createdBy || 1,
        userName: "Sistem", // Gerçek kullanıcı adı sonradan eklenecek
        entityId: newCard.id,
        entityType: "production_card",
      });
      
      return newCard;
    } catch (error) {
      console.error("Üretim kartı oluşturulurken hata oluştu:", error);
      throw error;
    }
  }

  /**
   * Mevcut üretim refakat kartını günceller
   */
  async updateProductionCard(id: number, data: Partial<ProductionCard>): Promise<ProductionCard | undefined> {
    try {
      const { updateProductionCard } = await import("./production-tracking");
      const updatedCard = await updateProductionCard(id, data);
      
      if (updatedCard) {
        // Refakat kartı güncelleme aktivitesini kaydet
        await this.recordActivity({
          type: "production_card_updated",
          description: `Refakat kartı güncellendi (Kart No: ${updatedCard.cardNo})`,
          userId: data.updatedBy || 1,
          userName: "Sistem", // Gerçek kullanıcı adı sonradan eklenecek
          entityId: id,
          entityType: "production_card",
        });
      }
      
      return updatedCard;
    } catch (error) {
      console.error(`ID:${id} kartı güncellenirken hata oluştu:`, error);
      throw error;
    }
  }

  /**
   * Üretim refakat kartını siler
   */
  async deleteProductionCard(id: number): Promise<boolean> {
    try {
      const { deleteProductionCard } = await import("./production-tracking");
      return await deleteProductionCard(id);
    } catch (error) {
      console.error(`ID:${id} kartı silinirken hata oluştu:`, error);
      throw error;
    }
  }

  /**
   * Belirli bir refakat kartına ait hareketleri getirir
   */
  async getProductionCardMovementsByCardId(cardId: number): Promise<CardMovement[]> {
    try {
      const { getProductionCardMovementsByCardId } = await import("./production-tracking");
      return await getProductionCardMovementsByCardId(cardId);
    } catch (error) {
      console.error(`Kart ID:${cardId} hareketleri alınırken hata oluştu:`, error);
      throw error;
    }
  }

  /**
   * Yeni bir refakat kartı hareketi kaydeder
   */
  async createProductionCardMovement(movement: InsertCardMovement): Promise<CardMovement> {
    try {
      const { createProductionCardMovement } = await import("./production-tracking");
      const newMovement = await createProductionCardMovement(movement);
      
      // İlgili kartı da güncelle - departman ve durumu güncelle
      if (movement.departmentId && movement.type === 'department_change') {
        const { updateProductionCard } = await import("./production-tracking");
        await updateProductionCard(movement.productionCardId, {
          currentDepartmentId: movement.departmentId,
          updatedBy: movement.userId,
          updatedAt: new Date()
        });
      }
      
      // Hareket tipine göre, üretim kartının durumunu güncelle
      if (movement.type === 'status_change' && movement.details) {
        const details = movement.details as { status?: string };
        if (details.status) {
          const { updateProductionCard } = await import("./production-tracking");
          await updateProductionCard(movement.productionCardId, {
            status: details.status,
            updatedBy: movement.userId,
            updatedAt: new Date()
          });
        }
      }
      
      // Hareket kaydı aktivitesini kaydet
      await this.recordActivity({
        type: "production_card_movement",
        description: `Refakat kartı hareketi kaydedildi (Tür: ${movement.type})`,
        userId: movement.userId,
        userName: "Kullanıcı", // Gerçek kullanıcı adı sonradan eklenecek
        entityId: newMovement.id,
        entityType: "production_card_movement",
      });
      
      return newMovement;
    } catch (error) {
      console.error("Kart hareketi eklenirken hata oluştu:", error);
      throw error;
    }
  }

  /**
   * Üretim durumlarına göre istatistikleri getirir
   */
  async getProductionCardStatsByStatus(): Promise<Record<string, number>> {
    try {
      const { getProductionCardStatsByStatus } = await import("./production-tracking");
      return await getProductionCardStatsByStatus();
    } catch (error) {
      console.error("Üretim kartı istatistikleri alınırken hata oluştu:", error);
      throw error;
    }
  }

  /**
   * Departmanlara göre üretim istatistiklerini getirir
   */
  async getProductionCardStatsByDepartment(): Promise<any[]> {
    try {
      const { getProductionCardStatsByDepartment } = await import("./production-tracking");
      return await getProductionCardStatsByDepartment();
    } catch (error) {
      console.error("Departman bazlı istatistikler alınırken hata oluştu:", error);
      throw error;
    }
  }

  /**
   * Tarih aralığına göre üretim trendlerini getirir
   */
  async getProductionCardTrendsByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const { getProductionCardTrendsByDateRange } = await import("./production-tracking");
      return await getProductionCardTrendsByDateRange(startDate, endDate);
    } catch (error) {
      console.error("Üretim trendi verileri alınırken hata oluştu:", error);
      throw error;
    }
  }

  /**
   * Üretim performans metriklerini getirir
   */
  async getProductionPerformanceMetrics(): Promise<any> {
    try {
      const { getProductionPerformanceMetrics } = await import("./production-tracking");
      return await getProductionPerformanceMetrics();
    } catch (error) {
      console.error("Performans metrikleri alınırken hata oluştu:", error);
      throw error;
    }
  }
}