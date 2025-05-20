import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { BarcodeModal } from '@/components/barcode/barcode-modal';
import { Trash2, Printer, Edit, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Etiket tipi tanımı
interface LabelType {
  id: number;
  name: string;
  code: string;
  description: string | null;
  departmentId: number | null;
  templateData: any;
  createdAt: string;
  updatedAt: string;
}

// Etiket baskı kaydı tanımı
interface LabelPrint {
  id: number;
  labelTypeId: number;
  userId: number;
  userName: string;
  printData: any;
  barcodeValue: string;
  printDate: string;
  departmentId: number | null;
  departmentName: string | null;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
}

export default function LabelManagementPage() {
  const { toast } = useToast();
  const [selectedLabelType, setSelectedLabelType] = useState<LabelType | null>(null);
  const [selectedTab, setSelectedTab] = useState('types');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openBarcodeDialog, setOpenBarcodeDialog] = useState(false);
  const [newLabelType, setNewLabelType] = useState({
    name: '',
    code: '',
    description: '',
    departmentId: '',
  });
  const [editingLabelType, setEditingLabelType] = useState({
    id: 0,
    name: '',
    code: '',
    description: '',
    departmentId: '',
  });

  // Departman listesi sorgusu
  const { data: departments } = useQuery({
    queryKey: ['/api/departments'],
    queryFn: async () => {
      const response = await fetch('/api/departments');
      if (!response.ok) {
        throw new Error('Departmanlar alınamadı');
      }
      return response.json();
    },
  });

  // Etiket tipleri sorgusu
  const {
    data: labelTypes,
    isLoading: isLoadingLabelTypes,
    error: labelTypesError,
  } = useQuery({
    queryKey: ['/api/labels/types'],
    queryFn: async () => {
      const response = await fetch('/api/labels/types');
      if (!response.ok) {
        throw new Error('Etiket tipleri alınamadı');
      }
      return response.json();
    },
  });

  // Etiket yazdırma kayıtları sorgusu
  const {
    data: labelPrints,
    isLoading: isLoadingLabelPrints,
    error: labelPrintsError,
  } = useQuery({
    queryKey: ['/api/labels/prints'],
    queryFn: async () => {
      const response = await fetch('/api/labels/prints');
      if (!response.ok) {
        throw new Error('Etiket yazdırma kayıtları alınamadı');
      }
      return response.json();
    },
  });

  // Etiket tipi oluşturma mutasyonu
  const createLabelTypeMutation = useMutation({
    mutationFn: async (newType: any) => {
      const res = await apiRequest('POST', '/api/labels/types', newType);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Etiket tipi oluşturuldu',
        description: 'Yeni etiket tipi başarıyla oluşturuldu.',
        variant: 'default',
      });
      setOpenCreateDialog(false);
      setNewLabelType({
        name: '',
        code: '',
        description: '',
        departmentId: '',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/labels/types'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Hata',
        description: error.message || 'Etiket tipi oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  // Etiket tipi silme mutasyonu
  const deleteLabelTypeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/labels/types/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Etiket tipi silindi',
        description: 'Etiket tipi başarıyla silindi.',
        variant: 'default',
      });
      setOpenDeleteDialog(false);
      setSelectedLabelType(null);
      queryClient.invalidateQueries({ queryKey: ['/api/labels/types'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Hata',
        description: error.message || 'Etiket tipi silinirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  // Etiket tipi düzenleme mutasyonu
  const editLabelTypeMutation = useMutation({
    mutationFn: async (editedType: any) => {
      const res = await apiRequest('PUT', `/api/labels/types/${editedType.id}`, editedType);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Etiket tipi güncellendi',
        description: 'Etiket tipi başarıyla güncellendi.',
        variant: 'default',
      });
      setOpenEditDialog(false);
      setEditingLabelType({
        id: 0,
        name: '',
        code: '',
        description: '',
        departmentId: '',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/labels/types'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Hata',
        description: error.message || 'Etiket tipi güncellenirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  // Yeni etiket yazdırma mutasyonu
  const printLabelMutation = useMutation({
    mutationFn: async (printData: any) => {
      const res = await apiRequest('POST', '/api/labels/print', printData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Etiket yazdırıldı',
        description: 'Etiket başarıyla yazdırıldı.',
        variant: 'default',
      });
      setOpenBarcodeDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/labels/prints'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Hata',
        description: error.message || 'Etiket yazdırılırken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  // Etiket tipi oluşturma formunu işle
  const handleCreateLabelType = (e: React.FormEvent) => {
    e.preventDefault();
    
    const labelTypeData = {
      ...newLabelType,
      departmentId: newLabelType.departmentId ? parseInt(newLabelType.departmentId) : null,
      templateData: {
        title: newLabelType.name,
        showLogo: true,
        showBarcode: true,
        fields: [],
      },
    };
    
    createLabelTypeMutation.mutate(labelTypeData);
  };
  
  // Etiket tipi düzenleme formunu işle
  const handleEditLabelType = (e: React.FormEvent) => {
    e.preventDefault();
    
    const labelTypeData = {
      ...editingLabelType,
      departmentId: editingLabelType.departmentId ? parseInt(editingLabelType.departmentId) : null,
    };
    
    editLabelTypeMutation.mutate(labelTypeData);
  };

  // Etiket yazdırma işlevi
  const handlePrintLabel = (labelTypeId: number, barcodeValue: string, barcodeType: 'code128' | 'qrcode') => {
    const printData = {
      labelTypeId,
      barcodeValue,
      barcodeType,
      printData: {
        title: selectedLabelType?.name || 'Etiket',
        fields: {
          'Barkod': barcodeValue,
          'Tip': barcodeType,
          'Tarih': new Date().toLocaleDateString('tr-TR'),
        },
      },
      departmentId: selectedLabelType?.departmentId,
    };
    
    printLabelMutation.mutate(printData);
  };

  // Etiket tipleri tablosu için sütunlar
  const labelTypeColumns: ColumnDef<LabelType>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'name',
      header: 'Etiket Adı',
    },
    {
      accessorKey: 'code',
      header: 'Kod',
    },
    {
      accessorKey: 'description',
      header: 'Açıklama',
      cell: ({ row }) => <div>{row.original.description || '-'}</div>,
    },
    {
      accessorKey: 'departmentId',
      header: 'Departman',
      cell: ({ row }) => {
        const departmentId = row.original.departmentId;
        const department = departments?.find((d: any) => d.id === departmentId);
        return <div>{department?.name || '-'}</div>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Oluşturma Tarihi',
      cell: ({ row }) => <div>{formatDate(row.original.createdAt)}</div>,
    },
    {
      id: 'actions',
      header: 'İşlemler',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => {
            setSelectedLabelType(row.original);
            setOpenBarcodeDialog(true);
          }}>
            <Printer className="h-4 w-4 mr-1" />
            Yazdır
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setSelectedLabelType(row.original);
              setEditingLabelType({
                id: row.original.id,
                name: row.original.name,
                code: row.original.code,
                description: row.original.description || '',
                departmentId: row.original.departmentId ? row.original.departmentId.toString() : '',
              });
              setOpenEditDialog(true);
            }}
          >
            <Edit className="h-4 w-4 mr-1" />
            Düzenle
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setSelectedLabelType(row.original);
              setOpenDeleteDialog(true);
            }} 
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Sil
          </Button>
        </div>
      ),
    },
  ];

  // Etiket yazdırma kayıtları tablosu için sütunlar
  const labelPrintColumns: ColumnDef<LabelPrint>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'barcodeValue',
      header: 'Barkod Değeri',
    },
    {
      accessorKey: 'labelTypeId',
      header: 'Etiket Tipi',
      cell: ({ row }) => {
        const labelTypeId = row.original.labelTypeId;
        const labelType = labelTypes?.find((lt: LabelType) => lt.id === labelTypeId);
        return <div>{labelType?.name || `Tip #${labelTypeId}`}</div>;
      },
    },
    {
      accessorKey: 'departmentName',
      header: 'Departman',
      cell: ({ row }) => <div>{row.original.departmentName || '-'}</div>,
    },
    {
      accessorKey: 'userName',
      header: 'Kullanıcı',
    },
    {
      accessorKey: 'printDate',
      header: 'Yazdırma Tarihi',
      cell: ({ row }) => <div>{formatDate(row.original.printDate)}</div>,
    },
    {
      id: 'actions',
      header: 'İşlemler',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-1" />
            Yeniden Yazdır
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-1" />
            Detaylar
          </Button>
        </div>
      ),
    },
  ];

  // İçerik yükleniyor veya hata durumlarını kontrol et
  if (isLoadingLabelTypes || isLoadingLabelPrints) {
    return (
      <AppLayout>
        <div className="container mx-auto p-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-lg">Yükleniyor...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (labelTypesError || labelPrintsError) {
    return (
      <AppLayout>
        <div className="container mx-auto p-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center text-red-500">
              <p className="text-lg">Veri yüklenirken bir hata oluştu.</p>
              <p className="mt-2">{(labelTypesError as Error)?.message || (labelPrintsError as Error)?.message}</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Etiket ve Barkod Yönetimi</CardTitle>
            <CardDescription>
              Tüm departmanlar için etiket tipleri oluşturun, düzenleyin ve yazdırın.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="types">Etiket Tipleri</TabsTrigger>
                <TabsTrigger value="prints">Yazdırma Geçmişi</TabsTrigger>
              </TabsList>
              <TabsContent value="types" className="mt-6">
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setOpenCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Etiket Tipi
                  </Button>
                </div>
                <DataTable columns={labelTypeColumns} data={labelTypes || []} />
              </TabsContent>
              <TabsContent value="prints" className="mt-6">
                <DataTable columns={labelPrintColumns} data={labelPrints || []} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Etiket Tipi Oluşturma Dialog'u */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Etiket Tipi Oluştur</DialogTitle>
            <DialogDescription>
              Yeni bir etiket tipi için gerekli bilgileri girin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateLabelType}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Etiket Adı
                </Label>
                <Input
                  id="name"
                  value={newLabelType.name}
                  onChange={(e) => setNewLabelType({ ...newLabelType, name: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">
                  Kod
                </Label>
                <Input
                  id="code"
                  value={newLabelType.code}
                  onChange={(e) => setNewLabelType({ ...newLabelType, code: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Açıklama
                </Label>
                <Textarea
                  id="description"
                  value={newLabelType.description}
                  onChange={(e) => setNewLabelType({ ...newLabelType, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="departmentId" className="text-right">
                  Departman
                </Label>
                <Select
                  value={newLabelType.departmentId}
                  onValueChange={(value) => setNewLabelType({ ...newLabelType, departmentId: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Departman seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Genel (Departmansız)</SelectItem>
                    {departments?.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenCreateDialog(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={createLabelTypeMutation.isPending}>
                {createLabelTypeMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Etiket Tipi Silme Dialog'u */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Etiket Tipini Sil</DialogTitle>
            <DialogDescription>
              Bu etiket tipini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-sm text-gray-500">
              <strong>{selectedLabelType?.name}</strong> adlı etiket tipi silinecek.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedLabelType && deleteLabelTypeMutation.mutate(selectedLabelType.id)}
              disabled={deleteLabelTypeMutation.isPending}
            >
              {deleteLabelTypeMutation.isPending ? 'Siliniyor...' : 'Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Etiket Tipi Düzenleme Dialog'u */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Etiket Tipini Düzenle</DialogTitle>
            <DialogDescription>
              Etiket tipinin bilgilerini düzenleyin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditLabelType}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Etiket Adı
                </Label>
                <Input
                  id="edit-name"
                  value={editingLabelType.name}
                  onChange={(e) => setEditingLabelType({ ...editingLabelType, name: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-code" className="text-right">
                  Kod
                </Label>
                <Input
                  id="edit-code"
                  value={editingLabelType.code}
                  onChange={(e) => setEditingLabelType({ ...editingLabelType, code: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Açıklama
                </Label>
                <Textarea
                  id="edit-description"
                  value={editingLabelType.description}
                  onChange={(e) => setEditingLabelType({ ...editingLabelType, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-departmentId" className="text-right">
                  Departman
                </Label>
                <Select
                  value={editingLabelType.departmentId}
                  onValueChange={(value) => setEditingLabelType({ ...editingLabelType, departmentId: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Departman seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Genel (Departmansız)</SelectItem>
                    {departments?.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenEditDialog(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={editLabelTypeMutation.isPending}>
                {editLabelTypeMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Etiket Yazdırma Dialog'u */}
      {selectedLabelType && (
        <Dialog open={openBarcodeDialog} onOpenChange={setOpenBarcodeDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Etiket Yazdır</DialogTitle>
              <DialogDescription>
                {selectedLabelType.name} etiketi için barkod oluşturun ve yazdırın.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <BarcodeModal
                title={selectedLabelType.name}
                prefix={selectedLabelType.code}
                onPrint={(barcodeValue, barcodeType) => 
                  handlePrintLabel(selectedLabelType.id, barcodeValue, barcodeType)
                }
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}