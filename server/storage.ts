import { 
  users, 
  roles,
  departments,
  userRoles,
  permissions,
  rolePermissions,
  fabricTypes,
  yarnTypes,
  rawMaterials,
  customers,
  orderStatuses,
  orders,
  customerInteractions,
  opportunities,
  processTypes,
  machineTypes,
  machines,
  productionPlans,
  productionSteps,
  productionRouteTemplates,
  productionRouteTemplateSteps,
  productionCards,
  trackingEvents,
  maintenanceRequests,
  maintenanceActivities,
  notifications,
  qualityFabricRolls,
  qualityFabricDefects,
  qualitySystems,
  qualityDefectCodes,
  qualityScoringCriteria,
  qualityMeasurementDevices,
  yarnInventory,
  yarnMovements,
  yarnIssueCards,
  weaveProductionCards,
  weaveCardTrackingEvents,
  fabricSamples,
  fabricSampleApprovals,
  fabricSwatches,
  colorSwatches,
  collections,
  colorCategories,
  colorFamilies,
  fabricColorRelations,
  sampleRequests,
  sampleOrders,
  sampleProductionSteps,
  sampleCards,
  labelTypes,
  labelPrints,
  sampleCardMovements,
  sampleFeedback,
  type User,
  type Role,
  type Department,
  type InsertUser,
  type InsertRole,
  type InsertDepartment,
  type InsertFabricType,
  type InsertYarnType,
  type InsertRawMaterial,
  type InsertCustomer,
  type InsertOrderStatus,
  type InsertOrder,
  type InsertCustomerInteraction,
  type InsertOpportunity,
  type InsertProcessType,
  type InsertMachineType,
  type InsertMachine,
  type InsertProductionPlan,
  type InsertProductionStep,
  type FabricType,
  type YarnType,
  type RawMaterial,
  type Customer,
  type OrderStatus,
  type Order,
  type CustomerInteraction,
  type Opportunity,
  type ProcessType,
  type MachineType,
  type Machine,
  type ProductionPlan,
  type ProductionStep,
  type ProductionRouteTemplate,
  type ProductionRouteTemplateStep,
  type InsertProductionRouteTemplate,
  type InsertProductionRouteTemplateStep,
  type ProductionCard,
  type InsertProductionCard,
  type TrackingEvent,
  type InsertTrackingEvent,
  type MaintenanceRequest,
  type InsertMaintenanceRequest,
  type MaintenanceActivity,
  type InsertMaintenanceActivity,
  type Notification,
  type InsertNotification,
  type QualityFabricRoll,
  type InsertQualityFabricRoll,
  type QualityFabricDefect,
  type InsertQualityFabricDefect,
  type QualitySystem,
  type InsertQualitySystem,
  type QualityDefectCode,
  type InsertQualityDefectCode,
  type QualityScoringCriteria,
  type InsertQualityScoringCriteria,
  type QualityMeasurementDevice,
  type InsertQualityMeasurementDevice,
  type YarnInventory,
  type InsertYarnInventory,
  type YarnMovement,
  type InsertYarnMovement,
  type YarnIssueCard,
  type InsertYarnIssueCard,
  type WeaveProductionCard,
  type InsertWeaveProductionCard,
  type WeaveCardTrackingEvent,
  type InsertWeaveCardTrackingEvent,
  type FabricSample,
  type InsertFabricSample,
  type FabricSampleApproval,
  type InsertFabricSampleApproval,
  type FabricSwatch,
  type InsertFabricSwatch,
  type ColorSwatch,
  type InsertColorSwatch,
  type Collection,
  type InsertCollection,
  type ColorCategory,
  type InsertColorCategory,
  type ColorFamily,
  type InsertColorFamily,
  type FabricColorRelation,
  type InsertFabricColorRelation,
  type SampleRequest,
  type InsertSampleRequest,
  type SampleOrder,
  type InsertSampleOrder,
  type SampleProductionStep,
  type InsertSampleProductionStep,
  type SampleCard,
  type InsertSampleCard,
  type SampleCardMovement,
  type InsertSampleCardMovement,
  type SampleFeedback,
  type InsertSampleFeedback
} from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;

  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  updateUserStatus(id: number, isActive: boolean): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getUsersByDepartmentId(departmentId: number): Promise<User[]>;
  
  // Numune Bölümü (Sample Module)
  getSampleRequests(options?: { customerId?: number; status?: string; }): Promise<SampleRequest[]>;
  getSampleRequestById(id: number): Promise<SampleRequest | undefined>;
  createSampleRequest(data: InsertSampleRequest): Promise<SampleRequest>;
  updateSampleRequest(id: number, data: Partial<InsertSampleRequest>): Promise<SampleRequest | undefined>;
  
  getSampleOrders(options?: { sampleRequestId?: number; status?: string; }): Promise<SampleOrder[]>;
  getSampleOrderById(id: number): Promise<SampleOrder | undefined>;
  createSampleOrder(data: InsertSampleOrder): Promise<SampleOrder>;
  updateSampleOrder(id: number, data: Partial<InsertSampleOrder>): Promise<SampleOrder | undefined>;
  updateSampleOrderStatus(id: number, status: string): Promise<SampleOrder | undefined>;
  
  getSampleProductionSteps(sampleOrderId: number): Promise<SampleProductionStep[]>;
  getSampleProductionStepById(id: number): Promise<SampleProductionStep | undefined>;
  createSampleProductionStep(data: InsertSampleProductionStep): Promise<SampleProductionStep>;
  updateSampleProductionStep(id: number, data: Partial<InsertSampleProductionStep>): Promise<SampleProductionStep | undefined>;
  updateSampleProductionStepStatus(id: number, status: string): Promise<SampleProductionStep | undefined>;
  
  getSampleCards(sampleOrderId: number): Promise<SampleCard[]>;
  getSampleCardById(id: number): Promise<SampleCard | undefined>;
  getSampleCardByBarcode(barcode: string): Promise<SampleCard | undefined>;
  createSampleCard(data: InsertSampleCard): Promise<SampleCard>;
  updateSampleCard(id: number, data: Partial<InsertSampleCard>): Promise<SampleCard | undefined>;
  
  getSampleCardMovements(sampleCardId: number): Promise<SampleCardMovement[]>;
  createSampleCardMovement(data: InsertSampleCardMovement): Promise<SampleCardMovement>;
  completeSampleCardMovement(id: number, data: { endTime: Date; notes?: string; defects?: any[] }): Promise<SampleCardMovement | undefined>;
  
  getSampleFeedback(sampleOrderId: number): Promise<SampleFeedback[]>;
  getSampleFeedbackById(id: number): Promise<SampleFeedback | undefined>;
  createSampleFeedback(data: InsertSampleFeedback): Promise<SampleFeedback>;
  updateSampleFeedback(id: number, data: Partial<InsertSampleFeedback>): Promise<SampleFeedback | undefined>;

  // Bildirim yönetimi
  getUserNotifications(userId: number, options?: { showArchived?: boolean, limit?: number, type?: string }): Promise<Notification[]>;
  getNotificationById(id: number): Promise<Notification | undefined>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  archiveNotification(id: number): Promise<Notification | undefined>;
  
  // Etiket yönetimi - labels tablosu
  getAllLabels(): Promise<Label[]>;
  getLabelById(id: number): Promise<Label | undefined>;
  getLabelsByDepartment(departmentId: number): Promise<Label[]>;
  createLabel(data: InsertLabel & {createdBy?: number}): Promise<Label>;
  updateLabel(id: number, data: Partial<InsertLabel> & {updatedBy?: number}): Promise<Label | undefined>;
  deleteLabel(id: number): Promise<boolean>;
  createLabelPrintRecord(data: {labelId: number, userId?: number, quantity: number, data?: Record<string, any>}): Promise<any>;
  
  // Sevkiyat işlemleri
  getShipments(filters?: Record<string, any>): Promise<Shipment[]>;
  getShipmentById(id: number): Promise<Shipment | undefined>;
  getShipmentItemsByShipmentId(id: number): Promise<any[]>;
  createShipment(shipment: InsertShipment): Promise<Shipment>;
  updateShipment(id: number, shipment: Partial<Shipment>): Promise<Shipment>;
  deleteShipment(id: number): Promise<void>;
  deleteShipmentItemsByShipmentId(id: number): Promise<void>;
  
  // Raporlar
  getWarehouseStockReport(): Promise<any[]>;
  getWarehouseMovementsReport(): Promise<any[]>;
  getWarehouseSupplierReport(): Promise<any[]>;
  getWarehouseMetrics(): Promise<any>;
  
  // Etiket Yönetimi
  getLabelTypes(): Promise<LabelType[]>;
  getLabelTypesByDepartment(departmentId: number): Promise<LabelType[]>;
  getLabelTypeById(id: number): Promise<LabelType | undefined>;
  createLabelType(data: InsertLabelType): Promise<LabelType>;
  updateLabelType(id: number, data: Partial<InsertLabelType>): Promise<LabelType | undefined>;
  deleteLabelType(id: number): Promise<boolean>;
  
  getLabelPrintHistory(options?: { userId?: number; labelTypeId?: number; limit?: number }): Promise<LabelPrint[]>;
  createLabelPrint(data: InsertLabelPrint & { userId: number }): Promise<LabelPrint>;
  
  // Password handling
  hashPassword(password: string): Promise<string>;
  comparePasswords(supplied: string, stored: string): Promise<boolean>;

  // Role management
  getRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  getUserRoles(userId: number): Promise<Role[]>;
  getUsersByRole(roleIdentifier: number | string): Promise<User[]>;
  assignRoleToUser(userId: number, roleId: number): Promise<void>;
  
  // Department management
  getDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  assignUserToDepartment(userId: number, departmentId: number): Promise<void>;
  
  // Permission management
  getPermissions(): Promise<any[]>;
  createPermission(permission: { code: string, description: string }): Promise<any>;
  getUserPermissions(userId: number): Promise<any[]>;
  assignPermissionToRole(roleId: number, permissionId: number): Promise<void>;
  hasPermission(userId: number, permissionCode: string): Promise<boolean>;

  // Fabric types
  getFabricTypes(): Promise<FabricType[]>;
  createFabricType(fabricType: InsertFabricType): Promise<FabricType>;
  
  // Yarn types
  getYarnTypes(): Promise<YarnType[]>;
  createYarnType(yarnType: InsertYarnType): Promise<YarnType>;
  
  // Raw materials
  getRawMaterials(): Promise<RawMaterial[]>;
  createRawMaterial(rawMaterial: InsertRawMaterial): Promise<RawMaterial>;
  
  // Customers
  getCustomers(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  
  // Barkod Sistemi - Dokuma Üretim Kartları
  getWeaveProductionCards(): Promise<WeaveProductionCard[]>;
  getWeaveProductionCardById(id: number): Promise<WeaveProductionCard | undefined>;
  createWeaveProductionCard(card: InsertWeaveProductionCard): Promise<WeaveProductionCard>;
  updateWeaveProductionCardStatus(id: number, status: string): Promise<WeaveProductionCard | undefined>;
  
  // Barkod Sistemi - Dokuma Kart İzleme Olayları
  getWeaveCardTrackingEvents(cardId: number): Promise<WeaveCardTrackingEvent[]>;
  createWeaveCardTrackingEvent(event: InsertWeaveCardTrackingEvent): Promise<WeaveCardTrackingEvent>;
  
  // Barkod Sistemi - İplik Depo Çıkış Kartları
  getYarnIssueCards(): Promise<YarnIssueCard[]>;
  getYarnIssueCardById(id: number): Promise<YarnIssueCard | undefined>;
  createYarnIssueCard(card: InsertYarnIssueCard): Promise<YarnIssueCard>;
  updateYarnIssueCardStatus(id: number, status: string): Promise<YarnIssueCard | undefined>;
  
  // İplik Envanter Yönetimi
  getYarnInventory(): Promise<YarnInventory[]>;
  updateYarnInventory(yarnTypeId: number, quantity: number): Promise<YarnInventory | undefined>;
  getYarnMovements(): Promise<YarnMovement[]>;
  createYarnMovement(movement: InsertYarnMovement): Promise<YarnMovement>;
  
  // Barkod Sistemi - Kumaş Numuneleri
  getFabricSamples(): Promise<FabricSample[]>;
  getFabricSampleById(id: number): Promise<FabricSample | undefined>;
  createFabricSample(sample: InsertFabricSample): Promise<FabricSample>;
  updateFabricSampleStatus(id: number, status: string): Promise<FabricSample | undefined>;
  getFabricSampleApprovals(sampleId: number): Promise<FabricSampleApproval[]>;
  createFabricSampleApproval(approval: InsertFabricSampleApproval): Promise<FabricSampleApproval>;
  
  // Kartela Sistemi - Kumaş Kartelaları
  getFabricSwatches(): Promise<FabricSwatch[]>;
  getFabricSwatchById(id: number): Promise<FabricSwatch | undefined>;
  getFabricSwatchByBarcodeNumber(barcodeNumber: string): Promise<FabricSwatch | undefined>;
  createFabricSwatch(data: InsertFabricSwatch): Promise<FabricSwatch>;
  updateFabricSwatch(id: number, data: Partial<FabricSwatch>): Promise<FabricSwatch>;
  deleteFabricSwatch(id: number): Promise<FabricSwatch>;
  
  // Kartela Sistemi - Renk Kartelaları
  getColorSwatches(): Promise<ColorSwatch[]>;
  getColorSwatchById(id: number): Promise<ColorSwatch | undefined>;
  getColorSwatchByBarcodeNumber(barcodeNumber: string): Promise<ColorSwatch | undefined>;
  createColorSwatch(data: InsertColorSwatch): Promise<ColorSwatch>;
  updateColorSwatch(id: number, data: Partial<ColorSwatch>): Promise<ColorSwatch>;
  deleteColorSwatch(id: number): Promise<ColorSwatch>;
  
  // Kartela Sistemi - Koleksiyonlar
  getCollections(): Promise<Collection[]>;
  createCollection(data: InsertCollection): Promise<Collection>;
  
  // Kartela Sistemi - Renk Kategorileri
  getColorCategories(): Promise<ColorCategory[]>;
  createColorCategory(data: InsertColorCategory): Promise<ColorCategory>;
  
  // Kartela Sistemi - Renk Aileleri
  getColorFamilies(): Promise<ColorFamily[]>;
  createColorFamily(data: InsertColorFamily): Promise<ColorFamily>;
  
  // Kartela Sistemi - Kumaş-Renk İlişkileri
  getFabricColorRelations(fabricSwatchId: number): Promise<FabricColorRelation[]>;
  createFabricColorRelation(data: InsertFabricColorRelation): Promise<FabricColorRelation>;
  updateFabricColorRelation(id: number, data: Partial<FabricColorRelation>): Promise<FabricColorRelation>;
  deleteFabricColorRelation(id: number): Promise<FabricColorRelation>;
  
  // Order statuses
  getOrderStatuses(): Promise<OrderStatus[]>;
  createOrderStatus(status: InsertOrderStatus): Promise<OrderStatus>;
  
  // Orders
  getOrders(): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(orderId: number, statusId: number): Promise<Order | undefined>;
  getOrderSummary(): Promise<{ pending: number, production: number, shipping: number, completed: number, pendingValue: number, productionValue: number, shippingValue: number, completedValue: number }>;
  
  // Customer Interactions
  getCustomerInteractions(): Promise<CustomerInteraction[]>;
  createCustomerInteraction(interaction: InsertCustomerInteraction): Promise<CustomerInteraction>;
  
  // Opportunities
  getOpportunities(): Promise<Opportunity[]>;
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  
  // Activities
  getRecentActivities(): Promise<any[]>;
  
  // Process Types (Planlama Bölümü)
  getProcessTypes(): Promise<ProcessType[]>;
  createProcessType(processType: InsertProcessType): Promise<ProcessType>;
  
  // Machine Types (Planlama Bölümü)
  getMachineTypes(): Promise<MachineType[]>;
  createMachineType(machineType: InsertMachineType): Promise<MachineType>;
  
  // Machines (Planlama Bölümü)
  getMachines(): Promise<Machine[]>;
  getMachinesByType(typeId: number): Promise<Machine[]>;
  createMachine(machine: InsertMachine): Promise<Machine>;
  
  // Production Plans (Planlama Bölümü)
  getProductionPlans(): Promise<ProductionPlan[]>;
  getProductionPlanById(id: number): Promise<ProductionPlan | undefined>;
  createProductionPlan(plan: InsertProductionPlan): Promise<ProductionPlan>;
  updateProductionPlan(id: number, planData: Partial<ProductionPlan>): Promise<ProductionPlan | undefined>;
  
  // Production Steps (Planlama Bölümü)
  getProductionSteps(planId?: number): Promise<ProductionStep[]>;
  createProductionStep(step: InsertProductionStep): Promise<ProductionStep>;
  updateProductionStep(id: number, stepData: Partial<ProductionStep>): Promise<ProductionStep | undefined>;
  
  // Production Route Templates (Planlama Bölümü - Rota Yönetimi)
  getProductionRouteTemplates(): Promise<ProductionRouteTemplate[]>;
  getProductionRouteTemplateById(id: number): Promise<ProductionRouteTemplate | undefined>;
  createProductionRouteTemplate(template: InsertProductionRouteTemplate): Promise<ProductionRouteTemplate>;
  updateProductionRouteTemplate(id: number, templateData: Partial<ProductionRouteTemplate>): Promise<ProductionRouteTemplate | undefined>;
  deleteProductionRouteTemplate(id: number): Promise<boolean>;
  
  // Production Route Template Steps (Planlama Bölümü - Rota Adımları)
  getProductionRouteTemplateSteps(templateId: number): Promise<ProductionRouteTemplateStep[]>;
  createProductionRouteTemplateStep(step: InsertProductionRouteTemplateStep): Promise<ProductionRouteTemplateStep>;
  updateProductionRouteTemplateStep(id: number, stepData: Partial<ProductionRouteTemplateStep>): Promise<ProductionRouteTemplateStep | undefined>;
  deleteProductionRouteTemplateStep(id: number): Promise<boolean>;
  
  // Apply Route Template to Production Plan
  applyRouteTemplateToProductionPlan(productionPlanId: number, templateId: number, startDate: Date): Promise<ProductionStep[]>;
  
  // Refakat Kartları (Production Cards)
  getProductionCards(filters?: any): Promise<ProductionCard[]>;
  getProductionCardById(id: number): Promise<ProductionCard | undefined>;
  getProductionCardByBarcode(barcodeData: string): Promise<ProductionCard | undefined>;
  createProductionCard(card: InsertProductionCard): Promise<ProductionCard>;
  updateProductionCardStatus(id: number, updateData: any): Promise<ProductionCard | undefined>;
  incrementProductionCardPrintCount(id: number): Promise<ProductionCard | undefined>;
  
  // İzleme Olayları (Tracking Events)
  getTrackingEventsByCardId(cardId: number): Promise<TrackingEvent[]>;
  createTrackingEvent(event: InsertTrackingEvent): Promise<TrackingEvent>;
  getTrackingSummary(): Promise<any>;
  
  // Bakım Talepleri - CMMS
  getMaintenanceRequests(filters?: Record<string, any>): Promise<MaintenanceRequest[]>;
  getMaintenanceRequestById(id: number): Promise<MaintenanceRequest | undefined>;
  createMaintenanceRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest>;
  updateMaintenanceRequest(id: number, requestData: Partial<MaintenanceRequest>): Promise<MaintenanceRequest | undefined>;
  deleteMaintenanceRequest(id: number): Promise<boolean>;
  getMaintenanceStats(): Promise<{ pending: number, inProgress: number, completed: number, critical: number }>;
  getMaintenanceRequestsByDepartment(departmentId: number, targetDepartmentId?: number): Promise<MaintenanceRequest[]>;
  deleteMaintenanceActivities(requestId: number): Promise<boolean>;
  
  // Bakım Aktiviteleri - CMMS
  getMaintenanceActivities(requestId: number): Promise<MaintenanceActivity[]>;
  createMaintenanceActivity(activity: InsertMaintenanceActivity): Promise<MaintenanceActivity>;
  
  // Bakım Planları - CMMS
  getMaintenancePlans(departmentId?: number, status?: string): Promise<MaintenancePlan[]>;
  getMaintenancePlanById(id: number): Promise<MaintenancePlan | undefined>;
  createMaintenancePlan(plan: InsertMaintenancePlan): Promise<MaintenancePlan>;
  updateMaintenancePlan(id: number, planData: Partial<MaintenancePlan>): Promise<MaintenancePlan | undefined>;
  deleteMaintenancePlan(id: number): Promise<boolean>;
  
  // Bakım Plan Detayları - CMMS
  getMaintenancePlanItemsByPlanId(planId: number): Promise<MaintenancePlanItem[]>;
  getMaintenancePlanItemById(id: number): Promise<MaintenancePlanItem | undefined>;
  createMaintenancePlanItem(item: InsertMaintenancePlanItem): Promise<MaintenancePlanItem>;
  updateMaintenancePlanItem(id: number, itemData: Partial<MaintenancePlanItem>): Promise<MaintenancePlanItem | undefined>;
  deleteMaintenancePlanItem(id: number): Promise<boolean>;
  
  // Bakım Görevleri - CMMS
  getMaintenanceTasks(options?: { planItemId?: number, assignedToId?: number, status?: string }): Promise<MaintenanceTask[]>;
  getMaintenanceTaskById(id: number): Promise<MaintenanceTask | undefined>;
  createMaintenanceTask(task: InsertMaintenanceTask): Promise<MaintenanceTask>;
  updateMaintenanceTask(id: number, taskData: Partial<MaintenanceTask>): Promise<MaintenanceTask | undefined>;
  deleteMaintenanceTask(id: number): Promise<boolean>;
  
  // Yedek Parça Yönetimi - CMMS
  getMaintenanceParts(options?: { category?: string, lowStock?: boolean }): Promise<MaintenancePart[]>;
  getMaintenancePartById(id: number): Promise<MaintenancePart | undefined>;
  createMaintenancePart(part: InsertMaintenancePart): Promise<MaintenancePart>;
  updateMaintenancePart(id: number, partData: Partial<MaintenancePart>): Promise<MaintenancePart | undefined>;
  deleteMaintenancePart(id: number): Promise<boolean>;
  
  // Bildirimler
  getUserNotifications(userId: number, options?: { showArchived?: boolean, limit?: number, type?: string }): Promise<Notification[]>;
  getNotificationById(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  archiveNotification(id: number): Promise<Notification | undefined>;
  deleteNotification(id: number): Promise<boolean>;
  
  // Kalite Kontrol için özelleştirilmiş metodlar aşağıda tanımlanmıştır
  // Bkz: 312-351. satırlar
  
  // Kumaş Depo Raporları (Warehouse Reports)
  getWarehouseStockReport(fromDate?: Date, toDate?: Date): Promise<any[]>;
  getWarehouseMovementsReport(fromDate?: Date, toDate?: Date): Promise<any[]>;
  getWarehouseSupplierReport(fromDate?: Date, toDate?: Date): Promise<any[]>;
  getWarehouseMetrics(): Promise<any>;
  
  // İplik Depo Yönetimi
  getYarnInventory(filters?: Record<string, any>): Promise<YarnInventory[]>;
  getYarnInventoryById(id: number): Promise<YarnInventory | undefined>;
  getYarnInventoryByYarnId(yarnId: string): Promise<YarnInventory | undefined>;
  createYarnInventory(inventory: InsertYarnInventory): Promise<YarnInventory>;
  updateYarnInventory(id: number, data: Partial<YarnInventory>): Promise<YarnInventory | undefined>;
  deleteYarnInventory(id: number): Promise<boolean>;
  
  // İplik Hareketleri
  getYarnMovements(filters?: Record<string, any>): Promise<YarnMovement[]>;
  getYarnMovementById(id: number): Promise<YarnMovement | undefined>;
  createYarnMovement(movement: InsertYarnMovement): Promise<YarnMovement>;
  
  // İplik Çıkış Kartları
  getYarnIssueCards(filters?: Record<string, any>): Promise<YarnIssueCard[]>;
  getYarnIssueCardById(id: number): Promise<YarnIssueCard | undefined>;
  getYarnIssueCardByBarcode(barcodeData: string): Promise<YarnIssueCard | undefined>;
  createYarnIssueCard(card: InsertYarnIssueCard): Promise<YarnIssueCard>;
  updateYarnIssueCardStatus(id: number, status: string, departmentId?: number): Promise<YarnIssueCard | undefined>;
  
  // Dokuma Üretim Kartları
  getWeaveProductionCards(filters?: Record<string, any>): Promise<WeaveProductionCard[]>;
  getWeaveProductionCardById(id: number): Promise<WeaveProductionCard | undefined>;
  getWeaveProductionCardByBarcode(barcodeData: string): Promise<WeaveProductionCard | undefined>;
  createWeaveProductionCard(card: InsertWeaveProductionCard): Promise<WeaveProductionCard>;
  updateWeaveProductionCardStatus(id: number, status: string, departmentId?: number): Promise<WeaveProductionCard | undefined>;
  
  // Dokuma Kartı İzleme Olayları
  getWeaveCardTrackingEvents(cardId: number): Promise<WeaveCardTrackingEvent[]>;
  createWeaveCardTrackingEvent(event: InsertWeaveCardTrackingEvent): Promise<WeaveCardTrackingEvent>;
  
  // Kumaş Numuneleri (Kartela)
  getFabricSamples(filters?: Record<string, any>): Promise<FabricSample[]>;
  getFabricSampleById(id: number): Promise<FabricSample | undefined>;
  getFabricSampleByBarcode(barcodeData: string): Promise<FabricSample | undefined>;
  createFabricSample(sample: InsertFabricSample): Promise<FabricSample>;
  updateFabricSampleStatus(id: number, status: string): Promise<FabricSample | undefined>;
  
  // Kumaş Numunesi Onay İşlemleri
  getFabricSampleApprovals(sampleId: number): Promise<FabricSampleApproval[]>;
  createFabricSampleApproval(approval: InsertFabricSampleApproval): Promise<FabricSampleApproval>;
  
  // Kalite Kontrol Modülü
  // Kumaş Topları
  getQualityFabricRolls(filters?: Record<string, any>): Promise<QualityFabricRoll[]>;
  getQualityFabricRollById(id: number): Promise<QualityFabricRoll | undefined>;
  getQualityFabricRollByBarcode(barcode: string): Promise<QualityFabricRoll | undefined>;
  createQualityFabricRoll(roll: InsertQualityFabricRoll): Promise<QualityFabricRoll>;
  updateQualityFabricRoll(id: number, rollData: Partial<QualityFabricRoll>): Promise<QualityFabricRoll | undefined>;
  updateQualityFabricRollStatus(id: number, status: string): Promise<QualityFabricRoll | undefined>;
  deleteQualityFabricRoll(id: number): Promise<boolean>;
  
  // Kumaş Hataları
  getQualityFabricDefects(fabricRollId: number): Promise<QualityFabricDefect[]>;
  getQualityFabricDefectById(id: number): Promise<QualityFabricDefect | undefined>;
  createQualityFabricDefect(defect: InsertQualityFabricDefect): Promise<QualityFabricDefect>;
  updateQualityFabricDefect(id: number, defectData: Partial<QualityFabricDefect>): Promise<QualityFabricDefect | undefined>;
  deleteQualityFabricDefect(id: number): Promise<boolean>;
  
  // Kalite Sistemleri
  getQualitySystems(includeInactive?: boolean): Promise<QualitySystem[]>;
  getQualitySystemById(id: number): Promise<QualitySystem | undefined>;
  createQualitySystem(system: InsertQualitySystem): Promise<QualitySystem>;
  updateQualitySystem(id: number, systemData: Partial<QualitySystem>): Promise<QualitySystem | undefined>;
  deleteQualitySystem(id: number): Promise<boolean>;
  
  // Hata Kodları
  getQualityDefectCodes(includeInactive?: boolean): Promise<QualityDefectCode[]>;
  getQualityDefectCodeById(id: number): Promise<QualityDefectCode | undefined>;
  createQualityDefectCode(code: InsertQualityDefectCode): Promise<QualityDefectCode>;
  updateQualityDefectCode(id: number, codeData: Partial<QualityDefectCode>): Promise<QualityDefectCode | undefined>;
  deleteQualityDefectCode(id: number): Promise<boolean>;
  
  // Ölçüm Cihazları
  getQualityMeasurementDevices(includeInactive?: boolean): Promise<QualityMeasurementDevice[]>;
  getQualityMeasurementDeviceById(id: number): Promise<QualityMeasurementDevice | undefined>;
  createQualityMeasurementDevice(device: InsertQualityMeasurementDevice): Promise<QualityMeasurementDevice>;
  updateQualityMeasurementDevice(id: number, deviceData: Partial<QualityMeasurementDevice>): Promise<QualityMeasurementDevice | undefined>;
  deleteQualityMeasurementDevice(id: number): Promise<boolean>;
  
  // Kalite Kontrol İstatistikleri
  getQualityStats(): Promise<{ totalRolls: number, pendingInspection: number, passedInspection: number, failedInspection: number, totalDefects: number }>;
  
  // Etiket İşlemleri
  getLabels(departmentId?: number): Promise<Label[]>;
  getLabelById(id: number): Promise<Label | undefined>;
  getLabelTypes(departmentId?: number): Promise<LabelType[]>;
  getLabelTypeById(id: number): Promise<LabelType | undefined>;
  createLabel(data: InsertLabel): Promise<Label>;
  updateLabel(id: number, data: Partial<InsertLabel>): Promise<Label | undefined>;
  deleteLabel(id: number): Promise<boolean>;
  createLabelType(data: InsertLabelType): Promise<LabelType>;
  updateLabelType(id: number, data: Partial<InsertLabelType>): Promise<LabelType | undefined>;
  deleteLabelType(id: number): Promise<boolean>;
  
  // Etiket Yazdırma İşlemleri
  getLabelPrintHistory(options?: { userId?: number; labelTypeId?: number; limit?: number }): Promise<LabelPrint[]>;
  getLabelPrintHistoryByDepartment(departmentId: number, options?: { limit?: number }): Promise<LabelPrint[]>;
  createLabelPrintRecord(data: InsertLabelPrint): Promise<LabelPrint>;
  
  // Üretim Takip - Refakat Kartları
  getProductionCards(filters?: Record<string, any>): Promise<ProductionCard[]>;
  getProductionCardById(id: number): Promise<ProductionCard | undefined>;
  getProductionCardByBarcode(barcode: string): Promise<ProductionCard | undefined>;
  createProductionCard(card: InsertProductionCard): Promise<ProductionCard>;
  updateProductionCard(id: number, data: Partial<ProductionCard>): Promise<ProductionCard | undefined>;
  deleteProductionCard(id: number): Promise<boolean>;
  
  // Üretim Takip - Refakat Kartı Hareketleri
  getProductionCardMovementsByCardId(cardId: number): Promise<CardMovement[]>;
  createProductionCardMovement(movement: InsertCardMovement): Promise<CardMovement>;
  
  // Üretim Takip - İstatistikler
  getProductionCardStatsByStatus(): Promise<Record<string, number>>;
  getProductionCardTrendsByDateRange(startDate: Date, endDate: Date): Promise<any[]>;
  getProductionCardStatsByDepartment(): Promise<any[]>;
  getProductionPerformanceMetrics(): Promise<any>;
}

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

export class MemStorage implements IStorage {
  private yarnInventory: Map<number, YarnInventory> = new Map();
  private yarnMovements: Map<number, YarnMovement> = new Map();
  private yarnIssueCards: Map<number, YarnIssueCard> = new Map();
  
  // Departman ID'sine göre kullanıcıları getir
  async getUsersByDepartmentId(departmentId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.departmentId === departmentId);
  }
  
  // İplik envanteri get metodu
  async getYarnInventory(filters?: Record<string, any>): Promise<YarnInventory[]> {
    let inventory = Array.from(this.yarnInventory.values());
    
    // Filtreler varsa uygula
    if (filters) {
      if (filters.status) {
        inventory = inventory.filter(item => item.status === filters.status);
      }
      
      if (filters.supplier) {
        inventory = inventory.filter(item => item.supplier === filters.supplier);
      }
      
      if (filters.yarnType) {
        inventory = inventory.filter(item => item.yarnType === filters.yarnType);
      }
    }
    
    return inventory;
  }
  
  // Bakım Talepleri metodları
  async getMaintenanceRequests(filters: Record<string, any> = {}): Promise<MaintenanceRequest[]> {
    let requests = Array.from(this.maintenanceRequests.values());
    
    // Filtreler varsa uygula
    if (filters.status) {
      requests = requests.filter(r => r.status === filters.status);
    }
    
    if (filters.priority) {
      requests = requests.filter(r => r.priority === filters.priority);
    }
    
    if (filters.requestType) {
      requests = requests.filter(r => r.requestType === filters.requestType);
    }
    
    if (filters.departmentId) {
      requests = requests.filter(r => r.departmentId === filters.departmentId);
    }
    
    if (filters.requesterId) {
      requests = requests.filter(r => r.requesterId === filters.requesterId);
    }
    
    if (filters.assignedToId) {
      requests = requests.filter(r => r.assignedToId === filters.assignedToId);
    }
    
    // Varsayılan olarak en son oluşturulanlar önce
    return requests.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  }
  
  async getMaintenanceRequestById(id: number): Promise<MaintenanceRequest | undefined> {
    return this.maintenanceRequests.get(id);
  }
  
  async createMaintenanceRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest> {
    const id = this.nextIds.maintenanceRequest++;
    const now = new Date();
    const newRequest: MaintenanceRequest = { 
      ...request, 
      id, 
      createdAt: now, 
      updatedAt: now,
      requestDate: now
    };
    
    this.maintenanceRequests.set(id, newRequest);
    
    // Aktivite kaydı
    this.recordActivity({
      type: "maintenance_request_created",
      description: `"${newRequest.title}" başlıklı bakım talebi oluşturuldu`,
      userId: newRequest.requesterId,
      userName: "Kullanıcı", // Gerçek kullanıcı adı alınmalı
      entityId: id,
      entityType: "maintenance_request"
    });
    
    return newRequest;
  }
  
  async updateMaintenanceRequest(id: number, requestData: Partial<MaintenanceRequest>): Promise<MaintenanceRequest | undefined> {
    const request = this.maintenanceRequests.get(id);
    if (!request) return undefined;
    
    // Talebi güncelle
    const updatedRequest = { 
      ...request, 
      ...requestData,
      updatedAt: new Date()
    };
    
    this.maintenanceRequests.set(id, updatedRequest);
    
    // Aktivite kaydı
    this.recordActivity({
      type: "maintenance_request_updated",
      description: `"${updatedRequest.title}" başlıklı bakım talebi güncellendi`,
      userId: 1, // Admin user by default
      userName: "System Administrator",
      entityId: id,
      entityType: "maintenance_request"
    });
    
    return updatedRequest;
  }
  
  async deleteMaintenanceRequest(id: number): Promise<boolean> {
    const request = this.maintenanceRequests.get(id);
    if (!request) return false;
    
    // İlgili aktiviteleri sil
    const activityKeys = Array.from(this.maintenanceActivities.keys())
      .filter(key => this.maintenanceActivities.get(key)?.maintenanceRequestId === id);
    
    for (const key of activityKeys) {
      this.maintenanceActivities.delete(key);
    }
    
    // Talebi sil
    this.maintenanceRequests.delete(id);
    
    // Aktivite kaydı
    this.recordActivity({
      type: "maintenance_request_deleted",
      description: `"${request.title}" başlıklı bakım talebi silindi`,
      userId: 1, // Admin user by default
      userName: "System Administrator",
      entityId: id,
      entityType: "maintenance_request"
    });
    
    return true;
  }
  
  async getMaintenanceStats(): Promise<{ pending: number, inProgress: number, completed: number, critical: number }> {
    const requests = Array.from(this.maintenanceRequests.values());
    
    return {
      pending: requests.filter(r => r.status === "pending").length,
      inProgress: requests.filter(r => r.status === "in-progress").length,
      completed: requests.filter(r => r.status === "completed").length,
      critical: requests.filter(r => r.priority === "critical").length
    };
  }
  
  async getMaintenanceRequestsByDepartment(departmentId: number, targetDepartmentId?: number): Promise<MaintenanceRequest[]> {
    let requests = Array.from(this.maintenanceRequests.values());
    
    // Kendi departmanının talepleri
    if (departmentId) {
      requests = requests.filter(r => r.departmentId === departmentId);
    }
    
    // Hedef departmana atanan talepler
    if (targetDepartmentId) {
      requests = requests.filter(r => r.targetDepartmentId === targetDepartmentId);
    }
    
    // En son oluşturulanlar önce
    return requests.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  }
  
  async deleteMaintenanceActivities(requestId: number): Promise<boolean> {
    const activities = Array.from(this.maintenanceActivities.values())
      .filter(activity => activity.maintenanceRequestId === requestId);
      
    for (const activity of activities) {
      this.maintenanceActivities.delete(activity.id);
    }
    
    return true;
  }
  
  // Bakım Aktiviteleri metodları
  async getMaintenanceActivities(requestId: number): Promise<MaintenanceActivity[]> {
    const activities = Array.from(this.maintenanceActivities.values())
      .filter(activity => activity.maintenanceRequestId === requestId);
    
    // En son oluşturulanlar önce
    return activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async createMaintenanceActivity(activity: InsertMaintenanceActivity): Promise<MaintenanceActivity> {
    const id = this.nextIds.maintenanceActivity++;
    const now = new Date();
    const newActivity: MaintenanceActivity = { 
      ...activity, 
      id, 
      createdAt: now
    };
    
    this.maintenanceActivities.set(id, newActivity);
    
    // Aktivite kaydı
    this.recordActivity({
      type: "maintenance_activity_created",
      description: `Bakım talebi #${activity.maintenanceRequestId} için yeni aktivite eklendi`,
      userId: 1, // Admin user by default
      userName: "System Administrator",
      entityId: id,
      entityType: "maintenance_activity"
    });
    
    return newActivity;
  }
  
  // Bakım Planları - CMMS
  async getMaintenancePlans(departmentId?: number, status?: string): Promise<MaintenancePlan[]> {
    let plans = Array.from(this.maintenancePlans.values());
    
    if (departmentId) {
      plans = plans.filter(plan => plan.departmentId === departmentId);
    }
    
    if (status) {
      plans = plans.filter(plan => plan.status === status);
    }
    
    // En son oluşturulanlar önce
    return plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getMaintenancePlanById(id: number): Promise<MaintenancePlan | undefined> {
    return this.maintenancePlans.get(id);
  }
  
  async createMaintenancePlan(plan: InsertMaintenancePlan): Promise<MaintenancePlan> {
    const id = this.nextIds.maintenancePlan++;
    const now = new Date();
    const newPlan: MaintenancePlan = { 
      ...plan, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    
    this.maintenancePlans.set(id, newPlan);
    
    // Aktivite kaydı
    this.recordActivity({
      type: "maintenance_plan_created",
      description: `"${newPlan.name}" isimli bakım planı oluşturuldu`,
      userId: newPlan.createdById,
      userName: "Kullanıcı", // Gerçek kullanıcı adı alınmalı
      entityId: id,
      entityType: "maintenance_plan"
    });
    
    return newPlan;
  }
  
  async updateMaintenancePlan(id: number, planData: Partial<MaintenancePlan>): Promise<MaintenancePlan | undefined> {
    const plan = this.maintenancePlans.get(id);
    if (!plan) return undefined;
    
    // Planı güncelle
    const updatedPlan = { 
      ...plan, 
      ...planData,
      updatedAt: new Date()
    };
    
    this.maintenancePlans.set(id, updatedPlan);
    
    // Aktivite kaydı
    this.recordActivity({
      type: "maintenance_plan_updated",
      description: `"${updatedPlan.name}" isimli bakım planı güncellendi`,
      userId: 1, // Admin user by default
      userName: "System Administrator",
      entityId: id,
      entityType: "maintenance_plan"
    });
    
    return updatedPlan;
  }
  
  async deleteMaintenancePlan(id: number): Promise<boolean> {
    const plan = this.maintenancePlans.get(id);
    if (!plan) return false;
    
    // İlgili plan öğelerini sil
    const planItemKeys = Array.from(this.maintenancePlanItems.values())
      .filter(item => item.planId === id)
      .map(item => item.id);
    
    for (const itemId of planItemKeys) {
      // Bu plan öğesine bağlı görevleri sil
      const taskKeys = Array.from(this.maintenanceTasks.values())
        .filter(task => task.planItemId === itemId)
        .map(task => task.id);
      
      for (const taskId of taskKeys) {
        this.maintenanceTasks.delete(taskId);
      }
      
      this.maintenancePlanItems.delete(itemId);
    }
    
    // Planı sil
    this.maintenancePlans.delete(id);
    
    // Aktivite kaydı
    this.recordActivity({
      type: "maintenance_plan_deleted",
      description: `"${plan.name}" isimli bakım planı silindi`,
      userId: 1, // Admin user by default
      userName: "System Administrator",
      entityId: id,
      entityType: "maintenance_plan"
    });
    
    return true;
  }
  
  // Bakım Plan Detayları - CMMS
  async getMaintenancePlanItemsByPlanId(planId: number): Promise<MaintenancePlanItem[]> {
    const items = Array.from(this.maintenancePlanItems.values())
      .filter(item => item.planId === planId);
    
    return items;
  }
  
  async getMaintenancePlanItemById(id: number): Promise<MaintenancePlanItem | undefined> {
    return this.maintenancePlanItems.get(id);
  }
  
  async createMaintenancePlanItem(item: InsertMaintenancePlanItem): Promise<MaintenancePlanItem> {
    const id = this.nextIds.maintenancePlanItem++;
    const now = new Date();
    const newItem: MaintenancePlanItem = { 
      ...item, 
      id, 
      createdAt: now,
      updatedAt: now 
    };
    
    this.maintenancePlanItems.set(id, newItem);
    
    return newItem;
  }
  
  async updateMaintenancePlanItem(id: number, itemData: Partial<MaintenancePlanItem>): Promise<MaintenancePlanItem | undefined> {
    const item = this.maintenancePlanItems.get(id);
    if (!item) return undefined;
    
    // Öğeyi güncelle
    const updatedItem = { 
      ...item, 
      ...itemData,
      updatedAt: new Date()
    };
    
    this.maintenancePlanItems.set(id, updatedItem);
    
    return updatedItem;
  }
  
  async deleteMaintenancePlanItem(id: number): Promise<boolean> {
    const item = this.maintenancePlanItems.get(id);
    if (!item) return false;
    
    // Bu plan öğesine bağlı görevleri sil
    const taskKeys = Array.from(this.maintenanceTasks.values())
      .filter(task => task.planItemId === id)
      .map(task => task.id);
    
    for (const taskId of taskKeys) {
      this.maintenanceTasks.delete(taskId);
    }
    
    // Plan öğesini sil
    this.maintenancePlanItems.delete(id);
    
    return true;
  }
  
  // Bakım Görevleri - CMMS
  async getMaintenanceTasks(options: { planItemId?: number, assignedToId?: number, status?: string } = {}): Promise<MaintenanceTask[]> {
    let tasks = Array.from(this.maintenanceTasks.values());
    
    if (options.planItemId) {
      tasks = tasks.filter(task => task.planItemId === options.planItemId);
    }
    
    if (options.assignedToId) {
      tasks = tasks.filter(task => task.assignedToId === options.assignedToId);
    }
    
    if (options.status) {
      tasks = tasks.filter(task => task.status === options.status);
    }
    
    // Yakın tarihli olanlar önce
    return tasks.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }
  
  async getMaintenanceTaskById(id: number): Promise<MaintenanceTask | undefined> {
    return this.maintenanceTasks.get(id);
  }
  
  async createMaintenanceTask(task: InsertMaintenanceTask): Promise<MaintenanceTask> {
    const id = this.nextIds.maintenanceTask++;
    const now = new Date();
    const newTask: MaintenanceTask = { 
      ...task, 
      id, 
      createdAt: now,
      updatedAt: now 
    };
    
    this.maintenanceTasks.set(id, newTask);
    
    return newTask;
  }
  
  async updateMaintenanceTask(id: number, taskData: Partial<MaintenanceTask>): Promise<MaintenanceTask | undefined> {
    const task = this.maintenanceTasks.get(id);
    if (!task) return undefined;
    
    // Görevi güncelle
    const updatedTask = { 
      ...task, 
      ...taskData,
      updatedAt: new Date()
    };
    
    this.maintenanceTasks.set(id, updatedTask);
    
    return updatedTask;
  }
  
  async deleteMaintenanceTask(id: number): Promise<boolean> {
    return this.maintenanceTasks.delete(id);
  }
  
  // Yedek Parça Yönetimi - CMMS
  async getMaintenanceParts(options: { category?: string, lowStock?: boolean } = {}): Promise<MaintenancePart[]> {
    let parts = Array.from(this.maintenanceParts.values());
    
    if (options.category) {
      parts = parts.filter(part => part.category === options.category);
    }
    
    if (options.lowStock) {
      parts = parts.filter(part => part.stock_quantity <= part.min_stock_level);
    }
    
    // Parça numarasına göre sırala
    return parts.sort((a, b) => a.part_number.localeCompare(b.part_number));
  }
  
  async getMaintenancePartById(id: number): Promise<MaintenancePart | undefined> {
    return this.maintenanceParts.get(id);
  }
  
  async createMaintenancePart(part: InsertMaintenancePart): Promise<MaintenancePart> {
    const id = this.nextIds.maintenancePart++;
    const now = new Date();
    const newPart: MaintenancePart = { 
      ...part, 
      id, 
      createdAt: now,
      updatedAt: now 
    };
    
    this.maintenanceParts.set(id, newPart);
    
    return newPart;
  }
  
  async updateMaintenancePart(id: number, partData: Partial<MaintenancePart>): Promise<MaintenancePart | undefined> {
    const part = this.maintenanceParts.get(id);
    if (!part) return undefined;
    
    // Parçayı güncelle
    const updatedPart = { 
      ...part, 
      ...partData,
      updatedAt: new Date()
    };
    
    this.maintenanceParts.set(id, updatedPart);
    
    return updatedPart;
  }
  
  async deleteMaintenancePart(id: number): Promise<boolean> {
    return this.maintenanceParts.delete(id);
  }

  // Bildirimler
  async getUserNotifications(userId: number, options: { showArchived?: boolean, limit?: number, type?: string } = {}): Promise<Notification[]> {
    let notifications = Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId);
    
    // Arşivlenmiş bildirimleri gösterme (varsayılan olarak)
    if (!options.showArchived) {
      notifications = notifications.filter(n => !n.isArchived);
    }
    
    // Bildirim tipine göre filtrele
    if (options.type) {
      notifications = notifications.filter(n => n.type === options.type);
    }
    
    // En son oluşturulanlar önce
    notifications = notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Limit varsa uygula
    if (options.limit && options.limit > 0) {
      notifications = notifications.slice(0, options.limit);
    }
    
    return notifications;
  }
  
  async getNotificationById(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.nextIds.notification++;
    const now = new Date();
    
    // Bitiş tarihi yoksa varsayılan olarak 1 ay ekle
    const expiresAt = notification.expiresAt || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const newNotification: Notification = { 
      ...notification, 
      id, 
      createdAt: now,
      expiresAt,
      isRead: false,
      isArchived: false
    };
    
    this.notifications.set(id, newNotification);
    return newNotification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    notification.isRead = true;
    this.notifications.set(id, notification);
    
    return notification;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<void> {
    const notifications = Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead);
    
    for (const notification of notifications) {
      notification.isRead = true;
      this.notifications.set(notification.id, notification);
    }
  }
  
  async archiveNotification(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    notification.isArchived = true;
    this.notifications.set(id, notification);
    
    return notification;
  }
  
  async deleteNotification(id: number): Promise<boolean> {
    return this.notifications.delete(id);
  }
  
  sessionStore: session.SessionStore;
  private users: Map<number, User>;
  private roles: Map<number, Role>;
  private departments: Map<number, Department>;
  private userRoles: Map<string, number>;
  private permissions: Map<number, { id: number, code: string, description: string }>;
  private rolePermissions: Map<string, number>;
  private fabricTypes: Map<number, FabricType>;
  private yarnTypes: Map<number, YarnType>;
  private rawMaterials: Map<number, RawMaterial>;
  private customers: Map<number, Customer>;
  private orderStatuses: Map<number, OrderStatus>;
  private orders: Map<number, Order>;
  private activities: Activity[];
  
  private customerInteractions: Map<number, CustomerInteraction>;
  private opportunities: Map<number, Opportunity>;
  
  // Planlama Bölümü Maps
  private processTypes: Map<number, ProcessType>;
  private machineTypes: Map<number, MachineType>;
  private machines: Map<number, Machine>;
  private productionPlans: Map<number, ProductionPlan>;
  private productionSteps: Map<number, ProductionStep>;
  private productionRouteTemplates: Map<number, ProductionRouteTemplate>;
  private productionRouteTemplateSteps: Map<number, ProductionRouteTemplateStep>;
  
  // Refakat Kartları ve İzleme Olayları Maps
  private productionCards: Map<number, ProductionCard>;
  private trackingEvents: Map<number, TrackingEvent>;
  
  private nextIds: {
    user: number;
    role: number;
    department: number;
    permission: number;
    fabricType: number;
    yarnType: number;
    rawMaterial: number;
    customer: number;
    orderStatus: number;
    order: number;
    activity: number;
    customerInteraction: number;
    opportunity: number;
    processType: number;
    machineType: number;
    machine: number;
    productionPlan: number;
    productionStep: number;
    productionCard: number;
    trackingEvent: number;
  };

  private maintenanceRequests: Map<number, MaintenanceRequest>;
  private maintenanceActivities: Map<number, MaintenanceActivity>;
  private maintenancePlans: Map<number, MaintenancePlan>;
  private maintenancePlanItems: Map<number, MaintenancePlanItem>;
  private maintenanceTasks: Map<number, MaintenanceTask>;
  private maintenanceParts: Map<number, MaintenancePart>;
  private notifications: Map<number, Notification>;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    this.users = new Map();
    this.roles = new Map();
    this.departments = new Map();
    this.userRoles = new Map();
    this.permissions = new Map();
    this.rolePermissions = new Map();
    this.fabricTypes = new Map();
    this.yarnTypes = new Map();
    this.rawMaterials = new Map();
    this.customers = new Map();
    this.orderStatuses = new Map();
    this.orders = new Map();
    this.activities = [];
    this.customerInteractions = new Map();
    this.opportunities = new Map();
    
    // Planlama Bölümü Maps Initialize
    this.processTypes = new Map();
    this.machineTypes = new Map();
    this.machines = new Map();
    this.productionPlans = new Map();
    this.productionSteps = new Map();
    this.productionRouteTemplates = new Map();
    this.productionRouteTemplateSteps = new Map();
    
    // Refakat Kartları ve İzleme Olayları için Maps
    this.productionCards = new Map<number, ProductionCard>();
    this.trackingEvents = new Map<number, TrackingEvent>();
    
    // Bakım ve Bildirim Maps Initialize
    this.maintenanceRequests = new Map<number, MaintenanceRequest>();
    this.maintenanceActivities = new Map<number, MaintenanceActivity>();
    this.maintenancePlans = new Map<number, MaintenancePlan>();
    this.maintenancePlanItems = new Map<number, MaintenancePlanItem>();
    this.maintenanceTasks = new Map<number, MaintenanceTask>();
    this.maintenanceParts = new Map<number, MaintenancePart>();
    this.notifications = new Map<number, Notification>();
    
    this.nextIds = {
      user: 1,
      role: 1,
      department: 1,
      permission: 1,
      fabricType: 1,
      yarnType: 1,
      rawMaterial: 1,
      customer: 1,
      orderStatus: 1,
      order: 1,
      activity: 1,
      customerInteraction: 1,
      opportunity: 1,
      processType: 1,
      machineType: 1,
      machine: 1,
      productionPlan: 1,
      productionStep: 1,
      productionRouteTemplate: 1,
      productionRouteTemplateStep: 1,
      productionCard: 1,
      trackingEvent: 1,
      maintenanceRequest: 1,
      maintenanceActivity: 1,
      maintenancePlan: 1,
      maintenancePlanItem: 1,
      maintenanceTask: 1,
      maintenancePart: 1,
      notification: 1
    };
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.nextIds.user++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    
    // Record activity
    this.recordActivity({
      type: "user_created",
      description: `User ${user.username} created`,
      userId: id,
      userName: user.fullName,
    });
    
    return user;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    // Update user data
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    
    // Record activity
    this.recordActivity({
      type: "user_updated",
      description: `User ${updatedUser.username} details updated`,
      userId: id,
      userName: updatedUser.fullName,
    });
    
    return updatedUser;
  }
  
  async updateUserStatus(id: number, isActive: boolean): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    user.isActive = isActive;
    this.users.set(id, user);
    
    // Record activity
    this.recordActivity({
      type: "user_updated",
      description: `User ${user.username} status changed to ${isActive ? 'active' : 'inactive'}`,
      userId: id,
      userName: user.fullName,
    });
    
    return user;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    // Protect admin user (id=1) from deletion
    if (id === 1) return false;
    
    const user = this.users.get(id);
    if (!user) return false;
    
    // Delete user
    this.users.delete(id);
    
    // Record activity
    this.recordActivity({
      type: "user_deleted",
      description: `User ${user.username} deleted`,
      userId: 1, // Admin user by default
      userName: "System Administrator",
    });
    
    return true;
  }

  // Password handling
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

  // Role methods
  async getRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const id = this.nextIds.role++;
    const role: Role = { ...insertRole, id };
    this.roles.set(id, role);
    return role;
  }

  async getUserRoles(userId: number): Promise<Role[]> {
    const roleIds = Array.from(this.userRoles.entries())
      .filter(([key, _]) => key.startsWith(`${userId}:`))
      .map(([_, roleId]) => roleId);
    
    return roleIds.map(id => this.roles.get(id)!).filter(role => role !== undefined);
  }

  async assignRoleToUser(userId: number, roleId: number): Promise<void> {
    this.userRoles.set(`${userId}:${roleId}`, roleId);
  }

  // Department methods
  async getDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const id = this.nextIds.department++;
    const department: Department = { ...insertDepartment, id };
    this.departments.set(id, department);
    return department;
  }

  async assignUserToDepartment(userId: number, departmentId: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.departmentId = departmentId;
      this.users.set(userId, user);
    }
  }

  // Permission methods
  async getPermissions(): Promise<any[]> {
    return Array.from(this.permissions.values());
  }

  async createPermission(permission: { code: string, description: string }): Promise<any> {
    const id = this.nextIds.permission++;
    const newPermission = { ...permission, id };
    this.permissions.set(id, newPermission);
    return newPermission;
  }

  async getUserPermissions(userId: number): Promise<any[]> {
    // Get user roles
    const roles = await this.getUserRoles(userId);
    
    // Get permissions for each role
    const permissionIds = new Set<number>();
    for (const role of roles) {
      const rolePermIds = Array.from(this.rolePermissions.entries())
        .filter(([key, _]) => key.startsWith(`${role.id}:`))
        .map(([_, permId]) => permId);
      
      for (const permId of rolePermIds) {
        permissionIds.add(permId);
      }
    }
    
    // Return permissions
    return Array.from(permissionIds).map(id => this.permissions.get(id)!).filter(perm => perm !== undefined);
  }

  async assignPermissionToRole(roleId: number, permissionId: number): Promise<void> {
    this.rolePermissions.set(`${roleId}:${permissionId}`, permissionId);
  }
  
  async getRolePermissions(roleId: number): Promise<any[]> {
    const rolePermIds = Array.from(this.rolePermissions.entries())
      .filter(([key, _]) => key.startsWith(`${roleId}:`))
      .map(([_, permId]) => permId);
    
    return rolePermIds.map(id => this.permissions.get(id)!).filter(perm => perm !== undefined);
  }
  
  async clearRolePermissions(roleId: number): Promise<void> {
    // Tüm rol izinlerini bul ve sil
    const keysToDelete = Array.from(this.rolePermissions.keys())
      .filter(key => key.startsWith(`${roleId}:`));
    
    for (const key of keysToDelete) {
      this.rolePermissions.delete(key);
    }
  }
  
  async deleteRole(id: number): Promise<boolean> {
    // Admin rolünü silmeye çalışıyorsa engelle
    if (id === 1) return false;
    
    const role = this.roles.get(id);
    if (!role) return false;
    
    // Rol izinlerini temizle
    await this.clearRolePermissions(id);
    
    // Kullanıcı-rol ilişkilerini temizle
    const userRoleKeysToDelete = Array.from(this.userRoles.keys())
      .filter(key => key.endsWith(`:${id}`));
    
    for (const key of userRoleKeysToDelete) {
      this.userRoles.delete(key);
    }
    
    // Rolü sil
    this.roles.delete(id);
    
    // Aktivite kaydet
    this.recordActivity({
      type: "role_deleted",
      description: `Rol "${role.name}" silindi`,
      userId: 1, // Admin user by default
      userName: "System Administrator",
    });
    
    return true;
  }

  async hasPermission(userId: number, permissionCode: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.some(perm => perm.code === permissionCode);
  }

  // Fabric types
  async getFabricTypes(): Promise<FabricType[]> {
    return Array.from(this.fabricTypes.values());
  }

  async createFabricType(insertFabricType: InsertFabricType): Promise<FabricType> {
    const id = this.nextIds.fabricType++;
    const fabricType: FabricType = { ...insertFabricType, id };
    this.fabricTypes.set(id, fabricType);
    return fabricType;
  }

  // Yarn types
  async getYarnTypes(): Promise<YarnType[]> {
    return Array.from(this.yarnTypes.values());
  }

  async createYarnType(insertYarnType: InsertYarnType): Promise<YarnType> {
    const id = this.nextIds.yarnType++;
    const yarnType: YarnType = { ...insertYarnType, id };
    this.yarnTypes.set(id, yarnType);
    return yarnType;
  }

  // Raw materials
  async getRawMaterials(): Promise<RawMaterial[]> {
    return Array.from(this.rawMaterials.values());
  }

  async createRawMaterial(insertRawMaterial: InsertRawMaterial): Promise<RawMaterial> {
    const id = this.nextIds.rawMaterial++;
    const rawMaterial: RawMaterial = { ...insertRawMaterial, id };
    this.rawMaterials.set(id, rawMaterial);
    return rawMaterial;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.nextIds.customer++;
    const customer: Customer = { ...insertCustomer, id };
    this.customers.set(id, customer);
    
    // Record activity
    this.recordActivity({
      type: "customer_created",
      description: `Customer ${customer.name} added`,
      userId: 1, // Admin user by default
      userName: "System Administrator",
      entityId: id,
      entityType: "customer",
    });
    
    return customer;
  }

  // Order statuses
  async getOrderStatuses(): Promise<OrderStatus[]> {
    return Array.from(this.orderStatuses.values());
  }

  async createOrderStatus(insertOrderStatus: InsertOrderStatus): Promise<OrderStatus> {
    const id = this.nextIds.orderStatus++;
    const orderStatus: OrderStatus = { ...insertOrderStatus, id };
    this.orderStatuses.set(id, orderStatus);
    return orderStatus;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.nextIds.order++;
    
    // Generate order number
    const currentYear = new Date().getFullYear();
    const orderNumber = `SIP-${currentYear}-${String(id).padStart(3, '0')}`;
    
    const order: Order = { ...insertOrder, id, orderNumber };
    this.orders.set(id, order);
    
    // Record activity
    const user = await this.getUser(order.createdBy);
    this.recordActivity({
      type: "order_created",
      description: `Order ${orderNumber} created`,
      userId: order.createdBy,
      userName: user?.fullName || "Unknown",
      entityId: id,
      entityType: "order",
    });
    
    return order;
  }
  
  // Customer Interactions
  async getCustomerInteractions(): Promise<CustomerInteraction[]> {
    return Array.from(this.customerInteractions.values());
  }
  
  async createCustomerInteraction(insertInteraction: InsertCustomerInteraction): Promise<CustomerInteraction> {
    const id = this.nextIds.customerInteraction++;
    const interaction: CustomerInteraction = { ...insertInteraction, id };
    this.customerInteractions.set(id, interaction);
    
    // Record activity
    this.recordActivity({
      type: "customer_interaction_created",
      description: `Müşteri etkileşimi oluşturuldu: ${interaction.subject}`,
      userId: interaction.userId,
      userName: interaction.userName,
      entityId: id,
      entityType: "customer_interaction",
    });
    
    return interaction;
  }
  
  // Opportunities
  async getOpportunities(): Promise<Opportunity[]> {
    return Array.from(this.opportunities.values());
  }
  
  async createOpportunity(insertOpportunity: InsertOpportunity): Promise<Opportunity> {
    const id = this.nextIds.opportunity++;
    const opportunity: Opportunity = { ...insertOpportunity, id };
    this.opportunities.set(id, opportunity);
    
    // Customer adını bul
    const customer = this.customers.get(opportunity.customerId);
    const customerName = customer ? customer.name : "Bilinmeyen Müşteri";
    
    // Record activity
    this.recordActivity({
      type: "opportunity_created",
      description: `Yeni fırsat oluşturuldu: ${opportunity.title} (${customerName})`,
      userId: opportunity.userId || 1,
      userName: "Sistem Kullanıcısı",
      entityId: id,
      entityType: "opportunity",
    });
    
    return opportunity;
  }

  async updateOrderStatus(orderId: number, statusId: number): Promise<Order | undefined> {
    const order = this.orders.get(orderId);
    if (!order) return undefined;
    
    const oldStatusId = order.statusId;
    const oldStatus = this.orderStatuses.get(oldStatusId);
    const newStatus = this.orderStatuses.get(statusId);
    
    order.statusId = statusId;
    this.orders.set(orderId, order);
    
    // Record activity
    this.recordActivity({
      type: "order_status_updated",
      description: `Order ${order.orderNumber} status updated from ${oldStatus?.name || 'Unknown'} to ${newStatus?.name || 'Unknown'}`,
      userId: 1, // Default admin user
      userName: "System Administrator",
      entityId: orderId,
      entityType: "order",
    });
    
    return order;
  }

  async getOrderSummary(): Promise<{ pending: number, production: number, shipping: number, completed: number, pendingValue: number, productionValue: number, shippingValue: number, completedValue: number }> {
    const allOrders = Array.from(this.orders.values());
    const statuses = Array.from(this.orderStatuses.values());
    
    const pendingStatus = statuses.find(s => s.code === "PENDING")?.id || 0;
    const productionStatus = statuses.find(s => s.code === "PRODUCTION")?.id || 0;
    const shippingStatus = statuses.find(s => s.code === "SHIPMENT")?.id || 0;
    const completedStatus = statuses.find(s => s.code === "COMPLETED")?.id || 0;
    
    const pending = allOrders.filter(o => o.statusId === pendingStatus);
    const production = allOrders.filter(o => o.statusId === productionStatus);
    const shipping = allOrders.filter(o => o.statusId === shippingStatus);
    const completed = allOrders.filter(o => o.statusId === completedStatus);
    
    const calculateValue = (orders: Order[]) => {
      return orders.reduce((sum, order) => {
        const quantity = Number(order.quantity) || 0;
        const unitPrice = Number(order.unitPrice) || 0;
        return sum + (quantity * unitPrice);
      }, 0);
    };
    
    return {
      pending: pending.length,
      production: production.length,
      shipping: shipping.length,
      completed: completed.length,
      pendingValue: calculateValue(pending),
      productionValue: calculateValue(production),
      shippingValue: calculateValue(shipping),
      completedValue: calculateValue(completed)
    };
  }

  // Activities
  async recordActivity(activity: { type: string, description: string, userId: number, userName: string, entityId?: number, entityType?: string }): Promise<void> {
    const id = this.nextIds.activity++;
    const timestamp = new Date();
    const newActivity = { ...activity, id, timestamp };
    this.activities.push(newActivity);
    
    // Limit activities to last 100
    if (this.activities.length > 100) {
      this.activities = this.activities.slice(-100);
    }
  }

  async getRecentActivities(): Promise<any[]> {
    // Return activities sorted by timestamp (newest first)
    return [...this.activities].sort((a, b) => {
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }
  
  // Refakat Kartları (Production Cards) için in-memory implementasyonu
  async getProductionCards(filters?: any): Promise<ProductionCard[]> {
    let result = Array.from(this.productionCards.values());
    
    if (filters) {
      if (filters.orderId) {
        result = result.filter(card => card.orderId === filters.orderId);
      }
      if (filters.status) {
        result = result.filter(card => card.status === filters.status);
      }
      if (filters.currentDepartmentId) {
        result = result.filter(card => card.currentDepartmentId === filters.currentDepartmentId);
      }
    }
    
    return result.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  
  async getProductionCardById(id: number): Promise<ProductionCard | undefined> {
    return this.productionCards.get(id);
  }
  
  async getProductionCardByBarcode(barcodeData: string): Promise<ProductionCard | undefined> {
    return Array.from(this.productionCards.values())
      .find(card => card.barcodeData === barcodeData);
  }
  
  async createProductionCard(card: InsertProductionCard): Promise<ProductionCard> {
    const id = this.nextIds.productionCard++;
    
    // Kart için QR kod ve barkod bilgilerini oluştur
    const qrData = JSON.stringify({
      cardNumber: card.cardNumber,
      batchNumber: card.batchNumber,
      orderId: card.orderId
    });
    
    const newCard: ProductionCard = {
      ...card,
      id,
      qrCodeData: card.qrCodeData || qrData,
      barcodeData: card.barcodeData || card.cardNumber,
      printCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.productionCards.set(id, newCard);
    
    // Aktivite kayıt
    this.recordActivity({
      type: "production_card_created",
      description: `Refakat kartı oluşturuldu: ${card.cardNumber}`,
      userId: card.createdBy,
      userName: "Sistem Kullanıcısı",
      entityId: id,
      entityType: "production_card",
      timestamp: new Date()
    });
    
    return newCard;
  }
  
  async updateProductionCardStatus(id: number, updateData: any): Promise<ProductionCard | undefined> {
    const card = this.productionCards.get(id);
    if (!card) return undefined;
    
    const updatedCard = {
      ...card,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.productionCards.set(id, updatedCard);
    
    // Aktivite kayıt
    this.recordActivity({
      type: "production_card_updated",
      description: `Refakat kartı güncellendi: ${card.cardNumber}`,
      userId: 1, // Admin user default
      userName: "Sistem Kullanıcısı",
      entityId: id,
      entityType: "production_card",
      timestamp: new Date()
    });
    
    return updatedCard;
  }
  
  async incrementProductionCardPrintCount(id: number): Promise<ProductionCard | undefined> {
    const card = this.productionCards.get(id);
    if (!card) return undefined;
    
    const updatedCard = {
      ...card,
      printCount: card.printCount + 1,
      lastPrintDate: new Date()
    };
    
    this.productionCards.set(id, updatedCard);
    return updatedCard;
  }
  
  // İzleme Olayları (Tracking Events) için in-memory implementasyonu
  async getTrackingEventsByCardId(cardId: number): Promise<TrackingEvent[]> {
    return Array.from(this.trackingEvents.values())
      .filter(event => event.cardId === cardId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  async createTrackingEvent(event: InsertTrackingEvent): Promise<TrackingEvent> {
    const id = this.nextIds.trackingEvent++;
    
    const newEvent: TrackingEvent = {
      ...event,
      id,
      timestamp: event.timestamp || new Date()
    };
    
    this.trackingEvents.set(id, newEvent);
    
    // Refakat kartını güncelle
    if (event.cardId) {
      const card = this.productionCards.get(event.cardId);
      if (card) {
        card.currentDepartmentId = event.departmentId;
        card.status = event.status || card.status;
        card.updatedAt = new Date();
        this.productionCards.set(card.id, card);
      }
    }
    
    // Aktivite kayıt
    this.recordActivity({
      type: "tracking_event_created",
      description: `Yeni izleme olayı: ${event.eventType}`,
      userId: event.createdBy,
      userName: "Sistem Kullanıcısı",
      entityId: id,
      entityType: "tracking_event",
      timestamp: new Date()
    });
    
    return newEvent;
  }
  
  async getTrackingSummary(): Promise<any> {
    const cards = Array.from(this.productionCards.values());
    const events = Array.from(this.trackingEvents.values());
    
    const totalCards = cards.length;
    const inProcessCards = cards.filter(card => card.status === "in-progress").length;
    const completedCards = cards.filter(card => card.status === "completed").length;
    
    // Departman bazlı istatistikler
    const departmentStatsMap = new Map<number, { departmentId: number; departmentName: string; count: number }>();
    
    for (const card of cards.filter(c => c.status === "in-progress")) {
      if (card.currentDepartmentId) {
        const deptId = card.currentDepartmentId;
        const dept = this.departments.get(deptId);
        
        if (!departmentStatsMap.has(deptId)) {
          departmentStatsMap.set(deptId, {
            departmentId: deptId,
            departmentName: dept?.name || 'Bilinmeyen Departman',
            count: 0
          });
        }
        
        const stat = departmentStatsMap.get(deptId)!;
        stat.count++;
        departmentStatsMap.set(deptId, stat);
      }
    }
    
    // Son olaylar (en yeni 10 olay)
    const recentEvents = events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      .map(event => {
        const dept = event.departmentId ? this.departments.get(event.departmentId) : undefined;
        return {
          id: event.id,
          cardId: event.cardId,
          eventType: event.eventType,
          departmentId: event.departmentId,
          departmentName: dept?.name || 'Bilinmeyen Departman',
          timestamp: event.timestamp,
          status: event.status
        };
      });
    
    return {
      totalCards,
      inProcessCards,
      completedCards,
      departmentStats: Array.from(departmentStatsMap.values()),
      recentEvents
    };
  }
  
  // Kumaş Depo Raporları - Stok Raporu
  async getWarehouseStockReport(fromDate?: Date, toDate?: Date): Promise<any[]> {
    // Örnek olarak, gerçek uygulama envanteri ve hareketleri kullanarak 
    // tarih aralığına göre filtrelenmiş stok raporu oluştur
    const now = new Date();
    
    // Mevcut durumda API rotaları için mock veri döndürüyoruz
    return [
      {
        itemCode: "FBR-001",
        itemName: "Pamuklu Kumaş",
        quantity: 5200,
        unit: "Metre",
        value: 52000,
        location: "A-101",
        lastUpdated: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        itemCode: "FBR-002",
        itemName: "Polyester Kumaş",
        quantity: 3500,
        unit: "Metre",
        value: 38500,
        location: "A-102",
        lastUpdated: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        itemCode: "FBR-003",
        itemName: "Dokuma Kumaş",
        quantity: 4200,
        unit: "Metre",
        value: 63000,
        location: "B-101",
        lastUpdated: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        itemCode: "FBR-004",
        itemName: "Kadife Kumaş",
        quantity: 1800,
        unit: "Metre",
        value: 36000,
        location: "B-102",
        lastUpdated: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        itemCode: "FBR-005",
        itemName: "İpek Kumaş",
        quantity: 950,
        unit: "Metre",
        value: 47500,
        location: "C-101",
        lastUpdated: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
      }
    ];
  }
  
  // Kumaş Depo Raporları - Hareket Raporu
  async getWarehouseMovementsReport(fromDate?: Date, toDate?: Date): Promise<any[]> {
    const now = new Date();
    
    // Mevcut durumda API rotaları için mock veri döndürüyoruz
    return [
      {
        date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        movementType: "Giriş",
        itemCode: "FBR-001",
        itemName: "Pamuklu Kumaş",
        quantity: 500,
        unit: "Metre",
        referenceNo: "GIR-12345",
        username: "Ali Yıldız"
      },
      {
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        movementType: "Çıkış",
        itemCode: "FBR-002",
        itemName: "Polyester Kumaş",
        quantity: 300,
        unit: "Metre",
        referenceNo: "CIK-45678",
        username: "Mehmet Demir"
      },
      {
        date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        movementType: "Giriş",
        itemCode: "FBR-003",
        itemName: "Dokuma Kumaş",
        quantity: 700,
        unit: "Metre",
        referenceNo: "GIR-23456",
        username: "Ali Yıldız"
      },
      {
        date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        movementType: "Çıkış",
        itemCode: "FBR-001",
        itemName: "Pamuklu Kumaş",
        quantity: 250,
        unit: "Metre",
        referenceNo: "CIK-56789",
        username: "Ayşe Kaya"
      },
      {
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        movementType: "Giriş",
        itemCode: "FBR-005",
        itemName: "İpek Kumaş",
        quantity: 150,
        unit: "Metre",
        referenceNo: "GIR-34567",
        username: "Ali Yıldız"
      }
    ]; 
  }
  
  // Kumaş Depo Raporları - Tedarikçi Raporu
  async getWarehouseSupplierReport(fromDate?: Date, toDate?: Date): Promise<any[]> {
    const now = new Date();
    
    // Mevcut durumda API rotaları için mock veri döndürüyoruz
    return [
      {
        supplierName: "ABC Tekstil Ltd.",
        totalQuantity: 7500,
        unit: "Metre",
        totalValue: 112500,
        lastDelivery: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        orderCount: 12,
        avgDeliveryTime: 4
      },
      {
        supplierName: "XYZ Dokuma A.Ş.",
        totalQuantity: 5200,
        unit: "Metre",
        totalValue: 88400,
        lastDelivery: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        orderCount: 8,
        avgDeliveryTime: 5
      },
      {
        supplierName: "Moda Tekstil",
        totalQuantity: 3800,
        unit: "Metre",
        totalValue: 76000,
        lastDelivery: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        orderCount: 6,
        avgDeliveryTime: 7
      },
      {
        supplierName: "İpek Kumaşları Ltd.",
        totalQuantity: 1200,
        unit: "Metre",
        totalValue: 60000,
        lastDelivery: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        orderCount: 3,
        avgDeliveryTime: 6
      }
    ];
  }
  
  // Kumaş Depo Raporları - Metrikler
  async getWarehouseMetrics(): Promise<any> {
    // Mevcut durumda API rotaları için mock veri döndürüyoruz
    return {
      totalStock: 15650,
      totalIn: 1350,
      totalOut: 550,
      lowStock: 3
    };
  }
}

// Switch from MemStorage to DatabaseStorage
import { DatabaseStorage } from "./storage/database";
export const storage = new DatabaseStorage();
