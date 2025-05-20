import * as React from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

interface BarcodePrintButtonProps {
  data: string;
  title?: string;
  description?: string;
  additionalInfo?: {
    label: string;
    value: string;
  }[];
  className?: string;
  printSize?: "small" | "medium" | "large";
  barcodeType?: "barcode" | "qrcode";
  withTitle?: boolean;
}

export function BarcodePrintButton({
  data,
  title = "Barkod Yazdır",
  description = "",
  additionalInfo = [],
  className,
  printSize = "medium",
  barcodeType = "barcode",
  withTitle = true,
}: BarcodePrintButtonProps) {
  const [open, setOpen] = React.useState(false);
  const printRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = React.useCallback(() => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const originalContents = document.body.innerHTML;

      const printStyles = `
        @page {
          size: ${printSize === "small" ? "80mm 40mm" : printSize === "medium" ? "100mm 60mm" : "100%"};
          margin: 5mm;
        }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .print-container {
          width: 100%;
          max-width: ${printSize === "small" ? "70mm" : printSize === "medium" ? "90mm" : "100%"};
          padding: 3mm;
        }
        .title {
          font-size: ${printSize === "small" ? "10pt" : "12pt"};
          font-weight: bold;
          margin-bottom: 2mm;
          text-align: center;
        }
        .description {
          font-size: ${printSize === "small" ? "8pt" : "10pt"};
          margin-bottom: 2mm;
          text-align: center;
        }
        .barcode-container {
          text-align: center;
          margin: 3mm 0;
        }
        .barcode-text {
          font-size: ${printSize === "small" ? "8pt" : "10pt"};
          margin-top: 1mm;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1mm;
          font-size: ${printSize === "small" ? "7pt" : "9pt"};
        }
        .info-label {
          font-weight: bold;
        }
      `;

      document.body.innerHTML = `
        <style>${printStyles}</style>
        <div class="print-container">
          ${printContents}
        </div>
      `;

      setTimeout(() => {
        window.print();
        document.body.innerHTML = originalContents;
        toast({
          title: "Barkod yazdırılıyor",
          description: "Lütfen yazıcınızın açık olduğundan emin olun."
        });
      }, 500);
    }
  }, [printSize]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn("flex items-center gap-1", className)}
        onClick={() => setOpen(true)}
      >
        <Printer className="h-4 w-4" />
        <span>{withTitle ? title : ""}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div ref={printRef} className="bg-white rounded-md p-4 border">
              {description && <div className="text-center text-sm mb-2">{description}</div>}

              <div className="flex justify-center my-3">
                {barcodeType === "barcode" ? (
                  <Barcode
                    value={data}
                    width={1.5}
                    height={printSize === "small" ? 30 : printSize === "medium" ? 40 : 50}
                    fontSize={10}
                    margin={5}
                    displayValue={true}
                  />
                ) : (
                  <QRCodeSVG
                    value={data}
                    size={printSize === "small" ? 80 : printSize === "medium" ? 120 : 150}
                    level="H"
                  />
                )}
              </div>

              {additionalInfo.length > 0 && (
                <div className="mt-3 text-xs space-y-1">
                  {additionalInfo.map((info, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="font-semibold">{info.label}:</span>
                      <span>{info.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Yazdır
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}