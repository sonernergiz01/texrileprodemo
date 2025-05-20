import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const customerFormSchema = z.object({
  name: z.string().min(2, "Müşteri adı en az 2 karakter olmalıdır"),
  contactPerson: z.string().min(2, "İletişim kişisi en az 2 karakter olmalıdır"),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  address: z.string().min(5, "Adres en az 5 karakter olmalıdır"),
  city: z.string().min(2, "Şehir en az 2 karakter olmalıdır"),
  taxNumber: z.string().min(10, "Geçerli bir vergi numarası giriniz"),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: CustomerFormValues;
  isEdit?: boolean;
}

export const CustomerForm = ({ 
  onSuccess, 
  onCancel, 
  initialData, 
  isEdit = false 
}: CustomerFormProps) => {
  const { toast } = useToast();
  
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: initialData || {
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      taxNumber: "",
      notes: "",
    },
  });
  
  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormValues) => {
      const res = await apiRequest("POST", "/api/customers", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Müşteri Oluşturuldu",
        description: "Yeni müşteri başarıyla oluşturuldu.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "Müşteri oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: CustomerFormValues) => {
    createCustomerMutation.mutate(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Müşteri Adı</FormLabel>
                <FormControl>
                  <Input placeholder="Müşteri adı" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel>İletişim Kişisi</FormLabel>
                <FormControl>
                  <Input placeholder="İletişim kişisi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon</FormLabel>
                <FormControl>
                  <Input placeholder="Telefon numarası" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-posta</FormLabel>
                <FormControl>
                  <Input placeholder="E-posta adresi" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Şehir</FormLabel>
                <FormControl>
                  <Input placeholder="Şehir" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="taxNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vergi Numarası</FormLabel>
                <FormControl>
                  <Input placeholder="Vergi numarası" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adres</FormLabel>
              <FormControl>
                <Textarea placeholder="Adres" {...field} rows={2} />
              </FormControl>
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
                <Textarea placeholder="Ek notlar" {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
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
            disabled={createCustomerMutation.isPending}
          >
            {createCustomerMutation.isPending ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Müşteri Ekle"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
