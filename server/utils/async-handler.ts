import { Request, Response, NextFunction } from "express";
import { z } from "zod";

// API rota işleyicilerini sarmak için kullanılan yardımcı fonksiyon
// Bu fonksiyon, try-catch blokları ve tür kontrolleri gerektirmeden rota işleyicileri yazmamızı sağlar
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
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