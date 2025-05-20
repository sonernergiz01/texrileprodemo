/**
 * Belirtilen uzunlukta benzersiz bir sayısal ID oluşturur
 * @param length Oluşturulacak ID'nin uzunluğu
 * @returns Rastgele sayısal ID
 */
export function generateUniqueId(length: number = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

/**
 * Belirtilen prefix'e sahip, belirtilen uzunlukta benzersiz bir kod oluşturur
 * @param prefix Kodun ön eki
 * @param length Sayısal bölümün uzunluğu
 * @returns Prefix + rastgele sayısal kod
 */
export function generateUniqueCode(prefix: string, length: number = 6): string {
  return `${prefix}${generateUniqueId(length)}`;
}

/**
 * Belirtilen uzunlukta alfa-numerik ID oluşturur
 * @param length Oluşturulacak ID'nin uzunluğu
 * @returns Rastgele alfa-numerik ID
 */
export function generateAlphaNumericId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Timestamp tabanlı benzersiz bir ID oluşturur
 * @returns Timestamp + rastgele sayılar
 */
export function generateTimestampId(): string {
  return `${Date.now()}${generateUniqueId(4)}`;
}

/**
 * Belirtilen formatta bir barkod oluşturur
 * @param prefix Barkodun ön eki
 * @param entityId Ana ID 
 * @param length Ek rastgele sayı uzunluğu
 * @returns Formatlanmış barkod
 */
export function generateBarcode(prefix: string, entityId: number, length: number = 4): string {
  return `${prefix}${entityId.toString().padStart(5, '0')}${generateUniqueId(length)}`;
}