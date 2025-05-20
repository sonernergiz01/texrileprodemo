import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  Calendar, 
  Settings, 
  Plus, 
  Tool, 
  Search, 
  Filter, 
  Loader2, 
  MoreVertical,
  ArrowUpDown,
  Wrench,
  Clock,
  Calendar as CalendarIcon,
  User,
  ChevronRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import PageHeader from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";

// Bakım planı durumları için renk kodları
const statusColors = {
  active: "bg-green-100 text-green-800 border-green-300",
  completed: "bg-blue-100 text-blue-800 border-blue-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

// Bakım sıklığı metinleri
const frequencyTexts = {
  daily: "Günlük",
  weekly: "Haftalık",
  monthly: "Aylık",
  quarterly: "3 Aylık",
  "semi-annual": "6 Aylık",
  annual: "Yıllık",
};

// Bakım departmanları için renk kodları
const departmentColors = {
  1: "bg-indigo-100 text-indigo-800", // Admin
  3: "bg-emerald-100 text-emerald-800", // Üretim
  6: "bg-blue-100 text-blue-800", // Elektrik Bakım
  7: "bg-orange-100 text-orange-800", // Mekanik Bakım
  8: "bg-purple-100 text-purple-800", // Bilgi İşlem
};

export default function MaintenancePlansPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentTab, setCurrentTab] = useState("list");

  // Bakım planlarını getir
  const {
    data: plans = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["/api/maintenance/plans"],
  });

  // Departmanları getir
  const { data: departments = [] } = useQuery({
    queryKey: ["/api/admin/departments"],
  });

  // Kullanıcıları getir (atanan kişileri göstermek için)
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Filtreleme işlevi
  const filteredPlans = React.useMemo(() => {
    if (!Array.isArray(plans)) return [];
    
    return plans.filter((plan) => {
      // Arama terimiyle filtrele
      const matchesSearch = 
        searchTerm === "" ||
        plan.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // Departmanla filtrele
      const matchesDepartment = 
        filterDepartment === "all" || 
        plan.departmentId === parseInt(filterDepartment);

      // Durumla filtrele
      const matchesStatus = 
        filterStatus === "all" || 
        plan.status === filterStatus;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [plans, searchTerm, filterDepartment, filterStatus]);

  // Departman adını bul
  const getDepartmentName = (departmentId: number) => {
    const department = departments.find((d) => d.id === departmentId);
    return department ? department.name : "Bilinmeyen Departman";
  };

  // Kullanıcı adını bul
  const getUserName = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.fullName : "Bilinmeyen Kullanıcı";
  };

  // Yükleniyor durumu
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 mr-2" />
        <span>Bakım planları yükleniyor...</span>
      </div>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">
          Bakım planları yüklenirken bir hata oluştu:
        </div>
        <div className="text-sm text-gray-600">{(error as Error).message}</div>
        <Button onClick={() => refetch()} className="mt-4">
          Yeniden Dene
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <PageHeader
        title="Bakım Planları"
        description="Tüm bakım planlarını görüntüle ve yönet"
        icon={<Calendar className="h-6 w-6" />}
      >
        <Button asChild>
          <Link href="/maintenance/plans/create">
            <Plus className="mr-2 h-4 w-4" /> Yeni Plan Oluştur
          </Link>
        </Button>
      </PageHeader>

      <Tabs
        defaultValue="list"
        value={currentTab}
        onValueChange={setCurrentTab}
        className="mt-6"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="list">Liste Görünümü</TabsTrigger>
            <TabsTrigger value="calendar">Takvim Görünümü</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Planları ara..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select
              value={filterDepartment}
              onValueChange={setFilterDepartment}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Departman" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Departmanlar</SelectLabel>
                  <SelectItem value="all">Tümü</SelectItem>
                  {departments
                    .filter(d => [1, 3, 6, 7, 8].includes(d.id)) // Admin, Üretim, Elektrik, Mekanik, Bilgi İşlem
                    .map((department) => (
                      <SelectItem key={department.id} value={department.id.toString()}>
                        {department.name}
                      </SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Durum</SelectLabel>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="completed">Tamamlanmış</SelectItem>
                  <SelectItem value="cancelled">İptal Edilmiş</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="list" className="p-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlans.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-gray-500 mb-2">Hiç bakım planı bulunamadı</div>
                <Button variant="outline" asChild>
                  <Link href="/maintenance/plans/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni Plan Oluştur
                  </Link>
                </Button>
              </div>
            ) : (
              filteredPlans.map((plan) => (
                <Card key={plan.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge 
                        className={`border font-medium ${statusColors[plan.status] || "bg-gray-100 text-gray-800"}`}
                      >
                        {plan.status === "active" ? "Aktif" : 
                         plan.status === "completed" ? "Tamamlandı" : 
                         plan.status === "cancelled" ? "İptal Edildi" : plan.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Menü</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/maintenance/plans/${plan.id}`)}
                          >
                            Planı Görüntüle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toast({
                              title: "Bildirim",
                              description: "Bu özellik henüz geliştirme aşamasındadır."
                            })}
                          >
                            Planı Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toast({
                              title: "Bildirim",
                              description: "Bu özellik henüz geliştirme aşamasındadır."
                            })}
                            className="text-red-600"
                          >
                            Planı İptal Et
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="text-lg mt-2">
                      <Link href={`/maintenance/plans/${plan.id}`} className="hover:text-blue-600 transition-colors">
                        {plan.name}
                      </Link>
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge 
                        variant="secondary" 
                        className={departmentColors[plan.departmentId] || "bg-gray-100 text-gray-800"}
                      >
                        {getDepartmentName(plan.departmentId)}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="text-xs font-normal"
                      >
                        {frequencyTexts[plan.frequency] || plan.frequency}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {plan.description || "Bu bakım planı için açıklama bulunmamaktadır."}
                    </p>
                  </CardContent>
                  <Separator />
                  <CardFooter className="flex justify-between pt-4 pb-2">
                    <div className="flex items-center text-xs text-gray-600">
                      <User className="mr-1 h-3 w-3" />
                      <span>{getUserName(plan.createdById)}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>{plan.startDate ? format(new Date(plan.startDate), "dd MMM yyyy", { locale: tr }) : "-"}</span>
                    </div>
                    <Link href={`/maintenance/plans/${plan.id}`} className="flex items-center text-xs text-blue-600 hover:text-blue-800">
                      <span>Detaylar</span>
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Link>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="py-4">
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <CalendarIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-700">Takvim Görünümü</h3>
            <p className="text-sm text-gray-500 mt-2 mb-4">
              Bu özellik henüz geliştirme aşamasındadır. Yakında burada bakım planlarınızı takvim üzerinde görebileceksiniz.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}