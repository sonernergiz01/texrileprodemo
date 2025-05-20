import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const orderFormSchema = z.object({
  customerId: z.string({
    required_error: "Müşteri seçiniz",
  }),
  fabricTypeId: z.string({
    required_error: "Kumaş tipi seçiniz",
  }),
  quantity: z.string().min(1, "Miktar giriniz").transform(val => parseFloat(val)),
  unitPrice: z.string().min(1, "Birim fiyat giriniz").transform(val => parseFloat(val)),
  orderDate: z.date({
    required_error: "Sipariş tarihi seçiniz",
  }),
  dueDate: z.date({
    required_error: "Termin tarihi seçiniz",
  }),
  notes: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const OrderForm = ({ onSuccess, onCancel }: OrderFormProps) => {
  const { toast } = useToast();
  const [total, setTotal] = useState<number>(0);
  
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });
  
  const { data: fabricTypes = [] } = useQuery({
    queryKey: ["/api/master/fabrics"],
  });
  
  const { data: orderStatuses = [] } = useQuery({
    queryKey: ["/api/order-statuses"],
  });
  
  const pendingStatus = orderStatuses.find(status => status.code === "PENDING");
  
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerId: "",
      fabricTypeId: "",
      quantity: undefined,
      unitPrice: undefined,
      orderDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Two weeks from now
      notes: "",
    },
  });
  
  // Watch for changes in quantity and unit price to update total
  const quantity = form.watch("quantity");
  const unitPrice = form.watch("unitPrice");
  
  useEffect(() => {
    if (quantity && unitPrice) {
      setTotal(quantity * unitPrice);
    } else {
      setTotal(0);
    }
  }, [quantity, unitPrice]);
  
  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderFormValues) => {
      const statusId = pendingStatus ? pendingStatus.id : 1;
      const transformedData = {
        ...data,
        customerId: parseInt(data.customerId),
        fabricTypeId: parseInt(data.fabricTypeId),
        statusId,
      };
      
      const res = await apiRequest("POST", "/api/orders", transformedData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sipariş Oluşturuldu",
        description: "Yeni sipariş başarıyla oluşturuldu.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "Sipariş oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: OrderFormValues) => {
    createOrderMutation.mutate(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Müşteri</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Müşteri Seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer) => (
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
            name="orderDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Sipariş Tarihi</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd MMM yyyy", { locale: tr })
                        ) : (
                          <span>Tarih Seçin</span>
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
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="fabricTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kumaş Tipi</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Kumaş Tipi Seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {fabricTypes.map((fabric) => (
                      <SelectItem key={fabric.id} value={fabric.id.toString()}>
                        {fabric.name} ({fabric.code})
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
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Termin Tarihi</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd MMM yyyy", { locale: tr })
                        ) : (
                          <span>Tarih Seçin</span>
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
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Miktar (m)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    placeholder="Miktar" 
                    {...field} 
                    onChange={e => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="unitPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Birim Fiyat (₺)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    placeholder="Birim Fiyat" 
                    {...field} 
                    onChange={e => field.onChange(e.target.value)}
                  />
                </FormControl>
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
                <Textarea placeholder="Sipariş ile ilgili notlar" {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between">
            <span className="font-medium">Toplam Tutar:</span>
            <span className="font-bold">{total.toLocaleString('tr-TR')} ₺</span>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            İptal
          </Button>
          <Button 
            type="submit" 
            disabled={createOrderMutation.isPending}
          >
            {createOrderMutation.isPending ? "Kaydediliyor..." : "Siparişi Kaydet"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
