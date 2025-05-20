import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, Plus, Filter, RefreshCw, FileText, Tags } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import PageHeader from "@/components/layout/page-header";
import { useAuth } from "@/hooks/use-auth";
import { BarcodePrintButton } from "@/components/ui/barcode-print-button";

// Refakat kartı durumları için renkler ve Türkçe çevirileri
const statusColors = {
  "created": "bg-blue-500",
  "in-process": "bg-amber-500",
  "completed": "bg-green-500",
  "rejected": "bg-red-500"
};

const statusLabels = {
  "created": "Oluşturuldu",
  "in-process": "İşlemde",
  "completed": "Tamamlandı",
  "rejected": "Reddedildi"
};

// Refakat Kartları Ana Sayfa
export default function RefakatCardsPage() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  
  // Departmanları getir
  const { data: departments } = useQuery<any[]>({
    queryKey: ["/api/admin/departments"],
    enabled: !!user
  });
  
  // Refakat kartlarını getir
  const { data: cards, isLoading, isError, refetch } = useQuery<any[]>({
    queryKey: ["/api/production-tracking/production-cards", { 
      search: searchQuery,
      status: statusFilter !== "all" ? statusFilter : undefined,
      departmentId: departmentFilter !== "all" ? departmentFilter : undefined
    }],
    enabled: !!user
  });

  // Yeni refakat kartı oluşturma sayfasına git
  const handleCreateCard = () => {
    navigate("/production-tracking/refakat-card-new");
  };

  // Refakat kartı detayına git
  const handleViewCard = (id: number) => {
    navigate(`/production-tracking/refakat-cards/${id}`);
  };

  // Refakat kartını yazdır (barkod)
  const handlePrintCard = (card: any) => {
    // Yazdırma işlemi
  };

  // Filtre değiştiğinde verileri yenile
  const handleRefresh = () => {
    refetch();
    toast({
      title: "Veriler yenilendi",
      description: "Refakat kartları listesi güncellendi.",
    });
  };

  return (
    <div className="container mx-auto py-4">
      <PageHeader 
        title="Refakat Kartları" 
        description="Üretim süreçlerinde parça takibi için refakat kartları"
        actions={
          <Button onClick={handleCreateCard}>
            <Plus className="mr-2 h-4 w-4" /> Yeni Kart
          </Button>
        }
      />

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filtreler</CardTitle>
          <CardDescription>Arama ve filtreleme seçenekleri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-1 md:col-span-2">
              <Input
                placeholder="Kart No, Sipariş No veya Barkod ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="created">Oluşturuldu</SelectItem>
                  <SelectItem value="in-process">İşlemde</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                  <SelectItem value="rejected">Reddedildi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Departman Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Departmanlar</SelectItem>
                  {departments?.map(dept => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => {
            setSearchQuery("");
            setStatusFilter("all");
            setDepartmentFilter("all");
          }}>
            <Filter className="mr-2 h-4 w-4" /> Filtreleri Temizle
          </Button>
          <Button variant="secondary" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" /> Yenile
          </Button>
        </CardFooter>
      </Card>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="list">Liste Görünümü</TabsTrigger>
          <TabsTrigger value="kanban">Kanban Görünümü</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="w-full">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center p-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : isError ? (
                <div className="flex justify-center items-center p-12 text-red-500">
                  Refakat kartları yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
                </div>
              ) : !cards || cards.length === 0 ? (
                <div className="flex flex-col justify-center items-center p-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-4" />
                  <p>Hiç refakat kartı bulunamadı.</p>
                  <p className="text-sm mt-2">Yeni bir refakat kartı oluşturmak için "Yeni Kart" butonuna tıklayın.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kart No</TableHead>
                      <TableHead>Sipariş No</TableHead>
                      <TableHead>Barkod</TableHead>
                      <TableHead>Departman</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Miktar/Ölçü</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cards.map((card) => (
                      <TableRow key={card.id}>
                        <TableCell className="font-medium">{card.cardNo}</TableCell>
                        <TableCell>{card.orderNumber || "—"}</TableCell>
                        <TableCell>{card.barcode}</TableCell>
                        <TableCell>
                          {departments?.find(d => d.id === card.currentDepartmentId)?.name || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[card.status as keyof typeof statusColors]}>
                            {statusLabels[card.status as keyof typeof statusLabels]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {card.length ? `${card.length} ${card.unit || 'm'}` : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleViewCard(card.id)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <BarcodePrintButton
                              data={card.barcode}
                              title="Barkod Yazdır"
                              description={`Kart: ${card.cardNo} - Sipariş: ${card.orderNumber || '-'}`}
                              additionalInfo={[
                                { label: "Kart No", value: card.cardNo },
                                { label: "Sipariş No", value: card.orderNumber || "-" },
                                { label: "Departman", value: departments?.find(d => d.id === card.currentDepartmentId)?.name || "-" },
                              ]}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="kanban">
          <Card className="p-4">
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {["created", "in-process", "completed", "rejected"].map((status) => (
                  <Card key={status} className="shadow-md">
                    <CardHeader className={`${statusColors[status as keyof typeof statusColors]} text-white rounded-t-lg`}>
                      <CardTitle className="text-center">
                        {statusLabels[status as keyof typeof statusLabels]}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2 max-h-[70vh] overflow-y-auto">
                      {isLoading ? (
                        <div className="flex justify-center items-center p-6">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : cards?.filter(card => card.status === status).map((card) => (
                        <Card key={card.id} className="cursor-pointer hover:bg-muted transition-colors p-3" onClick={() => handleViewCard(card.id)}>
                          <CardTitle className="text-sm flex justify-between items-center">
                            {card.cardNo}
                            <Badge variant="outline" className="text-xs">
                              {departments?.find(d => d.id === card.currentDepartmentId)?.name}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {card.orderNumber || "Sipariş No: —"} <br />
                            {card.length ? `Miktar: ${card.length} ${card.unit || 'm'}` : ""}
                          </CardDescription>
                        </Card>
                      ))}
                      {!isLoading && (!cards || cards.filter(card => card.status === status).length === 0) && (
                        <div className="text-center text-muted-foreground p-4 text-sm">
                          Bu durumda kart bulunmuyor
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}