import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Dinamik olarak etiket şablonundan PDF oluşturur
 * 
 * @param templateString Etiket şablonu (HTML/Metin)
 * @param data PDF içinde kullanılacak veriler
 * @returns PDF içeriği (Buffer)
 */
export async function generatePDF(templateString: string, data: any): Promise<Buffer> {
  // Şablonu verilerle doldur
  const content = parseTemplate(templateString, data);
  
  // PDF oluştur
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // PDF'e içerik ekle
  const margin = 10; // 10mm kenar boşluğu
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Adet kadar etiketi oluştur
  const quantity = data.quantity || 1;
  
  // Etiket boyutları (varsayılan boyut)
  const labelWidth = data.labelWidth || 90; // mm
  const labelHeight = data.labelHeight || 50; // mm
  
  // Sayfa başına sığacak etiket sayısı
  const labelsPerRow = Math.floor((pageWidth - margin * 2) / labelWidth);
  const labelsPerCol = Math.floor((pageHeight - margin * 2) / labelHeight);
  const labelsPerPage = labelsPerRow * labelsPerCol;
  
  // Gerekli sayfa sayısı
  const totalPages = Math.ceil(quantity / labelsPerPage);
  
  // Veri içinde barkod varsa ekle
  const barcodeWidth = 40; // mm
  const barcodeHeight = 40; // mm
  
  let etiketSayisi = 0;
  
  for (let pageNum = 0; pageNum < totalPages; pageNum++) {
    if (pageNum > 0) {
      doc.addPage();
    }
    
    for (let row = 0; row < labelsPerCol; row++) {
      for (let col = 0; col < labelsPerRow; col++) {
        etiketSayisi++;
        
        if (etiketSayisi > quantity) {
          break;
        }
        
        // Etiketin sol üst köşesi
        const x = margin + col * labelWidth;
        const y = margin + row * labelHeight;
        
        // Etiket çerçevesi (isteğe bağlı)
        if (data.showBorder) {
          doc.rect(x, y, labelWidth, labelHeight, 'S');
        }
        
        // Etiket içeriğini ekle
        doc.setFontSize(10);
        
        // Başlık
        if (data.title) {
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text(data.title, x + 5, y + 7);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(10);
        }
        
        // Barkod
        if (data.barcodeUrl) {
          const barcodeX = x + labelWidth - barcodeWidth - 5;
          const barcodeY = y + 5;
          doc.addImage(data.barcodeUrl, 'PNG', barcodeX, barcodeY, barcodeWidth, barcodeHeight);
        }
        
        // Diğer bilgileri ekle (key: value formatında)
        let textY = y + (data.title ? 15 : 7);
        const textX = x + 5;
        
        // Ana alan tipleri
        const mainFields = ['barcode', 'id', 'code', 'name', 'type'];
        const primaryFields = [];
        const secondaryFields = [];
        
        // Veri alanlarını gruplayalım
        for (const [key, value] of Object.entries(data)) {
          if (key === 'barcodeUrl' || key === 'title' || key === 'quantity' || key === 'labelWidth' || key === 'labelHeight' || key === 'showBorder') {
            continue; // Bu alanlar meta-veridir, etikette gösterilmez
          }
          
          if (mainFields.includes(key)) {
            primaryFields.push({ key, value });
          } else {
            secondaryFields.push({ key, value });
          }
        }
        
        // Ana alanları ekle
        for (const field of primaryFields) {
          if (field.key === 'barcode' && data.barcodeUrl) {
            continue; // Barkodu zaten gösteriyoruz
          }
          
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.text(`${capitalizeFirstLetter(field.key)}: `, textX, textY);
          doc.setFont(undefined, 'normal');
          doc.text(`${field.value}`, textX + 20, textY);
          textY += 5;
        }
        
        // İkincil alanları ekle
        for (const field of secondaryFields) {
          if (typeof field.value === 'object') continue; // Objeleri atla
          
          doc.setFontSize(8);
          doc.setFont(undefined, 'bold');
          doc.text(`${capitalizeFirstLetter(field.key)}: `, textX, textY);
          doc.setFont(undefined, 'normal');
          doc.text(`${field.value}`, textX + 20, textY);
          textY += 4;
        }
      }
    }
  }
  
  // PDF içeriğini Buffer olarak döndür
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

/**
 * Şablonu veriler ile doldurur
 * 
 * @param template Şablon
 * @param data Veriler
 * @returns Doldurulmuş şablon
 */
function parseTemplate(template: string, data: any): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    }
  }
  return result;
}

/**
 * İlk harfi büyük yap
 */
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}