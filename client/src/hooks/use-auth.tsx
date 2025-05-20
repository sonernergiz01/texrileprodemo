import { ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { User as SelectUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AuthContext from "@/context/auth-context";

// Auth types
export type LoginData = {
  username: string;
  password: string;
};

export type RegisterData = {
  username: string;
  password: string;
  fullName: string;
  email: string;
  isActive?: boolean;
  departmentId?: number | null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        throw new Error("Giriş yapılamadı");
      }
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Giriş Başarılı",
        description: "Sisteme başarıyla giriş yaptınız.",
      });
      // Yönlendirmeyi react-router/wouter burada yapmamaya dikkat edin
      // Bu, AuthPage içindeki useEffect tarafından yapılacak
    },
    onError: (error: Error) => {
      toast({
        title: "Giriş Başarısız",
        description: error.message || "Kullanıcı adı veya şifre hatalı.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      if (!res.ok) {
        throw new Error("Kayıt oluşturulamadı");
      }
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Kayıt Başarılı",
        description: "Hesabınız başarıyla oluşturuldu.",
      });
      // Yönlendirmeyi react-router/wouter burada yapmamaya dikkat edin
      // Bu, AuthPage içindeki useEffect tarafından yapılacak
    },
    onError: (error: Error) => {
      toast({
        title: "Kayıt Başarısız",
        description: error.message || "Kayıt sırasında bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Çıkış Yapıldı",
        description: "Başarıyla çıkış yaptınız.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Çıkış Başarısız",
        description: error.message || "Çıkış yaparken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  try {
    const context = useContext(AuthContext);
    
    // Context boş ise veya tanımlanmamışsa beyaz ekran yerine varsayılan bir değer döndür
    if (!context) {
      console.error("useAuth hook AuthProvider içinde kullanılmıyor! Varsayılan değerler döndürülüyor.");
      
      // Varsayılan değerleri döndür - beyaz ekranı önle
      return {
        user: null,
        isLoading: false,
        error: new Error("Auth context not available"),
        loginMutation: {
          isPending: false,
          isError: false,
          error: null,
          mutate: () => {
            console.error("Auth context not available, login not possible");
          },
          reset: () => {},
        } as any,
        logoutMutation: {
          isPending: false,
          isError: false,
          error: null,
          mutate: () => {
            console.error("Auth context not available, logout not possible");
          },
          reset: () => {},
        } as any,
        registerMutation: {
          isPending: false,
          isError: false,
          error: null,
          mutate: () => {
            console.error("Auth context not available, registration not possible");
          },
          reset: () => {},
        } as any,
      };
    }
    
    return context;
  } catch (error) {
    console.error("useAuth hook içinde beklenmeyen bir hata oluştu:", error);
    
    // Hata durumunda da varsayılan değerleri döndür - beyaz ekranı önle
    return {
      user: null,
      isLoading: false,
      error,
      loginMutation: { isPending: false, isError: true, error, mutate: () => {}, reset: () => {} } as any,
      logoutMutation: { isPending: false, isError: true, error, mutate: () => {}, reset: () => {} } as any,
      registerMutation: { isPending: false, isError: true, error, mutate: () => {}, reset: () => {} } as any,
    };
  }
}
