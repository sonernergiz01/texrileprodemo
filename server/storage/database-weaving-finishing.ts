import { DatabaseStorage } from "./database";
import { db } from "../db";
import { eq, and, sql, desc, asc, isNull, isNotNull } from "drizzle-orm";

// Dokuma ve terbiye/apre modülü için veri tipleri
interface WeavingOrder {
  id: number;
  orderNumber: string;
  productionPlanId?: number;
  departmentId: number;
  fabricTypeId?: number;
  machineId?: number;
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  status: string;
  quantity: number;
  unit: string;
  warpYarnId?: number;
  weftYarnId?: number;
  reedCount?: number;
  density?: string;
  width?: number;
  assignedOperatorId?: number;
  notes?: string;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
}

interface InsertWeavingOrder {
  orderNumber?: string;
  productionPlanId?: number;
  departmentId: number;
  fabricTypeId?: number;
  machineId?: number;
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  status?: string;
  quantity: number;
  unit?: string;
  warpYarnId?: number;
  weftYarnId?: number;
  reedCount?: number;
  density?: string;
  width?: number;
  assignedOperatorId?: number;
  notes?: string;
  createdById: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface WeavingOperation {
  id: number;
  weavingOrderId: number;
  machineId: number;
  operationType: string;
  startTime?: Date;
  endTime?: Date;
  status: string;
  speed?: number;
  efficiency?: number;
  producedQuantity?: number;
  defectCount: number;
  operatorId?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InsertWeavingOperation {
  weavingOrderId: number;
  machineId: number;
  operationType: string;
  startTime?: Date;
  endTime?: Date;
  status?: string;
  speed?: number;
  efficiency?: number;
  producedQuantity?: number;
  defectCount?: number;
  operatorId?: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface WeavingDefect {
  id: number;
  weavingOperationId: number;
  defectType: string;
  position?: string;
  severity?: string;
  meter?: number;
  width?: number;
  length?: number;
  area?: number;
  notes?: string;
  createdAt: Date;
  createdById?: number;
}

interface InsertWeavingDefect {
  weavingOperationId: number;
  defectType: string;
  position?: string;
  severity?: string;
  meter?: number;
  width?: number;
  length?: number;
  area?: number;
  notes?: string;
  createdAt?: Date;
  createdById?: number;
}

interface FinishingProcess {
  id: number;
  processCode: string;
  processType: string;
  departmentId: number;
  sourceId?: number;
  sourceType?: string;
  fabricTypeId?: number;
  quantity: number;
  unit: string;
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  status: string;
  recipeId?: number;
  parameters?: any;
  assignedOperatorId?: number;
  notes?: string;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
}

interface InsertFinishingProcess {
  processCode?: string;
  processType: string;
  departmentId: number;
  sourceId?: number;
  sourceType?: string;
  fabricTypeId?: number;
  quantity: number;
  unit?: string;
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  status?: string;
  recipeId?: number;
  parameters?: any;
  assignedOperatorId?: number;
  notes?: string;
  createdById: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FinishingOperation {
  id: number;
  processId: number;
  machineId?: number;
  operationType: string;
  sequence?: number;
  startTime?: Date;
  endTime?: Date;
  status: string;
  parameters?: any;
  recipeId?: number;
  dosage?: any;
  temperature?: number;
  duration?: number;
  operatorId?: number;
  notes?: string;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
}

interface InsertFinishingOperation {
  processId: number;
  machineId?: number;
  operationType: string;
  sequence?: number;
  startTime?: Date;
  endTime?: Date;
  status?: string;
  parameters?: any;
  recipeId?: number;
  dosage?: any;
  temperature?: number;
  duration?: number;
  operatorId?: number;
  notes?: string;
  createdById: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FinishingQualityTest {
  id: number;
  operationId: number;
  testType: string;
  value: number;
  unit: string;
  result: string;
  notes?: string;
  createdById: number;
  createdAt: Date;
}

interface InsertFinishingQualityTest {
  operationId: number;
  testType: string;
  value: number;
  unit: string;
  result: string;
  notes?: string;
  createdById: number;
  createdAt?: Date;
}

interface FinishingRecipe {
  id: number;
  name: string;
  processType: string;
  description?: string;
  ingredients?: any[];
  parameters?: any;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
}

interface InsertFinishingRecipe {
  name: string;
  processType: string;
  description?: string;
  ingredients?: any[];
  parameters?: any;
  createdById: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProcessTransfer {
  id: number;
  sourceDepartmentId: number;
  sourceProcessId: number;
  sourceProcessType: string;
  targetDepartmentId: number;
  targetProcessId?: number;
  targetProcessType: string;
  quantity: number;
  unit: string;
  transferDate: Date;
  status: string;
  notes?: string;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
}

interface InsertProcessTransfer {
  sourceDepartmentId: number;
  sourceProcessId: number;
  sourceProcessType: string;
  targetDepartmentId: number;
  targetProcessId?: number;
  targetProcessType: string;
  quantity: number;
  unit: string;
  transferDate?: Date;
  status?: string;
  notes?: string;
  createdById: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DatabaseWeavingFinishingExtension extends DatabaseStorage {
  // DOKUMA İŞLEMLERİ
  // ================================
  
  // Dokuma siparişlerini getir
  async getWeavingOrders(filters: Record<string, any> = {}): Promise<WeavingOrder[]> {
    let query = db.selectFrom('weaving_orders');
    
    // Filtreler uygula
    if (filters.departmentId) {
      query = query.where(eq('weaving_orders.department_id', filters.departmentId));
    }
    
    if (filters.status) {
      query = query.where(eq('weaving_orders.status', filters.status));
    }
    
    if (filters.startDate && filters.endDate) {
      query = query.where(and(
        gte('weaving_orders.planned_start_date', new Date(filters.startDate)),
        lte('weaving_orders.planned_end_date', new Date(filters.endDate))
      ));
    }
    
    if (filters.machineId) {
      query = query.where(eq('weaving_orders.machine_id', filters.machineId));
    }
    
    if (filters.fabricTypeId) {
      query = query.where(eq('weaving_orders.fabric_type_id', filters.fabricTypeId));
    }
    
    return await query
      .orderBy(desc('weaving_orders.created_at'))
      .execute()
      .then(rows => rows.map(row => this.mapWeavingOrderFromDb(row)));
  }
  
  // Dokuma siparişini ID'ye göre getir
  async getWeavingOrderById(id: number): Promise<WeavingOrder | undefined> {
    const result = await db.selectFrom('weaving_orders')
      .where(eq('weaving_orders.id', id))
      .execute();
    
    if (result.length === 0) return undefined;
    return this.mapWeavingOrderFromDb(result[0]);
  }
  
  // Yeni dokuma siparişi oluştur
  async createWeavingOrder(data: InsertWeavingOrder): Promise<WeavingOrder> {
    // Sipariş numarası oluştur (eğer verilmemişse)
    if (!data.orderNumber) {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      
      // Son sipariş numarasını bul
      const lastOrders = await db.selectFrom('weaving_orders')
        .orderBy(desc('weaving_orders.id'))
        .limit(1)
        .execute();
      
      const lastId = lastOrders.length > 0 ? lastOrders[0].id : 0;
      const orderNum = (lastId + 1).toString().padStart(3, '0');
      
      data.orderNumber = `W${year}${month}${orderNum}`;
    }
    
    const now = new Date();
    
    const result = await db.insertInto('weaving_orders')
      .values({
        order_number: data.orderNumber,
        production_plan_id: data.productionPlanId ?? null,
        department_id: data.departmentId,
        fabric_type_id: data.fabricTypeId ?? null,
        machine_id: data.machineId ?? null,
        planned_start_date: data.plannedStartDate,
        planned_end_date: data.plannedEndDate,
        actual_start_date: data.actualStartDate ?? null,
        actual_end_date: data.actualEndDate ?? null,
        status: data.status ?? 'planned',
        quantity: data.quantity,
        unit: data.unit ?? 'metre',
        warp_yarn_id: data.warpYarnId ?? null,
        weft_yarn_id: data.weftYarnId ?? null,
        reed_count: data.reedCount ?? null,
        density: data.density ?? null,
        width: data.width ?? null,
        assigned_operator_id: data.assignedOperatorId ?? null,
        notes: data.notes ?? null,
        created_by_id: data.createdById,
        created_at: data.createdAt ?? now,
        updated_at: data.updatedAt ?? now
      })
      .returning('*')
      .execute();
    
    return this.mapWeavingOrderFromDb(result[0]);
  }
  
  // Dokuma siparişini güncelle
  async updateWeavingOrder(id: number, data: Partial<InsertWeavingOrder>): Promise<WeavingOrder | undefined> {
    const updateData: Record<string, any> = {};
    
    // Güncelleme verilerini hazırla
    if (data.orderNumber !== undefined) updateData.order_number = data.orderNumber;
    if (data.productionPlanId !== undefined) updateData.production_plan_id = data.productionPlanId;
    if (data.departmentId !== undefined) updateData.department_id = data.departmentId;
    if (data.fabricTypeId !== undefined) updateData.fabric_type_id = data.fabricTypeId;
    if (data.machineId !== undefined) updateData.machine_id = data.machineId;
    if (data.plannedStartDate !== undefined) updateData.planned_start_date = data.plannedStartDate;
    if (data.plannedEndDate !== undefined) updateData.planned_end_date = data.plannedEndDate;
    if (data.actualStartDate !== undefined) updateData.actual_start_date = data.actualStartDate;
    if (data.actualEndDate !== undefined) updateData.actual_end_date = data.actualEndDate;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.warpYarnId !== undefined) updateData.warp_yarn_id = data.warpYarnId;
    if (data.weftYarnId !== undefined) updateData.weft_yarn_id = data.weftYarnId;
    if (data.reedCount !== undefined) updateData.reed_count = data.reedCount;
    if (data.density !== undefined) updateData.density = data.density;
    if (data.width !== undefined) updateData.width = data.width;
    if (data.assignedOperatorId !== undefined) updateData.assigned_operator_id = data.assignedOperatorId;
    if (data.notes !== undefined) updateData.notes = data.notes;
    
    // Her zaman güncelleme tarihi ekle
    updateData.updated_at = new Date();
    
    const result = await db.updateTable('weaving_orders')
      .set(updateData)
      .where(eq('weaving_orders.id', id))
      .returning('*')
      .execute();
    
    if (result.length === 0) return undefined;
    return this.mapWeavingOrderFromDb(result[0]);
  }
  
  // Dokuma siparişi durumunu güncelle
  async updateWeavingOrderStatus(id: number, status: string): Promise<WeavingOrder | undefined> {
    // Eğer durum "in-progress" ise ve daha önce başlangıç tarihi ayarlanmamışsa ayarla
    let actualStartDate = null;
    let actualEndDate = null;
    
    if (status === 'in-progress') {
      actualStartDate = await this.getWeavingOrderActualStartDate(id);
      if (!actualStartDate) {
        actualStartDate = new Date();
      }
    }
    
    // Eğer durum "completed" ise ve bitiş tarihi ayarlanmamışsa ayarla
    if (status === 'completed') {
      actualEndDate = new Date();
    }
    
    const result = await db.updateTable('weaving_orders')
      .set({
        status: status,
        actual_start_date: actualStartDate ? actualStartDate : undefined,
        actual_end_date: actualEndDate ? actualEndDate : undefined,
        updated_at: new Date()
      })
      .where(eq('weaving_orders.id', id))
      .returning('*')
      .execute();
    
    if (result.length === 0) return undefined;
    return this.mapWeavingOrderFromDb(result[0]);
  }
  
  // Dokuma siparişinin gerçek başlangıç tarihini getir
  private async getWeavingOrderActualStartDate(id: number): Promise<Date | null> {
    const order = await db.selectFrom('weaving_orders')
      .select('actual_start_date')
      .where(eq('weaving_orders.id', id))
      .execute();
    
    if (order.length === 0 || !order[0].actual_start_date) return null;
    return new Date(order[0].actual_start_date);
  }
  
  // Bir dokuma siparişine ait tüm operasyonları getir
  async getWeavingOperationsByOrder(orderId: number): Promise<WeavingOperation[]> {
    const operations = await db.selectFrom('weaving_operations')
      .where(eq('weaving_operations.weaving_order_id', orderId))
      .orderBy(asc('weaving_operations.start_time'))
      .execute();
    
    return operations.map(op => this.mapWeavingOperationFromDb(op));
  }
  
  // Yeni dokuma operasyonu oluştur
  async createWeavingOperation(data: InsertWeavingOperation): Promise<WeavingOperation> {
    const now = new Date();
    
    const result = await db.insertInto('weaving_operations')
      .values({
        weaving_order_id: data.weavingOrderId,
        machine_id: data.machineId,
        operation_type: data.operationType,
        start_time: data.startTime ?? null,
        end_time: data.endTime ?? null,
        status: data.status ?? 'pending',
        speed: data.speed ?? null,
        efficiency: data.efficiency ?? null,
        produced_quantity: data.producedQuantity ?? null,
        defect_count: data.defectCount ?? 0,
        operator_id: data.operatorId ?? null,
        notes: data.notes ?? null,
        created_at: data.createdAt ?? now,
        updated_at: data.updatedAt ?? now
      })
      .returning('*')
      .execute();
    
    return this.mapWeavingOperationFromDb(result[0]);
  }
  
  // Dokuma operasyonunu güncelle
  async updateWeavingOperation(id: number, data: Partial<InsertWeavingOperation>): Promise<WeavingOperation | undefined> {
    const updateData: Record<string, any> = {};
    
    // Güncelleme verilerini hazırla
    if (data.machineId !== undefined) updateData.machine_id = data.machineId;
    if (data.operationType !== undefined) updateData.operation_type = data.operationType;
    if (data.startTime !== undefined) updateData.start_time = data.startTime;
    if (data.endTime !== undefined) updateData.end_time = data.endTime;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.speed !== undefined) updateData.speed = data.speed;
    if (data.efficiency !== undefined) updateData.efficiency = data.efficiency;
    if (data.producedQuantity !== undefined) updateData.produced_quantity = data.producedQuantity;
    if (data.operatorId !== undefined) updateData.operator_id = data.operatorId;
    if (data.notes !== undefined) updateData.notes = data.notes;
    
    // Her zaman güncelleme tarihi ekle
    updateData.updated_at = new Date();
    
    const result = await db.updateTable('weaving_operations')
      .set(updateData)
      .where(eq('weaving_operations.id', id))
      .returning('*')
      .execute();
    
    if (result.length === 0) return undefined;
    return this.mapWeavingOperationFromDb(result[0]);
  }
  
  // Dokuma kusurlarını operasyon ID'sine göre getir
  async getWeavingDefectsByOperation(operationId: number): Promise<WeavingDefect[]> {
    const defects = await db.selectFrom('weaving_defects')
      .where(eq('weaving_defects.weaving_operation_id', operationId))
      .orderBy(desc('weaving_defects.created_at'))
      .execute();
    
    return defects.map(defect => this.mapWeavingDefectFromDb(defect));
  }
  
  // Yeni dokuma kusuru ekle
  async createWeavingDefect(data: InsertWeavingDefect): Promise<WeavingDefect> {
    const now = new Date();
    
    // Kusur alanını hesapla (eğer genişlik ve uzunluk verilmişse)
    let area = null;
    if (data.width && data.length) {
      area = data.width * data.length;
    }
    
    const result = await db.insertInto('weaving_defects')
      .values({
        weaving_operation_id: data.weavingOperationId,
        defect_type: data.defectType,
        position: data.position ?? null,
        severity: data.severity ?? 'minor',
        meter: data.meter ?? null,
        width: data.width ?? null,
        length: data.length ?? null,
        area: area ?? data.area ?? null,
        notes: data.notes ?? null,
        created_at: data.createdAt ?? now,
        created_by_id: data.createdById ?? null
      })
      .returning('*')
      .execute();
    
    // Operasyonun kusur sayacını arttır
    await this.incrementWeavingOperationDefectCount(data.weavingOperationId);
    
    return this.mapWeavingDefectFromDb(result[0]);
  }
  
  // Dokuma operasyonunun kusur sayacını arttır
  async incrementWeavingOperationDefectCount(operationId: number): Promise<void> {
    await db.executeQuery(sql`
      UPDATE weaving_operations 
      SET defect_count = defect_count + 1, updated_at = NOW() 
      WHERE id = ${operationId}
    `);
  }
  
  // TERBİYE/APRE İŞLEMLERİ
  // ================================
  
  // Terbiye/apre süreçlerini getir
  async getFinishingProcesses(filters: Record<string, any> = {}): Promise<FinishingProcess[]> {
    let query = db.selectFrom('finishing_processes');
    
    // Filtreler uygula
    if (filters.departmentId) {
      query = query.where(eq('finishing_processes.department_id', filters.departmentId));
    }
    
    if (filters.status) {
      query = query.where(eq('finishing_processes.status', filters.status));
    }
    
    if (filters.processType) {
      query = query.where(eq('finishing_processes.process_type', filters.processType));
    }
    
    if (filters.startDate && filters.endDate) {
      query = query.where(and(
        gte('finishing_processes.planned_start_date', new Date(filters.startDate)),
        lte('finishing_processes.planned_end_date', new Date(filters.endDate))
      ));
    }
    
    return await query
      .orderBy(desc('finishing_processes.created_at'))
      .execute()
      .then(rows => rows.map(row => this.mapFinishingProcessFromDb(row)));
  }
  
  // Terbiye/apre sürecini ID'ye göre getir
  async getFinishingProcessById(id: number): Promise<FinishingProcess | undefined> {
    const result = await db.selectFrom('finishing_processes')
      .where(eq('finishing_processes.id', id))
      .execute();
    
    if (result.length === 0) return undefined;
    return this.mapFinishingProcessFromDb(result[0]);
  }
  
  // Yeni terbiye/apre süreci oluştur
  async createFinishingProcess(data: InsertFinishingProcess): Promise<FinishingProcess> {
    // Süreç kodu oluştur (eğer verilmemişse)
    if (!data.processCode) {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      
      // Son süreç numarasını bul
      const lastProcesses = await db.selectFrom('finishing_processes')
        .orderBy(desc('finishing_processes.id'))
        .limit(1)
        .execute();
      
      const lastId = lastProcesses.length > 0 ? lastProcesses[0].id : 0;
      const processNum = (lastId + 1).toString().padStart(3, '0');
      
      // Proses tipine göre kod ön eki
      const typePrefix = data.processType.substring(0, 1).toUpperCase();
      data.processCode = `F${typePrefix}${year}${month}${processNum}`;
    }
    
    const now = new Date();
    
    const result = await db.insertInto('finishing_processes')
      .values({
        process_code: data.processCode,
        process_type: data.processType,
        department_id: data.departmentId,
        source_id: data.sourceId ?? null,
        source_type: data.sourceType ?? null,
        fabric_type_id: data.fabricTypeId ?? null,
        quantity: data.quantity,
        unit: data.unit ?? 'metre',
        planned_start_date: data.plannedStartDate,
        planned_end_date: data.plannedEndDate,
        actual_start_date: data.actualStartDate ?? null,
        actual_end_date: data.actualEndDate ?? null,
        status: data.status ?? 'planned',
        recipe_id: data.recipeId ?? null,
        parameters: data.parameters ? JSON.stringify(data.parameters) : '{}',
        assigned_operator_id: data.assignedOperatorId ?? null,
        notes: data.notes ?? null,
        created_by_id: data.createdById,
        created_at: data.createdAt ?? now,
        updated_at: data.updatedAt ?? now
      })
      .returning('*')
      .execute();
    
    return this.mapFinishingProcessFromDb(result[0]);
  }
  
  // Terbiye/apre sürecini güncelle
  async updateFinishingProcess(id: number, data: Partial<InsertFinishingProcess>): Promise<FinishingProcess | undefined> {
    const updateData: Record<string, any> = {};
    
    // Güncelleme verilerini hazırla
    if (data.processCode !== undefined) updateData.process_code = data.processCode;
    if (data.processType !== undefined) updateData.process_type = data.processType;
    if (data.departmentId !== undefined) updateData.department_id = data.departmentId;
    if (data.sourceId !== undefined) updateData.source_id = data.sourceId;
    if (data.sourceType !== undefined) updateData.source_type = data.sourceType;
    if (data.fabricTypeId !== undefined) updateData.fabric_type_id = data.fabricTypeId;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.plannedStartDate !== undefined) updateData.planned_start_date = data.plannedStartDate;
    if (data.plannedEndDate !== undefined) updateData.planned_end_date = data.plannedEndDate;
    if (data.actualStartDate !== undefined) updateData.actual_start_date = data.actualStartDate;
    if (data.actualEndDate !== undefined) updateData.actual_end_date = data.actualEndDate;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.recipeId !== undefined) updateData.recipe_id = data.recipeId;
    if (data.parameters !== undefined) updateData.parameters = data.parameters ? JSON.stringify(data.parameters) : '{}';
    if (data.assignedOperatorId !== undefined) updateData.assigned_operator_id = data.assignedOperatorId;
    if (data.notes !== undefined) updateData.notes = data.notes;
    
    // Her zaman güncelleme tarihi ekle
    updateData.updated_at = new Date();
    
    const result = await db.updateTable('finishing_processes')
      .set(updateData)
      .where(eq('finishing_processes.id', id))
      .returning('*')
      .execute();
    
    if (result.length === 0) return undefined;
    return this.mapFinishingProcessFromDb(result[0]);
  }
  
  // Terbiye/apre süreci durumunu güncelle
  async updateFinishingProcessStatus(id: number, status: string): Promise<FinishingProcess | undefined> {
    // Eğer durum "in-progress" ise ve daha önce başlangıç tarihi ayarlanmamışsa ayarla
    let actualStartDate = null;
    let actualEndDate = null;
    
    if (status === 'in-progress') {
      actualStartDate = await this.getFinishingProcessActualStartDate(id);
      if (!actualStartDate) {
        actualStartDate = new Date();
      }
    }
    
    // Eğer durum "completed" ise ve bitiş tarihi ayarlanmamışsa ayarla
    if (status === 'completed') {
      actualEndDate = new Date();
    }
    
    const result = await db.updateTable('finishing_processes')
      .set({
        status: status,
        actual_start_date: actualStartDate ? actualStartDate : undefined,
        actual_end_date: actualEndDate ? actualEndDate : undefined,
        updated_at: new Date()
      })
      .where(eq('finishing_processes.id', id))
      .returning('*')
      .execute();
    
    if (result.length === 0) return undefined;
    return this.mapFinishingProcessFromDb(result[0]);
  }
  
  // Terbiye/apre sürecinin gerçek başlangıç tarihini getir
  private async getFinishingProcessActualStartDate(id: number): Promise<Date | null> {
    const process = await db.selectFrom('finishing_processes')
      .select('actual_start_date')
      .where(eq('finishing_processes.id', id))
      .execute();
    
    if (process.length === 0 || !process[0].actual_start_date) return null;
    return new Date(process[0].actual_start_date);
  }
  
  // Bir terbiye/apre sürecine ait tüm operasyonları getir
  async getFinishingOperationsByProcess(processId: number): Promise<FinishingOperation[]> {
    const operations = await db.selectFrom('finishing_operations')
      .where(eq('finishing_operations.process_id', processId))
      .orderBy(asc('finishing_operations.sequence'))
      .execute();
    
    return operations.map(op => this.mapFinishingOperationFromDb(op));
  }
  
  // Yeni terbiye/apre operasyonu oluştur
  async createFinishingOperation(data: InsertFinishingOperation): Promise<FinishingOperation> {
    const now = new Date();
    
    const result = await db.insertInto('finishing_operations')
      .values({
        process_id: data.processId,
        machine_id: data.machineId ?? null,
        operation_type: data.operationType,
        sequence: data.sequence ?? 1,
        start_time: data.startTime ?? null,
        end_time: data.endTime ?? null,
        status: data.status ?? 'planned',
        parameters: data.parameters ? JSON.stringify(data.parameters) : '{}',
        recipe_id: data.recipeId ?? null,
        dosage: data.dosage ? JSON.stringify(data.dosage) : '{}',
        temperature: data.temperature ?? null,
        duration: data.duration ?? null,
        operator_id: data.operatorId ?? null,
        notes: data.notes ?? null,
        created_by_id: data.createdById,
        created_at: data.createdAt ?? now,
        updated_at: data.updatedAt ?? now
      })
      .returning('*')
      .execute();
    
    return this.mapFinishingOperationFromDb(result[0]);
  }
  
  // Terbiye/apre operasyonunu güncelle
  async updateFinishingOperation(id: number, data: Partial<InsertFinishingOperation>): Promise<FinishingOperation | undefined> {
    const updateData: Record<string, any> = {};
    
    // Güncelleme verilerini hazırla
    if (data.machineId !== undefined) updateData.machine_id = data.machineId;
    if (data.operationType !== undefined) updateData.operation_type = data.operationType;
    if (data.sequence !== undefined) updateData.sequence = data.sequence;
    if (data.startTime !== undefined) updateData.start_time = data.startTime;
    if (data.endTime !== undefined) updateData.end_time = data.endTime;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.parameters !== undefined) updateData.parameters = data.parameters ? JSON.stringify(data.parameters) : '{}';
    if (data.recipeId !== undefined) updateData.recipe_id = data.recipeId;
    if (data.dosage !== undefined) updateData.dosage = data.dosage ? JSON.stringify(data.dosage) : '{}';
    if (data.temperature !== undefined) updateData.temperature = data.temperature;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.operatorId !== undefined) updateData.operator_id = data.operatorId;
    if (data.notes !== undefined) updateData.notes = data.notes;
    
    // Her zaman güncelleme tarihi ekle
    updateData.updated_at = new Date();
    
    const result = await db.updateTable('finishing_operations')
      .set(updateData)
      .where(eq('finishing_operations.id', id))
      .returning('*')
      .execute();
    
    if (result.length === 0) return undefined;
    return this.mapFinishingOperationFromDb(result[0]);
  }
  
  // Terbiye/apre operasyonu durumunu güncelle
  async updateFinishingOperationStatus(id: number, status: string): Promise<FinishingOperation | undefined> {
    // Eğer durum "in-progress" ise başlangıç zamanını ayarla
    let startTime = null;
    let endTime = null;
    
    if (status === 'in-progress') {
      const operation = await db.selectFrom('finishing_operations')
        .select('start_time')
        .where(eq('finishing_operations.id', id))
        .execute();
      
      if (operation.length > 0 && !operation[0].start_time) {
        startTime = new Date();
      }
    }
    
    // Eğer durum "completed" ise bitiş zamanını ayarla
    if (status === 'completed') {
      endTime = new Date();
    }
    
    const result = await db.updateTable('finishing_operations')
      .set({
        status: status,
        start_time: startTime ? startTime : undefined,
        end_time: endTime ? endTime : undefined,
        updated_at: new Date()
      })
      .where(eq('finishing_operations.id', id))
      .returning('*')
      .execute();
    
    if (result.length === 0) return undefined;
    return this.mapFinishingOperationFromDb(result[0]);
  }
  
  // Bir operasyona ait tüm kalite ölçüm sonuçlarını getir
  async getFinishingQualityTestsByOperation(operationId: number): Promise<FinishingQualityTest[]> {
    const tests = await db.selectFrom('finishing_quality_tests')
      .where(eq('finishing_quality_tests.operation_id', operationId))
      .orderBy(desc('finishing_quality_tests.created_at'))
      .execute();
    
    return tests.map(test => this.mapFinishingQualityTestFromDb(test));
  }
  
  // Yeni kalite ölçüm sonucu ekle
  async createFinishingQualityTest(data: InsertFinishingQualityTest): Promise<FinishingQualityTest> {
    const now = new Date();
    
    const result = await db.insertInto('finishing_quality_tests')
      .values({
        operation_id: data.operationId,
        test_type: data.testType,
        value: data.value,
        unit: data.unit,
        result: data.result,
        notes: data.notes ?? null,
        created_by_id: data.createdById,
        created_at: data.createdAt ?? now
      })
      .returning('*')
      .execute();
    
    return this.mapFinishingQualityTestFromDb(result[0]);
  }
  
  // Terbiye/apre reçetelerini getir
  async getFinishingRecipes(filters: Record<string, any> = {}): Promise<FinishingRecipe[]> {
    let query = db.selectFrom('finishing_recipes');
    
    // Filtreler uygula
    if (filters.processType) {
      query = query.where(eq('finishing_recipes.process_type', filters.processType));
    }
    
    if (filters.name) {
      query = query.where(like('finishing_recipes.name', `%${filters.name}%`));
    }
    
    return await query
      .orderBy(asc('finishing_recipes.name'))
      .execute()
      .then(rows => rows.map(row => this.mapFinishingRecipeFromDb(row)));
  }
  
  // Yeni terbiye/apre reçetesi oluştur
  async createFinishingRecipe(data: InsertFinishingRecipe): Promise<FinishingRecipe> {
    const now = new Date();
    
    const result = await db.insertInto('finishing_recipes')
      .values({
        name: data.name,
        process_type: data.processType,
        description: data.description ?? null,
        ingredients: data.ingredients ? JSON.stringify(data.ingredients) : '[]',
        parameters: data.parameters ? JSON.stringify(data.parameters) : '{}',
        created_by_id: data.createdById,
        created_at: data.createdAt ?? now,
        updated_at: data.updatedAt ?? now
      })
      .returning('*')
      .execute();
    
    return this.mapFinishingRecipeFromDb(result[0]);
  }
  
  // Terbiye/apre reçetesini güncelle
  async updateFinishingRecipe(id: number, data: Partial<InsertFinishingRecipe>): Promise<FinishingRecipe | undefined> {
    const updateData: Record<string, any> = {};
    
    // Güncelleme verilerini hazırla
    if (data.name !== undefined) updateData.name = data.name;
    if (data.processType !== undefined) updateData.process_type = data.processType;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.ingredients !== undefined) updateData.ingredients = data.ingredients ? JSON.stringify(data.ingredients) : '[]';
    if (data.parameters !== undefined) updateData.parameters = data.parameters ? JSON.stringify(data.parameters) : '{}';
    
    // Her zaman güncelleme tarihi ekle
    updateData.updated_at = new Date();
    
    const result = await db.updateTable('finishing_recipes')
      .set(updateData)
      .where(eq('finishing_recipes.id', id))
      .returning('*')
      .execute();
    
    if (result.length === 0) return undefined;
    return this.mapFinishingRecipeFromDb(result[0]);
  }
  
