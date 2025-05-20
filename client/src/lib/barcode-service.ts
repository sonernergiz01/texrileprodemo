/**
 * Barkod ve QR Kod Oluşturma Servisi
 * 
 * Bu servis, çeşitli departmanlar için barkod ve QR kod oluşturma işlemlerini sağlar.
 * jspdf, react-barcode ve qrcode kütüphanelerini kullanır.
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';

// Barkod tipi
export type BarcodeType = 'code128' | 'ean13' | 'qrcode' | 'datamatrix' | 'code39';

// Etiket verileri
export interface LabelData {
  title: string;
  barcodeValue: string;
  barcodeType: BarcodeType;
  fields: Record<string, string | number>;
  departmentName: string;
  departmentColor: string;
  logoText?: string;
  notes?: string;
}

/**
 * QR Kod verisi oluşturur
 * @param data QR Kod içeriği
 * @param options QR Kod seçenekleri
 * @returns Promise<string> Base64 formatında QR Kod verisi
 */
export async function generateQRCode(data: string, options = { width: 200 }): Promise<string> {
  try {
    return await QRCode.toDataURL(data, options);
  } catch (error) {
    console.error('QR Kod oluşturulamadı:', error);
    throw new Error('QR Kod oluşturulamadı: ' + error);
  }
}

/**
 * Barkod verisini PNG olarak döndürür (önizleme için)
 * Bu işlev doğrudan react-barcode komponenti ile yapılır, burada sadece bir yardımcı işlevdir
 */
export function getBarcodePreview(value: string, type: BarcodeType): string {
  // Not: Gerçek barkod görüntüleme react-barcode komponenti ile yapılır
  return `Barkod Önizleme: ${value} (${type})`;
}

/**
 * PDF etiket oluşturur
 * @param labelData Etiket verileri
 * @returns Promise<string> PDF belgesinin Base64 formatında veri URL'si
 */
export async function generateLabelPDF(labelData: LabelData): Promise<string> {
  const { title, barcodeValue, barcodeType, fields, departmentName, departmentColor, logoText, notes } = labelData;
  
  // A6 boyutunda yatay PDF oluştur
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a6'
  });
  
  // Başlık alanı
  doc.setFillColor(departmentColor || '#3b82f6');
  doc.rect(0, 0, doc.internal.pageSize.width, 12, 'F');
  
  // Başlık metni
  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title.toUpperCase(), doc.internal.pageSize.width / 2, 7, { align: 'center' });
  
  // Logo/şirket adı
  doc.setTextColor('#333333');
  doc.setFontSize(8);
  doc.text(logoText || 'TEKSTİL ERP SİSTEMİ', 5, 18);
  
  // Departman bilgisi
  doc.setFontSize(10);
  doc.text(`Departman: ${departmentName}`, 5, 25);
  
  // Barkod alanı - QR kod için QRCODE JS üzerinden base64 al
  if (barcodeType === 'qrcode') {
    try {
      const qrDataUrl = await QRCode.toDataURL(barcodeValue, { width: 100 });
      doc.addImage(qrDataUrl, 'PNG', doc.internal.pageSize.width - 45, 20, 35, 35);
    } catch (error) {
      console.error('QR Kod oluşturulamadı:', error);
    }
  } else {
    // Not: Gerçek PDF'te barkod görüntüsü eklenmesi gerekir
    // PDF'te Code128 gibi barkodlar için jspdf-plugin-barcode gibi eklentiler kullanılabilir
    doc.setFontSize(7);
    doc.text(`BARKOD: ${barcodeValue}`, doc.internal.pageSize.width - 45, 35, { align: 'center' });
    doc.setFontSize(5);
    doc.text(`(API yazdırma için barkod tipini kullanır: ${barcodeType})`, doc.internal.pageSize.width - 45, 40, { align: 'center' });
  }
  
  // Alanlar tablosu
  const tableData = Object.entries(fields).map(([key, value]) => [key, value.toString()]);
  (doc as any).autoTable({
    startY: 35,
    head: [['Alan', 'Değer']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [220, 220, 220], textColor: [50, 50, 50] },
    margin: { left: 5, right: 50 },
    tableWidth: doc.internal.pageSize.width - 55,
  });
  
  // Not alanı
  if (notes) {
    const currentY = (doc as any).lastAutoTable.finalY + 5;
    doc.setFontSize(8);
    doc.text(`Notlar: ${notes}`, 5, currentY);
  }
  
  // PDF'i base64 olarak döndür
  return doc.output('dataurlstring');
}

