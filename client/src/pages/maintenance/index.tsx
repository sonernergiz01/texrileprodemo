import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { MaintenanceRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Settings, RotateCcw, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  "pending": "bg-yellow-200 text-yellow-800 hover:bg-yellow-300",
  "in-progress": "bg-blue-200 text-blue-800 hover:bg-blue-300",
  "completed": "bg-green-200 text-green-800 hover:bg-green-300",
  "cancelled": "bg-gray-200 text-gray-800 hover:bg-gray-300",
};

const priorityColors: Record<string, string> = {
  "low": "bg-slate-200 text-slate-800",
  "normal": "bg-blue-200 text-blue-800",
  "high": "bg-orange-200 text-orange-800",
  "critical": "bg-red-200 text-red-800"
};

const priorityIcons: Record<string, React.ReactNode> = {
  "low": <Settings className="h-4 w-4 mr-1" />,
  "normal": <RotateCcw className="h-4 w-4 mr-1" />,
  "high": <Clock className="h-4 w-4 mr-1" />,
  "critical": <AlertTriangle className="h-4 w-4 mr-1" />
};

export default function MaintenancePage() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const { toast } = useToast();

  // Mevcut kullanıcı verilerini al
  const { data: user } = useQuery<{ id: number, username: string, departmentId: number }>({
    queryKey: ["/api/user"],
  });

  // Bakım taleplerini al
  const { 
    data: maintenanceRequests, 
    isLoading,
    isError,
    refetch
  } = useQuery<MaintenanceRequest[]>({
    queryKey: ["/api/maintenance"],
  });

  // Departman verilerini al
  const { data: departments } = useQuery<{ id: number, name: string, code: string, color: string }[]>({
    queryKey: ["/api/admin/departments"],
  });
  
  // Bakım departmanlarını tanımla
  const maintenanceDepartments = [
    { id: 20, name: "Elektrik Bakım", code: "ELEC", color: "#f59e0b" },
    { id: 21, name: "Mekanik Bakım", code: "MECH", color: "#d97706" },
    { id: 22, name: "Bilgi İşlem", code: "IT", color: "#0ea5e9" }
  ];

  // Hata durumunu ele al
  if (isError) {
    return (
      <div className="container mx-auto py-10">
        <PageHeader 
          title="Bakım Talepleri" 
          description="Bakım talepleri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin."
          actions={
            <Button onClick={() => refetch()}>Yeniden Dene</Button>
          }
        />
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          <p>Bakım talepleri yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>
        </div>
      </div>
    );
  }

  // Talepleri filtrele
  const getFilteredRequests = () => {
    if (!maintenanceRequests || !user) return [];

    let filtered = maintenanceRequests;
    
    // Kullanıcı departmanına göre talepleri filtrele
    // Admin (departmanId = 1) tüm talepleri görebilir
    // Diğer bakım departmanları (20, 21, 22) sadece kendi departmanlarına açılan talepleri görebilir
    if (user.departmentId !== 1) {
      const userDeptId = user.departmentId;
      
      // Eğer kullanıcı bakım departmanlarından birindeyse (20, 21, 22)
      if ([20, 21, 22].includes(userDeptId)) {
        // Sadece kendi departmanına açılan talepleri göster (targetDepartmentId)
        filtered = filtered.filter(req => req.targetDepartmentId === userDeptId);
      }
    }
    
    // Sekme filtreleme
    if (activeTab !== "all") {
      filtered = filtered.filter(req => req.status === activeTab);
    }
    
    // Departman filtreleme
    if (departmentFilter && departmentFilter !== "all") {
      filtered = filtered.filter(req => req.targetDepartmentId.toString() === departmentFilter);
    }
    
    // Arama filtreleme
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(req => 
        req.title.toLowerCase().includes(search) || 
        req.description.toLowerCase().includes(search) ||
        req.priority.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  };

  const filteredRequests = getFilteredRequests();

  // Tablo sütunları
  const columns = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }: any) => <span className="font-mono">#{row.getValue("id")}</span>,
    },
    {
      accessorKey: "title",
      header: "Başlık",
      cell: ({ row }: any) => (
        <Link to={`/maintenance/${row.getValue("id")}`} className="text-blue-600 hover:underline font-medium">
          {row.getValue("title")}
        </Link>
      ),
    },
    {
      accessorKey: "priority",
      header: "Öncelik",
      cell: ({ row }: any) => {
        const priority = row.getValue("priority") as string;
        return (
          <Badge className={`${priorityColors[priority]} flex items-center`}>
            {priorityIcons[priority]}
            {priority === "low" ? "Düşük" :
             priority === "normal" ? "Normal" :
             priority === "high" ? "Yüksek" :
             priority === "critical" ? "Kritik" : priority}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Durum",
      cell: ({ row }: any) => {
        const status = row.getValue("status") as string;
        return (
          <Badge className={statusColors[status]}>
            {status === "pending" ? "Beklemede" :
             status === "in-progress" ? "Devam Ediyor" :
             status === "completed" ? "Tamamlandı" :
             status === "cancelled" ? "İptal Edildi" : status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "departmentId",
      header: "Departman",
      cell: ({ row }: any) => {
        const deptId = row.getValue("departmentId");
        const department = departments?.find(d => d.id === deptId);
        return department ? department.name : deptId;
      },
    },
    {
      accessorKey: "machineId",
      header: "Makine",
      cell: ({ row }: any) => {
        const machineId = row.getValue("machineId");
        return machineId || "-";
      },
    },
    {
      accessorKey: "requestDate",
      header: "Talep Tarihi",
      cell: ({ row }: any) => {
        const date = row.getValue("requestDate");
        return date ? format(new Date(date), "dd.MM.yyyy HH:mm") : "-";
      },
    },
    {
      accessorKey: "assignedToId",
      header: "Atanan",
      cell: ({ row }: any) => {
        const assignedToId = row.getValue("assignedToId");
        return assignedToId ? `${assignedToId}` : "-";
      },
    },
    {
      id: "actions",
      cell: ({ row }: any) => {
        const id = row.getValue("id");
        return (
          <Button variant="outline" size="sm" onClick={() => setLocation(`/maintenance/${id}`)}>
            Detay
          </Button>
        );
      },
    },
  ];

  // Yükleme durumunda iskelet göster
  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <PageHeader 
          title="Bakım Talepleri" 
          description="Departman makine ve ekipmanları için bakım talepleri yönetimi"
        />
        <div className="space-y-4 mt-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <PageHeader 
        title="Bakım Talepleri" 
        description="Departman makine ve ekipmanları için bakım talepleri yönetimi"
        actions={
          <Button onClick={() => setLocation("/maintenance/create")}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Yeni Bakım Talebi
          </Button>
        }
      />

      <div className="mt-6">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">Tümü</TabsTrigger>
              <TabsTrigger value="pending">Beklemede</TabsTrigger>
              <TabsTrigger value="in-progress">Devam Ediyor</TabsTrigger>
              <TabsTrigger value="completed">Tamamlandı</TabsTrigger>
              <TabsTrigger value="cancelled">İptal Edildi</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Input
                placeholder="Arama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Departman Filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Departmanlar</SelectItem>
                  {/* Admin ise tüm bakım departmanlarını göster, değilse sadece kendi departmanını */}
                  {user?.departmentId === 1 ? (
                    maintenanceDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))
                  ) : (
                    /* Admin olmayan kullanıcılar için sadece kendi departmanlarını göster */
                    maintenanceDepartments
                      .filter(dept => dept.id === user?.departmentId)
                      .map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>
                    {activeTab === "all" 
                      ? "Tüm Bakım Talepleri" 
                      : activeTab === "pending" 
                        ? "Bekleyen Bakım Talepleri" 
                        : activeTab === "in-progress" 
                          ? "Devam Eden Bakım Talepleri" 
                          : activeTab === "completed" 
                            ? "Tamamlanmış Bakım Talepleri" 
                            : "İptal Edilmiş Bakım Talepleri"}
                  </span>
                  <Badge variant="outline" className="ml-2 text-sm">
                    {filteredRequests.length} Talep
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <CheckCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium mb-1">Bakım Talebi Bulunamadı</p>
                    <p className="text-sm mb-4">Seçili kriterlere uygun bakım talebi bulunmuyor.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setActiveTab("all");
                        setSearchTerm("");
                        setDepartmentFilter("");
                      }}
                    >
                      Filtreleri Temizle
                    </Button>
                  </div>
                ) : (
                  <DataTable 
                    columns={columns} 
                    data={filteredRequests} 
                    pageSize={10} 
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}