  // İŞLEM TRANSFERLERİ
  // ================================
  
  // Yeni süreç transferi oluştur
  async createProcessTransfer(data: InsertProcessTransfer): Promise<ProcessTransfer> {
    const now = new Date();
    
    const result = await db.insertInto('process_transfers')
      .values({
        source_department_id: data.sourceDepartmentId,
        source_process_id: data.sourceProcessId,
        source_process_type: data.sourceProcessType,
        target_department_id: data.targetDepartmentId,
        target_process_id: data.targetProcessId ?? null,
        target_process_type: data.targetProcessType,
        quantity: data.quantity,
        unit: data.unit,
        transfer_date: data.transferDate ?? now,
        status: data.status ?? 'pending',
        notes: data.notes ?? null,
        created_by_id: data.createdById,
        created_at: data.createdAt ?? now,
        updated_at: data.updatedAt ?? now
      })
      .returning('*')
      .execute();
    
    return this.mapProcessTransferFromDb(result[0]);
  }
  
  // Süreç transferini güncelle
  async updateProcessTransfer(id: number, data: Partial<InsertProcessTransfer>): Promise<ProcessTransfer | undefined> {
    const updateData: Record<string, any> = {};
    
    // Güncelleme verilerini hazırla
    if (data.targetProcessId !== undefined) updateData.target_process_id = data.targetProcessId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    
    // Her zaman güncelleme tarihi ekle
    updateData.updated_at = new Date();
    
    const result = await db.updateTable('process_transfers')
      .set(updateData)
      .where(eq('process_transfers.id', id))
      .returning('*')
      .execute();
    
    if (result.length === 0) return undefined;
    return this.mapProcessTransferFromDb(result[0]);
  }
  
