import { pgTable, text, serial, integer, boolean, varchar, timestamp, foreignKey, uniqueIndex, date, numeric, jsonb, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { dyeRecipes } from "./schema-dye-recipes";
import {
  productionCards,
  productionCardMovements,
  productionCardsRelations,
  productionCardMovementsRelations,
  type ProductionCard,
  type InsertProductionCard,
  type ProductionCardMovement,
  type InsertProductionCardMovement,
  insertProductionCardSchema,
  insertCardMovementSchema
} from "./schema/production-tracking";

// Yeni, geliştirilmiş planlama şemalarını içe aktar
import {
  advancedProductionPlans,
  advancedProductionSteps,
  planningKpis,
  planKpiEvaluations,
  departmentCapacities,
  machineCapacities,
  simulationScenarios,
  planningInterruptions,
  planChangeHistory,
  planningConstraints,
  planningAlertRules,
  advancedProductionPlansRelations,
  advancedProductionStepsRelations,
  type AdvancedProductionPlan,
  type InsertAdvancedProductionPlan,
  type AdvancedProductionStep,
  type InsertAdvancedProductionStep,
  insertAdvancedProductionPlanSchema,
  insertAdvancedProductionStepSchema,
  planningStatusEnum,
  planPriorityEnum,
  planTypeEnum,
  kpiEvaluationStatusEnum
} from "./schema/planning";

// Üretim Takip - Refakat Kartı Durumları
export const productionCardStatusEnum = pgEnum('production_card_status', [
  'created',
  'in-process',
  'completed',
  'rejected'
]);

// User and Authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  departmentId: integer("department_id").references(() => departments.id),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const userRoles = pgTable("user_roles", {
  userId: integer("user_id").notNull().references(() => users.id),
  roleId: integer("role_id").notNull().references(() => roles.id),
}, (table) => {
  return {
    pk: uniqueIndex("user_roles_pk").on(table.userId, table.roleId),
  };
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description"),
});

export const rolePermissions = pgTable("role_permissions", {
  roleId: integer("role_id").notNull().references(() => roles.id),
  permissionId: integer("permission_id").notNull().references(() => permissions.id),
}, (table) => {
  return {
    pk: uniqueIndex("role_permissions_pk").on(table.roleId, table.permissionId),
  };
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  color: text("color").default("#3b82f6"),
});

// Process Types
export const processTypes = pgTable("process_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  departmentId: integer("department_id").references(() => departments.id),
  duration: integer("duration"), // İşlem süresi (dakika)
  sequence: integer("sequence"), // İşlem sırası
  isActive: boolean("is_active").default(true),
});

// Rota Şablonları - Ürün tipine göre standart üretim rotaları
export const routeTemplates = pgTable("route_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Rota Şablonu Adımları - Her rotadaki adımlar
export const routeTemplateSteps = pgTable("route_template_steps", {
  id: serial("id").primaryKey(),
  routeTemplateId: integer("route_template_id").notNull().references(() => routeTemplates.id),
  processTypeId: integer("process_type_id").notNull().references(() => processTypes.id),
  departmentId: integer("department_id").notNull().references(() => departments.id),
  stepOrder: integer("step_order").notNull(),
  estimatedDuration: integer("estimated_duration"), // Saat cinsinden
  description: text("description"),
  requiresQualityCheck: boolean("requires_quality_check").default(false),
  dyeRecipeId: integer("dye_recipe_id").references(() => dyeRecipes.id), // Boya reçetesi referansı
  machineId: integer("machine_id").references(() => machines.id), // Kullanılacak makine
  dayOffset: integer("day_offset").default(0), // Başlangıç gününden kaç gün sonra
  notes: text("notes"), // Adımla ilgili notlar
});

// Refakat Kartları - Üretim sürecinde kumaşlarla birlikte dolaşan bilgi kartları
export const productionCards = pgTable("production_cards", {
  id: serial("id").primaryKey(),
  cardNo: text("card_no").notNull().unique(),
  productionPlanId: integer("production_plan_id").notNull().references(() => productionPlans.id),
  orderId: integer("order_id").notNull().references(() => orders.id),
  fabricTypeId: integer("fabric_type_id").references(() => fabricTypes.id),
  width: numeric("width"), // Kumaş eni (cm)
  length: numeric("length"), // Kumaş boyu (metre)
  weight: numeric("weight"), // Ağırlık (kg)
  color: text("color"),
  barcode: text("barcode").notNull().unique(),
  currentStepId: integer("current_step_id").references(() => productionSteps.id),
  currentDepartmentId: integer("current_department_id").notNull().references(() => departments.id),
  status: text("status").notNull().default("created"), // created, in-process, completed, rejected
  qualityGrade: text("quality_grade"), // A, B, C sınıfı
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Refakat Kartı Hareket Geçmişi - Refakat kartının departmanlar arası geçişleri
export const productionCardMovements = pgTable("production_card_movements", {
  id: serial("id").primaryKey(),
  productionCardId: integer("production_card_id").notNull().references(() => productionCards.id),
  fromDepartmentId: integer("from_department_id").references(() => departments.id),
  toDepartmentId: integer("to_department_id").notNull().references(() => departments.id),
  operationTypeId: integer("operation_type_id").references(() => processTypes.id),
  operatorId: integer("operator_id").notNull().references(() => users.id),
  machineId: integer("machine_id").references(() => machines.id),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  status: text("status").notNull(), // started, completed, rejected
  notes: text("notes"),
  defects: jsonb("defects"), // Tespit edilen kusurlar
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Machine Types
export const machineTypes = pgTable("machine_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  departmentId: integer("department_id").references(() => departments.id)
});

// Machines
export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  machineTypeId: integer("machine_type_id").notNull().references(() => machineTypes.id),
  departmentId: integer("department_id").references(() => departments.id),
  status: text("status").default("active"), // active, maintenance, out-of-order
  details: text("details"),
});

// Master Data
// Kumaş özellikleri için tip tanımı - bu interface tip girdileri için bir referans olarak tutulur
// Actual tip tanımı için aşağıdaki fabricPropertiesSchema kullanılacak

export const fabricTypes = pgTable("fabric_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  // Ek özellikler JSON olarak saklanacak - Upgrade 2.0
  properties: jsonb("properties").default({}).notNull(),
});

export const yarnTypes = pgTable("yarn_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
});

export const rawMaterials = pgTable("raw_materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  unit: text("unit").notNull(),
});

// Business Data
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  taxNumber: text("tax_number"),
  customerCode: text("customer_code"),
  customerType: text("customer_type"),
  notes: text("notes"),
});

// CRM için müşteri etkileşimleri
export const customerInteractions = pgTable("customer_interactions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  interactionType: text("interaction_type").notNull(), // Toplantı, Telefon, E-posta, vs
  subject: text("subject").notNull(),
  details: text("details"),
  interactionDate: timestamp("interaction_date").notNull().defaultNow(),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  status: text("status").notNull().default("açık"), // açık, kapalı, takip bekleniyor
});

// Potansiyel müşteriler/fırsatlar
export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  title: text("title").notNull(),
  description: text("description"),
  estimatedValue: numeric("estimated_value"),
  probability: integer("probability"), // 0-100 arasında yüzde olarak
  expectedCloseDate: date("expected_close_date"),
  status: text("status").notNull(), // tahmin, teklif verildi, kazanıldı, kaybedildi
  assignedToUserId: integer("assigned_to_user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderStatuses = pgTable("order_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  color: text("color").default("#3b82f6"),
});

// Kumaş kaliteleri
export const fabricQualities = pgTable("fabric_qualities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
});

// Üretim talimatları/reçeteleri
export const productionInstructions = pgTable("production_instructions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  details: text("details"),
});

// Ürün detayları
export const productDetails = pgTable("product_details", {
  id: serial("id").primaryKey(),
  articleNo: text("article_no").notNull().unique(),
  name: text("name").notNull(),
  color: text("color"),
  patternNo: text("pattern_no"),
  width: numeric("width"),
  weight: numeric("weight"),
  fabricTypeId: integer("fabric_type_id").references(() => fabricTypes.id),
  fabricQualityId: integer("fabric_quality_id").references(() => fabricQualities.id),
  yarnTypeId: integer("yarn_type_id").references(() => yarnTypes.id),
  details: text("details"),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  fabricTypeId: integer("fabric_type_id").references(() => fabricTypes.id),
  quantity: numeric("quantity").notNull(),
  unit: text("unit").default("metre").notNull(),
  unitPrice: numeric("unit_price"), // Artık nullable
  orderDate: date("order_date").notNull(),
  dueDate: date("due_date").notNull(),
  statusId: integer("status_id").notNull().references(() => orderStatuses.id),
  notes: text("notes"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  // Yeni alanlar
  parentOrderId: integer("parent_order_id"), // Blok siparişten milyetinde mi?
  orderType: text("order_type").notNull().default("direct"), // direct, block, block_color
  marketType: text("market_type").default("iç"), // iç, dış
  variant: text("variant"), // Varyant (elle girilecek)
  feel: text("feel"), // Tuşe (kumaş tipinden otomatik gelecek)
  width: numeric("width"), // En (kumaş tipinden otomatik gelecek)
  weight: numeric("weight"), // Gramaj (kumaş tipinden otomatik gelecek)
  blend: text("blend"), // Harman (kumaş tipinden otomatik gelecek)
  groupName: text("group_name"), // Grup adı (kumaş tipinden otomatik gelecek)
  color: text("color"), // Renk (kumaş tipinden otomatik gelecek)
  pattern: text("pattern"), // Desen (kumaş tipinden otomatik gelecek)
  properties: jsonb("properties"), // Ek özellikler için esnek alan
});

// Sipariş detay kalemleri (artık kullanılmayacak veya isteğe bağlı olarak kalabilir)
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productDetailId: integer("product_detail_id").references(() => productDetails.id),
  description: text("description").notNull(),
  quantity: numeric("quantity").notNull(),
  unit: text("unit").notNull(),
  unitPrice: numeric("unit_price"),
  color: text("color"),
  width: numeric("width"),
  weight: numeric("weight"),
  notes: text("notes"),
});

