import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Edit, Printer, Tag, CheckSquare, Clock, CirclePlus, Filter, Search, FileBarChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/layout/page-header";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Üretim refakat kartı formu şeması
const productionCardSchema = z.object({
  cardNumber: z.string().min(1, "Kart numarası zorunludur"),
  batchNumber: z.string().min(1, "Parti numarası zorunludur"),
  orderId: z.number().min(1, "Sipariş seçimi zorunludur"),
  orderNumber: z.string().min(1, "Sipariş numarası zorunludur"),
  productionPlanId: z.number().nullable().optional(),
  productName: z.string().min(1, "Ürün adı zorunludur"),
  quantity: z.string().min(1, "Miktar zorunludur"),
  unit: z.string().min(1, "Birim zorunludur"),
  status: z.string().default("draft"),
  currentDepartmentId: z.number().nullable().optional(),
  routeTemplateId: z.number().nullable().optional(),
  notes: z.string().optional(),
});

type ProductionCardFormValues = z.infer<typeof productionCardSchema>;

export default function ProductionCardsPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form için tanımlamalar
  const form = useForm<ProductionCardFormValues>({
    resolver: zodResolver(productionCardSchema),
    defaultValues: {
      cardNumber: "",
      batchNumber: "",
      orderId: 0,
      orderNumber: "",
      productName: "",
      quantity: "",
      unit: "m",
      status: "draft",
      notes: "",
    },
  });

  // API istekleri
  const { data: productionCards, isLoading } = useQuery({
    queryKey: ['/api/planning/production-cards'],
    staleTime: 30000,
  });

  const { data: orders } = useQuery({
    queryKey: ['/api/orders'],
    staleTime: 30000,
  });

  const { data: departments } = useQuery({
    queryKey: ['/api/admin/departments'],
    staleTime: 60000,
  });

  const { data: routeTemplates } = useQuery({
    queryKey: ['/api/planning/route-templates'],
    staleTime: 60000,
  });

  // Refakat kartı oluşturma mutation
  const createCardMutation = useMutation({
    mutationFn: async (data: ProductionCardFormValues) => {
      const response = await apiRequest("POST", "/api/planning/production-cards", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Refakat kartı oluşturulurken bir hata oluştu");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Üretim refakat kartı başarıyla oluşturuldu",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/planning/production-cards'] });
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

  // Form gönderme işleyicisi
  const onSubmit = (data: ProductionCardFormValues) => {
    createCardMutation.mutate(data);
  };

  // Sipariş seçildiğinde form alanlarını doldur
  const handleOrderSelect = (orderId: string) => {
    const selectedOrder = orders?.find(o => o.id === parseInt(orderId));
    if (selectedOrder) {
      // Sipariş bilgilerini otomatik doldur
      form.setValue("orderNumber", selectedOrder.orderNumber);
      form.setValue("productName", selectedOrder.notes || "");
      form.setValue("quantity", selectedOrder.quantity);
      
      // Eğer sipariş numarasından parti numarası oluşturursak
      const today = new Date();
      const batchNumber = `${selectedOrder.orderNumber}-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
      form.setValue("batchNumber", batchNumber);
      
      // Otomatik kart numarası oluştur
      const cardNumber = `ÜRK-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${orderId}`;
      form.setValue("cardNumber", cardNumber);
    }
  };

  // Filtrelere göre kartları filtrele
  const filteredCards = productionCards?.filter(card => {
    // Önce durum filtresini uygula
    let statusMatch = true;
    if (selectedFilter !== "all") {
      statusMatch = card.status === selectedFilter;
    }
    
    // Sonra arama sorgusunu uygula
    let searchMatch = true;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      searchMatch = 
        card.cardNumber.toLowerCase().includes(query) ||
        card.batchNumber.toLowerCase().includes(query) ||
        card.orderNumber.toLowerCase().includes(query) ||
        card.productName.toLowerCase().includes(query);
    }
    
    return statusMatch && searchMatch;
  });

  // Durum badge'i için renk belirle
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Taslak</Badge>;
      case 'in-progress':
        return <Badge variant="secondary">Üretimde</Badge>;
      case 'completed':
        return <Badge variant="success">Tamamlandı</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">İptal</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Departman adını ID'den bul
  const getDepartmentName = (deptId: number) => {
    const department = departments?.find(d => d.id === deptId);
    return department ? department.name : "Bilinmiyor";
  };

  return (
    <>
      <PageHeader 
        title="Üretim Refakat Kartları" 
        subtitle="Üretim sürecini takip eden refakat kartlarını yönetin"
        icon={<Tag className="h-6 w-6" />}
      />

      <div className="p-4 md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative flex items-center w-64">
              <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Kart ara..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select 
              value={selectedFilter}
              onValueChange={setSelectedFilter}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Tüm Kartlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kartlar</SelectItem>
                <SelectItem value="draft">Taslak</SelectItem>
                <SelectItem value="in-progress">Üretimde</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="cancelled">İptal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => setLocation("/planning/tracking-dashboard")}
            >
              <FileBarChart className="h-4 w-4" />
              <span>İzleme Paneli</span>
            </Button>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-1"
            >
              <CirclePlus className="h-4 w-4" />
              <span>Yeni Refakat Kartı</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {filteredCards && filteredCards.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kart No</TableHead>
                      <TableHead>Sipariş No</TableHead>
                      <TableHead>Parti No</TableHead>
                      <TableHead>Ürün</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Bulunduğu Bölüm</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCards.map((card) => (
                      <TableRow key={card.id}>
                        <TableCell className="font-medium">{card.cardNumber}</TableCell>
                        <TableCell>{card.orderNumber}</TableCell>
                        <TableCell>{card.batchNumber}</TableCell>
                        <TableCell>{card.productName}</TableCell>
                        <TableCell>{card.quantity} {card.unit}</TableCell>
                        <TableCell>{getStatusBadge(card.status)}</TableCell>
                        <TableCell>
                          {card.currentDepartmentId ? 
                            getDepartmentName(card.currentDepartmentId) : 
                            "Henüz bir bölümde değil"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setLocation(`/planning/production-cards/${card.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setLocation(`/planning/production-cards/${card.id}/print`)}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="bg-muted/30 p-8 rounded-md flex flex-col items-center justify-center h-64">
                <Tag className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-xl font-medium">Üretim refakat kartı bulunamadı</h3>
                <p className="text-muted-foreground mb-4">Henüz oluşturulmuş bir üretim refakat kartı yok veya filtrelere uygun sonuç bulunamadı.</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>Yeni Refakat Kartı Oluştur</Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Yeni Refakat Kartı Oluşturma Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yeni Üretim Refakat Kartı</DialogTitle>
            <DialogDescription>
              Üretim sürecinde takip edilecek bir refakat kartı oluşturun. Bu kart, ürünün üretim boyunca tüm süreçlerde takibini sağlar.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="orderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sipariş</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                          handleOrderSelect(value);
                        }}
                        value={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sipariş seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {orders?.map((order) => (
                            <SelectItem key={order.id} value={order.id.toString()}>
                              {order.orderNumber}
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
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sipariş Numarası</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kart Numarası</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ürün Adı</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Miktar</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                            <SelectValue placeholder="Birim seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="m">Metre</SelectItem>
                          <SelectItem value="kg">Kilogram</SelectItem>
                          <SelectItem value="adet">Adet</SelectItem>
                          <SelectItem value="top">Top</SelectItem>
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
                  name="routeTemplateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Üretim Rotası</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Rota seçin (opsiyonel)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {routeTemplates?.map((template) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name}
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durum</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Durum seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Taslak</SelectItem>
                          <SelectItem value="in-progress">Üretimde</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>İptal</Button>
                <Button type="submit" disabled={createCardMutation.isPending}>
                  {createCardMutation.isPending ? "Oluşturuluyor..." : "Refakat Kartı Oluştur"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}