import { Router, Request, Response } from "express";
import { db } from "../db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { users, departments } from "@shared/schema";
import { randomInt } from "crypto";

/**
 * Gelişmiş Planlama API Router'ı
 * Planlama departmanı için modernleştirilmiş API rotaları
 */
const advancedPlanningRouter = Router();

// Default export ekliyoruz - routes.ts içinde import etmek için
export default advancedPlanningRouter;

// Canlı İzleme: Fabrika Durumu API rotası
advancedPlanningRouter.get("/monitoring/factory-status", (req: Request, res: Response) => {
  res.json(getFactoryStatus());
});

// Canlı İzleme: Departman Özetleri API rotası
advancedPlanningRouter.get("/monitoring/department-summaries", (req: Request, res: Response) => {
  res.json(getDepartmentSummaries());
});

// Canlı İzleme: Makine Durumları API rotası
advancedPlanningRouter.get("/monitoring/machine-statuses", (req: Request, res: Response) => {
  const { department, status } = req.query;
  let machines = getMachineStatuses();
  
  if (department && department !== 'all') {
    machines = machines.filter(m => m.departmentId.toString() === department);
  }
  
  if (status && status !== 'all') {
    machines = machines.filter(m => m.status === status);
  }
  
  res.json(machines);
});

// Canlı İzleme: Aktif Refakat Kartları API rotası
advancedPlanningRouter.get("/monitoring/active-cards", (req: Request, res: Response) => {
  const { department, search } = req.query;
  let cards = getActiveCards();
  
  if (department && department !== 'all') {
    cards = cards.filter(c => c.currentDepartmentId.toString() === department);
  }
  
  if (search) {
    const searchStr = search.toString().toLowerCase();
    cards = cards.filter(c => 
      c.cardNo.toLowerCase().includes(searchStr) || 
      c.orderCode.toLowerCase().includes(searchStr) || 
      c.productName.toLowerCase().includes(searchStr) || 
      c.customerName.toLowerCase().includes(searchStr)
    );
  }
  
  res.json(cards);
});

// Canlı İzleme: Aktif Üretim Planları API rotası
advancedPlanningRouter.get("/monitoring/active-plans", (req: Request, res: Response) => {
  const { department, search } = req.query;
  let plans = getActivePlans();
  
  if (department && department !== 'all') {
    plans = plans.filter(p => p.currentDepartmentName && p.currentDepartmentName.includes(`Departman ${department}`));
  }
  
  if (search) {
    const searchStr = search.toString().toLowerCase();
    plans = plans.filter(p => 
      p.planNo.toLowerCase().includes(searchStr) || 
      p.orderCode.toLowerCase().includes(searchStr) || 
      p.productName.toLowerCase().includes(searchStr) || 
      p.customerName.toLowerCase().includes(searchStr)
    );
  }
  
  res.json(plans);
});

// Canlı İzleme: Makine Telemetrisi API rotası
advancedPlanningRouter.get("/monitoring/machine-telemetry/:machineId", (req: Request, res: Response) => {
  const machineId = parseInt(req.params.machineId);
  
  if (isNaN(machineId)) {
    return res.status(400).json({ error: "Geçersiz makine ID'si" });
  }
  
  res.json(getMachineTelemetry(machineId));
});

// Optimizasyon: Öneriler API rotası
advancedPlanningRouter.get("/optimization/suggestions", (req: Request, res: Response) => {
  const { category, status, priority } = req.query;
  let suggestions = getOptimizationSuggestions();
  
  if (category && category !== 'all') {
    suggestions = suggestions.filter(s => s.category === category);
  }
  
  if (status && status !== 'all') {
    suggestions = suggestions.filter(s => s.status === status);
  }
  
  if (priority && priority !== 'all') {
    suggestions = suggestions.filter(s => s.priority === priority);
  }
  
  res.json(suggestions);
});

// Optimizasyon: Öneri Durum Güncelleme API rotası
advancedPlanningRouter.patch("/optimization/suggestions/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  
  if (isNaN(id) || !status) {
    return res.status(400).json({ error: "Geçersiz ID veya durum" });
  }
  
  // Gerçekte burada veritabanı güncellemesi yapılacak
  
  res.json({ success: true, message: `Öneri ${id} durumu '${status}' olarak güncellendi.` });
});

// Optimizasyon: Yapay Zeka Önerileri API rotası
advancedPlanningRouter.get("/optimization/ai-recommendations", (req: Request, res: Response) => {
  res.json(getAiRecommendations());
});

// Optimizasyon: Yapay Zeka Önerisi Uygulama API rotası
advancedPlanningRouter.post("/optimization/ai-recommendations/:id/implement", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: "Geçersiz öneri ID'si" });
  }
  
  // Gerçekte burada veritabanına öneri kaydedilecek
  
  res.json({ success: true, message: `Yapay zeka önerisi ${id} başarıyla uygulandı.` });
});

// Optimizasyon: Üretim Analizi API rotası
advancedPlanningRouter.get("/optimization/analysis", (req: Request, res: Response) => {
  // Tarih aralığına göre filtreleme yapılabilir (şimdilik yok)
  res.json(getProductionAnalysis());
});

// KPI Yönetimi: KPI'lar API rotası
advancedPlanningRouter.get("/kpis", (req: Request, res: Response) => {
  const { category, status } = req.query;
  let kpis = getPlanningKPIs();
  
  if (category && category !== 'all') {
    kpis = kpis.filter(k => k.category === category);
  }
  
  if (status && status !== 'all') {
    kpis = kpis.filter(k => k.status === status);
  }
  
  res.json(kpis);
});

// KPI Yönetimi: KPI Değerlendirmesi API rotası
advancedPlanningRouter.get("/kpis/evaluation", (req: Request, res: Response) => {
  res.json(getKpiEvaluation());
});

// Planlama Takvimi: Etkinlikler API rotası
advancedPlanningRouter.get("/calendar/events", (req: Request, res: Response) => {
  const { month, department } = req.query;
  let events = getCalendarEvents(month as string);
  
  if (department && department !== 'all') {
    events = events.filter(e => e.departmentId?.toString() === department);
  }
  
  res.json(events);
});

