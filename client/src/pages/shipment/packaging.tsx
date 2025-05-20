import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Tag, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

// Sahte veri, gerçek uygulamada API'den gelecektir
const dummyPackaging = [
  {
    id: 1,
    packageNumber: "PKG-2023-001",
    orderNumber: "SIP-2023-001",
    customerName: "Tekstil A.Ş.",
    productName: "Pamuklu Kumaş - Beyaz",
    packagingDate: new Date("2025-05-05"),
    packageType: "Rulo",
    quantity: 500,
    unit: "metre",
    width: 150,
    weight: 120,
    status: "Hazır",
    hasPrintedLabel: true,
  },
  {
    id: 2,
    packageNumber: "PKG-2023-002",
    orderNumber: "SIP-2023-002",
    customerName: "Kumaş Ltd.",
    productName: "Polyester Kumaş - Lacivert",
    packagingDate: new Date("2025-05-07"),
    packageType: "Rulo",
    quantity: 350,
    unit: "metre",
    width: 140,
    weight: 95,
    status: "Hazırlanıyor",
    hasPrintedLabel: false,
  },
  {
    id: 3,
    packageNumber: "PKG-2023-003",
    orderNumber: "SIP-2023-005",
    customerName: "Global Tekstil",
    productName: "Keten Kumaş - Bej",
    packagingDate: new Date("2025-05-09"),
    packageType: "Rulo",
    quantity: 800,
    unit: "metre",
    width: 160,
    weight: 180,
    status: "Hazır",
    hasPrintedLabel: true,
  },
];

// Ambalajlama formu için Zod şeması
const packagingFormSchema = z.object({
  orderNumber: z.string().min(1, "Sipariş numarası gereklidir"),
  customerName: z.string().min(1, "Müşteri adı gereklidir"),
  productName: z.string().min(1, "Ürün adı gereklidir"),
  packageType: z.string().min(1, "Ambalaj tipi gereklidir"),
  quantity: z.coerce.number().min(1, "Miktar en az 1 olmalıdır"),
  unit: z.string().min(1, "Birim gereklidir"),
  width: z.coerce.number().min(1, "Genişlik en az 1 olmalıdır"),
  weight: z.coerce.number().min(1, "Ağırlık en az 1 olmalıdır"),
  specialInstructions: z.string().optional(),
  printLabel: z.boolean().default(false),
});

type PackagingFormValues = z.infer<typeof packagingFormSchema>;

// Kolon tanımları
const columns: ColumnDef<typeof dummyPackaging[0]>[] = [
  {
    accessorKey: "packageNumber",
    header: "Paket No",
  },
  {
    accessorKey: "orderNumber",
    header: "Sipariş No",
  },
  {
    accessorKey: "customerName",
    header: "Müşteri",
  },
  {
    accessorKey: "productName",
    header: "Ürün",
  },
  {
    accessorKey: "packagingDate",
    header: "Ambalajlama Tarihi",
    cell: ({ row }) => format(row.original.packagingDate, "dd MMMM yyyy", { locale: tr }),
  },
  {
    accessorKey: "quantity",
    header: "Miktar",
    cell: ({ row }) => `${row.original.quantity} ${row.original.unit}`,
  },
  {
    accessorKey: "packageType",
    header: "Ambalaj Tipi",
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => {
      const status = row.original.status;
      let color = "";
      switch (status) {
        case "Hazır":
          color = "bg-green-100 text-green-800";
          break;
        case "Hazırlanıyor":
          color = "bg-yellow-100 text-yellow-800";
          break;
        default:
          color = "bg-gray-100 text-gray-800";
      }
      return <Badge className={color}>{status}</Badge>;
    },
  },
  {
    accessorKey: "hasPrintedLabel",
    header: "Etiket",
    cell: ({ row }) => (
      row.original.hasPrintedLabel ? 
        <CheckCircle2 className="h-5 w-5 text-green-500" /> : 
        <Badge variant="outline">Etiket Bekliyor</Badge>
    ),
  },
  {
    id: "actions",
    header: "İşlemler",
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <Button 
          variant={row.original.hasPrintedLabel ? "outline" : "default"}
          size="sm"
          disabled={row.original.hasPrintedLabel}
        >
          <Tag className="h-4 w-4 mr-1" />
          {row.original.hasPrintedLabel ? "Etiket Basıldı" : "Etiket Bas"}
        </Button>
        <Button variant="outline" size="sm">
          Detaylar
        </Button>
      </div>
    ),
  },
];

function ShipmentPackaging() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form 
  const form = useForm<PackagingFormValues>({
    resolver: zodResolver(packagingFormSchema),
    defaultValues: {
      orderNumber: "",
      customerName: "",
      productName: "",
      packageType: "Rulo",
      quantity: 0,
      unit: "metre",
      width: 0,
      weight: 0,
      specialInstructions: "",
      printLabel: false,
    },
  });

  const onSubmit = async (data: PackagingFormValues) => {
    setIsSubmitting(true);
    try {
      // Burada API çağrısı yapılacak
      console.log("Form data:", data);
      
      // API çağrısı simülasyonu
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: "Ambalajlama oluşturuldu",
        description: "Ambalajlama kaydı başarıyla oluşturuldu.",
      });
      
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ambalajlama kaydı oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ambalajlama</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Package className="mr-2 h-4 w-4" />
              Yeni Ambalajlama
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Yeni Ambalajlama Kaydı</DialogTitle>
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
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="productName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ürün Adı</FormLabel>
                        <FormControl>
                          <Input placeholder="Ürün adı ve özellikleri" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="packageType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ambalaj Tipi</FormLabel>
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
                            <SelectItem value="Rulo">Rulo</SelectItem>
                            <SelectItem value="Koli">Koli</SelectItem>
                            <SelectItem value="Palet">Palet</SelectItem>
                            <SelectItem value="Diğer">Diğer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
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
                    name="unit"
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
                    name="width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Genişlik (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ağırlık (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="specialInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Özel Talimatlar</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Özel ambalajlama talimatları, notlar..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="printLabel"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Etiket Bas
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          İşlemi tamamladıktan sonra otomatik olarak etiket bas
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                
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
          <CardTitle>Ambalajlama Kayıtları</CardTitle>
          <CardDescription>
            Tüm ambalajlama kayıtlarının listesi. Toplam {dummyPackaging.length} ambalajlama kaydı bulundu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={dummyPackaging} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ShipmentPackaging;