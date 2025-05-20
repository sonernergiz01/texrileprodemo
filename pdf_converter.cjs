const fs = require('fs');
const path = require('path');

// Markdown dosyasını oku
const markdownContent = fs.readFileSync('Tekstil_ERP_Sistemi_Siparis_Sevkiyat.md', 'utf8');

// HTML başlangıç ve bitiş etiketleri
const htmlStart = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tekstil ERP Sistemi Siparişten Sevkiyata</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #2980b9;
            margin-top: 30px;
        }
        h3 {
            color: #3498db;
        }
        img {
            max-width: 100%;
            height: auto;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 5px;
            margin: 10px 0;
        }
        p {
            margin: 15px 0;
        }
        ul, ol {
            margin-left: 20px;
        }
        li {
            margin-bottom: 5px;
        }
        .page-break {
            page-break-after: always;
        }
        blockquote {
            border-left: 3px solid #3498db;
            padding-left: 15px;
            color: #7f8c8d;
        }
    </style>
</head>
<body>
`;

const htmlEnd = `
</body>
</html>
`;

// Markdown'ı HTML'e dönüştürme (basit bir dönüşüm)
let htmlContent = markdownContent
    // H1 başlıklar
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // H2 başlıklar
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    // H3 başlıklar
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // Kalın metin
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // İtalik metin
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Listeleme öğeleri
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Liste başlangıcı ve sonu
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    // Yatay çizgi
    .replace(/^---$/gm, '<hr>')
    // Paragraflar (boş satırla ayrılan metinler)
    .replace(/^(?!<h|<ul|<li|<hr)(.+)$/gm, '<p>$1</p>')
    // Görsel bağlantıları
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">')
    // Sayı listesi öğeleri
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Sayı listesi başlangıcı ve sonu
    .replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');

// HTML dosyasını oluştur
const htmlContent1 = htmlStart + htmlContent + htmlEnd;
fs.writeFileSync('Tekstil_ERP_Sistemi_Siparis_Sevkiyat.html', htmlContent1, 'utf8');

console.log('HTML dosyası oluşturuldu: Tekstil_ERP_Sistemi_Siparis_Sevkiyat.html');