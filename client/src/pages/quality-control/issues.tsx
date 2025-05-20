import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Loader2, 
  Search, 
  Plus, 
  Edit, 
  Eye,
  FileText,
  Calendar,
  Download,
  Upload,
  Trash2,
  Filter,
  ChevronDown,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart,
  CheckSquare,
  CircleSlash,
  ClipboardList,
  FileBarChart,
  FileCheck,
  ImagePlus,
  Printer,
  CalendarDays
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Hata raporu şeması
const issueSchema = z.object({
  issueId: z.string().min(1, "Hata ID gereklidir"),
  title: z.string().min(1, "Başlık gereklidir"),
  description: z.string().min(1, "Açıklama gereklidir"),
  orderId: z.number().optional(),
  productId: z.number().optional(),
  department: z.string().min(1, "Departman gereklidir"),
  reporter: z.string().min(1, "Raporlayan kişi gereklidir"),
  assignee: z.string().optional(),
  dateReported: z.string().min(1, "Rapor tarihi gereklidir"),
  severity: z.enum(["Kritik", "Yüksek", "Orta", "Düşük"]),
  status: z.enum(["Açık", "İnceleniyor", "Çözüldü", "Kapatıldı", "İptal Edildi"]).default("Açık"),
  priority: z.enum(["Acil", "Yüksek", "Normal", "Düşük"]).default("Normal"),
  dueDate: z.string().optional(),
  steps: z.string().optional(),
  resolution: z.string().optional(),
  resolutionDate: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  relatedIssues: z.array(z.number()).optional(),
});

const IssuesPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("basic");

  // Form tanımlama
  const form = useForm<z.infer<typeof issueSchema>>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      issueId: "",
      title: "",
      description: "",
      orderId: undefined,
      productId: undefined,
      department: "",
      reporter: "",
      assignee: "",
      dateReported: new Date().toISOString().split('T')[0],
      severity: "Orta",
      status: "Açık",
      priority: "Normal",
      dueDate: "",
      steps: "",
      resolution: "",
      resolutionDate: "",
      imageUrls: [],
      relatedIssues: [],
    },
  });

  // Düzenleme formu
  const editForm = useForm<z.infer<typeof issueSchema>>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      issueId: "",
      title: "",
      description: "",
      orderId: undefined,
      productId: undefined,
      department: "",
      reporter: "",
      assignee: "",
      dateReported: "",
      severity: "Orta",
      status: "Açık",
      priority: "Normal",
      dueDate: "",
      steps: "",
      resolution: "",
      resolutionDate: "",
      imageUrls: [],
      relatedIssues: [],
    },
  });

  // Hata raporları verisini çek
  const { data: issues = [], isLoading: isLoadingIssues } = useQuery({
    queryKey: ["/api/quality-control/issues"],
  });

  // Siparişler verisini çek
  const { data: orders = [] } = useQuery({
    queryKey: ["/api/sales/orders"],
  });

  // Ürünler verisini çek
  const { data: products = [] } = useQuery({
    queryKey: ["/api/admin/products"],
  });

  // Departmanlar verisini çek
  const { data: departments = [] } = useQuery({
    queryKey: ["/api/admin/departments"],
  });

  // Personel verisini çek
  const { data: staff = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Yeni hata raporu oluşturma
  const createIssueMutation = useMutation({
    mutationFn: async (data: z.infer<typeof issueSchema>) => {
      const res = await apiRequest("POST", "/api/quality-control/issues", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Hata raporu başarıyla oluşturuldu",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/quality-control/issues"] });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Hata raporu oluşturulurken bir sorun oluştu",
        variant: "destructive",
      });
    },
  });

  // Hata raporu güncelleme
  const updateIssueMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/quality-control/issues/${selectedIssue.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Hata raporu başarıyla güncellendi",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/quality-control/issues"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Hata raporu güncellenirken bir sorun oluştu",
        variant: "destructive",
      });
    },
  });

  // Hata raporu silme
  const deleteIssueMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/quality-control/issues/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Hata raporu başarıyla silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quality-control/issues"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Hata raporu silinirken bir sorun oluştu",
        variant: "destructive",
      });
    },
  });

  // Form gönderme
  const onSubmit = (data: z.infer<typeof issueSchema>) => {
    createIssueMutation.mutate(data);
  };

  // Form güncelleme
  const onEditSubmit = (data: z.infer<typeof issueSchema>) => {
    updateIssueMutation.mutate(data);
  };

  // Hata raporunu görüntüleme
  const handleViewIssue = (issue: any) => {
    setSelectedIssue(issue);
    setIsViewDialogOpen(true);
  };

  // Hata raporunu düzenleme
  const handleEditIssue = (issue: any) => {
    setSelectedIssue(issue);
    editForm.reset({
      issueId: issue.issueId,
      title: issue.title,
      description: issue.description,
      orderId: issue.orderId,
      productId: issue.productId,
      department: issue.department,
      reporter: issue.reporter,
      assignee: issue.assignee || "",
      dateReported: issue.dateReported,
      severity: issue.severity,
      status: issue.status,
      priority: issue.priority,
      dueDate: issue.dueDate || "",
      steps: issue.steps || "",
      resolution: issue.resolution || "",
      resolutionDate: issue.resolutionDate || "",
      imageUrls: issue.imageUrls || [],
      relatedIssues: issue.relatedIssues || [],
    });
    setIsEditDialogOpen(true);
  };

  // Hata raporunu silme
  const handleDeleteIssue = (issue: any) => {
    if (window.confirm("Bu hata raporunu silmek istediğinizden emin misiniz?")) {
      deleteIssueMutation.mutate(issue.id);
    }
  };

  // Filtreleme
  const getFilteredIssues = () => {
    let filtered = issues;
    
    // Arama terimine göre filtrele
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((issue: any) => 
        issue.issueId?.toLowerCase().includes(searchLower) ||
        issue.title?.toLowerCase().includes(searchLower) ||
        issue.description?.toLowerCase().includes(searchLower) ||
        issue.reporter?.toLowerCase().includes(searchLower) ||
        issue.assignee?.toLowerCase().includes(searchLower)
      );
    }
    
    // Duruma göre filtrele
    if (statusFilter) {
      filtered = filtered.filter((issue: any) => issue.status === statusFilter);
    }
    
    // Önem derecesine göre filtrele
    if (severityFilter) {
      filtered = filtered.filter((issue: any) => issue.severity === severityFilter);
    }
    
    // Departmana göre filtrele
    if (departmentFilter) {
      filtered = filtered.filter((issue: any) => issue.department === departmentFilter);
    }
    
    return filtered;
  };

  // Sipariş numarasını al
  const getOrderNumber = (orderId?: number) => {
    if (!orderId) return "-";
    const order = orders.find((o: any) => o.id === orderId);
    return order ? order.orderNumber : "-";
  };

  // Ürün adını al
  const getProductName = (productId?: number) => {
    if (!productId) return "-";
    const product = products.find((p: any) => p.id === productId);
    return product ? product.name : "-";
  };

  // Durum rozeti renkleri
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Çözüldü":
        return "success";
      case "İnceleniyor":
        return "warning";
      case "Açık":
        return "destructive";
      case "Kapatıldı":
        return "outline";
      case "İptal Edildi":
        return "secondary";
      default:
        return "outline";
    }
  };

  // Durum ikonu
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Çözüldü":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "İnceleniyor":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "Açık":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "Kapatıldı":
        return <CheckSquare className="h-4 w-4 text-gray-500" />;
      case "İptal Edildi":
        return <CircleSlash className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  // Önem rozeti renkleri
  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case "Kritik":
        return "destructive";
      case "Yüksek":
        return "default";
      case "Orta":
        return "warning";
      case "Düşük":
        return "outline";
      default:
        return "outline";
    }
  };

  // Öncelik rozeti renkleri
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "Acil":
        return "destructive";
      case "Yüksek":
        return "default";
      case "Normal":
        return "warning";
      case "Düşük":
        return "outline";
      default:
        return "outline";
    }
  };

  // Yükleme durumu
  if (isLoadingIssues) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filtrelenmiş hata raporları
  const filteredIssues = getFilteredIssues();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Hata Raporları" 
        description="Kalite kontrol sürecinde tespit edilen hataları izleyin ve yönetin"
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={statusFilter === null ? "default" : "outline"} 
            onClick={() => setStatusFilter(null)}
          >
            Tümü
          </Button>
          <Button 
            variant={statusFilter === "Açık" ? "default" : "outline"}
            onClick={() => setStatusFilter("Açık")}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <AlertTriangle className="mr-1 h-4 w-4" /> Açık
          </Button>
          <Button 
            variant={statusFilter === "İnceleniyor" ? "default" : "outline"}
            onClick={() => setStatusFilter("İnceleniyor")}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <AlertTriangle className="mr-1 h-4 w-4" /> İnceleniyor
          </Button>
          <Button 
            variant={statusFilter === "Çözüldü" ? "default" : "outline"}
            onClick={() => setStatusFilter("Çözüldü")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle2 className="mr-1 h-4 w-4" /> Çözüldü
          </Button>
          <Button 
            variant={statusFilter === "Kapatıldı" ? "default" : "outline"}
            onClick={() => setStatusFilter("Kapatıldı")}
          >
            <CheckSquare className="mr-1 h-4 w-4" /> Kapatıldı
          </Button>
        </div>
          
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Hata ID, Başlık, Açıklama..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtreler
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Önem Seviyesi</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSeverityFilter(null)}>
                Tümü
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSeverityFilter("Kritik")}>
                Kritik
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSeverityFilter("Yüksek")}>
                Yüksek
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSeverityFilter("Orta")}>
                Orta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSeverityFilter("Düşük")}>
                Düşük
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Departman</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setDepartmentFilter(null)}>
                Tümü
              </DropdownMenuItem>
              {departments.map((dept: any) => (
                <DropdownMenuItem 
                  key={dept.id} 
                  onClick={() => setDepartmentFilter(dept.name)}
                >
                  {dept.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Yeni Hata Raporu
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Hata Rapor Listesi</CardTitle>
          <CardDescription>
            Toplam {filteredIssues.length} hata raporu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredIssues.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter || severityFilter || departmentFilter ? 
                "Arama kriterlerine uygun hata raporu bulunamadı." : 
                "Henüz hata raporu bulunmamaktadır. Yeni bir hata raporu eklemek için 'Yeni Hata Raporu' butonunu kullanın."
              }
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hata ID</TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Departman</TableHead>
                  <TableHead>Önem</TableHead>
                  <TableHead>Öncelik</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Raporlayan</TableHead>
                  <TableHead>Rapor Tarihi</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.map((issue: any) => (
                  <TableRow key={issue.id}>
                    <TableCell className="font-medium">{issue.issueId}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{issue.title}</TableCell>
                    <TableCell>{issue.department}</TableCell>
                    <TableCell>
                      <Badge variant={getSeverityBadgeVariant(issue.severity)}>
                        {issue.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(issue.priority)}>
                        {issue.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getStatusIcon(issue.status)}
                        <Badge 
                          variant={getStatusBadgeVariant(issue.status)} 
                          className="ml-1"
                        >
                          {issue.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{issue.reporter}</TableCell>
                    <TableCell>{issue.dateReported}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Menüyü aç</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewIssue(issue)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Görüntüle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditIssue(issue)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {}}>
                            <FileCheck className="h-4 w-4 mr-2" />
                            Rapor Oluştur
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {}}>
                            <Printer className="h-4 w-4 mr-2" />
                            Yazdır
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteIssue(issue)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Yeni Hata Raporu Modalı */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Hata Raporu</DialogTitle>
            <DialogDescription>
              Yeni bir kalite hata raporu oluşturun.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Temel Bilgiler</TabsTrigger>
              <TabsTrigger value="details">Detaylar</TabsTrigger>
              <TabsTrigger value="resolution">Çözüm</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="issueId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hata ID*</FormLabel>
                          <FormControl>
                            <Input placeholder="ör: QC-ISSUE-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dateReported"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rapor Tarihi*</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Başlık*</FormLabel>
                        <FormControl>
                          <Input placeholder="Hatanın başlığı" {...field} />
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
                        <FormLabel>Açıklama*</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Hatanın detaylı açıklaması" 
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Departman*</FormLabel>
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
                              {departments.map((dept: any) => (
                                <SelectItem key={dept.id} value={dept.name}>
                                  {dept.name}
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
                      name="reporter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Raporlayan*</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Raporlayan kişi" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {staff.map((person: any) => (
                                <SelectItem key={person.id} value={person.fullName}>
                                  {person.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="severity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Önem Seviyesi*</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Önem seviyesi" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Kritik">Kritik</SelectItem>
                              <SelectItem value="Yüksek">Yüksek</SelectItem>
                              <SelectItem value="Orta">Orta</SelectItem>
                              <SelectItem value="Düşük">Düşük</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Öncelik*</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Öncelik" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Acil">Acil</SelectItem>
                              <SelectItem value="Yüksek">Yüksek</SelectItem>
                              <SelectItem value="Normal">Normal</SelectItem>
                              <SelectItem value="Düşük">Düşük</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Durum*</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Durum" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Açık">Açık</SelectItem>
                              <SelectItem value="İnceleniyor">İnceleniyor</SelectItem>
                              <SelectItem value="Çözüldü">Çözüldü</SelectItem>
                              <SelectItem value="Kapatıldı">Kapatıldı</SelectItem>
                              <SelectItem value="İptal Edildi">İptal Edildi</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="orderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>İlgili Sipariş</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sipariş seçin (isteğe bağlı)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Seçilmedi</SelectItem>
                              {orders.map((order: any) => (
                                <SelectItem key={order.id} value={order.id.toString()}>
                                  {order.orderNumber}
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
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>İlgili Ürün</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Ürün seçin (isteğe bağlı)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Seçilmedi</SelectItem>
                              {products.map((product: any) => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="steps"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adımlar/Yeniden Oluşturmak İçin</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Hatayı yeniden oluşturmak için gerekli adımlar" 
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="assignee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Atanan Kişi</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Atanan kişi (isteğe bağlı)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Seçilmedi</SelectItem>
                            {staff.map((person: any) => (
                              <SelectItem key={person.id} value={person.fullName}>
                                {person.fullName}
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
                      <FormItem>
                        <FormLabel>Bitiş Tarihi</FormLabel>
                        <FormControl>
                          <Input type="date" placeholder="Bitiş tarihi (isteğe bağlı)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="imageUrls"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Görsel URL'leri</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Her satıra bir görsel URL'si girin..." 
                            className="resize-none"
                            value={(field.value || []).join('\n')}
                            onChange={(e) => field.onChange(e.target.value.split('\n').filter(url => url.trim()))}
                          />
                        </FormControl>
                        <FormDescription>
                          Her satıra bir URL olacak şekilde görsel bağlantılarını girin
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-center">
                    <Button 
                      type="button" 
                      variant="outline"
                      className="w-full"
                    >
                      <ImagePlus className="mr-2 h-4 w-4" />
                      Görsel Yükle (İsteğe Bağlı)
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="resolution" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="resolution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Çözüm</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Çözüm açıklaması (eğer çözüldüyse)" 
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="resolutionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Çözüm Tarihi</FormLabel>
                        <FormControl>
                          <Input type="date" placeholder="Çözüm tarihi (eğer çözüldüyse)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createIssueMutation.isPending}
                  >
                    {createIssueMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Oluştur
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Hata Raporu Görüntüleme Modalı */}
      {selectedIssue && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedIssue.title}</DialogTitle>
              <DialogDescription>
                {selectedIssue.issueId} kodlu hata raporu
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Badge variant={getSeverityBadgeVariant(selectedIssue.severity)}>
                    {selectedIssue.severity}
                  </Badge>
                  <Badge variant={getPriorityBadgeVariant(selectedIssue.priority)}>
                    {selectedIssue.priority}
                  </Badge>
                </div>
                <Badge variant={getStatusBadgeVariant(selectedIssue.status)}>
                  {selectedIssue.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Temel Bilgiler</h4>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2">
                        <span className="text-muted-foreground">Departman:</span>
                        <span className="font-medium">{selectedIssue.department}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-muted-foreground">Raporlayan:</span>
                        <span className="font-medium">{selectedIssue.reporter}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-muted-foreground">Rapor Tarihi:</span>
                        <span className="font-medium">{selectedIssue.dateReported}</span>
                      </div>
                      {selectedIssue.assignee && (
                        <div className="grid grid-cols-2">
                          <span className="text-muted-foreground">Atanan Kişi:</span>
                          <span className="font-medium">{selectedIssue.assignee}</span>
                        </div>
                      )}
                      {selectedIssue.dueDate && (
                        <div className="grid grid-cols-2">
                          <span className="text-muted-foreground">Bitiş Tarihi:</span>
                          <span className="font-medium">{selectedIssue.dueDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {(selectedIssue.orderId || selectedIssue.productId) && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">İlişkili Öğeler</h4>
                      <div className="space-y-2 text-sm">
                        {selectedIssue.orderId && (
                          <div className="grid grid-cols-2">
                            <span className="text-muted-foreground">Sipariş:</span>
                            <span className="font-medium">{getOrderNumber(selectedIssue.orderId)}</span>
                          </div>
                        )}
                        {selectedIssue.productId && (
                          <div className="grid grid-cols-2">
                            <span className="text-muted-foreground">Ürün:</span>
                            <span className="font-medium">{getProductName(selectedIssue.productId)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {selectedIssue.resolution && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Çözüm Bilgileri</h4>
                      <div className="space-y-2 text-sm">
                        {selectedIssue.resolutionDate && (
                          <div className="grid grid-cols-2">
                            <span className="text-muted-foreground">Çözüm Tarihi:</span>
                            <span className="font-medium">{selectedIssue.resolutionDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Açıklama</h4>
                  <p className="text-sm p-3 bg-gray-50 rounded-md">{selectedIssue.description}</p>
                </div>
                
                {selectedIssue.steps && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Adımlar/Yeniden Oluşturmak İçin</h4>
                    <p className="text-sm p-3 bg-gray-50 rounded-md">{selectedIssue.steps}</p>
                  </div>
                )}
                
                {selectedIssue.resolution && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Çözüm</h4>
                    <p className="text-sm p-3 bg-gray-50 rounded-md">{selectedIssue.resolution}</p>
                  </div>
                )}
                
                {selectedIssue.imageUrls && selectedIssue.imageUrls.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Görseller</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedIssue.imageUrls.map((url: string, index: number) => (
                        <div key={index} className="w-full h-40 relative rounded-md overflow-hidden border">
                          <img 
                            src={url} 
                            alt={`Hata görüntüsü ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Kapat
                </Button>
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    setTimeout(() => {
                      handleEditIssue(selectedIssue);
                    }, 100);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Düzenle
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const Issues = IssuesPage;
export default Issues;