import { pgTable, serial, text, integer, boolean, jsonb, timestamp, real, index, primaryKey } from "drizzle-orm/pg-core";
import { SQL, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// KPI tablosu
export const planningKpis = pgTable("planning_kpis", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'operational', 'financial', 'productivity', 'quality'
  unit: text("unit").notNull(),
  target: real("target").notNull(),
  current: real("current").notNull().default(0),
  direction: text("direction").notNull(), // 'increase', 'decrease', 'maintain'
  frequency: text("frequency").notNull(), // 'daily', 'weekly', 'monthly', 'quarterly'
  responsible: integer("responsible_id").notNull(), // departmentId
  lastUpdated: timestamp("last_updated").defaultNow(),
  trend: text("trend").notNull().default("stable"), // 'up', 'down', 'stable'
  trendPercentage: real("trend_percentage").notNull().default(0),
  status: text("status").notNull().default("onTrack"), // 'onTrack', 'atRisk', 'offTrack'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// KPI değerlendirme tablosu
export const planKpiEvaluations = pgTable("plan_kpi_evaluations", {
  id: serial("id").primaryKey(),
  kpiId: integer("kpi_id").notNull().references(() => planningKpis.id, { onDelete: "cascade" }),
  evaluationDate: timestamp("evaluation_date").defaultNow(),
  actualValue: real("actual_value").notNull(),
  targetValue: real("target_value").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// KPI karşılaştırma tablosu
export const planKpiBenchmarks = pgTable("plan_kpi_benchmarks", {
  id: serial("id").primaryKey(),
  kpiId: integer("kpi_id").notNull().references(() => planningKpis.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  value: real("value").notNull(),
  description: text("description"),
  source: text("source"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Takvim etkinlikleri
export const planningCalendarEvents = pgTable("planning_calendar_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  type: text("type").notNull(), // 'plan', 'deadline', 'meeting', 'maintenance'
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'completed', 'cancelled'
  description: text("description"),
  departmentId: integer("department_id"),
  userId: integer("user_id"),
  relatedOrderId: integer("related_order_id"),
  relatedOrderCode: text("related_order_code"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// İleri düzey üretim planları
export const advancedProductionPlans = pgTable("advanced_production_plans", {
  id: serial("id").primaryKey(),
  planNo: text("plan_no").notNull().unique(),
  orderId: integer("order_id").notNull(),
  orderCode: text("order_code").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  customerId: integer("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(),
  priority: text("priority").notNull().default("normal"), // 'low', 'normal', 'high', 'urgent'
  status: text("status").notNull().default("planning"), // 'planning', 'in-process', 'completed', 'on-hold', 'cancelled'
  plannedStartDate: timestamp("planned_start_date").notNull(),
  plannedEndDate: timestamp("planned_end_date").notNull(),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  progress: real("progress").notNull().default(0),
  delayTime: real("delay_time"),
  currentStepId: integer("current_step_id"),
  currentDepartmentId: integer("current_department_id"),
  notes: text("notes"),
  createdBy: integer("created_by").notNull(),
  updatedBy: integer("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// İleri düzey üretim adımları
export const advancedProductionSteps = pgTable("advanced_production_steps", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => advancedProductionPlans.id, { onDelete: "cascade" }),
  stepOrder: integer("step_order").notNull(),
  departmentId: integer("department_id").notNull(),
  machineTypeId: integer("machine_type_id"),
  machineId: integer("machine_id"),
  stepName: text("step_name").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'in-process', 'completed', 'skipped'
  plannedStartDate: timestamp("planned_start_date").notNull(),
  plannedEndDate: timestamp("planned_end_date").notNull(),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  duration: real("duration").notNull(), // saat cinsinden
  assignedOperatorId: integer("assigned_operator_id"),
  notes: text("notes"),
  delayTime: real("delay_time"),
  progress: real("progress").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Optimizasyon önerileri
export const optimizationSuggestions = pgTable("optimization_suggestions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'scheduling', 'resource', 'capacity', 'workflow', 'bottleneck'
  impact: jsonb("impact").notNull(), // { leadTime, capacity, cost, quality }
  difficulty: text("difficulty").notNull(), // 'low', 'medium', 'high'
  priority: text("priority").notNull(), // 'low', 'medium', 'high', 'critical'
  status: text("status").notNull().default("new"), // 'new', 'inProgress', 'implemented', 'rejected'
  createdAt: timestamp("created_at").defaultNow(),
  implementedAt: timestamp("implemented_at"),
  requiredResources: jsonb("required_resources").default([]),
  affectedDepartments: jsonb("affected_departments").default([]),
  implementationSteps: jsonb("implementation_steps").default([]),
  potentialRisks: jsonb("potential_risks").default([]),
  roi: real("roi").notNull(),
  paybackPeriod: real("payback_period").notNull(),
  score: real("score").notNull(),
  createdBy: integer("created_by").notNull(),
  updatedBy: integer("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Departman kapasiteleri
export const departmentCapacities = pgTable("department_capacities", {
  id: serial("id").primaryKey(),
  departmentId: integer("department_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  capacityHours: real("capacity_hours").notNull(),
  plannedHours: real("planned_hours").notNull().default(0),
  currentUtilization: real("current_utilization").notNull().default(0),
  status: text("status").notNull().default("optimal"), // 'optimal', 'critical', 'overload'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Makine kapasiteleri
export const machineCapacities = pgTable("machine_capacities", {
  id: serial("id").primaryKey(),
  machineId: integer("machine_id").notNull(),
  departmentId: integer("department_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  capacityHours: real("capacity_hours").notNull(),
  plannedHours: real("planned_hours").notNull().default(0),
  currentUtilization: real("current_utilization").notNull().default(0),
  status: text("status").notNull().default("optimal"), // 'optimal', 'critical', 'overload'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Planlama kesintileri (tatiller, bakımlar vb.)
export const planningInterruptions = pgTable("planning_interruptions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'holiday', 'maintenance', 'emergency', 'other'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  affectedDepartmentIds: jsonb("affected_department_ids").default([]),
  affectedMachineIds: jsonb("affected_machine_ids").default([]),
  description: text("description"),
  impact: text("impact").notNull(), // 'none', 'low', 'medium', 'high'
  status: text("status").notNull().default("active"), // 'planned', 'active', 'completed'
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Simülasyon senaryoları
export const simulationScenarios = pgTable("simulation_scenarios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  baselineId: integer("baseline_id").references(() => simulationScenarios.id),
  modifiedParameters: jsonb("modified_parameters").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'running', 'completed', 'failed'
  results: jsonb("results"),
  tags: jsonb("tags").default([]),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Refakat kartları takibi için gelişmiş modül
export const productionCards = pgTable("production_cards", {
  id: serial("id").primaryKey(),
  cardNo: text("card_no").notNull().unique(),
  orderId: integer("order_id").notNull(),
  orderCode: text("order_code").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  customerId: integer("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  quantity: real("quantity").notNull(),
  currentQuantity: real("current_quantity").notNull().default(0),
  unit: text("unit").notNull(),
  status: text("status").notNull().default("created"), // 'created', 'in-process', 'completed', 'rejected'
  currentDepartmentId: integer("current_department_id").notNull(),
  currentMachineId: integer("current_machine_id"),
  currentStepId: integer("current_step_id").notNull(),
  assignedOperatorId: integer("assigned_operator_id"),
  plannedStartDate: timestamp("planned_start_date").notNull(),
  plannedEndDate: timestamp("planned_end_date").notNull(),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  lastMovementDate: timestamp("last_movement_date"),
  delayTime: real("delay_time"),
  progress: real("progress").notNull().default(0),
  quality: real("quality").notNull().default(100),
  barcode: text("barcode").notNull().unique(),
  notes: text("notes"),
  lastActivity: text("last_activity"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Makine durumları
export const machineStatus = pgTable("machine_status", {
  id: serial("id").primaryKey(),
  machineId: integer("machine_id").notNull().unique(),
  status: text("status").notNull(), // 'running', 'idle', 'maintenance', 'breakdown', 'offline'
  currentJobId: integer("current_job_id"),
  startTime: timestamp("start_time"),
  runningTime: real("running_time"), // dakika olarak
  efficiency: real("efficiency").notNull().default(100), // yüzde olarak
  speed: real("speed"), // birim/saat
  utilization: real("utilization").notNull().default(0), // yüzde olarak
  nextMaintenanceDate: timestamp("next_maintenance_date"),
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  telemetry: jsonb("telemetry"),
  alerts: jsonb("alerts").default([]),
  operatorId: integer("operator_id"),
  lastUpdated: timestamp("last_updated").defaultNow()
});

// Makine telemetri kaydı
export const machineTelemetry = pgTable("machine_telemetry", {
  id: serial("id").primaryKey(),
  machineId: integer("machine_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  temperature: real("temperature"),
  vibration: real("vibration"),
  power: real("power"),
  pressure: real("pressure"),
  speed: real("speed"),
  otherParams: jsonb("other_params")
});

// Şema tipleri
export type PlanningKPI = typeof planningKpis.$inferSelect;
export type InsertPlanningKPI = typeof planningKpis.$inferInsert;

export type PlanKPIEvaluation = typeof planKpiEvaluations.$inferSelect;
export type InsertPlanKPIEvaluation = typeof planKpiEvaluations.$inferInsert;

export type PlanKPIBenchmark = typeof planKpiBenchmarks.$inferSelect;
export type InsertPlanKPIBenchmark = typeof planKpiBenchmarks.$inferInsert;

export type PlanningCalendarEvent = typeof planningCalendarEvents.$inferSelect;
export type InsertPlanningCalendarEvent = typeof planningCalendarEvents.$inferInsert;

export type AdvancedProductionPlan = typeof advancedProductionPlans.$inferSelect;
export type InsertAdvancedProductionPlan = typeof advancedProductionPlans.$inferInsert;

export type AdvancedProductionStep = typeof advancedProductionSteps.$inferSelect;
export type InsertAdvancedProductionStep = typeof advancedProductionSteps.$inferInsert;

export type OptimizationSuggestion = typeof optimizationSuggestions.$inferSelect;
export type InsertOptimizationSuggestion = typeof optimizationSuggestions.$inferInsert;

export type DepartmentCapacity = typeof departmentCapacities.$inferSelect;
export type InsertDepartmentCapacity = typeof departmentCapacities.$inferInsert;

export type MachineCapacity = typeof machineCapacities.$inferSelect;
export type InsertMachineCapacity = typeof machineCapacities.$inferInsert;

export type PlanningInterruption = typeof planningInterruptions.$inferSelect;
export type InsertPlanningInterruption = typeof planningInterruptions.$inferInsert;

export type SimulationScenario = typeof simulationScenarios.$inferSelect;
export type InsertSimulationScenario = typeof simulationScenarios.$inferInsert;

export type ProductionCard = typeof productionCards.$inferSelect;
export type InsertProductionCard = typeof productionCards.$inferInsert;

export type MachineStatus = typeof machineStatus.$inferSelect;
export type InsertMachineStatus = typeof machineStatus.$inferInsert;

export type MachineTelemetry = typeof machineTelemetry.$inferSelect;
export type InsertMachineTelemetry = typeof machineTelemetry.$inferInsert;

// Zod şemaları
export const insertPlanningKpiSchema = createInsertSchema(planningKpis);
export const insertPlanKpiEvaluationSchema = createInsertSchema(planKpiEvaluations);
export const insertPlanKpiBenchmarkSchema = createInsertSchema(planKpiBenchmarks);
export const insertPlanningCalendarEventSchema = createInsertSchema(planningCalendarEvents);
export const insertAdvancedProductionPlanSchema = createInsertSchema(advancedProductionPlans);
export const insertAdvancedProductionStepSchema = createInsertSchema(advancedProductionSteps);
export const insertOptimizationSuggestionSchema = createInsertSchema(optimizationSuggestions);
export const insertDepartmentCapacitySchema = createInsertSchema(departmentCapacities);
export const insertMachineCapacitySchema = createInsertSchema(machineCapacities);
export const insertPlanningInterruptionSchema = createInsertSchema(planningInterruptions);
export const insertSimulationScenarioSchema = createInsertSchema(simulationScenarios);
export const insertProductionCardSchema = createInsertSchema(productionCards);
export const insertMachineStatusSchema = createInsertSchema(machineStatus);
export const insertMachineTelemetrySchema = createInsertSchema(machineTelemetry);