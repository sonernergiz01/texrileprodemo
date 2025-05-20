/**
 * Bu script, her departman için kullanıcı oluşturma işlemini gerçekleştirir.
 * Her kullanıcıya sadece kendi departmanına özgü yetkiler atanır.
 */

import { storage } from "./storage";

export async function createDepartmentUsers() {
  console.log("Departman bazlı kullanıcı oluşturma işlemi başlatılıyor...");

  try {
    // Önce tüm departmanları al
    const departments = await storage.getDepartments();
    console.log(`Toplam ${departments.length} departman bulundu`);

    // Tüm izinleri al
    const allPermissions = await storage.getPermissions();
    console.log(`Toplam ${allPermissions.length} izin bulundu`);

    // Her departman için bir kullanıcı ve rol oluştur
    for (const department of departments) {
      console.log(`"${department.name}" departmanı için kullanıcı oluşturuluyor...`);

      // Departman için rol oluştur veya mevcut rolü getir
      let roleName = department.name;
      let departmentRole = (await storage.getRoles()).find(r => r.name === roleName);
      
      if (!departmentRole) {
        departmentRole = await storage.createRole({
          name: roleName,
          description: `${department.name} Department Role`
        });
        console.log(`- "${roleName}" rolü oluşturuldu`);
      } else {
        console.log(`- "${roleName}" rolü zaten mevcut`);
      }

      // Departmana özgü izinleri belirle
      let departmentPermissions: string[] = [];
      
      // Temel izinler - tüm departmanlar için
      departmentPermissions.push("admin:view_departments");
      
      // Departmana özgü izinler
      switch (department.code) {
        case "ADMIN":
          departmentPermissions = allPermissions.map(p => p.code); // Admin tüm izinlere sahip
          break;
        case "SALES":
          departmentPermissions.push(
            "sales:view_orders", "sales:manage_orders",
            "sales:view_customers", "sales:manage_customers"
          );
          break;
        case "PROD": // Üretim
          departmentPermissions.push(
            "production:view_workorders", "production:manage_workorders"
          );
          break;
        case "INV": // Depo ve Stok
          departmentPermissions.push(
            "inventory:view_inventory", "inventory:manage_inventory",
            "warehouse:view_inventory", "warehouse:manage_inventory"
          );
          break;
        case "QC": // Kalite Kontrol
          departmentPermissions.push(
            "quality:view_quality", "quality:manage_quality"
          );
          break;
        case "PLN": // Planlama
          departmentPermissions.push(
            "planning:view_plans", "planning:manage_plans",
            "planning:view_routes", "planning:manage_routes"
          );
          break;
        case "DKM": // Dokuma
          departmentPermissions.push(
            "weaving:view_workorders", "weaving:manage_workorders"
          );
          break;
        case "URG": // ÜRGE
          departmentPermissions.push(
            "product:view_designs", "product:manage_designs",
            "product:view_fabrics", "product:manage_fabrics"
          );
          break;
        case "HKK": // Ham Kalite Kontrol
          departmentPermissions.push(
            "quality:view_raw", "quality:manage_raw"
          );
          break;
        case "LBR": // Laboratuvar
          departmentPermissions.push(
            "lab:view_tests", "lab:manage_tests"
          );
          break;
        case "KRT": // Kartela
          departmentPermissions.push(
            "kartela:view_swatches", "kartela:manage_swatches"
          );
          break;
        case "YRN": // İplik Ambar
          departmentPermissions.push(
            "yarn:view_inventory", "yarn:manage_inventory"
          );
          break;
        case "WAR": // Kumaş Depo
          departmentPermissions.push(
            "warehouse:view_inventory", "warehouse:manage_inventory"
          );
          break;
        // Diğer departmanlar için izinler eklenebilir
      }

      // Rol için izinleri ata
      for (const permCode of departmentPermissions) {
        const permission = allPermissions.find(p => p.code === permCode);
        if (permission) {
          await storage.assignPermissionToRole(departmentRole.id, permission.id);
          console.log(`  - "${permCode}" izni "${roleName}" rolüne atandı`);
        }
      }

      // Departman için kullanıcı oluştur
      const username = department.code.toLowerCase();
      let departmentUser = await storage.getUserByUsername(username);
      
      if (!departmentUser) {
        // Şifreyi oluştur - her departman için aynı şifre formatı
        const password = await storage.hashPassword(`${username}123`);
        
        departmentUser = await storage.createUser({
          username,
          password,
          fullName: `${department.name} User`,
          email: `${username}@tekstil.com`,
          departmentId: department.id,
          isActive: true
        });
        console.log(`- "${username}" kullanıcısı oluşturuldu`);
      } else {
        console.log(`- "${username}" kullanıcısı zaten mevcut`);
      }

      // Kullanıcıya rolü ata
      await storage.assignRoleToUser(departmentUser.id, departmentRole.id);
      console.log(`- "${username}" kullanıcısına "${roleName}" rolü atandı`);

      // Admin ise, tüm departmanların izinlerini ver
      if (department.code === "ADMIN") {
        const adminRole = (await storage.getRoles()).find(r => r.name === "Admin");
        if (adminRole) {
          // Tüm izinleri admin rolüne ata
          await storage.clearRolePermissions(adminRole.id);
          for (const perm of allPermissions) {
            await storage.assignPermissionToRole(adminRole.id, perm.id);
          }
          console.log(`- Admin rolüne tüm izinler atandı`);
        }
      }
      
      console.log(`"${department.name}" departmanı için kullanıcı ve izinler oluşturuldu.\n`);
    }

    console.log("Özel departman yetkilendirmeleri yapılıyor...");
    // Kumaş Depo için izinleri ata - inventory modülü izinlerini kullanır
    await addPermissionToRole("warehouse:view_inventory", "inventory:view_inventory");
    await addPermissionToRole("warehouse:manage_inventory", "inventory:manage_inventory");

    // Planlama, dokuma ve ÜRGE'ye üretim izinleri
    await addPermissionToRole("planning:view_plans", "production:view_workorders");
    await addPermissionToRole("planning:manage_plans", "production:manage_workorders");
    await addPermissionToRole("weaving:view_workorders", "production:view_workorders");
    await addPermissionToRole("weaving:manage_workorders", "production:manage_workorders");
    await addPermissionToRole("product:view_designs", "production:view_workorders");

    console.log("Departman bazlı kullanıcı oluşturma işlemi tamamlandı.");
  } catch (error) {
    console.error("Departman bazlı kullanıcı oluşturma hatası:", error);
  }
}

// Helper fonksiyon - kod duplikasyonunu önlemek için
async function addPermissionToRole(aliasPermCode: string, actualPermCode: string) {
  const roles = await storage.getRoles();
  const permissions = await storage.getPermissions();
  
  const permission = permissions.find(p => p.code === actualPermCode);
  if (!permission) {
    console.log(`  - "${actualPermCode}" izni bulunamadı`);
    return;
  }
  
  // İzin adını değiştirip yeni bir izin ekle
  const newPermission = await storage.createPermission({
    code: aliasPermCode,
    description: permission.description
  });
  
  console.log(`  - "${aliasPermCode}" izni oluşturuldu`);
  return newPermission;
}