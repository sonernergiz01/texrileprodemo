import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertOrderSchemaFixed, formatNumeric, parseNumeric } from "@shared/schema-fix";
import { createSampleData } from "./storage/sample-data";
import { createDepartmentUsers } from "./create-department-users";
import { WebSocket } from 'ws';
import { desc, asc, and, eq } from "drizzle-orm";
import { kartelaItems } from "@shared/schema-kartela";
import { setupWebSocketServer, sendNotification } from "./websocket";

// Eski sendNotificationToUser fonksiyonunu sendNotification ile değiştiriyoruz
const sendNotificationToUser = (userId: number, notification: { title: string, message: string, type: string }) => {
  sendNotification({
    recipientType: 'user',
    recipientId: userId,
    type: notification.type,
    title: notification.title,
    message: notification.message
  });
};
import { 
  insertFabricTypeSchema, 
  insertYarnTypeSchema, 
  insertRawMaterialSchema,
  insertCustomerSchema,
  insertOrderSchema,
  insertUserSchema,
  insertRoleSchema,
  insertDepartmentSchema,
  insertOrderStatusSchema,
  insertCustomerInteractionSchema,
  insertOpportunitySchema,
  insertProductionPlanSchema,
  insertProductionStepSchema,
  insertProcessTypeSchema,
  insertMachineTypeSchema,
  insertMachineSchema,
  insertProductionCardSchema,
  insertTrackingEventSchema,
  insertLabelTypeSchema,
  insertLabelPrintsSchema
} from "@shared/schema";
import { comPortService, measurementDeviceService, setDeviceNotificationSender } from './com-port-service';
import { labelsRouter, createDefaultLabelTypes } from './routes/labels';
import { kartelaRouter } from './routes/kartela';
import { createKartelaTables } from './db-init/kartela-tables';
import { dyeRecipesRouter } from './routes/dye-recipes';
import { createDyeRecipesTables } from './db-init/dye-recipes-tables';
import dyeRecipesAssignmentsRouter from './routes/dye-recipes-assignments';
import { productionTrackingRouter } from './routes/production-tracking';

// API rota işleyicilerini sarmak için kullanılan yardımcı fonksiyon
// Bu fonksiyon, try-catch blokları ve tür kontrolleri gerektirmeden rota işleyicileri yazmamızı sağlar
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(err => {
      console.error(`⚠️ API Hatası: ${req.method} ${req.path}`, err);
      
      // Hata mesajı ve kodunu belirle
      let statusCode = 500;
      let errorMessage = "İşlem sırasında bir hata oluştu";
      
      // Zod doğrulama hatalarını işle
      if (err instanceof z.ZodError) {
        statusCode = 400;
        errorMessage = "Giriş doğrulama hatası";
        return res.status(statusCode).json({ 
          message: errorMessage,
          errors: err.errors 
        });
      }
      
      // PostgreSQL hata kodlarını işle
      if (err.code) {
        switch (err.code) {
          case '23505': // Unique constraint violation
            statusCode = 409;
            errorMessage = "Bu kayıt zaten mevcut";
            break;
          case '23503': // Foreign key constraint violation
            statusCode = 400;
            errorMessage = "İlişkili kayıt bulunamadı";
            break;
          case '42P01': // undefined_table
            statusCode = 500;
            errorMessage = "Veritabanı şema hatası";
            break;
        }
      }
      
      // Özel hata tiplerine göre mesajı özelleştir
      if (err.message) {
        // Detaylı hata mesajı gönder
        errorMessage = err.message;
      }
      
      res.status(statusCode).json({ 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? err.toString() : undefined
      });
    });
  };
};

// WebSocket server ve bildirim sistemi websocket.ts dosyasında yönetiliyor
  
