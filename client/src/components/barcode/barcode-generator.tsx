import React, { useState, useEffect } from 'react';
import Barcode from 'react-barcode';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { generateBarcodeValue } from '@/lib/barcode-service';
import { Printer, Download, Copy, RefreshCw } from 'lucide-react';

interface BarcodeGeneratorProps {
  title?: string;
  value?: string;
  prefix?: string;
  entityId?: number;
  onPrint?: (barcodeValue: string, barcodeType: 'code128' | 'qrcode') => void;
  description?: string;
}

export function BarcodeGenerator({
  title = 'Barkod Oluşturucu',
  value,
  prefix = 'TXT',
  entityId = 1,
  onPrint,
  description = 'Barkod veya QR kod oluşturun ve yazdırın',
}: BarcodeGeneratorProps) {
  const [barcodeValue, setBarcodeValue] = useState(value || '');
  const [barcodeType, setBarcodeType] = useState<'code128' | 'qrcode'>('code128');

  useEffect(() => {
    // Eğer barkod değeri yoksa otomatik oluştur
    if (!barcodeValue) {
      generateNewBarcode();
    }
  }, []);

  // Yeni barkod oluştur
  const generateNewBarcode = () => {
    const newValue = generateBarcodeValue(prefix, entityId);
    setBarcodeValue(newValue);
  };

  // Barkodu kopyala
  const copyToClipboard = () => {
    navigator.clipboard.writeText(barcodeValue).then(
      () => {
        console.log('Barkod değeri kopyalandı');
      },
      (err) => {
        console.error('Kopyalama hatası:', err);
      },
    );
  };

  // Barkodu yazdır
  const handlePrint = () => {
    if (onPrint) {
      onPrint(barcodeValue, barcodeType);
    } else {
      // Doğrudan yazdırma işlevi
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Barkod Yazdır</title>');
        printWindow.document.write('<style>body { font-family: Arial; text-align: center; }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(`<h3>${title}</h3>`);
        printWindow.document.write('<div id="print-content">');
        
        if (barcodeType === 'code128') {
          printWindow.document.write(`<svg id="barcode"></svg>`);
          printWindow.document.write(`<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>`);
          printWindow.document.write(`<script>JsBarcode("#barcode", "${barcodeValue}", {format: "CODE128"});</script>`);
        } else {
          printWindow.document.write(`<div id="qrcode" style="margin: 20px auto;"></div>`);
          printWindow.document.write(`<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>`);
          printWindow.document.write(`<script>QRCode.toCanvas(document.getElementById('qrcode'), "${barcodeValue}", {width: 200, margin: 2});</script>`);
        }
        
        printWindow.document.write(`<p>${barcodeValue}</p>`);
        printWindow.document.write('</div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  // Barkodu indir
  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      console.error('Canvas context alınamadı');
      return;
    }
    
    // Canvas boyutunu ayarla
    canvas.width = 400;
    canvas.height = 200;
    
    // Arka planı beyaz yap
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Başlık ekle
    context.fillStyle = 'black';
    context.font = '16px Arial';
    context.textAlign = 'center';
    context.fillText(title, canvas.width / 2, 30);
    
    // QR kod için canvas oluştur
    if (barcodeType === 'qrcode') {
      // QRCodeSVG yerine doğrudan qrcode kütüphanesini kullanıyoruz
      // Not: qrcode.react QRCodeSVG bileşeni canvas değil SVG üretiyor
      const QRCode = require('qrcode');
      const qrCanvas = document.createElement('canvas');
      QRCode.toCanvas(qrCanvas, barcodeValue, { width: 150 });
      
      // QR kodu ana canvas'a yerleştir
      context.drawImage(qrCanvas, 125, 40, 150, 150);
    } else {
      // Barcode çizmek için JsBarcode kullan, ama bu client-side dır ve canvas ile birleştirmek
      // Karmaşık olabilir, gerçek implementasyonda üçüncü taraf bir kütüphane kullanılabilir
      context.font = '14px "Courier New", monospace';
      context.fillText('Barcode: ' + barcodeValue, canvas.width / 2, 100);
    }
    
    // Dosyayı indir
    const link = document.createElement('a');
    link.download = `${barcodeType === 'qrcode' ? 'qr-code' : 'barcode'}-${barcodeValue}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="code128" onValueChange={(value) => setBarcodeType(value as 'code128' | 'qrcode')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="code128">Barkod</TabsTrigger>
            <TabsTrigger value="qrcode">QR Kod</TabsTrigger>
          </TabsList>
          <TabsContent value="code128" className="mt-4 flex justify-center">
            <div className="text-center">
              <Barcode value={barcodeValue} />
            </div>
          </TabsContent>
          <TabsContent value="qrcode" className="mt-4 flex justify-center">
            <QRCode value={barcodeValue} size={200} />
          </TabsContent>
        </Tabs>

        <div className="mt-6 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="barcodeValue">Barkod Değeri</Label>
            <div className="flex space-x-2">
              <Input
                id="barcodeValue"
                value={barcodeValue}
                onChange={(e) => setBarcodeValue(e.target.value)}
                placeholder="Barkod değeri girin"
              />
              <Button variant="outline" size="icon" onClick={generateNewBarcode} title="Yeni barkod değeri oluştur">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={copyToClipboard}>
          <Copy className="mr-2 h-4 w-4" />
          Kopyala
        </Button>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            İndir
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Yazdır
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}