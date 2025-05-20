import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, QrCode, ArrowLeft, Check, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/layout/page-header";

export default function BarcodeScanPage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [barcodeValue, setBarcodeValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastScannedCard, setLastScannedCard] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sayfa yüklendiğinde input'a odaklan
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Barkod tarama işlemi
  const barcodeScanMutation = useMutation({
    mutationFn: async (barcode: string) => {
      const res = await apiRequest("POST", "/api/production-tracking/scan-barcode", { barcode });
      return await res.json();
    },
    onSuccess: (data) => {
      setLoading(false);
      setBarcodeValue("");
      setLastScannedCard(data.card);
      
      toast({
        title: "Barkod başarıyla tarandı",
        description: `${data.card.cardNo} numaralı kart işlemi başarılı.`,
      });

      // İlgili veri sorgularını yenile
      queryClient.invalidateQueries({
        queryKey: ["/api/production-tracking/production-cards"],
      });
      
      // Input'a tekrar odaklan
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    onError: (error: any) => {
      setLoading(false);
      toast({
        title: "Hata",
        description: `Barkod tarama sırasında bir hata oluştu: ${error.message || "Bilinmeyen hata"}`,
        variant: "destructive",
      });
      
      // Input'a tekrar odaklan
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
  });

  // Form gönderme işlemi
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeValue.trim()) {
      toast({
        title: "Hata",
        description: "Barkod girilmedi",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    barcodeScanMutation.mutate(barcodeValue);
  };

  // Barkod input değişikliği
  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcodeValue(e.target.value);
  };

  // Auto submit - barkod okuyucu ile kullanım için
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter tuşuna basıldığında otomatik olarak formu gönder
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="container mx-auto py-4">
      <PageHeader 
        title="Barkod Tarama" 
        description="Refakat kartlarını barkod ile tarayın ve işleyin"
        actions={
          <Button variant="outline" onClick={() => navigate("/production-tracking/refakat-cards")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Refakat Kartlarına Dön
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Barkod Tarama Formu */}
        <Card>
          <CardHeader>
            <CardTitle>Barkod Tarama</CardTitle>
            <CardDescription>
              Refakat kartı barkodunu okutun veya manuel olarak girin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Barkod veya QR kod değeri"
                    value={barcodeValue}
                    onChange={handleBarcodeChange}
                    onKeyDown={handleKeyDown}
                    ref={inputRef}
                    disabled={loading}
                    className="text-lg"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading || !barcodeValue.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-4 w-4" />
                      Tara
                    </>
                  )}
                </Button>
              </div>
            </form>
            
            <div className="mt-6">
              <div className="text-sm text-gray-500 mb-2">Nasıl Çalışır?</div>
              <ul className="text-sm space-y-1 list-disc pl-5">
                <li>Barkod okuyucu ile refakat kartı üzerindeki barkodu veya QR kodu okutun</li>
                <li>Barkod okuyucu yoksa değeri elle girin ve Enter tuşuna basın veya "Tara" düğmesine tıklayın</li>
                <li>Her tarama ile kart durumu güncellenerek yeni bir üretim adımına geçer</li>
                <li>Refakat kartları, üretim sürecini takip etmek için kullanılır</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold">Not:</span> Bu sayfa fiziksel barkod okuyucu ile kullanım için optimize edilmiştir.
            </div>
          </CardFooter>
        </Card>

        {/* Son Taranan Kart Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle>Son Taranan Kart</CardTitle>
            <CardDescription>
              En son taranan refakat kartının detayları
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lastScannedCard ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 p-3 bg-green-50 text-green-700 rounded-md">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Kart başarıyla tarandı</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-500">Kart No</div>
                    <div className="font-medium">{lastScannedCard.cardNo}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-500">Durum</div>
                    <div className="font-medium">{lastScannedCard.status || "İşlemde"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-500">Üretim Planı</div>
                    <div className="font-medium">{lastScannedCard.productionPlanId}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-500">Departman</div>
                    <div className="font-medium">{lastScannedCard.currentDepartmentId}</div>
                  </div>
                  {lastScannedCard.color && (
                    <div>
                      <div className="text-sm font-semibold text-gray-500">Renk</div>
                      <div className="font-medium">{lastScannedCard.color}</div>
                    </div>
                  )}
                  {lastScannedCard.length && (
                    <div>
                      <div className="text-sm font-semibold text-gray-500">Uzunluk/Miktar</div>
                      <div className="font-medium">{lastScannedCard.length}</div>
                    </div>
                  )}
                  {lastScannedCard.notes && (
                    <div className="col-span-2">
                      <div className="text-sm font-semibold text-gray-500">Notlar</div>
                      <div className="font-medium">{lastScannedCard.notes}</div>
                    </div>
                  )}
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/production-tracking/refakat-cards/${lastScannedCard.id}`)}
                >
                  Kart Detaylarını Gör
                </Button>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center p-4">
                <AlertTriangle className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-gray-500">Henüz kart taraması yapılmadı</p>
                <p className="text-sm text-gray-400 mt-2">Bir barkod taradığınızda, sonuçlar burada görüntülenecektir</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}