export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server
  setupWebSocketServer(httpServer);
  
  // Set up authentication routes
  setupAuth(app);
    
  // Import routers
  const { yonetimDashboardRouter } = await import("./yonetim-dashboard");
  const { adminDashboardRouter } = await import("./admin-dashboard");
  const { processTrackingRouter } = await import("./routes/process-tracking");
  const { planningRouter } = await import("./routes/planning");
  const { maintenanceRouter } = await import("./routes/maintenance");
  const { weavingRouter } = await import("./routes/weaving");
  const { weavingEnhancedRouter } = await import("./routes/weaving-enhanced");
  const { finishingRouter } = await import("./routes/finishing");
  const { yarnWarehouseRouter } = await import("./routes/yarn-warehouse");
  const testNotificationRouter = (await import("./routes/test-notification")).default;
  const { yarnSpinningRouter } = await import("./routes/yarn-spinning");
  const { fabricSamplesRouter } = await import("./routes/fabric-samples");
  const { kartelaRouter } = await import("./routes/kartela");
  const { notificationsRouter } = await import("./routes/notifications");
  const { qualityRouter } = await import("./routes/quality");
  const { productionTrackingRouter } = await import("./routes/production-tracking");
  const sampleRouter = await import("./routes/sample").then(m => m.default);
  
  // Gelişmiş planlama modülü
  const advancedPlanningRouter = (await import("./routes/advanced-planning")).default;
  // API rotasını konsola yazdırıyoruz
  console.log("Advanced Planning Router:", advancedPlanningRouter ? "Loaded Successfully" : "Failed to Load");
  
  // Register dashboard routes
  app.use("/api/yonetim", yonetimDashboardRouter);
  app.use("/api/yonetim", adminDashboardRouter);
  
  // Register process tracking routes
  app.use("/api/process-tracking", processTrackingRouter);
  
  // Register planning routes
  app.use("/api/planning", planningRouter);
  
  // Register advanced planning routes
  app.use("/api/advanced-planning", advancedPlanningRouter);
  
  // Register maintenance routes
  app.use("/api/maintenance", maintenanceRouter);
  
  // Register weaving routes
  app.use("/api/weaving", weavingRouter);
  
  // Register enhanced weaving routes for dokuma/terbiye/apre entegrasyonu
  app.use("/api/weaving-enhanced", weavingEnhancedRouter);
  
  // Register finishing routes for terbiye ve apre işlemleri
  app.use("/api/finishing", finishingRouter);
  
  // Register orders integration routes
  const ordersIntegrationRouter = (await import("./routes/orders-integration")).default;
  app.use("/api/orders-integration", ordersIntegrationRouter);
  
  // Register yarn warehouse routes
  app.use("/api/yarn-warehouse", yarnWarehouseRouter);
  
  // Register yarn spinning routes
  app.use("/api/yarn-spinning", yarnSpinningRouter);
  
  // Register fabric samples routes
  app.use("/api/fabric-samples", fabricSamplesRouter);
  
  // Register kartela routes
  app.use("/api/kartela", kartelaRouter);
  
  // Register numune (sample) routes
  app.use("/api/numune", sampleRouter);
  app.use("/api/sample", sampleRouter);
  
  // Register notifications routes
  app.use("/api/notifications", notificationsRouter);
  
  // Register quality control routes
  app.use("/api/quality", qualityRouter);
  
  // Register labels routes
  app.use("/api/labels", labelsRouter);
  
  // Register production tracking routes
  app.use("/api/production-tracking", productionTrackingRouter);
  
  // Register dye recipes routes
  app.use("/api/dye-recipes", dyeRecipesRouter);
  
  // Register dye recipes assignments routes
  app.use("/api/dye-recipes", dyeRecipesAssignmentsRouter);
  
  // Test notification routes (Bildirim sistemini test etmek için)
  app.use("/api/test-notifications", testNotificationRouter);
  
  // Veritabanı örnek verilerini oluşturma işlemi devre dışı bırakıldı
  /*
  try {
    await createSampleData();
    console.log("Örnek veriler başarıyla yüklendi");
    
    // Departman bazlı kullanıcılar oluşturma işlemi devre dışı bırakıldı
    // await createDepartmentUsers();
    // console.log("Departman bazlı kullanıcılar başarıyla oluşturuldu");
  } catch (error) {
    console.error("Veri yükleme hatası:", error);
  }
  */
  console.log("Otomatik veri oluşturma işlemleri devre dışı bırakıldı.");

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Oturum açmanız gerekmektedir" });
  };
  
  // Kumaş tipleri API'si - sabit veriler (ayrı bir tablo olacak)
  app.get("/api/fabric-types", asyncHandler(async (req, res) => {
    // Sabit kumaş tipleri - gerçek uygulamada veritabanından alınacak
    const fabricTypes = [
      { id: 1, name: "Pamuklu Dokuma", code: "CD001", description: "100% Pamuk Dokuma Kumaş", properties: {} },
      { id: 2, name: "Polyester Dokuma", code: "PD002", description: "100% Polyester Dokuma Kumaş", properties: {} },
      { id: 3, name: "Pamuk-Polyester Karışım", code: "CP003", description: "65% Pamuk 35% Polyester Karışım Dokuma", properties: {} },
      { id: 4, name: "Keten Dokuma", code: "LD004", description: "100% Keten Dokuma Kumaş", properties: {} },
      { id: 5, name: "İpek Dokuma", code: "SD005", description: "100% İpek Dokuma Kumaş", properties: {} },
      { id: 6, name: "Viskon Dokuma", code: "VD006", description: "100% Viskon Dokuma Kumaş", properties: {} }
    ];
    
    res.json(fabricTypes);
  }));
  
  // Inventory API Routes (Depo Yönetimi)
  // Get all inventory items
  app.get("/api/inventory/items", isAuthenticated, asyncHandler(async (req, res) => {
    const { itemType, status, orderId, productionPlanId } = req.query;
    
    const params: any = {};
    if (itemType) params.itemType = String(itemType);
    if (status) params.status = String(status);
    if (orderId) params.orderId = parseInt(String(orderId));
    if (productionPlanId) params.productionPlanId = parseInt(String(productionPlanId));
    
    const items = await storage.getInventoryItems(params);
    res.json(items);
  }));

  // Get a single inventory item
  app.get("/api/inventory/items/:id", isAuthenticated, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new Error("Geçersiz envanter öğesi ID'si");
    }
    
    const item = await storage.getInventoryItemById(id);
    if (!item) {
      res.status(404).json({ message: "Envanter öğesi bulunamadı" });
      return;
    }
    
    res.json(item);
  }));

  // Create a new inventory item
  app.post("/api/inventory/items", isAuthenticated, asyncHandler(async (req, res) => {
    // Validate input
    if (!req.body.itemType || !req.body.quantity || !req.body.unit || !req.body.location || !req.body.receivedDate) {
      throw new Error("Eksik bilgiler. itemType, quantity, unit, location ve receivedDate gereklidir");
    }
    
    // Create inventory item
    const item = await storage.createInventoryItem(req.body);
    res.status(201).json(item);
  }));

  // Update inventory item status
  app.patch("/api/inventory/items/:id/status", isAuthenticated, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new Error("Geçersiz envanter öğesi ID'si");
    }
    
    const { status } = req.body;
    if (!status) {
      throw new Error("Durum bilgisi (status) gereklidir");
    }
    
    const item = await storage.updateInventoryItemStatus(id, status);
    if (!item) {
      res.status(404).json({ message: "Envanter öğesi bulunamadı" });
      return;
    }
    
    res.json(item);
  }));

  // Update inventory item
  app.patch("/api/inventory/items/:id", isAuthenticated, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new Error("Geçersiz envanter öğesi ID'si");
    }
    
    const item = await storage.updateInventoryItem(id, req.body);
    if (!item) {
      res.status(404).json({ message: "Envanter öğesi bulunamadı" });
      return;
    }
    
    res.json(item);
  }));

  // Middleware to check if user has a specific permission
  const hasPermission = (permissionCode: string) => (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Oturum açmanız gerekmektedir" });
    }

    // req.user tipini doğrula
    if (!req.user || !req.user.id) {
      console.error("hasPermission: req.user veya req.user.id tanımlı değil");
      return res.status(500).json({ message: "Kullanıcı bilgisi bulunamadı" });
    }

    console.log(`Getting permissions for userId: ${req.user.id}`);
    storage.hasPermission(req.user.id, permissionCode)
      .then(hasPermission => {
        if (hasPermission) {
          return next();
        }
        
        // Yetki olmadığında kullanıcı bilgileri ve istenen yetki hakkında detay logla
        console.warn(`⚠️ Yetki Reddedildi: kullanıcı=${req.user.id} (${req.user.username}) için ${permissionCode} yetkisi reddedildi`);
        
        res.status(403).json({ 
          message: "Bu işlem için yetkiniz bulunmamaktadır",
          details: `'${permissionCode}' yetkisine sahip değilsiniz`
        });
      })
      .catch(err => {
        console.error(`❌ Yetki kontrolü hatası: ${err.message}`, err);
        res.status(500).json({ 
          message: "Yetki kontrolü sırasında bir hata oluştu",
          error: process.env.NODE_ENV === 'development' ? err.toString() : undefined
        });
      });
  };

  // Initialize default data - devre dışı bırakıldı
  // await initializeDefaultData();
  console.log("Varsayılan veri yükleme işlemi devre dışı bırakıldı.");
  
  // Kartela tabloları oluştur
  try {
    await createKartelaTables();
  } catch (error) {
    console.error("Kartela tabloları oluşturulurken hata:", error);
  }
  
  // Makine ve makine tipleri için API rotaları
  const { machinesRouter } = await import("./routes/admin/machines");
  app.use("/api/admin/machines", isAuthenticated, machinesRouter);

  // Kartela modülü API rotaları
  app.use("/api/kartela", isAuthenticated, kartelaRouter);
  
  // Dokuma/terbiye/apre tabloları oluştur
  const { initializeWeavingFinishingTables } = await import("./storage/initialize-database-for-weaving-finishing");
  await initializeWeavingFinishingTables();
  
  // Etiket tipleri oluştur (seed)
  await createDefaultLabelTypes();
  
  // Sipariş-Üretim-Sevkiyat entegrasyonu tabloları oluştur
  const { initializeOrdersIntegrationTables, createDefaultOrderTrackingStatuses, createDefaultStatusTransitions } = await import("./storage/initialize-orders-integration");
  await initializeOrdersIntegrationTables();
  await createDefaultOrderTrackingStatuses();
  await createDefaultStatusTransitions();
  
  // Boya reçeteleri tabloları oluştur
  try {
    await createDyeRecipesTables();
    console.log("Boya reçeteleri tabloları başarıyla oluşturuldu");
  } catch (error) {
    console.error("Boya reçeteleri tabloları oluşturulurken hata:", error);
  }
  
  // WebSocket sistemi websocket.ts dosyasına taşındı
  // Bildirim sistemi sendNotification fonksiyonu ile websocket.ts dosyasından yönetiliyor
  // setDeviceNotificationSender fonksiyonu artık websocket.ts içindeki sendNotification fonksiyonunu kullanıyor

  // Admin API routes
  // Roles
  app.get("/api/admin/roles", isAuthenticated, hasPermission("admin:view_roles"), async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Roller alınırken bir hata oluştu" });
    }
  });

  app.post("/api/admin/roles", isAuthenticated, hasPermission("admin:manage_roles"), async (req, res) => {
    try {
      const validatedData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(validatedData);
      res.status(201).json(role);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Departments
  app.get("/api/admin/departments", isAuthenticated, hasPermission("admin:view_departments"), async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: "Departmanlar alınırken bir hata oluştu" });
    }
  });

  app.post("/api/admin/departments", isAuthenticated, hasPermission("admin:manage_departments"), async (req, res) => {
    try {
      const validatedData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(validatedData);
      res.status(201).json(department);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Users
  app.get("/api/admin/users", isAuthenticated, hasPermission("admin:view_users"), async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Kullanıcılar alınırken bir hata oluştu" });
    }
  });
  
  // Update user details
  app.patch("/api/admin/users/:id", isAuthenticated, hasPermission("admin:manage_users"), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Geçersiz kullanıcı ID'si" });
      }
      
      // Get existing user to check if exists
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      }
      
      // Güncellenen verileri hazırla
      const updateData: any = {};
      
      // Alanları güncelle
      if (req.body.username) updateData.username = req.body.username;
      if (req.body.fullName) updateData.fullName = req.body.fullName;
      if (req.body.email) updateData.email = req.body.email;
      if (req.body.password) {
        updateData.password = await storage.hashPassword(req.body.password);
      }
      if (req.body.departmentId) {
        updateData.departmentId = parseInt(req.body.departmentId);
      }
      
      // Kullanıcıyı güncelle
      const updatedUser = await storage.updateUser(userId, updateData);
      
      // Eğer rol bilgisi varsa güncelle
      if (req.body.roleId) {
        const roleId = parseInt(req.body.roleId);
        
        // Kullanıcının mevcut rolleri
        const userRoles = await storage.getUserRoles(userId);
        
        // Eğer zaten rolü varsa ve aynı ise bir şey yapma
        const hasRole = userRoles.some(role => role.id === roleId);
        
        if (!hasRole) {
          // Rol atama (mevcut rolleri kaldırmadan yeni rol ekle)
          await storage.assignRoleToUser(userId, roleId);
        }
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Kullanıcı güncellenirken hata:", error);
      res.status(500).json({ message: "Kullanıcı güncellenirken bir hata oluştu" });
    }
  });
  
  // Update user status (active/inactive)
  app.patch("/api/admin/users/:id/status", isAuthenticated, hasPermission("admin:manage_users"), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Geçersiz kullanıcı ID'si" });
      }
      
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive alanı boolean olmalıdır" });
      }
      
      const user = await storage.updateUserStatus(userId, isActive);
      if (!user) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Kullanıcı durumu güncellenirken hata:", error);
      res.status(500).json({ message: "Kullanıcı durumu güncellenirken bir hata oluştu" });
    }
  });
  
  // Delete user
  app.delete("/api/admin/users/:id", isAuthenticated, hasPermission("admin:manage_users"), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Geçersiz kullanıcı ID'si" });
      }
      
      // Admin kullanıcısını silmeye çalışıyorsa engelle
      if (userId === 1) {
        return res.status(403).json({ message: "Admin kullanıcısı silinemez" });
      }
      
      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Kullanıcı silinirken hata:", error);
      res.status(500).json({ message: "Kullanıcı silinirken bir hata oluştu" });
    }
  });
  
  // Get current user's roles
  app.get("/api/user/roles", isAuthenticated, async (req, res) => {
    try {
      const roles = await storage.getUserRoles(req.user.id);
      res.json(roles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      res.status(500).json({ message: "Roller alınırken bir hata oluştu" });
    }
  });
  
  // Get current user's permissions
  app.get("/api/user/permissions", isAuthenticated, async (req, res) => {
    try {
      const permissions = await storage.getUserPermissions(req.user.id);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ message: "Yetkiler alınırken bir hata oluştu" });
    }
  });
  
  // Assign role to user
  app.post("/api/admin/users/:userId/roles", isAuthenticated, hasPermission("admin:manage_users"), async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const roleId = req.body.roleId;
      
      if (!userId || !roleId) {
        return res.status(400).json({ message: "Kullanıcı ID ve Rol ID gereklidir" });
      }
      
      await storage.assignRoleToUser(userId, roleId);
      res.status(200).json({ message: "Rol kullanıcıya başarıyla atandı" });
    } catch (error) {
      console.error("Error assigning role to user:", error);
      res.status(500).json({ message: "Rol atama işlemi sırasında bir hata oluştu" });
    }
  });
  
  // Get roles for a specific user
  app.get("/api/admin/users/:userId/roles", isAuthenticated, hasPermission("admin:view_users"), async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Geçersiz kullanıcı ID'si" });
      }
      
      const roles = await storage.getUserRoles(userId);
      res.json(roles);
    } catch (error) {
      console.error(`Error fetching roles for user ${req.params.userId}:`, error);
      res.status(500).json({ message: "Kullanıcı rolleri alınırken bir hata oluştu" });
    }
  });

  // Permissions
  app.get("/api/admin/permissions", isAuthenticated, hasPermission("admin:view_permissions"), async (req, res) => {
    try {
      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "İzinler alınırken bir hata oluştu" });
    }
  });
  
  // Role Permission Management
  app.get("/api/admin/roles/:id/permissions", isAuthenticated, hasPermission("admin:manage_roles"), async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      if (isNaN(roleId)) {
        return res.status(400).json({ message: "Geçersiz rol ID'si" });
      }
      
      const permissions = await storage.getRolePermissions(roleId);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Rol izinleri alınırken bir hata oluştu" });
    }
  });

  app.post("/api/admin/roles/:id/permissions", isAuthenticated, hasPermission("admin:manage_roles"), async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      if (isNaN(roleId)) {
        return res.status(400).json({ message: "Geçersiz rol ID'si" });
      }
      
      if (!req.body.permissions || !Array.isArray(req.body.permissions)) {
        return res.status(400).json({ message: "Geçersiz izin listesi" });
      }
      
      // Önce eski izinleri temizle
      await storage.clearRolePermissions(roleId);
      
      // Yeni izinleri ekle
      for (const permissionId of req.body.permissions) {
        await storage.assignPermissionToRole(roleId, permissionId);
      }
      
      res.status(200).json({ message: "Rol izinleri başarıyla güncellendi" });
    } catch (error) {
      res.status(400).json({ message: error.message || "Rol izinleri güncellenirken bir hata oluştu" });
    }
  });
  
  // Delete Role
  app.delete("/api/admin/roles/:id", isAuthenticated, hasPermission("admin:manage_roles"), async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      if (isNaN(roleId)) {
        return res.status(400).json({ message: "Geçersiz rol ID'si" });
      }
      
      // Admin rolünü silmeye çalışıyorsa engelle
      if (roleId === 1) {
        return res.status(403).json({ message: "Admin rolü silinemez" });
      }
      
      const success = await storage.deleteRole(roleId);
      if (!success) {
        return res.status(404).json({ message: "Rol bulunamadı" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Rol silinirken bir hata oluştu" });
    }
  });

  // Master Data API routes
  // Fabric Types
  app.get("/api/master/fabrics", isAuthenticated, async (req, res) => {
    try {
      const fabrics = await storage.getFabricTypes();
      res.json(fabrics);
    } catch (error) {
      res.status(500).json({ message: "Kumaş tipleri alınırken bir hata oluştu" });
    }
  });

  app.post("/api/master/fabrics", isAuthenticated, hasPermission("admin:manage_master_data"), async (req, res) => {
    try {
      const validatedData = insertFabricTypeSchema.parse(req.body);
      const fabric = await storage.createFabricType(validatedData);
      res.status(201).json(fabric);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Yarn Types
  app.get("/api/master/yarns", isAuthenticated, async (req, res) => {
    try {
      const yarns = await storage.getYarnTypes();
      res.json(yarns);
    } catch (error) {
      res.status(500).json({ message: "İplik tipleri alınırken bir hata oluştu" });
    }
  });

  app.post("/api/master/yarns", isAuthenticated, hasPermission("admin:manage_master_data"), async (req, res) => {
    try {
      const validatedData = insertYarnTypeSchema.parse(req.body);
      const yarn = await storage.createYarnType(validatedData);
      res.status(201).json(yarn);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Raw Materials
  app.get("/api/master/raw-materials", isAuthenticated, async (req, res) => {
    try {
      const materials = await storage.getRawMaterials();
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Hammaddeler alınırken bir hata oluştu" });
    }
  });

  app.post("/api/master/raw-materials", isAuthenticated, hasPermission("admin:manage_master_data"), async (req, res) => {
    try {
      const validatedData = insertRawMaterialSchema.parse(req.body);
      const material = await storage.createRawMaterial(validatedData);
      res.status(201).json(material);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // CRM - Müşteri Etkileşimleri API'leri
  app.get("/api/customer-interactions", isAuthenticated, async (req, res) => {
    try {
      const interactions = await storage.getCustomerInteractions();
      res.json(interactions);
    } catch (error) {
      res.status(500).json({ message: "Müşteri etkileşimleri alınırken bir hata oluştu" });
    }
  });

  app.post("/api/customer-interactions", isAuthenticated, async (req, res) => {
    try {
      // userId'yi oturum bilgisinden al
      const userId = req.user.id;
      const validatedData = insertCustomerInteractionSchema.parse({
        ...req.body,
        userId
      });
      const interaction = await storage.createCustomerInteraction(validatedData);
      
      // Aktivite kaydı oluştur
      await storage.recordActivity({
        type: "customer_interaction",
        description: `${req.user.username} kullanıcısı ${interaction.subject} konulu müşteri etkileşimi ekledi`,
        userId: req.user.id,
        userName: req.user.username,
        entityId: interaction.id,
        entityType: "customer_interaction"
      });
      
      res.status(201).json(interaction);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // CRM - Fırsatlar API'leri
  app.get("/api/opportunities", isAuthenticated, async (req, res) => {
    try {
      const opportunities = await storage.getOpportunities();
      res.json(opportunities);
    } catch (error) {
      res.status(500).json({ message: "Fırsatlar alınırken bir hata oluştu" });
    }
  });

  app.post("/api/opportunities", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertOpportunitySchema.parse({
        ...req.body,
        assignedToUserId: req.body.assignedToUserId || req.user?.id
      });
      const opportunity = await storage.createOpportunity(validatedData);
      
      // Aktivite kaydı oluştur
      await storage.recordActivity({
        type: "opportunity",
        description: `${req.user?.username} kullanıcısı ${opportunity.title} başlıklı satış fırsatı ekledi`,
        userId: req.user?.id,
        userName: req.user?.username,
        entityId: opportunity.id,
        entityType: "opportunity"
      });
      
      // Satış departmanındaki kullanıcılara bildirim gönder
      if (req.user && sendNotificationToUser) {
        try {
          // Satış departmanını bul (id=2)
          const salesDeptId = 2;
          const salesUsers = await storage.getUsersByDepartmentId(salesDeptId);
          
          if (salesUsers && salesUsers.length > 0) {
            for (const user of salesUsers) {
              // İşlemi yapan kullanıcı dışındakilere bildirim gönder
              if (user.id !== req.user.id) {
                await sendNotificationToUser(user.id, {
                  title: "Yeni Satış Fırsatı",
                  content: `${opportunity.title} başlıklı yeni satış fırsatı ${req.user.fullName} tarafından eklendi. Gelir potansiyeli: ${opportunity.potentialRevenue || 'Belirtilmemiş'}`,
                  type: "sales", 
                  entityId: opportunity.id,
                  entityType: "opportunity"
                });
              }
            }
            console.log(`Yeni satış fırsatı bildirimi gönderildi - ${opportunity.title}`);
          }
        } catch (notifError) {
          console.error("Satış fırsatı bildirim hatası:", notifError);
          // Bildirim hatası API yanıtını etkilemeyecek
        }
      }
      
      res.status(201).json(opportunity);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu' });
    }
  });



  // Order Statuses
  app.get("/api/order-statuses", isAuthenticated, async (req, res) => {
    try {
      const statuses = await storage.getOrderStatuses();
      res.json(statuses);
    } catch (error) {
      res.status(500).json({ message: "Sipariş durumları alınırken bir hata oluştu" });
    }
  });

  // Initialize sample data 
  app.post("/api/initialize-sample-data", isAuthenticated, hasPermission("admin:manage_system"), async (req, res) => {
    try {
      // Örnek sipariş durumları
      if (!(await storage.getOrderStatusByCode("PENDING"))) {
        await storage.createOrderStatus({
          name: "Beklemede",
          code: "PENDING",
          color: "#FFC107" // sarı
        });
      }
      
      if (!(await storage.getOrderStatusByCode("PRODUCTION"))) {
        await storage.createOrderStatus({
          name: "Üretimde",
          code: "PRODUCTION", 
          color: "#4CAF50" // yeşil
        });
      }
      
      if (!(await storage.getOrderStatusByCode("SHIPPING"))) {
        await storage.createOrderStatus({
          name: "Sevkiyatta",
          code: "SHIPPING",
          color: "#2196F3" // mavi
        });
      }
      
      if (!(await storage.getOrderStatusByCode("COMPLETED"))) {
        await storage.createOrderStatus({
          name: "Tamamlandı",
          code: "COMPLETED",
          color: "#9C27B0" // mor
        });
      }
      
      if (!(await storage.getOrderStatusByCode("CANCELLED"))) {
        await storage.createOrderStatus({
          name: "İptal Edildi",
          code: "CANCELLED",
          color: "#F44336" // kırmızı
        });
      }
      
      // Örnek müşteriler
      if ((await storage.getCustomers()).length === 0) {
        await storage.createCustomer({
          name: "ABC Tekstil Ltd. Şti.",
          contactPerson: "Ahmet Yılmaz",
          phone: "+90 212 555 1234",
          email: "info@abctekstil.com",
          address: "İstanbul, Türkiye",
          city: "İstanbul",
          taxNumber: "1234567890",
          customerCode: "ABC001",
          customerType: "manufacturer",
          isActive: true,
          notes: "Düzenli müşteri",
        });
        
        await storage.createCustomer({
          name: "XYZ Garment Co.",
          contactPerson: "John Smith",
          phone: "+1 987 654 3210",
          email: "contact@xyzgarment.com",
          address: "Los Angeles, USA",
          city: "Los Angeles",
          taxNumber: "0987654321",
          customerCode: "XYZ002",
          customerType: "exporter",
          isActive: true,
          notes: "Uluslararası müşteri",
        });
      }
      
      // Örnek kumaş tipleri
      if ((await storage.getFabricTypes()).length === 0) {
        await storage.createFabricType({
          name: "Pamuklu Örme",
          code: "COTTON-KNIT",
          description: "100% pamuklu örme kumaş",
        });
        
        await storage.createFabricType({
          name: "Polyester Dokuma",
          code: "POLY-WOVEN",
          description: "100% polyester dokuma kumaş",
        });
      }
      
      res.json({ 
        message: "Örnek veriler başarıyla oluşturuldu.",
        orderStatuses: await storage.getOrderStatuses(),
        customers: await storage.getCustomers(),
        fabricTypes: await storage.getFabricTypes()
      });
    } catch (error) {
      console.error("Örnek veriler oluşturulurken hata:", error);
      res.status(500).json({ message: `Örnek veriler oluşturulurken hata: ${error.message}` });
    }
  });
  
  // Orders
  app.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Siparişler alınırken bir hata oluştu" });
    }
  });
  
  // Order Summary - for reports and dashboards - SQL verileri kullanıyor
  app.get("/api/orders/summary", isAuthenticated, asyncHandler(async (req, res) => {
    try {
      // Gerçek veritabanı sorgularını kullanıyoruz - storage.getOrderSummary()
      const orderSummary = await storage.getOrderSummary();
      
      // Veritabanından gelen verileri yanıt olarak gönder
      res.json(orderSummary);
      
      // Log kaydı
      console.log("Sipariş özeti SQL veritabanından başarıyla alındı");
    } catch (error) {
      console.error("❌ Sipariş özeti getirilemedi:", error);
      res.status(500).json({ message: "Sipariş özeti getirilemedi" });
    }
  }));

  app.post("/api/orders", isAuthenticated, hasPermission("sales:manage_orders"), async (req, res) => {
    try {
      // Gelen veriyi al
      const submittedData = req.body;
      
      // Sipariş numarası oluştur veya kullan
      let orderNumber = submittedData.orderNumber;
      
      // Eğer sipariş numarası yoksa veya TEMP- ile başlıyorsa yeni bir numara oluştur
      if (!orderNumber || orderNumber.startsWith('TEMP-')) {
        // Sipariş numarası oluştur - ORD-YYYYMM-XXXX formatında
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        
        // Son siparişi bul ve numarasını 1 artır
        // Eğer getLastOrder implement edilmemişse, doğrudan 1'den başla
        let orderCount = 1;
        
        try {
          const lastOrder = await storage.getLastOrder();
          if (lastOrder) {
            const lastOrderNumber = lastOrder.orderNumber;
            const lastOrderCountStr = lastOrderNumber.split('-')[2];
            if (lastOrderCountStr) {
              orderCount = parseInt(lastOrderCountStr) + 1;
            }
          }
        } catch (error) {
          console.log("getLastOrder fonksiyonu bulunamadı veya hata oluştu, varsayılan sayı kullanılıyor:", error);
        }
        
        orderNumber = `ORD-${year}${month}-${String(orderCount).padStart(4, '0')}`;
        submittedData.orderNumber = orderNumber;
      }
      
      // Veri tiplerini düzeltelim
      // Sayısal değerleri sayıya dönüştür
      if (submittedData.quantity && typeof submittedData.quantity === 'string') {
        submittedData.quantity = Number(submittedData.quantity);
      }
      
      if (submittedData.unitPrice === undefined || submittedData.unitPrice === null) {
        submittedData.unitPrice = 0;
      } else if (typeof submittedData.unitPrice === 'string') {
        submittedData.unitPrice = Number(submittedData.unitPrice);
      }
      
      if (submittedData.width && typeof submittedData.width === 'string') {
        submittedData.width = Number(submittedData.width);
      }
      
      if (submittedData.weight && typeof submittedData.weight === 'string') {
        submittedData.weight = Number(submittedData.weight);
      }
      
      // Tarih değerlerini Date nesnesine dönüştür
      if (submittedData.orderDate && typeof submittedData.orderDate === 'string') {
        submittedData.orderDate = new Date(submittedData.orderDate);
      }
      
      if (submittedData.dueDate && typeof submittedData.dueDate === 'string') {
        submittedData.dueDate = new Date(submittedData.dueDate);
      }
      
      // Düzeltilmiş şema ile validate ve kaydet
      const validatedData = insertOrderSchemaFixed.parse({
        ...submittedData,
        createdBy: req.user?.id
      });
      
      console.log("Validasyon sonrası sipariş verisi:", validatedData);
      
      // Sayısal değerler native SQL sorgusu içinde otomatik olarak dönüştürülüyor
      // createOrder metodu doğrudan SQL ile sorgu yaptığından veri tipleri zaten doğru dönüştürülecek
      // Asıl sorun olan nokta: numeric -> string -> number dönüşümü için formattedData nesnesini temizleyelim
      const formattedData = {
        ...validatedData
      };
      
      console.log("Veritabanı formatına dönüştürülen sipariş verisi:", formattedData);
      
      // Sipariş oluştur
      const order = await storage.createOrder(formattedData);
      
      // Otomatik olarak üretim planı oluştur
      const planStartDate = new Date();
      // Termin tarihinden 5 gün önce bitirmeyi hedefle
      const planEndDate = new Date(order.dueDate);
      planEndDate.setDate(planEndDate.getDate() - 5);
      
      // Eğer planEndDate bugünden önceyse veya bugünse, bugünden 7 gün sonra olarak ayarla
      if (planEndDate <= planStartDate) {
        planEndDate.setDate(planStartDate.getDate() + 7); // Varsayılan olarak 1 hafta
      }
      
      try {
        // Planlama departmanında varsayılan olarak atanacak kullanıcıyı bul
        // İlk planlama departmanındaki kullanıcıyı veya admin'i kullan
        const planningDepartment = await storage.getDepartmentByCode("PLANNING");
        let assignedTo = req.user?.id; // Varsayılan olarak sipariş oluşturan kişi
        
        if (planningDepartment) {
          // Planlama departmanındaki ilk aktif kullanıcıyı bul
          const planningUsers = await storage.getUsersByDepartmentId(planningDepartment.id);
          if (planningUsers.length > 0) {
            assignedTo = planningUsers[0].id;
          }
        }
        
        const productionPlan = await storage.createProductionPlan({
          planNo: `PP-${order.orderNumber}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          description: `${order.orderNumber} nolu sipariş için üretim planı`,
          productionStartDate: planStartDate,
          productionEndDate: planEndDate,
          status: "Beklemede",
          createdBy: req.user?.id,
          assignedTo: assignedTo,
          notes: `${order.orderNumber} nolu sipariş için otomatik oluşturulan plan. Termin: ${new Date(order.dueDate).toLocaleDateString('tr-TR')}`,
          priority: submittedData.isUrgent ? "Yüksek" : "Normal"
        });
        
        // Sipariş ve planlama aktivitesini kaydet
        await storage.recordActivity({
          type: "order_created",
          description: `${req.user?.username} kullanıcısı ${order.orderNumber} nolu siparişi oluşturdu ve otomatik planlama yapıldı`,
          userId: req.user?.id || 1,
          userName: req.user?.username || "Sistem",
          entityId: order.id,
          entityType: "order"
        });
        
        // Satış departmanındaki kullanıcılara bildirim gönder
        if (req.user && sendNotificationToUser) {
          try {
            // Satış departmanı (id=2) ve Planlama departmanı (id=10) kullanıcılarını bul
            const departments = [2, 10]; // Satış ve Planlama departman ID'leri
            
            for (const deptId of departments) {
              const deptUsers = await storage.getUsersByDepartmentId(deptId);
              
              if (deptUsers && deptUsers.length > 0) {
                for (const user of deptUsers) {
                  // İşlemi yapan kullanıcı dışındakilere bildirim gönder
                  if (user.id !== req.user.id) {
                    await sendNotificationToUser(user.id, {
                      title: "Yeni Sipariş Oluşturuldu",
                      content: `${order.orderNumber} numaralı ${submittedData.quantity} ${submittedData.unit} miktar yeni sipariş ${req.user.fullName} tarafından oluşturuldu.`,
                      type: "sales",
                      entityId: order.id,
                      entityType: "order"
                    });
                  }
                }
              }
            }
            
            console.log(`Yeni sipariş bildirimi gönderildi - ${order.orderNumber}`);
          } catch (notifError) {
            console.error("Sipariş bildirim hatası:", notifError);
            // Bildirim hatası API yanıtını etkilemeyecek
          }
        }
        
        // Planlama ve termin tarihi bilgilerini içeren sipariş bilgisini dön
        const result = {
          ...order,
          productionPlan: {
            id: productionPlan.id,
            planNo: productionPlan.planNo,
            productionStartDate: productionPlan.productionStartDate,
            productionEndDate: productionPlan.productionEndDate,
            status: productionPlan.status
          }
        };
        
        res.status(201).json(result);
      } catch (planError) {
        console.error("Otomatik plan oluşturma hatası:", planError);
        // Plan oluşturulamazsa bile sipariş oluşturuldu mesajını dön
        res.status(201).json({
          ...order,
          warning: "Sipariş oluşturuldu ancak otomatik planlama yapılamadı. Lütfen planlama departmanına bilgi verin."
        });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Geçersiz sipariş ID'si" });
      }
      
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Sipariş bulunamadı" });
      }
      
      // Kumaş tipi adını sipariş nesnesine ekle
      if (order.fabricTypeId) {
        try {
          const fabricTypes = await storage.getFabricTypes();
          const fabricType = fabricTypes.find(f => f.id === order.fabricTypeId);
          if (fabricType) {
            // TypeScript'in nesne tiplerini dinamik olarak genişletmesine izin verelim
            // @ts-ignore: fabricTypeName alanını dinamik olarak ekliyoruz
            order.fabricTypeName = fabricType.name;
          }
        } catch (fabricError) {
          console.error("Kumaş tipi bilgisi alınırken hata:", fabricError);
          // Hata olsa bile işlemi devam ettir
        }
      }
      
      res.json(order);
    } catch (error) {
      console.error("Sipariş detayı alınırken hata:", error);
      res.status(500).json({ message: "Sipariş alınırken bir hata oluştu" });
    }
  });

  app.patch("/api/orders/:id/status", isAuthenticated, hasPermission("sales:manage_orders"), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { statusId } = req.body;
      
      if (isNaN(orderId) || !statusId) {
        return res.status(400).json({ message: "Geçersiz sipariş ID'si veya durum" });
      }
      
      // Sipariş durumunu güncelle
      const updated = await storage.updateOrderStatus(orderId, statusId);
      if (!updated) {
        return res.status(404).json({ message: "Sipariş bulunamadı" });
      }
      
      // Güncel durum adını bul
      const statusInfo = await storage.getOrderStatusById(statusId);
      const statusName = statusInfo?.name || "Bilinmeyen Durum";
      
      // Satış ve Planlama departmanlarındaki kullanıcılara bildirim gönder
      if (req.user && sendNotificationToUser) {
        try {
          // Satış departmanı (id=2) ve Planlama departmanı (id=10) kullanıcılarını bul
          const departments = [2, 10]; // Satış ve Planlama departman ID'leri
          
          for (const deptId of departments) {
            const deptUsers = await storage.getUsersByDepartmentId(deptId);
            
            if (deptUsers && deptUsers.length > 0) {
              for (const user of deptUsers) {
                // İşlemi yapan kullanıcı dışındakilere bildirim gönder
                if (user.id !== req.user.id) {
                  await sendNotificationToUser(user.id, {
                    title: "Sipariş Durumu Değişti",
                    content: `${updated.orderNumber} numaralı sipariş "${statusName}" durumuna ${req.user.fullName} tarafından güncellendi.`,
                    type: "sales",
                    entityId: orderId,
                    entityType: "order"
                  });
                }
              }
            }
          }
          
          console.log(`Sipariş durum değişikliği bildirimi gönderildi - ${updated.orderNumber}`);
        } catch (notifError) {
          console.error("Sipariş durum değişikliği bildirim hatası:", notifError);
          // Bildirim hatası API yanıtını etkilemeyecek
        }
      }
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Sipariş durumu güncellenirken bir hata oluştu" });
    }
  });

  // REMOVED DUPLICATE ORDER SUMMARY ENDPOINT
  
  // Customers
  app.get("/api/customers", isAuthenticated, async (req, res) => {
    try {
      console.log("Getting customers...");
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Müşteriler alınırken bir hata oluştu" });
    }
  });
  
  app.post("/api/customers", isAuthenticated, hasPermission("sales:manage_customers"), async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      
      // Satış departmanındaki kullanıcılara bildirim gönder
      if (req.user && sendNotificationToUser) {
        try {
          // Satış departmanını bul (id=2)
          const salesDeptId = 2;
          const salesUsers = await storage.getUsersByDepartmentId(salesDeptId);
          
          if (salesUsers && salesUsers.length > 0) {
            for (const user of salesUsers) {
              // İşlemi yapan kullanıcı dışındakilere bildirim gönder
              if (user.id !== req.user.id) {
                await sendNotificationToUser(user.id, {
                  title: "Yeni Müşteri Eklendi",
                  content: `${validatedData.name} isimli yeni müşteri ${req.user.fullName} tarafından eklendi.`,
                  type: "sales",
                  entityId: customer.id,
                  entityType: "customer"
                });
              }
            }
            console.log(`Yeni müşteri bildirimi gönderildi - ${validatedData.name}`);
          }
        } catch (notifError) {
          console.error("Müşteri bildirim hatası:", notifError);
          // Bildirim hatası API yanıtını etkilemeyecek
        }
      }
      
      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(400).json({ message: error.message });
    }
  });
  
  // Customer Interactions
  app.get("/api/customer-interactions", isAuthenticated, async (req, res) => {
    try {
      const interactions = await storage.getCustomerInteractions();
      res.json(interactions);
    } catch (error) {
      res.status(500).json({ message: "Müşteri etkileşimleri alınırken bir hata oluştu" });
    }
  });
  
  app.post("/api/customer-interactions", isAuthenticated, hasPermission("sales:manage_customers"), async (req, res) => {
    try {
      const validatedData = insertCustomerInteractionSchema.parse({
        ...req.body,
        userId: req.user.id,
        userName: req.user.fullName,
        timestamp: new Date()
      });
      
      const interaction = await storage.createCustomerInteraction(validatedData);
      res.status(201).json(interaction);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Opportunities
  app.get("/api/opportunities", isAuthenticated, async (req, res) => {
    try {
      const opportunities = await storage.getOpportunities();
      res.json(opportunities);
    } catch (error) {
      res.status(500).json({ message: "Fırsatlar alınırken bir hata oluştu" });
    }
  });
  
  app.post("/api/opportunities", isAuthenticated, hasPermission("sales:manage_customers"), async (req, res) => {
    try {
      const validatedData = insertOpportunitySchema.parse({
        ...req.body,
        userId: req.user.id,
        createdAt: new Date()
      });
      
      const opportunity = await storage.createOpportunity(validatedData);
      res.status(201).json(opportunity);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Recent Activities
  app.get("/api/activities", isAuthenticated, async (req, res) => {
    try {
      const activities = await storage.getRecentActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Aktiviteler alınırken bir hata oluştu" });
    }
  });
  
  // =========================================================
  // PLANLAMA BÖLÜMÜ API ROUTE'LARI
  // =========================================================

  // Süreç Tipleri API
  app.get("/api/planning/process-types", isAuthenticated, async (req, res) => {
    try {
      const processTypes = await storage.getProcessTypes();
      res.json(processTypes);
    } catch (error) {
      console.error("Süreç tipleri alınırken hata oluştu:", error);
      res.status(500).json({ message: "Süreç tipleri alınırken bir hata oluştu" });
    }
  });

  // Üretim Planları API
  app.get("/api/planning/production-plans", isAuthenticated, async (req, res) => {
    try {
      const productionPlans = await storage.getProductionPlans();
      console.log("Üretim planları getiriliyor - API yanıtı:", JSON.stringify(productionPlans).slice(0, 200) + "...");
      res.json(productionPlans);
    } catch (error) {
      console.error("Üretim planları alınırken hata oluştu:", error);
      res.status(500).json({ 
        message: "Üretim planları alınırken bir hata oluştu", 
        error: (error as Error).message 
      });
    }
  });
  
  // Üretim Adımları API
  app.get("/api/planning/production-steps", isAuthenticated, async (req, res) => {
    try {
      const planId = req.query.planId ? Number(req.query.planId) : undefined;
      const steps = await storage.getProductionSteps(planId);
      res.json(steps);
    } catch (error) {
      console.error("Üretim adımları alınırken hata oluştu:", error);
      res.status(500).json({ message: "Üretim adımları alınırken bir hata oluştu" });
    }
  });
  
  app.post("/api/planning/production-steps", isAuthenticated, async (req, res) => {
    try {
      console.log("Üretim adımı oluşturma body:", JSON.stringify(req.body));
      
      // Gelen verileri düzenleyelim - tarih alanları için özel işlem yapalım
      const formData = req.body;
      
      // Tarih alanlarını düzgün tarih formatına çevirelim
      if (formData.plannedStartDate) {
        formData.plannedStartDate = new Date(formData.plannedStartDate);
      }
      
      if (formData.plannedEndDate) {
        formData.plannedEndDate = new Date(formData.plannedEndDate);
      }
      
      // Eskiden startDate ve endDate kullanılıyordu, bunlar varsa plannedStartDate ve plannedEndDate'e kopyalayalım
      if (formData.startDate && !formData.plannedStartDate) {
        formData.plannedStartDate = new Date(formData.startDate);
        delete formData.startDate; // Artık buna ihtiyacımız yok
      }
      
      if (formData.endDate && !formData.plannedEndDate) {
        formData.plannedEndDate = new Date(formData.endDate);
        delete formData.endDate; // Artık buna ihtiyacımız yok
      }
      
      const newStep = await storage.createProductionStep(formData);
      res.status(201).json(newStep);
    } catch (error) {
      console.error("Üretim adımı oluşturulurken hata oluştu:", error);
      res.status(500).json({ message: "Üretim adımı oluşturulurken bir hata oluştu" });
    }
  });
  
  app.put("/api/planning/production-steps/:id", isAuthenticated, async (req, res) => {
    try {
      const stepId = Number(req.params.id);
      console.log("Üretim adımı güncelleme body:", JSON.stringify(req.body));
      
      // Gelen verileri düzenleyelim - tarih alanları için özel işlem yapalım
      const formData = req.body;
      
      // Tarih alanlarını düzgün tarih formatına çevirelim
      if (formData.plannedStartDate) {
        formData.plannedStartDate = new Date(formData.plannedStartDate);
      }
      
      if (formData.plannedEndDate) {
        formData.plannedEndDate = new Date(formData.plannedEndDate);
      }
      
      // Eskiden startDate ve endDate kullanılıyordu, bunlar varsa plannedStartDate ve plannedEndDate'e kopyalayalım
      if (formData.startDate && !formData.plannedStartDate) {
        formData.plannedStartDate = new Date(formData.startDate);
        delete formData.startDate; // Artık buna ihtiyacımız yok
      }
      
      if (formData.endDate && !formData.plannedEndDate) {
        formData.plannedEndDate = new Date(formData.endDate);
        delete formData.endDate; // Artık buna ihtiyacımız yok
      }
      
      const updatedStep = await storage.updateProductionStep(stepId, formData);
      
      if (!updatedStep) {
        return res.status(404).json({ message: "Üretim adımı bulunamadı" });
      }
      
      res.json(updatedStep);
    } catch (error) {
      console.error("Üretim adımı güncellenirken hata oluştu:", error);
      res.status(500).json({ message: "Üretim adımı güncellenirken bir hata oluştu" });
    }
  });
  
  // Üretim Rota Şablonları API
  app.get("/api/planning/route-templates", isAuthenticated, async (req, res) => {
    try {
      const templates = await storage.getProductionRouteTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Rota şablonları alınırken hata oluştu:", error);
      res.status(500).json({ message: "Rota şablonları alınırken bir hata oluştu" });
    }
  });
  
  app.get("/api/planning/route-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const templateId = Number(req.params.id);
      const template = await storage.getProductionRouteTemplateById(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Rota şablonu bulunamadı" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Rota şablonu alınırken hata oluştu:", error);
      res.status(500).json({ message: "Rota şablonu alınırken bir hata oluştu" });
    }
  });
  
  app.post("/api/planning/route-templates", isAuthenticated, async (req, res) => {
    try {
      console.log("Rota şablonu oluşturma isteği:", req.body);
      const newTemplate = await storage.createProductionRouteTemplate(req.body);
      console.log("Oluşturulan rota şablonu:", newTemplate);
      res.status(201).json(newTemplate);
    } catch (error) {
      console.error("Rota şablonu oluşturulurken hata oluştu:", error);
      res.status(500).json({ message: "Rota şablonu oluşturulurken bir hata oluştu: " + (error instanceof Error ? error.message : String(error)) });
    }
  });
  
  app.put("/api/planning/route-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const templateId = Number(req.params.id);
      console.log(`${templateId} ID'li rota şablonu güncelleme isteği:`, req.body);
      const updatedTemplate = await storage.updateProductionRouteTemplate(templateId, req.body);
      
      if (!updatedTemplate) {
        console.log(`${templateId} ID'li rota şablonu güncellenemedi, bulunamadı`);
        return res.status(404).json({ message: "Rota şablonu bulunamadı" });
      }
      
      console.log("Güncellenen rota şablonu:", updatedTemplate);
      res.json(updatedTemplate);
    } catch (error) {
      console.error("Rota şablonu güncellenirken hata oluştu:", error);
      res.status(500).json({ message: "Rota şablonu güncellenirken bir hata oluştu: " + (error instanceof Error ? error.message : String(error)) });
    }
  });
  
  app.delete("/api/planning/route-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const templateId = Number(req.params.id);
      console.log(`${templateId} ID'li rota şablonu silme isteği`);
      const success = await storage.deleteProductionRouteTemplate(templateId);
      
      if (!success) {
        console.log(`${templateId} ID'li rota şablonu silinemedi, bulunamadı veya bağlı adımları var`);
        return res.status(404).json({ message: "Rota şablonu bulunamadı veya silinemedi" });
      }
      
      console.log(`${templateId} ID'li rota şablonu başarıyla silindi`);
      res.json({ message: "Rota şablonu başarıyla silindi" });
    } catch (error) {
      console.error("Rota şablonu silinirken hata oluştu:", error);
      res.status(500).json({ message: "Rota şablonu silinirken bir hata oluştu: " + (error instanceof Error ? error.message : String(error)) });
    }
  });
  
  // Üretim Rota Şablon Adımları API
  app.get("/api/planning/route-template-steps/:templateId", isAuthenticated, async (req, res) => {
    try {
      const templateId = Number(req.params.templateId);
      console.log(`${templateId} ID'li rota şablonu adımları isteniyor...`);
      const steps = await storage.getProductionRouteTemplateSteps(templateId);
      console.log(`${templateId} ID'li rota şablonu adımları:`, steps);
      res.json(steps);
    } catch (error) {
      console.error("Rota şablonu adımları alınırken hata oluştu:", error);
      res.status(500).json({ message: "Rota şablonu adımları alınırken bir hata oluştu: " + (error instanceof Error ? error.message : String(error)) });
    }
  });
  
  app.post("/api/planning/route-template-steps", isAuthenticated, async (req, res) => {
    try {
      const newStep = await storage.createProductionRouteTemplateStep(req.body);
      res.status(201).json(newStep);
    } catch (error) {
      console.error("Rota şablonu adımı oluşturulurken hata oluştu:", error);
      res.status(500).json({ message: "Rota şablonu adımı oluşturulurken bir hata oluştu" });
    }
  });
  
  app.put("/api/planning/route-template-steps/:id", isAuthenticated, async (req, res) => {
    try {
      const stepId = Number(req.params.id);
      const updatedStep = await storage.updateProductionRouteTemplateStep(stepId, req.body);
      
      if (!updatedStep) {
        return res.status(404).json({ message: "Rota şablonu adımı bulunamadı" });
      }
      
      res.json(updatedStep);
    } catch (error) {
      console.error("Rota şablonu adımı güncellenirken hata oluştu:", error);
      res.status(500).json({ message: "Rota şablonu adımı güncellenirken bir hata oluştu" });
    }
  });
  
  app.delete("/api/planning/route-template-steps/:id", isAuthenticated, async (req, res) => {
    try {
      const stepId = Number(req.params.id);
      const success = await storage.deleteProductionRouteTemplateStep(stepId);
      
      if (!success) {
        return res.status(404).json({ message: "Rota şablonu adımı bulunamadı veya silinemedi" });
      }
      
      res.json({ message: "Rota şablonu adımı başarıyla silindi" });
    } catch (error) {
      console.error("Rota şablonu adımı silinirken hata oluştu:", error);
      res.status(500).json({ message: "Rota şablonu adımı silinirken bir hata oluştu" });
    }
  });
  
  // Rota Şablonunu Üretim Planına Uygulama API
  app.post("/api/planning/apply-route-template", isAuthenticated, async (req, res) => {
    try {
      const { productionPlanId, templateId, startDate } = req.body;
      
      if (!productionPlanId || !templateId || !startDate) {
        return res.status(400).json({ message: "Eksik bilgi. productionPlanId, templateId ve startDate gereklidir." });
      }
      
      const steps = await storage.applyRouteTemplateToProductionPlan(
        Number(productionPlanId),
        Number(templateId),
        new Date(startDate)
      );
      
      res.json({
        message: "Rota şablonu üretim planına başarıyla uygulandı",
        steps
      });
    } catch (error) {
      console.error("Rota şablonu uygulanırken hata oluştu:", error);
      res.status(500).json({ 
        message: "Rota şablonu uygulanırken bir hata oluştu", 
        error: error.message 
      });
    }
  });

  app.get("/api/planning/production-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      if (isNaN(planId)) {
        return res.status(400).json({ message: "Geçersiz plan ID'si" });
      }
      
      const productionPlan = await storage.getProductionPlanById(planId);
      if (!productionPlan) {
        return res.status(404).json({ message: "Üretim planı bulunamadı" });
      }
      
      res.json(productionPlan);
    } catch (error) {
      console.error(`Üretim planı alınırken hata oluştu (ID: ${req.params.id}):`, error);
      res.status(500).json({ message: "Üretim planı alınırken bir hata oluştu" });
    }
  });

  app.post("/api/planning/production-plans", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Kullanıcı kimliği bulunamadı" });
      }
      
      // Form verilerini hazırla ve tarih alanlarını düzgün formatlara dönüştür
      const planData = {
        ...req.body,
        createdBy: userId,
        oldStartDate: new Date(req.body.oldStartDate), 
        oldEndDate: new Date(req.body.oldEndDate)
      };
      
      console.log("Plan verileri:", planData);
      
      const productionPlan = await storage.createProductionPlan(planData);
      // Sipariş durumunu güncelle
      await storage.updateOrderStatus(planData.orderId, 3); // 3 = Planlandı durumu
      
      res.status(201).json(productionPlan);
    } catch (error) {
      console.error("Üretim planı oluşturulurken hata oluştu:", error);
      res.status(500).json({ message: "Üretim planı oluşturulurken bir hata oluştu" });
    }
  });

  app.put("/api/planning/production-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      if (isNaN(planId)) {
        return res.status(400).json({ message: "Geçersiz plan ID'si" });
      }
      
      const updatedPlan = await storage.updateProductionPlan(planId, req.body);
      if (!updatedPlan) {
        return res.status(404).json({ message: "Üretim planı bulunamadı" });
      }
      
      res.json(updatedPlan);
    } catch (error) {
      console.error(`Üretim planı güncellenirken hata oluştu (ID: ${req.params.id}):`, error);
      res.status(500).json({ message: "Üretim planı güncellenirken bir hata oluştu" });
    }
  });

  // Üretim adımları API uç noktaları zaten yukarıda tanımlanmıştır

  // Dokuma bölümü - Makineler API rotası
  app.get("/api/weaving/machines", isAuthenticated, asyncHandler(async (req, res) => {
    const machines = await storage.getMachines();
    const weavingMachines = machines.filter(m => m.machineTypeId === 1 || m.machineTypeId === 2); // Dokuma makineleri (RAPIER ve AIRJET)
    res.json(weavingMachines);
  }));

  // Dokuma bölümü - İş Emirleri API rotası
  app.get("/api/weaving/work-orders", isAuthenticated, asyncHandler(async (req, res) => {
    // Burada dokuma iş emirlerini getiriyoruz
    // Gerçekte bu, üretim planlarından dokuma tipinde olanları filtrelemek olabilir
    const plans = await storage.getProductionPlans();
    const weavingOrders = plans.filter(p => p.description?.includes('Dokuma') || (p.notes && p.notes.includes('Dokuma')) || true); 
    res.json(weavingOrders);
  }));
  
  // Dokuma iş emri oluşturma API
  app.post("/api/weaving/work-orders", isAuthenticated, asyncHandler(async (req, res) => {
    const workOrderData = req.body;
    // İş emri numarası oluşturma
    const orderNumber = `WO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Üretim planı bilgilerini alalım
    const productionPlan = await storage.getProductionPlanById(workOrderData.productionPlanId);
    if (!productionPlan) {
      return res.status(404).json({ message: "Üretim planı bulunamadı" });
    }
    
    // İş emri verilerini oluşturalım
    const workOrder = {
      orderNumber,
      planNo: productionPlan.planNo,
      orderId: productionPlan.orderId,
      orderNumber: productionPlan.orderNumber,
      description: `${productionPlan.orderNumber} dokuma iş emri`,
      productionStartDate: workOrderData.startDate || new Date(),
      productionEndDate: workOrderData.estimatedEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      oldStartDate: workOrderData.startDate ? new Date(workOrderData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      oldEndDate: workOrderData.estimatedEndDate ? new Date(workOrderData.estimatedEndDate).toISOString().split('T')[0] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: workOrderData.status || "Beklemede",
      priority: workOrderData.priority || "Normal",
      createdBy: req.user ? req.user.id : 1,
      assignedTo: workOrderData.assignedTo || null,
      notes: workOrderData.notes || "",
      // Diğer dokuma spesifik alanlar
      weavingMachineId: workOrderData.weavingMachineId,
      warpPreparationRequired: workOrderData.warpPreparationRequired,
      warpLength: workOrderData.warpLength,
      warpDensity: workOrderData.warpDensity,
      weftDensity: workOrderData.weftDensity,
      totalWarpEnds: workOrderData.totalWarpEnds,
    };
    
    // Üretim planını iş emri olarak kaydet
    const createdWorkOrder = await storage.createProductionPlan(workOrder);
    res.json(createdWorkOrder);
  }));
  
  // Dokuma - Çözgü hazırlama gerektiren iş emirleri
  app.get("/api/weaving/work-orders/warp-required", isAuthenticated, asyncHandler(async (req, res) => {
    const plans = await storage.getProductionPlans();
    // Çözgü hazırlama gerektiren iş emirlerini filtreliyoruz
    // Gerçekte bu bilgi veritabanında warpPreparationRequired alanında saklanmalı
    const warpRequiredOrders = plans.filter(p => 
      (p.notes && p.notes.toLowerCase().includes('çözgü')) || 
      (p.description && p.description.toLowerCase().includes('çözgü'))
    );
    res.json(warpRequiredOrders);
  }));
  
  // Dokuma - Çözgü hazırlama makineleri
  app.get("/api/weaving/warping-machines", isAuthenticated, asyncHandler(async (req, res) => {
    const machines = await storage.getMachines();
    // Çözgü hazırlama makinelerini filtreliyoruz (machineTypeId: 3 - WARPMACHINE)
    const warpingMachines = machines.filter(m => m.machineTypeId === 3);
    res.json(warpingMachines);
  }));
  
  // Dokuma - Çözgü hazırlama kayıtları
  app.get("/api/weaving/warp-preparations", isAuthenticated, asyncHandler(async (req, res) => {
    // Çözgü hazırlama kayıtları için örnek veri
    // Gerçekte bu veriler veritabanından alınmalı
    res.json([
      { 
        id: 1, 
        workOrderId: 2, 
        workOrderNumber: "WO-2025-1001",
        warpingMachineId: 3,
        machineName: "Çözgü Makinesi 001",
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        warpLength: 5000,
        warpDensity: 240,
        totalEnds: 3000,
        yarnType: "Pamuk 30/1",
        status: "Tamamlandı",
        operatorId: 5,
        operatorName: "Ahmet Yılmaz",
        notes: "Standart çözgü hazırlık"
      },
      { 
        id: 2, 
        workOrderId: 4, 
        workOrderNumber: "WO-2025-1002",
        warpingMachineId: 3,
        machineName: "Çözgü Makinesi 001",
        startDate: new Date(),
        endDate: null,
        warpLength: 3000,
        warpDensity: 220,
        totalEnds: 2800,
        yarnType: "Polyester 40/1",
        status: "Devam Ediyor",
        operatorId: 5,
        operatorName: "Ahmet Yılmaz",
        notes: "Özel sipariş için çözgü hazırlığı"
      }
    ]);
  }));

  // Ürün Geliştirme - Dokuma Desenleri API rotası
  app.get("/api/product-development/weave-patterns", isAuthenticated, asyncHandler(async (req, res) => {
    // Dokuma desenleri için örnek veri
    res.json([
      { id: 1, name: "Bezayağı", code: "BP-001", description: "Temel dokuma deseni", createdBy: 1, createdAt: new Date().toISOString() },
      { id: 2, name: "Dimi", code: "BP-002", description: "Diagonal görünümlü dokuma deseni", createdBy: 1, createdAt: new Date().toISOString() },
      { id: 3, name: "Saten", code: "BP-003", description: "Pürüzsüz yüzeyli parlak dokuma deseni", createdBy: 1, createdAt: new Date().toISOString() },
    ]);
  }));

  // Ürün Geliştirme - Kumaş Tasarımları API rotası
  app.get("/api/product-development/fabric-designs", isAuthenticated, asyncHandler(async (req, res) => {
    // Kumaş tasarımları için örnek veri
    res.json([
      { id: 1, name: "Pamuklu Dokuma", code: "FD-001", description: "Pamuk ipliği ile dokunmuş kumaş", weavePatternId: 1, createdBy: 1, createdAt: new Date().toISOString() },
      { id: 2, name: "Polyester Dimi", code: "FD-002", description: "Polyester iplik ile dimi desenli dokuma", weavePatternId: 2, createdBy: 1, createdAt: new Date().toISOString() },
      { id: 3, name: "İpek Saten", code: "FD-003", description: "İpek iplik ile saten desenli dokuma", weavePatternId: 3, createdBy: 1, createdAt: new Date().toISOString() },
    ]);
  }));
  
  // Ürün Geliştirme - Kumaş Tipleri API rotaları
  app.get("/api/product-development/fabric-types", isAuthenticated, asyncHandler(async (req, res) => {
    try {
      const fabrics = await storage.getFabricTypes();
      res.json(fabrics);
    } catch (error) {
      res.status(500).json({ message: "Kumaş tipleri alınırken bir hata oluştu" });
    }
  }));

  app.get("/api/product-development/fabric-types/:id", isAuthenticated, asyncHandler(async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Geçersiz kumaş tipi ID" });
      }
      
      const fabric = await storage.getFabricType(id);
      if (!fabric) {
        return res.status(404).json({ message: "Kumaş tipi bulunamadı" });
      }
      
      res.json(fabric);
    } catch (error) {
      res.status(500).json({ message: "Kumaş tipi alınırken bir hata oluştu" });
    }
  }));

  app.post("/api/product-development/fabric-types", isAuthenticated, asyncHandler(async (req, res) => {
    try {
      const validatedData = insertFabricTypeSchema.parse(req.body);
      const fabric = await storage.createFabricType(validatedData);
      res.status(201).json(fabric);
    } catch (error) {
      res.status(400).json({ message: error.message || "Kumaş tipi eklenirken bir hata oluştu" });
    }
  }));

  app.patch("/api/product-development/fabric-types/:id", isAuthenticated, asyncHandler(async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Geçersiz kumaş tipi ID" });
      }
      
      const validatedData = insertFabricTypeSchema.partial().parse(req.body);
      const updatedFabric = await storage.updateFabricType(id, validatedData);
      
      if (!updatedFabric) {
        return res.status(404).json({ message: "Kumaş tipi bulunamadı" });
      }
      
      res.json(updatedFabric);
    } catch (error) {
      res.status(400).json({ message: error.message || "Kumaş tipi güncellenirken bir hata oluştu" });
    }
  }));

  app.delete("/api/product-development/fabric-types/:id", isAuthenticated, asyncHandler(async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Geçersiz kumaş tipi ID" });
      }
      
      const success = await storage.deleteFabricType(id);
      
      if (!success) {
        return res.status(404).json({ message: "Kumaş tipi bulunamadı" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Kumaş tipi silinirken bir hata oluştu" });
    }
  }));

  // İplik Tipleri API rotası
  app.get("/api/admin/yarn-types", isAuthenticated, asyncHandler(async (req, res) => {
    const yarnTypes = await storage.getYarnTypes();
    res.json(yarnTypes);
  }));
  
  // İplik Depo - Envanter API rotası
  app.get("/api/yarn-warehouse/inventory", isAuthenticated, asyncHandler(async (req, res) => {
    // İplik depo envanteri için örnek veri
    res.json([
      { id: 1, yarnCode: "YRN-001", yarnType: "Pamuk", count: "30/1", color: "Beyaz", quantity: 1500, unit: "kg", locationCode: "A-01-01", status: "Stokta", lastUpdated: new Date().toISOString() },
      { id: 2, yarnCode: "YRN-002", yarnType: "Polyester", count: "40/1", color: "Siyah", quantity: 750, unit: "kg", locationCode: "A-01-02", status: "Stokta", lastUpdated: new Date().toISOString() },
      { id: 3, yarnCode: "YRN-003", yarnType: "Pamuk/Polyester", count: "20/1", color: "Mavi", quantity: 1200, unit: "kg", locationCode: "A-01-03", status: "Stokta", lastUpdated: new Date().toISOString() },
    ]);
  }));
  
  // İplik Depo - Hareketler API rotası
  app.get("/api/yarn-warehouse/movements", isAuthenticated, asyncHandler(async (req, res) => {
    // İplik depo hareketleri için örnek veri
    res.json([
      { id: 1, movementType: "Giriş", yarnCode: "YRN-001", yarnType: "Pamuk", count: "30/1", color: "Beyaz", quantity: 1500, unit: "kg", orderNumber: "ORD-001", date: new Date().toISOString(), user: "Ali Yıldız" },
      { id: 2, movementType: "Çıkış", yarnCode: "YRN-001", yarnType: "Pamuk", count: "30/1", color: "Beyaz", quantity: 300, unit: "kg", orderNumber: "ORD-002", date: new Date().toISOString(), user: "Ali Yıldız" },
      { id: 3, movementType: "Giriş", yarnCode: "YRN-002", yarnType: "Polyester", count: "40/1", color: "Siyah", quantity: 750, unit: "kg", orderNumber: "ORD-003", date: new Date().toISOString(), user: "Mehmet Demir" },
    ]);
  }));
  
  // İplik Depo - Lokasyonlar API rotası
  app.get("/api/yarn-warehouse/locations", isAuthenticated, asyncHandler(async (req, res) => {
    // İplik depo lokasyonları için örnek veri
    res.json([
      { id: 1, code: "A-01-01", name: "A Blok, 1. Koridor, 1. Raf", capacity: 2000, unit: "kg", occupied: 1500, status: "Aktif" },
      { id: 2, code: "A-01-02", name: "A Blok, 1. Koridor, 2. Raf", capacity: 2000, unit: "kg", occupied: 750, status: "Aktif" },
      { id: 3, code: "A-01-03", name: "A Blok, 1. Koridor, 3. Raf", capacity: 2000, unit: "kg", occupied: 1200, status: "Aktif" },
    ]);
  }));
  
  // Tedarikçiler API rotası
  app.get("/api/admin/suppliers", isAuthenticated, asyncHandler(async (req, res) => {
    // Tedarikçiler için örnek veri
    res.json([
      { id: 1, name: "ABC İplik Ltd.", contactPerson: "Ahmet Yılmaz", phone: "0212 444 5566", email: "info@abciplik.com", address: "İstanbul", city: "İstanbul", taxNumber: "1234567891", status: "Aktif" },
      { id: 2, name: "DEF Tekstil A.Ş.", contactPerson: "Mehmet Kaya", phone: "0216 333 2211", email: "info@deftekstil.com", address: "İstanbul", city: "İstanbul", taxNumber: "9876543210", status: "Aktif" },
      { id: 3, name: "GHI İplik San. Ltd.", contactPerson: "Ayşe Demir", phone: "0224 222 1100", email: "info@ghiiplik.com", address: "Bursa", city: "Bursa", taxNumber: "5678901234", status: "Aktif" },
    ]);
  }));

  // Ham Kalite Kontrol - Muayeneler API rotası
  app.get("/api/raw-quality/inspections", isAuthenticated, asyncHandler(async (req, res) => {
    // Ham kumaş kalite kontrol muayeneleri için örnek veri
    res.json([
      { id: 1, inspectionCode: "INS-001", date: new Date().toISOString(), fabricType: "Pamuklu Dokuma", batchNumber: "B001", width: "150 cm", gramPerMeter: "120", defectCount: 2, grade: "A", status: "Tamamlandı", inspector: "Ali Yılmaz", createdBy: 1, createdAt: new Date().toISOString() },
      { id: 2, inspectionCode: "INS-002", date: new Date().toISOString(), fabricType: "Polyester Dimi", batchNumber: "B002", width: "140 cm", gramPerMeter: "180", defectCount: 5, grade: "B", status: "Tamamlandı", inspector: "Ayşe Demir", createdBy: 1, createdAt: new Date().toISOString() },
      { id: 3, inspectionCode: "INS-003", date: new Date().toISOString(), fabricType: "İpek Saten", batchNumber: "B003", width: "120 cm", gramPerMeter: "90", defectCount: 0, grade: "A+", status: "Tamamlandı", inspector: "Mehmet Kaya", createdBy: 1, createdAt: new Date().toISOString() },
    ]);
  }));
  
  // Kalite Kontrol - Final Muayeneler API rotası
  app.get("/api/quality-control/inspections", isAuthenticated, asyncHandler(async (req, res) => {
    // Kalite kontrol muayeneleri için örnek veri
    res.json([
      { id: 1, inspectionCode: "QC-001", date: new Date().toISOString(), fabricType: "Pamuklu Dokuma", batchNumber: "B001", orderNumber: "ORD-001", width: "150 cm", gramPerMeter: "120", defectCount: 1, grade: "A", status: "Tamamlandı", inspector: "Ayşe Kaya", notes: "Müşteri şartnamelerine uygun", createdBy: 5, createdAt: new Date().toISOString() },
      { id: 2, inspectionCode: "QC-002", date: new Date().toISOString(), fabricType: "Polyester Dimi", batchNumber: "B002", orderNumber: "ORD-002", width: "140 cm", gramPerMeter: "180", defectCount: 3, grade: "B", status: "Tamamlandı", inspector: "Ayşe Kaya", notes: "Minor renk farklılıkları var", createdBy: 5, createdAt: new Date().toISOString() },
      { id: 3, inspectionCode: "QC-003", date: new Date().toISOString(), fabricType: "İpek Saten", batchNumber: "B003", orderNumber: "ORD-003", width: "120 cm", gramPerMeter: "90", defectCount: 0, grade: "A+", status: "Tamamlandı", inspector: "Ayşe Kaya", notes: "Mükemmel kalite", createdBy: 5, createdAt: new Date().toISOString() },
    ]);
  }));
  
  // Kalite Kontrol - Kusur Tipleri API rotası
  app.get("/api/quality-control/defect-types", isAuthenticated, asyncHandler(async (req, res) => {
    // Kalite kontrol kusur tipleri için örnek veri
    res.json([
      { id: 1, code: "DEF-001", name: "İplik Kopması", severity: "Yüksek", description: "Kumaşta atkı veya çözgü ipliklerinin kopması", department: "Dokuma", createdBy: 1, createdAt: new Date().toISOString() },
      { id: 2, code: "DEF-002", name: "Leke", severity: "Orta", description: "Kumaş üzerinde yağ veya diğer maddelerden kaynaklanan lekeler", department: "Terbiye", createdBy: 1, createdAt: new Date().toISOString() },
      { id: 3, code: "DEF-003", name: "Renk Farklılığı", severity: "Düşük", description: "Aynı parti içinde renk tonu farklılıkları", department: "Boyama", createdBy: 1, createdAt: new Date().toISOString() },
      { id: 4, code: "DEF-004", name: "Desen Hatası", severity: "Yüksek", description: "Dokuma deseni hataları veya uyumsuzlukları", department: "Dokuma", createdBy: 1, createdAt: new Date().toISOString() },
      { id: 5, code: "DEF-005", name: "Dokuma Sıklığı Hatası", severity: "Orta", description: "Cm başına düşen iplik sayısında sapmalar", department: "Dokuma", createdBy: 1, createdAt: new Date().toISOString() },
    ]);
  }));
  
  // Kalite Kontrol - Kalite Kontrolcüler API rotası
  app.get("/api/quality-control/inspectors", isAuthenticated, asyncHandler(async (req, res) => {
    // Kalite kontrolcüler için örnek veri
    res.json([
      { id: 1, name: "Ayşe Kaya", code: "INS-AK", department: "Kalite Kontrol", experience: "5 yıl", certification: "ISO 9001 Denetçi", status: "Aktif", email: "ayse.kaya@tekstil.com", phone: "0500 111 22 33" },
      { id: 2, name: "Mehmet Demir", code: "INS-MD", department: "Ham Kalite Kontrol", experience: "3 yıl", certification: "Tekstil Kalite Kontrolü", status: "Aktif", email: "mehmet.demir@tekstil.com", phone: "0500 222 33 44" },
      { id: 3, name: "Zeynep Yıldız", code: "INS-ZY", department: "Kalite Kontrol", experience: "7 yıl", certification: "ISO 9001 Baş Denetçi", status: "Aktif", email: "zeynep.yildiz@tekstil.com", phone: "0500 333 44 55" },
    ]);
  }));
  
  // Kalite Kontrol - Sorunlar API rotası
  app.get("/api/quality-control/issues", isAuthenticated, asyncHandler(async (req, res) => {
    // Kalite kontrol sorunları için örnek veri
    res.json([
      { id: 1, issueCode: "QCI-001", title: "Leke Sorunu", description: "B002 nolu partide yaygın leke sorunu tespit edildi", status: "Açık", priority: "Yüksek", assignedTo: "Ayşe Kaya", reportedBy: "Mehmet Demir", reportDate: new Date().toISOString(), batchNumber: "B002", orderNumber: "ORD-002", resolution: "", closedDate: null },
      { id: 2, issueCode: "QCI-002", title: "Gramaj Tutarsızlığı", description: "B001 nolu partide gramaj tutarsızlığı var", status: "Çözüldü", priority: "Orta", assignedTo: "Zeynep Yıldız", reportedBy: "Ayşe Kaya", reportDate: new Date(Date.now() - 7*24*60*60*1000).toISOString(), batchNumber: "B001", orderNumber: "ORD-001", resolution: "Terbiye bölümünde düzeltildi", closedDate: new Date().toISOString() },
      { id: 3, issueCode: "QCI-003", title: "Renk Sapması", description: "B003 nolu partide renk sapması tespit edildi", status: "Analiz Ediliyor", priority: "Düşük", assignedTo: "Mehmet Demir", reportedBy: "Zeynep Yıldız", reportDate: new Date(Date.now() - 3*24*60*60*1000).toISOString(), batchNumber: "B003", orderNumber: "ORD-003", resolution: "", closedDate: null },
    ]);
  }));
  
  // Ürünler API rotası
  app.get("/api/admin/products", isAuthenticated, asyncHandler(async (req, res) => {
    // Ürünler için örnek veri
    res.json([
      { id: 1, code: "PRD-001", name: "Pamuklu Dokuma Kumaş", description: "100% pamuk, beyaz", category: "Dokuma Kumaş", status: "Aktif", fabricTypeId: 1, unitPrice: "15.50", unit: "metre", minimumOrder: "100", notes: "" },
      { id: 2, code: "PRD-002", name: "Polyester Dimi Kumaş", description: "100% polyester, siyah", category: "Dokuma Kumaş", status: "Aktif", fabricTypeId: 2, unitPrice: "12.75", unit: "metre", minimumOrder: "100", notes: "" },
      { id: 3, code: "PRD-003", name: "İpek Saten Kumaş", description: "100% ipek, krem", category: "Dokuma Kumaş", status: "Aktif", fabricTypeId: 3, unitPrice: "45.00", unit: "metre", minimumOrder: "50", notes: "Premium kalite" },
    ]);
  }));
  
  // Kalite Kontrol - Metrikler API rotası
  app.get("/api/quality-control/metrics", isAuthenticated, asyncHandler(async (req, res) => {
    // Kalite kontrol metrikleri için örnek veri
    res.json({
      defectRate: 2.5,
      passRate: 97.5,
      averageDefectsPerBatch: 3.2,
      topDefects: [
        { type: "İplik Kopması", count: 15, percentage: 25 },
        { type: "Leke", count: 12, percentage: 20 },
        { type: "Renk Farklılığı", count: 10, percentage: 16.7 },
        { type: "Desen Hatası", count: 8, percentage: 13.3 },
        { type: "Dokuma Sıklığı Hatası", count: 5, percentage: 8.3 }
      ],
      inspectionCompletionRate: 94.8,
      averageInspectionTime: 45, // dakika
      openIssues: 5,
      closedIssues: 12,
      criticalDefects: 2
    });
  }));
  
  // Kalite Kontrol - Trendler API rotası
  app.get("/api/quality-control/trends", isAuthenticated, asyncHandler(async (req, res) => {
    // Kalite kontrol trendleri için örnek veri
    res.json({
      defectRateByMonth: [
        { month: "Ocak", rate: 3.2 },
        { month: "Şubat", rate: 2.8 },
        { month: "Mart", rate: 2.5 },
        { month: "Nisan", rate: 2.2 },
        { month: "Mayıs", rate: 2.0 },
        { month: "Haziran", rate: 1.8 }
      ],
      defectsByType: [
        { type: "İplik Kopması", counts: [18, 16, 15, 14, 13, 12] },
        { type: "Leke", counts: [14, 13, 12, 11, 10, 9] },
        { type: "Renk Farklılığı", counts: [12, 11, 10, 10, 9, 8] },
        { type: "Desen Hatası", counts: [10, 9, 8, 7, 6, 5] },
        { type: "Dokuma Sıklığı Hatası", counts: [8, 7, 6, 5, 5, 4] }
      ],
      inspectionCountByMonth: [
        { month: "Ocak", count: 120 },
        { month: "Şubat", count: 132 },
        { month: "Mart", count: 145 },
        { month: "Nisan", count: 150 },
        { month: "Mayıs", count: 165 },
        { month: "Haziran", count: 170 }
      ],
      issueResolutionTime: [
        { month: "Ocak", days: 4.5 },
        { month: "Şubat", days: 4.2 },
        { month: "Mart", days: 3.8 },
        { month: "Nisan", days: 3.5 },
        { month: "Mayıs", days: 3.2 },
        { month: "Haziran", days: 3.0 }
      ]
    });
  }));
  
  // Kalite Kontrol - Raporlar API rotası
  app.get("/api/quality-control/reports", isAuthenticated, asyncHandler(async (req, res) => {
    // Kalite kontrol raporları için örnek veri
    res.json([
      { id: 1, name: "Haziran 2023 Kalite Raporu", description: "Haziran 2023 için aylık kalite performans raporu", type: "Aylık Rapor", createdBy: "Ayşe Kaya", createdAt: new Date(Date.now() - 30*24*60*60*1000).toISOString(), status: "Onaylandı", url: "/reports/quality-june-2023.pdf" },
      { id: 2, name: "İkinci Çeyrek 2023 Kalite Raporu", description: "2023 ikinci çeyrek için kalite performans raporu", type: "Çeyreklik Rapor", createdBy: "Zeynep Yıldız", createdAt: new Date(Date.now() - 15*24*60*60*1000).toISOString(), status: "Onaylandı", url: "/reports/quality-q2-2023.pdf" },
      { id: 3, name: "Dokuma Departmanı Hata Analizi", description: "Dokuma departmanındaki hata tipleri ve oranları analizi", type: "Özel Rapor", createdBy: "Mehmet Demir", createdAt: new Date(Date.now() - 7*24*60*60*1000).toISOString(), status: "Taslak", url: "/reports/weaving-defect-analysis.pdf" }
    ]);
  }));
  
  // İplik Eğirme - İş Emirleri API rotası
  app.get("/api/yarn-spinning/work-orders", isAuthenticated, asyncHandler(async (req, res) => {
    // İplik eğirme iş emirleri için örnek veri
    res.json([
      { id: 1, orderCode: "YS-001", orderDate: new Date().toISOString(), customer: "ABC Tekstil Ltd.", status: "Devam Ediyor", yarnType: "Pamuk 30/1", quantity: "2000 kg", dueDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(), assignedTo: "Alican", priority: "Yüksek", notes: "Özel sipariş" },
      { id: 2, orderCode: "YS-002", orderDate: new Date(Date.now() - 3*24*60*60*1000).toISOString(), customer: "Moda Tekstil A.Ş.", status: "Tamamlandı", yarnType: "Polyester 40/1", quantity: "1500 kg", dueDate: new Date(Date.now() + 2*24*60*60*1000).toISOString(), assignedTo: "Mehmet", priority: "Normal", notes: "" },
      { id: 3, orderCode: "YS-003", orderDate: new Date(Date.now() - 1*24*60*60*1000).toISOString(), customer: "XYZ Kumaş Ltd.", status: "Beklemede", yarnType: "Pamuk/Polyester 20/1", quantity: "3000 kg", dueDate: new Date(Date.now() + 10*24*60*60*1000).toISOString(), assignedTo: "Alican", priority: "Düşük", notes: "Ham madde bekleniyor" },
    ]);
  }));
  
  // İplik Eğirme - Makineler API rotası
  app.get("/api/yarn-spinning/machines", isAuthenticated, asyncHandler(async (req, res) => {
    // İplik eğirme makineleri için örnek veri
    res.json([
      { id: 1, code: "SPM-001", name: "Ring İplik Makinesi 1", brand: "Rieter", model: "G 38", installationDate: "2020-01-15", capacity: "500 kg/gün", status: "Çalışıyor", lastMaintenance: new Date(Date.now() - 15*24*60*60*1000).toISOString(), nextMaintenance: new Date(Date.now() + 15*24*60*60*1000).toISOString(), location: "İplik Üretim Alanı A" },
      { id: 2, code: "SPM-002", name: "Ring İplik Makinesi 2", brand: "Rieter", model: "G 38", installationDate: "2020-01-15", capacity: "500 kg/gün", status: "Bakımda", lastMaintenance: new Date(Date.now() - 2*24*60*60*1000).toISOString(), nextMaintenance: new Date(Date.now() + 28*24*60*60*1000).toISOString(), location: "İplik Üretim Alanı A" },
      { id: 3, code: "SPM-003", name: "Open End İplik Makinesi", brand: "Schlafhorst", model: "Autocoro 9", installationDate: "2021-03-10", capacity: "750 kg/gün", status: "Çalışıyor", lastMaintenance: new Date(Date.now() - 10*24*60*60*1000).toISOString(), nextMaintenance: new Date(Date.now() + 20*24*60*60*1000).toISOString(), location: "İplik Üretim Alanı B" },
    ]);
  }));
  
  // Numune - İstekler API rotası
  app.get("/api/samples/requests", isAuthenticated, asyncHandler(async (req, res) => {
    // Numune istekleri için örnek veri
    res.json([
      { id: 1, requestCode: "SR-001", requestDate: new Date(Date.now() - 5*24*60*60*1000).toISOString(), customer: "ABC Tekstil Ltd.", sampleType: "Dokuma Kumaş", fabricType: "Pamuklu Dokuma", color: "Beyaz", width: "150 cm", quantity: "2 metre", status: "Tamamlandı", dueDate: new Date(Date.now() - 1*24*60*60*1000).toISOString(), requestedBy: "Ahmet Yılmaz", assignedTo: "Mehmet Demir", notes: "Müşteri şartnamesine uygun olmalı" },
      { id: 2, requestCode: "SR-002", requestDate: new Date(Date.now() - 3*24*60*60*1000).toISOString(), customer: "Moda Tekstil A.Ş.", sampleType: "İplik", fabricType: null, color: "Siyah", width: null, quantity: "250 gram", status: "Hazırlanıyor", dueDate: new Date(Date.now() + 2*24*60*60*1000).toISOString(), requestedBy: "Ayşe Demir", assignedTo: "Ali Kaya", notes: "30/1 Ne pamuk ipliği" },
      { id: 3, requestCode: "SR-003", requestDate: new Date().toISOString(), customer: "XYZ Kumaş Ltd.", sampleType: "Dokuma Kumaş", fabricType: "Polyester Dimi", color: "Lacivert", width: "140 cm", quantity: "3 metre", status: "Beklemede", dueDate: new Date(Date.now() + 5*24*60*60*1000).toISOString(), requestedBy: "Mehmet Kaya", assignedTo: "Zeynep Yıldız", notes: "Özel desen uygulanacak" },
    ]);
  }));
  
  // Numune - Takip API rotası
  app.get("/api/samples/tracking", isAuthenticated, asyncHandler(async (req, res) => {
    // Numune takip için örnek veri
    res.json([
      { id: 1, sampleCode: "S-001", requestCode: "SR-001", createdDate: new Date(Date.now() - 4*24*60*60*1000).toISOString(), currentStatus: "Tamamlandı", currentDepartment: "Numune", statusHistory: [
        { status: "Başlatıldı", department: "Numune", date: new Date(Date.now() - 4*24*60*60*1000).toISOString(), notes: "Numune talebi onaylandı", updatedBy: "Mehmet Demir" },
        { status: "Üretimde", department: "Dokuma", date: new Date(Date.now() - 3*24*60*60*1000).toISOString(), notes: "Dokuma işlemi başladı", updatedBy: "Ali Yıldız" },
        { status: "Tamamlandı", department: "Numune", date: new Date(Date.now() - 1*24*60*60*1000).toISOString(), notes: "Numune tamamlandı ve müşteriye gönderildi", updatedBy: "Mehmet Demir" },
      ]},
      { id: 2, sampleCode: "S-002", requestCode: "SR-002", createdDate: new Date(Date.now() - 2*24*60*60*1000).toISOString(), currentStatus: "Hazırlanıyor", currentDepartment: "İplik Büküm", statusHistory: [
        { status: "Başlatıldı", department: "Numune", date: new Date(Date.now() - 2*24*60*60*1000).toISOString(), notes: "Numune talebi onaylandı", updatedBy: "Ali Kaya" },
        { status: "Hazırlanıyor", department: "İplik Büküm", date: new Date(Date.now() - 1*24*60*60*1000).toISOString(), notes: "İplik eğirme işlemi devam ediyor", updatedBy: "Mehmet Demir" },
      ]},
      { id: 3, sampleCode: "S-003", requestCode: "SR-003", createdDate: new Date().toISOString(), currentStatus: "Beklemede", currentDepartment: "Numune", statusHistory: [
        { status: "Başlatıldı", department: "Numune", date: new Date().toISOString(), notes: "Numune talebi onaylandı, hammadde bekleniyor", updatedBy: "Zeynep Yıldız" },
        { status: "Beklemede", department: "Numune", date: new Date().toISOString(), notes: "Hammadde tedarik edilecek", updatedBy: "Zeynep Yıldız" },
      ]},
    ]);
  }));
  
  // Laboratuvar - İplik Testleri API rotası
  app.get("/api/laboratory/yarn-tests", isAuthenticated, asyncHandler(async (req, res) => {
    // İplik testleri için örnek veri
    res.json([
      { id: 1, testCode: "YT-001", testDate: new Date(Date.now() - 5*24*60*60*1000).toISOString(), yarnType: "Pamuk 30/1", batchNumber: "B001", count: "30.2 Ne", csp: "2150", uster: "B%", elongation: "6.2%", strength: "15.8 cN/tex", hairiness: "5.8", status: "Tamamlandı", result: "Geçti", tester: "Ayşe Kaya", notes: "Müşteri şartnamelerine uygun" },
      { id: 2, testCode: "YT-002", testDate: new Date(Date.now() - 2*24*60*60*1000).toISOString(), yarnType: "Polyester 40/1", batchNumber: "B002", count: "39.8 Ne", csp: "2450", uster: "A%", elongation: "12.5%", strength: "35.2 cN/tex", hairiness: "4.2", status: "Tamamlandı", result: "Geçti", tester: "Mehmet Demir", notes: "Mükemmel test sonuçları" },
      { id: 3, testCode: "YT-003", testDate: new Date().toISOString(), yarnType: "Pamuk/Polyester 20/1", batchNumber: "B003", count: "20.3 Ne", csp: "1980", uster: "C%", elongation: "8.4%", strength: "18.6 cN/tex", hairiness: "6.3", status: "Devam Ediyor", result: "", tester: "Zeynep Yıldız", notes: "Uzama değeri şartname dışında, tekrar test edilecek" },
    ]);
  }));
  
  // Laboratuvar - Kumaş Testleri API rotası
  app.get("/api/laboratory/fabric-tests", isAuthenticated, asyncHandler(async (req, res) => {
    // Kumaş testleri için örnek veri
    res.json([
      { id: 1, testCode: "FT-001", testDate: new Date(Date.now() - 6*24*60*60*1000).toISOString(), fabricType: "Pamuklu Dokuma", batchNumber: "B001", width: "150 cm", weight: "120 g/m²", tensileStrength: "Çözgü: 1450 N, Atkı: 980 N", tearStrength: "Çözgü: 65 N, Atkı: 45 N", abrasionResistance: "25,000 devir", colorFastness: "Yıkama: 4-5, Işık: 4", shrinkage: "Çözgü: 2.1%, Atkı: 1.8%", status: "Tamamlandı", result: "Geçti", tester: "Ayşe Kaya", notes: "Müşteri şartnamelerine uygun" },
      { id: 2, testCode: "FT-002", testDate: new Date(Date.now() - 3*24*60*60*1000).toISOString(), fabricType: "Polyester Dimi", batchNumber: "B002", width: "140 cm", weight: "180 g/m²", tensileStrength: "Çözgü: 1850 N, Atkı: 1250 N", tearStrength: "Çözgü: 85 N, Atkı: 60 N", abrasionResistance: "40,000 devir", colorFastness: "Yıkama: 4, Işık: 4-5", shrinkage: "Çözgü: 0.8%, Atkı: 0.6%", status: "Tamamlandı", result: "Geçti", tester: "Mehmet Demir", notes: "Yüksek dayanımlı" },
      { id: 3, testCode: "FT-003", testDate: new Date().toISOString(), fabricType: "İpek Saten", batchNumber: "B003", width: "120 cm", weight: "90 g/m²", tensileStrength: "Çözgü: 850 N, Atkı: 650 N", tearStrength: "Çözgü: 35 N, Atkı: 28 N", abrasionResistance: "15,000 devir", colorFastness: "Yıkama: 3-4, Işık: 3", shrinkage: "Çözgü: 3.2%, Atkı: 2.5%", status: "Devam Ediyor", result: "", tester: "Zeynep Yıldız", notes: "Renk haslığı şartname dışında, tekrar test edilecek" },
    ]);
  }));
  
  // İplik Depo - Metrikler API rotası
  app.get("/api/yarn-warehouse/metrics", isAuthenticated, asyncHandler(async (req, res) => {
    // İplik depo metrikleri için örnek veri
    res.json({
      totalInventory: 22500, // kg
      activeLocations: 18,
      utilizationRate: 76.4, // %
      inventoryByYarnType: [
        { type: "Pamuk", quantity: 12000, percentage: 53.3 },
        { type: "Polyester", quantity: 6500, percentage: 28.9 },
        { type: "Pamuk/Polyester", quantity: 3000, percentage: 13.3 },
        { type: "Elastan", quantity: 1000, percentage: 4.5 }
      ],
      recentMovements: {
        inbound: 4500,
        outbound: 3200,
        adjustments: 150
      },
      stockAlerts: 3,
      pendingDeliveries: 2
    });
  }));
  
  // Planlama Bölümü - Üretim Refakat Kartları API
  // Tüm refakat kartlarını getir
  app.get("/api/planning/production-cards", isAuthenticated, asyncHandler(async (req, res) => {
    const { orderId, status, currentDepartmentId } = req.query;
    
    const filters: any = {};
    if (orderId) filters.orderId = parseInt(String(orderId));
    if (status) filters.status = String(status);
    if (currentDepartmentId) filters.currentDepartmentId = parseInt(String(currentDepartmentId));
    
    const cards = await storage.getProductionCards(filters);
    res.json(cards);
  }));
  
  // Belirli bir refakat kartını getir
  app.get("/api/planning/production-cards/:id", isAuthenticated, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new Error("Geçersiz refakat kartı ID'si");
    }
    
    const card = await storage.getProductionCardById(id);
    if (!card) {
      res.status(404).json({ message: "Refakat kartı bulunamadı" });
      return;
    }
    
    res.json(card);
  }));
  
  // Yeni bir refakat kartı oluştur
  app.post("/api/planning/production-cards", isAuthenticated, asyncHandler(async (req, res) => {
    const validatedData = insertProductionCardSchema.parse({
      ...req.body,
      createdById: req.user.id
    });
    
    // Kart numarası oluşturma (CARD-12345 formatında)
    if (!validatedData.cardNumber) {
      const date = new Date();
      const randomPart = Math.floor(10000 + Math.random() * 90000);
      validatedData.cardNumber = `CARD-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${randomPart}`;
    }
    
    const card = await storage.createProductionCard(validatedData);
    res.status(201).json(card);
  }));
  
  // Refakat kartı durumunu güncelle
  app.patch("/api/planning/production-cards/:id/status", isAuthenticated, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new Error("Geçersiz refakat kartı ID'si");
    }
    
    const { status, currentDepartmentId, currentProcessTypeId } = req.body;
    if (!status) {
      throw new Error("Durum bilgisi (status) gereklidir");
    }
    
    const updateData: any = {
      status,
      lastUpdatedById: req.user.id
    };
    
    if (currentDepartmentId) updateData.currentDepartmentId = currentDepartmentId;
    if (currentProcessTypeId) updateData.currentProcessTypeId = currentProcessTypeId;
    
    const card = await storage.updateProductionCardStatus(id, updateData);
    res.json(card);
  }));
  
  // Refakat kartı yazdırma sayacını güncelle
  app.post("/api/planning/production-cards/:id/print", isAuthenticated, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new Error("Geçersiz refakat kartı ID'si");
    }
    
    const card = await storage.incrementProductionCardPrintCount(id);
    res.json(card);
  }));
  
  // Proses Takip Olayları API
  // Belirli bir refakat kartına ait tüm takip olaylarını getir
  app.get("/api/tracking/events/:cardId", isAuthenticated, asyncHandler(async (req, res) => {
    const cardId = parseInt(req.params.cardId);
    if (isNaN(cardId)) {
      throw new Error("Geçersiz refakat kartı ID'si");
    }
    
    const events = await storage.getTrackingEventsByCardId(cardId);
    res.json(events);
  }));
  
  // Yeni bir takip olayı oluştur (giriş veya çıkış kaydı)
  app.post("/api/tracking/events", isAuthenticated, asyncHandler(async (req, res) => {
    const validatedData = insertTrackingEventSchema.parse({
      ...req.body,
      operatorId: req.user.id
    });
    
    // Barkod verilerini kontrol et
    if (validatedData.scannedBarcodeData) {
      // Barkod varlığını ve geçerliliğini kontrol et
      const card = await storage.getProductionCardByBarcode(validatedData.scannedBarcodeData);
      if (!card) {
        throw new Error("Geçersiz barkod verisi: Eşleşen refakat kartı bulunamadı");
      }
      validatedData.cardId = card.id;
    }
    
    const event = await storage.createTrackingEvent(validatedData);
    
    // Refakat kartının durumunu güncelle
    if (event) {
      const updateData: any = {
        currentDepartmentId: validatedData.departmentId,
        currentProcessTypeId: validatedData.processTypeId,
        lastUpdatedById: req.user.id
      };
      
      if (validatedData.eventType === "process_in") {
        updateData.status = "in-progress";
      } else if (validatedData.eventType === "process_out") {
        // Sonraki departmana gönderildiğini varsayalım
        updateData.status = "completed";
      } else if (validatedData.eventType === "quality_check") {
        updateData.status = validatedData.status === "ok" ? "completed" : "rejected";
      }
      
      await storage.updateProductionCardStatus(validatedData.cardId, updateData);
    }
    
    res.status(201).json(event);
  }));
  
  // İstatistik ve özet veriler
  app.get("/api/tracking/summary", isAuthenticated, asyncHandler(async (req, res) => {
    const summary = await storage.getTrackingSummary();
    res.json(summary);
  }));
  
  // Refakat Kartları ile ilgili API'ler
  app.get("/api/planning/production-cards", isAuthenticated, hasPermission('planning_view'), asyncHandler(async (req, res) => {
    const orderId = req.query.orderId ? parseInt(req.query.orderId.toString()) : undefined;
    const status = req.query.status?.toString();
    const departmentId = req.query.departmentId ? parseInt(req.query.departmentId.toString()) : undefined;
    
    const filters = {
      ...(orderId && { orderId }),
      ...(status && { status }),
      ...(departmentId && { currentDepartmentId: departmentId })
    };
    
    const cards = await storage.getProductionCards(filters);
    res.json(cards);
  }));
  
  app.get("/api/planning/production-cards/:id", isAuthenticated, hasPermission('planning_view'), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const card = await storage.getProductionCardById(id);
    
    if (!card) {
      return res.status(404).json({ error: "Refakat kartı bulunamadı" });
    }
    
    res.json(card);
  }));
  
  app.get("/api/planning/production-cards/barcode/:barcodeData", isAuthenticated, asyncHandler(async (req, res) => {
    const barcodeData = req.params.barcodeData;
    const card = await storage.getProductionCardByBarcode(barcodeData);
    
    if (!card) {
      return res.status(404).json({ error: "Barkod ile eşleşen refakat kartı bulunamadı" });
    }
    
    res.json(card);
  }));
  
  app.post("/api/planning/production-cards", isAuthenticated, hasPermission('planning_edit'), asyncHandler(async (req, res) => {
    const cardData = req.body;
    
    // CreatedBy alanını ekle
    if (req.user) {
      cardData.createdBy = req.user.id;
    }
    
    const newCard = await storage.createProductionCard(cardData);
    res.status(201).json(newCard);
  }));
  
  app.patch("/api/planning/production-cards/:id", isAuthenticated, hasPermission('planning_edit'), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updateData = req.body;
    
    const updatedCard = await storage.updateProductionCardStatus(id, updateData);
    
    if (!updatedCard) {
      return res.status(404).json({ error: "Refakat kartı bulunamadı" });
    }
    
    res.json(updatedCard);
  }));
  
  app.post("/api/planning/production-cards/:id/print", isAuthenticated, hasPermission('planning_view'), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updatedCard = await storage.incrementProductionCardPrintCount(id);
    
    if (!updatedCard) {
      return res.status(404).json({ error: "Refakat kartı bulunamadı" });
    }
    
    res.json(updatedCard);
  }));
  
  // İzleme Olayları ile ilgili API'ler
  app.get("/api/planning/tracking-events/:cardId", isAuthenticated, hasPermission('planning_view'), asyncHandler(async (req, res) => {
    const cardId = parseInt(req.params.cardId);
    const events = await storage.getTrackingEventsByCardId(cardId);
    res.json(events);
  }));
  
  app.post("/api/tracking-events", isAuthenticated, asyncHandler(async (req, res) => {
    const eventData = req.body;
    
    // CreatedBy alanını ekle
    if (req.user) {
      eventData.createdBy = req.user.id;
    }
    
    const newEvent = await storage.createTrackingEvent(eventData);
    res.status(201).json(newEvent);
  }));
  
  app.get("/api/planning/tracking-summary", isAuthenticated, hasPermission('planning_view'), asyncHandler(async (req, res) => {
    const summary = await storage.getTrackingSummary();
    res.json(summary);
  }));

  // DEPO VE STOK MODÜLÜ API ROTALARI
  
  // Kumaş Depo - Envanter API rotası
  app.get("/api/warehouse/inventory", isAuthenticated, hasPermission('warehouse:view_inventory'), asyncHandler(async (req, res) => {
    // Depo envanteri için gerçek veri
    const inventoryItems = await storage.getInventoryItems({ 
      itemType: req.query.itemType?.toString() || undefined 
    });
    res.json(inventoryItems);
  }));

  // Kumaş Depo - Envanter detayları
  app.get("/api/warehouse/inventory/:id", isAuthenticated, hasPermission('warehouse:view_inventory'), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const item = await storage.getInventoryItemById(id);
    
    if (!item) {
      return res.status(404).json({ error: "Envanter öğesi bulunamadı" });
    }
    
    res.json(item);
  }));

  // Kumaş Depo - Yeni envanter öğesi ekle
  app.post("/api/warehouse/inventory", isAuthenticated, hasPermission('warehouse:manage_inventory'), asyncHandler(async (req, res) => {
    const inventoryData = req.body;
    
    // CreatedBy alanını ekle
    if (req.user) {
      inventoryData.createdBy = req.user.id;
    }
    
    const newInventoryItem = await storage.createInventoryItem(inventoryData);
    res.status(201).json(newInventoryItem);
  }));

  // Kumaş Depo - Envanter öğesi güncelle
  
  // =====================================
  // Kartela API Routes
  // =====================================
  app.use('/api/kartelas', isAuthenticated, kartelaRouter);
  
  // Kartela Öğeleri API
  app.get('/api/kartela-items', isAuthenticated, asyncHandler(async (req, res) => {
    try {
      const items = await db.select().from(kartelaItems).orderBy(desc(kartelaItems.createdAt));
      res.json(items);
    } catch (error) {
      console.error("Kartela öğeleri listeme hatası:", error);
      res.status(500).json({ error: "Kartela öğeleri listelenirken bir hata oluştu" });
    }
  }));
  app.patch("/api/warehouse/inventory/:id", isAuthenticated, hasPermission('warehouse:manage_inventory'), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updateData = req.body;
    
    const updatedItem = await storage.updateInventoryItem(id, updateData);
    
    if (!updatedItem) {
      return res.status(404).json({ error: "Envanter öğesi bulunamadı" });
    }
    
    res.json(updatedItem);
  }));

  // Kumaş Depo - Stok Hareketleri API rotası
  app.get("/api/warehouse/transactions", isAuthenticated, hasPermission('warehouse:view_inventory'), asyncHandler(async (req, res) => {
    const transactions = await storage.getInventoryTransactions({
      transactionType: req.query.type?.toString() || undefined,
      itemType: req.query.itemType?.toString() || undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate.toString()) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate.toString()) : undefined
    });
    res.json(transactions);
  }));

  // Kumaş Depo - Hareket detayları
  app.get("/api/warehouse/transactions/:id", isAuthenticated, hasPermission('warehouse:view_inventory'), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const transaction = await storage.getInventoryTransactionById(id);
    
    if (!transaction) {
      return res.status(404).json({ error: "Stok hareketi bulunamadı" });
    }
    
    res.json(transaction);
  }));

  // Kumaş Depo - Yeni stok hareketi ekle
  app.post("/api/warehouse/transactions", isAuthenticated, hasPermission('warehouse:manage_inventory'), asyncHandler(async (req, res) => {
    const transactionData = req.body;
    
    // CreatedBy alanını ekle
    if (req.user) {
      transactionData.createdBy = req.user.id;
    }
    
    const newTransaction = await storage.createInventoryTransaction(transactionData);
    
    // Depo yöneticileri ve ilgili departman kullanıcılarına bildirim gönder
    try {
      if (req.user && sendNotificationToUser) {
        // Depo departmanı (id=4) kullanıcılarını bul
        const warehouseDeptId = 4; // Depo departman ID'si
        const warehouseUsers = await storage.getUsersByDepartmentId(warehouseDeptId);
        
        // İlgili departman kullanıcılarını bul (örneğin, işlem tipine göre)
        let relatedDepts = [1]; // Admin her zaman bildirim alsın
        
        // İşlem tipine göre ilgili departmanları belirle
        if (transactionData.transactionType === 'entry') {
          relatedDepts.push(2); // Satış departmanı
        } else if (transactionData.transactionType === 'exit') {
          relatedDepts.push(3); // Üretim departmanı
        } else if (transactionData.transactionType === 'transfer') {
          relatedDepts.push(10); // Planlama departmanı
        }
        
        // Tüm bildirim alması gereken kullanıcıları topla
        const allNotificationUsers = [...warehouseUsers];
        
        for (const deptId of relatedDepts) {
          const deptUsers = await storage.getUsersByDepartmentId(deptId);
          if (deptUsers && deptUsers.length > 0) {
            allNotificationUsers.push(...deptUsers);
          }
        }
        
        // Benzersiz kullanıcıları filtrele
        const uniqueUsers = allNotificationUsers.filter((user, index, self) => 
          index === self.findIndex(u => u.id === user.id)
        );
        
        // İşlem tipine göre bildirim başlığını belirle
        let title = "Yeni Stok Hareketi";
        let content = `${transactionData.quantity} ${transactionData.unit} ${transactionData.itemName || 'ürün'} `;
        
        if (transactionData.transactionType === 'entry') {
          title = "Stok Girişi Yapıldı";
          content += `stok girişi ${req.user.fullName} tarafından yapıldı.`;
        } else if (transactionData.transactionType === 'exit') {
          title = "Stok Çıkışı Yapıldı";
          content += `stok çıkışı ${req.user.fullName} tarafından yapıldı.`;
        } else if (transactionData.transactionType === 'transfer') {
          title = "Stok Transferi Yapıldı";
          content += `stok transferi ${req.user.fullName} tarafından yapıldı.`;
        } else {
          content += `stok hareketi ${req.user.fullName} tarafından oluşturuldu.`;
        }
        
        // Bildirim gönder
        for (const user of uniqueUsers) {
          // İşlemi yapan kullanıcı dışındakilere bildirim gönder
          if (user.id !== req.user.id) {
            await sendNotificationToUser(user.id, {
              title: title,
              content: content,
              type: "warehouse",
              entityId: newTransaction.id,
              entityType: "inventory_transaction"
            });
          }
        }
        
        console.log(`Stok hareketi bildirimi gönderildi - ${transactionData.itemName || 'Ürün'}`);
      }
    } catch (notifError) {
      console.error("Stok hareketi bildirim hatası:", notifError);
      // Bildirim hatası API yanıtını etkilemeyecek
    }
    
    res.status(201).json(newTransaction);
  }));

  // Kumaş Depo - Hareket durumunu güncelle
  app.patch("/api/warehouse/transactions/:id/status", isAuthenticated, hasPermission('warehouse:manage_inventory'), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const { status, approvedBy, notes } = req.body;
    
    const updatedTransaction = await storage.updateInventoryTransactionStatus(id, status, approvedBy, notes);
    
    if (!updatedTransaction) {
      return res.status(404).json({ error: "Stok hareketi bulunamadı" });
    }
    
    res.json(updatedTransaction);
  }));

  // Kumaş Depo - Lokasyonlar API rotası
  app.get("/api/warehouse/locations", isAuthenticated, hasPermission('warehouse:view_inventory'), asyncHandler(async (req, res) => {
    const locations = await storage.getInventoryLocations({
      warehouseType: req.query.type?.toString() || undefined,
      isActive: req.query.active === 'true' ? true : undefined
    });
    res.json(locations);
  }));

  // Kumaş Depo - Yeni lokasyon ekle
  app.post("/api/warehouse/locations", isAuthenticated, hasPermission('warehouse:manage_inventory'), asyncHandler(async (req, res) => {
    const locationData = req.body;
    const newLocation = await storage.createInventoryLocation(locationData);
    res.status(201).json(newLocation);
  }));

  // Kumaş Depo - Lokasyon güncelle
  app.patch("/api/warehouse/locations/:id", isAuthenticated, hasPermission('warehouse:manage_inventory'), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updateData = req.body;
    
    const updatedLocation = await storage.updateInventoryLocation(id, updateData);
    
    if (!updatedLocation) {
      return res.status(404).json({ error: "Depo lokasyonu bulunamadı" });
    }
    
    res.json(updatedLocation);
  }));
  
  // Kumaş Depo - Rapor Rotaları tanımlanmıştır
  
  // Kumaş Depo - Raporlar API Rotaları
  app.get("/api/warehouse/reports/stock", isAuthenticated, hasPermission('warehouse:view_inventory'), asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const stockReport = await storage.getWarehouseStockReport(
      from ? new Date(from as string) : undefined,
      to ? new Date(to as string) : undefined
    );
    res.json(stockReport);
  }));

  app.get("/api/warehouse/reports/movements", isAuthenticated, hasPermission('warehouse:view_inventory'), asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const movementReport = await storage.getWarehouseMovementsReport(
      from ? new Date(from as string) : undefined,
      to ? new Date(to as string) : undefined
    );
    res.json(movementReport);
  }));

  app.get("/api/warehouse/reports/suppliers", isAuthenticated, hasPermission('warehouse:view_inventory'), asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const supplierReport = await storage.getWarehouseSupplierReport(
      from ? new Date(from as string) : undefined,
      to ? new Date(to as string) : undefined
    );
    res.json(supplierReport);
  }));
  
  app.get("/api/warehouse/metrics", isAuthenticated, hasPermission('warehouse:view_inventory'), asyncHandler(async (req, res) => {
    const metrics = await storage.getWarehouseMetrics();
    res.json(metrics);
  }));

  // Kalite Kontrol Modülü API Rotaları
  
  // Kumaş Topları
  app.get("/api/quality/fabric-rolls", isAuthenticated, hasPermission('quality:view_fabric_rolls'), asyncHandler(async (req, res) => {
    const { status, operatorId, machineId, batchNo, createdAfter, createdBefore } = req.query;
    
    const filters: Record<string, any> = {};
    if (status) filters.status = status;
    if (operatorId) filters.operatorId = Number(operatorId);
    if (machineId) filters.machineId = Number(machineId);
    if (batchNo) filters.batchNo = batchNo;
    if (createdAfter) filters.createdAfter = createdAfter;
    if (createdBefore) filters.createdBefore = createdBefore;
    
    const rolls = await storage.getQualityFabricRolls(filters);
    res.json(rolls);
  }));
  
  app.get("/api/quality/fabric-rolls/:id", isAuthenticated, hasPermission('quality:view_fabric_rolls'), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    
    const roll = await storage.getQualityFabricRollById(id);
    if (!roll) {
      return res.status(404).json({ error: "Kumaş topu bulunamadı" });
    }
    
    res.json(roll);
  }));
  
  app.get("/api/quality/fabric-rolls/barcode/:barcode", isAuthenticated, hasPermission('quality:view_fabric_rolls'), asyncHandler(async (req, res) => {
    const barcode = req.params.barcode;
    
    const roll = await storage.getQualityFabricRollByBarcode(barcode);
    if (!roll) {
      return res.status(404).json({ error: "Barkod ile kumaş topu bulunamadı" });
    }
    
    res.json(roll);
  }));
  
  app.post("/api/quality/fabric-rolls", isAuthenticated, hasPermission('quality:create_fabric_rolls'), asyncHandler(async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Kullanıcı bilgisi bulunamadı" });
      }
      
      const newRoll = await storage.createQualityFabricRoll({
        ...req.body,
        operatorId: req.body.operatorId || req.user.id,
        status: req.body.status || "active",
        createdAt: new Date()
      });
      
      res.status(201).json(newRoll);
    } catch (error) {
      console.error('Kumaş topu oluşturma hatası:', error);
      res.status(500).json({ error: "Kumaş topu oluşturulurken bir hata oluştu" });
    }
  }));
  
  app.put("/api/quality/fabric-rolls/:id", isAuthenticated, hasPermission('quality:edit_fabric_rolls'), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    
    const roll = await storage.getQualityFabricRollById(id);
    if (!roll) {
      return res.status(404).json({ error: "Kumaş topu bulunamadı" });
    }
    
    const updatedRoll = await storage.updateQualityFabricRoll(id, req.body);
    res.json(updatedRoll);
  }));
  
  app.put("/api/quality/fabric-rolls/:id/status", isAuthenticated, hasPermission('quality:edit_fabric_rolls'), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: "Durum parametresi gereklidir" });
    }
    
    const roll = await storage.getQualityFabricRollById(id);
    if (!roll) {
      return res.status(404).json({ error: "Kumaş topu bulunamadı" });
    }
    
    const updatedRoll = await storage.updateQualityFabricRollStatus(id, status);
    res.json(updatedRoll);
  }));
  
  app.delete("/api/quality/fabric-rolls/:id", isAuthenticated, hasPermission('quality:delete_fabric_rolls'), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    
    const roll = await storage.getQualityFabricRollById(id);
    if (!roll) {
      return res.status(404).json({ error: "Kumaş topu bulunamadı" });
    }
    
    await storage.deleteQualityFabricRoll(id);
    res.status(204).end();
  }));
  
  // Kumaş Hataları
  app.get("/api/quality/fabric-defects/:fabricRollId", isAuthenticated, hasPermission('quality:view_fabric_defects'), asyncHandler(async (req, res) => {
    const fabricRollId = Number(req.params.fabricRollId);
    
    const defects = await storage.getQualityFabricDefects(fabricRollId);
    res.json(defects);
  }));
  
  app.post("/api/quality/fabric-defects", isAuthenticated, hasPermission('quality:create_fabric_defects'), asyncHandler(async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Kullanıcı bilgisi bulunamadı" });
      }
      
      const newDefect = await storage.createQualityFabricDefect({
        ...req.body,
        createdBy: req.body.createdBy || req.user.id
      });
      
      res.status(201).json(newDefect);
    } catch (error) {
      console.error('Kumaş hatası oluşturma hatası:', error);
      res.status(500).json({ error: "Kumaş hatası oluşturulurken bir hata oluştu" });
    }
  }));
  
  app.put("/api/quality/fabric-defects/:id", isAuthenticated, hasPermission('quality:edit_fabric_defects'), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    
    const defect = await storage.getQualityFabricDefectById(id);
    if (!defect) {
      return res.status(404).json({ error: "Kumaş hatası bulunamadı" });
    }
    
    const updatedDefect = await storage.updateQualityFabricDefect(id, req.body);
    res.json(updatedDefect);
  }));
  
  app.delete("/api/quality/fabric-defects/:id", isAuthenticated, hasPermission('quality:delete_fabric_defects'), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    
    const defect = await storage.getQualityFabricDefectById(id);
    if (!defect) {
      return res.status(404).json({ error: "Kumaş hatası bulunamadı" });
    }
    
    await storage.deleteQualityFabricDefect(id);
    res.status(204).end();
  }));
  
  // Kalite Sistemleri
  app.get("/api/quality/systems", isAuthenticated, hasPermission('quality:view_systems'), asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    
    const systems = await storage.getQualitySystems(includeInactive);
    res.json(systems);
  }));
  
  app.post("/api/quality/systems", isAuthenticated, hasPermission('quality:manage_systems'), asyncHandler(async (req, res) => {
    try {
      const newSystem = await storage.createQualitySystem(req.body);
      res.status(201).json(newSystem);
    } catch (error) {
      console.error('Kalite sistemi oluşturma hatası:', error);
      res.status(500).json({ error: "Kalite sistemi oluşturulurken bir hata oluştu" });
    }
  }));
  
  app.put("/api/quality/systems/:id", isAuthenticated, hasPermission('quality:manage_systems'), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    
    const system = await storage.getQualitySystemById(id);
    if (!system) {
      return res.status(404).json({ error: "Kalite sistemi bulunamadı" });
    }
    
    const updatedSystem = await storage.updateQualitySystem(id, req.body);
    res.json(updatedSystem);
  }));
  
  app.delete("/api/quality/systems/:id", isAuthenticated, hasPermission('quality:manage_systems'), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    
    const system = await storage.getQualitySystemById(id);
    if (!system) {
      return res.status(404).json({ error: "Kalite sistemi bulunamadı" });
    }
    
    await storage.deleteQualitySystem(id);
    res.status(204).end();
  }));
  
  // Hata Kodları
  app.get("/api/quality/defect-codes", isAuthenticated, hasPermission('quality:view_defect_codes'), asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    
    const codes = await storage.getQualityDefectCodes(includeInactive);
    res.json(codes);
  }));
  
  app.post("/api/quality/defect-codes", isAuthenticated, hasPermission('quality:manage_defect_codes'), asyncHandler(async (req, res) => {
    try {
      const newCode = await storage.createQualityDefectCode(req.body);
      res.status(201).json(newCode);
    } catch (error) {
      console.error('Hata kodu oluşturma hatası:', error);
      res.status(500).json({ error: "Hata kodu oluşturulurken bir hata oluştu" });
    }
  }));
  
  app.put("/api/quality/defect-codes/:id", isAuthenticated, hasPermission('quality:manage_defect_codes'), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    
    const code = await storage.getQualityDefectCodeById(id);
    if (!code) {
      return res.status(404).json({ error: "Hata kodu bulunamadı" });
    }
    
    const updatedCode = await storage.updateQualityDefectCode(id, req.body);
    res.json(updatedCode);
  }));
  
  app.delete("/api/quality/defect-codes/:id", isAuthenticated, hasPermission('quality:manage_defect_codes'), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    
    const code = await storage.getQualityDefectCodeById(id);
    if (!code) {
      return res.status(404).json({ error: "Hata kodu bulunamadı" });
    }
    
    await storage.deleteQualityDefectCode(id);
    res.status(204).end();
  }));
  
  // Ölçüm Cihazları
  app.get("/api/quality/measurement-devices", isAuthenticated, hasPermission('quality:view_devices'), asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    
    const devices = await storage.getQualityMeasurementDevices(includeInactive);
    res.json(devices);
  }));
  
  app.post("/api/quality/measurement-devices", isAuthenticated, hasPermission('quality:manage_devices'), asyncHandler(async (req, res) => {
    try {
      const newDevice = await storage.createQualityMeasurementDevice(req.body);
      res.status(201).json(newDevice);
    } catch (error) {
      console.error('Ölçüm cihazı oluşturma hatası:', error);
      res.status(500).json({ error: "Ölçüm cihazı oluşturulurken bir hata oluştu" });
    }
  }));
  
  app.put("/api/quality/measurement-devices/:id", isAuthenticated, hasPermission('quality:manage_devices'), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    
    const device = await storage.getQualityMeasurementDeviceById(id);
    if (!device) {
      return res.status(404).json({ error: "Ölçüm cihazı bulunamadı" });
    }
    
    const updatedDevice = await storage.updateQualityMeasurementDevice(id, req.body);
    res.json(updatedDevice);
  }));
  
  app.delete("/api/quality/measurement-devices/:id", isAuthenticated, hasPermission('quality:manage_devices'), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    
    const device = await storage.getQualityMeasurementDeviceById(id);
    if (!device) {
      return res.status(404).json({ error: "Ölçüm cihazı bulunamadı" });
    }
    
    await storage.deleteQualityMeasurementDevice(id);
    res.status(204).end();
  }));
  
  // Kalite İstatistikleri
  app.get("/api/quality/stats", isAuthenticated, hasPermission('quality:view_stats'), asyncHandler(async (req, res) => {
    const stats = await storage.getQualityStats();
    res.json(stats);
  }));

  // COM Port ve Ölçüm Cihazları API Rotaları
  
  // Kullanılabilir COM portlarını listele
  app.get("/api/quality/com-ports", isAuthenticated, hasPermission('quality:manage_devices'), asyncHandler(async (req, res) => {
    const ports = await comPortService.listPorts();
    res.json(ports);
  }));

  // Tartı cihazına bağlan
  app.post("/api/quality/connect-weight-device", isAuthenticated, hasPermission('quality:manage_devices'), asyncHandler(async (req, res) => {
    const { portName, baudRate, dataBits, stopBits, parity } = req.body;
    
    if (!portName) {
      return res.status(400).json({ error: "Port adı gereklidir" });
    }
    
    try {
      // Önce bağlantı parametreleriyle COM porta bağlan
      const connected = await comPortService.connect(
        portName,
        baudRate || 9600,
        dataBits || 8,
        stopBits || 1,
        parity || 'none'
      );
      
      if (!connected) {
        return res.status(500).json({ error: "COM portuna bağlanamadı" });
      }
      
      // Sonra tartı cihazı olarak kaydet
      const success = await measurementDeviceService.connectWeightDevice(portName);
      
      if (success) {
        res.json({ success: true, message: `${portName} tartı cihazı olarak bağlandı` });
      } else {
        res.status(500).json({ error: "Tartı cihazı bağlantısı başarısız" });
      }
    } catch (error) {
      console.error('Tartı cihazı bağlantı hatası:', error);
      res.status(500).json({ error: "Tartı cihazı bağlanırken bir hata oluştu" });
    }
  }));

  // Metre cihazına bağlan
  app.post("/api/quality/connect-meter-device", isAuthenticated, hasPermission('quality:manage_devices'), asyncHandler(async (req, res) => {
    const { portName, baudRate, dataBits, stopBits, parity } = req.body;
    
    if (!portName) {
      return res.status(400).json({ error: "Port adı gereklidir" });
    }
    
    try {
      // Önce COM porta bağlan
      const connected = await comPortService.connect(
        portName,
        baudRate || 9600,
        dataBits || 8,
        stopBits || 1,
        parity || 'none'
      );
      
      if (!connected) {
        return res.status(500).json({ error: "COM portuna bağlanamadı" });
      }
      
      // Sonra metre cihazı olarak kaydet
      const success = await measurementDeviceService.connectMeterDevice(portName);
      
      if (success) {
        res.json({ success: true, message: `${portName} metre cihazı olarak bağlandı` });
      } else {
        res.status(500).json({ error: "Metre cihazı bağlantısı başarısız" });
      }
    } catch (error) {
      console.error('Metre cihazı bağlantı hatası:', error);
      res.status(500).json({ error: "Metre cihazı bağlanırken bir hata oluştu" });
    }
  }));

  // Ölçüm cihazı bağlantılarını kapat
  app.post("/api/quality/disconnect-devices", isAuthenticated, hasPermission('quality:manage_devices'), asyncHandler(async (req, res) => {
    try {
      await measurementDeviceService.disconnectDevices();
      res.json({ success: true, message: "Tüm ölçüm cihazları bağlantısı kesildi" });
    } catch (error) {
      console.error('Cihaz bağlantısı kesme hatası:', error);
      res.status(500).json({ error: "Cihaz bağlantıları kesilirken bir hata oluştu" });
    }
  }));
  
  // Ölçüm cihazı durumunu kontrol et
  app.get("/api/quality/device-status", isAuthenticated, hasPermission('quality:view_devices'), asyncHandler(async (req, res) => {
    // Kullanıcı ID'si bildirim göndermek için kullanılır (cihaz bağlantı durumu değiştiğinde)
    const userId = req.user?.id;
    const status = measurementDeviceService.getDeviceStatus(userId);
    
    // Her cihaz durumu kontrolünde, eğer cihaz bağlantı durumunda değişiklik varsa
    // measurementDeviceService içinde otomatik olarak bildirim gönderilir
    
    res.json(status);
  }));
  
  // Tartı cihazından son değeri getir
  app.get("/api/quality/weight-value", isAuthenticated, hasPermission('quality:view_devices'), asyncHandler(async (req, res) => {
    const value = measurementDeviceService.getLastWeightValue();
    res.json({ value });
  }));
  
  // Metre cihazından son değeri getir
  app.get("/api/quality/meter-value", isAuthenticated, hasPermission('quality:view_devices'), asyncHandler(async (req, res) => {
    const value = measurementDeviceService.getLastMeterValue();
    res.json({ value });
  }));

  // Sevkiyat işlemleri için API rotaları
  
  // Sevkiyat listesini getir
  app.get("/api/shipments", isAuthenticated, hasPermission('warehouse:view_inventory'), asyncHandler(async (req, res) => {
    const { status, customerId, from, to } = req.query;
    
    // Filtreleri hazırla
    const filters: Record<string, any> = {};
    if (status) filters.status = status as string;
    if (customerId) filters.customerId = Number(customerId);
    if (from) filters.from = new Date(from as string);
    if (to) filters.to = new Date(to as string);
    
    try {
      const shipments = await storage.getShipments(filters);
      res.json(shipments);
    } catch (error) {
      console.error("Sevkiyat listesi getirme hatası:", error);
      res.status(500).json({ error: "Sevkiyat listesi alınırken bir hata oluştu" });
    }
  }));
  
  // Sevkiyat detayını getir
  app.get("/api/shipments/:id", isAuthenticated, hasPermission('warehouse:view_inventory'), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    
    try {
      const shipment = await storage.getShipmentById(id);
      if (!shipment) {
        return res.status(404).json({ error: "Sevkiyat bulunamadı" });
      }
      
      // Sevkiyat detaylarını getir
      const items = await storage.getShipmentItemsByShipmentId(id);
      
      res.json({
        ...shipment,
        items
      });
    } catch (error) {
      console.error("Sevkiyat detayı getirme hatası:", error);
      res.status(500).json({ error: "Sevkiyat detayı alınırken bir hata oluştu" });
    }
  }));
  
  // Yeni sevkiyat oluştur
  app.post("/api/shipments", isAuthenticated, hasPermission('warehouse:manage_inventory'), asyncHandler(async (req, res) => {
    try {
      const shipmentData = {
        ...req.body,
        createdBy: req.user?.id || 1,
        createdAt: new Date(),
        status: req.body.status || 'draft'
      };
      
      const newShipment = await storage.createShipment(shipmentData);
      
      // Sevkiyat oluşturulduğunda bildirim gönder
      if (req.user && sendNotificationToUser) {
        // Depo ve Satış departmanı kullanıcılarına bildirim gönder
        const warehouseDeptId = 4; // Depo departman ID'si
        const salesDeptId = 2;     // Satış departman ID'si
        
        const warehouseUsers = await storage.getUsersByDepartmentId(warehouseDeptId);
        const salesUsers = await storage.getUsersByDepartmentId(salesDeptId);
        
        // Tüm ilgili kullanıcıları birleştir
        const allUsers = [...warehouseUsers, ...salesUsers];
        
        // Benzersiz kullanıcıları filtrele
        const uniqueUsers = allUsers.filter((user, index, self) => 
          index === self.findIndex(u => u.id === user.id)
        );
        
        // Bildirim gönder
        for (const user of uniqueUsers) {
          if (user.id !== req.user.id) {
            await sendNotificationToUser(user.id, {
              title: "Yeni Sevkiyat Planlandı",
              content: `${req.user.fullName} tarafından ${shipmentData.shipmentNo || 'SH-' + newShipment.id} numaralı sevkiyat oluşturuldu.`,
              type: "warehouse",
              entityId: newShipment.id,
              entityType: "shipment"
            });
          }
        }
      }
      
      res.status(201).json(newShipment);
    } catch (error) {
      console.error("Sevkiyat oluşturma hatası:", error);
      res.status(500).json({ error: "Sevkiyat oluşturulurken bir hata oluştu" });
    }
  }));
  
  // Sevkiyat güncelle
  app.put("/api/shipments/:id", isAuthenticated, hasPermission('warehouse:manage_inventory'), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    
    try {
      const shipment = await storage.getShipmentById(id);
      if (!shipment) {
        return res.status(404).json({ error: "Sevkiyat bulunamadı" });
      }
      
      const updatedData = {
        ...req.body,
        updatedAt: new Date()
      };
      
      const updatedShipment = await storage.updateShipment(id, updatedData);
      
      // Sevkiyat durumu değiştiğinde bildirim gönder
      if (req.user && sendNotificationToUser && req.body.status && req.body.status !== shipment.status) {
        // Depo ve Satış departmanı kullanıcılarına bildirim gönder
        const warehouseDeptId = 4; // Depo departman ID'si
        const salesDeptId = 2;     // Satış departman ID'si
        
        const warehouseUsers = await storage.getUsersByDepartmentId(warehouseDeptId);
        const salesUsers = await storage.getUsersByDepartmentId(salesDeptId);
        
        // Tüm ilgili kullanıcıları birleştir
        const allUsers = [...warehouseUsers, ...salesUsers];
        
        // Benzersiz kullanıcıları filtrele
        const uniqueUsers = allUsers.filter((user, index, self) => 
          index === self.findIndex(u => u.id === user.id)
        );
        
        // Durum Türkçe karşılıkları
        const statusMap: Record<string, string> = {
          'draft': 'Taslak',
          'scheduled': 'Planlandı',
          'inProgress': 'Hazırlanıyor',
          'ready': 'Hazır',
          'shipped': 'Sevk Edildi',
          'delivered': 'Teslim Edildi',
          'cancelled': 'İptal Edildi'
        };
        
        const newStatus = statusMap[req.body.status] || req.body.status;
        
        // Bildirim gönder
        for (const user of uniqueUsers) {
          if (user.id !== req.user.id) {
            await sendNotificationToUser(user.id, {
              title: "Sevkiyat Durumu Güncellendi",
              content: `${shipment.shipmentNo || 'SH-' + shipment.id} numaralı sevkiyat durumu "${newStatus}" olarak güncellendi.`,
              type: "warehouse",
              entityId: shipment.id,
              entityType: "shipment"
            });
          }
        }
      }
      
      res.json(updatedShipment);
    } catch (error) {
      console.error("Sevkiyat güncelleme hatası:", error);
      res.status(500).json({ error: "Sevkiyat güncellenirken bir hata oluştu" });
    }
  }));
  
  // Sevkiyat sil
  app.delete("/api/shipments/:id", isAuthenticated, hasPermission('warehouse:manage_inventory'), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    
    try {
      const shipment = await storage.getShipmentById(id);
      if (!shipment) {
        return res.status(404).json({ error: "Sevkiyat bulunamadı" });
      }
      
      // Sevkiyat silinmeden önce ilişkili öğeler de silinmeli
      await storage.deleteShipmentItemsByShipmentId(id);
      
      // Sevkiyat kaydını sil
      await storage.deleteShipment(id);
      
      res.status(204).end();
    } catch (error) {
      console.error("Sevkiyat silme hatası:", error);
      res.status(500).json({ error: "Sevkiyat silinirken bir hata oluştu" });
    }
  }));
  
  // Bu bildirim gönderme fonksiyonu başka yerde tanımlanıyor
  /* Bu kısım eski WebSocket entegrasyonundan. Artık kullanılmıyor */
  
  // WebSocket yapılandırması artık farklı bir yöntemle gerçekleştiriliyor
  
  // COM Port cihazlarından bildirim altyapısını entegre et
  setDeviceNotificationSender(async (userId, notification) => {
    sendNotification({
      recipientType: 'user',
      recipientId: userId,
      type: notification.type,
      title: notification.title,
      message: notification.content,
      data: {
        entityId: notification.entityId,
        entityType: notification.entityType
      }
    });
    return Promise.resolve(); // NotificationSender tipi Promise<any> döndürmeli
  });
  
  // Bildirim fonksiyonunu diğer modüllerin kullanımına açmak için websocket.ts kullanılıyor
  // Bildirimler artık websocket.ts:sendNotification fonksiyonu üzerinden yapılıyor
  
  return httpServer;
}

// Initialize default data for the application
async function initializeDefaultData() {
  // Check if we already have the admin role
  const roles = await storage.getRoles();
  if (roles.length === 0) {
    // Create default roles
    const adminRole = await storage.createRole({ name: "Admin", description: "System Administrator" });
    const salesRole = await storage.createRole({ name: "Sales", description: "Sales Department" });
    const productionRole = await storage.createRole({ name: "Production", description: "Production Department" });
    const inventoryRole = await storage.createRole({ name: "Inventory", description: "Inventory Department" });
    const qualityRole = await storage.createRole({ name: "Quality", description: "Quality Control Department" });

    // Create default departments
    const adminDept = await storage.createDepartment({ name: "Admin", code: "ADMIN", color: "#6366f1" });
    const salesDept = await storage.createDepartment({ name: "Satış ve Pazarlama", code: "SALES", color: "#3b82f6" });
    const productionDept = await storage.createDepartment({ name: "Üretim", code: "PROD", color: "#10b981" });
    const inventoryDept = await storage.createDepartment({ name: "Depo ve Stok", code: "INV", color: "#f59e0b" });
    const qualityDept = await storage.createDepartment({ name: "Kalite Kontrol", code: "QC", color: "#ef4444" });

    // Create default permissions
    const permissions = [
      { code: "admin:view_users", description: "View Users" },
      { code: "admin:manage_users", description: "Manage Users" },
      { code: "admin:view_roles", description: "View Roles" },
      { code: "admin:manage_roles", description: "Manage Roles" },
      { code: "admin:view_permissions", description: "View Permissions" },
      { code: "admin:manage_permissions", description: "Manage Permissions" },
      { code: "admin:view_departments", description: "View Departments" },
      { code: "admin:manage_departments", description: "Manage Departments" },
      { code: "admin:manage_master_data", description: "Manage Master Data" },
      { code: "sales:view_orders", description: "View Orders" },
      { code: "sales:manage_orders", description: "Manage Orders" },
      { code: "sales:view_customers", description: "View Customers" },
      { code: "sales:manage_customers", description: "Manage Customers" },
      { code: "production:view_workorders", description: "View Work Orders" },
      { code: "production:manage_workorders", description: "Manage Work Orders" },
      { code: "inventory:view_inventory", description: "View Inventory" },
      { code: "inventory:manage_inventory", description: "Manage Inventory" },
      { code: "quality:view_quality", description: "View Quality Data" },
      { code: "quality:manage_quality", description: "Manage Quality Data" },
      { code: "planning:view_plans", description: "View Production Plans" },
      { code: "planning:manage_plans", description: "Manage Production Plans" },
      { code: "planning:view_routes", description: "View Production Routes" },
      { code: "planning:manage_routes", description: "Manage Production Routes" },
      { code: "weaving:view_workorders", description: "View Weaving Work Orders" },
      { code: "weaving:manage_workorders", description: "Manage Weaving Work Orders" },
      { code: "product:view_designs", description: "View Product Designs" },
      { code: "product:manage_designs", description: "Manage Product Designs" },
      { code: "product:view_fabrics", description: "View Fabric Types" },
      { code: "product:manage_fabrics", description: "Manage Fabric Types" },
      { code: "quality:view_raw", description: "View Raw Quality Data" },
      { code: "quality:manage_raw", description: "Manage Raw Quality Data" },
      { code: "lab:view_tests", description: "View Laboratory Tests" },
      { code: "lab:manage_tests", description: "Manage Laboratory Tests" },
      { code: "kartela:view_swatches", description: "View Swatches" },
      { code: "kartela:manage_swatches", description: "Manage Swatches" },
      { code: "yarn:view_inventory", description: "View Yarn Inventory" },
      { code: "yarn:manage_inventory", description: "Manage Yarn Inventory" },
      { code: "warehouse:view_inventory", description: "View Warehouse Inventory" },
      { code: "warehouse:manage_inventory", description: "Manage Warehouse Inventory" },
    ];

    for (const perm of permissions) {
      await storage.createPermission(perm);
    }

    // Assign permissions to roles
    // Admin gets all permissions
    const allPermissions = await storage.getPermissions();
    for (const perm of allPermissions) {
      await storage.assignPermissionToRole(adminRole.id, perm.id);
    }

    // Assign permissions to Sales role
    const salesPermissions = ["sales:view_orders", "sales:manage_orders", "sales:view_customers", "sales:manage_customers"];
    for (const permCode of salesPermissions) {
      const perm = allPermissions.find(p => p.code === permCode);
      if (perm) {
        await storage.assignPermissionToRole(salesRole.id, perm.id);
      }
    }
    
    // Assign permissions to Production role
    const productionPermissions = ["production:view_workorders", "production:manage_workorders"];
    for (const permCode of productionPermissions) {
      const perm = allPermissions.find(p => p.code === permCode);
      if (perm) {
        await storage.assignPermissionToRole(productionRole.id, perm.id);
      }
    }
    
    // Assign permissions to Inventory role
    const inventoryPermissions = ["inventory:view_inventory", "inventory:manage_inventory", "warehouse:view_inventory", "warehouse:manage_inventory"];
    for (const permCode of inventoryPermissions) {
      const perm = allPermissions.find(p => p.code === permCode);
      if (perm) {
        await storage.assignPermissionToRole(inventoryRole.id, perm.id);
      }
    }
    
    // Assign permissions to Quality role
    const qualityPermissions = ["quality:view_quality", "quality:manage_quality"];
    for (const permCode of qualityPermissions) {
      const perm = allPermissions.find(p => p.code === permCode);
      if (perm) {
        await storage.assignPermissionToRole(qualityRole.id, perm.id);
      }
    }

    // Create a default admin user
    const hashedPassword = await storage.hashPassword("admin123");
    const adminUser = await storage.createUser({
      username: "admin",
      password: hashedPassword,
      fullName: "System Administrator",
      email: "admin@tekstil.com",
      departmentId: adminDept.id
    });

    // Assign admin role to admin user
    await storage.assignRoleToUser(adminUser.id, adminRole.id);

    // Create a default sales user
    const salesPassword = await storage.hashPassword("sales123");
    const salesUser = await storage.createUser({
      username: "sales",
      password: salesPassword,
      fullName: "Ahmet Yılmaz",
      email: "sales@tekstil.com",
      departmentId: salesDept.id
    });

    // Assign sales role to sales user
    await storage.assignRoleToUser(salesUser.id, salesRole.id);
    
    // Create a default production user
    const productionPassword = await storage.hashPassword("production123");
    const productionUser = await storage.createUser({
      username: "production",
      password: productionPassword,
      fullName: "Mehmet Demir",
      email: "production@tekstil.com",
      departmentId: productionDept.id
    });

    // Assign production role to production user
    await storage.assignRoleToUser(productionUser.id, productionRole.id);
    
    // Create a default inventory user
    const inventoryPassword = await storage.hashPassword("inventory123");
    const inventoryUser = await storage.createUser({
      username: "inventory",
      password: inventoryPassword,
      fullName: "Ali Yıldız",
      email: "inventory@tekstil.com",
      departmentId: inventoryDept.id
    });

    // Assign inventory role to inventory user
    await storage.assignRoleToUser(inventoryUser.id, inventoryRole.id);
    
    // Create a default quality control user
    const qualityPassword = await storage.hashPassword("quality123");
    const qualityUser = await storage.createUser({
      username: "quality",
      password: qualityPassword,
      fullName: "Ayşe Kaya",
      email: "quality@tekstil.com",
      departmentId: qualityDept.id
    });

    // Assign quality role to quality user
    await storage.assignRoleToUser(qualityUser.id, qualityRole.id);

    // Create order statuses
    const orderStatuses = [
      { name: "Beklemede", code: "PENDING", color: "#3b82f6" },
      { name: "Üretimde", code: "PRODUCTION", color: "#10b981" },
      { name: "Sevkiyat Bekliyor", code: "SHIPMENT", color: "#f59e0b" },
      { name: "Tamamlandı", code: "COMPLETED", color: "#16a34a" },
      { name: "İptal Edildi", code: "CANCELLED", color: "#ef4444" },
    ];

    for (const status of orderStatuses) {
      await storage.createOrderStatus(status);
    }

    // Create default fabric types
    const fabricTypes = [
      { name: "Pamuklu Örme", code: "KMS-PA-0023", description: "Pamuklu örme kumaş" },
      { name: "Polyester Dokuma", code: "KMS-PL-0015", description: "Polyester dokuma kumaş" },
      { name: "Pamuklu Gabardin", code: "KMS-GB-0042", description: "Pamuklu gabardin kumaş" },
    ];

    for (const fabric of fabricTypes) {
      await storage.createFabricType(fabric);
    }

    // Create default customers
    const customers = [
      { name: "ABC Tekstil Ltd.", contactPerson: "Mehmet Yılmaz", phone: "0212 555 1234", email: "info@abctekstil.com", address: "İstanbul", city: "İstanbul", taxNumber: "1234567890", notes: "" },
      { name: "Moda Tekstil A.Ş.", contactPerson: "Ayşe Demir", phone: "0224 555 6789", email: "info@modatekstil.com", address: "Bursa", city: "Bursa", taxNumber: "9876543210", notes: "" },
      { name: "XYZ Konfeksiyon", contactPerson: "Ali Kaya", phone: "0232 555 9876", email: "info@xyzkonfeksiyon.com", address: "İzmir", city: "İzmir", taxNumber: "5678901234", notes: "" },
    ];

    for (const customer of customers) {
      await storage.createCustomer(customer);
    }
    
    // Detaylı örnek veriler yaratma
    await createSampleData();
  }
}
