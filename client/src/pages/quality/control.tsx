import { useEffect, useState, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Loader2, 
  Ruler, 
  Scale, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle, 
  XCircle,
  FileText,
  AlertTriangle,
  RefreshCw,
  BarChart4
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

// RollFormInput tipi
type RollFormInput = {
  barCode: string;
  batchNo: string;
  fabricTypeId: number;
  width: string;
  length: string;
  weight: string;
  color: string;
  machineId: number | null;
  notes: string;
};

// DefectFormInput tipi
type DefectFormInput = {
  defectCode: string;
  startMeter: number;
  endMeter: number;
  width: number;
  severity: "low" | "medium" | "high";
  description: string;
};

export default function QualityControl() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("roll-info");
  const [isNewRoll, setIsNewRoll] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [fabricRollId, setFabricRollId] = useState<number | null>(null);
  const [isDefectDialogOpen, setIsDefectDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [meterValue, setMeterValue] = useState("0.0");
  const [weightValue, setWeightValue] = useState("0.0");
  const [defects, setDefects] = useState<any[]>([]);
  const [selectedDefect, setSelectedDefect] = useState<any | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"complete" | "reject">("complete");
  const rollFormRef = useRef<HTMLFormElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Veri sorgulama işlemleri
  const { data: deviceStatus, isLoading: deviceStatusLoading } = useQuery<{
    weightConnected: boolean;
    meterConnected: boolean;
  }>({
    queryKey: ["/api/quality/device-status"],
    enabled: user?.id !== undefined,
    refetchInterval: 5000, // 5 saniyede bir yenile
  });

  const { data: fabricTypes, isLoading: fabricTypesLoading } = useQuery<any[]>({
    queryKey: ["/api/product/fabric-types"],
    enabled: user?.id !== undefined,
  });

  const { data: machines, isLoading: machinesLoading } = useQuery<any[]>({
    queryKey: ["/api/machines"],
    enabled: user?.id !== undefined,
  });

  const { data: defectCodes, isLoading: defectCodesLoading } = useQuery<any[]>({
    queryKey: ["/api/quality/defect-codes"],
    enabled: user?.id !== undefined,
  });

  // Eğer url parametresi varsa, bir kumaş topuna ait ID var demektir
  useEffect(() => {
    if (params && params.id) {
      const id = parseInt(params.id);
      if (!isNaN(id)) {
        setFabricRollId(id);
        setIsNewRoll(false);
        setActiveTab("defects");
      }
    } else {
      setIsNewRoll(true);
      setFabricRollId(null);
      setActiveTab("roll-info");
    }
  }, [params]);

  // Kumaş topu bilgilerini getir (eğer mevcut bir top ise)
  const { 
    data: fabricRoll, 
    isLoading: fabricRollLoading, 
    refetch: refetchFabricRoll 
  } = useQuery<any>({
    queryKey: ["/api/quality/fabric-rolls", fabricRollId],
    enabled: fabricRollId !== null && !isNewRoll,
    onSuccess: (data) => {
      reset({
        barCode: data.barCode,
        batchNo: data.batchNo,
        fabricTypeId: data.fabricTypeId,
        width: data.width,
        length: data.length,
        weight: data.weight,
        color: data.color,
        machineId: data.machineId,
        notes: data.notes || "",
      });
    },
  });

  // Kumaş topu hataları
  const { 
    data: fabricDefects, 
    isLoading: fabricDefectsLoading,
    refetch: refetchFabricDefects
  } = useQuery<any[]>({
    queryKey: ["/api/quality/fabric-defects", fabricRollId],
    enabled: fabricRollId !== null,
    onSuccess: (data) => {
      setDefects(data);
    },
  });

  // Tartı değeri sorgulama
  const { data: currentWeightValue, refetch: refetchWeightValue } = useQuery<{ value: string }>({
    queryKey: ["/api/quality/weight-value"],
    enabled: deviceStatus?.weightConnected === true,
    refetchInterval: 1000,
    onSuccess: (data) => {
      setWeightValue(data.value);
    },
  });

  // Metre değeri sorgulama
  const { data: currentMeterValue, refetch: refetchMeterValue } = useQuery<{ value: string }>({
    queryKey: ["/api/quality/meter-value"],
    enabled: deviceStatus?.meterConnected === true,
    refetchInterval: 1000,
    onSuccess: (data) => {
      setMeterValue(data.value);
    },
  });

  // Kumaş topu oluşturma mutasyonu
  const createRollMutation = useMutation({
    mutationFn: async (rollData: RollFormInput) => {
      const response = await apiRequest("POST", "/api/quality/fabric-rolls", {
        ...rollData,
        status: "active",
        operatorId: user?.id,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Kumaş Topu Oluşturuldu",
        description: "Kumaş topu başarıyla kaydedildi. Şimdi hata kaydetmeye başlayabilirsiniz.",
      });
      setFabricRollId(data.id);
      setIsNewRoll(false);
      setActiveTab("defects");
      queryClient.invalidateQueries({ queryKey: ["/api/quality/fabric-rolls"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Kumaş topu oluşturulurken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Kumaş topu güncelleme mutasyonu
  const updateRollMutation = useMutation({
    mutationFn: async ({ id, rollData }: { id: number; rollData: Partial<RollFormInput> }) => {
      const response = await apiRequest("PUT", `/api/quality/fabric-rolls/${id}`, rollData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Kumaş Topu Güncellendi",
        description: "Kumaş topu bilgileri başarıyla güncellendi.",
      });
      refetchFabricRoll();
      queryClient.invalidateQueries({ queryKey: ["/api/quality/fabric-rolls"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Kumaş topu güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Hata ekleme mutasyonu
  const addDefectMutation = useMutation({
    mutationFn: async (defectData: DefectFormInput) => {
      const response = await apiRequest("POST", "/api/quality/fabric-defects", {
        ...defectData,
        fabricRollId,
        createdBy: user?.id,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Hata Kaydedildi",
        description: "Kumaş hatası başarıyla kaydedildi.",
      });
      setIsDefectDialogOpen(false);
      refetchFabricDefects();
      queryClient.invalidateQueries({ queryKey: ["/api/quality/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Kumaş hatası kaydedilirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Hata silme mutasyonu
  const deleteDefectMutation = useMutation({
    mutationFn: async (defectId: number) => {
      await apiRequest("DELETE", `/api/quality/fabric-defects/${defectId}`);
    },
    onSuccess: () => {
      toast({
        title: "Hata Silindi",
        description: "Kumaş hatası başarıyla silindi.",
      });
      setSelectedDefect(null);
      refetchFabricDefects();
      queryClient.invalidateQueries({ queryKey: ["/api/quality/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Kumaş hatası silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Kumaş topu durumunu güncelleme (tamamlandı/reddedildi)
  const updateRollStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/quality/fabric-rolls/${id}/status`, { status });
      return await response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.status === "completed" ? "Kontrol Tamamlandı" : "Kontrol Reddedildi",
        description: variables.status === "completed"
          ? "Kumaş kalite kontrolü başarıyla tamamlandı."
          : "Kumaş kalite kontrolü reddedildi.",
      });
      refetchFabricRoll();
      setIsConfirmDialogOpen(false);
      setLocation("/quality");
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Durum güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form tanımlamaları
  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue, 
    getValues, 
    formState: { errors, isSubmitting } 
  } = useForm<RollFormInput>({
    defaultValues: {
      barCode: "",
      batchNo: "",
      fabricTypeId: 0,
      width: "",
      length: "0.0",
      weight: "0.0",
      color: "",
      machineId: null,
      notes: ""
    }
  });

  const { 
    register: registerDefect, 
    handleSubmit: handleSubmitDefect, 
    reset: resetDefect, 
    setValue: setDefectValue, 
    formState: { errors: defectErrors, isSubmitting: isDefectSubmitting } 
  } = useForm<DefectFormInput>({
    defaultValues: {
      defectCode: "",
      startMeter: 0,
      endMeter: 0,
      width: 0,
      severity: "medium",
      description: ""
    }
  });

  // Değerleri otomatik güncelleme
  useEffect(() => {
    // COM port bağlı ise otomatik değer al, değilse manuel girilen değeri kullan
    if ((deviceStatus?.weightConnected || !deviceStatus?.weightConnected) && weightValue !== "0.0") {
      setValue("weight", weightValue);
    }
  }, [weightValue, deviceStatus?.weightConnected, setValue]);

  useEffect(() => {
    // COM port bağlı ise otomatik değer al, değilse manuel girilen değeri kullan
    if ((deviceStatus?.meterConnected || !deviceStatus?.meterConnected) && meterValue !== "0.0") {
      setValue("length", meterValue);
    }
  }, [meterValue, deviceStatus?.meterConnected, setValue]);

  // Formları yönetme
  const onSubmitRoll = (data: RollFormInput) => {
    if (isNewRoll) {
      createRollMutation.mutate(data);
    } else if (fabricRollId) {
      updateRollMutation.mutate({ id: fabricRollId, rollData: data });
    }
  };

  const onSubmitDefect = (data: DefectFormInput) => {
    if (fabricRollId) {
      addDefectMutation.mutate(data);
      resetDefect();
    }
  };

  const handleCompleteControl = (mode: "complete" | "reject") => {
    setDialogMode(mode);
    setIsConfirmDialogOpen(true);
  };

  const confirmStatusChange = () => {
    if (fabricRollId) {
      updateRollStatusMutation.mutate({
        id: fabricRollId,
        status: dialogMode === "complete" ? "completed" : "rejected"
      });
    }
  };

  const handleDeleteDefect = (defect: any) => {
    setSelectedDefect(defect);
  };

  const confirmDeleteDefect = () => {
    if (selectedDefect && selectedDefect.id) {
      deleteDefectMutation.mutate(selectedDefect.id);
    }
  };

  // Barkod tarama işlemi
  const handleBarcodeScan = async () => {
    if (!barcodeInputRef.current) return;

    const barcode = barcodeInputRef.current.value.trim();
    if (!barcode) {
      toast({
        title: "Barkod Boş",
        description: "Lütfen bir barkod girin veya tarayın.",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    
    try {
      const response = await fetch(`/api/quality/fabric-rolls/barcode/${barcode}`);
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Kumaş Topu Bulundu",
          description: `"${data.barCode}" barkodlu kumaş topu bulundu.`,
        });
        setLocation(`/quality/control/${data.id}`);
      } else if (response.status === 404) {
        // Yeni top oluştur
        setValue("barCode", barcode);
        toast({
          title: "Yeni Kumaş Topu",
          description: "Bu barkodla kayıtlı bir kumaş topu bulunamadı. Yeni kumaş topu oluşturulacak.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Hata",
          description: errorData.error || "Barkod sorgulanırken bir hata oluştu.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Bağlantı Hatası",
        description: "Sunucu ile bağlantı kurulamadı.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const addMeterValueAsDefect = () => {
    if (meterValue && Number(meterValue) > 0) {
      setDefectValue("startMeter", Number(meterValue));
      setDefectValue("endMeter", Number(meterValue) + 0.1);
      setIsDefectDialogOpen(true);
    }
  };

  // UI Render
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNewRoll ? "Yeni Kalite Kontrolü" : "Kalite Kontrolü"}
          </h1>
          <p className="text-muted-foreground">
            {isNewRoll
              ? "Yeni bir kumaş topu için kalite kontrolü başlatın"
              : "Mevcut kumaş topu için kalite kontrolü yapın"}
          </p>
        </div>
        <div className="flex items-center mt-4 md:mt-0 space-x-2">
          {!isNewRoll && (
            <>
              <Button 
                variant="outline" 
                onClick={() => handleCompleteControl("reject")}
              >
                <XCircle className="w-4 h-4 mr-2 text-red-500" />
                Reddet
              </Button>
              <Button 
                onClick={() => handleCompleteControl("complete")}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Tamamla
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Cihaz Durum Paneli */}
      <div className="grid grid-cols-2 gap-4">
        <Card className={deviceStatus?.weightConnected ? "border-green-500" : "border-red-500"}>
          <CardContent className="p-4 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Scale className={`w-5 h-5 mr-2 ${deviceStatus?.weightConnected ? "text-green-500" : "text-red-500"}`} />
                <div>
                  <h3 className="font-medium">Tartı Cihazı</h3>
                  <p className="text-sm text-muted-foreground">
                    {deviceStatus?.weightConnected ? "Bağlı" : "Bağlı Değil"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{weightValue}</span>
                <span className="ml-1">kg</span>
              </div>
            </div>
            {!deviceStatus?.weightConnected && (
              <div className="pt-2 flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="Manuel ağırlık girişi"
                  className="max-w-[180px]"
                  step="0.1"
                  onChange={(e) => setWeightValue(e.target.value)}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setValue("weight", weightValue)}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Uygula
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={deviceStatus?.meterConnected ? "border-green-500" : "border-red-500"}>
          <CardContent className="p-4 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Ruler className={`w-5 h-5 mr-2 ${deviceStatus?.meterConnected ? "text-green-500" : "text-red-500"}`} />
                <div>
                  <h3 className="font-medium">Metre Cihazı</h3>
                  <p className="text-sm text-muted-foreground">
                    {deviceStatus?.meterConnected ? "Bağlı" : "Bağlı Değil"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{meterValue}</span>
                <span className="ml-1">m</span>
              </div>
            </div>
            {!deviceStatus?.meterConnected && (
              <div className="pt-2 flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="Manuel metre girişi"
                  className="max-w-[180px]"
                  step="0.1"
                  onChange={(e) => setMeterValue(e.target.value)}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setValue("length", meterValue)}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Uygula
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Barkod Tarama */}
      <Card>
        <CardHeader>
          <CardTitle>Barkod Tarama</CardTitle>
          <CardDescription>
            Kumaş topu barkodunu tarayın veya girin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              ref={barcodeInputRef}
              placeholder="Barkod tarayın veya girin"
              className="flex-1"
            />
            <Button 
              onClick={handleBarcodeScan}
              disabled={isScanning}
            >
              {isScanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Ara
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ana içerik */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="roll-info">Top Bilgileri</TabsTrigger>
          <TabsTrigger value="defects" disabled={isNewRoll}>Hatalar</TabsTrigger>
        </TabsList>
        
        {/* Top Bilgileri Tab */}
        <TabsContent value="roll-info">
          <Card>
            <form ref={rollFormRef} onSubmit={handleSubmit(onSubmitRoll)}>
              <CardHeader>
                <CardTitle>Kumaş Topu Bilgileri</CardTitle>
                <CardDescription>
                  Kalite kontrolü yapılacak kumaş topu bilgilerini girin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="barCode">Barkod *</Label>
                    <Input
                      id="barCode"
                      {...register("barCode", { required: "Barkod gereklidir" })}
                    />
                    {errors.barCode && (
                      <p className="text-sm font-medium text-destructive">{errors.barCode.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="batchNo">Parti No *</Label>
                    <Input
                      id="batchNo"
                      {...register("batchNo", { required: "Parti no gereklidir" })}
                    />
                    {errors.batchNo && (
                      <p className="text-sm font-medium text-destructive">{errors.batchNo.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fabricTypeId">Kumaş Tipi *</Label>
                    <Select 
                      onValueChange={(value) => setValue("fabricTypeId", Number(value))}
                      defaultValue={getValues("fabricTypeId")?.toString() || undefined}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kumaş tipi seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {fabricTypesLoading ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Yükleniyor...
                          </div>
                        ) : fabricTypes && fabricTypes.length > 0 ? (
                          fabricTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-sm">
                            Kumaş tipi bulunamadı
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {errors.fabricTypeId && (
                      <p className="text-sm font-medium text-destructive">{errors.fabricTypeId.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="machineId">Makine</Label>
                    <Select 
                      onValueChange={(value) => setValue("machineId", Number(value))}
                      defaultValue={getValues("machineId")?.toString() || undefined}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Makine seçin (isteğe bağlı)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Seçilmedi</SelectItem>
                        {machinesLoading ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Yükleniyor...
                          </div>
                        ) : machines && machines.length > 0 ? (
                          machines.map((machine) => (
                            <SelectItem key={machine.id} value={machine.id.toString()}>
                              {machine.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-sm">
                            Makine bulunamadı
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="width">Genişlik (cm)</Label>
                    <Input
                      id="width"
                      type="text"
                      {...register("width")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="length">Uzunluk (m)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="length"
                        type="text"
                        {...register("length")}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => refetchMeterValue()}
                        disabled={!deviceStatus?.meterConnected}
                        size="icon"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="weight">Ağırlık (kg)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="weight"
                        type="text"
                        {...register("weight")}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => refetchWeightValue()}
                        disabled={!deviceStatus?.weightConnected}
                        size="icon"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Renk</Label>
                    <Input
                      id="color"
                      {...register("color")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notlar</Label>
                    <Input
                      id="notes"
                      {...register("notes")}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="ml-auto"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isNewRoll ? "Kaydet ve Devam Et" : "Güncelle"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        {/* Hatalar Tab */}
        <TabsContent value="defects">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Kumaş Hataları</CardTitle>
                <CardDescription>Tespit edilen kumaş hatalarını kaydedin</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={addMeterValueAsDefect}
                  disabled={meterValue === "0.0"}
                >
                  <Ruler className="w-4 h-4 mr-2" />
                  Mevcut Metrajda Ekle
                </Button>
                <Button onClick={() => setIsDefectDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Hata Ekle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {fabricDefectsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : defects && defects.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hata Kodu</TableHead>
                        <TableHead>Başlangıç (m)</TableHead>
                        <TableHead>Bitiş (m)</TableHead>
                        <TableHead>Genişlik (cm)</TableHead>
                        <TableHead>Şiddet</TableHead>
                        <TableHead>Açıklama</TableHead>
                        <TableHead>İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {defects.map((defect) => (
                        <TableRow key={defect.id}>
                          <TableCell>{defect.defectCode}</TableCell>
                          <TableCell>{defect.startMeter}</TableCell>
                          <TableCell>{defect.endMeter}</TableCell>
                          <TableCell>{defect.width}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                defect.severity === "high" 
                                  ? "destructive" 
                                  : defect.severity === "medium" 
                                    ? "default" 
                                    : "outline"
                              }
                            >
                              {defect.severity === "high" 
                                ? "Yüksek" 
                                : defect.severity === "medium" 
                                  ? "Orta" 
                                  : "Düşük"}
                            </Badge>
                          </TableCell>
                          <TableCell>{defect.description}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteDefect(defect)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Hata Kaydı Bulunamadı</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mt-2">
                    Bu kumaş topu için henüz hata kaydı bulunmamaktadır. Hata kaydetmek için
                    "Yeni Hata Ekle" butonunu kullanabilirsiniz.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Toplam: <span className="font-medium">{defects?.length || 0}</span> hata kaydı
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleCompleteControl("reject")}
                >
                  <XCircle className="w-4 h-4 mr-2 text-red-500" />
                  Reddet
                </Button>
                <Button 
                  onClick={() => handleCompleteControl("complete")}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Tamamla
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Hata Ekleme Dialog */}
      <Dialog open={isDefectDialogOpen} onOpenChange={setIsDefectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmitDefect(onSubmitDefect)}>
            <DialogHeader>
              <DialogTitle>Yeni Hata Kaydı</DialogTitle>
              <DialogDescription>
                Tespit edilen kumaş hatasının detaylarını girin
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defectCode">Hata Kodu *</Label>
                  <Select 
                    onValueChange={(value) => setDefectValue("defectCode", value)}
                    defaultValue=""
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Hata kodu seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {defectCodesLoading ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Yükleniyor...
                        </div>
                      ) : defectCodes && defectCodes.length > 0 ? (
                        defectCodes.map((code) => (
                          <SelectItem key={code.code} value={code.code}>
                            {code.code} - {code.description}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-center text-sm">
                          Hata kodu bulunamadı
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {defectErrors.defectCode && (
                    <p className="text-sm font-medium text-destructive">{defectErrors.defectCode.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startMeter">Başlangıç Metresi *</Label>
                  <Input
                    id="startMeter"
                    type="number"
                    step="0.1"
                    {...registerDefect("startMeter", { 
                      required: "Başlangıç metresi gereklidir",
                      valueAsNumber: true
                    })}
                  />
                  {defectErrors.startMeter && (
                    <p className="text-sm font-medium text-destructive">{defectErrors.startMeter.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endMeter">Bitiş Metresi *</Label>
                  <Input
                    id="endMeter"
                    type="number"
                    step="0.1"
                    {...registerDefect("endMeter", { 
                      required: "Bitiş metresi gereklidir",
                      valueAsNumber: true
                    })}
                  />
                  {defectErrors.endMeter && (
                    <p className="text-sm font-medium text-destructive">{defectErrors.endMeter.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Genişlik (cm) *</Label>
                  <Input
                    id="width"
                    type="number"
                    {...registerDefect("width", { 
                      required: "Genişlik gereklidir",
                      valueAsNumber: true
                    })}
                  />
                  {defectErrors.width && (
                    <p className="text-sm font-medium text-destructive">{defectErrors.width.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="severity">Şiddet *</Label>
                  <Select 
                    onValueChange={(value) => 
                      setDefectValue("severity", value as "low" | "medium" | "high")
                    }
                    defaultValue="medium"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Şiddet seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Düşük</SelectItem>
                      <SelectItem value="medium">Orta</SelectItem>
                      <SelectItem value="high">Yüksek</SelectItem>
                    </SelectContent>
                  </Select>
                  {defectErrors.severity && (
                    <p className="text-sm font-medium text-destructive">{defectErrors.severity.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Input
                  id="description"
                  {...registerDefect("description")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDefectDialogOpen(false)}
              >
                İptal
              </Button>
              <Button 
                type="submit"
                disabled={isDefectSubmitting}
              >
                {isDefectSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Onay Dialogu */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogMode === "complete" ? "Kontrolü Tamamla" : "Kontrolü Reddet"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogMode === "complete"
                ? "Bu işlem kumaş topu kalite kontrolünü tamamlayacaktır. Devam etmek istiyor musunuz?"
                : "Bu işlem kumaş topu kalite kontrolünü reddedecektir. Devam etmek istiyor musunuz?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              {dialogMode === "complete" ? "Tamamla" : "Reddet"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Silme Onay Dialogu */}
      <AlertDialog 
        open={selectedDefect !== null} 
        onOpenChange={(open) => !open && setSelectedDefect(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hata Kaydını Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem hata kaydını kalıcı olarak silecektir. Devam etmek istiyor musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDefect}>
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}