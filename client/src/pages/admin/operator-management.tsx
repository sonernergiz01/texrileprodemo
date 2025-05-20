/**
 * Operatör Yönetimi Sayfası
 * Bu sayfa, tekstil fabrikasında çalışan operatörlerin tanımlanması ve yönetilmesi içindir.
 * Operatörler departmanlara atanabilir ve yetkilendirilebilir.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import {
  MoreHorizontal,
  Loader2,
  UserPlus,
  Filter,
  Search,
  Edit,
  Trash2,
  UserCog,
  BadgeCheck,
  BadgeX,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Yeni operatör formu şeması
const operatorFormSchema = z.object({
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  fullName: z.string().min(3, "Ad Soyad en az 3 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  departmentId: z.string().min(1, "Departman seçimi zorunludur"),
  isOperator: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export default function OperatorManagementPage() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  // Form tanımı
  const form = useForm<z.infer<typeof operatorFormSchema>>({
    resolver: zodResolver(operatorFormSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      departmentId: "",
      isOperator: true,
      isActive: true,
    },
  });

  // Kullanıcıları getir
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      return res.json();
    },
  });

  // Departmanları getir
  const { data: departments, isLoading: departmentsLoading } = useQuery({
    queryKey: ["/api/admin/departments"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/departments");
      return res.json();
    },
  });

  // Rolleri getir
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/admin/roles"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/roles");
      return res.json();
    },
  });

  // Kullanıcı ekle mutation
  const { mutate: addUser, isPending: isAddingUser } = useMutation({
    mutationFn: async (data: z.infer<typeof operatorFormSchema>) => {
      const payload = {
        ...data,
        departmentId: parseInt(data.departmentId),
      };
      const res = await apiRequest("POST", "/api/admin/users", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Operatör eklendi",
        description: "Yeni operatör başarıyla eklendi",
      });
      form.reset();
      setShowDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Operatör eklenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });
  
  // Kullanıcı güncelleme mutation
  const { mutate: updateUser, isPending: isUpdatingUser } = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        departmentId: parseInt(data.departmentId),
      };
      
      // Şifre boş ise payload'dan çıkar
      if (!payload.password) {
        delete payload.password;
      }
      
      const res = await apiRequest(
        "PATCH", 
        `/api/admin/users/${editingUser.id}`, 
        payload
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Operatör güncellendi",
        description: "Operatör bilgileri başarıyla güncellendi",
      });
      setEditingUser(null);
      form.reset();
      setShowDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Operatör güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Kullanıcı silme mutation
  const { mutate: deleteUser, isPending: isDeletingUser } = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      if (!res.ok) {
        throw new Error("Kullanıcı silinemedi");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Operatör silindi",
        description: "Operatör başarıyla silindi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Operatör silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Operatör durumunu değiştir (aktif/pasif)
  const { mutate: changeStatus, isPending: isChangingStatus } = useMutation({
    mutationFn: async ({userId, isActive}: {userId: number, isActive: boolean}) => {
      const res = await apiRequest(
        "PATCH", 
        `/api/admin/users/${userId}`, 
        { isActive }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Durum değiştirildi",
        description: "Operatör durumu başarıyla değiştirildi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Durum değiştirilirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Form submit
  const onSubmit = (values: z.infer<typeof operatorFormSchema>) => {
    if (editingUser) {
      updateUser(values);
    } else {
      addUser(values);
    }
  };

  // Düzenleme modalını aç
  const handleEdit = (user: any) => {
    setEditingUser(user);
    form.reset({
      username: user.username,
      password: "", // Şifre alanını boş bırak
      fullName: user.fullName,
      email: user.email,
      departmentId: user.departmentId.toString(),
      isOperator: user.isOperator || false,
      isActive: user.isActive,
    });
    setShowDialog(true);
  };

  // Yeni operatör modalını aç
  const handleAddNew = () => {
    setEditingUser(null);
    form.reset({
      username: "",
      password: "",
      fullName: "",
      email: "",
      departmentId: "",
      isOperator: true,
      isActive: true,
    });
    setShowDialog(true);
  };
  
  // Departman adını ID'ye göre getir
  const getDepartmentName = (id: number) => {
    if (!departments) return "-";
    const dept = departments.find((d: any) => d.id === id);
    return dept ? dept.name : "-";
  };

  // Kullanıcı filtreleme
  const filteredUsers = users
    ? users.filter((user: any) => {
        const matchesSearch =
          user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase());
          
        const matchesDepartment = departmentFilter && departmentFilter !== "all"
          ? user.departmentId === parseInt(departmentFilter)
          : true;

        return matchesSearch && matchesDepartment;
      })
    : [];

  // Operatör listesi - sadece operatör olanlar
  const operatorUsers = filteredUsers.filter((user: any) => user.isOperator);
    
  // Sistem kullanıcıları listesi - operatör olmayanlar  
  const systemUsers = filteredUsers.filter((user: any) => !user.isOperator);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Operatör Yönetimi</h1>
          <p className="text-muted-foreground">
            Operatörlerin tanımlanması ve yönetilmesi
          </p>
        </div>

        <Button onClick={handleAddNew}>
          <UserPlus className="mr-2 h-4 w-4" />
          Yeni Operatör Ekle
        </Button>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="İsim, kullanıcı adı veya e-posta ara..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-[240px]">
          <Select
            value={departmentFilter}
            onValueChange={setDepartmentFilter}
          >
            <SelectTrigger>
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4 text-gray-500" />
                <SelectValue placeholder="Tüm Departmanlar" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Departmanlar</SelectItem>
              {departments &&
                departments.map((dept: any) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kullanıcı Tabloları */}
      <Tabs defaultValue="operators">
        <TabsList className="mb-4">
          <TabsTrigger value="operators">Operatörler</TabsTrigger>
          <TabsTrigger value="systems">Sistem Kullanıcıları</TabsTrigger>
        </TabsList>
        
        <TabsContent value="operators">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Operatörler</CardTitle>
              <CardDescription>
                Üretim süreçlerinde çalışan operatörler
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="py-20 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : operatorUsers.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">Operatör bulunamadı</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kullanıcı Adı</TableHead>
                        <TableHead>Ad Soyad</TableHead>
                        <TableHead>Departman</TableHead>
                        <TableHead>E-posta</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="w-[100px]">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operatorUsers.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.username}
                          </TableCell>
                          <TableCell>{user.fullName}</TableCell>
                          <TableCell>
                            {getDepartmentName(user.departmentId)}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.isActive ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Aktif
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Pasif
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEdit(user)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Düzenle
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => changeStatus({
                                    userId: user.id,
                                    isActive: !user.isActive
                                  })}
                                >
                                  {user.isActive ? (
                                    <>
                                      <BadgeX className="mr-2 h-4 w-4" />
                                      Pasif Yap
                                    </>
                                  ) : (
                                    <>
                                      <BadgeCheck className="mr-2 h-4 w-4" />
                                      Aktif Yap
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    if (confirm("Bu operatörü silmek istediğinize emin misiniz?")) {
                                      deleteUser(user.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Sil
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="systems">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Sistem Kullanıcıları</CardTitle>
              <CardDescription>
                Yönetim panelinde çalışan sistem kullanıcıları
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="py-20 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : systemUsers.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">Sistem kullanıcısı bulunamadı</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kullanıcı Adı</TableHead>
                        <TableHead>Ad Soyad</TableHead>
                        <TableHead>Departman</TableHead>
                        <TableHead>E-posta</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="w-[100px]">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {systemUsers.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.username}
                          </TableCell>
                          <TableCell>{user.fullName}</TableCell>
                          <TableCell>
                            {getDepartmentName(user.departmentId)}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.isActive ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Aktif
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Pasif
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEdit(user)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Düzenle
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => changeStatus({
                                    userId: user.id,
                                    isActive: !user.isActive
                                  })}
                                >
                                  {user.isActive ? (
                                    <>
                                      <BadgeX className="mr-2 h-4 w-4" />
                                      Pasif Yap
                                    </>
                                  ) : (
                                    <>
                                      <BadgeCheck className="mr-2 h-4 w-4" />
                                      Aktif Yap
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    if (confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) {
                                      deleteUser(user.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Sil
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Kullanıcı Ekleme/Düzenleme Modal */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Operatör Düzenle" : "Yeni Operatör Ekle"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Operatör bilgilerini güncelleyin"
                : "Yeni bir operatör oluşturun ve departman atayın"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kullanıcı Adı</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="off" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Şifre
                        {editingUser && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (Değiştirmek için doldurun)
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          autoComplete="new-password"
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
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ad Soyad</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departman</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Departman seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departmentsLoading ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          departments?.map((dept: any) => (
                            <SelectItem
                              key={dept.id}
                              value={dept.id.toString()}
                            >
                              {dept.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-8">
                <FormField
                  control={form.control}
                  name="isOperator"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Operatör Kullanıcısı</FormLabel>
                        <FormDescription>
                          Üretim süreçlerinde çalışan operatör
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Aktif</FormLabel>
                        <FormDescription>
                          Kullanıcı sisteme giriş yapabilir
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={isAddingUser || isUpdatingUser}
                >
                  {(isAddingUser || isUpdatingUser) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingUser ? "Güncelle" : "Ekle"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}