// Simülasyon Merkezi: Senaryolar API rotası
advancedPlanningRouter.get("/simulation/scenarios", (req: Request, res: Response) => {
  const { tag } = req.query;
  let scenarios = getSimulationScenarios();
  
  if (tag && tag !== 'all') {
    scenarios = scenarios.filter(s => s.tags.includes(tag));
  }
  
  res.json(scenarios);
});

// Kapasite Planlama: Departman Kapasiteleri API rotası
advancedPlanningRouter.get("/capacity/departments", (req: Request, res: Response) => {
  const { from, to, department } = req.query;
  
  const departmentCapacities = Array.from({ length: 5 }, (_, i) => {
    const utilizationRate = Math.floor(Math.random() * 50) + 50;
    const isOptimal = utilizationRate < 70;
    const isOverload = utilizationRate > 90;
    
    return {
      id: i + 1,
      departmentId: i + 1,
      departmentName: `Departman ${i + 1}`,
      startDate: from || new Date(Date.now() - 2592000000).toISOString(),
      endDate: to || new Date(Date.now() + 2592000000).toISOString(),
      capacityHours: Math.floor(Math.random() * 500) + 500,
      plannedHours: Math.floor(Math.random() * 800) + 200,
      currentUtilization: utilizationRate,
      status: isOptimal ? 'optimal' : isOverload ? 'overload' : 'critical'
    };
  });
  
  let result = departmentCapacities;
  
  if (department && department !== 'all') {
    result = result.filter(d => d.departmentId.toString() === department);
  }
  
  res.json(result);
});

// Makine durumları örnek verileri (sonradan veritabanından çekilecek)
const getMachineStatuses = () => {
  const statuses = ['running', 'idle', 'maintenance', 'breakdown', 'offline'];
  const types = ['Dokuma', 'Boyama', 'Apre', 'Kalite Kontrol', 'Konfeksiyon'];
  
  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    name: `Makine ${i + 1}`,
    departmentId: Math.floor(i / 4) + 1,
    departmentName: `Departman ${Math.floor(i / 4) + 1}`,
    type: types[Math.floor(Math.random() * types.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    currentJobId: Math.random() > 0.3 ? Math.floor(Math.random() * 100) + 1 : null,
    currentJobName: Math.random() > 0.3 ? `İş ${Math.floor(Math.random() * 100) + 1}` : null,
    currentOrderCode: Math.random() > 0.3 ? `SIP-${Math.floor(Math.random() * 1000) + 1}` : null,
    startTime: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 36000000).toISOString() : null,
    runningTime: Math.random() > 0.3 ? Math.floor(Math.random() * 480) : null,
    efficiency: Math.floor(Math.random() * 100),
    speed: Math.floor(Math.random() * 200) + 50,
    utilization: Math.floor(Math.random() * 100),
    nextMaintenanceDate: new Date(Date.now() + Math.random() * 2592000000).toISOString(),
    lastMaintenanceDate: new Date(Date.now() - Math.random() * 2592000000).toISOString(),
    telemetry: {
      temperature: Math.floor(Math.random() * 30) + 50,
      vibration: Math.floor(Math.random() * 20) + 5,
      power: Math.floor(Math.random() * 200) + 300,
      pressure: Math.floor(Math.random() * 50) + 50,
      speed: Math.floor(Math.random() * 100) + 50
    },
    alerts: Array.from(
      { length: Math.floor(Math.random() * 3) }, 
      () => ({
        type: ['info', 'warning', 'critical'][Math.floor(Math.random() * 3)],
        message: `Uyarı: ${['Sıcaklık yüksek', 'Titreşim anormal', 'Güç tüketimi yüksek', 'Hız düşük', 'Bakım gerekiyor'][Math.floor(Math.random() * 5)]}`,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
      })
    ),
    operatorId: Math.random() > 0.3 ? Math.floor(Math.random() * 10) + 1 : null,
    operatorName: Math.random() > 0.3 ? `Operatör ${Math.floor(Math.random() * 10) + 1}` : null
  }));
};

// Departman özetleri örnek verileri
const getDepartmentSummaries = () => {
  return Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    name: `Departman ${i + 1}`,
    activeCards: Math.floor(Math.random() * 20) + 5,
    totalCards: Math.floor(Math.random() * 50) + 20,
    activePlans: Math.floor(Math.random() * 10) + 2,
    totalPlans: Math.floor(Math.random() * 20) + 10,
    machineStatuses: {
      running: Math.floor(Math.random() * 5) + 1,
      idle: Math.floor(Math.random() * 3) + 1,
      maintenance: Math.floor(Math.random() * 2),
      breakdown: Math.floor(Math.random() * 2),
      offline: Math.floor(Math.random() * 2)
    },
    avgProgress: Math.floor(Math.random() * 100),
    avgDelay: Math.floor(Math.random() * 10) - 5,
    bottleneckScore: Math.floor(Math.random() * 100),
    utilization: Math.floor(Math.random() * 100),
    workInProgress: Math.floor(Math.random() * 100)
  }));
};

// Fabrika durumu örnek verileri
const getFactoryStatus = () => {
  return {
    totalActivePlans: Math.floor(Math.random() * 50) + 20,
    totalActiveCards: Math.floor(Math.random() * 100) + 50,
    totalMachines: Math.floor(Math.random() * 30) + 10,
    machineStatuses: {
      running: Math.floor(Math.random() * 15) + 5,
      idle: Math.floor(Math.random() * 10) + 2,
      maintenance: Math.floor(Math.random() * 5) + 1,
      breakdown: Math.floor(Math.random() * 3),
      offline: Math.floor(Math.random() * 3)
    },
    departmentUtilization: {
      1: Math.floor(Math.random() * 100),
      2: Math.floor(Math.random() * 100),
      3: Math.floor(Math.random() * 100),
      4: Math.floor(Math.random() * 100),
      5: Math.floor(Math.random() * 100)
    },
    avgProgress: Math.floor(Math.random() * 100),
    avgDelay: Math.floor(Math.random() * 10) - 5,
    alertCount: Math.floor(Math.random() * 10),
    criticalAlertCount: Math.floor(Math.random() * 3),
    productivity: Math.floor(Math.random() * 30) + 70,
    onTimeDelivery: Math.floor(Math.random() * 20) + 80
  };
};

