import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { PageContainer } from "@/components/layout/page-container";
import { LoadingSpinner } from '@/components/loading-spinner';

interface SimpleUser {
  id: number;
  username: string;
  fullName: string;
  departmentId: number;
}

export default function NotificationTestPage() {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [notificationType, setNotificationType] = useState<string>("info");

  // Kullanıcıları getir
  const { data: users, isLoading, error } = useQuery<SimpleUser[]>({
    queryKey: ['/api/test-notifications/active-users'],
  });

  // Tekil bildirim gönderme mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (data: { userId: string; title: string; content: string; type: string }) => {
      const res = await apiRequest('POST', '/api/test-notifications/send', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bildirim Gönderildi",
        description: "Bildirim başarıyla gönderildi.",
      });
      // Form alanlarını temizle
      setTitle("");
      setContent("");
    },
    onError: (error: Error) => {
      toast({
        title: "Bildirim Gönderilemedi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toplu bildirim gönderme mutation
  const sendAllNotificationMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; type: string }) => {
      const res = await apiRequest('POST', '/api/test-notifications/send-all', data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Toplu Bildirim Gönderildi",
        description: `${data.results.length} kullanıcıya bildirim gönderildi.`,
      });
      // Form alanlarını temizle
      setTitle("");
      setContent("");
    },
    onError: (error: Error) => {
      toast({
        title: "Toplu Bildirim Gönderilemedi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bildirim gönder
  const handleSendNotification = () => {
    if (!selectedUserId) {
      toast({
        title: "Kullanıcı Seçilmedi",
        description: "Lütfen bir kullanıcı seçin.",
        variant: "destructive",
      });
      return;
    }

    if (!title || !content) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen başlık ve içerik alanlarını doldurun.",
        variant: "destructive",
      });
      return;
    }

    sendNotificationMutation.mutate({
      userId: selectedUserId,
      title,
      content,
      type: notificationType,
    });
  };

  // Tüm kullanıcılara bildirim gönder
  const handleSendAllNotification = () => {
    if (!title || !content) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen başlık ve içerik alanlarını doldurun.",
        variant: "destructive",
      });
      return;
    }

    sendAllNotificationMutation.mutate({
      title,
      content,
      type: notificationType,
    });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-full">
          <LoadingSpinner size="lg" centered />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold text-red-600">Hata!</h1>
          <p className="text-gray-600">{(error as Error).message}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Bildirim Test Paneli"
      subtitle="Bildirim gönderme ve test işlemleri için kontrol paneli"
      breadcrumbs={[
        { label: "Ana Sayfa", href: "/" },
        { label: "Yönetim", href: "/admin" },
        { label: "Bildirim Test", href: "/admin/notification-test" },
      ]}
    >
      <div className="container mx-auto py-4">
        <Card>
          <CardHeader>
            <CardTitle>Bildirim Test Aracı</CardTitle>
            <CardDescription>
              Sistem üzerinde bildirim göndermeyi test etmek için bu paneli kullanabilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Alıcı Kullanıcı</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bir kullanıcı seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.fullName} ({user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Bildirim Tipi</label>
                <Select value={notificationType} onValueChange={setNotificationType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bildirim tipini seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Bilgilendirme</SelectItem>
                    <SelectItem value="alert">Uyarı</SelectItem>
                    <SelectItem value="maintenance">Bakım</SelectItem>
                    <SelectItem value="system">Sistem</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Bildirim Başlığı</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Bildirim başlığını girin"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Bildirim İçeriği</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Bildirim içeriğini girin"
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              onClick={handleSendNotification} 
              disabled={sendNotificationMutation.isPending}
            >
              {sendNotificationMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Gönderiliyor...
                </>
              ) : "Seçili Kullanıcıya Gönder"}
            </Button>

            <Button 
              onClick={handleSendAllNotification} 
              variant="outline"
              disabled={sendAllNotificationMutation.isPending}
            >
              {sendAllNotificationMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Gönderiliyor...
                </>
              ) : "Tüm Kullanıcılara Gönder"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PageContainer>
  );
}