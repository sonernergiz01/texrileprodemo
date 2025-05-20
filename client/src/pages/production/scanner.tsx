/**
 * Üretim Refakat Kartı Okutma Ekranı (Basitleştirilmiş)
 * Bu sayfa operatörlerin barkod okutarak üretim işlemlerini takip etmesini sağlar.
 * Operatör sadece "Başla" ve "Bitir" butonlarına basarak işlemleri yönetebilir.
 */

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, Barcode, Play, StopCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

// Barkod tarama formu şeması
const scanFormSchema = z.object({
  cardNumber: z.string().min(3, "Geçerli bir refakat kartı numarası girin"),
});

// Makine seçme şeması 
const machineFormSchema = z.object({
  machineId: z.string().min(1, "Makine seçimi zorunludur"),
});

export default function ScannerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cardInfo, setCardInfo] = useState<any>(null);
  const [activeProcess, setActiveProcess] = useState<any>(null);
  const [processHistory, setProcessHistory] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(true);

  // Departman ID'yi al (kullanıcının departmanı)
  const departmentId = user?.departmentId || 1;  // Default olarak Admin (1)

  // Barkod tarama formu
  const scanForm = useForm<z.infer<typeof scanFormSchema>>({
    resolver: zodResolver(scanFormSchema),
    defaultValues: {
      cardNumber: "",
    },
  });

  // Makine seçme formu
  const machineForm = useForm<z.infer<typeof machineFormSchema>>({
    resolver: zodResolver(machineFormSchema),
    defaultValues: {
      machineId: "",
    },
  });

  // Refakat kartı bilgilerini getir
  const fetchCardInfo = async (cardNumber: string) => {
    try {
      const res = await apiRequest("GET", `/api/process-tracking/cards/${cardNumber}`);
      const data = await res.json();
      setCardInfo(data.card);
      setProcessHistory(data.processHistory || []);
      
      // Aktif işlem var mı kontrol et
      const activeProcess = data.processHistory?.find(
        (p: any) => p.status === 'inProgress' && p.department_id === departmentId
      );
      
      setActiveProcess(activeProcess);
      
      return data;
    } catch (error) {
      console.error("Refakat kartı bilgileri alınamadı:", error);
      throw new Error("Refakat kartı bilgileri alınamadı");
    }
  };

  // Barkod tara - Sadece kart bilgisini getir
  const { mutate: scanCard, isPending: isScanning } = useMutation({
    mutationFn: async (values: z.infer<typeof scanFormSchema>) => {
      return await fetchCardInfo(values.cardNumber);
    },
    onSuccess: () => {
      setShowScanner(false);
      toast({
        title: "Refakat kartı başarıyla okundu",
        description: "Kart bilgileri getirildi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Refakat kartı okunamadı",
        variant: "destructive",
      });
    },
  });

  // Makine listesini getir
  const { data: machines, isLoading: machinesLoading } = useQuery({
    queryKey: ["/api/process-tracking/machines", departmentId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/process-tracking/machines/${departmentId}`);
      return res.json();
    },
    enabled: !!departmentId,
  });

  // Basitleştirilmiş işlem başlatma (seçilen makineyle)
  const { mutate: startProcessSimple, isPending: isStartingProcess } = useMutation({
    mutationFn: async (data: { cardNumber: string, machineId: number }) => {
      const payload = {
        cardNumber: data.cardNumber,
        operatorId: user?.id || 1,
        departmentId: departmentId,
        machineId: data.machineId
      };
      
      const res = await apiRequest("POST", "/api/process-tracking/start-simple", payload);
      return res.json();
    },
    onSuccess: async (data) => {
      // Aktif işlem zaten var mı kontrol et
      if (data.isActive) {
        toast({
          title: "Aktif İşlem Mevcut",
          description: `${data.activeProcess.machine_name} - ${data.activeProcess.process_type_name}`,
        });
        setActiveProcess(data.activeProcess);
      } else {
        toast({
          title: "İşlem başarıyla başlatıldı",
          description: `${data.process.machineName} - ${data.process.processTypeName}`,
        });
      }
      
      // Refakat kartı bilgilerini yeniden getir
      if (cardInfo?.card_number) {
        await fetchCardInfo(cardInfo.card_number);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "İşlem başlatılamadı",
        variant: "destructive",
      });
    },
  });

  // Basitleştirilmiş işlem tamamlama
  const { mutate: completeProcessSimple, isPending: isCompletingProcess } = useMutation({
    mutationFn: async (values: { cardNumber: string, quantity?: string }) => {
      const payload = {
        cardNumber: values.cardNumber,
        operatorId: user?.id || 1,
        departmentId: departmentId,
        quantity: values.quantity ? parseFloat(values.quantity) : undefined
      };
      
      const res = await apiRequest("POST", "/api/process-tracking/complete-simple", payload);
      return res.json();
    },
    onSuccess: async (data) => {
      toast({
        title: "İşlem başarıyla tamamlandı",
        description: data.isCompleted 
          ? "Tüm işlemler tamamlandı" 
          : `Sıradaki adım: ${data.nextStep}`,
      });
      
      // Refakat kartı bilgilerini yeniden getir
      if (cardInfo?.card_number) {
        await fetchCardInfo(cardInfo.card_number);
      }
      
      setActiveProcess(null);
      
      // İşlem tamamlandığında tarama ekranına geri dön
      setTimeout(() => {
        setShowScanner(true);
        scanForm.reset();
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "İşlem tamamlanamadı",
        variant: "destructive",
      });
    },
  });

  // Barkod tarama formu gönderme
  const onScanSubmit = (values: z.infer<typeof scanFormSchema>) => {
    scanCard(values);
  };
  
  // Makine seçme formu gönderme
  const onMachineSubmit = (values: z.infer<typeof machineFormSchema>) => {
    if (!cardInfo) return;
    
    startProcessSimple({
      cardNumber: cardInfo.card_number,
      machineId: parseInt(values.machineId)
    });
  };

  // Tarih formatla
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: tr });
    } catch (error) {
      return dateString;
    }
  };
  
  // İşlem durumuna göre renk belirle
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'outline';
      case 'inProgress': return 'default';
      default: return 'secondary';
    }
  };

  // İşlem durumunu Türkçe olarak göster
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Tamamlandı';
      case 'inProgress': return 'Devam Ediyor';
      case 'pending': return 'Beklemede';
      default: return status;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-8">
        {/* Operatör Bilgileri */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Operatör Paneli</h1>
            <p className="text-muted-foreground">
              {user?.fullName || "Operatör"} | {user?.departmentName || "Departman"}
            </p>
          </div>
          {cardInfo && (
            <Button variant="outline" onClick={() => {
              setShowScanner(true);
              scanForm.reset();
              setCardInfo(null);
              setActiveProcess(null);
            }}>
              Yeni Barkod Tara
            </Button>
          )}
        </div>
        
        {/* Barkod Tarama */}
        {showScanner && (
          <Card className="border-2 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Barcode className="h-6 w-6 text-primary" />
                Refakat Kartı Tarama
              </CardTitle>
              <CardDescription>
                Refakat kartı üzerindeki barkodu tarayın veya kart numarasını girin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...scanForm}>
                <form onSubmit={scanForm.handleSubmit(onScanSubmit)} className="space-y-6">
                  <FormField
                    control={scanForm.control}
                    name="cardNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Barkod tarayın veya kart numarası girin" 
                            className="text-center text-lg h-12"
                            autoFocus
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isScanning} size="lg" className="w-full">
                    {isScanning ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Taranıyor...
                      </>
                    ) : (
                      <>
                        <Barcode className="mr-2 h-5 w-5" />
                        Tara
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
        
        {/* Kart Bilgileri ve İşlem */}
        {!showScanner && cardInfo && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Kart Bilgileri */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>Refakat Kartı</CardTitle>
                  <Badge variant={getStatusBadgeVariant(cardInfo.status)}>
                    {getStatusText(cardInfo.status)}
                  </Badge>
                </div>
                <CardDescription>
                  Barkod: {cardInfo.card_number}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <Label>Sipariş No</Label>
                    <p className="text-sm font-medium">{cardInfo.order_number || '-'}</p>
                  </div>
                  <div>
                    <Label>Müşteri</Label>
                    <p className="text-sm font-medium">{cardInfo.customer_name || '-'}</p>
                  </div>
                  <div>
                    <Label>Kumaş</Label>
                    <p className="text-sm font-medium">{cardInfo.fabric_name || '-'}</p>
                  </div>
                  <div>
                    <Label>Miktar</Label>
                    <p className="text-sm font-medium">{cardInfo.quantity} {cardInfo.unit}</p>
                  </div>
                  <div>
                    <Label>Adım</Label>
                    <p className="text-sm font-medium">{cardInfo.current_step || '1'}</p>
                  </div>
                  <div>
                    <Label>Açıklama</Label>
                    <p className="text-sm">{cardInfo.notes || '-'}</p>
                  </div>
                </div>
                
                {processHistory.length > 0 && (
                  <div className="mt-4">
                    <Label className="mb-2 block">İşlem Geçmişi</Label>
                    <div className="border rounded-md max-h-[150px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]">Adım</TableHead>
                            <TableHead>İşlem</TableHead>
                            <TableHead>Durum</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {processHistory.map((process: any) => (
                            <TableRow key={process.id}>
                              <TableCell>{process.step_order}</TableCell>
                              <TableCell>{process.process_type_name || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(process.status)} className="font-normal">
                                  {getStatusText(process.status)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* İşlem Alanı */}
            <Card className={activeProcess ? "border-blue-200 shadow-blue-100" : "border-green-200 shadow-green-100"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {activeProcess ? (
                    <>
                      <StopCircle className="h-5 w-5 text-blue-500" />
                      Devam Eden İşlem
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 text-green-500" />
                      Yeni İşlem Başlat
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {activeProcess 
                    ? `${activeProcess.process_type_name} (${formatDate(activeProcess.start_time)})`
                    : "İşlemi başlatmak için makine seçin"}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {activeProcess ? (
                  // Devam eden işlem - tamamlama formu
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Departman</Label>
                        <p className="text-sm font-medium">{activeProcess.department_name || '-'}</p>
                      </div>
                      <div>
                        <Label>Makine</Label>
                        <p className="text-sm font-medium">{activeProcess.machine_name || '-'}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <Button 
                        size="lg" 
                        onClick={() => completeProcessSimple({ cardNumber: cardInfo.card_number })} 
                        disabled={isCompletingProcess}
                        className="w-full py-8 text-lg"
                      >
                        {isCompletingProcess ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            İşlem Tamamlanıyor...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-5 w-5" />
                            İşlemi Tamamla
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Yeni işlem başlatma - makine seçme formu
                  <Form {...machineForm}>
                    <form onSubmit={machineForm.handleSubmit(onMachineSubmit)} className="space-y-6">
                      <FormField
                        control={machineForm.control}
                        name="machineId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Makine Seçin</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Makine seçin" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {machinesLoading ? (
                                  <div className="flex items-center justify-center p-4">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                  </div>
                                ) : machines && machines.length > 0 ? (
                                  machines.map((machine: any) => (
                                    <SelectItem key={machine.id} value={machine.id.toString()}>
                                      {machine.name} ({machine.code})
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="p-2 text-sm text-muted-foreground">
                                    Makine bulunamadı
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        disabled={isStartingProcess || !machineForm.getValues().machineId} 
                        className="w-full py-8 text-lg"
                        size="lg"
                      >
                        {isStartingProcess ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            İşlem Başlatılıyor...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-5 w-5" />
                            İşlemi Başlat
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}