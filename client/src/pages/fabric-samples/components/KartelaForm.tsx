import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Form şeması
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Kartela adı en az 2 karakter olmalıdır",
  }),
  description: z.string().optional(),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface KartelaFormProps {
  customers: any[];
  onSubmit: (data: FormValues) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  defaultValues?: Partial<FormValues>;
}

export function KartelaForm({
  customers,
  onSubmit,
  isSubmitting,
  onCancel,
  defaultValues = {},
}: KartelaFormProps) {
  // Form oluştur
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      customerId: "",
      customerName: "",
      notes: "",
      ...defaultValues,
    },
  });

  // Formu gönder
  const handleSubmit = (values: FormValues) => {
    // Müşteri adını otomatik doldur
    if (values.customerId && !values.customerName) {
      const customer = customers.find(c => c.id.toString() === values.customerId);
      if (customer) {
        values.customerName = customer.name;
      }
    }
    
    onSubmit(values);
  };

  // Müşteri değiştiğinde adını güncelle
  const handleCustomerChange = (value: string) => {
    // "null" değeri için boş string atanır
    const customerId = value === "null" ? "" : value;
    form.setValue("customerId", customerId);
    
    // Müşteri adını otomatik doldur
    if (value === "null") {
      form.setValue("customerName", "");
    } else {
      const customer = customers.find(c => c.id.toString() === value);
      if (customer) {
        form.setValue("customerName", customer.name);
      } else {
        form.setValue("customerName", "");
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kartela Adı</FormLabel>
              <FormControl>
                <Input placeholder="Kartela adını girin" {...field} />
              </FormControl>
              <FormDescription>
                Kartelanın kolayca tanımlanabilir bir adı
              </FormDescription>
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
                  placeholder="Kartela hakkında kısa açıklama"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Kartelanın içeriği hakkında kısa bir açıklama
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Müşteri</FormLabel>
              <Select
                onValueChange={handleCustomerChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri seçin (opsiyonel)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="null">Müşteri seçilmedi</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Kartelanın hazırlandığı müşteri
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notlar</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Kartela hakkında ek notlar"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Kartela hakkında eklemek istediğiniz notlar
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            İptal
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </form>
    </Form>
  );
}