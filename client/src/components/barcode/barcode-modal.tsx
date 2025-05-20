import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Printer } from 'lucide-react';
import { BarcodeGenerator } from './barcode-generator';

interface BarcodeModalProps {
  trigger?: React.ReactNode;
  title?: string;
  defaultValue?: string;
  prefix?: string;
  entityId?: number;
  onPrint?: (barcodeValue: string, barcodeType: 'code128' | 'qrcode') => void;
}

export function BarcodeModal({
  trigger,
  title = 'Barkod/QR Oluştur',
  defaultValue,
  prefix,
  entityId,
  onPrint,
}: BarcodeModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Barkod Oluştur
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Barkod veya QR kod oluşturun ve yazdırın
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <BarcodeGenerator
            title={title}
            value={defaultValue}
            prefix={prefix}
            entityId={entityId}
            onPrint={(value, type) => {
              if (onPrint) {
                onPrint(value, type);
              }
              setOpen(false);
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}