// Planlama Bölümü için tablolar
export const productionPlans = pgTable("production_plans", {
  id: serial("id").primaryKey(),
  planNo: text("plan_no").notNull().unique(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  orderNumber: text("order_number").notNull(), // Sipariş numarası (hızlı erişim için)
  description: text("description").notNull(),
  productionStartDate: timestamp("production_start_date").notNull(),
  productionEndDate: timestamp("production_end_date").notNull(),
  oldStartDate: text("old_start_date").notNull(), // Eski planlama başlangıç tarihi (string olarak saklıyoruz)
  oldEndDate: text("old_end_date").notNull(), // Eski planlama bitiş tarihi (string olarak saklıyoruz)
  status: text("status").notNull().default("Beklemede"), // Beklemede, Devam Ediyor, Tamamlandı, İptal Edildi
  priority: text("priority").default("Normal"), // Normal, Yüksek
  createdBy: integer("created_by").notNull().references(() => users.id),
  assignedTo: integer("assigned_to").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Üretim Rotaları için şablonlar
export const productionRouteTemplates = pgTable("production_route_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Üretim rota şablonu detayları
export const productionRouteTemplateSteps = pgTable("production_route_template_steps", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => productionRouteTemplates.id),
  processTypeId: integer("process_type_id").notNull().references(() => processTypes.id),
  stepOrder: integer("step_order").notNull(),
  departmentId: integer("department_id").notNull().references(() => departments.id),
  duration: integer("duration"), // Tahmini süre (dakika)
  description: text("description"),
  isRequired: boolean("is_required").default(true),
  // Boya reçetesi entegrasyonu için eklenen alanlar
  dyeRecipeId: integer("dye_recipe_id").references(() => dyeRecipes.id),
  estimatedDuration: integer("estimated_duration"), // Tahmini süre (saat)
  dayOffset: integer("day_offset").default(0), // Rota başlangıcından itibaren gün olarak gecikme
  notes: text("notes"), // İlave notlar
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productionSteps = pgTable("production_steps", {
  id: serial("id").primaryKey(),
  productionPlanId: integer("production_plan_id").notNull().references(() => productionPlans.id),
  processTypeId: integer("process_type_id").notNull().references(() => processTypes.id),
  stepOrder: integer("step_order").notNull(),
  departmentId: integer("department_id").notNull().references(() => departments.id),
  plannedStartDate: timestamp("planned_start_date").notNull(),
  plannedEndDate: timestamp("planned_end_date").notNull(),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  machineId: integer("machine_id").references(() => machines.id),
  status: text("status").notNull().default("pending"), // pending, in-progress, completed, cancelled
  notes: text("notes"),
});

// Sevkiyat İşlemleri
export const shipments = pgTable('shipments', {
  id: serial('id').primaryKey(),
  shipmentNo: text('shipment_no').notNull().unique(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  plannedDate: date('planned_date').notNull(),
  actualDate: date('actual_date'),
  status: text('status').notNull().default('planned'),
  createdBy: integer('created_by').notNull().references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Sevkiyat Bilgileri - Evrak
export const shipmentDocuments = pgTable('shipment_documents', {
  id: serial('id').primaryKey(),
  shipmentId: integer('shipment_id').notNull().references(() => shipments.id),
  documentType: text('document_type').notNull(),  // invoice, delivery_note, export_document
  documentNo: text('document_no').notNull(),
  documentDate: date('document_date').notNull(),
  amount: numeric('amount'),
  currency: text('currency'),
  filePath: text('file_path'),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: integer('created_by').notNull().references(() => users.id),
});

// Sevkiyat Bilgileri - Paketleme
export const packingSchema = pgTable('packing', {
  id: serial('id').primaryKey(),
  shipmentId: integer('shipment_id').references(() => shipments.id),
  packageNo: text('package_no'),
  packageType: text('package_type'),
  width: text('width'),
  height: text('height'),
  length: text('length'),
  grossWeight: text('gross_weight'),
  netWeight: text('net_weight'),
  content: text('content'),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: integer('created_by')
});

// Sevkiyat Takip Bilgileri
export const shipmentTracking = pgTable('shipment_tracking', {
  id: serial('id').primaryKey(),
  shipmentId: integer('shipment_id').references(() => shipments.id),
  trackingNumber: text('tracking_number'),
  carrier: text('carrier'),
  status: text('status'),
  estimatedDelivery: timestamp('estimated_delivery'),
  actualDelivery: timestamp('actual_delivery'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Bakım Talepleri
export const maintenanceRequests = pgTable('maintenance_requests', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  requesterId: integer('requester_id').notNull().references(() => users.id),
  departmentId: integer('department_id').notNull().references(() => departments.id),
  assignedToId: integer('assigned_to_id').references(() => users.id),
  // CMMS için eklenen hedef departman alanı - gelen talebin hangi departmana yönlendirildiği (Elektrik, Mekanik, IT)
  targetDepartmentId: integer('target_department_id').references(() => departments.id),
  status: text('status').notNull().default('pending'),
  priority: text('priority').notNull().default('normal'),
  requestType: text('request_type'),
  requestDate: timestamp('request_date').notNull().defaultNow(),
  scheduledDate: timestamp('scheduled_date'),
  completionDate: timestamp('completion_date'),
  machineId: integer('machine_id').references(() => machines.id),
  locationDetails: text('location_details'),
  estimatedCompletionTime: integer('estimated_completion_time'), // Tahmini tamamlanma süresi (saat)
  actualCompletionTime: integer('actual_completion_time'), // Gerçekleşen tamamlanma süresi (saat)
  downtime: integer('downtime'), // Duruş süresi (dakika)
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Bakım Aktiviteleri
export const maintenanceActivities = pgTable('maintenance_activities', {
  id: serial('id').primaryKey(),
  maintenanceRequestId: integer('maintenance_request_id').notNull().references(() => maintenanceRequests.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id),
  description: text('description').notNull(),
  activityType: text('activity_type'),
  status: text('status'),
  timeSpent: text('time_spent'),
  materials: jsonb('materials'),
  costs: text('costs'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Bakım Planları - CMMS için
export const maintenancePlans = pgTable('maintenance_plans', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  departmentId: integer('department_id').notNull().references(() => departments.id), // Hangi departman için (Elektrik, Mekanik, IT)
  createdById: integer('created_by_id').notNull().references(() => users.id),
  assignedToId: integer('assigned_to_id').references(() => users.id),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  frequency: text('frequency').notNull(), // daily, weekly, monthly, quarterly, semi-annual, annual
  status: text('status').notNull().default('active'), // active, completed, cancelled
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Bakım Plan Detayları
export const maintenancePlanItems = pgTable('maintenance_plan_items', {
  id: serial('id').primaryKey(),
  planId: integer('plan_id').notNull().references(() => maintenancePlans.id, { onDelete: 'cascade' }),
  machineId: integer('machine_id').references(() => machines.id),
  equipmentName: text('equipment_name'), // Eğer makine ID yoksa elle girilen ekipman adı
  taskDescription: text('task_description').notNull(),
  frequency: text('frequency').notNull(), // daily, weekly, monthly, quarterly, semi-annual, annual
  lastCompleted: timestamp('last_completed'),
  nextDue: timestamp('next_due'),
  estimatedTime: integer('estimated_time'), // Dakika olarak
  priority: text('priority').notNull().default('normal'), // low, normal, high, critical
  requiresShutdown: boolean('requires_shutdown').default(false),
  partsList: jsonb('parts_list'), // Gerekli yedek parçalar
  procedureSteps: jsonb('procedure_steps'), // Bakım prosedürü adımları
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Bakım Plan Görevleri - Belirli bir tarihte yapılacak görevler
export const maintenanceTasks = pgTable('maintenance_tasks', {
  id: serial('id').primaryKey(),
  planItemId: integer('plan_item_id').notNull().references(() => maintenancePlanItems.id, { onDelete: 'cascade' }),
  assignedToId: integer('assigned_to_id').references(() => users.id),
  scheduledDate: timestamp('scheduled_date').notNull(),
  completedDate: timestamp('completed_date'),
  status: text('status').notNull().default('scheduled'), // scheduled, in-progress, completed, cancelled
  actualTime: integer('actual_time'), // Dakika olarak gerçekleşen süre
  result: text('result'), // pass, fail
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Yedek Parça Stok Yönetimi
export const maintenanceParts = pgTable('maintenance_parts', {
  id: serial('id').primaryKey(),
  partNumber: text('part_number').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  manufacturer: text('manufacturer'),
  category: text('category'),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  minStockLevel: integer('min_stock_level').default(0),
  location: text('location'), // Depo konumu
  unitCost: numeric('unit_cost'), // Birim maliyet
  lastPurchaseDate: timestamp('last_purchase_date'),
  supplierInfo: jsonb('supplier_info'), // Tedarikçi bilgileri
  machineModels: jsonb('machine_models'), // Hangi makine modelleriyle uyumlu
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Bildirim tipi enum tanımı
export const notificationTypeEnum = pgEnum('notification_type', [
  'info',
  'alert',
  'maintenance',
  'system',
  'other',
  'device_connect',
  'device_disconnect'
]);

// Bildirimler
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  content: text('content').notNull(),
  type: notificationTypeEnum('type').default('info'),
  is_read: boolean('is_read').notNull().default(false),
  is_archived: boolean('is_archived').notNull().default(false),
  related_entity_id: integer('related_entity_id'),
  related_entity_type: text('related_entity_type'),
  created_at: timestamp('created_at').notNull().defaultNow()
});

// Activities table to track user actions
export const activities = pgTable('activities', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  action: text('action').notNull(),
  entityId: integer('entity_id'),
  entityType: text('entity_type'),
  details: jsonb('details'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Machine Activities and Events (For predictive maintenance)
export const machineActivities = pgTable('machine_activities', {
  id: serial('id').primaryKey(),
  machineId: integer('machine_id').notNull().references(() => machines.id),
  activityType: text('activity_type').notNull(), // startup, shutdown, maintenance, error
  status: text('status').notNull(),
  parameters: jsonb('parameters'), // temperature, pressure, vibration, etc.
  alertLevel: text('alert_level'), // normal, warning, critical
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  duration: integer('duration'), // minutes
  notes: text('notes'),
  recordedBy: integer('recorded_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Stock Movements
export const stockMovements = pgTable('stock_movements', {
  id: serial('id').primaryKey(),
  materialId: integer('material_id').notNull(), // can be raw material or finished product
  materialType: text('material_type').notNull(), // raw_material, finished_product, yarn
  quantity: numeric('quantity').notNull(),
  unit: text('unit').notNull(),
  warehouseId: integer('warehouse_id').notNull(),
  locationCode: text('location_code'),
  transactionType: text('transaction_type').notNull(), // "receipt", "shipment", "return", "adjustment", "transfer"
  referenceId: integer('reference_id'), // order_id, production_card_id, etc.
  referenceType: text('reference_type'), // order, production, etc.
  performedBy: integer('performed_by').notNull().references(() => users.id),
  transactionDate: timestamp('transaction_date').notNull().defaultNow(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Quality Tests
export const qualityTests = pgTable('quality_tests', {
  id: serial('id').primaryKey(),
  testCode: text('test_code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  departmentId: integer('department_id').notNull().references(() => departments.id),
  parameters: jsonb('parameters'), // test parameters and acceptable ranges
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Quality Test Results
export const qualityTestResults = pgTable('quality_test_results', {
  id: serial('id').primaryKey(),
  testId: integer('test_id').notNull().references(() => qualityTests.id),
  productionCardId: integer('production_card_id').references(() => productionCards.id),
  orderId: integer('order_id').references(() => orders.id),
  testDate: timestamp('test_date').notNull(),
  results: jsonb('results').notNull(), // test results in JSON format
  passed: boolean('passed').notNull(),
  notes: text('notes'),
  performedBy: integer('performed_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Dokuma Bölümü için tablolar
export const weavingOrders = pgTable("weaving_orders", {
  id: serial("id").primaryKey(),
  productionStepId: integer("production_step_id").notNull().references(() => productionSteps.id),
  machineId: integer("machine_id").notNull().references(() => machines.id),
  warpPreparationStatus: text("warp_preparation_status"), // Çözgü hazırlık durumu
  reedingStatus: text("reeding_status"), // Tahar durumu
  startDate: timestamp("start_date"), // Dokuma başlangıç tarihi
  endDate: timestamp("end_date"), // Dokuma bitiş tarihi
  status: text("status").notNull().default("pending"), // pending, in-preparation, in-progress, completed
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Dokuma Makine Ayarları
export const weavingMachineSettings = pgTable("weaving_machine_settings", {
  id: serial("id").primaryKey(),
  weavingOrderId: integer("weaving_order_id").notNull().references(() => weavingOrders.id),
  machineId: integer("machine_id").notNull().references(() => machines.id),
  reedCount: text("reed_count"), // Tarak numarası
  reedWidth: text("reed_width"), // Tarak eni
  warpDensity: text("warp_density"), // Çözgü sıklığı
  weftDensity: text("weft_density"), // Atkı sıklığı
  warpTension: text("warp_tension"), // Çözgü gerginliği
  weftTension: text("weft_tension"), // Atkı gerginliği
  speed: text("speed"), // Makine hızı (rpm)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// İplik Büküm Bölümü için tablolar - zaten daha önce tanımlanmış

// Numune Bölümü için tablolar, güncel tanımlar 1640. satırdan itibaren var

// Ham Kalite Kontrol Bölümü için tablolar
export const fabricQualityInspections = pgTable("fabric_quality_inspections", {
  id: serial("id").primaryKey(),
  productionCardId: integer("production_card_id").notNull().references(() => productionCards.id),
  inspectorId: integer("inspector_id").notNull().references(() => users.id),
  inspectionDate: timestamp("inspection_date").notNull(),
  grade: text("grade"), // A, B, C kalite sınıfı
  points: integer("points"), // Kusur puanı
  passed: boolean("passed").notNull(),
  defects: jsonb("defects"), // Tespit edilen kusurlar
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Laboratuvar Bölümü için tablolar
export const laboratoryTests = pgTable("laboratory_tests", {
  id: serial("id").primaryKey(),
  productionCardId: integer("production_card_id").references(() => productionCards.id),
  testTypeId: integer("test_type_id").notNull(),
  testDate: timestamp("test_date").notNull(),
  results: jsonb("results").notNull(),
  passed: boolean("passed").notNull(),
  notes: text("notes"),
  performedBy: integer("performed_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Proses Takip - Operatör Tarama İşlemleri
export const processTracking = pgTable("process_tracking", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").notNull().references(() => productionCards.id),
  processTypeId: integer("process_type_id").notNull().references(() => processTypes.id),
  departmentId: integer("department_id").notNull().references(() => departments.id),
  operatorId: integer("operator_id").notNull().references(() => users.id),
  machineId: integer("machine_id").references(() => machines.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  eventType: text("event_type").notNull(), // start, end, pause
  status: text("status").notNull(), // started, paused, completed, rejected
  quantity: text("quantity"), // İşlem gören miktar
  unit: text("unit"), // Birim
  defectCount: integer("defect_count"), // Hata sayısı
  defectDetails: jsonb("defect_details"), // Hata detayları
  locationCode: text("location_code"), // Konum kodu
  notes: text("notes"),
});

// Bakım Talepleri Zod Şemaları
export const insertMaintenanceRequestSchema = createInsertSchema(maintenanceRequests, {
  title: z.string().min(3, "Bakım talebi başlığı en az 3 karakter olmalıdır"),
  description: z.string().optional(),
  status: z.enum(['pending', 'in-progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  requestType: z.enum(['breakdown', 'preventive', 'improvement', 'other']).optional(),
  targetDepartmentId: z.number().optional(), // Elektrik, Mekanik veya IT departmanı
  scheduledDate: z.date().optional().nullable(),
  completionDate: z.date().optional().nullable(),
  machineId: z.number().optional().nullable(),
  locationDetails: z.string().optional().nullable(),
  estimatedCompletionTime: z.number().optional(), // Tahmini tamamlanma süresi (saat)
  downtime: z.number().optional() // Duruş süresi (dakika)
}).omit({ id: true, createdAt: true, updatedAt: true, requestDate: true, actualCompletionTime: true });

export const insertMaintenanceActivitySchema = createInsertSchema(maintenanceActivities, {
  description: z.string().min(3, "Aktivite açıklaması en az 3 karakter olmalıdır"),
  activityType: z.enum(['note', 'repair', 'inspection', 'part_replacement', 'test']).optional(),
  status: z.enum(['started', 'in-progress', 'completed']).optional(),
  timeSpent: z.string().optional(),
  materials: z.any().optional().nullable(),
  costs: z.string().optional()
}).omit({ id: true, createdAt: true });

// Bakım Plan ve Görev Şemaları
export const insertMaintenancePlanSchema = createInsertSchema(maintenancePlans, {
  name: z.string().min(3, "Plan adı en az 3 karakter olmalıdır"),
  description: z.string().optional(),
  departmentId: z.number(), // Elektrik, Mekanik veya IT departmanı
  assignedToId: z.number().optional(),
  startDate: z.date(),
  endDate: z.date(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'semi-annual', 'annual']),
  status: z.enum(['active', 'completed', 'cancelled']).optional()
}).omit({ id: true, createdAt: true, updatedAt: true, createdById: true });

export const insertMaintenancePlanItemSchema = createInsertSchema(maintenancePlanItems, {
  machineId: z.number().optional(),
  equipmentName: z.string().optional(),
  taskDescription: z.string().min(3, "Görev açıklaması en az 3 karakter olmalıdır"),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'semi-annual', 'annual']),
  estimatedTime: z.number().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  requiresShutdown: z.boolean().optional(),
  partsList: z.any().optional(),
  procedureSteps: z.any().optional()
}).omit({ id: true, createdAt: true, updatedAt: true, lastCompleted: true, nextDue: true });

export const insertMaintenanceTaskSchema = createInsertSchema(maintenanceTasks, {
  assignedToId: z.number().optional(),
  scheduledDate: z.date(),
  status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled']).optional(),
  actualTime: z.number().optional(),
  result: z.enum(['pass', 'fail']).optional(),
  notes: z.string().optional()
}).omit({ id: true, createdAt: true, updatedAt: true, completedDate: true });

export const insertMaintenancePartSchema = createInsertSchema(maintenanceParts, {
  partNumber: z.string().min(2, "Parça numarası en az 2 karakter olmalıdır"),
  name: z.string().min(2, "Parça adı en az 2 karakter olmalıdır"),
  description: z.string().optional(),
  manufacturer: z.string().optional(),
  category: z.string().optional(),
  stockQuantity: z.number().optional(),
  minStockLevel: z.number().optional(),
  location: z.string().optional(),
  unitCost: z.number().optional(),
  supplierInfo: z.any().optional(),
  machineModels: z.any().optional()
}).omit({ id: true, createdAt: true, updatedAt: true, lastPurchaseDate: true });

// Bildirimler Zod Şemaları
export const insertNotificationSchema = createInsertSchema(notifications, {
  title: z.string().min(3, "Bildirim başlığı en az 3 karakter olmalıdır"),
  content: z.string().min(5, "Bildirim içeriği en az 5 karakter olmalıdır"),
  type: z.enum([
    'info', 
    'alert', 
    'maintenance', 
    'system', 
    'other', 
    'device_connect', 
    'device_disconnect'
  ]).optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  expiresAt: z.date().optional().nullable()
}).omit({ id: true, createdAt: true, isRead: true, isArchived: true });

// Process Tracking Zod Şemaları
export const insertProcessTrackingSchema = createInsertSchema(processTracking, {
  eventType: z.enum(['start', 'end', 'pause']),
  status: z.enum(['started', 'paused', 'completed', 'rejected']),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  defectCount: z.number().optional(),
  defectDetails: z.any().optional(),
  notes: z.string().optional()
}).omit({ id: true, timestamp: true });

// Order Schemas
export const insertOrderSchema = createInsertSchema(orders, {
  orderNumber: z.string().min(3, "Sipariş numarası en az 3 karakter olmalıdır"),
  quantity: z.number().positive("Miktar sıfırdan büyük olmalıdır"),
  orderDate: z.date(),
  dueDate: z.date(),
  orderType: z.enum(["direct", "block", "block_color"]).optional(),
  marketType: z.enum(["iç", "dış"]).optional(),
}).omit({ id: true });

// Production Plan Schemas
export const insertProductionPlanSchema = createInsertSchema(productionPlans, {
  planNo: z.string().min(3, "Plan numarası en az 3 karakter olmalıdır"),
  description: z.string().min(3, "Açıklama en az 3 karakter olmalıdır"),
  productionStartDate: z.date(),
  productionEndDate: z.date(),
  status: z.enum(["Beklemede", "Devam Ediyor", "Tamamlandı", "İptal Edildi"]).optional(),
  priority: z.enum(["Normal", "Yüksek"]).optional(),
  notes: z.string().optional()
}).omit({ id: true, createdAt: true, updatedAt: true, oldStartDate: true, oldEndDate: true });

// Production Step Schemas
export const insertProductionStepSchema = createInsertSchema(productionSteps, {
  stepOrder: z.number().int().positive(),
  plannedStartDate: z.date(),
  plannedEndDate: z.date(),
  actualStartDate: z.date().optional().nullable(),
  actualEndDate: z.date().optional().nullable(),
  status: z.enum(["pending", "in-progress", "completed", "cancelled"]).optional(),
  notes: z.string().optional()
}).omit({ id: true });

// Production Card Schemas
export const insertProductionCardSchema = createInsertSchema(productionCards, {
  cardNo: z.string().min(3, "Kart numarası en az 3 karakter olmalıdır"),
  barcode: z.string().min(5, "Barkod en az 5 karakter olmalıdır"),
  status: z.enum(["created", "in-process", "completed", "rejected"]).optional(),
  color: z.string().optional(),
  length: z.string().optional(),
  width: z.string().optional(),
  weight: z.string().optional(),
  notes: z.string().optional(),
  qualityGrade: z.string().optional()
}).omit({ id: true, createdAt: true, updatedAt: true });

// Card Movement Schemas
export const insertCardMovementSchema = createInsertSchema(productionCardMovements, {
  status: z.enum(["started", "completed", "rejected"]),
  notes: z.string().optional(),
  defects: z.any().optional()
}).omit({ id: true, createdAt: true, startTime: true });

// Activity Schemas
export const insertActivitySchema = createInsertSchema(activities, {
  action: z.string().min(3, "İşlem açıklaması en az 3 karakter olmalıdır"),
  details: z.any().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional()
}).omit({ id: true, createdAt: true });

// Customer Schemas
export const insertCustomerSchema = createInsertSchema(customers, {
  name: z.string().min(3, "Müşteri adı en az 3 karakter olmalıdır"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Geçerli bir e-posta adresi girin").optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  taxNumber: z.string().optional(),
  customerCode: z.string().optional(),
  customerType: z.string().optional(),
  notes: z.string().optional()
}).omit({ id: true });

// Quality Inspection Schemas
export const insertQualityInspectionSchema = createInsertSchema(fabricQualityInspections, {
  grade: z.string().optional(),
  points: z.number().optional(),
  passed: z.boolean(),
  defects: z.any().optional(),
  notes: z.string().optional()
}).omit({ id: true, createdAt: true, inspectionDate: true });

// Fabric Type Schemas
export const insertFabricTypeSchema = createInsertSchema(fabricTypes, {
  name: z.string().min(3, "Kumaş tipi adı en az 3 karakter olmalıdır"),
  code: z.string().min(2, "Kumaş kodu en az 2 karakter olmalıdır"),
  description: z.string().optional(),
  properties: z.record(z.string(), z.any()).optional()
}).omit({ id: true });

// Etiket Tabloları
export const labelTypes = pgTable("label_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  departmentId: integer("department_id").references(() => departments.id),
  template: text("template").notNull(),
  fields: jsonb("fields").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const labelPrints = pgTable("label_prints", {
  id: serial("id").primaryKey(), 
  labelTypeId: integer("label_type_id").references(() => labelTypes.id),
  userId: integer("user_id").references(() => users.id),
  data: jsonb("data").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  printedAt: timestamp("printed_at").defaultNow().notNull(),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: integer("related_entity_id"),
});

// Etiket tipi enum
export const labelCategoryEnum = pgEnum("label_category", [
  "yarn", // İplik
  "fabric", // Kumaş
  "production", // Üretim
  "quality", // Kalite
  "warehouse", // Depo
  "shipping", // Sevkiyat
  "machine", // Makine
  "sample" // Numune
]);

// Etiket Şemaları
export const insertLabelTypeSchema = createInsertSchema(labelTypes, {
  name: z.string().min(3, "Etiket tipi adı en az 3 karakter olmalıdır"),
  code: z.string().min(2, "Etiket kodu en az 2 karakter olmalıdır"),
  description: z.string().optional(),
  template: z.string(),
  fields: z.record(z.string(), z.any())
}).omit({ id: true, createdAt: true, updatedAt: true });

// labelPrints tablosu için insert şeması
export const insertLabelPrintsSchema = createInsertSchema(labelPrints, {
  data: z.record(z.string(), z.any()),
  quantity: z.number().int().positive(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.number().optional()
}).omit({ id: true, printedAt: true });

// Tip tanımları
export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;
export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;

export type InsertLabelType = z.infer<typeof insertLabelTypeSchema>;
export type LabelType = typeof labelTypes.$inferSelect;

export type InsertLabelPrint = z.infer<typeof insertLabelPrintsSchema>;
export type LabelPrint = typeof labelPrints.$inferSelect;

export type InsertMaintenanceActivity = z.infer<typeof insertMaintenanceActivitySchema>;
export type MaintenanceActivity = typeof maintenanceActivities.$inferSelect;

export type InsertMaintenancePlan = z.infer<typeof insertMaintenancePlanSchema>;
export type MaintenancePlan = typeof maintenancePlans.$inferSelect;

export type InsertMaintenancePlanItem = z.infer<typeof insertMaintenancePlanItemSchema>;
export type MaintenancePlanItem = typeof maintenancePlanItems.$inferSelect;

export type InsertMaintenanceTask = z.infer<typeof insertMaintenanceTaskSchema>;
export type MaintenanceTask = typeof maintenanceTasks.$inferSelect;

export type InsertMaintenancePart = z.infer<typeof insertMaintenancePartSchema>;
export type MaintenancePart = typeof maintenanceParts.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertProcessTracking = z.infer<typeof insertProcessTrackingSchema>;
export type ProcessTracking = typeof processTracking.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertProductionPlan = z.infer<typeof insertProductionPlanSchema>;
export type ProductionPlan = typeof productionPlans.$inferSelect;

export type InsertProductionStep = z.infer<typeof insertProductionStepSchema>;
export type ProductionStep = typeof productionSteps.$inferSelect;

export type InsertProductionCard = z.infer<typeof insertProductionCardSchema>;
export type ProductionCard = typeof productionCards.$inferSelect;

export type InsertCardMovement = z.infer<typeof insertCardMovementSchema>;
export type CardMovement = typeof productionCardMovements.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertQualityInspection = z.infer<typeof insertQualityInspectionSchema>;
export type QualityInspection = typeof fabricQualityInspections.$inferSelect;

export type InsertFabricType = z.infer<typeof insertFabricTypeSchema>;
export type FabricType = typeof fabricTypes.$inferSelect;

// CRM ve Etkileşim şemaları
export const insertCustomerInteractionSchema = createInsertSchema(customerInteractions, {
  interactionType: z.enum(['Toplantı', 'Telefon', 'E-posta', 'Ziyaret', 'Diğer']),
  subject: z.string().min(3, "Konu en az 3 karakter olmalıdır"),
  details: z.string().optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.date().optional().nullable(),
  status: z.enum(['açık', 'kapalı', 'takip bekleniyor']).optional()
}).omit({ id: true, interactionDate: true });

export const insertOpportunitySchema = createInsertSchema(opportunities, {
  title: z.string().min(3, "Başlık en az 3 karakter olmalıdır"),
  description: z.string().optional(),
  estimatedValue: z.number().optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.date().optional(),
  status: z.enum(['tahmin', 'teklif verildi', 'kazanıldı', 'kaybedildi'])
}).omit({ id: true, createdAt: true, updatedAt: true });

// Sevkiyat şemaları
export const insertShipmentSchema = createInsertSchema(shipments, {
  shipmentNo: z.string().min(3, "Sevkiyat numarası en az 3 karakter olmalıdır"),
  plannedDate: z.date(),
  actualDate: z.date().optional().nullable(),
  status: z.enum(['planned', 'in-progress', 'shipped', 'delivered', 'cancelled']).optional(),
  notes: z.string().optional()
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertShipmentDocumentSchema = createInsertSchema(shipmentDocuments, {
  documentType: z.enum(['invoice', 'delivery_note', 'export_document', 'other']),
  documentNo: z.string().min(3, "Belge numarası en az 3 karakter olmalıdır"),
  documentDate: z.date(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  filePath: z.string().optional()
}).omit({ id: true, createdAt: true });

export const insertPackingSchema = createInsertSchema(packingSchema, {
  packageNo: z.string().min(3, "Paket numarası en az 3 karakter olmalıdır").optional(),
  packageType: z.string().optional(),
  width: z.string().optional(),
  height: z.string().optional(),
  length: z.string().optional(),
  grossWeight: z.string().optional(),
  netWeight: z.string().optional(),
  content: z.string().optional()
}).omit({ id: true, createdAt: true });

export const insertShipmentTrackingSchema = createInsertSchema(shipmentTracking, {
  trackingNumber: z.string().min(3, "Takip numarası en az 3 karakter olmalıdır").optional(),
  carrier: z.string().optional(),
  status: z.string().optional(),
  estimatedDelivery: z.date().optional().nullable(),
  actualDelivery: z.date().optional().nullable(),
  notes: z.string().optional()
}).omit({ id: true, createdAt: true, updatedAt: true });

// Ek tip tanımlamaları
export type InsertCustomerInteraction = z.infer<typeof insertCustomerInteractionSchema>;
export type CustomerInteraction = typeof customerInteractions.$inferSelect;

export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Opportunity = typeof opportunities.$inferSelect;

export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type Shipment = typeof shipments.$inferSelect;

export type InsertShipmentDocument = z.infer<typeof insertShipmentDocumentSchema>;
export type ShipmentDocument = typeof shipmentDocuments.$inferSelect;

export type InsertPacking = z.infer<typeof insertPackingSchema>;
export type Packing = typeof packingSchema.$inferSelect;

export type InsertShipmentTracking = z.infer<typeof insertShipmentTrackingSchema>;
export type ShipmentTracking = typeof shipmentTracking.$inferSelect;

export type Department = typeof departments.$inferSelect;
export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type ProcessType = typeof processTypes.$inferSelect;
export type RouteTemplate = typeof routeTemplates.$inferSelect;
export type RouteTemplateStep = typeof routeTemplateSteps.$inferSelect;
export type Machine = typeof machines.$inferSelect;
export type MachineType = typeof machineTypes.$inferSelect;
export type YarnType = typeof yarnTypes.$inferSelect;

// Tracking events - production card tracking
export const trackingEvents = pgTable("tracking_events", {
  id: serial("id").primaryKey(),
  productionCardId: integer("production_card_id").references(() => productionCards.id).notNull(),
  type: text("type").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  departmentId: integer("department_id").references(() => departments.id),
  machineId: integer("machine_id"),
  details: jsonb("details"),
});

export type TrackingEvent = typeof trackingEvents.$inferSelect;
export const insertTrackingEventSchema = createInsertSchema(trackingEvents);
export type InsertTrackingEvent = z.infer<typeof insertTrackingEventSchema>;
export type RawMaterial = typeof rawMaterials.$inferSelect;

// Şema tanımlamaları ekle
export const insertDepartmentSchema = createInsertSchema(departments);
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export const insertUserSchema = createInsertSchema(users, {
  password: z.string().min(6)
});
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertRoleSchema = createInsertSchema(roles);
export type InsertRole = z.infer<typeof insertRoleSchema>;

export const insertOrderStatusSchema = createInsertSchema(orderStatuses);
export type InsertOrderStatus = z.infer<typeof insertOrderStatusSchema>;

export const insertYarnTypeSchema = createInsertSchema(yarnTypes);
export type InsertYarnType = z.infer<typeof insertYarnTypeSchema>;

export const insertRawMaterialSchema = createInsertSchema(rawMaterials);
export type InsertRawMaterial = z.infer<typeof insertRawMaterialSchema>;

export const insertProcessTypeSchema = createInsertSchema(processTypes);
export type InsertProcessType = z.infer<typeof insertProcessTypeSchema>;

export const insertMachineTypeSchema = createInsertSchema(machineTypes);
export type InsertMachineType = z.infer<typeof insertMachineTypeSchema>;

export const insertMachineSchema = createInsertSchema(machines);
export type InsertMachine = z.infer<typeof insertMachineSchema>;

// Kalite Kontrol Modülü Tabloları
// DMn_Kontrol tablosu - Kumaş toplarının temel bilgileri
export const qualityFabricRolls = pgTable("quality_fabric_rolls", {
  id: serial("id").primaryKey(),
  logicalRef: integer("logical_ref").notNull(), // LogicalRef
  barCode: text("bar_code").notNull(), // TBarKodu
  productId: integer("product_id"), // UrunId
  batchNo: text("batch_no"), // PartiNo
  weftLot: text("weft_lot"), // ALotu
  warpLot: text("warp_lot"), // CLotu
  yarnType: text("yarn_type"), // YunTipi
  weightKg: numeric("weight_kg"), // TKg
  lengthM: numeric("length_m"), // TMt
  materialBarCode: text("material_bar_code"), // MBarKodu
  qualitySystemId: integer("quality_system_id"), // CtkSisId
  entryId: integer("entry_id"), // GiriSid
  completionDate: timestamp("completion_date"), // BitirilmeDate
  updatedBy: text("updated_by"), // UppUser
  updatedAt: timestamp("updated_at"), // UppDate
  actualWeightKg: numeric("actual_weight_kg"), // HTKg
  actualLengthM: numeric("actual_length_m"), // HTMt
  actualWidth: numeric("actual_width"), // HCmsi
  label: text("label"), // HEtDb
  flagDate: timestamp("flag_date"), // FlagDate
  flagUser: text("flag_user"), // FlagUser
  heddle: text("heddle"), // HHeden
  bagNo: text("bag_no"), // CuvaIno
  lotUser: text("lot_user"), // LotUser
  status: text("status").default("active"), // Aktif, İnceleniyor, Tamamlandı
  operatorId: integer("operator_id").references(() => users.id),
  machineId: integer("machine_id").references(() => machines.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// DMn_TopHata tablosu - Top hatalarının kaydedildiği tablo
export const qualityFabricDefects = pgTable("quality_fabric_defects", {
  id: serial("id").primaryKey(),
  fabricRollId: integer("fabric_roll_id").notNull().references(() => qualityFabricRolls.id),
  defectCode: text("defect_code").notNull(), // Hata kodu
  defectName: text("defect_name"), // Hata adı
  startMeter: numeric("start_meter").notNull(), // Başlangıç metresi
  endMeter: numeric("end_meter").notNull(), // Bitiş metresi
  points: numeric("points"), // Puan
  notes: text("notes"), // Notlar
  location: text("location"), // Konum (sol, orta, sağ)
  severity: text("severity"), // Şiddet (hafif, orta, ağır)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id),
});

// DMn_TblKaliteSistemleri tablosu - Kalite değerlendirme sistemleri
export const qualitySystems = pgTable("quality_systems", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // SistemAdi - Sistem adı
  description: text("description"), // Aciklama - Açıklama
  isDefault: boolean("is_default").default(false), // varsayilan - Varsayılan mı
  pointCriteria: text("point_criteria"), // pkriter - Puan kriteri
  maxCategory1Points: numeric("max_category1_points"), // PMax1KHataPuan - 1. kategori maksimum hata puanı
  maxCategory2Points: numeric("max_category2_points"), // PMax2KHataPuan - 2. kategori maksimum hata puanı
  maxCategory3Points: numeric("max_category3_points"), // PMax3KHataPuan - 3. kategori maksimum hata puanı
  maxCategory1Score: numeric("max_category1_score"), // PMax1KPuan2 - 1. kategori maksimum puan
  maxCategory2Score: numeric("max_category2_score"), // PMax2KPuan2 - 2. kategori maksimum puan
  maxCategory3Score: numeric("max_category3_score"), // PMax3KPuan2 - 3. kategori maksimum puan
  maxPointsPerMeter: numeric("max_points_per_meter"), // MaxBirMetrePuan - Metre başına maksimum puan
  isActive: boolean("is_active").default(true), // Aktif mi
});

// DMn_TblKaliteHataPuan tablosu - Hata kodları ve puanları
export const qualityDefectCodes = pgTable("quality_defect_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // Hata kodu
  name: text("name").notNull(), // Hata adı
  description: text("description"), // Açıklama
  points: numeric("points").notNull(), // Puan değeri
  isActive: boolean("is_active").default(true), // Aktif mi
  category: text("category"), // Kategori (iplik, dokuma, boya, vb.)
});

// DMn_TblKalitePuanKriter tablosu - Kalite puanlama kriterleri
export const qualityScoringCriteria = pgTable("quality_scoring_criteria", {
  id: serial("id").primaryKey(),
  systemId: integer("system_id").notNull().references(() => qualitySystems.id),
  name: text("name").notNull(), // Kriter adı
  description: text("description"), // Açıklama
  maxPoints: numeric("max_points").notNull(), // Maksimum puan
  formula: text("formula"), // Hesaplama formülü
  isActive: boolean("is_active").default(true), // Aktif mi
});

// Kalite ölçüm cihazları
export const qualityMeasurementDevices = pgTable("quality_measurement_devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Cihaz adı
  type: text("type").notNull(), // Cihaz tipi (tartı, metre, vs.)
  comPort: text("com_port").notNull(), // COM port bilgisi
  baudRate: integer("baud_rate").default(9600), // Baud rate
  dataBits: integer("data_bits").default(8), // Data bits
  parity: text("parity").default("none"), // Parity (none, odd, even)
  stopBits: integer("stop_bits").default(1), // Stop bits
  flowControl: text("flow_control").default("none"), // Flow control
  machineId: integer("machine_id").references(() => machines.id), // Bağlı olduğu makine
  isActive: boolean("is_active").default(true), // Aktif mi
  lastCalibrationDate: timestamp("last_calibration_date"), // Son kalibrasyon tarihi
});

export const insertQualityFabricRollSchema = createInsertSchema(qualityFabricRolls);
export type InsertQualityFabricRoll = z.infer<typeof insertQualityFabricRollSchema>;
export type QualityFabricRoll = typeof qualityFabricRolls.$inferSelect;

export const insertQualityFabricDefectSchema = createInsertSchema(qualityFabricDefects);
export type InsertQualityFabricDefect = z.infer<typeof insertQualityFabricDefectSchema>;
export type QualityFabricDefect = typeof qualityFabricDefects.$inferSelect;

export const insertQualitySystemSchema = createInsertSchema(qualitySystems);
export type InsertQualitySystem = z.infer<typeof insertQualitySystemSchema>;
export type QualitySystem = typeof qualitySystems.$inferSelect;

export const insertQualityDefectCodeSchema = createInsertSchema(qualityDefectCodes);
export type InsertQualityDefectCode = z.infer<typeof insertQualityDefectCodeSchema>;
export type QualityDefectCode = typeof qualityDefectCodes.$inferSelect;

export const insertQualityScoringCriteriaSchema = createInsertSchema(qualityScoringCriteria);
export type InsertQualityScoringCriteria = z.infer<typeof insertQualityScoringCriteriaSchema>;
export type QualityScoringCriteria = typeof qualityScoringCriteria.$inferSelect;

export const insertQualityMeasurementDeviceSchema = createInsertSchema(qualityMeasurementDevices);
export type InsertQualityMeasurementDevice = z.infer<typeof insertQualityMeasurementDeviceSchema>;

export type QualityMeasurementDevice = typeof qualityMeasurementDevices.$inferSelect;

// Barkod sistemi için yeni tablolar
// Refakat kartı, iplik çıkış fişi ve kartela için ortak barkod yapısı

// İplik stok tablosu
export const yarnInventory = pgTable("yarn_inventory", {
  id: serial("id").primaryKey(),
  yarnCode: text("yarn_code").notNull().unique(), // Benzersiz iplik kodu
  yarnType: text("yarn_type").notNull(), // İplik tipi
  count: text("count").notNull(), // Numara (Ne)
  composition: text("composition").notNull(), // Kompozisyon (Pamuk, Poly, vb)
  color: text("color"), // Renk
  supplier: text("supplier").notNull(), // Tedarikçi
  lotNumber: text("lot_number").notNull(), // Lot numarası
  stockQuantity: numeric("stock_quantity").notNull(), // Stok miktarı
  unitOfMeasure: text("unit_of_measure").notNull().default("kg"), // Ölçü birimi
  location: text("location").notNull(), // Depo konumu
  receiptDate: date("receipt_date").notNull(), // Alım tarihi
  status: text("status").notNull().default("Aktif"), // Aktif, Rezerve, Düşük Stok, Tükenmiş
  minStockLevel: numeric("min_stock_level").default("0"), // Minimum stok seviyesi
  notes: text("notes"), // Notlar
  batchResults: jsonb("batch_results"), // Test sonuçları
  unitPrice: numeric("unit_price"), // Birim fiyat
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// İplik hareketleri tablosu
export const yarnMovements = pgTable("yarn_movements", {
  id: serial("id").primaryKey(),
  yarnInventoryId: integer("yarn_inventory_id").notNull().references(() => yarnInventory.id), // İplik ID referansı
  movementType: text("movement_type").notNull(), // Giriş, Çıkış, Transfer, Düzeltme
  quantity: numeric("quantity").notNull(), // Miktar
  unitOfMeasure: text("unit_of_measure").notNull().default("kg"), // Ölçü birimi
  source: text("source"), // Hareketin kaynağı (GİRİŞ için tedarikçi, ÇIKIŞ için sipariş)
  sourceId: text("source_id"), // Kaynak ID (Sipariş no, Tedarikçi, vb)
  departmentId: integer("department_id").notNull().references(() => departments.id), // İşlemi yapan departman
  destinationDepartmentId: integer("destination_department_id").references(() => departments.id), // Hedef departman
  userId: integer("user_id").notNull().references(() => users.id), // İşlemi yapan kullanıcı
  moveDate: timestamp("move_date").notNull().defaultNow(), // Hareket tarihi
  notes: text("notes"), // Notlar
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// İplik çıkış kartları tablosu
export const yarnIssueCards = pgTable("yarn_issue_cards", {
  id: serial("id").primaryKey(),
  cardNumber: text("card_number").notNull().unique(), // Kart numarası
  yarnInventoryId: integer("yarn_inventory_id").notNull().references(() => yarnInventory.id), // İplik ID referansı
  yarnType: text("yarn_type").notNull(), // İplik tipi 
  count: text("count"), // Numara
  color: text("color"), // Renk
  quantity: numeric("quantity").notNull(), // Miktar
  unitOfMeasure: text("unit_of_measure").notNull().default("kg"), // Ölçü birimi
  batchNumber: text("batch_number").notNull(), // Parti numarası
  orderId: integer("order_id").references(() => orders.id), // İlişkili sipariş
  orderNumber: text("order_number"), // Sipariş numarası
  currentDepartmentId: integer("current_department_id").notNull().references(() => departments.id), // Mevcut departman
  destinationDepartmentId: integer("destination_department_id").notNull().references(() => departments.id), // Hedef departman
  status: text("status").notNull().default("created"), // Durum: created, in-transit, received, completed
  barcodeData: text("barcode_data").notNull(), // Barkod verisi
  qrCodeData: jsonb("qr_code_data"), // QR kod JSON verisi
  notes: text("notes"), // Notlar
  createdBy: integer("created_by").notNull().references(() => users.id), // Oluşturan kullanıcı
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Dokuma Refakat Kartları tablosu - mevcut productionCards tablosuna ek
export const weaveProductionCards = pgTable("weave_production_cards", {
  id: serial("id").primaryKey(),
  cardNumber: text("card_number").notNull().unique(), // Kart numarası
  batchNumber: text("batch_number").notNull(), // Parti numarası
  orderId: integer("order_id").references(() => orders.id), // İlişkili sipariş
  orderNumber: text("order_number"), // Sipariş numarası
  customerId: integer("customer_id").references(() => customers.id), // Müşteri ID
  customerName: text("customer_name"), // Müşteri adı (hızlı erişim için)
  fabricTypeId: integer("fabric_type_id").references(() => fabricTypes.id), // Kumaş tipi ID
  fabricType: text("fabric_type"), // Kumaş tipi adı (hızlı erişim için)
  yarnType: text("yarn_type"), // İplik türü
  width: text("width"), // En (cm)
  length: text("length"), // Boy (metre) 
  color: text("color"), // Renk
  productionPlanId: integer("production_plan_id").references(() => productionPlans.id), // Üretim planı ID
  currentDepartmentId: integer("current_department_id").notNull().references(() => departments.id), // Mevcut departman
  status: text("status").notNull().default("created"), // Durum: created, in-progress, completed
  barcodeData: text("barcode_data").notNull(), // Barkod verisi
  qrCodeData: jsonb("qr_code_data"), // QR kod JSON verisi
  notes: text("notes"), // Notlar
  createdBy: integer("created_by").notNull().references(() => users.id), // Oluşturan kullanıcı
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Dokuma kartı izleme olayları tablosu
export const weaveCardTrackingEvents = pgTable("weave_card_tracking_events", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").notNull().references(() => weaveProductionCards.id), // Kart ID
  eventType: text("event_type").notNull(), // Olay türü: process_in, process_out, quality_check
  departmentId: integer("department_id").notNull().references(() => departments.id), // İşlemi yapan departman
  machineId: integer("machine_id").references(() => machines.id), // İlgili makine
  userId: integer("user_id").notNull().references(() => users.id), // İşlemi yapan kullanıcı
  status: text("status").notNull(), // Durum: in-progress, completed, rejected
  details: jsonb("details"), // Olay detayları
  timestamp: timestamp("timestamp").notNull().defaultNow(), // Olay zamanı
});

// Kumaş numuneleri (Kartela) tablosu
export const fabricSamples = pgTable("fabric_samples", {
  id: serial("id").primaryKey(),
  sampleNumber: text("sample_number").notNull().unique(), // Numune numarası
  orderId: integer("order_id").references(() => orders.id), // İlişkili sipariş
  orderNumber: text("order_number"), // Sipariş numarası
  customerId: integer("customer_id").references(() => customers.id), // Müşteri ID
  customerName: text("customer_name"), // Müşteri adı (hızlı erişim için)
  fabricTypeId: integer("fabric_type_id").references(() => fabricTypes.id), // Kumaş tipi ID
  fabricType: text("fabric_type").notNull(), // Kumaş tipi adı (hızlı erişim için)
  composition: text("composition"), // Kompozisyon
  weavePatternId: integer("weave_pattern_id").references(() => fabricTypes.id), // Dokuma deseni ID
  weavePatternName: text("weave_pattern_name"), // Dokuma deseni adı (hızlı erişim için)
  width: text("width"), // En (cm)
  weight: text("weight"), // Gramaj (g/m²)
  color: text("color"), // Renk
  sampleSize: text("sample_size"), // Numune boyutu
  departmentId: integer("department_id").notNull().references(() => departments.id), // İlgili departman
  status: text("status").notNull().default("draft"), // Durum: draft, approved, rejected, production
  barcodeData: text("barcode_data").notNull(), // Barkod verisi
  qrCodeData: jsonb("qr_code_data"), // QR kod JSON verisi
  notes: text("notes"), // Notlar
  createdBy: integer("created_by").notNull().references(() => users.id), // Oluşturan kullanıcı
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Kumaş numunesi onay geçmişi tablosu
export const fabricSampleApprovals = pgTable("fabric_sample_approvals", {
  id: serial("id").primaryKey(),
  sampleId: integer("sample_id").notNull().references(() => fabricSamples.id), // Numune ID
  status: text("status").notNull(), // Onay durumu: draft, approved, rejected, production
  userId: integer("user_id").notNull().references(() => users.id), // İşlemi yapan kullanıcı
  userName: text("user_name").notNull(), // Kullanıcı adı (hızlı erişim için)
  comments: text("comments"), // Onay/red açıklaması
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Barkodlu takip sistemi için şema tanımları
export const insertYarnInventorySchema = createInsertSchema(yarnInventory);
export type InsertYarnInventory = z.infer<typeof insertYarnInventorySchema>;
export type YarnInventory = typeof yarnInventory.$inferSelect;

export const insertYarnMovementSchema = createInsertSchema(yarnMovements);
export type InsertYarnMovement = z.infer<typeof insertYarnMovementSchema>;
export type YarnMovement = typeof yarnMovements.$inferSelect;

export const insertYarnIssueCardSchema = createInsertSchema(yarnIssueCards);
export type InsertYarnIssueCard = z.infer<typeof insertYarnIssueCardSchema>;
export type YarnIssueCard = typeof yarnIssueCards.$inferSelect;

export const insertWeaveProductionCardSchema = createInsertSchema(weaveProductionCards);
export type InsertWeaveProductionCard = z.infer<typeof insertWeaveProductionCardSchema>;
export type WeaveProductionCard = typeof weaveProductionCards.$inferSelect;

export const insertWeaveCardTrackingEventSchema = createInsertSchema(weaveCardTrackingEvents);
export type InsertWeaveCardTrackingEvent = z.infer<typeof insertWeaveCardTrackingEventSchema>;
export type WeaveCardTrackingEvent = typeof weaveCardTrackingEvents.$inferSelect;

export const insertFabricSampleSchema = createInsertSchema(fabricSamples);
export type InsertFabricSample = z.infer<typeof insertFabricSampleSchema>;
export type FabricSample = typeof fabricSamples.$inferSelect;

export const insertFabricSampleApprovalSchema = createInsertSchema(fabricSampleApprovals);
export type InsertFabricSampleApproval = z.infer<typeof insertFabricSampleApprovalSchema>;
export type FabricSampleApproval = typeof fabricSampleApprovals.$inferSelect;

// Kartela Sistemi Tabloları
// Kumaş Kartela Tablosu
export const fabricSwatches = pgTable("fabric_swatches", {
  id: serial("id").primaryKey(),
  swatchId: varchar("swatch_id", { length: 50 }).notNull().unique(), // Kartela kodu
  swatchName: varchar("swatch_name", { length: 255 }).notNull(), // Kartela adı
  fabricTypeId: integer("fabric_type_id").references(() => fabricTypes.id), // Kumaş tipi ID
  fabricType: varchar("fabric_type", { length: 100 }).notNull(), // Kumaş tipi adı
  collection: varchar("collection", { length: 100 }).notNull(), // Koleksiyon adı
  season: varchar("season", { length: 50 }).notNull(), // Sezon bilgisi
  creationDate: date("creation_date").notNull(), // Oluşturma tarihi
  width: varchar("width", { length: 50 }), // Kumaş eni (cm)
  weight: varchar("weight", { length: 50 }), // Kumaş gramajı (gr/m2)
  composition: varchar("composition", { length: 255 }), // Kumaş kompozisyonu
  customerId: integer("customer_id").references(() => customers.id), // Müşteri ID
  customerName: varchar("customer_name", { length: 255 }), // Müşteri adı
  availableColors: jsonb("available_colors"), // Mevcut renkler (JSON dizisi)
  status: varchar("status", { length: 50 }).notNull().default("Aktif"), // Durum: Aktif, Pasif, Yeni, Onay Bekliyor
  notes: text("notes"), // Notlar
  pricePerMeter: varchar("price_per_meter", { length: 50 }), // Metre fiyatı
  minOrderQuantity: varchar("min_order_quantity", { length: 50 }), // Minimum sipariş adedi
  leadTime: varchar("lead_time", { length: 50 }), // Tedarik süresi
  imageUrl: text("image_url"), // Kumaş görseli URL
  barcodeNumber: varchar("barcode_number", { length: 50 }).unique(), // Barkod numarası
  weavePattern: varchar("weave_pattern", { length: 100 }), // Dokuma deseni
  finishingOptions: jsonb("finishing_options"), // Terbiye seçenekleri (JSON dizisi)
  usageAreas: jsonb("usage_areas"), // Kullanım alanları (JSON dizisi)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id), // Oluşturan kullanıcı
  updatedBy: integer("updated_by").references(() => users.id), // Güncelleyen kullanıcı
});

// Renk Kartela Tablosu
export const colorSwatches = pgTable("color_swatches", {
  id: serial("id").primaryKey(),
  colorId: varchar("color_id", { length: 50 }).notNull().unique(), // Renk kodu
  colorName: varchar("color_name", { length: 255 }).notNull(), // Renk adı
  category: varchar("category", { length: 100 }).notNull(), // Renk kategorisi
  colorFamily: varchar("color_family", { length: 100 }).notNull(), // Renk ailesi
  hexCode: varchar("hex_code", { length: 20 }).notNull(), // HEX renk kodu
  pantoneCode: varchar("pantone_code", { length: 50 }), // Pantone renk kodu
  collection: varchar("collection", { length: 100 }), // Koleksiyon adı
  season: varchar("season", { length: 50 }), // Sezon bilgisi
  status: varchar("status", { length: 50 }).notNull().default("Aktif"), // Durum: Aktif, Pasif, Yeni, Onay Bekliyor, Stoklarda Tükendi
  availableFabrics: jsonb("available_fabrics"), // Mevcut kumaşlar (JSON dizisi)
  notes: text("notes"), // Notlar
  imageUrl: text("image_url"), // Renk görseli URL
  barcodeNumber: varchar("barcode_number", { length: 50 }).unique(), // Barkod numarası
  supplierName: varchar("supplier_name", { length: 255 }), // Tedarikçi adı
  supplierReference: varchar("supplier_reference", { length: 100 }), // Tedarikçi referans kodu
  cost: varchar("cost", { length: 50 }), // Maliyet
  minimumQuantity: varchar("minimum_quantity", { length: 50 }), // Minimum sipariş adedi
  leadTime: varchar("lead_time", { length: 50 }), // Tedarik süresi
  rgbValue: varchar("rgb_value", { length: 50 }), // RGB değeri
  cmykValue: varchar("cmyk_value", { length: 50 }), // CMYK değeri
  colorCompatibility: jsonb("color_compatibility"), // Uyumlu renkler (JSON dizisi)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id), // Oluşturan kullanıcı
  updatedBy: integer("updated_by").references(() => users.id), // Güncelleyen kullanıcı
});

// Koleksiyonlar Tablosu
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(), // Koleksiyon adı
  code: varchar("code", { length: 50 }).unique(), // Koleksiyon kodu
  season: varchar("season", { length: 50 }).notNull(), // Sezon bilgisi
  year: varchar("year", { length: 10 }).notNull(), // Yıl bilgisi
  description: text("description"), // Açıklama
  status: varchar("status", { length: 50 }).notNull().default("Aktif"), // Durum: Aktif, Pasif, Arşiv
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Renk Kategorileri Tablosu
export const colorCategories = pgTable("color_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(), // Kategori adı
  description: text("description"), // Açıklama
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Renk Aileleri Tablosu
export const colorFamilies = pgTable("color_families", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(), // Aile adı
  description: text("description"), // Açıklama
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Kumaş-Renk İlişki Tablosu
export const fabricColorRelations = pgTable("fabric_color_relations", {
  id: serial("id").primaryKey(),
  fabricSwatchId: integer("fabric_swatch_id").notNull().references(() => fabricSwatches.id), // Kumaş kartela ID
  colorSwatchId: integer("color_swatch_id").notNull().references(() => colorSwatches.id), // Renk kartela ID
  isAvailable: boolean("is_available").notNull().default(true), // Mevcut mu?
  notes: text("notes"), // Notlar
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    uniqueRelation: uniqueIndex("fabric_color_unique").on(table.fabricSwatchId, table.colorSwatchId), // Benzersiz ilişki
  };
});

// Kartela Sistemi için Şema Tanımları
export const insertFabricSwatchSchema = createInsertSchema(fabricSwatches, {
  availableColors: z.array(z.string()).optional(),
  finishingOptions: z.array(z.string()).optional(),
  usageAreas: z.array(z.string()).optional(),
});
export type InsertFabricSwatch = z.infer<typeof insertFabricSwatchSchema>;
export type FabricSwatch = typeof fabricSwatches.$inferSelect;

export const insertColorSwatchSchema = createInsertSchema(colorSwatches, {
  availableFabrics: z.array(z.string()).optional(),
  colorCompatibility: z.array(z.string()).optional(),
});
export type InsertColorSwatch = z.infer<typeof insertColorSwatchSchema>;
export type ColorSwatch = typeof colorSwatches.$inferSelect;

export const insertCollectionSchema = createInsertSchema(collections);
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;

export const insertColorCategorySchema = createInsertSchema(colorCategories);
export type InsertColorCategory = z.infer<typeof insertColorCategorySchema>;
export type ColorCategory = typeof colorCategories.$inferSelect;

export const insertColorFamilySchema = createInsertSchema(colorFamilies);
export type InsertColorFamily = z.infer<typeof insertColorFamilySchema>;
export type ColorFamily = typeof colorFamilies.$inferSelect;

export const insertFabricColorRelationSchema = createInsertSchema(fabricColorRelations);
export type InsertFabricColorRelation = z.infer<typeof insertFabricColorRelationSchema>;
export type FabricColorRelation = typeof fabricColorRelations.$inferSelect;

// Numune Sistemi Tabloları
export const sampleRequests = pgTable("sample_requests", {
  id: serial("id").primaryKey(),
  requestCode: text("request_code").notNull().unique(), // Otomatik oluşturulacak numune kodu (NR-2023001 gibi)
  customerId: integer("customer_id").notNull().references(() => customers.id),
  requestDate: timestamp("request_date").notNull().defaultNow(),
  requesterId: integer("requester_id").notNull().references(() => users.id),
  contactPersonName: text("contact_person_name"),
  contactPersonPhone: text("contact_person_phone"),
  contactPersonEmail: text("contact_person_email"),
  requestType: text("request_type").notNull(), // Yeni Numune, Revizyon, Benzer Numune
  status: text("status").notNull().default("Beklemede"),
  priority: text("priority").notNull().default("Normal"),
  dueDate: timestamp("due_date"),
  targetDeliveryDate: timestamp("target_delivery_date"),
  notes: text("notes"),
  referenceImages: jsonb("reference_images"), // JSON array for image URLs/paths
  referenceNotes: text("reference_notes"),
  title: text("title"),
  description: text("description"),
  requestedBy: integer("requested_by").references(() => users.id),
  assignedTo: integer("assigned_to").references(() => users.id),
  fabricTypeId: integer("fabric_type_id").references(() => fabricTypes.id),
  yarnTypeId: integer("yarn_type_id").references(() => yarnTypes.id),
  specifications: jsonb("specifications"), // JSON for technical details
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sampleOrders = pgTable("sample_orders", {
  id: serial("id").primaryKey(),
  orderCode: text("order_code").notNull().unique(), // Numune üretim emri kodu (NS-2023001 gibi)
  sampleRequestId: integer("sample_request_id").notNull().references(() => sampleRequests.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("Beklemede"),
  startDate: timestamp("start_date"),
  targetDate: timestamp("target_date"),
  completionDate: timestamp("completion_date"),
  quantity: integer("quantity").notNull().default(1),
  unit: text("unit").notNull().default("Adet"),
  assignedDepartmentId: integer("assigned_department_id").references(() => departments.id),
  assignedUserId: integer("assigned_user_id").references(() => users.id),
  approvalStatus: text("approval_status"),
  approvalDate: timestamp("approval_date"),
  approvedBy: integer("approved_by").references(() => users.id),
  routeTemplateId: integer("route_template_id").references(() => routeTemplates.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sampleProductionSteps = pgTable("sample_production_steps", {
  id: serial("id").primaryKey(),
  sampleOrderId: integer("sample_order_id").notNull().references(() => sampleOrders.id),
  stepName: text("step_name").notNull(),
  description: text("description"),
  processTypeId: integer("process_type_id").references(() => processTypes.id),
  departmentId: integer("department_id").notNull().references(() => departments.id),
  machineTypeId: integer("machine_type_id").references(() => machineTypes.id),
  machineId: integer("machine_id").references(() => machines.id),
  assignedUserId: integer("assigned_user_id").references(() => users.id),
  status: text("status").notNull().default("Beklemede"),
  sequence: integer("sequence").notNull(),
  plannedStartDate: timestamp("scheduled_start_date"),
  plannedEndDate: timestamp("scheduled_end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  duration: integer("duration"), // Dakika cinsinden
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sampleCards = pgTable("sample_cards", {
  id: serial("id").primaryKey(),
  cardNo: text("card_no").notNull().unique(),
  sampleOrderId: integer("sample_order_id").notNull().references(() => sampleOrders.id),
  status: text("status").notNull().default("Oluşturuldu"),
  barcode: text("barcode").notNull().unique(),
  currentDepartmentId: integer("current_department_id").references(() => departments.id),
  currentStepId: integer("current_step_id").references(() => sampleProductionSteps.id),
  fabricTypeId: integer("fabric_type_id").references(() => fabricTypes.id),
  width: numeric("width"), // Kumaş eni (cm)
  length: numeric("length"), // Kumaş boyu (metre)
  weight: numeric("weight"), // Ağırlık (kg)
  color: text("color"),
  properties: jsonb("properties"), // Özel özellikler
  printCount: integer("print_count").default(0).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sampleCardMovements = pgTable("sample_card_movements", {
  id: serial("id").primaryKey(),
  sampleCardId: integer("sample_card_id").notNull().references(() => sampleCards.id),
  departmentId: integer("department_id").notNull().references(() => departments.id),
  productionStepId: integer("production_step_id").references(() => sampleProductionSteps.id),
  userId: integer("user_id").notNull().references(() => users.id),
  machineId: integer("machine_id").references(() => machines.id),
  status: text("status").notNull().default("Başladı"),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  description: text("description"),
  notes: text("notes"),
  defects: jsonb("defects"), // Kusurlara dair bilgiler
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sampleFeedback = pgTable("sample_feedback", {
  id: serial("id").primaryKey(),
  sampleOrderId: integer("sample_order_id").notNull().references(() => sampleOrders.id),
  customerId: integer("customer_id").references(() => customers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  feedbackType: text("feedback_type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("Açık"),
  quality: integer("quality"), // 1-5 arası puan
  designSatisfaction: integer("design_satisfaction"), // 1-5 arası puan
  timelines: integer("timelines"), // 1-5 arası puan
  overallSatisfaction: integer("overall_satisfaction"), // 1-5 arası puan
  attachments: jsonb("attachments"), // Dosya ekleri
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSampleRequestSchema = createInsertSchema(sampleRequests, {
  requestType: z.enum(["Yeni Numune", "Revizyon", "Benzer Numune"]),
  status: z.enum(["Beklemede", "Onaylandı", "Reddedildi", "Tamamlandı"]).default("Beklemede"),
  priority: z.enum(["Düşük", "Normal", "Yüksek", "Acil"]).default("Normal"),
  referenceImages: z.array(z.string()).optional(),
});
export type InsertSampleRequest = z.infer<typeof insertSampleRequestSchema>;
export type SampleRequest = typeof sampleRequests.$inferSelect;

export const insertSampleOrderSchema = createInsertSchema(sampleOrders, {
  status: z.enum(["Beklemede", "Üretimde", "Tamamlandı", "İptal Edildi"]).default("Beklemede"),
  quantity: z.number().positive("Miktar sıfırdan büyük olmalıdır"),
  approvalStatus: z.enum(["Onaylandı", "Revizyon İstendi", "Reddedildi"]).optional(),
});
export type InsertSampleOrder = z.infer<typeof insertSampleOrderSchema>;
export type SampleOrder = typeof sampleOrders.$inferSelect;

export const insertSampleProductionStepSchema = createInsertSchema(sampleProductionSteps, {
  status: z.enum(["Beklemede", "Devam Ediyor", "Tamamlandı", "İptal Edildi"]).default("Beklemede"),
  sequence: z.number().int().positive("Sıra numarası sıfırdan büyük bir tamsayı olmalıdır"),
});
export type InsertSampleProductionStep = z.infer<typeof insertSampleProductionStepSchema>;
export type SampleProductionStep = typeof sampleProductionSteps.$inferSelect;

export const insertSampleCardSchema = createInsertSchema(sampleCards, {
  status: z.enum(["Oluşturuldu", "İşlemde", "Tamamlandı", "İptal Edildi"]).default("Oluşturuldu"),
  width: z.string().optional(),
  length: z.string().optional(),
  weight: z.string().optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
}).omit({ 
  cardNo: true, 
  barcode: true, 
  createdAt: true, 
  updatedAt: true,
  printCount: true 
});
export type InsertSampleCard = z.infer<typeof insertSampleCardSchema>;
export type SampleCard = typeof sampleCards.$inferSelect;

export const insertSampleCardMovementSchema = createInsertSchema(sampleCardMovements, {
  status: z.enum(["Başladı", "Tamamlandı", "İptal Edildi"]).default("Başladı"),
  defects: z.array(z.object({
    type: z.string(),
    location: z.string(),
    severity: z.enum(["Düşük", "Orta", "Yüksek"]),
    notes: z.string().optional()
  })).optional(),
});
export type InsertSampleCardMovement = z.infer<typeof insertSampleCardMovementSchema>;
export type SampleCardMovement = typeof sampleCardMovements.$inferSelect;

export const insertSampleFeedbackSchema = createInsertSchema(sampleFeedback, {
  feedbackType: z.enum(["Olumlu", "Olumsuz", "Revizyon Talebi"]),
  status: z.enum(["Açık", "İşlemde", "Kapatıldı"]).default("Açık"),
  quality: z.number().int().min(1).max(5).optional(),
  designSatisfaction: z.number().int().min(1).max(5).optional(),
  timelines: z.number().int().min(1).max(5).optional(),
  overallSatisfaction: z.number().int().min(1).max(5).optional(),
  attachments: z.array(z.string()).optional(),
});
export type InsertSampleFeedback = z.infer<typeof insertSampleFeedbackSchema>;
export type SampleFeedback = typeof sampleFeedback.$inferSelect;

// Etiket Yönetimi tabloları
export const labels = pgTable("labels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  width: text("width").notNull(),
  height: text("height").notNull(),
  description: text("description"),
  isQrCode: boolean("is_qr_code").default(false).notNull(),
  content: text("content").notNull(),
  fields: text("fields").notNull(), // JSON string
  departmentId: integer("department_id").references(() => departments.id),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// labelPrints tablosu üstte 910. satırda tanımlandığı için buradaki tanım kaldırıldı

export const insertLabelSchema = createInsertSchema(labels, {
  isQrCode: z.boolean().default(false),
}).omit({ id: true, createdAt: true, updatedAt: true });

//insertLabelPrintSchema tanımı labelPrintsSchema ile değiştirildi ve burada kullanılmıyor

export type InsertLabel = z.infer<typeof insertLabelSchema>;
export type Label = typeof labels.$inferSelect;

// InsertLabelPrint ve LabelPrint tipleri daha önceki tanımlarda verilmiştir (957-958. satırlar)
// Bu tanımlar çift tanımlamayı önlemek için kaldırıldı.

// Production Tracking Schema Types
// Yeni şema dosyasına geçiş için aşamalı değişiklik
// Şu anda mevcut tanımlar kullanılacak, ileriki aşamada yeni dosyaya geçilecek

