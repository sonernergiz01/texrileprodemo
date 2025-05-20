import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Loader2, Check, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { Badge } from "@components/ui/badge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface SelectProductionPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanSelected: (plan: any) => void;
}

export function SelectProductionPlanDialog({
  open,
  onOpenChange,
  onPlanSelected,
}: SelectProductionPlanDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  // Üretim planlarını getir
  const { data: plans, isLoading } = useQuery({
    queryKey: ["/api/planning/production-plans"],
    queryFn: undefined, // varsayılan fetcher'ı kullan
    enabled: open, // dialog açıkken sorgula
  });

  // Arama ve filtreleme
  const filteredPlans = plans
    ? plans.filter((plan: any) => {
        if (!searchTerm) return true;
        
        return (
          plan.planNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plan.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plan.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    : [];

  const handleSelectPlan = (plan: any) => {
    setSelectedPlanId(plan.id);
  };

  const handleConfirm = () => {
    if (selectedPlanId && plans) {
      const selectedPlan = plans.find((plan: any) => plan.id === selectedPlanId);
      if (selectedPlan) {
        onPlanSelected(selectedPlan);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Üretim Planı Seçin</DialogTitle>
          <DialogDescription>
            Refakat kartı oluşturmak istediğiniz üretim planını seçin.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Plan No, Açıklama veya Sipariş No ile ara..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Plan No</TableHead>
                  <TableHead>Sipariş No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Planlama Tarihi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Görüntülenecek üretim planı bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlans.map((plan: any) => (
                    <TableRow 
                      key={plan.id} 
                      className={selectedPlanId === plan.id ? "bg-primary/10" : ""}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      <TableCell>
                        {selectedPlanId === plan.id && (
                          <div className="flex justify-center">
                            <Check className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{plan.planNo}</TableCell>
                      <TableCell>{plan.orderNumber}</TableCell>
                      <TableCell>{plan.customerName || "—"}</TableCell>
                      <TableCell>{plan.fabricTypeName || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={plan.status === "completed" ? "success" : "default"}>
                          {plan.status === "draft" && "Taslak"}
                          {plan.status === "planning" && "Planlanıyor"}
                          {plan.status === "in_progress" && "Üretimde"}
                          {plan.status === "completed" && "Tamamlandı"}
                          {plan.status === "canceled" && "İptal Edildi"}
                          {!["draft", "planning", "in_progress", "completed", "canceled"].includes(plan.status) && plan.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {plan.planDate && format(new Date(plan.planDate), "dd MMM yyyy", { locale: tr })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedPlanId}>
            Seç ve Devam Et
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}