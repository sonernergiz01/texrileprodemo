import { storage } from "../storage";

/**
 * Tekstil ERP sistemi için örnek verileri oluşturur.
 * Bu, üretim rotaları, proses tipleri, makineler ve diğer temel veriler dahil olmak üzere
 * ERP sisteminin demo amaçlı çalışması için gereken tüm verileri oluşturur.
 */
export async function createSampleData() {
  console.log("Tekstil ERP için örnek veriler oluşturuluyor...");
  
  try {
    // Daha fazla örnek veri eklemeye devam ediyoruz, önce kontrol yapma
    
    // 1. Dokuma bölümü için proses tipleri oluştur
    const weavingDept = await storage.getDepartmentByCode("PROD");
    const weavingProcessTypes = [
      { 
        name: "Çözgü Hazırlama", 
        code: "WARP_PREP", 
        description: "Dokuma öncesi çözgü iplikleri hazırlama süreci",
        departmentId: weavingDept.id,
        duration: 120,
        sequence: 1,
        color: "#3b82f6",
        icon: "ScissorsLineDashed"
      },
      { 
        name: "Taharlama", 
        code: "DRAFTING", 
        description: "Çözgü ipliklerinin tahar işlemi",
        departmentId: weavingDept.id,
        duration: 90,
        sequence: 2,
        color: "#8b5cf6",
        icon: "LineChart"
      },
      { 
        name: "Dokuma", 
        code: "WEAVING", 
        description: "Ana dokuma işlemi",
        departmentId: weavingDept.id,
        duration: 480,
        sequence: 3,
        color: "#ec4899",
        icon: "LayoutGrid"
      }
    ];
    
    // Her bir proses tipini eklemeden önce mevcut olup olmadığını kontrol et
    const existingProcessTypes = await storage.getProcessTypes();
    for (const processType of weavingProcessTypes) {
      const exists = existingProcessTypes.some(pt => pt.code === processType.code);
      if (!exists) {
        try {
          await storage.createProcessType(processType);
          console.log(`Proses tipi eklendi: ${processType.name}`);
        } catch (error) {
          console.error(`Proses eklenirken hata: ${processType.code}`, error);
        }
      } else {
        console.log(`Proses tipi zaten mevcut: ${processType.code}`);
      }
    }
    
    // 2. Dokuma makinesi tipleri oluştur
    const weavingMachineTypes = [
      {
        name: "Rapier Dokuma Makinesi",
        code: "RAPIER",
        description: "Rapier teknolojisi ile çalışan dokuma makinesi",
        departmentId: weavingDept.id
      },
      {
        name: "Air Jet Dokuma Makinesi",
        code: "AIRJET",
        description: "Hava jeti teknolojisi ile çalışan yüksek hızlı dokuma makinesi",
        departmentId: weavingDept.id
      },
      {
        name: "Çözgü Hazırlama Makinesi",
        code: "WARPMACHINE",
        description: "Çözgü ipliklerini hazırlayan makine",
        departmentId: weavingDept.id
      }
    ];
    
    // Makine tiplerini kontrol et
    const existingMachineTypes = await storage.getMachineTypes();
    for (const machineType of weavingMachineTypes) {
      const exists = existingMachineTypes.some(mt => mt.code === machineType.code);
      if (!exists) {
        try {
          await storage.createMachineType(machineType);
          console.log(`Makine tipi eklendi: ${machineType.name}`);
        } catch (error) {
          console.error(`Makine tipi eklenirken hata: ${machineType.code}`, error);
        }
      } else {
        console.log(`Makine tipi zaten mevcut: ${machineType.code}`);
      }
    }
    
    // 3. Dokuma bölümü makineleri oluştur
    const rapierType = await getMachineTypeByCode("RAPIER");
    const airjetType = await getMachineTypeByCode("AIRJET");
    const warpMachineType = await getMachineTypeByCode("WARPMACHINE");
    
    const weavingMachines = [
      {
        name: "Rapier-1",
        code: "RPR-001",
        machineTypeId: rapierType.id,
        departmentId: weavingDept.id,
        status: "active",
        details: "340cm en, 8 çerçeve kapasiteli"
      },
      {
        name: "Rapier-2",
        code: "RPR-002",
        machineTypeId: rapierType.id,
        departmentId: weavingDept.id,
        status: "active",
        details: "220cm en, 12 çerçeve kapasiteli"
      },
      {
        name: "AirJet-1",
        code: "AJT-001",
        machineTypeId: airjetType.id,
        departmentId: weavingDept.id,
        status: "active",
        details: "280cm en, yüksek hızlı dokuma"
      },
      {
        name: "Çözgü-1",
        code: "WRP-001",
        machineTypeId: warpMachineType.id,
        departmentId: weavingDept.id,
        status: "active",
        details: "500 bobin kapasiteli"
      }
    ];
    
    for (const machine of weavingMachines) {
      await storage.createMachine(machine);
    }
    
    // 4. İplik tipleri oluştur
    const yarnTypes = [
      {
        name: "Pamuk İpliği",
        code: "COTTON",
        description: "100% Pamuk iplik"
      },
      {
        name: "Polyester İpliği",
        code: "POLYESTER",
        description: "100% Polyester iplik"
      },
      {
        name: "Pamuk/Polyester Karışım",
        code: "POLY-COTTON",
        description: "65% Polyester, 35% Pamuk karışım iplik"
      },
      {
        name: "Elastan İpliği",
        code: "ELASTANE",
        description: "Streç özellikli elastan iplik"
      }
    ];
    
    for (const yarnType of yarnTypes) {
      await storage.createYarnType(yarnType);
    }
    
    // 5. Kalite kontrol için proses tipleri
    const qualityDept = await storage.getDepartmentByCode("QC");
    const qualityProcessTypes = [
      {
        name: "Ham Kumaş Kontrolü",
        code: "RAW_QUALITY",
        description: "Dokuma sonrası ham kumaş kalite kontrolü",
        departmentId: qualityDept.id,
        duration: 60,
        sequence: 4,
        color: "#a855f7",
        icon: "ClipboardCheck"
      },
      {
        name: "Final Kalite Kontrolü",
        code: "FINAL_QUALITY",
        description: "Sevkiyat öncesi final kalite kontrolü",
        departmentId: qualityDept.id,
        duration: 90,
        sequence: 8,
        color: "#ef4444",
        icon: "CheckSquare"
      }
    ];
    
    // Kalite kontrol proses tiplerini ekle
    for (const processType of qualityProcessTypes) {
      const exists = existingProcessTypes.some(pt => pt.code === processType.code);
      if (!exists) {
        try {
          await storage.createProcessType(processType);
          console.log(`Proses tipi eklendi: ${processType.name}`);
        } catch (error) {
          console.error(`Proses eklenirken hata: ${processType.code}`, error);
        }
      } else {
        console.log(`Proses tipi zaten mevcut: ${processType.code}`);
      }
    }
    
    // 6. Üretim rota şablonları oluştur
    // Admin kullanıcısının varlığını doğrula
    const adminUser = await storage.getUserByUsername("admin");
    if (!adminUser) {
      throw new Error("Admin kullanıcısı bulunamadı");
    }

    const routeTemplate = await storage.createProductionRouteTemplate({
      name: "Pamuklu Dokuma Standart Rotası",
      code: "COTTON-RTM-001",
      description: "Pamuklu dokuma kumaşlar için standart üretim rotası",
      isActive: true,
      createdBy: adminUser.id
    });
    
    // Proses tiplerini al
    const warpProcess = await getProcessTypeByCode("WARP_PREP");
    const draftingProcess = await getProcessTypeByCode("DRAFTING");
    const weavingProcess = await getProcessTypeByCode("WEAVING");
    const rawQualityProcess = await getProcessTypeByCode("RAW_QUALITY");
    const finalQualityProcess = await getProcessTypeByCode("FINAL_QUALITY");
    
    // Üretim rota adımlarını oluştur
    const routeSteps = [
      {
        templateId: routeTemplate.id,
        processTypeId: warpProcess.id,
        stepOrder: 1,
        departmentId: weavingDept.id,
        duration: 120,
        description: "Çözgü ipliklerini hazırlama",
        isRequired: true
      },
      {
        templateId: routeTemplate.id,
        processTypeId: draftingProcess.id,
        stepOrder: 2,
        departmentId: weavingDept.id,
        duration: 90,
        description: "Tahar işlemi",
        isRequired: true
      },
      {
        templateId: routeTemplate.id,
        processTypeId: weavingProcess.id,
        stepOrder: 3,
        departmentId: weavingDept.id,
        duration: 480,
        description: "Dokuma işlemi",
        isRequired: true
      },
      {
        templateId: routeTemplate.id,
        processTypeId: rawQualityProcess.id,
        stepOrder: 4,
        departmentId: qualityDept.id,
        duration: 60,
        description: "Ham kumaş kalite kontrol",
        isRequired: true
      },
      {
        templateId: routeTemplate.id,
        processTypeId: finalQualityProcess.id,
        stepOrder: 5,
        departmentId: qualityDept.id,
        duration: 90,
        description: "Final kalite kontrol",
        isRequired: true
      }
    ];
    
    for (const step of routeSteps) {
      await storage.createProductionRouteTemplateStep(step);
    }
    
    // 7. Örnek sipariş verileri
    // Sipariş durumları oluştur
    if ((await storage.getOrderStatuses()).length === 0) {
      await storage.createOrderStatus({
        name: "Beklemede",
        code: "PENDING",
        color: "#f59e0b"
      });
      
      await storage.createOrderStatus({
        name: "Üretimde",
        code: "PRODUCTION",
        color: "#3b82f6"
      });
      
      await storage.createOrderStatus({
        name: "Tamamlandı",
        code: "COMPLETED",
        color: "#10b981"
      });
      
      await storage.createOrderStatus({
        name: "İptal Edildi",
        code: "CANCELLED",
        color: "#ef4444"
      });
    }
    
    // Müşteri oluştur
    if ((await storage.getCustomers()).length === 0) {
      await storage.createCustomer({
        name: "ABC Tekstil Ltd.",
        contactPerson: "Ali Yılmaz",
        phone: "+90 555 123 4567",
        email: "info@abctekstil.com",
        address: "İstanbul, Türkiye",
        city: "İstanbul",
        taxNumber: "1234567890",
        customerCode: "ABC001",
        customerType: "manufacturer"
      });
      
      await storage.createCustomer({
        name: "XYZ Konfeksiyon",
        contactPerson: "Ayşe Demir",
        phone: "+90 555 987 6543",
        email: "info@xyzkonfeksiyon.com",
        address: "Bursa, Türkiye",
        city: "Bursa",
        taxNumber: "9876543210",
        customerCode: "XYZ001",
        customerType: "wholesaler"
      });
    }
    
    // Kumaş tipleri oluştur
    if ((await storage.getFabricTypes()).length === 0) {
      await storage.createFabricType({
        name: "Pamuklu Dokuma",
        code: "KMS-PA-0023",
        description: "100% pamuklu dokuma kumaş"
      });
      
      await storage.createFabricType({
        name: "Polyester Dokuma",
        code: "KMS-PO-0045",
        description: "100% polyester dokuma kumaş"
      });
      
      await storage.createFabricType({
        name: "Pamuk/Polyester Karışım",
        code: "KMS-PP-0012",
        description: "65% polyester, 35% pamuk karışım dokuma kumaş"
      });
    }
    
    const pendingStatus = await getOrderStatusByCode("PENDING");
    const customer = await getCustomerByName("ABC Tekstil Ltd.");
    const fabricType = await getFabricTypeByCode("KMS-PA-0023");
    
    const order = await storage.createOrder({
      orderNumber: "ORD-2023-001",
      customerId: customer.id,
      fabricTypeId: fabricType.id,
      quantity: "1000",
      unitPrice: "18.5",
      unit: "metre",
      orderDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      width: "150",
      weight: "180",
      statusId: pendingStatus.id,
      createdBy: adminUser.id
    });
    
    // 8. Örnek üretim planı
    const plan = await storage.createProductionPlan({
      planNo: "PP-2023-001",
      orderId: order.id,
      productionStartDate: new Date(),
      productionEndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: "created",
      createdBy: adminUser.id,
      assignedTo: adminUser.id,
      notes: "Pamuklu dokuma kumaş için üretim planı"
    });
    
    // Üretim planına rotayı uygula
    const startDate = new Date();
    await storage.applyRouteTemplateToProductionPlan(plan.id, routeTemplate.id, startDate);
    
    console.log("Örnek veriler başarıyla oluşturuldu.");
  } catch (error) {
    console.error("Örnek veri oluşturma hatası:", error);
  }
}