  // Transfer işlemini ID'ye göre getir
  async getProcessTransferById(id: number): Promise<ProcessTransfer | undefined> {
    const result = await db.selectFrom('process_transfers')
      .where(eq('process_transfers.id', id))
      .execute();
    
    if (result.length === 0) return undefined;
    return this.mapProcessTransferFromDb(result[0]);
  }
  
  // Departmana göre transferleri getir (gelen veya giden)
  async getProcessTransfersByDepartment(
    departmentId: number, 
    direction: 'incoming' | 'outgoing' | 'both' = 'both'
  ): Promise<ProcessTransfer[]> {
    let query = db.selectFrom('process_transfers');
    
    if (direction === 'incoming') {
      query = query.where(eq('process_transfers.target_department_id', departmentId));
    } else if (direction === 'outgoing') {
      query = query.where(eq('process_transfers.source_department_id', departmentId));
    } else {
      query = query.where(or(
        eq('process_transfers.source_department_id', departmentId),
        eq('process_transfers.target_department_id', departmentId)
      ));
    }
    
    const transfers = await query
      .orderBy(desc('process_transfers.transfer_date'))
      .execute();
    
    return transfers.map(transfer => this.mapProcessTransferFromDb(transfer));
  }
  
  // YARDIMCI MAPPER FONKSİYONLARI
  // ================================
  
