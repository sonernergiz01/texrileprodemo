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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Plus, Edit, Trash, Check } from "lucide-react";

const roleFormSchema = z.object({
  name: z.string().min(2, "Rol adı en az 2 karakter olmalıdır"),
  description: z.string().optional(),
});

const rolePermissionSchema = z.object({
  roleId: z.number(),
  permissions: z.array(z.number()),
});

export default function Roles() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  // Roller verisini yükle
  const { data: roles = [], isLoading: isRolesLoading } = useQuery({
    queryKey: ["/api/admin/roles"],
  });

  // İzinler verisini yükle
  const { data: permissions = [], isLoading: isPermissionsLoading } = useQuery({
    queryKey: ["/api/admin/permissions"],
  });

  // Yeni rol oluşturmak için form
  const form = useForm<z.infer<typeof roleFormSchema>>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Rol silme işlemi
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/roles/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Rol Silindi",
        description: "Rol başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "Rol silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });

  // Rol oluşturma mutasyonu
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

  // Rol izinleri mutasyonu
  const updateRolePermissionsMutation = useMutation({
    mutationFn: async (data: { roleId: number, permissions: number[] }) => {
      const res = await apiRequest("POST", `/api/admin/roles/${data.roleId}/permissions`, { permissions: data.permissions });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "İzinler Güncellendi",
        description: "Rol izinleri başarıyla güncellendi.",
      });
      setIsPermissionDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "İzinler güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });

  // Rol izinlerini yükle
  const { data: rolePermissions = [] } = useQuery({
    queryKey: ["/api/admin/roles", selectedRole?.id, "permissions"],
    enabled: !!selectedRole,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/roles/${selectedRole.id}/permissions`);
      return await res.json();
    },
  });

  // Rol izinlerini açma
  const openPermissionsDialog = (role: any) => {
    setSelectedRole(role);
    setIsPermissionDialogOpen(true);
    
    // Mevcut rolün izinlerini seçili olarak ayarla
    if (rolePermissions && rolePermissions.length > 0) {
      const permissionIds = rolePermissions.map((p: any) => p.id);
      setSelectedPermissions(permissionIds);
    } else {
      setSelectedPermissions([]);
    }
  };

  // İzin seçme veya kaldırma
  const togglePermission = (permissionId: number) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  // Form gönderme işlemi
  const onSubmit = (data: z.infer<typeof roleFormSchema>) => {
    createRoleMutation.mutate(data);
  };

  // İzinleri kaydetme işlemi
  const savePermissions = () => {
    if (selectedRole) {
      updateRolePermissionsMutation.mutate({
        roleId: selectedRole.id,
        permissions: selectedPermissions
      });
    }
  };

  // Arama filtreleme
  const filteredRoles = roles.filter((role: any) => 
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Seçili izinleri kontrol et
  const isPermissionSelected = (permissionId: number) => {
    return selectedPermissions.includes(permissionId);
  };

  return (
    <PageContainer title="Yetkilendirme">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rol arayın..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Rol
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Rol Oluştur</DialogTitle>
              <DialogDescription>
                Sisteme yeni bir rol eklemek için aşağıdaki formu doldurun.
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
                        <Input placeholder="Rol adı girin" {...field} />
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
                        <Input placeholder="Rol açıklaması (opsiyonel)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createRoleMutation.isPending}>
                    {createRoleMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roller</CardTitle>
        </CardHeader>
        <CardContent>
          {isRolesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rol Adı</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      Rol bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoles.map((role: any) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{role.description || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openPermissionsDialog(role)}
                          >
                            İzinler
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              if (window.confirm(`${role.name} rolünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
                                deleteRoleMutation.mutate(role.id);
                              }
                            }}
                            title="Sil"
                          >
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

      {/* İzinler Diyaloğu */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedRole?.name} - İzinler</DialogTitle>
            <DialogDescription>
              Bu rol için izinleri yönetin.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            {isPermissionsLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-6 w-6 border-4 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="font-medium">Sistem İzinleri</div>
                <div className="grid gap-3">
                  {permissions.map((permission: any) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`permission-${permission.id}`}
                        checked={isPermissionSelected(permission.id)}
                        onCheckedChange={() => togglePermission(permission.id)}
                      />
                      <label 
                        htmlFor={`permission-${permission.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permission.description}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              onClick={savePermissions}
              disabled={updateRolePermissionsMutation.isPending}
            >
              {updateRolePermissionsMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}