// Aktif üretim kartları örnek verileri
const getActiveCards = () => {
  const statuses = ['created', 'in-process', 'completed', 'rejected'];
  const delayLevels = ['onTime', 'warning', 'critical', 'delayed'];
  
  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    cardNo: `KART-${1000 + i}`,
    orderId: Math.floor(Math.random() * 100) + 1,
    orderCode: `SIP-${Math.floor(Math.random() * 1000) + 1}`,
    productName: `Ürün ${Math.floor(Math.random() * 50) + 1}`,
    productId: Math.floor(Math.random() * 50) + 1,
    customerId: Math.floor(Math.random() * 20) + 1,
    customerName: `Müşteri ${Math.floor(Math.random() * 20) + 1}`,
    quantity: Math.floor(Math.random() * 1000) + 100,
    currentQuantity: Math.floor(Math.random() * 1000),
    unit: ['kg', 'metre', 'adet'][Math.floor(Math.random() * 3)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    currentDepartmentId: Math.floor(Math.random() * 5) + 1,
    currentDepartmentName: `Departman ${Math.floor(Math.random() * 5) + 1}`,
    currentMachineId: Math.random() > 0.3 ? Math.floor(Math.random() * 20) + 1 : null,
    currentMachineName: Math.random() > 0.3 ? `Makine ${Math.floor(Math.random() * 20) + 1}` : null,
    currentStepId: Math.floor(Math.random() * 10) + 1,
    currentStepName: `Adım ${Math.floor(Math.random() * 10) + 1}`,
    assignedOperatorId: Math.random() > 0.3 ? Math.floor(Math.random() * 10) + 1 : null,
    assignedOperatorName: Math.random() > 0.3 ? `Operatör ${Math.floor(Math.random() * 10) + 1}` : null,
    plannedStartDate: new Date(Date.now() - 2592000000).toISOString(),
    plannedEndDate: new Date(Date.now() + 2592000000).toISOString(),
    actualStartDate: Math.random() > 0.2 ? new Date(Date.now() - 2592000000).toISOString() : null,
    actualEndDate: Math.random() > 0.7 ? new Date(Date.now() + Math.random() * 2592000000).toISOString() : null,
    lastMovementDate: Math.random() > 0.1 ? new Date(Date.now() - Math.random() * 86400000).toISOString() : null,
    delayTime: Math.floor(Math.random() * 20) - 10,
    delayLevel: delayLevels[Math.floor(Math.random() * delayLevels.length)],
    progress: Math.floor(Math.random() * 100),
    quality: Math.floor(Math.random() * 30) + 70,
    barcode: `BC${1000000 + i}`,
    notes: Math.random() > 0.7 ? `Not ${i}` : null,
    lastActivity: Math.random() > 0.4 ? `Son işlem: ${['Boyama', 'Dokuma', 'Apre', 'Kalite Kontrol'][Math.floor(Math.random() * 4)]}` : null
  }));
};

// Aktif üretim planları örnek verileri
const getActivePlans = () => {
  const statuses = ['planning', 'in-process', 'completed', 'on-hold', 'cancelled'];
  const priorities = ['low', 'normal', 'high', 'urgent'];
  
  return Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    planNo: `PLAN-${2000 + i}`,
    orderCode: `SIP-${Math.floor(Math.random() * 1000) + 1}`,
    orderId: Math.floor(Math.random() * 100) + 1,
    productId: Math.floor(Math.random() * 50) + 1,
    productName: `Ürün ${Math.floor(Math.random() * 50) + 1}`,
    customerName: `Müşteri ${Math.floor(Math.random() * 20) + 1}`,
    quantity: Math.floor(Math.random() * 10000) + 1000,
    unit: ['kg', 'metre', 'adet'][Math.floor(Math.random() * 3)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    plannedStartDate: new Date(Date.now() - 2592000000).toISOString(),
    plannedEndDate: new Date(Date.now() + 2592000000).toISOString(),
    actualStartDate: Math.random() > 0.2 ? new Date(Date.now() - 2592000000).toISOString() : null,
    actualEndDate: Math.random() > 0.7 ? new Date(Date.now() + Math.random() * 2592000000).toISOString() : null,
    progress: Math.floor(Math.random() * 100),
    delayTime: Math.floor(Math.random() * 20) - 10,
    currentStepName: Math.random() > 0.1 ? `Adım ${Math.floor(Math.random() * 10) + 1}` : null,
    currentDepartmentName: Math.random() > 0.1 ? `Departman ${Math.floor(Math.random() * 5) + 1}` : null,
    productionCardCount: Math.floor(Math.random() * 20) + 5,
    completedCardCount: Math.floor(Math.random() * 15)
  }));
};

// İyileştirme önerileri örnek verileri
const getOptimizationSuggestions = () => {
  const categories = ['scheduling', 'resource', 'capacity', 'workflow', 'bottleneck'];
  const difficulties = ['low', 'medium', 'high'];
  const priorities = ['low', 'medium', 'high', 'critical'];
  const statuses = ['new', 'inProgress', 'implemented', 'rejected'];
  
  return Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    title: `Optimizasyon Önerisi ${i + 1}`,
    description: `Bu öneri ${categories[i % categories.length]} kategorisinde bir iyileştirme sunar. ${Math.random() > 0.5 ? 'Üretim sürecini hızlandırmayı' : 'Kaynakları daha verimli kullanmayı'} amaçlar.`,
    category: categories[i % categories.length],
    impact: {
      leadTime: Math.floor(Math.random() * 30) - 15,
      capacity: Math.floor(Math.random() * 30) + 5,
      cost: Math.floor(Math.random() * 20) - 15,
      quality: Math.floor(Math.random() * 15) + 5
    },
    difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    createdAt: new Date(Date.now() - Math.random() * 7776000000).toISOString(),
    implementedAt: Math.random() > 0.7 ? new Date(Date.now() - Math.random() * 2592000000).toISOString() : undefined,
    requiredResources: Array.from(
      { length: Math.floor(Math.random() * 3) + 1 }, 
      (_, j) => `Kaynak ${j + 1}`
    ),
    affectedDepartments: Array.from(
      { length: Math.floor(Math.random() * 3) + 1 }, 
      () => Math.floor(Math.random() * 5) + 1
    ),
    affectedDepartmentNames: Array.from(
      { length: Math.floor(Math.random() * 3) + 1 }, 
      (_, j) => `Departman ${j + 1}`
    ),
    implementationSteps: Array.from(
      { length: Math.floor(Math.random() * 4) + 2 }, 
      (_, j) => `Adım ${j + 1}: ${Math.random() > 0.5 ? 'Hazırlık ve planlama' : 'Uygulama ve takip'}`
    ),
    potentialRisks: Array.from(
      { length: Math.floor(Math.random() * 3) + 1 }, 
      (_, j) => `Risk ${j + 1}: ${Math.random() > 0.5 ? 'Süreç akışının geçici olarak yavaşlaması' : 'Geçiş döneminde kalite dalgalanmaları'}`
    ),
    roi: Math.floor(Math.random() * 100) + 20,
    paybackPeriod: Math.floor(Math.random() * 12) + 1,
    score: Math.floor(Math.random() * 40) + 60
  }));
};

