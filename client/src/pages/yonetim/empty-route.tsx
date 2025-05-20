import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/app-layout";
import { Flame, Lightbulb, Construction, FileQuestion, Settings } from "lucide-react";

interface EmptyRouteProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function EmptyRoute({ title, description, icon }: EmptyRouteProps) {
  const [, navigate] = useLocation();

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-4">
        <div className="max-w-lg text-center">
          <div className="flex justify-center mb-6">
            {icon}
          </div>
          
          <h2 className="text-3xl font-bold tracking-tight mb-2">{title}</h2>
          <p className="text-muted-foreground mb-8">
            {description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate("/yonetim/dashboard")} className="bg-blue-600 hover:bg-blue-700">
              Yönetim Paneline Dön
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export function FinancialReportPage() {
  return (
    <EmptyRoute
      title="Finansal Raporlar"
      description="Bu bölüm geliştirilme aşamasındadır. Finansal raporlar, gelir-gider analizleri, kâr-zarar tabloları ve nakit akışı raporları burada yer alacaktır."
      icon={<Flame className="w-16 h-16 text-amber-500" />}
    />
  );
}

export function ProductionReportPage() {
  return (
    <EmptyRoute
      title="Üretim Raporları"
      description="Bu bölüm geliştirilme aşamasındadır. Üretim verimliliği, makine performansı, üretim planlama etkinliği ve kalite analiz raporları burada yer alacaktır."
      icon={<Construction className="w-16 h-16 text-blue-500" />}
    />
  );
}

export function SalesReportPage() {
  return (
    <EmptyRoute
      title="Satış Raporları"
      description="Bu bölüm geliştirilme aşamasındadır. Satış performansı, müşteri analizleri, ürün kategorisi bazlı satışlar ve satış tahminleri burada yer alacaktır."
      icon={<Lightbulb className="w-16 h-16 text-purple-500" />}
    />
  );
}

export function PlanningReportPage() {
  return (
    <EmptyRoute
      title="Planlama Raporları"
      description="Bu bölüm geliştirilme aşamasındadır. Üretim planları performansı, plan-gerçekleşme karşılaştırmaları ve darboğaz analizleri burada yer alacaktır."
      icon={<FileQuestion className="w-16 h-16 text-green-500" />}
    />
  );
}

export function SystemSettingsPage() {
  return (
    <EmptyRoute
      title="Sistem Ayarları"
      description="Bu bölüm geliştirilme aşamasındadır. Sistem konfigürasyonu, bildirim ayarları, yedekleme ve veri yönetimi burada yer alacaktır."
      icon={<Settings className="w-16 h-16 text-gray-500" />}
    />
  );
}