/**
 * Barkod değeri oluşturur (benzersiz)
 * @param prefix Barkod ön eki (departmana göre değişir)
 * @param id Ürün/sipariş/kumaş kimliği
 * @param date Tarih (veya şu anki zaman)
 * @returns string Barkod değeri
 */
export function generateBarcodeValue(prefix: string, id: number, date = new Date()): string {
  const timestamp = date.getTime().toString().slice(-8); // Son 8 hane
  const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${id}-${timestamp}-${randomDigits}`;
}

/**
 * Etiket verilerini API'ye gönderir ve yazdırma işlemini başlatır
 * @param labelData Etiket verileri
 * @param labelTypeId Etiket tipi kimliği
 * @param entityId İlgili varlık kimliği (sipariş, kumaş, iplik, vb.)
 * @param entityType İlgili varlık tipi ('order', 'fabric', 'yarn', vb.)
 * @returns Promise<boolean> İşlem başarılı ise true döner
 */
export async function printLabel(
  labelData: LabelData,
  labelTypeId: number,
  entityId: number,
  entityType: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/labels/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        labelTypeId,
        entityId,
        entityType,
        barcodeType: labelData.barcodeType,
        barcodeValue: labelData.barcodeValue,
        printData: labelData
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Yazdırma isteği başarısız: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Etiket yazdırma hatası:', error);
    return false;
  }
}

/**
 * İplik depo etiketi oluşturur
 * @param yarnData İplik verileri
 * @returns Promise<string> PDF belgesinin Base64 formatında veri URL'si
 */
export async function generateYarnDepotLabel(yarnData: {
  id: number;
  yarnCode: string;
  yarnType: string;
  yarnCount: string;
  color: string;
  weight: number;
  supplier: string;
  arrivalDate: Date;
  lotNumber: string;
  notes?: string;
}): Promise<string> {
  const barcodeValue = generateBarcodeValue('YRN', yarnData.id);
  
  const labelData: LabelData = {
    title: 'İPLİK DEPO ETİKETİ',
    barcodeValue,
    barcodeType: 'code128',
    departmentName: 'İplik Depo',
    departmentColor: '#F97316', // Turuncu
    fields: {
      'İplik Kodu': yarnData.yarnCode,
      'İplik Türü': yarnData.yarnType,
      'Numara': yarnData.yarnCount,
      'Renk': yarnData.color,
      'Ağırlık': `${yarnData.weight} kg`,
      'Tedarikçi': yarnData.supplier,
      'Geliş Tarihi': new Date(yarnData.arrivalDate).toLocaleDateString('tr-TR'),
      'Lot No': yarnData.lotNumber
    },
    notes: yarnData.notes
  };
  
  return await generateLabelPDF(labelData);
}

/**
 * Dokuma kumaş etiketi oluşturur
 * @param fabricData Kumaş verileri
 * @returns Promise<string> PDF belgesinin Base64 formatında veri URL'si
 */
export async function generateWeavingFabricLabel(fabricData: {
  id: number;
  fabricCode: string;
  fabricType: string;
  width: number;
  length: number;
  machineId: number;
  machineName: string;
  operatorId: number;
  operatorName: string;
  productionDate: Date;
  notes?: string;
}): Promise<string> {
  const barcodeValue = generateBarcodeValue('WVF', fabricData.id);
  
  const labelData: LabelData = {
    title: 'DOKUMA KUMAŞ ETİKETİ',
    barcodeValue,
    barcodeType: 'code128',
    departmentName: 'Dokuma',
    departmentColor: '#F97316', // Turuncu
    fields: {
      'Kumaş Kodu': fabricData.fabricCode,
      'Kumaş Tipi': fabricData.fabricType,
      'En': `${fabricData.width} cm`,
      'Boy': `${fabricData.length} m`,
      'Makine': fabricData.machineName,
      'Operatör': fabricData.operatorName,
      'Üretim Tarihi': new Date(fabricData.productionDate).toLocaleDateString('tr-TR')
    },
    notes: fabricData.notes
  };
  
  return await generateLabelPDF(labelData);
}

/**
 * Ham kalite kontrol etiketi oluşturur
 * @param rawQualityData Ham kalite verileri
 * @returns Promise<string> PDF belgesinin Base64 formatında veri URL'si
 */
export async function generateRawQualityLabel(rawQualityData: {
  id: number;
  fabricCode: string;
  fabricType: string;
  rollNumber: string;
  width: number;
  length: number;
  weight: number;
  inspectionDate: Date;
  inspectorId: number;
  inspectorName: string;
  status: string;
  notes?: string;
}): Promise<string> {
  const barcodeValue = generateBarcodeValue('RQL', rawQualityData.id);
  
  const labelData: LabelData = {
    title: 'HAM KALİTE KONTROL ETİKETİ',
    barcodeValue,
    barcodeType: 'code128',
    departmentName: 'Ham Kalite',
    departmentColor: '#EF4444', // Kırmızı
    fields: {
      'Kumaş Kodu': rawQualityData.fabricCode,
      'Kumaş Tipi': rawQualityData.fabricType,
      'Top No': rawQualityData.rollNumber,
      'En': `${rawQualityData.width} cm`,
      'Boy': `${rawQualityData.length} m`,
      'Ağırlık': `${rawQualityData.weight} kg`,
      'Kontrol Tarihi': new Date(rawQualityData.inspectionDate).toLocaleDateString('tr-TR'),
      'Kontrolcü': rawQualityData.inspectorName,
      'Durum': rawQualityData.status
    },
    notes: rawQualityData.notes
  };
  
  return await generateLabelPDF(labelData);
}

/**
 * Refakat kartı oluşturur
 * @param productionCardData Üretim kartı verileri
 * @returns Promise<string> PDF belgesinin Base64 formatında veri URL'si
 */
export async function generateProductionCardLabel(productionCardData: {
  id: number;
  orderNumber: string;
  planNo: string;
  fabricType: string;
  quantity: number;
  unit: string;
  startDate: Date;
  endDate: Date;
  currentStep: string;
  priority: string;
  notes?: string;
}): Promise<string> {
  const barcodeValue = generateBarcodeValue('PRD', productionCardData.id);
  
  const labelData: LabelData = {
    title: 'ÜRETİM REFAKAT KARTI',
    barcodeValue,
    barcodeType: 'qrcode', // Refakat kartı için QR kod kullan
    departmentName: 'Üretim',
    departmentColor: '#10B981', // Yeşil
    fields: {
      'Sipariş No': productionCardData.orderNumber,
      'Plan No': productionCardData.planNo,
      'Kumaş Tipi': productionCardData.fabricType,
      'Miktar': `${productionCardData.quantity} ${productionCardData.unit}`,
      'Başlangıç': new Date(productionCardData.startDate).toLocaleDateString('tr-TR'),
      'Bitiş': new Date(productionCardData.endDate).toLocaleDateString('tr-TR'),
      'Mevcut Adım': productionCardData.currentStep,
      'Öncelik': productionCardData.priority
    },
    notes: productionCardData.notes
  };
  
  return await generateLabelPDF(labelData);
}

/**
 * Kartela etiketi oluşturur
 * @param sampleCardData Numune kartı verileri
 * @returns Promise<string> PDF belgesinin Base64 formatında veri URL'si
 */
export async function generateSampleCardLabel(sampleCardData: {
  id: number;
  sampleCode: string;
  customerName: string;
  fabricType: string;
  color: string;
  width: number;
  creationDate: Date;
  createdBy: string;
  status: string;
  notes?: string;
}): Promise<string> {
  const barcodeValue = generateBarcodeValue('SMP', sampleCardData.id);
  
  const labelData: LabelData = {
    title: 'KARTELA ETİKETİ',
    barcodeValue,
    barcodeType: 'qrcode',
    departmentName: 'Kartela',
    departmentColor: '#8B5CF6', // Mor
    fields: {
      'Numune Kodu': sampleCardData.sampleCode,
      'Müşteri': sampleCardData.customerName,
      'Kumaş Tipi': sampleCardData.fabricType,
      'Renk': sampleCardData.color,
      'En': `${sampleCardData.width} cm`,
      'Oluşturma Tarihi': new Date(sampleCardData.creationDate).toLocaleDateString('tr-TR'),
      'Oluşturan': sampleCardData.createdBy,
      'Durum': sampleCardData.status
    },
    notes: sampleCardData.notes
  };
  
  return await generateLabelPDF(labelData);
}

/**
 * Kumaş depo etiketi oluşturur
 * @param fabricStockData Kumaş depo verileri
 * @returns Promise<string> PDF belgesinin Base64 formatında veri URL'si
 */
export async function generateFabricStockLabel(fabricStockData: {
  id: number;
  fabricCode: string;
  fabricType: string;
  rollNumber: string;
  width: number;
  length: number;
  weight: number;
  color: string;
  quality: string;
  location: string;
  entryDate: Date;
  notes?: string;
}): Promise<string> {
  const barcodeValue = generateBarcodeValue('STK', fabricStockData.id);
  
  const labelData: LabelData = {
    title: 'KUMAŞ DEPO ETİKETİ',
    barcodeValue,
    barcodeType: 'code128',
    departmentName: 'Kumaş Depo',
    departmentColor: '#F59E0B', // Amber
    fields: {
      'Kumaş Kodu': fabricStockData.fabricCode,
      'Kumaş Tipi': fabricStockData.fabricType,
      'Top No': fabricStockData.rollNumber,
      'En': `${fabricStockData.width} cm`,
      'Boy': `${fabricStockData.length} m`,
      'Ağırlık': `${fabricStockData.weight} kg`,
      'Renk': fabricStockData.color,
      'Kalite': fabricStockData.quality,
      'Lokasyon': fabricStockData.location,
      'Giriş Tarihi': new Date(fabricStockData.entryDate).toLocaleDateString('tr-TR')
    },
    notes: fabricStockData.notes
  };
  
  return await generateLabelPDF(labelData);
}

/**
 * Kalite kontrol etiketi oluşturur
 * @param qualityData Kalite kontrol verileri
 * @returns Promise<string> PDF belgesinin Base64 formatında veri URL'si
 */
export async function generateQualityControlLabel(qualityData: {
  id: number;
  fabricCode: string;
  fabricType: string;
  rollNumber: string;
  inspectionDate: Date;
  inspector: string;
  quality: string;
  defectPoints: number;
  grade: string;
  width: number;
  length: number;
  weight: number;
  notes?: string;
}): Promise<string> {
  const barcodeValue = generateBarcodeValue('QCL', qualityData.id);
  
  const labelData: LabelData = {
    title: 'KALİTE KONTROL ETİKETİ',
    barcodeValue,
    barcodeType: 'code128',
    departmentName: 'Kalite Kontrol',
    departmentColor: '#EF4444', // Kırmızı
    fields: {
      'Kumaş Kodu': qualityData.fabricCode,
      'Kumaş Tipi': qualityData.fabricType,
      'Top No': qualityData.rollNumber,
      'Kontrol Tarihi': new Date(qualityData.inspectionDate).toLocaleDateString('tr-TR'),
      'Kontrolcü': qualityData.inspector,
      'Kalite': qualityData.quality,
      'Kusur Puanı': qualityData.defectPoints.toString(),
      'Kalite Sınıfı': qualityData.grade,
      'En': `${qualityData.width} cm`,
      'Boy': `${qualityData.length} m`,
      'Ağırlık': `${qualityData.weight} kg`
    },
    notes: qualityData.notes
  };
  
  return await generateLabelPDF(labelData);
}