// Yapay zeka önerileri örnek verileri
const getAiRecommendations = () => {
  const categories = ['scheduling', 'resource', 'capacity', 'workflow', 'bottleneck'];
  
  return Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    title: `AI Önerisi: ${['Kapasite Optimizasyonu', 'Süreç İyileştirme', 'Kaynak Dengeleme', 'Darboğaz Azaltma'][i % 4]}`,
    description: `Yapay zeka analizleri sonucu tespit edilen ${categories[i % categories.length]} kategorisinde bir iyileştirme önerisi. ${Math.random() > 0.5 ? 'Üretim verimliliğini artırmayı' : 'Darboğazları azaltmayı'} hedefler.`,
    category: categories[i % categories.length],
    reasoning: `Sistem verilerinin analizi sonucunda ${Math.random() > 0.5 ? 'kapasite kullanımında dengesizlikler' : 'üretim sürecinde gecikmelere neden olan darboğazlar'} tespit edilmiştir. Bu öneri, sorunu çözmek için ${Math.random() > 0.5 ? 'kaynakların daha dengeli dağıtılmasını' : 'üretim akışının yeniden düzenlenmesini'} önermektedir.`,
    impact: {
      leadTime: Math.floor(Math.random() * 30) - 15,
      capacity: Math.floor(Math.random() * 30) + 5,
      cost: Math.floor(Math.random() * 20) - 15,
      quality: Math.floor(Math.random() * 15) + 5,
      efficiency: Math.floor(Math.random() * 20) + 10
    },
    score: Math.floor(Math.random() * 20) + 80,
    confidence: Math.floor(Math.random() * 20) + 80,
    applicability: Math.floor(Math.random() * 30) + 70,
    implementationTime: `${Math.floor(Math.random() * 12) + 1} hafta`,
    relatedSuggestionIds: Array.from(
      { length: Math.floor(Math.random() * 3) }, 
      () => Math.floor(Math.random() * 8) + 1
    ).filter(id => id !== i + 1)
  }));
};

// Üretim analizi örnek verileri
const getProductionAnalysis = () => {
  return {
    id: 1,
    name: "Üretim Performans Analizi",
    period: "Son 30 Gün",
    metrics: {
      throughput: Math.floor(Math.random() * 50) + 50,
      cycleTime: Math.floor(Math.random() * 10) + 5,
      wip: Math.floor(Math.random() * 20) + 10,
      utilization: Math.floor(Math.random() * 20) + 80,
      leadTime: Math.floor(Math.random() * 15) + 5,
      onTimeDelivery: Math.floor(Math.random() * 15) + 85,
      quality: Math.floor(Math.random() * 10) + 90,
      changeover: Math.floor(Math.random() * 20) + 40,
      uptime: Math.floor(Math.random() * 10) + 90
    },
    departmentEfficiency: {
      "Dokuma": Math.floor(Math.random() * 20) + 80,
      "Boyama": Math.floor(Math.random() * 20) + 80,
      "Apre": Math.floor(Math.random() * 20) + 80,
      "Kalite Kontrol": Math.floor(Math.random() * 20) + 80,
      "Konfeksiyon": Math.floor(Math.random() * 20) + 80
    },
    machineEfficiency: {
      "Dokuma Makinesi 1": Math.floor(Math.random() * 20) + 80,
      "Dokuma Makinesi 2": Math.floor(Math.random() * 20) + 80,
      "Boyama Makinesi 1": Math.floor(Math.random() * 20) + 80,
      "Apre Makinesi 1": Math.floor(Math.random() * 20) + 80,
      "Kalite Kontrol İstasyonu": Math.floor(Math.random() * 20) + 80
    },
    bottlenecks: Array.from({ length: 3 }, (_, i) => ({
      resourceId: i + 1,
      resourceName: [`Dokuma Makinesi ${i+1}`, `Boyama Makinesi ${i+1}`, `Apre Makinesi ${i+1}`][i],
      resourceType: ['machine', 'department', 'workforce'][Math.floor(Math.random() * 3)],
      utilizationRate: Math.floor(Math.random() * 10) + 90,
      idleTime: Math.floor(Math.random() * 10),
      impact: Math.floor(Math.random() * 20) + 10
    })),
    workflowIssues: Array.from({ length: 2 }, (_, i) => ({
      id: i + 1,
      description: [`Dokuma - Boyama geçişinde gecikme`, `Apre - Kalite Kontrol arasında darboğaz`][i],
      impact: Math.floor(Math.random() * 20) + 5,
      category: ['Process', 'Resource'][i]
    }))
  };
};

