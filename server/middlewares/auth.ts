import { Request, Response, NextFunction } from "express";

// Kullanıcının kimlik doğrulamasını kontrol eden middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).send("Bu işlem için giriş yapmanız gerekiyor");
}

// Kullanıcının belirli bir izne sahip olup olmadığını kontrol eden middleware
export function hasPermission(permissionCode: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).send("Bu işlem için giriş yapmanız gerekiyor");
    }
    
    // admin kullanıcısı tüm izinlere sahiptir
    if (req.user.username === 'admin') {
      return next();
    }
    
    // Kullanıcının izinlerini kontrol et
    const userPermissions = req.user.permissions || [];
    if (Array.isArray(userPermissions) && userPermissions.some(p => p.code === permissionCode)) {
      return next();
    }
    
    return res.status(403).send("Bu işlem için yeterli yetkiye sahip değilsiniz");
  };
}

// Kullanıcının belirli bir departmana ait olup olmadığını kontrol eden middleware
export function belongsToDepartment(departmentId: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).send("Bu işlem için giriş yapmanız gerekiyor");
    }
    
    // admin kullanıcısı tüm departmanlara erişebilir
    if (req.user.username === 'admin') {
      return next();
    }
    
    // Kullanıcının departmanını kontrol et
    if (req.user.departmentId === departmentId) {
      return next();
    }
    
    return res.status(403).send("Bu departmana ait işlemler için yetkiniz yok");
  };
}