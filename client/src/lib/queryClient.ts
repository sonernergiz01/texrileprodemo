import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Response kontrolü için yardımcı fonksiyon
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    console.log(`API Request: ${method} ${url}`, data);
    
    // Tüm isteklerde kullanılacak ortak headers
    const headers: Record<string, string> = {
      "Accept": "application/json",
    };
    
    // Data varsa Content-Type ekle
    if (data) {
      headers["Content-Type"] = "application/json";
    }
    
    // İsteği yap - kritik hatalara karşı try/catch içine al
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include", // Oturum çerezleri için önemli
      });
  
      // Hata kontrolü ve loglama
      if (!res.ok) {
        console.error(`API Error: ${res.status} ${res.statusText} at ${url}`);
        
        // Response body'sini klonlayarak oku (orjinal response kullanılabilir kalır)
        try {
          // clone() işlemi hata verirse orijinal response'u doğrudan kullanmaya çalış
          const clonedRes = res.clone();
          try {
            const errorText = await clonedRes.text();
            console.error(`Error details: ${errorText}`);
          } catch (readError) {
            console.error('Error details could not be read from cloned response');
          }
        } catch (cloneError) {
          console.error('Response could not be cloned, trying to read directly');
          // Klonlama başarısız olursa, doğrudan yanıtı okumayı dene (sadece log için)
          try {
            const directBody = await res.text();
            console.error(`Direct error body: ${directBody}`);
          } catch (directReadError) {
            console.error('Error details could not be read directly either');
          }
        }
        
        // 401 hatası varsa oturumla ilgili bir problem olabilir
        if (res.status === 401) {
          console.error("Oturum hatası. Yeniden oturum açmanız gerekebilir.");
        }
        
        // Daha açıklayıcı hata mesajı oluştur
        throw new Error(`API Hatası: ${res.status} ${res.statusText || 'Bilinmeyen Hata'} - ${url}`);
      }
      
      return res;
    } catch (fetchError) {
      // Ağ hatası veya fetch() sırasında genel bir hata
      console.error(`Fetch operation failed for ${method} ${url}:`, fetchError);
      
      // CORS, ağ hatası veya diğer fetch arızaları için kullanıcı dostu hata
      if (fetchError instanceof TypeError) {
        throw new Error(`Ağ hatası: API'ye bağlanılamıyor. Lütfen bağlantınızı kontrol edin.`);
      }
      
      throw fetchError; // Diğer hataları olduğu gibi yeniden fırlat
    }
  } catch (error) {
    console.error(`API Request failed: ${method} ${url}`, error);
    
    // Daha açıklayıcı hata mesajı
    if (error instanceof Error) {
      throw error; // Zaten bir Error nesnesi ise, onu doğrudan kullan
    } else {
      // Error olmayan bir değerse, Error nesnesine çevir
      throw new Error(`API isteği başarısız: ${String(error)}`);
    }
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Gelen queryKey kontrolü
      if (!queryKey || !queryKey[0] || typeof queryKey[0] !== 'string') {
        console.error("Geçersiz queryKey:", queryKey);
        return null; // Geçersiz queryKey durumunda çökme olmadan devam et
      }
      
      console.log(`Query Request: GET ${queryKey[0]}`);
      
      // URL güvenlik kontrolü
      let url: string;
      try {
        url = queryKey[0] as string;
        if (!url.startsWith('/')) {
          // İç API yolları / ile başlamalıdır
          console.error("Hatalı API URL formatı:", url);
          url = `/${url}`; // Otomatik düzeltme
        }
      } catch (urlError) {
        console.error("URL işlenirken hata:", urlError);
        return null; // URL hatası durumunda çökme olmadan devam et
      }
      
      // Fetch işlemi sırasında oluşabilecek kritik hataları yakala
      let res: Response;
      try {
        res = await fetch(url, {
          headers: {
            "Accept": "application/json"
          },
          credentials: "include", // Oturum çerezleri için önemli
        });
      } catch (fetchError) {
        console.error(`Fetch hatası (${url}):`, fetchError);
        // Ağ hatası durumunda null döndür, beyaz ekranı önle
        return Array.isArray(queryKey) && queryKey.length > 1 && typeof queryKey[1] === 'object' 
          ? [] // Liste bekleyen sorgular için boş dizi
          : null; // Tekil öğe bekleyen sorgular için null
      }

      // 401 hatası ve politikası
      if (res.status === 401) {
        console.log(`Unauthorized (401) at ${url} - behavior: ${unauthorizedBehavior}`);
        return null; // Tüm 401'lerde null döndür, uygulamanın tekrar oturum açtırmasına izin ver
      }

      // Diğer hata durumları
      if (!res.ok) {
        console.error(`Query Error: ${res.status} ${res.statusText} at ${url}`);
        
        let errorText = '';
        try {
          errorText = await res.text();
          console.error(`Error details: ${errorText}`);
        } catch (textReadError) {
          console.error("Error details could not be read:", textReadError);
        }
        
        // Diğer hata durumlarında da beyaz ekranı önle
        const isListEndpoint = 
          url.includes('list') || 
          url.includes('all') || 
          url.endsWith('s') && !url.endsWith('status') && !url.endsWith('details');
          
        if (res.status >= 400) {
          console.warn(`HTTP ${res.status} error, returning safe value for ${url}`);
          return isListEndpoint ? [] : null;
        }
      }

      // Yanıt işleme ve parse etme
      try {
        // Direkt res.json() kullanarak API yanıtını işle
        try {
          const jsonData = await res.json();
          
          // API bazen hata mesajları içeren nesneler döndürebilir
          if (jsonData && typeof jsonData === 'object' && jsonData.error) {
            console.warn(`API hata mesajı döndürdü: ${jsonData.error}`);
            // Hata durumunda bile güvenli bir değer döndür
            return Array.isArray(jsonData) ? jsonData : null;
          }
          
          return jsonData;
        } catch (jsonError) {
          // JSON parse hatası
          console.error("JSON parse hatası:", jsonError);
          
          // Content-Type kontrolü
          const contentType = res.headers.get('content-type');
          
          // HTML içerik kontrolü
          if (contentType && contentType.includes('text/html')) {
            console.error("API HTML yanıt döndürdü - bu bir Vite yönlendirme sorunu olabilir");
            return null;
          }
          
          // Son çare olarak text yanıtı JSON'a dönüştürmeyi dene
          let text = '';
          try {
            text = await res.text();
            console.warn("Text yanıt:", text.substring(0, 100) + (text.length > 100 ? "..." : ""));
            
            // Boş yanıt kontrolü
            if (!text.trim()) {
              console.warn("API boş yanıt döndürdü");
              return null;
            }
            
            try {
              return JSON.parse(text);
            } catch (jsonParseError) {
              console.error("Text içeriği JSON'a dönüştürülemedi:", jsonParseError);
              return null;
            }
          } catch (textReadError) {
            console.error("Text içeriği okunamadı:", textReadError);
            return null; // Çökme olmadan devam et
          }
        }
      } catch (parseError) {
        console.error("API yanıtı işlenirken kritik hata:", parseError);
        return null; // Çökme olmadan devam et
      }
    } catch (error) {
      console.error(`Query Request failed: GET ${queryKey[0]}`, error);
      // Herhangi bir hata durumunda null döndür, beyaz ekranı önle
      return null;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }), // Yetkilendirme hatalarında null döndür, beyaz ekranı önle
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 dakika sonra stale olsun (önceki: Infinity)
      retry: 1,         // Hata durumunda bir kez yeniden dene (önceki: false)
      retryDelay: 1000, // 1 saniye sonra yeniden dene
    },
    mutations: {
      retry: false,
    },
  },
});