// KPI'ler için örnek veriler
const getPlanningKPIs = () => {
  const categories = ['operational', 'financial', 'productivity', 'quality'];
  const frequencies = ['daily', 'weekly', 'monthly', 'quarterly'];
  const directions = ['increase', 'decrease', 'maintain'];
  const statuses = ['onTrack', 'atRisk', 'offTrack'];
  const trends = ['up', 'down', 'stable'];
  
  return Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: `KPI ${i + 1}: ${['Üretim Verimliliği', 'Zamanında Teslimat', 'Kaynak Kullanımı', 'Kalite Oranı'][i % 4]}`,
    description: `${categories[i % categories.length]} kategorisinde ${['üretim sürecini', 'kaynak kullanımını', 'teslimat performansını', 'kalite seviyesini'][i % 4]} izleyen bir performans göstergesi.`,
    category: categories[i % categories.length],
    unit: ['%', 'gün', 'saat', 'birim'][i % 4],
    target: Math.floor(Math.random() * 50) + 50,
    current: Math.floor(Math.random() * 100),
    direction: directions[i % directions.length],
    frequency: frequencies[i % frequencies.length],
    responsible: (i % 5) + 1,
    responsibleName: `Departman ${(i % 5) + 1}`,
    lastUpdated: new Date(Date.now() - Math.random() * 604800000).toISOString(),
    trend: trends[Math.floor(Math.random() * trends.length)],
    trendPercentage: Math.floor(Math.random() * 20) + 1,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    history: Array.from(
      { length: 10 }, 
      (_, j) => ({
        date: new Date(Date.now() - (10 - j) * 86400000).toISOString(),
        value: Math.floor(Math.random() * 100)
      })
    ),
    benchmarks: Array.from(
      { length: Math.floor(Math.random() * 3) + 1 }, 
      (_, j) => ({
        name: [`Sektör Ortalaması`, `Geçen Yıl`, `En İyi Performans`][j],
        value: Math.floor(Math.random() * 100)
      })
    )
  }));
};

// KPI değerlendirmeleri için örnek veri
const getKpiEvaluation = () => {
  const kpis = getPlanningKPIs();
  const totalKpis = kpis.length;
  const onTrackCount = kpis.filter(kpi => kpi.status === 'onTrack').length;
  const atRiskCount = kpis.filter(kpi => kpi.status === 'atRisk').length;
  const offTrackCount = kpis.filter(kpi => kpi.status === 'offTrack').length;
  
  // Her kategori için performans hesapla
  const categories = ['operational', 'financial', 'productivity', 'quality'];
  const categoryPerformance: Record<string, any> = {};
  
  categories.forEach(category => {
    const categoryKpis = kpis.filter(kpi => kpi.category === category);
    const total = categoryKpis.length;
    
    if (total > 0) {
      const onTrack = categoryKpis.filter(kpi => kpi.status === 'onTrack').length;
      const atRisk = categoryKpis.filter(kpi => kpi.status === 'atRisk').length;
      const offTrack = categoryKpis.filter(kpi => kpi.status === 'offTrack').length;
      const avgCompletion = categoryKpis.reduce((sum, kpi) => {
        // Tamamlanma yüzdesini hesaplama (basit bir yaklaşım)
        let completion = 0;
        if (kpi.direction === 'increase') {
          completion = Math.min(100, (kpi.current / kpi.target) * 100);
        } else if (kpi.direction === 'decrease') {
          completion = kpi.current <= kpi.target ? 100 : 100 - ((kpi.current - kpi.target) / kpi.target) * 100;
        } else { // maintain
          const tolerance = kpi.target * 0.05;
          if (kpi.current >= kpi.target - tolerance && kpi.current <= kpi.target + tolerance) {
            completion = 100;
          } else if (kpi.current < kpi.target - tolerance) {
            completion = (kpi.current / (kpi.target - tolerance)) * 100;
          } else {
            completion = Math.max(0, 100 - ((kpi.current - (kpi.target + tolerance)) / kpi.target) * 100);
          }
        }
        return sum + completion;
      }, 0) / total;
      
      categoryPerformance[category] = {
        total,
        onTrack,
        atRisk,
        offTrack,
        avgCompletion
      };
    }
  });
  
  return {
    totalKpis,
    onTrackCount,
    atRiskCount,
    offTrackCount,
    categoryPerformance
  };
};

// Takvim etkinlikleri örnek verileri
const getCalendarEvents = (month?: string) => {
  const types = ['plan', 'deadline', 'meeting', 'maintenance'];
  const statuses = ['scheduled', 'completed', 'cancelled'];
  
  // Eğer ay belirtilmişse, o ay için tarihler üret
  let startDate = new Date();
  let endDate = new Date();
  
  if (month) {
    const [year, monthNum] = month.split('-').map(Number);
    startDate = new Date(year, monthNum - 1, 1);
    endDate = new Date(year, monthNum, 0);
  } else {
    // Varsayılan olarak geçen aydan gelecek aya kadar
    startDate = new Date(new Date().setMonth(new Date().getMonth() - 1));
    endDate = new Date(new Date().setMonth(new Date().getMonth() + 1));
  }
  
  const dayRange = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  
  return Array.from({ length: 20 }, (_, i) => {
    const eventDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
    const type = types[Math.floor(Math.random() * types.length)];
    
    return {
      id: i + 1,
      title: `${type === 'plan' ? 'Üretim Planı' : 
             type === 'deadline' ? 'Teslim Tarihi' : 
             type === 'meeting' ? 'Toplantı' : 'Bakım'} ${i + 1}`,
      date: eventDate.toISOString(),
      startTime: `${Math.floor(Math.random() * 9) + 8}:${Math.random() > 0.5 ? '00' : '30'}`,
      endTime: `${Math.floor(Math.random() * 9) + 13}:${Math.random() > 0.5 ? '00' : '30'}`,
      type,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      description: Math.random() > 0.5 ? `Açıklama ${i + 1}` : undefined,
      departmentId: Math.floor(Math.random() * 5) + 1,
      departmentName: `Departman ${Math.floor(Math.random() * 5) + 1}`,
      userId: Math.floor(Math.random() * 10) + 1,
      userName: `Kullanıcı ${Math.floor(Math.random() * 10) + 1}`,
      relatedOrderId: type === 'plan' || type === 'deadline' ? Math.floor(Math.random() * 100) + 1 : undefined,
      relatedOrderCode: type === 'plan' || type === 'deadline' ? `SIP-${Math.floor(Math.random() * 1000) + 1}` : undefined
    };
  });
};