// Yardımcı fonksiyonlar
async function getDepartmentByCode(code: string) {
  const departments = await storage.getDepartments();
  const department = departments.find(d => d.code === code);
  if (!department) throw new Error(`${code} kodlu departman bulunamadı`);
  return department;
}

async function getMachineTypeByCode(code: string) {
  const machineTypes = await storage.getMachineTypes();
  const machineType = machineTypes.find(m => m.code === code);
  if (!machineType) throw new Error(`${code} kodlu makine tipi bulunamadı`);
  return machineType;
}

async function getProcessTypeByCode(code: string) {
  const processTypes = await storage.getProcessTypes();
  const processType = processTypes.find(p => p.code === code);
  if (!processType) throw new Error(`${code} kodlu proses tipi bulunamadı`);
  return processType;
}

async function getOrderStatusByCode(code: string) {
  const statuses = await storage.getOrderStatuses();
  const status = statuses.find(s => s.code === code);
  if (!status) throw new Error(`${code} kodlu sipariş durumu bulunamadı`);
  return status;
}

async function getCustomerByName(name: string) {
  const customers = await storage.getCustomers();
  const customer = customers.find(c => c.name === name);
  if (!customer) throw new Error(`${name} isimli müşteri bulunamadı`);
  return customer;
}

async function getFabricTypeByCode(code: string) {
  const fabricTypes = await storage.getFabricTypes();
  const fabricType = fabricTypes.find(f => f.code === code);
  if (!fabricType) throw new Error(`${code} kodlu kumaş tipi bulunamadı`);
  return fabricType;
}