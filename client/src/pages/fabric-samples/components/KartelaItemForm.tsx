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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Form şeması
const formSchema = z.object({
  fabricTypeId: z.string().min(1, {
    message: "Kumaş tipi seçilmelidir",
  }),
  fabricTypeName: z.string().optional(),
  color: z.string().optional(),
  weight: z.union([
    z.number().min(0, { message: "Gramaj negatif olamaz" }),
    z.string().transform((val, ctx) => {
      const parsed = parseFloat(val);
      if (isNaN(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Geçerli bir sayı girin",
        });
        return z.NEVER;
      }
      return parsed;
    }),
  ]).optional(),
  width: z.union([
    z.number().min(0, { message: "En negatif olamaz" }),
    z.string().transform((val, ctx) => {
      const parsed = parseFloat(val);
      if (isNaN(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Geçerli bir sayı girin",
        });
        return z.NEVER;
      }
      return parsed;
    }),
  ]).optional(),
  composition: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface KartelaItemFormProps {
  fabricTypes: any[];
  onSubmit: (data: FormValues) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  defaultValues?: Partial<FormValues>;
}

export function KartelaItemForm({
  fabricTypes,
  onSubmit,
  isSubmitting,
  onCancel,
  defaultValues = {},
}: KartelaItemFormProps) {
  // Form oluştur
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fabricTypeId: "",
      fabricTypeName: "",
      color: "",
      weight: undefined,
      width: undefined,
      composition: "",
      ...defaultValues,
    },
  });

  // Formu gönder
  const handleSubmit = (values: FormValues) => {
    // "no-selection" özel değerini kontrol et
    if (values.fabricTypeId === "no-selection") {
      form.setError("fabricTypeId", {
        type: "manual",
        message: "Lütfen geçerli bir kumaş tipi seçin"
      });
      return;
    }
    
    // Kumaş tipi adını otomatik doldur
    if (values.fabricTypeId && !values.fabricTypeName) {
      const fabricType = fabricTypes.find(ft => ft.id.toString() === values.fabricTypeId);
      if (fabricType) {
        values.fabricTypeName = fabricType.name;
      }
    }
    
    onSubmit(values);
  };

  // Kumaş tipi değiştiğinde adını güncelle
  const handleFabricTypeChange = (value: string) => {
    // Özel değer "no-selection" için işlem
    if (value === "no-selection") {
      form.setValue("fabricTypeId", "");
      form.setValue("fabricTypeName", "");
      return;
    }
    
    form.setValue("fabricTypeId", value);
    
    // Kumaş tipi adını otomatik doldur
    const fabricType = fabricTypes.find(ft => ft.id.toString() === value);
    if (fabricType) {
      form.setValue("fabricTypeName", fabricType.name);
    } else {
      form.setValue("fabricTypeName", "");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fabricTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kumaş Tipi</FormLabel>
              <Select
                onValueChange={handleFabricTypeChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Kumaş tipi seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="no-selection">Seçiniz</SelectItem>
                  {fabricTypes.map((fabricType) => (
                    <SelectItem key={fabricType.id} value={fabricType.id.toString()}>
                      {fabricType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Kartelaya eklenecek kumaşın tipi
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Renk</FormLabel>
              <FormControl>
                <Input placeholder="Renk bilgisi girin" {...field} />
              </FormControl>
              <FormDescription>
                Kumaşın renk bilgisi (örn. Kırmızı, Lacivert, vb.)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gramaj (gr/m²)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="Gramaj bilgisi" 
                    {...field}
                    value={field.value === undefined ? "" : field.value}
                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Kumaşın gramaj bilgisi
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="width"
            render={({ field }) => (
              <FormItem>
                <FormLabel>En (cm)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1"
                    placeholder="En bilgisi" 
                    {...field}
                    value={field.value === undefined ? "" : field.value}
                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Kumaşın en bilgisi
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="composition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kompozisyon</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Kumaş bileşimi (örn. %100 Pamuk, %65 Pamuk %35 Polyester)"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Kumaşın ham madde bileşimi
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