// Simülasyon senaryoları örnek verileri
const getSimulationScenarios = () => {
  const statuses = ['pending', 'running', 'completed', 'failed'];
  
  return Array.from({ length: 8 }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const hasResults = status === 'completed';
    
    const scenario: any = {
      id: i + 1,
      name: `Senaryo ${i + 1}: ${['Kapasite Artışı', 'Vardiya Değişikliği', 'İş Akışı Optimizasyonu', 'Kaynak Dengeleme'][i % 4]}`,
      description: `Bu simülasyon senaryosu, ${['üretim kapasitesini artırmayı', 'vardiya düzenini değiştirmeyi', 'iş akışını optimize etmeyi', 'kaynakları dengelemeyi'][i % 4]} test eder.`,
      createdAt: new Date(Date.now() - Math.random() * 2592000000).toISOString(),
      baselineId: Math.random() > 0.7 ? Math.floor(Math.random() * 8) + 1 : null,
      modifiedParameters: Array.from(
        { length: Math.floor(Math.random() * 3) + 1 }, 
        (_, j) => ({
          id: j + 1,
          name: [`Kapasite`, `İş Gücü`, `Çalışma Saatleri`, `Makine Verimliliği`, `Önceliklendirme Kuralları`][j % 5],
          type: [`capacity`, `workforce`, `workingHours`, `machineEfficiency`, `priorityRules`][j % 5],
          value: j === 4 ? ['EDD', 'FIFO', 'SPT'][Math.floor(Math.random() * 3)] : Math.floor(Math.random() * 100) + 50,
          unit: j !== 4 ? '%' : undefined,
          minValue: j !== 4 ? 50 : undefined,
          maxValue: j !== 4 ? 150 : undefined,
          affectedResourceId: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : undefined,
          affectedResourceName: Math.random() > 0.5 ? `Kaynak ${Math.floor(Math.random() * 5) + 1}` : undefined
        })
      ),
      status,
      tags: Array.from(
        { length: Math.floor(Math.random() * 3) + 1 }, 
        () => [`kapasite`, `maliyet`, `verimlilik`, `zaman`, `optimizasyon`][Math.floor(Math.random() * 5)]
      ),
      results: null
    };
    
    if (hasResults) {
      scenario.results = {
        id: i + 1,
        scenarioId: i + 1,
        totalCompletionTime: Math.floor(Math.random() * 30) + 15,
        resourceUtilization: {
          "Dokuma": Math.floor(Math.random() * 20) + 80,
          "Boyama": Math.floor(Math.random() * 20) + 80,
          "Apre": Math.floor(Math.random() * 20) + 80,
          "Kalite Kontrol": Math.floor(Math.random() * 20) + 80
        },
        onTimeDeliveryRate: Math.floor(Math.random() * 15) + 85,
        totalCost: Math.floor(Math.random() * 50000) + 100000,
        bottlenecks: Array.from({ length: 2 }, (_, j) => ({
          resourceId: j + 1,
          resourceName: [`Dokuma Makinesi ${j+1}`, `Boyama Makinesi ${j+1}`][j],
          resourceType: ['machine', 'department'][j % 2],
          utilizationRate: Math.floor(Math.random() * 10) + 90,
          idleTime: Math.floor(Math.random() * 5),
          affectedOrderCount: Math.floor(Math.random() * 10) + 5,
          potentialTimeSaving: Math.floor(Math.random() * 5) + 2
        })),
        costBreakdown: {
          "İşçilik": Math.floor(Math.random() * 30000) + 50000,
          "Malzeme": Math.floor(Math.random() * 20000) + 30000,
          "Enerji": Math.floor(Math.random() * 10000) + 10000,
          "Bakım": Math.floor(Math.random() * 5000) + 5000
        }
      };
      
      if (Math.random() > 0.5 && scenario.baselineId) {
        scenario.results.comparisonToBaseline = {
          totalCompletionTimeDiff: Math.floor(Math.random() * 30) - 15,
          utilDiff: {
            "Dokuma": Math.floor(Math.random() * 20) - 10,
            "Boyama": Math.floor(Math.random() * 20) - 10,
            "Apre": Math.floor(Math.random() * 20) - 10,
            "Kalite Kontrol": Math.floor(Math.random() * 20) - 10
          },
          onTimeDeliveryDiff: Math.floor(Math.random() * 20) - 5,
          totalCostDiff: Math.floor(Math.random() * 30) - 20
        };
      }
    }
    
    return scenario;
  });
};

// Makine telemetrisi örnek verileri
const getMachineTelemetry = (machineId: number) => {
  // Makine ID'sine göre temel değerler belirlenir (demo için)
  const baseTemp = machineId % 2 === 0 ? 65 : 70;
  const baseVibration = machineId % 2 === 0 ? 12 : 15;
  const basePower = machineId % 2 === 0 ? 380 : 420;
  
  // Son 24 saatlik veri
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hourAgo = new Date(Date.now() - i * 3600000);
    
    return {
      timestamp: hourAgo.toISOString(),
      temperature: baseTemp + Math.sin(i * 0.5) * 5 + Math.random() * 2,
      vibration: baseVibration + Math.cos(i * 0.3) * 3 + Math.random() * 1,
      power: basePower + (Math.random() - 0.5) * 40,
      pressure: Math.floor(Math.random() * 10) + 40,
      speed: Math.floor(Math.random() * 20) + 80
    };
  });
  
  // Anlık değerler (en son veri)
  const currentData = {
    timestamp: new Date().toISOString(),
    temperature: baseTemp + Math.random() * 5,
    vibration: baseVibration + Math.random() * 3,
    power: basePower + Math.random() * 30,
    pressure: Math.floor(Math.random() * 10) + 40,
    speed: Math.floor(Math.random() * 20) + 80,
  };
  
  // Alarm eşikleri
  const thresholds = {
    temperature: { warning: baseTemp + 7, critical: baseTemp + 12 },
    vibration: { warning: baseVibration + 5, critical: baseVibration + 8 },
    power: { warning: basePower + 50, critical: basePower + 100 },
    pressure: { warning: 50, critical: 60 },
    speed: { warning: 70, critical: 60 }
  };
  
  return {
    machineId,
    current: currentData,
    history: hourlyData,
    thresholds
  };
};

// Canlı İzleme: Fabrika Durumu API rotası
advancedPlanningRouter.get("/monitoring/factory-status", (req: Request, res: Response) => {
  res.json(getFactoryStatus());
});

// Canlı İzleme: Departman Özetleri API rotası
advancedPlanningRouter.get("/monitoring/department-summaries", (req: Request, res: Response) => {
  res.json(getDepartmentSummaries());
});