  private mapWeavingOrderFromDb(row: any): WeavingOrder {
    return {
      id: row.id,
      orderNumber: row.order_number,
      productionPlanId: row.production_plan_id,
      departmentId: row.department_id,
      fabricTypeId: row.fabric_type_id,
      machineId: row.machine_id,
      plannedStartDate: new Date(row.planned_start_date),
      plannedEndDate: new Date(row.planned_end_date),
      actualStartDate: row.actual_start_date ? new Date(row.actual_start_date) : undefined,
      actualEndDate: row.actual_end_date ? new Date(row.actual_end_date) : undefined,
      status: row.status,
      quantity: row.quantity,
      unit: row.unit,
      warpYarnId: row.warp_yarn_id,
      weftYarnId: row.weft_yarn_id,
      reedCount: row.reed_count,
      density: row.density,
      width: row.width,
      assignedOperatorId: row.assigned_operator_id,
      notes: row.notes,
      createdById: row.created_by_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
  
  private mapWeavingOperationFromDb(row: any): WeavingOperation {
    return {
      id: row.id,
      weavingOrderId: row.weaving_order_id,
      machineId: row.machine_id,
      operationType: row.operation_type,
      startTime: row.start_time ? new Date(row.start_time) : undefined,
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      status: row.status,
      speed: row.speed,
      efficiency: row.efficiency,
      producedQuantity: row.produced_quantity,
      defectCount: row.defect_count,
      operatorId: row.operator_id,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
  
  private mapWeavingDefectFromDb(row: any): WeavingDefect {
    return {
      id: row.id,
      weavingOperationId: row.weaving_operation_id,
      defectType: row.defect_type,
      position: row.position,
      severity: row.severity,
      meter: row.meter,
      width: row.width,
      length: row.length,
      area: row.area,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      createdById: row.created_by_id
    };
  }
  
  private mapFinishingProcessFromDb(row: any): FinishingProcess {
    return {
      id: row.id,
      processCode: row.process_code,
      processType: row.process_type,
      departmentId: row.department_id,
      sourceId: row.source_id,
      sourceType: row.source_type,
      fabricTypeId: row.fabric_type_id,
      quantity: row.quantity,
      unit: row.unit,
      plannedStartDate: new Date(row.planned_start_date),
      plannedEndDate: new Date(row.planned_end_date),
      actualStartDate: row.actual_start_date ? new Date(row.actual_start_date) : undefined,
      actualEndDate: row.actual_end_date ? new Date(row.actual_end_date) : undefined,
      status: row.status,
      recipeId: row.recipe_id,
      parameters: row.parameters ? JSON.parse(row.parameters) : {},
      assignedOperatorId: row.assigned_operator_id,
      notes: row.notes,
      createdById: row.created_by_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
  
  private mapFinishingOperationFromDb(row: any): FinishingOperation {
    return {
      id: row.id,
      processId: row.process_id,
      machineId: row.machine_id,
      operationType: row.operation_type,
      sequence: row.sequence,
      startTime: row.start_time ? new Date(row.start_time) : undefined,
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      status: row.status,
      parameters: row.parameters ? JSON.parse(row.parameters) : {},
      recipeId: row.recipe_id,
      dosage: row.dosage ? JSON.parse(row.dosage) : {},
      temperature: row.temperature,
      duration: row.duration,
      operatorId: row.operator_id,
      notes: row.notes,
      createdById: row.created_by_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
  
  private mapFinishingQualityTestFromDb(row: any): FinishingQualityTest {
    return {
      id: row.id,
      operationId: row.operation_id,
      testType: row.test_type,
      value: row.value,
      unit: row.unit,
      result: row.result,
      notes: row.notes,
      createdById: row.created_by_id,
      createdAt: new Date(row.created_at)
    };
  }
  
  private mapFinishingRecipeFromDb(row: any): FinishingRecipe {
    return {
      id: row.id,
      name: row.name,
      processType: row.process_type,
      description: row.description,
      ingredients: row.ingredients ? JSON.parse(row.ingredients) : [],
      parameters: row.parameters ? JSON.parse(row.parameters) : {},
      createdById: row.created_by_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
  
  private mapProcessTransferFromDb(row: any): ProcessTransfer {
    return {
      id: row.id,
      sourceDepartmentId: row.source_department_id,
      sourceProcessId: row.source_process_id,
      sourceProcessType: row.source_process_type,
      targetDepartmentId: row.target_department_id,
      targetProcessId: row.target_process_id,
      targetProcessType: row.target_process_type,
      quantity: row.quantity,
      unit: row.unit,
      transferDate: new Date(row.transfer_date),
      status: row.status,
      notes: row.notes,
      createdById: row.created_by_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}