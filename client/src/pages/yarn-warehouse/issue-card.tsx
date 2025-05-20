import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Printer, Search, Barcode, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

// İplik Çıkış Kartı şeması
const issueCardSchema = z.object({
  yarnInventoryId: z.number().min(1, "İplik seçimi zorunludur"),
  yarnType: z.string().min(1, "İplik türü zorunludur"),
  count: z.string().optional(),
  color: z.string().optional(),
  quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Geçerli bir miktar giriniz",
  }),
  unitOfMeasure: z.string().default("kg"),
  batchNumber: z.string().min(1, "Parti numarası zorunludur"),
  orderId: z.number().optional(),
  orderNumber: z.string().optional(),
  destinationDepartmentId: z.number({
    required_error: "Hedef departman seçimi zorunludur",
  }),
  notes: z.string().optional(),
});

type IssueCardFormValues = z.infer<typeof issueCardSchema>;

export default function YarnIssueCardPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  // Form tanımlaması
  const form = useForm<IssueCardFormValues>({
    resolver: zodResolver(issueCardSchema),
    defaultValues: {
      yarnInventoryId: 0,
      yarnType: "",
      count: "",
      color: "",
      quantity: "",
      unitOfMeasure: "kg",
      batchNumber: "",
      notes: "",
    },
  });

  // Departmanları getir
  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
    select: (data) => data.filter((dept: any) => dept.id !== user?.departmentId),
  });

  // İplik stoğunu getir
  const { data: yarnInventory, isLoading: isLoadingYarn } = useQuery({
    queryKey: ["/api/yarn-warehouse/inventory"],
  });

  // Siparişleri getir
  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
    select: (data) =>
      data.filter((order: any) => order.statusId === 1 || order.statusId === 2),
  });

  // Mevcut kartları getir
  const { data: issueCards, isLoading: isLoadingCards } = useQuery({
    queryKey: ["/api/yarn-warehouse/issue-cards"],
  });

  // Filtrelenmiş kartlar
  const filteredCards = searchQuery
    ? issueCards?.filter(
        (card: any) =>
          card.cardNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.yarnType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : issueCards;

  // Kart oluşturma mutasyonu
  const createCardMutation = useMutation({
    mutationFn: async (data: IssueCardFormValues) => {
      const res = await apiRequest("POST", "/api/yarn-warehouse/issue-cards", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-warehouse/issue-cards"] });
      toast({
        title: "İplik çıkış kartı oluşturuldu",
        description: "Kart başarıyla oluşturuldu ve barkod oluşturuldu.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Kart durum güncelleme mutasyonu
  const updateCardStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/yarn-warehouse/issue-cards/${id}/status`, {
        status,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yarn-warehouse/issue-cards"] });
      toast({
        title: "Durum güncellendi",
        description: "Kart durumu başarıyla güncellendi.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form gönderimi
  const onSubmit = (values: IssueCardFormValues) => {
    createCardMutation.mutate(values);
  };

  // İplik stok durumuna göre iplik ID select opsiyonları oluştur
  const renderYarnOptions = () => {
    if (!yarnInventory) return null;
    return yarnInventory.map((yarn: any) => (
      <SelectItem 
        key={yarn.id} 
        value={yarn.id.toString()}
      >
        {yarn.yarnType} ({yarn.count}) - {yarn.color} - Stok: {yarn.stockQuantity} {yarn.unitOfMeasure}
      </SelectItem>
    ));
  };
  
  // İplik seçildiğinde otomatik değerleri doldur
  const handleYarnSelect = (yarnInventoryId: string) => {
    const selectedYarn = yarnInventory?.find((yarn: any) => yarn.id.toString() === yarnInventoryId);
    if (selectedYarn) {
      form.setValue("yarnInventoryId", selectedYarn.id);
      form.setValue("yarnType", selectedYarn.yarnType);
      form.setValue("count", selectedYarn.count);
      form.setValue("color", selectedYarn.color);
      form.setValue("unitOfMeasure", selectedYarn.unitOfMeasure);
      form.setValue("batchNumber", selectedYarn.batchNumber || "");
    }
  };

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

  // Barkod görüntüleme ve yazdırma diyaloğu
  const [showBarcodeDialog, setShowBarcodeDialog] = useState(false);
  const [currentBarcodeData, setCurrentBarcodeData] = useState<string | null>(null);
  const [currentCardNumber, setCurrentCardNumber] = useState<string | null>(null);

  // Barkod yazdırma işlemi
  const viewBarcode = (card: any) => {
    setCurrentBarcodeData(card.barcodeData);
    setCurrentCardNumber(card.cardNumber);
    setShowBarcodeDialog(true);
  };

  // Yazdırma işlemi
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>İplik Çıkış Kartı Barkodu</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; }
              .barcode-container { margin: 20px auto; padding: 15px; border: 1px solid #ccc; display: inline-block; }
              .card-info { margin-bottom: 15px; font-size: 14px; }
              .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 60px; line-height: 1.2; }
              .barcode-text { font-size: 14px; margin-top: 10px; }
              @media print {
                body { margin: 0; padding: 0; }
                .print-button { display: none; }
              }
            </style>
            <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
          </head>
          <body>
            <div class="barcode-container">
              <div class="card-info">
                <strong>İplik Çıkış Kartı</strong><br>
                ${currentCardNumber}
              </div>
              <div class="barcode">*${currentBarcodeData}*</div>
              <div class="barcode-text">${currentBarcodeData}</div>
            </div>
            <button class="print-button" onclick="window.print(); window.close();">Yazdır</button>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      toast({
        title: "Hata",
        description: "Yazdırma penceresi açılamadı. Lütfen popup engelleyiciyi kontrol edin.",
        variant: "destructive",
      });
    }
  };

  if (isLoadingYarn || isLoadingCards) {
    return <div className="flex justify-center p-8">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">İplik Çıkış Kartları</h1>

      {/* Barkod Diyaloğu */}
      {showBarcodeDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">İplik Çıkış Kartı Barkodu</h3>
              <button
                onClick={() => setShowBarcodeDialog(false)}
                className="p-1 rounded-full hover:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="border p-4 rounded-md flex flex-col items-center mb-4">
              <p className="mb-2 text-sm font-medium">{currentCardNumber}</p>
              <div className="text-5xl font-['Libre_Barcode_39'] leading-tight">
                *{currentBarcodeData}*
              </div>
              <p className="text-xs mt-2">{currentBarcodeData}</p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBarcodeDialog(false)}>
                Kapat
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Yazdır
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Sol taraf - Yeni Kart Oluşturma */}
        <Card>
          <CardHeader>
            <CardTitle>Yeni İplik Çıkış Kartı</CardTitle>
            <CardDescription>
              Dokuma veya diğer departmanlara iplik transferi için kart oluşturun.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="yarnInventoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İplik Seçimi</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                          handleYarnSelect(value);
                        }} 
                        value={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="İplik seçiniz" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>{renderYarnOptions()}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="batchNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parti Numarası</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Parti numarası"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Miktar (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Miktar giriniz"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="orderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sipariş (Opsiyonel)</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sipariş seçiniz (opsiyonel)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {orders?.map((order: any) => (
                            <SelectItem key={order.id} value={order.id.toString()}>
                              {order.orderNumber} - {order.customerName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Çıkış spesifik bir siparişe ait ise seçiniz
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="destinationDepartmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hedef Departman</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Hedef departman seçiniz" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments?.map((dept: any) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notlar (Opsiyonel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Notlar..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createCardMutation.isPending}
                >
                  {createCardMutation.isPending ? "Oluşturuluyor..." : "Çıkış Kartı Oluştur"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Sağ taraf - Kart Listesi */}
        <Card>
          <CardHeader>
            <CardTitle>İplik Çıkış Kartları</CardTitle>
            <CardDescription>
              Oluşturulan iplik çıkış kartlarını görüntüleyin ve yönetin.
            </CardDescription>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kart no, iplik türü veya sipariş no ile ara..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>İplik çıkış kartları listesi</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kart No</TableHead>
                    <TableHead>İplik</TableHead>
                    <TableHead>Miktar</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards?.length > 0 ? (
                    filteredCards.map((card: any) => (
                      <TableRow key={card.id}>
                        <TableCell
                          className="font-medium cursor-pointer hover:text-blue-600"
                          onClick={() => navigate(`/yarn-warehouse/issue-cards/${card.id}`)}
                        >
                          {card.cardNumber}
                        </TableCell>
                        <TableCell>
                          {card.yarnType} - {card.count}
                        </TableCell>
                        <TableCell>
                          {card.quantity} {card.unitOfMeasure}
                        </TableCell>
                        <TableCell>{getStatusBadge(card.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewBarcode(card)}
                            >
                              <Printer className="h-4 w-4 mr-1" />
                              Yazdır
                            </Button>
                            {card.status === "created" && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() =>
                                  updateCardStatusMutation.mutate({
                                    id: card.id,
                                    status: "in-transit",
                                  })
                                }
                              >
                                <Barcode className="h-4 w-4 mr-1" />
                                Transfer Et
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        {searchQuery
                          ? "Arama kriterlerine uygun kart bulunamadı."
                          : "Henüz iplik çıkış kartı oluşturulmamış."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Toplam: {filteredCards?.length || 0} kart
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}