// Canlı İzleme: Makine Durumları API rotası
advancedPlanningRouter.get("/monitoring/machine-statuses", (req: Request, res: Response) => {
  const { department, status } = req.query;
  let machines = getMachineStatuses();
  
  if (department && department !== 'all') {
    machines = machines.filter(m => m.departmentId.toString() === department);
  }
  
  if (status && status !== 'all') {
    machines = machines.filter(m => m.status === status);
  }
  
  res.json(machines);
});

// Canlı İzleme: Aktif Refakat Kartları API rotası
advancedPlanningRouter.get("/monitoring/active-cards", (req: Request, res: Response) => {
  const { department, search } = req.query;
  let cards = getActiveCards();
  
  if (department && department !== 'all') {
    cards = cards.filter(c => c.currentDepartmentId.toString() === department);
  }
  
  if (search) {
    const searchStr = search.toString().toLowerCase();
    cards = cards.filter(c => 
      c.cardNo.toLowerCase().includes(searchStr) || 
      c.orderCode.toLowerCase().includes(searchStr) || 
      c.productName.toLowerCase().includes(searchStr) || 
      c.customerName.toLowerCase().includes(searchStr)
    );
  }
  
  res.json(cards);
});

// Canlı İzleme: Aktif Üretim Planları API rotası
advancedPlanningRouter.get("/monitoring/active-plans", (req: Request, res: Response) => {
  const { department, search } = req.query;
  let plans = getActivePlans();
  
  if (department && department !== 'all') {
    plans = plans.filter(p => p.currentDepartmentName && p.currentDepartmentName.includes(`Departman ${department}`));
  }
  
  if (search) {
    const searchStr = search.toString().toLowerCase();
    plans = plans.filter(p => 
      p.planNo.toLowerCase().includes(searchStr) || 
      p.orderCode.toLowerCase().includes(searchStr) || 
      p.productName.toLowerCase().includes(searchStr) || 
      p.customerName.toLowerCase().includes(searchStr)
    );
  }
  
  res.json(plans);
});

// Canlı İzleme: Makine Telemetrisi API rotası
advancedPlanningRouter.get("/monitoring/machine-telemetry/:machineId", (req: Request, res: Response) => {
  const machineId = parseInt(req.params.machineId);
  
  if (isNaN(machineId)) {
    return res.status(400).json({ error: "Geçersiz makine ID'si" });
  }
  
  res.json(getMachineTelemetry(machineId));
});

// Optimizasyon: Öneriler API rotası
advancedPlanningRouter.get("/optimization/suggestions", (req: Request, res: Response) => {
  const { category, status, priority } = req.query;
  let suggestions = getOptimizationSuggestions();
  
  if (category && category !== 'all') {
    suggestions = suggestions.filter(s => s.category === category);
  }
  
  if (status && status !== 'all') {
    suggestions = suggestions.filter(s => s.status === status);
  }
  
  if (priority && priority !== 'all') {
    suggestions = suggestions.filter(s => s.priority === priority);
  }
  
  res.json(suggestions);
});

// Optimizasyon: Öneri Durum Güncelleme API rotası
advancedPlanningRouter.patch("/optimization/suggestions/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  
  if (isNaN(id) || !status) {
    return res.status(400).json({ error: "Geçersiz ID veya durum" });
  }
  
  // Gerçekte burada veritabanı güncellemesi yapılacak
  
  res.json({ success: true, message: `Öneri ${id} durumu '${status}' olarak güncellendi.` });
});

// Optimizasyon: Yapay Zeka Önerileri API rotası
advancedPlanningRouter.get("/optimization/ai-recommendations", (req: Request, res: Response) => {
  res.json(getAiRecommendations());
});

// Optimizasyon: Yapay Zeka Önerisi Uygulama API rotası
advancedPlanningRouter.post("/optimization/ai-recommendations/:id/implement", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: "Geçersiz öneri ID'si" });
  }
  
  // Gerçekte burada veritabanına öneri kaydedilecek
  
  res.json({ success: true, message: `Yapay zeka önerisi ${id} başarıyla uygulandı.` });
});

// Optimizasyon: Üretim Analizi API rotası
advancedPlanningRouter.get("/optimization/analysis", (req: Request, res: Response) => {
  // Tarih aralığına göre filtreleme yapılabilir (şimdilik yok)
  res.json(getProductionAnalysis());
});

// KPI Yönetimi: KPI'lar API rotası
advancedPlanningRouter.get("/kpis", (req: Request, res: Response) => {
  const { category, status } = req.query;
  let kpis = getPlanningKPIs();
  
  if (category && category !== 'all') {
    kpis = kpis.filter(k => k.category === category);
  }
  
  if (status && status !== 'all') {
    kpis = kpis.filter(k => k.status === status);
  }
  
  res.json(kpis);
});

// KPI Yönetimi: KPI Değerlendirmesi API rotası
advancedPlanningRouter.get("/kpis/evaluation", (req: Request, res: Response) => {
  res.json(getKpiEvaluation());
});

// KPI Yönetimi: KPI Oluşturma API rotası
advancedPlanningRouter.post("/kpis", (req: Request, res: Response) => {
  const kpiData = req.body;
  
  // Yeni bir KPI eklenmiş gibi yapıyoruz
  const newKpi = {
    id: Math.floor(Math.random() * 1000) + 100,
    name: kpiData.name,
    description: kpiData.description,
    category: kpiData.category,
    unit: kpiData.unit,
    target: kpiData.target,
    current: 0, // Yeni KPI başlangıç değeri
    direction: kpiData.direction,
    frequency: kpiData.frequency,
    responsible: kpiData.responsible,
    responsibleName: `Departman ${kpiData.responsible}`,
    lastUpdated: new Date().toISOString(),
    trend: 'stable',
    trendPercentage: 0,
    status: 'onTrack',
    history: [],
    benchmarks: []
  };
  
  res.status(201).json(newKpi);
});

// KPI Yönetimi: KPI Güncelleme API rotası
advancedPlanningRouter.patch("/kpis/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const kpiData = req.body;
  
  if (isNaN(id)) {
    return res.status(400).json({ error: "Geçersiz KPI ID'si" });
  }
  
  // Gerçekte burada veritabanı güncellemesi yapılacak
  
  res.json({ success: true, message: `KPI ${id} başarıyla güncellendi.` });
});

