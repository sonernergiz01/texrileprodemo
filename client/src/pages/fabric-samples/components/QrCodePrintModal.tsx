import React, { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useReactToPrint } from "react-to-print";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Save, Copy, Share2, Download } from "lucide-react";

interface QrCodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    id: number;
    title: string;
    code: string;
    qrData: string;
    additionalFields?: Record<string, string>;
    multipleMode?: boolean;
    selectedCount?: number;
    selectedIds?: number[];
  };
  type: "kartela" | "fabric" | "order";
}

export const QrCodePrintModal: React.FC<QrCodePrintModalProps> = ({
  isOpen,
  onClose,
  data,
  type
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [copies, setCopies] = useState(1);
  const [printSize, setPrintSize] = useState("medium");
  const [printFormat, setPrintFormat] = useState("standard");
  
  // Print the QR code
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `${type}-${data.code}-qrcode`,
    onAfterPrint: () => {
      toast({
        title: "Baskı tamamlandı",
        description: "QR kod etiketi başarıyla yazdırıldı.",
      });
      
      // Log print action to the server
      saveQrPrintMutation.mutate({
        entityId: data.id,
        entityType: type,
        copies: copies,
        printFormat: printFormat,
        printSize: printSize,
        uniqueId: data.qrData.split(':')[3] || uuidv4().substring(0, 8)
      });
    },
    onPrintError: () => {
      toast({
        title: "Baskı hatası",
        description: "QR kod yazdırılırken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
  
  // Save print log to database
  const saveQrPrintMutation = useMutation({
    mutationFn: async (printData: any) => {
      const response = await apiRequest(
        "POST",
        "/api/labels/print-logs",
        printData
      );
      return await response.json();
    },
    onError: () => {
      // Just log the error, don't show toast as the print might still succeed
      console.error("Failed to log print action");
    },
  });
  
  // Generate QR code data URL for download
  const handleDownloadQrCode = () => {
    const svg = document.getElementById("qrcode-svg");
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      
      // Download the PNG
      const downloadLink = document.createElement("a");
      downloadLink.download = `${type}-${data.code}-qrcode.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      
      toast({
        title: "QR kod indirildi",
        description: "QR kod PNG olarak kaydedildi.",
      });
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };
  
  // Copy QR code data to clipboard
  const handleCopyQrData = () => {
    navigator.clipboard.writeText(data.qrData)
      .then(() => {
        toast({
          title: "Kopyalandı",
          description: "QR kod verisi panoya kopyalandı.",
        });
      })
      .catch(() => {
        toast({
          title: "Kopyalama hatası",
          description: "QR kod verisi kopyalanırken bir hata oluştu.",
          variant: "destructive",
        });
      });
  };
  
  // Size classes based on selected size
  const sizeClasses = {
    small: "w-32 h-32", // Small label size
    medium: "w-44 h-44", // Medium label size (default)
    large: "w-56 h-56", // Large label size
  };
  
  // Get additional fields for the item
  const getAdditionalFieldElements = () => {
    if (!data.additionalFields) return null;
    
    return Object.entries(data.additionalFields).map(([key, value]) => (
      <div key={key} className="flex justify-between text-xs">
        <span className="font-medium">{key}:</span>
        <span>{value}</span>
      </div>
    ));
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>QR Kod Yazdırma</DialogTitle>
          <DialogDescription>
            {data.multipleMode 
              ? `${data.selectedCount} adet öğe için QR kod yazdırma ayarları` 
              : `"${data.title}" için QR kod etiketi oluşturun ve yazdırın`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* QR Code Preview */}
          <div className="border rounded-lg p-6 flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold mb-4">Önizleme</h3>
            <div ref={printRef} className="flex flex-col items-center justify-center">
              <div className={`print-wrapper ${printFormat === "standard" ? "border border-gray-200 rounded p-4" : ""}`}>
                {/* Title is shown for standard format only */}
                {printFormat === "standard" && (
                  <div className="text-center mb-2">
                    <div className="font-bold text-sm">{data.title}</div>
                    <div className="text-xs text-gray-500">{data.code}</div>
                  </div>
                )}
                
                {/* QR Code */}
                <div className={`qr-code flex justify-center ${sizeClasses[printSize as keyof typeof sizeClasses] || sizeClasses.medium}`}>
                  <QRCodeSVG 
                    id="qrcode-svg"
                    value={data.qrData}
                    size={printSize === "small" ? 120 : printSize === "medium" ? 160 : 200}
                    level="H" // High error correction
                    includeMargin={true}
                  />
                </div>
                
                {/* Additional fields are shown for standard format only */}
                {printFormat === "standard" && (
                  <div className="mt-2 space-y-1 w-full text-center">
                    {getAdditionalFieldElements()}
                  </div>
                )}
              </div>
            </div>
            
            {data.multipleMode && (
              <div className="mt-4 text-center text-sm text-gray-500">
                <p>Bu önizleme, seçilen öğelerden ilki için gösterilmektedir.</p>
                <p>Yazdırma işleminde tüm seçili öğeler ({data.selectedCount} adet) için etiket oluşturulacaktır.</p>
              </div>
            )}
          </div>
          
          {/* Controls */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <Label htmlFor="size">Etiket Boyutu</Label>
                <Select 
                  value={printSize}
                  onValueChange={setPrintSize}
                >
                  <SelectTrigger id="size">
                    <SelectValue placeholder="Etiket boyutu seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Küçük (32 x 32 mm)</SelectItem>
                    <SelectItem value="medium">Orta (44 x 44 mm)</SelectItem>
                    <SelectItem value="large">Büyük (56 x 56 mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="format">Etiket Formatı</Label>
                <Select 
                  value={printFormat}
                  onValueChange={setPrintFormat}
                >
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Etiket formatı seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standart (Başlıklı ve Bilgili)</SelectItem>
                    <SelectItem value="minimal">Minimal (Sadece QR Kod)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="copies">Kopya Sayısı</Label>
                  <Input 
                    id="copies"
                    type="number"
                    min={1}
                    max={100}
                    value={copies}
                    onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                  />
                </div>
                
                <div>
                  <Label>Veri Tipi</Label>
                  <Badge className="mt-2 block w-fit">
                    {type === "kartela" ? "Kartela" : 
                     type === "fabric" ? "Kumaş Örneği" : "Sipariş"}
                  </Badge>
                </div>
              </div>
              
              <div className="pt-4 grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleCopyQrData}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  QR Veriyi Kopyala
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleDownloadQrCode}
                >
                  <Download className="h-4 w-4 mr-2" />
                  QR Kodu İndir
                </Button>
              </div>
            </div>
            
            <DialogFooter className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={onClose}>
                İptal
              </Button>
              <Button 
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Printer className="h-4 w-4 mr-2" />
                Yazdır ({copies} kopya)
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};