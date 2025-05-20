import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Edit, Trash, Plus, Search, UserCheck, UserX } from "lucide-react";

const userFormSchema = z.object({
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  fullName: z.string().min(3, "Ad soyad en az 3 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  departmentId: z.string().optional(),
  roleId: z.string().optional(),
});

export default function UserManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: users = [],
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const {
    data: departments = [],
    isLoading: isLoadingDepartments,
  } = useQuery({
    queryKey: ["/api/admin/departments"],
  });

  const {
    data: roles = [],
    isLoading: isLoadingRoles,
  } = useQuery({
    queryKey: ["/api/admin/roles"],
  });

  // Kullanıcı ekleme mutasyonu
  const createUserMutation = useMutation({
    mutationFn: async (data: z.infer<typeof userFormSchema>) => {
      const processedData = {
        ...data,
        departmentId: data.departmentId ? parseInt(data.departmentId) : null,
        roleId: data.roleId ? parseInt(data.roleId) : null,
      };
      
      const res = await apiRequest("POST", "/api/register", processedData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Kullanıcı Oluşturuldu",
        description: "Yeni kullanıcı başarıyla oluşturuldu.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "Kullanıcı oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  // Kullanıcı güncelleme mutasyonu
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number, status: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${data.id}/status`, { isActive: data.status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Kullanıcı Güncellendi",
        description: "Kullanıcı durumu başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "Kullanıcı güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  // Kullanıcı silme mutasyonu
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Kullanıcı Silindi",
        description: "Kullanıcı başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "Kullanıcı silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  // Kullanıcı düzenleme için durumu
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Kullanıcı düzenleme formu
  const editForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      departmentId: undefined,
      roleId: undefined,
    },
  });
  
  // Kullanıcı düzenleme mutasyonu
  const updateUserDetailsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${selectedUser?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Kullanıcı Güncellendi",
        description: "Kullanıcı bilgileri başarıyla güncellendi.",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "Kullanıcı güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  // Seçilen kullanıcı değiştiğinde formu güncelle
  useEffect(() => {
    if (selectedUser) {
      editForm.setValue("username", selectedUser.username);
      editForm.setValue("fullName", selectedUser.fullName);
      editForm.setValue("email", selectedUser.email);
      editForm.setValue("departmentId", selectedUser.departmentId?.toString());
      // Şifre alanını boş bırak, kullanıcı isterse değiştirebilir
      editForm.setValue("password", "");
      
      // Rol bilgisini çek ve yükle
      const fetchUserRole = async () => {
        try {
          const response = await apiRequest("GET", `/api/admin/users/${selectedUser.id}/roles`);
          const userRoles = await response.json();
          if (userRoles && userRoles.length > 0) {
            editForm.setValue("roleId", userRoles[0].id.toString());
          }
        } catch (error) {
          console.error("Kullanıcı rol bilgisi alınamadı:", error);
        }
      };
      
      fetchUserRole();
    }
  }, [selectedUser, editForm]);

  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      departmentId: undefined,
      roleId: undefined,
    },
  });

  const onSubmit = (data: z.infer<typeof userFormSchema>) => {
    createUserMutation.mutate(data);
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to get department name
  const getDepartmentName = (departmentId: number) => {
    const department = departments.find(d => d.id === departmentId);
    return department?.name || "Atanmamış";
  };

  // Helper function to get role names for a user
  const getRoleNamesForUser = (userId: number, userRolesMapping: Record<number, any[]>) => {
    const userRoles = userRolesMapping[userId] || [];
    if (!userRoles.length) {
      return "Atanmamış";
    }
    return userRoles.map((role: any) => role.name).join(", ");
  };
  
  // Load roles for all users
  const [userRolesMapping, setUserRolesMapping] = useState<Record<number, any[]>>({});
  
  // Effect to load roles for each user
  useEffect(() => {
    const fetchRolesForUsers = async () => {
      if (!users || users.length === 0) return;
      
      const mapping: Record<number, any[]> = {};
      
      for (const user of users) {
        try {
          const response = await fetch(`/api/admin/users/${user.id}/roles`);
          if (response.ok) {
            const roles = await response.json();
            mapping[user.id] = roles;
          }
        } catch (error) {
          console.error(`Error fetching roles for user ${user.id}:`, error);
        }
      }
      
      setUserRolesMapping(mapping);
    };
    
    fetchRolesForUsers();
  }, [users]);

  return (
    <PageContainer
      title="Kullanıcı Yönetimi"
      subtitle="Kullanıcıları görüntüleyin, ekleyin, düzenleyin veya silin"
      breadcrumbs={[
        { label: "Ana Sayfa", href: "/" },
        { label: "Admin", href: "/admin" },
        { label: "Kullanıcı Yönetimi", href: "/admin/users" },
      ]}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Kullanıcılar</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kullanıcı ara..."
                className="pl-8 w-60"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Kullanıcı
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
                  <DialogDescription>
                    Sisteme erişebilecek yeni bir kullanıcı oluşturun. Kullanıcıya departman ve rol atamayı unutmayın.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kullanıcı Adı</FormLabel>
                          <FormControl>
                            <Input placeholder="Kullanıcı adı" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ad Soyad</FormLabel>
                            <FormControl>
                              <Input placeholder="Ad soyad" {...field} />
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
                              <Input placeholder="E-posta" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Şifre</FormLabel>
                          <FormControl>
                            <Input placeholder="Şifre" type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="departmentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Departman</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Departman seçin" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {departments.map((department) => (
                                  <SelectItem key={department.id} value={department.id.toString()}>
                                    {department.name}
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
                        name="roleId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rol</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Rol seçin" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roles.map((role) => (
                                  <SelectItem key={role.id} value={role.id.toString()}>
                                    {role.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        İptal
                      </Button>
                      <Button type="submit" disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            {/* Kullanıcı Düzenleme Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Kullanıcı Düzenle</DialogTitle>
                  <DialogDescription>
                    {selectedUser?.fullName} kullanıcısının bilgilerini düzenleyin.
                  </DialogDescription>
                </DialogHeader>
                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit((data) => {
                    // Şifre boş ise objeden çıkar
                    const formData = {...data};
                    if (!formData.password) {
                      delete formData.password;
                    }
                    updateUserDetailsMutation.mutate(formData);
                  })} className="space-y-4">
                    <FormField
                      control={editForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kullanıcı Adı</FormLabel>
                          <FormControl>
                            <Input placeholder="Kullanıcı adı" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ad Soyad</FormLabel>
                            <FormControl>
                              <Input placeholder="Ad soyad" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-posta</FormLabel>
                            <FormControl>
                              <Input placeholder="E-posta" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={editForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Şifre (Boş bırakılırsa değişmez)</FormLabel>
                          <FormControl>
                            <Input placeholder="Yeni şifre" type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="departmentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Departman</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Departman seçin" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {departments.map((department) => (
                                  <SelectItem key={department.id} value={department.id.toString()}>
                                    {department.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="roleId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rol</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Rol seçin" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roles.map((role) => (
                                  <SelectItem key={role.id} value={role.id.toString()}>
                                    {role.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                        İptal
                      </Button>
                      <Button type="submit" disabled={updateUserDetailsMutation.isPending}>
                        {updateUserDetailsMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : usersError ? (
            <div className="text-center py-8 text-red-500">
              Kullanıcılar yüklenirken bir hata oluştu: {usersError.message}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı Adı</TableHead>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Departman</TableHead>
                  <TableHead>Roller</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Kullanıcı bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getDepartmentName(user.departmentId)}</TableCell>
                      <TableCell>{getRoleNamesForUser(user.id, userRolesMapping)}</TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <div className="flex items-center">
                            <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></div>
                            Aktif
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="h-2.5 w-2.5 rounded-full bg-red-500 mr-2"></div>
                            Pasif
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsEditDialogOpen(true);
                            }}
                            title="Düzenle"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.isActive ? (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                // Kullanıcıyı devre dışı bırak
                                if (window.confirm(`${user.fullName} kullanıcısını devre dışı bırakmak istediğinizden emin misiniz?`)) {
                                  updateUserMutation.mutate({ id: user.id, status: false });
                                }
                              }}
                              title="Devre Dışı Bırak"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                // Kullanıcıyı aktifleştir
                                if (window.confirm(`${user.fullName} kullanıcısını aktifleştirmek istediğinizden emin misiniz?`)) {
                                  updateUserMutation.mutate({ id: user.id, status: true });
                                }
                              }}
                              title="Aktifleştir"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              // Kullanıcıyı sil
                              if (window.confirm(`${user.fullName} kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
                                deleteUserMutation.mutate(user.id);
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
    </PageContainer>
  );
}
