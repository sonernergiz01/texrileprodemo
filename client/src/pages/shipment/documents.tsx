import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Printer, Download, Eye, Loader2, FilePlus2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Sahte veri, gerçek uygulamada API'den gelecektir
const dummyInvoices = [
  {
    id: 1,
    invoiceNumber: "FTR-2023-001",
    orderNumber: "SIP-2023-001",
    customerName: "Tekstil A.Ş.",
    issueDate: new Date("2025-05-06"),
    dueDate: new Date("2025-06-06"),
    amount: 25000,
    currency: "TL",
    status: "Ödendi",
    type: "KDV Dahil",
  },
  {
    id: 2,
    invoiceNumber: "FTR-2023-002",
    orderNumber: "SIP-2023-002",
    customerName: "Kumaş Ltd.",
    issueDate: new Date("2025-05-08"),
    dueDate: new Date("2025-06-08"),
    amount: 18500,
    currency: "TL",
    status: "Bekliyor",
    type: "KDV Dahil",
  },
  {
    id: 3,
    invoiceNumber: "FTR-2023-003",
    orderNumber: "SIP-2023-005",
    customerName: "Global Tekstil",
    issueDate: new Date("2025-05-10"),
    dueDate: new Date("2025-06-10"),
    amount: 42000,
    currency: "TL",
    status: "Bekliyor",
    type: "KDV Dahil",
  },
];

const dummyDispatchNotes = [
  {
    id: 1,
    dispatchNumber: "IRS-2023-001",
    orderNumber: "SIP-2023-001",
    customerName: "Tekstil A.Ş.",
    issueDate: new Date("2025-05-06"),
    deliveryDate: new Date("2025-05-08"),
    status: "Teslim Edildi",
  },
  {
    id: 2,
    dispatchNumber: "IRS-2023-002",
    orderNumber: "SIP-2023-002",
    customerName: "Kumaş Ltd.",
    issueDate: new Date("2025-05-08"),
    deliveryDate: new Date("2025-05-10"),
    status: "Hazırlanıyor",
  },
  {
    id: 3,
    dispatchNumber: "IRS-2023-003",
    orderNumber: "SIP-2023-005",
    customerName: "Global Tekstil",
    issueDate: new Date("2025-05-10"),
    deliveryDate: new Date("2025-05-12"),
    status: "Yolda",
  },
];

// Fatura ve irsaliye oluşturma şeması
const documentFormSchema = z.object({
  orderNumber: z.string().min(1, "Sipariş numarası gereklidir"),
  customerName: z.string().min(1, "Müşteri adı gereklidir"),
  documentType: z.enum(["invoice", "dispatch"]),
  issueDate: z.date({
    required_error: "Belge tarihi gereklidir",
  }),
  dueDate: z.date().optional(),
  amount: z.coerce.number().optional(),
  currency: z.string().optional(),
  invoiceType: z.string().optional(),
  deliveryDate: z.date().optional(),
});

type DocumentFormValues = z.infer<typeof documentFormSchema>;

