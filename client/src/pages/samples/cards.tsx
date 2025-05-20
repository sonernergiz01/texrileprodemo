import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Loader2, 
  QrCode, 
  Printer, 
  Eye, 
  Filter,
  ArrowUpDown,
  Search,
  Download
} from 'lucide-react';
import { BarcodeModal } from '@/components/barcode/barcode-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { SampleCard } from '@shared/schema';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Barcode from 'react-barcode';

export default function SampleCardsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<SampleCard | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const barcodeRef = useRef<HTMLDivElement>(null);
  
  // Numune kartlarını getir
  const { data: cards, isLoading, error } = useQuery<SampleCard[]>({
    queryKey: ['/api/sample/cards'],
  });

  if (error) {
    toast({
      title: 'Hata',
      description: 'Numune kartları yüklenirken bir hata oluştu',
      variant: 'destructive',
    });
  }

  // Barkod görüntüleme işlemi
  const handleViewBarcode = (card: SampleCard) => {
    setSelectedCard(card);
    setIsBarcodeModalOpen(true);
  };
  
  // Tüm numune kartları için toplu barkod yazdırma
  const handlePrintAllBarcodes = async () => {
    if (!cards || cards.length === 0) {
      toast({
        title: 'Uyarı',
        description: 'Yazdırılacak numune kartı bulunamadı.',
        variant: 'default',
      });
      return;
    }
    
    setIsGeneratingPDF(true);
    
    try {
      // PDF dokümanı oluştur
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      let currentPage = 1;
      const cardsPerPage = 3; // Her sayfaya 3 barkod sığdır
      
      // Filtrelenmiş kartlara göre işlem yap
      const cardsToProcess = filteredCards || cards;
      
      // Her bir kart için barkod ekle
      for (let i = 0; i < cardsToProcess.length; i++) {
        const card = cardsToProcess[i];
        
        // Yeni sayfa başlat
        if (i > 0 && i % cardsPerPage === 0) {
          doc.addPage();
          currentPage++;
        }
        
        // Sayfadaki pozisyonu hesapla
        const yPos = 20 + (i % cardsPerPage) * 90;
        
        // Başlık
        doc.setFontSize(14);
        doc.text(`Numune Kartı: ${card.cardNo}`, 105, yPos, { align: 'center' });
        
        // Kart detayları
        doc.setFontSize(10);
        doc.text(`Renk: ${card.color || '-'}`, 105, yPos + 8, { align: 'center' });
        doc.text(`Ölçüler: ${card.width || '-'} cm / ${card.length || '-'} m`, 105, yPos + 14, { align: 'center' });
        doc.text(`Ağırlık: ${card.weight ? `${card.weight} kg` : '-'}`, 105, yPos + 20, { align: 'center' });
        doc.text(`Durum: ${card.status}`, 105, yPos + 26, { align: 'center' });
        
        // Barkod görselini ekle
        // Not: Gerçek uygulamada burada canvas veya SVG kullanılacak
        // Bu örnek için basit bir metin gösterimi kullanıyoruz
        doc.setFontSize(12);
        doc.text(`*${card.barcode}*`, 105, yPos + 40, { align: 'center' });
        doc.text(card.barcode, 105, yPos + 46, { align: 'center' });
        
        // Ayırıcı çizgi
        if ((i % cardsPerPage) < cardsPerPage - 1 && i < cardsToProcess.length - 1) {
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          doc.line(20, yPos + 60, 190, yPos + 60);
        }
      }
      
      // PDF'i indir
      doc.save(`numune-kartlari-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: 'Başarılı',
        description: `${cardsToProcess.length} numune kartı barkodu başarıyla oluşturuldu ve indirildi.`,
        variant: 'default',
      });
    } catch (error) {
      console.error("PDF oluşturma hatası:", error);
      toast({
        title: 'Hata',
        description: 'Barkodlar oluşturulurken bir sorun oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Durum gösterimi için renk ve etiket belirle
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Oluşturuldu':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Oluşturuldu</Badge>;
      case 'İşlemde':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">İşlemde</Badge>;
      case 'Tamamlandı':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Tamamlandı</Badge>;
      case 'İptal Edildi':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">İptal Edildi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Kartları filtrele
  const filteredCards = cards?.filter(card => {
    const matchesSearch = 
      card.cardNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.color && card.color.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (card.notes && card.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || card.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <h1 className="text-2xl font-bold">Numune Kartları</h1>
        <div className="flex items-center space-x-2">
          <Button 
            variant="default"
            onClick={handlePrintAllBarcodes}
            disabled={isGeneratingPDF || !filteredCards?.length}
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                İşleniyor...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4 mr-2" />
                Tümünü Yazdır
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={handlePrintAllBarcodes}
            disabled={isGeneratingPDF || !filteredCards?.length}
          >
            <Download className="h-4 w-4 mr-2" />
            PDF İndir
          </Button>
        </div>
      </div>

      {/* Filtreler */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtreler</CardTitle>
          <CardDescription>Arama ve filtreleme seçenekleri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Arama</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  placeholder="Kart no, barkod veya renk"
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Select 
                value={filterStatus} 
                onValueChange={setFilterStatus}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Tüm durumlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="Oluşturuldu">Oluşturuldu</SelectItem>
                  <SelectItem value="İşlemde">İşlemde</SelectItem>
                  <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                  <SelectItem value="İptal Edildi">İptal Edildi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Numune Kartları Tablosu */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Numune Kartları</CardTitle>
          <CardDescription>
            Toplam: {filteredCards?.length || 0} numune kartı
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Kart No</TableHead>
                    <TableHead>Renk</TableHead>
                    <TableHead>Ölçüler (En/Boy)</TableHead>
                    <TableHead>Ağırlık</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Baskı Sayısı</TableHead>
                    <TableHead>Oluşturulma</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards && filteredCards.length > 0 ? (
                    filteredCards.map((card) => (
                      <TableRow key={card.id}>
                        <TableCell className="font-medium">{card.cardNo}</TableCell>
                        <TableCell>{card.color || '-'}</TableCell>
                        <TableCell>
                          {card.width ? `${card.width} cm` : '-'} / 
                          {card.length ? `${card.length} m` : '-'}
                        </TableCell>
                        <TableCell>{card.weight ? `${card.weight} kg` : '-'}</TableCell>
                        <TableCell>{getStatusBadge(card.status)}</TableCell>
                        <TableCell>{card.printCount}</TableCell>
                        <TableCell>
                          {new Date(card.createdAt).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleViewBarcode(card)}
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        {cards && cards.length > 0 
                          ? 'Filtrelere uygun numune kartı bulunamadı.'
                          : 'Henüz numune kartı oluşturulmamış.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Barkod Modalı */}
      {selectedCard && (
        <BarcodeModal
          isOpen={isBarcodeModalOpen}
          onClose={() => setIsBarcodeModalOpen(false)}
          barcodeValue={selectedCard.barcode}
          title="Numune Kartı Barkodu"
          description="Numune kartını taramak için barkodu kullanabilirsiniz."
          additionalInfo={{
            "Kart No": selectedCard.cardNo,
            "Renk": selectedCard.color || "-",
            "Ölçüler": `${selectedCard.width || "-"} cm / ${selectedCard.length || "-"} m`,
            "Ağırlık": selectedCard.weight ? `${selectedCard.weight} kg` : "-",
            "Durum": selectedCard.status,
            "Oluşturulma": new Date(selectedCard.createdAt).toLocaleDateString('tr-TR')
          }}
        />
      )}
    </div>
  );
}