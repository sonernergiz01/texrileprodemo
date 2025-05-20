import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AtSign, Lock, User, Factory } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  fullName: z.string().min(3, "Ad soyad en az 3 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  // useEffect kullanarak yönlendirme yapıyoruz, rendering sırasında state değişiminden kaçınmak için
  useEffect(() => {
    console.log("Auth Page - User state:", user);
    if (user) {
      console.log("User logged in, redirecting to home page");
      setLocation("/");
    }
  }, [user, setLocation]);
  
  // Login veya register işlemi başarılı olduğunda da çalışacak useEffect
  useEffect(() => {
    if (loginMutation.isSuccess || registerMutation.isSuccess) {
      console.log("Login/Register mutation successful, redirecting...");
      // Admin kullanıcısı için bile ana sayfaya yönlendir, kullanıcı yönetimi sayfasına değil
      setLocation("/");
    }
  }, [loginMutation.isSuccess, registerMutation.isSuccess, setLocation]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({
      ...data,
      isActive: true,
      departmentId: null,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Login/Register Form */}
      <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">Tekstil OS</h1>
            <p className="mt-2 text-sm text-gray-600">
              Tekstil Fabrikası Operasyon Yönetim Sistemi
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Giriş Yap</TabsTrigger>
              <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Hesabınıza Giriş Yapın</CardTitle>
                  <CardDescription>
                    Sisteme erişmek için kullanıcı adı ve şifreniz ile giriş yapın.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kullanıcı Adı</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input placeholder="Kullanıcı adınızı girin" {...field} className="pl-10" />
                              </FormControl>
                              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Şifre</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input type="password" placeholder="Şifrenizi girin" {...field} className="pl-10" />
                              </FormControl>
                              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Giriş Yapılıyor..." : "Giriş Yap"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Yeni Hesap Oluşturun</CardTitle>
                  <CardDescription>
                    Sistemi kullanmak için yeni bir hesap oluşturun.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kullanıcı Adı</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input placeholder="Kullanıcı adı oluşturun" {...field} className="pl-10" />
                              </FormControl>
                              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ad Soyad</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input placeholder="Adınız ve soyadınız" {...field} className="pl-10" />
                              </FormControl>
                              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-posta</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input placeholder="E-posta adresiniz" {...field} className="pl-10" />
                              </FormControl>
                              <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Şifre</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input type="password" placeholder="Güçlü bir şifre oluşturun" {...field} className="pl-10" />
                              </FormControl>
                              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Kayıt Yapılıyor..." : "Kayıt Ol"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Hero Section */}
      <div className="hidden md:block md:flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex flex-col justify-center px-12">
        <div className="max-w-md">
          <div className="flex items-center mb-8">
            <Factory size={40} className="mr-4" />
            <h2 className="text-3xl font-bold">Tekstil Fabrikası Operasyon Yönetim Sistemi</h2>
          </div>
          
          <p className="text-lg mb-8">
            Tekstil fabrikası operasyonlarını izlemek, yönetmek ve optimize etmek için kapsamlı bir çözüm. Tüm departmanlar için özel modüller ve rol tabanlı erişim kontrolü ile donatılmıştır.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-medium">Rol Tabanlı Erişim</h3>
                <p className="mt-1">Herkes sadece kendi yetki alanındaki verilere erişebilir.</p>
              </div>
            </div>
            
            <Separator className="bg-white/20" />
            
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-medium">Departmanlara Özel Modüller</h3>
                <p className="mt-1">Her departman için özelleştirilmiş arayüz ve işlevler.</p>
              </div>
            </div>
            
            <Separator className="bg-white/20" />
            
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-medium">Kapsamlı Raporlama</h3>
                <p className="mt-1">Gerçek zamanlı verilerle desteklenen detaylı raporlar.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
