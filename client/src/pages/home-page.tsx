import { useAuth } from "@/hooks/use-auth";
import { PageContainer } from "@/components/layout/page-container";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function HomePage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  // Fetch user's department if it exists
  const { data: department } = useQuery({
    queryKey: ["/api/admin/departments"],
    enabled: !!user && !!user.departmentId,
    select: (departments) => departments.find(d => d.id === user?.departmentId)
  });

  // Otomatik yönlendirmeyi kaldırdık. Kullanıcı artık girişten sonra ana sayfaya yönlendirilecek
  // useEffect(() => {
  //   if (department) {
  //     if (department.code === "SALES") {
  //       navigate("/sales/orders");
  //     } else if (department.code === "ADMIN") {
  //       navigate("/admin/users");
  //     }
  //     // Add other department redirects as needed
  //   }
  // }, [department, navigate]);

  return (
    <PageContainer
      title="Ana Sayfa"
      subtitle="Tekstil Fabrikası Operasyon Yönetim Sistemi"
      breadcrumbs={[{ label: "Ana Sayfa", href: "/" }]}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Hoş Geldiniz, {user?.fullName}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Tekstil Fabrikası Operasyon Yönetim Sistemi'ne hoş geldiniz. Sol menüden departmanınıza ait modüllere erişebilirsiniz.
            </p>
            
            {department ? (
              <div className="mt-4">
                <p className="text-sm font-medium">Departmanınız:</p>
                <div className="flex items-center mt-1">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: department.color }}
                  ></div>
                  <span>{department.name}</span>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-amber-600">
                  Henüz bir departmana atanmamışsınız. Lütfen sistem yöneticisine başvurun.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {department?.code === "ADMIN" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Yönetim Paneli</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Sistem yapılandırması, kullanıcı yönetimi ve diğer yönetici işlemleri için yönetim paneline erişebilirsiniz.
              </p>
              <Button onClick={() => navigate("/admin/users")}>
                Yönetim Paneline Git
              </Button>
            </CardContent>
          </Card>
        )}

        {department?.code === "SALES" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Sipariş Girişi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Yeni sipariş oluşturmak veya mevcut siparişleri görüntülemek için sipariş girişi sayfasına erişebilirsiniz.
              </p>
              <Button onClick={() => navigate("/sales/orders")}>
                Sipariş Girişine Git
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Yardım</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Sistem kullanımı ile ilgili sorularınız için yardım belgelerine göz atabilir veya destek ekibimize ulaşabilirsiniz.
            </p>
            <Button variant="outline">
              Yardım Belgelerine Göz At
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
