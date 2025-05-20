import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Tarihi formatlar (GG.AA.YYYY)
 */
export function formatDate(date: Date | string, includeTime: boolean = false): string {
  if (!date) return "";
  
  const d = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return "";
  }
  
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  
  let formattedDate = `${day}.${month}.${year}`;
  
  if (includeTime) {
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    formattedDate += ` ${hours}:${minutes}`;
  }
  
  return formattedDate;
}

/**
 * Türkçe ay isimlerini kullanarak tarihi formatlar (ör: 5 Mayıs 2025)
 */
export function formatDateWithMonthName(date: Date | string): string {
  if (!date) return "";
  
  const d = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return "";
  }
  
  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];
  
  const day = d.getDate();
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  
  return `${day} ${month} ${year}`;
}

/**
 * Para birimi formatı
 */
export function formatCurrency(amount: number, locale: string = "tr-TR", currency: string = "TRY"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Yüzde formatı
 */
export function formatPercentage(value: number, digits: number = 1): string {
  return `%${value.toFixed(digits)}`;
}

/**
 * Sayı formatı
 */
export function formatNumber(number: number, digits: number = 2): string {
  return number.toLocaleString("tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}