import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { PageContainer } from "@/components/layout/page-container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrinterIcon, Search, Filter, Tag, Printer } from "lucide-react";
import { QrCodePrintModal } from "../components/QrCodePrintModal";

export default function QrPrintPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedType, setSelectedType] = useState<"kartela" | "item">("kartela");
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [currentQrData, setCurrentQrData] = useState<any>(null);
  
  // Fetch data
  const { data: kartelas, isLoading: loadingKartelas } = useQuery({
    queryKey: ["/api/kartelas"],
  });
  
  const { data: kartelaItems, isLoading: loadingItems } = useQuery({
    queryKey: ["/api/kartela-items"],
  });
  
  // Filter kartelas based on search
  const filteredKartelas = kartelas ? kartelas.filter((kartela: any) => 
    kartela.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kartela.kartelaCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (kartela.customerName && kartela.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];
  
  // Filter items based on search
  const filteredItems = kartelaItems ? kartelaItems.filter((item: any) => 
    (item.fabricCode && item.fabricCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.fabricTypeName && item.fabricTypeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.color && item.color.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];
  
  // Handle checkbox selection
  const handleSelectItem = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };
  
  // Handle select all
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      if (selectedType === "kartela") {
        setSelectedItems(filteredKartelas.map((k: any) => k.id));
      } else {
        setSelectedItems(filteredItems.map((i: any) => i.id));
      }
    } else {
      setSelectedItems([]);
    }
  };
  
  // Handle printing QR code for a single item
  const handlePrintQr = (data: any) => {
    // Prepare QR data based on selected type
    if (selectedType === "kartela") {
      const qrData = {
        id: data.id,
        title: data.name,
        code: data.kartelaCode,
        qrData: `KRT:${data.id}:${data.kartelaCode}:${uuidv4().substring(0, 8)}`,
        additionalFields: {
          "Müşteri": data.customerName || "Genel",
          "Oluşturulma": new Date(data.createdAt).toLocaleDateString("tr-TR"),
          "Parça Sayısı": data.itemCount?.toString() || "0",
          "Durum": data.status === "active" ? "Aktif" : 
                   data.status === "pending" ? "Hazırlanıyor" : 
                   data.status === "archived" ? "Arşivlendi" : "Bilinmiyor"
        }
      };
      setCurrentQrData(qrData);
    } else {
      const qrData = {
        id: data.id,
        title: data.fabricTypeName || "Kumaş Örneği",
        code: data.fabricCode || `ITEM-${data.id}`,
        qrData: `KRTI:${data.id}:${data.fabricCode || ''}:${uuidv4().substring(0, 8)}`,
        additionalFields: {
          "Renk": data.color || "-",
          "En": data.width ? `${data.width} cm` : "-",
          "Ağırlık": data.weight ? `${data.weight} gr/m²` : "-",
          "Kompozisyon": data.composition || "-"
        }
      };
      setCurrentQrData(qrData);
    }
    
    setQrModalOpen(true);
  };
  
  // Handle bulk QR printing
  const handleBulkPrint = () => {
    if (selectedItems.length === 0) return;
    
    // Get first selected item data for preview
    const firstItemId = selectedItems[0];
    let item;
    
    if (selectedType === "kartela") {
      item = kartelas?.find((k: any) => k.id === firstItemId);
      if (!item) return;
      
      const qrData = {
        id: item.id,
        title: item.name,
        code: item.kartelaCode,
        qrData: `KRT:${item.id}:${item.kartelaCode}:${uuidv4().substring(0, 8)}`,
        additionalFields: {
          "Müşteri": item.customerName || "Genel",
          "Oluşturulma": new Date(item.createdAt).toLocaleDateString("tr-TR"),
          "Parça Sayısı": item.itemCount?.toString() || "0",
          "Durum": item.status === "active" ? "Aktif" : 
                   item.status === "pending" ? "Hazırlanıyor" : 
                   item.status === "archived" ? "Arşivlendi" : "Bilinmiyor"
        },
        multipleMode: true,
        selectedCount: selectedItems.length,
        selectedIds: selectedItems
      };
      setCurrentQrData(qrData);
    } else {
      item = kartelaItems?.find((i: any) => i.id === firstItemId);
      if (!item) return;
      
      const qrData = {
        id: item.id,
        title: item.fabricTypeName || "Kumaş Örneği",
        code: item.fabricCode || `ITEM-${item.id}`,
        qrData: `KRTI:${item.id}:${item.fabricCode || ''}:${uuidv4().substring(0, 8)}`,
        additionalFields: {
          "Renk": item.color || "-",
          "En": item.width ? `${item.width} cm` : "-",
          "Ağırlık": item.weight ? `${item.weight} gr/m²` : "-",
          "Kompozisyon": item.composition || "-"
        },
        multipleMode: true,
        selectedCount: selectedItems.length,
        selectedIds: selectedItems
      };
      setCurrentQrData(qrData);
    }
    
    setQrModalOpen(true);
  };
  
  if (loadingKartelas || loadingItems) {
    return (
      <PageContainer title="QR Kod Yazdırma" subtitle="Kartela ve kumaş örnekleri için QR kod etiketleri oluşturun">
        <div className="flex justify-center items-center h-[400px]">
          <p>Yükleniyor...</p>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer title="QR Kod Yazdırma" subtitle="Kartela ve kumaş örnekleri için QR kod etiketleri oluşturun">
      <div className="space-y-6">
        {/* Arama ve filtreler */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <CardTitle>QR Kod Yazdırma</CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="default" 
                  disabled={selectedItems.length === 0}
                  onClick={handleBulkPrint}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {selectedItems.length > 0 
                    ? `Seçili Öğeleri Yazdır (${selectedItems.length})` 
                    : "QR Kod Yazdır"}
                </Button>
              </div>
            </div>
            <CardDescription>
              Kartela ve kumaş örnekleri için etiketler yaratın
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="Kartela adı, kod veya müşteriye göre arayın" 
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="md:col-span-2 flex items-center justify-end">
                <Label className="mr-2">Tüm Sayfa:</Label>
                <Checkbox 
                  id="selectAll" 
                  onCheckedChange={(checked) => handleSelectAll(checked === true)}
                  checked={selectedType === "kartela" 
                    ? selectedItems.length === filteredKartelas.length && filteredKartelas.length > 0
                    : selectedItems.length === filteredItems.length && filteredItems.length > 0}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Kartela ve kumaş öğeleri listesi */}
        <Tabs 
          defaultValue="kartela" 
          onValueChange={(value) => {
            setSelectedType(value as "kartela" | "item");
            setSelectedItems([]);
          }}
        >
          <TabsList>
            <TabsTrigger value="kartela">Kartelalar</TabsTrigger>
            <TabsTrigger value="item">Kumaş Örnekleri</TabsTrigger>
          </TabsList>
          
          <TabsContent value="kartela">
            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Seç</TableHead>
                        <TableHead>Kartela Adı</TableHead>
                        <TableHead>Kartela Kodu</TableHead>
                        <TableHead>Müşteri</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>Parça Sayısı</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="w-[100px]">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredKartelas.length > 0 ? (
                        filteredKartelas.map((kartela: any) => (
                          <TableRow key={kartela.id}>
                            <TableCell>
                              <Checkbox 
                                checked={selectedItems.includes(kartela.id)}
                                onCheckedChange={() => handleSelectItem(kartela.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{kartela.name}</TableCell>
                            <TableCell>{kartela.kartelaCode}</TableCell>
                            <TableCell>{kartela.customerName || "-"}</TableCell>
                            <TableCell>{kartela.type || "Genel"}</TableCell>
                            <TableCell>{kartela.itemCount || 0}</TableCell>
                            <TableCell>
                              <Badge className={
                                kartela.status === "active" ? "bg-green-100 text-green-800" : 
                                kartela.status === "pending" ? "bg-yellow-100 text-yellow-800" : 
                                kartela.status === "archived" ? "bg-gray-100 text-gray-800" : ""
                              }>
                                {kartela.status === "active" ? "Aktif" : 
                                 kartela.status === "pending" ? "Hazırlanıyor" : 
                                 kartela.status === "archived" ? "Arşivlendi" : "Bilinmiyor"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handlePrintQr(kartela)}
                              >
                                <PrinterIcon className="h-4 w-4 mr-1" />
                                QR
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                            {searchTerm 
                              ? "Arama kriterlerine uygun kartela bulunamadı" 
                              : "Henüz kartela oluşturulmamış"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="item">
            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Seç</TableHead>
                        <TableHead>Kumaş Adı</TableHead>
                        <TableHead>Kumaş Kodu</TableHead>
                        <TableHead>Renk</TableHead>
                        <TableHead>Kompozisyon</TableHead>
                        <TableHead>Kartela</TableHead>
                        <TableHead className="w-[100px]">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.length > 0 ? (
                        filteredItems.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Checkbox 
                                checked={selectedItems.includes(item.id)}
                                onCheckedChange={() => handleSelectItem(item.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{item.fabricTypeName || "-"}</TableCell>
                            <TableCell>{item.fabricCode || "-"}</TableCell>
                            <TableCell>{item.color || "-"}</TableCell>
                            <TableCell>{item.composition || "-"}</TableCell>
                            <TableCell>{item.kartelaName || "-"}</TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handlePrintQr(item)}
                              >
                                <PrinterIcon className="h-4 w-4 mr-1" />
                                QR
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                            {searchTerm 
                              ? "Arama kriterlerine uygun kumaş örneği bulunamadı" 
                              : "Henüz kumaş örneği oluşturulmamış"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* QR Kod Yazdırma Modalı */}
      {currentQrData && (
        <QrCodePrintModal 
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          data={currentQrData}
          type={selectedType}
        />
      )}
    </PageContainer>
  );
}