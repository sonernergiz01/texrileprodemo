import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Barcode, FileText, Loader2, Plus, Printer, Search } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { BarcodeModal } from "@/components/barcode/barcode-modal";

export default function YarnIssueCardsPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [selectedCardInfo, setSelectedCardInfo] = useState<Record<string, string>>({});

  // İplik çıkış kartlarını getir
  const { data: issueCards, isLoading } = useQuery({
    queryKey: ["/api/yarn-warehouse/issue-cards"],
  });

  // Filtrelenmiş kartlar
  const filteredCards = searchQuery
    ? issueCards?.filter(
        (card: any) =>
          card.cardNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.yarnType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.batchNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : issueCards;

  // Durum badgei oluştur
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "created":
        return <Badge variant="outline">Oluşturuldu</Badge>;
      case "in-transit":
        return <Badge variant="secondary">Transfer Edildi</Badge>;
      case "received":
        return <Badge variant="default">Teslim Alındı</Badge>;
      case "completed":
        return <Badge className="bg-green-600">Tamamlandı</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Kart detayına git
  const goToCardDetail = (cardId: number) => {
    navigate(`/yarn-warehouse/issue-card/${cardId}`);
  };

  // Yeni kart oluşturma sayfasına git
  const goToCreateCard = () => {
    navigate("/yarn-warehouse/issue-card");
  };

  // Barkod göster ve yazdır
  const handleShowBarcode = (e: React.MouseEvent, card: any) => {
    e.stopPropagation();
    
    // Barkod için kullanılacak değeri belirle
    // Eğer barcodeNumber veya barcodeData yoksa, cardNumber kullan
    const barcodeValue = card.barcodeNumber || card.barcodeData || card.cardNumber;
    
    // Barkod modalında gösterilecek ek bilgileri hazırla
    const additionalInfo: Record<string, string> = {
      "Kart No": card.cardNumber || "",
      "İplik Tipi": card.yarnType || "",
      "Parti No": card.batchNumber || "",
      "Miktar": `${card.quantity || ""} ${card.unitOfMeasure || ""}`,
      "Durum": card.status === "created" 
        ? "Oluşturuldu" 
        : card.status === "in-transit" 
          ? "Transfer Edildi" 
          : card.status === "received" 
            ? "Teslim Alındı" 
            : card.status === "completed" 
              ? "Tamamlandı" 
              : card.status || "",
    };
    
    // Barkod modalını aç
    setSelectedBarcode(barcodeValue);
    setSelectedCardInfo(additionalInfo);
    setIsBarcodeModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">İplik Çıkış Kartları</h1>
        <Button onClick={goToCreateCard}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kart Oluştur
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Kart Listesi</CardTitle>
          <CardDescription>
            Tüm iplik çıkış kartlarını görüntüleyin ve yönetin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kart numarası, iplik tipi veya sipariş numarası ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {filteredCards?.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kart No</TableHead>
                    <TableHead>İplik Tipi</TableHead>
                    <TableHead>Miktar</TableHead>
                    <TableHead>Parti No</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards.map((card: any) => (
                    <TableRow
                      key={card.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => goToCardDetail(card.id)}
                    >
                      <TableCell className="font-medium">{card.cardNumber}</TableCell>
                      <TableCell>{card.yarnType}</TableCell>
                      <TableCell>
                        {card.quantity} {card.unitOfMeasure}
                      </TableCell>
                      <TableCell>{card.batchNumber}</TableCell>
                      <TableCell>
                        {format(new Date(card.createdAt), "dd MMM yyyy", { locale: tr })}
                      </TableCell>
                      <TableCell>{getStatusBadge(card.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              goToCardDetail(card.id);
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => handleShowBarcode(e, card)}
                          >
                            <Barcode className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              {searchQuery ? "Arama kriterlerine uygun kart bulunamadı." : "Henüz kart oluşturulmamış."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Barkod Modalı */}
      {selectedBarcode && (
        <BarcodeModal
          isOpen={isBarcodeModalOpen}
          onClose={() => setIsBarcodeModalOpen(false)}
          barcodeValue={selectedBarcode}
          title="İplik Çıkış Kartı Barkodu"
          description="İplik çıkış kartını taramak için barkodu kullanabilirsiniz."
          additionalInfo={selectedCardInfo}
        />
      )}
    </div>
  );
}