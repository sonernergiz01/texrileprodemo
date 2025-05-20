import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Trash2, MoreVertical, QrCode, Tag } from "lucide-react";

interface KartelaFabricItemProps {
  id: number;
  fabricTypeName: string;
  fabricCode: string;
  color?: string;
  weight?: number;
  width?: number;
  composition?: string;
  status?: string;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onPrintQr: (id: number) => void;
  onPrintLabel: (id: number) => void;
}

export function KartelaFabricItem({
  id,
  fabricTypeName,
  fabricCode,
  color,
  weight,
  width,
  composition,
  status = "active",
  onEdit,
  onDelete,
  onPrintQr,
  onPrintLabel,
}: KartelaFabricItemProps) {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-0">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {fabricTypeName}
              {status === "active" ? (
                <Badge className="ml-2 text-xs" variant="outline">Aktif</Badge>
              ) : (
                <Badge className="ml-2 text-xs" variant="secondary">Pasif</Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">{fabricCode}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Açılır Menü</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(id)}>
                <Edit className="mr-2 h-4 w-4" /> Düzenle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPrintQr(id)}>
                <QrCode className="mr-2 h-4 w-4" /> QR Kod Yazdır
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPrintLabel(id)}>
                <Tag className="mr-2 h-4 w-4" /> Etiket Yazdır
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => onDelete(id)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-3 pb-0 flex-grow">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {color && (
            <div>
              <span className="font-medium">Renk:</span> {color}
            </div>
          )}
          
          {weight && (
            <div>
              <span className="font-medium">Gramaj:</span> {weight} gr/m²
            </div>
          )}
          
          {width && (
            <div>
              <span className="font-medium">En:</span> {width} cm
            </div>
          )}
        </div>
        
        {composition && (
          <div className="mt-3 pt-3 border-t text-sm">
            <span className="font-medium">Kompozisyon:</span> {composition}
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-between pt-3 pb-3">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPrintQr(id)}
          >
            <QrCode className="mr-1 h-3 w-3" /> QR
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPrintLabel(id)}
          >
            <Tag className="mr-1 h-3 w-3" /> Etiket
          </Button>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(id)}
          >
            Düzenle
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-500 hover:text-red-700"
            onClick={() => onDelete(id)}
          >
            Sil
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}