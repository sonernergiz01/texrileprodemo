import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertOpportunitySchema } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCaption,
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
import { CalendarIcon, RefreshCcw, Plus, Search, Filter, UserRound, Goal, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

// Create form schema based on insertOpportunitySchema
const opportunityFormSchema = insertOpportunitySchema.extend({
  expectedCloseDate: z.date().optional().nullable(),
  estimatedValue: z.coerce.number().min(0, "Değer 0'dan büyük olmalıdır").optional().nullable(),
  probability: z.coerce.number().min(0, "Olasılık 0'dan büyük olmalıdır").max(100, "Olasılık 100'den küçük olmalıdır").optional().nullable(),
});

type OpportunityFormData = z.infer<typeof opportunityFormSchema>;

export default function OpportunitiesPage() {
  const { toast } = useToast();
  const [isNewOpportunityOpen, setIsNewOpportunityOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Calculate summary statistics
  const getOpportunitySummary = (opportunities: any[]) => {
    const total = opportunities.length;
    const totalValue = opportunities.reduce((sum, opp) => sum + (Number(opp.estimatedValue) || 0), 0);
    const inProgress = opportunities.filter(opp => ["tahmin", "teklif verildi"].includes(opp.status)).length;
    const won = opportunities.filter(opp => opp.status === "kazanıldı").length;
    const lost = opportunities.filter(opp => opp.status === "kaybedildi").length;
    
    const winRate = total > 0 ? Math.round((won / (won + lost)) * 100) : 0;
    
    return { total, totalValue, inProgress, won, lost, winRate };
  };
  
  // Fetch opportunities
  const { data: opportunities, isLoading: isLoadingOpportunities } = useQuery({
    queryKey: ["/api/opportunities"],
    staleTime: 30000, // 30 seconds
  });
  
  // Fetch customers
  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    staleTime: 60000, // 1 minute
  });
  
  // Filter opportunities
  const filteredOpportunities = opportunities
    ? opportunities.filter((opportunity: any) => {
        // Filter by customer
        const customerMatch = selectedCustomerId
          ? opportunity.customerId === selectedCustomerId
          : true;
        
        // Filter by status
        const statusMatch = statusFilter && statusFilter !== "all"
          ? opportunity.status === statusFilter
          : true;
        
        // Filter by search term
        const searchMatch = searchTerm
          ? opportunity.title.toLowerCase().includes(searchTerm.toLowerCase())
          : true;
        
        return customerMatch && statusMatch && searchMatch;
      })
    : [];
  
  // Get customer name by ID
  const getCustomerName = (customerId: number) => {
    return customers?.find((c: any) => c.id === customerId)?.name || "Bilinmeyen Müşteri";
  };
  
  // Format currency
  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return "-";
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(amount));
  };
  
  // Get summary data
  const summary = getOpportunitySummary(opportunities || []);
  
  // Form for creating new opportunity
  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunityFormSchema),
    defaultValues: {
      customerId: selectedCustomerId || undefined,
      title: "",
      description: "",
      status: "tahmin",
      estimatedValue: null,
      probability: null,
      expectedCloseDate: null,
    },
  });
  
  // Reset form when selectedCustomerId changes
  React.useEffect(() => {
    if (selectedCustomerId) {
      form.setValue("customerId", selectedCustomerId);
    }
  }, [selectedCustomerId, form]);
  
  // Create opportunity mutation
  const createOpportunityMutation = useMutation({
    mutationFn: async (data: OpportunityFormData) => {
      const res = await apiRequest("POST", "/api/opportunities", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Fırsat kaydedilirken bir hata oluştu");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      toast({
        title: "Fırsat kaydedildi",
        description: "Yeni fırsat başarıyla oluşturuldu.",
      });
      setIsNewOpportunityOpen(false);
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
  
  // Handle form submit
  const onSubmit = (data: OpportunityFormData) => {
    createOpportunityMutation.mutate(data);
  };
  
  // Get badge variant and color based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "tahmin":
        return { variant: "outline" as const, label: "Tahmin" };
      case "teklif verildi":
        return { variant: "secondary" as const, label: "Teklif Verildi" };
      case "kazanıldı":
        return { variant: "default" as const, label: "Kazanıldı" };
      case "kaybedildi":
        return { variant: "destructive" as const, label: "Kaybedildi" };
      default:
        return { variant: "outline" as const, label: status };
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Satış Fırsatları</h1>
          <p className="text-muted-foreground">
            Potansiyel satış fırsatlarınızı yönetin ve takip edin
          </p>
        </div>
        <Button onClick={() => setIsNewOpportunityOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Yeni Fırsat
        </Button>
      </div>
      
      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Toplam Fırsat Sayısı</CardDescription>
            <CardTitle className="text-2xl">{summary.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={summary.total > 0 ? 100 : 0} className="h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Kazanma Oranı</CardDescription>
            <CardTitle className="text-2xl">{summary.winRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={summary.winRate} className="h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Toplam Tahmin Değeri</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(summary.totalValue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-xs text-muted-foreground">
              <div>Aktif: {filteredOpportunities.filter((o: any) => o.status !== "kaybedildi").length}</div>
              <div>Kazanılan: {summary.won}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Süreçteki Fırsatlar</CardDescription>
            <CardTitle className="text-2xl">{summary.inProgress}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-xs text-muted-foreground">
              <div>Tahmin: {filteredOpportunities.filter((o: any) => o.status === "tahmin").length}</div>
              <div>Teklif: {filteredOpportunities.filter((o: any) => o.status === "teklif verildi").length}</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Fırsat ara..."
              className="pl-8 w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select
            value={selectedCustomerId?.toString() || "all"}
            onValueChange={(value) => setSelectedCustomerId(value !== "all" ? parseInt(value) : null)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tüm müşteriler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm müşteriler</SelectItem>
              {customers?.map((customer: any) => (
                <SelectItem key={customer.id} value={customer.id.toString()}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter || "all"}
            onValueChange={(value) => setStatusFilter(value !== "all" ? value : null)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tüm durumlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm durumlar</SelectItem>
              <SelectItem value="tahmin">Tahmin</SelectItem>
              <SelectItem value="teklif verildi">Teklif Verildi</SelectItem>
              <SelectItem value="kazanıldı">Kazanıldı</SelectItem>
              <SelectItem value="kaybedildi">Kaybedildi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] })}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Opportunities Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Müşteri</TableHead>
                <TableHead>Fırsat Başlığı</TableHead>
                <TableHead>Tahmini Değer</TableHead>
                <TableHead>Olasılık</TableHead>
                <TableHead>Beklenen Kapanış</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingOpportunities ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : filteredOpportunities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    Görüntülenecek fırsat bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                filteredOpportunities.map((opportunity: any) => (
                  <TableRow key={opportunity.id}>
                    <TableCell>{getCustomerName(opportunity.customerId)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{opportunity.title}</div>
                      {opportunity.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">{opportunity.description}</div>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(opportunity.estimatedValue)}</TableCell>
                    <TableCell>
                      {opportunity.probability !== null ? (
                        <div className="flex items-center gap-2">
                          <Progress value={opportunity.probability} className="h-2 w-16" />
                          <span>{opportunity.probability}%</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {opportunity.expectedCloseDate
                        ? format(new Date(opportunity.expectedCloseDate), "dd.MM.yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(opportunity.status).variant}>
                        {getStatusBadge(opportunity.status).label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* New opportunity dialog */}
      <Dialog open={isNewOpportunityOpen} onOpenChange={setIsNewOpportunityOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Yeni Satış Fırsatı</DialogTitle>
            <DialogDescription>
              Potansiyel satış fırsatı ekleyin ve sürecini takip edin
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Müşteri</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Müşteri seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers?.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
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
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fırsat Başlığı</FormLabel>
                    <FormControl>
                      <Input placeholder="Fırsatın başlığı" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Fırsat açıklaması"
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="estimatedValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tahmini Değer (TL)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00"
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="probability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Olasılık (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0-100"
                          min={0}
                          max={100}
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseInt(e.target.value);
                            field.onChange(value);
                          }}
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
                  name="expectedCloseDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Beklenen Kapanış Tarihi</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
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
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                            locale={tr}
                          />
                        </PopoverContent>
                      </Popover>
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
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Durum seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tahmin">Tahmin</SelectItem>
                          <SelectItem value="teklif verildi">Teklif Verildi</SelectItem>
                          <SelectItem value="kazanıldı">Kazanıldı</SelectItem>
                          <SelectItem value="kaybedildi">Kaybedildi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewOpportunityOpen(false)}
                >
                  İptal
                </Button>
                <Button 
                  type="submit"
                  disabled={createOpportunityMutation.isPending}
                >
                  {createOpportunityMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}