// Fatura kolon tanımları
const invoiceColumns: ColumnDef<typeof dummyInvoices[0]>[] = [
  {
    accessorKey: "invoiceNumber",
    header: "Fatura No",
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
    accessorKey: "issueDate",
    header: "Fatura Tarihi",
    cell: ({ row }) => format(row.original.issueDate, "dd MMMM yyyy", { locale: tr }),
  },
  {
    accessorKey: "dueDate",
    header: "Vade Tarihi",
    cell: ({ row }) => format(row.original.dueDate, "dd MMMM yyyy", { locale: tr }),
  },
  {
    accessorKey: "amount",
    header: "Tutar",
    cell: ({ row }) => `${row.original.amount.toLocaleString('tr-TR')} ${row.original.currency}`,
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => {
      const status = row.original.status;
      let color = "";
      switch (status) {
        case "Ödendi":
          color = "bg-green-100 text-green-800";
          break;
        case "Bekliyor":
          color = "bg-yellow-100 text-yellow-800";
          break;
        case "Gecikti":
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
      <div className="flex space-x-2">
        <Button variant="outline" size="icon">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon">
          <Printer className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];

// İrsaliye kolon tanımları
const dispatchColumns: ColumnDef<typeof dummyDispatchNotes[0]>[] = [
  {
    accessorKey: "dispatchNumber",
    header: "İrsaliye No",
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
    accessorKey: "issueDate",
    header: "Düzenleme Tarihi",
    cell: ({ row }) => format(row.original.issueDate, "dd MMMM yyyy", { locale: tr }),
  },
  {
    accessorKey: "deliveryDate",
    header: "Teslimat Tarihi",
    cell: ({ row }) => format(row.original.deliveryDate, "dd MMMM yyyy", { locale: tr }),
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => {
      const status = row.original.status;
      let color = "";
      switch (status) {
        case "Teslim Edildi":
          color = "bg-green-100 text-green-800";
          break;
        case "Hazırlanıyor":
          color = "bg-yellow-100 text-yellow-800";
          break;
        case "Yolda":
          color = "bg-blue-100 text-blue-800";
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
      <div className="flex space-x-2">
        <Button variant="outline" size="icon">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon">
          <Printer className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];

function ShipmentDocuments() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [documentType, setDocumentType] = useState<"invoice" | "dispatch">("invoice");

  // Form 
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      orderNumber: "",
      customerName: "",
      documentType: "invoice",
      issueDate: new Date(),
      dueDate: undefined,
      amount: 0,
      currency: "TL",
      invoiceType: "KDV Dahil",
      deliveryDate: undefined,
    },
  });

  const watchDocumentType = form.watch("documentType");

  const onSubmit = async (data: DocumentFormValues) => {
    setIsSubmitting(true);
    try {
      // Burada API çağrısı yapılacak
      console.log("Form data:", data);
      
      // API çağrısı simülasyonu
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: data.documentType === "invoice" ? "Fatura oluşturuldu" : "İrsaliye oluşturuldu",
        description: "Belge başarıyla oluşturuldu.",
      });
      
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Belge oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">İrsaliye ve Fatura Yönetimi</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <FilePlus2 className="mr-2 h-4 w-4" />
              Yeni Belge Oluştur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Yeni Belge Oluştur</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Belge Tipi</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setDocumentType(value as "invoice" | "dispatch");
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="invoice">Fatura</SelectItem>
                            <SelectItem value="dispatch">İrsaliye</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Belge Tarihi</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value ? format(field.value, "yyyy-MM-dd") : ""} 
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

                {watchDocumentType === "invoice" && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tutar</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} step={0.01} placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Para Birimi</FormLabel>
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
                                <SelectItem value="TL">TL</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="invoiceType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fatura Tipi</FormLabel>
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
                                <SelectItem value="KDV Dahil">KDV Dahil</SelectItem>
                                <SelectItem value="KDV Hariç">KDV Hariç</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vade Tarihi</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""} 
                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {watchDocumentType === "dispatch" && (
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="deliveryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teslimat Tarihi</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value ? format(field.value, "yyyy-MM-dd") : ""} 
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
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

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invoices" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Faturalar
          </TabsTrigger>
          <TabsTrigger value="dispatches" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            İrsaliyeler
          </TabsTrigger>
        </TabsList>
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Faturalar</CardTitle>
              <CardDescription>
                Tüm faturalarınızın listesi. Toplam {dummyInvoices.length} fatura bulundu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={invoiceColumns} data={dummyInvoices} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="dispatches">
          <Card>
            <CardHeader>
              <CardTitle>İrsaliyeler</CardTitle>
              <CardDescription>
                Tüm irsaliyelerinizin listesi. Toplam {dummyDispatchNotes.length} irsaliye bulundu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={dispatchColumns} data={dummyDispatchNotes} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShipmentDocuments;