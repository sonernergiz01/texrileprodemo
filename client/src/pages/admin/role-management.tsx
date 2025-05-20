import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Plus, Edit, Trash, Shield } from "lucide-react";

const roleFormSchema = z.object({
  name: z.string().min(2, "Rol adı en az 2 karakter olmalıdır"),
  description: z.string().optional(),
});

export default function RoleManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: roles = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/admin/roles"],
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof roleFormSchema>) => {
      const res = await apiRequest("POST", "/api/admin/roles", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Rol Oluşturuldu",
        description: "Yeni rol başarıyla oluşturuldu.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "Rol oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });

  const form = useForm<z.infer<typeof roleFormSchema>>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = (data: z.infer<typeof roleFormSchema>) => {
    createRoleMutation.mutate(data);
  };

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <PageContainer
      title="Rol Yönetimi"
      subtitle="Rolleri görüntüleyin, ekleyin, düzenleyin veya silin"
      breadcrumbs={[
        { label: "Ana Sayfa", href: "/" },
        { label: "Admin", href: "/admin" },
        { label: "Rol Yönetimi", href: "/admin/roles" },
      ]}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Roller</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rol ara..."
                className="pl-8 w-60"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Rol
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Yeni Rol Oluştur</DialogTitle>
                  <DialogDescription>
                    Kullanıcılara atanabilecek yeni bir rol oluşturun.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rol Adı</FormLabel>
                          <FormControl>
                            <Input placeholder="Rol adı" {...field} />
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
                            <Textarea placeholder="Rol açıklaması" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        İptal
                      </Button>
                      <Button type="submit" disabled={createRoleMutation.isPending}>
                        {createRoleMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Roller yüklenirken bir hata oluştu
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rol Adı</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>İzin Sayısı</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Rol bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium flex items-center">
                        <Shield className="mr-2 h-4 w-4 text-primary" />
                        {role.name}
                      </TableCell>
                      <TableCell>{role.description || "-"}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
