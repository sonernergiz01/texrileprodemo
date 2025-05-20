import React, { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarIcon, CheckIcon, PlusCircle, Search, UserPlus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { insertCustomerInteractionSchema, insertOpportunitySchema } from "@shared/schema";

// Müşteri etkileşimleri için form şeması
const customerInteractionSchema = insertCustomerInteractionSchema.extend({
  interactionDate: z.date({
    required_error: "Lütfen bir tarih seçin",
  }),
  // İstemci tarafında notlar alanı ekle, ancak bu API'de details olarak gönderilecek
  notes: z.string().optional(),
});

// Fırsatlar için form şeması
const opportunitySchema = insertOpportunitySchema.extend({
  estimatedCloseDate: z.date({
    required_error: "Lütfen tahmini kapanış tarihi seçin",
  }),
  // İstemci tarafında value alanı ekle, ancak bu API'de estimatedValue olarak gönderilecek
  value: z.number().optional(),
});

export default function CRMPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("interactions");
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [opportunityDialogOpen, setOpportunityDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Müşterileri getir
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });

  // Müşteri etkileşimlerini getir
  const { data: interactions = [], isLoading: isLoadingInteractions } = useQuery({
    queryKey: ["/api/customer-interactions"],
  });

  // Fırsatları getir
  const { data: opportunities = [], isLoading: isLoadingOpportunities } = useQuery({
    queryKey: ["/api/opportunities"],
  });

  // Müşteri etkileşimi ekleme formu
  const interactionForm = useForm<z.infer<typeof customerInteractionSchema>>({
    resolver: zodResolver(customerInteractionSchema),
    defaultValues: {
      interactionType: "meeting",
      notes: "",
    },
  });

  // Fırsat ekleme formu
  const opportunityForm = useForm<z.infer<typeof opportunitySchema>>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      status: "new",
      probability: 50,
    },
  });

  // Müşteri etkileşimi ekleme
  const addInteractionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof customerInteractionSchema>) => {
      // Not alanının adını details olarak değiştir
      const { notes, ...rest } = data;
      const formattedData = {
        ...rest,
        details: notes,
        interactionDate: format(data.interactionDate, "yyyy-MM-dd"),
      };
      const response = await apiRequest("POST", "/api/customer-interactions", formattedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Müşteri etkileşimi eklendi",
        description: "Müşteri etkileşimi başarıyla kaydedildi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-interactions"] });
      setInteractionDialogOpen(false);
      interactionForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Müşteri etkileşimi eklenirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Fırsat ekleme
  const addOpportunityMutation = useMutation({
    mutationFn: async (data: z.infer<typeof opportunitySchema>) => {
      // Value alanının adını estimatedValue olarak değiştir
      const { value, ...rest } = data;
      const formattedData = {
        ...rest,
        estimatedValue: value,
        estimatedCloseDate: format(data.estimatedCloseDate, "yyyy-MM-dd"),
      };
      const response = await apiRequest("POST", "/api/opportunities", formattedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fırsat eklendi",
        description: "Satış fırsatı başarıyla kaydedildi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      setOpportunityDialogOpen(false);
      opportunityForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Fırsat eklenirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Etkileşim ekleme formu gönderimi
  function onInteractionSubmit(data: z.infer<typeof customerInteractionSchema>) {
    addInteractionMutation.mutate(data);
  }

  // Fırsat ekleme formu gönderimi
  function onOpportunitySubmit(data: z.infer<typeof opportunitySchema>) {
    addOpportunityMutation.mutate(data);
  }

  // Müşteri adını bul
  const getCustomerName = (customerId: number) => {
    if (!customers || !Array.isArray(customers)) return "...";
    const customer = customers.find((c: any) => c.id === customerId);
    return customer ? customer.name : "Bilinmeyen Müşteri";
  };

  // Etkileşimleri filtrele
  const filteredInteractions = interactions && Array.isArray(interactions)
    ? interactions.filter((interaction: any) => {
        const customerName = getCustomerName(interaction.customerId).toLowerCase();
        return (
          customerName.includes(searchQuery.toLowerCase()) ||
          interaction.interactionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (interaction.notes && interaction.notes.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      })
    : [];

  // Fırsatları filtrele
  const filteredOpportunities = opportunities && Array.isArray(opportunities)
    ? opportunities.filter((opportunity: any) => {
        const customerName = getCustomerName(opportunity.customerId).toLowerCase();
        return (
          customerName.includes(searchQuery.toLowerCase()) ||
          opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opportunity.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (opportunity.description &&
            opportunity.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      })
    : [];

  // Etkileşim türü renk etiketi
  const getInteractionTypeColor = (type: string) => {
    switch (type) {
      case "meeting":
        return "bg-blue-100 text-blue-800";
      case "call":
        return "bg-green-100 text-green-800";
      case "email":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Fırsat durumu renk etiketi
  const getOpportunityStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "qualified":
        return "bg-indigo-100 text-indigo-800";
      case "proposal":
        return "bg-yellow-100 text-yellow-800";
      case "negotiation":
        return "bg-orange-100 text-orange-800";
      case "closed-won":
        return "bg-green-100 text-green-800";
      case "closed-lost":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Olasılık yüzdesi renk etiketi
  const getProbabilityColor = (probability: number) => {
    if (probability >= 75) return "bg-green-100 text-green-800";
    if (probability >= 50) return "bg-yellow-100 text-yellow-800";
    if (probability >= 25) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">CRM Yönetimi</h1>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Müşteri, konu veya içerik ara..."
              className="pl-8 w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="interactions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Müşteri Etkileşimleri</span>
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Satış Fırsatları</span>
          </TabsTrigger>
        </TabsList>

        {/* Müşteri Etkileşimleri Tab İçeriği */}
        <TabsContent value="interactions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Müşteri Etkileşimleri</CardTitle>
                <CardDescription>
                  Müşterilerinizle olan tüm iletişim ve etkileşimleri görüntüleyin ve yönetin.
                </CardDescription>
              </div>
              <Dialog open={interactionDialogOpen} onOpenChange={setInteractionDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-1">
                    <UserPlus className="h-4 w-4" />
                    Etkileşim Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={interactionForm.handleSubmit(onInteractionSubmit)}>
                    <DialogHeader>
                      <DialogTitle>Yeni Müşteri Etkileşimi</DialogTitle>
                      <DialogDescription>
                        Müşteri ile gerçekleşen görüşme, telefon veya e-posta etkileşimini kaydedin.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="customerId" className="text-right">
                          Müşteri
                        </Label>
                        <Select
                          onValueChange={(value) =>
                            interactionForm.setValue("customerId", parseInt(value))
                          }
                          defaultValue={interactionForm.getValues("customerId")?.toString()}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Müşteri seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers?.map((customer: any) => (
                              <SelectItem key={customer.id} value={customer.id.toString()}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {interactionForm.formState.errors.customerId && (
                          <p className="text-red-500 text-sm col-span-3 col-start-2">
                            {interactionForm.formState.errors.customerId.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="interactionType" className="text-right">
                          Etkileşim Türü
                        </Label>
                        <Select
                          onValueChange={(value) =>
                            interactionForm.setValue("interactionType", value)
                          }
                          defaultValue={interactionForm.getValues("interactionType")}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Etkileşim türü seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="meeting">Toplantı</SelectItem>
                            <SelectItem value="call">Telefon</SelectItem>
                            <SelectItem value="email">E-posta</SelectItem>
                            <SelectItem value="other">Diğer</SelectItem>
                          </SelectContent>
                        </Select>
                        {interactionForm.formState.errors.interactionType && (
                          <p className="text-red-500 text-sm col-span-3 col-start-2">
                            {interactionForm.formState.errors.interactionType.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="interactionDate" className="text-right">
                          Tarih
                        </Label>
                        <div className="col-span-3">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !interactionForm.getValues("interactionDate") &&
                                    "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {interactionForm.getValues("interactionDate") ? (
                                  format(interactionForm.getValues("interactionDate"), "PPP", {
                                    locale: tr,
                                  })
                                ) : (
                                  <span>Tarih seçin</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={interactionForm.getValues("interactionDate")}
                                onSelect={(date) => {
                                  if (date) interactionForm.setValue("interactionDate", date);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          {interactionForm.formState.errors.interactionDate && (
                            <p className="text-red-500 text-sm">
                              {interactionForm.formState.errors.interactionDate.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subject" className="text-right">
                          Konu
                        </Label>
                        <Input
                          id="subject"
                          className="col-span-3"
                          placeholder="Etkileşimin konusu"
                          {...interactionForm.register("subject")}
                        />
                        {interactionForm.formState.errors.subject && (
                          <p className="text-red-500 text-sm col-span-3 col-start-2">
                            {interactionForm.formState.errors.subject?.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="notes" className="text-right pt-2">
                          Notlar
                        </Label>
                        <Textarea
                          id="notes"
                          className="col-span-3"
                          placeholder="Görüşme notları, takip edilecek konular, vb."
                          {...interactionForm.register("notes")}
                        />
                        {interactionForm.formState.errors.notes && (
                          <p className="text-red-500 text-sm col-span-3 col-start-2">
                            {interactionForm.formState.errors.notes?.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={addInteractionMutation.isPending}>
                        {addInteractionMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingInteractions ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredInteractions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  {searchQuery
                    ? "Aramanızla eşleşen müşteri etkileşimi bulunamadı."
                    : "Henüz kaydedilmiş müşteri etkileşimi bulunmuyor."}
                </div>
              ) : (
                <Table>
                  <TableCaption>
                    Toplam {filteredInteractions.length} müşteri etkileşimi listeleniyor
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Tür</TableHead>
                      <TableHead>Konu</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Notlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInteractions.map((interaction: any) => (
                      <TableRow key={interaction.id}>
                        <TableCell className="font-medium">
                          {getCustomerName(interaction.customerId)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInteractionTypeColor(
                              interaction.interactionType
                            )}`}
                          >
                            {interaction.interactionType === "meeting"
                              ? "Toplantı"
                              : interaction.interactionType === "call"
                              ? "Telefon"
                              : interaction.interactionType === "email"
                              ? "E-posta"
                              : "Diğer"}
                          </span>
                        </TableCell>
                        <TableCell>{interaction.subject}</TableCell>
                        <TableCell>
                          {new Date(interaction.interactionDate).toLocaleDateString("tr-TR")}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {interaction.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Satış Fırsatları Tab İçeriği */}
        <TabsContent value="opportunities">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Satış Fırsatları</CardTitle>
                <CardDescription>
                  Potansiyel satış fırsatlarını takip edin ve satış süreçlerini yönetin.
                </CardDescription>
              </div>
              <Dialog open={opportunityDialogOpen} onOpenChange={setOpportunityDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Fırsat Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={opportunityForm.handleSubmit(onOpportunitySubmit)}>
                    <DialogHeader>
                      <DialogTitle>Yeni Satış Fırsatı</DialogTitle>
                      <DialogDescription>
                        Potansiyel satış fırsatını sisteme ekleyin ve takip edin.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="customerId" className="text-right">
                          Müşteri
                        </Label>
                        <Select
                          onValueChange={(value) =>
                            opportunityForm.setValue("customerId", parseInt(value))
                          }
                          defaultValue={opportunityForm.getValues("customerId")?.toString()}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Müşteri seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers?.map((customer: any) => (
                              <SelectItem key={customer.id} value={customer.id.toString()}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {opportunityForm.formState.errors.customerId && (
                          <p className="text-red-500 text-sm col-span-3 col-start-2">
                            {opportunityForm.formState.errors.customerId.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                          Başlık
                        </Label>
                        <Input
                          id="title"
                          className="col-span-3"
                          placeholder="Fırsat başlığı"
                          {...opportunityForm.register("title")}
                        />
                        {opportunityForm.formState.errors.title && (
                          <p className="text-red-500 text-sm col-span-3 col-start-2">
                            {opportunityForm.formState.errors.title?.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="value" className="text-right">
                          Değer (₺)
                        </Label>
                        <Input
                          id="value"
                          type="number"
                          className="col-span-3"
                          placeholder="Fırsatın tahmini değeri"
                          {...opportunityForm.register("value", { valueAsNumber: true })}
                        />
                        {opportunityForm.formState.errors.value && (
                          <p className="text-red-500 text-sm col-span-3 col-start-2">
                            {opportunityForm.formState.errors.value?.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">
                          Durum
                        </Label>
                        <Select
                          onValueChange={(value) => opportunityForm.setValue("status", value)}
                          defaultValue={opportunityForm.getValues("status")}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Durum seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Yeni</SelectItem>
                            <SelectItem value="qualified">İlgileniliyor</SelectItem>
                            <SelectItem value="proposal">Teklif Aşamasında</SelectItem>
                            <SelectItem value="negotiation">Görüşme Aşamasında</SelectItem>
                            <SelectItem value="closed-won">Kazanıldı</SelectItem>
                            <SelectItem value="closed-lost">Kaybedildi</SelectItem>
                          </SelectContent>
                        </Select>
                        {opportunityForm.formState.errors.status && (
                          <p className="text-red-500 text-sm col-span-3 col-start-2">
                            {opportunityForm.formState.errors.status?.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="probability" className="text-right">
                          Olasılık (%)
                        </Label>
                        <Input
                          id="probability"
                          type="number"
                          min="0"
                          max="100"
                          className="col-span-3"
                          placeholder="Kazanma olasılığı"
                          {...opportunityForm.register("probability", { valueAsNumber: true })}
                        />
                        {opportunityForm.formState.errors.probability && (
                          <p className="text-red-500 text-sm col-span-3 col-start-2">
                            {opportunityForm.formState.errors.probability?.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="estimatedCloseDate" className="text-right">
                          Tahmini Kapanış
                        </Label>
                        <div className="col-span-3">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !opportunityForm.getValues("estimatedCloseDate") &&
                                    "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {opportunityForm.getValues("estimatedCloseDate") ? (
                                  format(
                                    opportunityForm.getValues("estimatedCloseDate"),
                                    "PPP",
                                    {
                                      locale: tr,
                                    }
                                  )
                                ) : (
                                  <span>Tarih seçin</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={opportunityForm.getValues("estimatedCloseDate")}
                                onSelect={(date) => {
                                  if (date) opportunityForm.setValue("estimatedCloseDate", date);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          {opportunityForm.formState.errors.estimatedCloseDate && (
                            <p className="text-red-500 text-sm">
                              {opportunityForm.formState.errors.estimatedCloseDate.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="description" className="text-right pt-2">
                          Açıklama
                        </Label>
                        <Textarea
                          id="description"
                          className="col-span-3"
                          placeholder="Fırsat ile ilgili detaylar"
                          {...opportunityForm.register("description")}
                        />
                        {opportunityForm.formState.errors.description && (
                          <p className="text-red-500 text-sm col-span-3 col-start-2">
                            {opportunityForm.formState.errors.description?.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={addOpportunityMutation.isPending}>
                        {addOpportunityMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingOpportunities ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredOpportunities.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  {searchQuery
                    ? "Aramanızla eşleşen satış fırsatı bulunamadı."
                    : "Henüz kaydedilmiş satış fırsatı bulunmuyor."}
                </div>
              ) : (
                <Table>
                  <TableCaption>
                    Toplam {filteredOpportunities.length} satış fırsatı listeleniyor
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Başlık</TableHead>
                      <TableHead>Değer (₺)</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Olasılık (%)</TableHead>
                      <TableHead>Tahmini Kapanış</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOpportunities.map((opportunity: any) => (
                      <TableRow key={opportunity.id}>
                        <TableCell className="font-medium">
                          {getCustomerName(opportunity.customerId)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {opportunity.title}
                        </TableCell>
                        <TableCell>
                          {opportunity.value.toLocaleString("tr-TR", {
                            style: "currency",
                            currency: "TRY",
                          })}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOpportunityStatusColor(
                              opportunity.status
                            )}`}
                          >
                            {opportunity.status === "new"
                              ? "Yeni"
                              : opportunity.status === "qualified"
                              ? "İlgileniliyor"
                              : opportunity.status === "proposal"
                              ? "Teklif Aşamasında"
                              : opportunity.status === "negotiation"
                              ? "Görüşme Aşamasında"
                              : opportunity.status === "closed-won"
                              ? "Kazanıldı"
                              : opportunity.status === "closed-lost"
                              ? "Kaybedildi"
                              : opportunity.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProbabilityColor(
                              opportunity.probability
                            )}`}
                          >
                            %{opportunity.probability}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(opportunity.estimatedCloseDate).toLocaleDateString("tr-TR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}