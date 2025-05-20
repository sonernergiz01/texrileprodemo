import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Printer, QrCode, Send, Package, Info, Edit, Trash2 } from "lucide-react";
import { tr } from "date-fns/locale";

// Kartela kartı bileşeni - Ana listede gösterilecek
interface KartelaCardProps {
  id: number;
  kartelaCode: string;
  name: string;
  description?: string;
  customerName?: string;
  status: string;
  itemCount: number;
  createdAt: Date;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onPrintQr: (id: number) => void;
  onShip: (id: number) => void;
}

export const KartelaCard: React.FC<KartelaCardProps> = ({
  id,
  kartelaCode,
  name,
  description,
  customerName,
  status,
  itemCount,
  createdAt,
  onView,
  onEdit,
  onDelete,
  onPrintQr,
  onShip,
}) => {
  // Kartela durumuna göre badge oluştur
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Taslak</Badge>;
      case "sent":
        return <Badge variant="secondary">Gönderildi</Badge>;
      case "approved":
        return <Badge className="bg-green-600 text-white">Onaylandı</Badge>;
      case "rejected":
        return <Badge variant="destructive">Reddedildi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{name}</CardTitle>
            <CardDescription className="text-sm">
              {kartelaCode} | {format(new Date(createdAt), "dd MMMM yyyy", { locale: tr })}
            </CardDescription>
          </div>
          <div>{renderStatusBadge(status)}</div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          {description && <p className="text-sm text-gray-600">{description}</p>}
          <div className="flex flex-wrap gap-2">
            <div className="bg-gray-100 rounded px-2 py-1 text-xs flex items-center">
              <Package className="h-3 w-3 mr-1" />
              <span>{itemCount} kumaş</span>
            </div>
            {customerName && (
              <div className="bg-gray-100 rounded px-2 py-1 text-xs flex items-center">
                <Info className="h-3 w-3 mr-1" />
                <span>{customerName}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button variant="outline" size="sm" onClick={() => onView(id)}>
          Detaylar
        </Button>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(id)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onPrintQr(id)}>
            <QrCode className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onShip(id)}>
            <Send className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};