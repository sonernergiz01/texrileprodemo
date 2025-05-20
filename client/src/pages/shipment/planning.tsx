import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Truck } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Sahte veri sadece görsel amaçlıdır, gerçek uygulamada API'den gelecektir
const dummyShipments = [
  {
    id: 1,
    orderNumber: "SIP-2023-001",
    customerName: "Tekstil A.Ş.",
    destination: "İstanbul",
    plannedDate: new Date("2025-05-06"),
    status: "Planlandı",
    totalQuantity: 1250,
    units: "metre",
    transportMethod: "Karayolu",
    driver: "Ahmet Yılmaz",
    vehicle: "34 ABC 123",
  },
  {
    id: 2,
    orderNumber: "SIP-2023-002",
    customerName: "Kumaş Ltd.",
    destination: "Ankara",
    plannedDate: new Date("2025-05-08"),
    status: "Hazırlanıyor",
    totalQuantity: 850,
    units: "metre",
    transportMethod: "Karayolu",
    driver: "Mehmet Demir",
    vehicle: "06 XYZ 789",
  },
  {
    id: 3,
    orderNumber: "SIP-2023-005",
    customerName: "Global Tekstil",
    destination: "İzmir",
    plannedDate: new Date("2025-05-10"),
    status: "Planlandı",
    totalQuantity: 2000,
    units: "metre",
    transportMethod: "Karayolu",
    driver: "Ali Kaya",
    vehicle: "35 DEF 456",
  },
];

// Sevkiyat planı için Zod şeması
const shipmentFormSchema = z.object({
  orderNumber: z.string().min(1, "Sipariş numarası gereklidir"),
  customerName: z.string().min(1, "Müşteri adı gereklidir"),
  destination: z.string().min(1, "Varış yeri gereklidir"),
  plannedDate: z.date({
    required_error: "Sevkiyat tarihi gereklidir",
  }),
  transportMethod: z.string().min(1, "Taşıma yöntemi gereklidir"),
  driver: z.string().optional(),
  vehicle: z.string().optional(),
  totalQuantity: z.coerce.number().min(1, "Miktar en az 1 olmalıdır"),
  units: z.string().min(1, "Birim gereklidir"),
});

type ShipmentFormValues = z.infer<typeof shipmentFormSchema>;

// Kolon tanımları
const columns: ColumnDef<typeof dummyShipments[0]>[] = [
  {
    accessorKey: "orderNumber",
    header: "Sipariş No",
  },
  {
    accessorKey: "customerName",
    header: "Müşteri",
  },
  {
    accessorKey: "destination",
    header: "Varış Yeri",
  },
  {
    accessorKey: "plannedDate",
    header: "Planlanan Tarih",
    cell: ({ row }) => format(row.original.plannedDate, "dd MMMM yyyy", { locale: tr }),
  },
  {
    accessorKey: "totalQuantity",
    header: "Miktar",
    cell: ({ row }) => `${row.original.totalQuantity} ${row.original.units}`,
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => {
      const status = row.original.status;
      let color = "";
      switch (status) {
        case "Planlandı":
          color = "bg-blue-100 text-blue-800";
          break;
        case "Hazırlanıyor":
          color = "bg-yellow-100 text-yellow-800";
          break;
        case "Tamamlandı":
          color = "bg-green-100 text-green-800";
          break;
        case "İptal Edildi":
          color = "bg-red-100 text-red-800";
          break;
        default:
          color = "bg-gray-100 text-gray-800";
      }
      return <Badge className={color}>{status}</Badge>;
    },
  },
  {
    id: "actions",
    header: "İşlemler",
    cell: ({ row }) => (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Detaylar
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Sevkiyat Detayları - {row.original.orderNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Sipariş Bilgileri</h3>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Sipariş No:</span>
                  <span className="text-sm">{row.original.orderNumber}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Müşteri:</span>
                  <span className="text-sm">{row.original.customerName}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Miktar:</span>
                  <span className="text-sm">{row.original.totalQuantity} {row.original.units}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Durum:</span>
                  <span className="text-sm">{row.original.status}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Sevkiyat Bilgileri</h3>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Planlanan Tarih:</span>
                  <span className="text-sm">{format(row.original.plannedDate, "dd MMMM yyyy", { locale: tr })}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Varış Yeri:</span>
                  <span className="text-sm">{row.original.destination}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Taşıma Yöntemi:</span>
                  <span className="text-sm">{row.original.transportMethod}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Şoför:</span>
                  <span className="text-sm">{row.original.driver}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Araç Plakası:</span>
                  <span className="text-sm">{row.original.vehicle}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline">Düzenle</Button>
            <Button variant="default">İrsaliye Oluştur</Button>
          </div>
        </DialogContent>
      </Dialog>
    ),
  },
];

function ShipmentPlanning() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form 
  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues: {
      orderNumber: "",
      customerName: "",
      destination: "",
      plannedDate: new Date(),
      transportMethod: "Karayolu",
      driver: "",
      vehicle: "",
      totalQuantity: 0,
      units: "metre",
    },
  });

  const onSubmit = async (data: ShipmentFormValues) => {
    setIsSubmitting(true);
    try {
      // Burada API çağrısı yapılacak
      console.log("Form data:", data);
      
      // API çağrısı simülasyonu
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: "Sevkiyat planı oluşturuldu",
        description: "Sevkiyat planı başarıyla oluşturuldu.",
      });
      
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Sevkiyat planı oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sevkiyat Planlaması</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              Yeni Sevkiyat Planı
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Yeni Sevkiyat Planı Oluştur</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="orderNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sipariş No</FormLabel>
                        <FormControl>
                          <Input placeholder="SIP-2023-XXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Müşteri</FormLabel>
                        <FormControl>
                          <Input placeholder="Müşteri adı" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Varış Yeri</FormLabel>
                        <FormControl>
                          <Input placeholder="Şehir/Ülke" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="plannedDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Planlanan Tarih</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                              >
                                {field.value ? (
                                  format(field.value, "dd MMMM yyyy", { locale: tr })
                                ) : (
                                  <span>Tarih seçin</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="transportMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taşıma Yöntemi</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Karayolu">Karayolu</SelectItem>
                            <SelectItem value="Denizyolu">Denizyolu</SelectItem>
                            <SelectItem value="Havayolu">Havayolu</SelectItem>
                            <SelectItem value="Demiryolu">Demiryolu</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="totalQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Miktar</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="units"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birim</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="metre">Metre</SelectItem>
                            <SelectItem value="kg">Kilogram</SelectItem>
                            <SelectItem value="adet">Adet</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="driver"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Şoför</FormLabel>
                        <FormControl>
                          <Input placeholder="Şoför adı" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vehicle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Araç Plakası</FormLabel>
                        <FormControl>
                          <Input placeholder="34 ABC 123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Kaydet
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sevkiyat Planları</CardTitle>
          <CardDescription>
            Planlanan ve devam eden tüm sevkiyatların listesi. Toplam {dummyShipments.length} sevkiyat bulundu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={dummyShipments} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ShipmentPlanning;