// KPI Yönetimi: KPI Silme API rotası
advancedPlanningRouter.delete("/kpis/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: "Geçersiz KPI ID'si" });
  }
  
  // Gerçekte burada veritabanı kaydı silinecek
  
  res.json({ success: true, message: `KPI ${id} başarıyla silindi.` });
});

// Planlama Takvimi: Etkinlikler API rotası
advancedPlanningRouter.get("/calendar/events", (req: Request, res: Response) => {
  const { month, department } = req.query;
  let events = getCalendarEvents(month as string);
  
  if (department && department !== 'all') {
    events = events.filter(e => e.departmentId?.toString() === department);
  }
  
  res.json(events);
});

// Planlama Takvimi: Etkinlik Oluşturma API rotası
advancedPlanningRouter.post("/calendar/events", (req: Request, res: Response) => {
  const eventData = req.body;
  
  // Yeni bir etkinlik eklenmiş gibi yapıyoruz
  const newEvent = {
    id: Math.floor(Math.random() * 1000) + 100,
    ...eventData,
    status: 'scheduled',
  };
  
  res.status(201).json(newEvent);
});

// Planlama Takvimi: Etkinlik Güncelleme API rotası
advancedPlanningRouter.patch("/calendar/events/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const eventData = req.body;
  
  if (isNaN(id)) {
    return res.status(400).json({ error: "Geçersiz etkinlik ID'si" });
  }
  
  // Gerçekte burada veritabanı güncellemesi yapılacak
  
  res.json({ success: true, message: `Etkinlik ${id} başarıyla güncellendi.` });
});

// Planlama Takvimi: Etkinlik Silme API rotası
advancedPlanningRouter.delete("/calendar/events/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: "Geçersiz etkinlik ID'si" });
  }
  
  // Gerçekte burada veritabanı kaydı silinecek
  
  res.json({ success: true, message: `Etkinlik ${id} başarıyla silindi.` });
});

// Simülasyon Merkezi: Senaryolar API rotası
advancedPlanningRouter.get("/simulation/scenarios", (req: Request, res: Response) => {
  const { tag } = req.query;
  let scenarios = getSimulationScenarios();
  
  if (tag && tag !== 'all') {
    scenarios = scenarios.filter(s => s.tags.includes(tag));
  }
  
  res.json(scenarios);
});

// Simülasyon Merkezi: Senaryo Çalıştırma API rotası
advancedPlanningRouter.post("/simulation/scenarios/:id/run", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: "Geçersiz senaryo ID'si" });
  }
  
  // Gerçekte burada simülasyon çalıştırılacak ve sonuçlar kaydedilecek
  
  res.json({ success: true, message: `Simülasyon ${id} başarıyla başlatıldı.` });
});

// Simülasyon Merkezi: Parametreler API rotası
advancedPlanningRouter.get("/simulation/parameters", (req: Request, res: Response) => {
  // Simülasyon için kullanılabilecek parametrelerin listesi
  const parameters = [
    {
      id: 1,
      name: "Departman Kapasitesi",
      type: "capacity",
      value: 100,
      unit: "%",
      minValue: 50,
      maxValue: 150
    },
    {
      id: 2,
      name: "İş Gücü",
      type: "workforce",
      value: 0,
      unit: "%",
      minValue: -50,
      maxValue: 50
    },
    {
      id: 3,
      name: "Vardiya Sayısı",
      type: "workingHours",
      value: 2,
      unit: "vardiya",
      minValue: 1,
      maxValue: 3
    },
    {
      id: 4,
      name: "Makine Verimliliği",
      type: "machineEfficiency",
      value: 100,
      unit: "%",
      minValue: 75,
      maxValue: 125
    },
    {
      id: 5,
      name: "Önceliklendirme Kuralı",
      type: "priorityRules",
      value: "EDD", // Earliest Due Date
      options: ["EDD", "FIFO", "SPT"]
    }
  ];
  
  res.json(parameters);
});

// Kapasite Planlama: Departman Kapasiteleri API rotası
advancedPlanningRouter.get("/capacity/departments", (req: Request, res: Response) => {
  const { from, to, department } = req.query;
  
  const departmentCapacities = Array.from({ length: 5 }, (_, i) => {
    const utilizationRate = Math.floor(Math.random() * 50) + 50;
    const isOptimal = utilizationRate < 70;
    const isOverload = utilizationRate > 90;
    
    return {
      id: i + 1,
      departmentId: i + 1,
      departmentName: `Departman ${i + 1}`,
      startDate: from || new Date(Date.now() - 2592000000).toISOString(),
      endDate: to || new Date(Date.now() + 2592000000).toISOString(),
      capacityHours: Math.floor(Math.random() * 500) + 500,
      plannedHours: Math.floor(Math.random() * 800) + 200,
      currentUtilization: utilizationRate,
      status: isOptimal ? 'optimal' : isOverload ? 'overload' : 'critical'
    };
  });
  
  let result = departmentCapacities;
  
  if (department && department !== 'all') {
    result = result.filter(d => d.departmentId.toString() === department);
  }
  
  res.json(result);
});

// Kapasite Planlama: Makine Kapasiteleri API rotası
advancedPlanningRouter.get("/capacity/machines", (req: Request, res: Response) => {
  const { from, to, department } = req.query;
  
  const machineCapacities = Array.from({ length: 15 }, (_, i) => {
    const departmentId = Math.floor(i / 3) + 1;
    const utilizationRate = Math.floor(Math.random() * 50) + 50;
    const isOptimal = utilizationRate < 70;
    const isOverload = utilizationRate > 90;
    
    return {
      id: i + 1,
      machineId: i + 1,
      machineName: `Makine ${i + 1}`,
      departmentId,
      departmentName: `Departman ${departmentId}`,
      startDate: from || new Date(Date.now() - 2592000000).toISOString(),
      endDate: to || new Date(Date.now() + 2592000000).toISOString(),
      capacityHours: Math.floor(Math.random() * 200) + 200,
      plannedHours: Math.floor(Math.random() * 300) + 100,
      currentUtilization: utilizationRate,
      status: isOptimal ? 'optimal' : isOverload ? 'overload' : 'critical'
    };
  });
  
  let result = machineCapacities;
  
  if (department && department !== 'all') {
    result = result.filter(m => m.departmentId.toString() === department);
  }
  
  res.json(result);
});