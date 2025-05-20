/**
 * Veritabanı Migration İşlemleri için Loglama Modülü
 */

class MigrationLogger {
  private logMessages: string[] = [];
  
  /**
   * Log mesajı ekler
   * @param message Log mesajı
   */
  log(message: string): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}`;
    this.logMessages.push(formattedMessage);
    console.log(`Migration: ${message}`);
  }
  
  /**
   * Hata mesajı ekler
   * @param message Hata mesajı
   * @param error Hata nesnesi (opsiyonel)
   */
  error(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    const errorDetails = error ? ` - ${error.message || JSON.stringify(error)}` : '';
    const formattedMessage = `[${timestamp}] ERROR: ${message}${errorDetails}`;
    this.logMessages.push(formattedMessage);
    console.error(`Migration Error: ${message}`, error || '');
  }
  
  /**
   * Uyarı mesajı ekler
   * @param message Uyarı mesajı
   */
  warn(message: string): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] WARNING: ${message}`;
    this.logMessages.push(formattedMessage);
    console.warn(`Migration Warning: ${message}`);
  }
  
  /**
   * Tüm log mesajlarını getirir
   * @returns Log mesajları dizisi
   */
  getLogs(): string[] {
    return [...this.logMessages];
  }
  
  /**
   * Tüm log mesajlarını temizler
   */
  clearLogs(): void {
    this.logMessages = [];
  }
  
  /**
   * Tüm log mesajlarını toplu bir metin olarak döndürür
   * @returns Metin formatında tüm loglar
   */
  getAllLogsAsText(): string {
    return this.logMessages.join('\n');
  }
}

// Singleton instance
export const migrationLogger = new MigrationLogger();