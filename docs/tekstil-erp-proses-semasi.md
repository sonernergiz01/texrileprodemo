# Tekstil ERP Sistemi Proses Şema Mantığı

## Genel Bakış

Bu doküman, geliştirilen Tekstil ERP sistemindeki proses akışlarını ve departmanlar arası veri akışını açıklamaktadır. Sistem, tekstil üretim süreçlerini uçtan uca takip etmeyi, departmanlar arası koordinasyonu güçlendirmeyi ve siparişten sevkiyata kadar tüm adımların izlenebilirliğini sağlamayı amaçlamaktadır.

## Sistem Mimarisi

Tekstil ERP sistemi aşağıdaki temel bileşenlerden oluşmaktadır:

1. **Rol tabanlı erişim kontrolü**: Kullanıcılar departmanlara ve rollere göre yetkilendirilir. Her kullanıcı yalnızca kendi departmanına ait işlemleri görebilir ve gerçekleştirebilir.
2. **Departmanlar arası veri akışı**: Tüm departmanlar birbiriyle entegre çalışır ve veriler departmanlar arasında tutarlı bir şekilde aktarılır.
3. **Üretim rotası sistemi**: Siparişlerin hangi aşamalardan geçeceğini tanımlayan esnek ve özelleştirilebilir bir üretim rota sistemi.
4. **Barkod tabanlı izlenebilirlik**: Ürünlerin üretim sürecinde barkodlar aracılığıyla takibi.
5. **Merkezi veri yönetimi**: Tüm departmanların kullandığı ortak veri yapıları (kumaş bilgileri, iplik bilgileri, hammadde bilgileri, müşteri bilgileri vb.)

## Departmanlar ve Ana Süreçler

### 1. Satış ve Pazarlama (CRM)

- **Müşteri Yönetimi**: Müşteri bilgileri, geçmiş siparişler ve müşteri etkileşimleri
- **Sipariş Yönetimi**: Yeni siparişlerin oluşturulması ve takibi
- **Fiyatlandırma ve Teklif Yönetimi**: Müşterilere sunulan tekliflerin oluşturulması ve takibi
- **Fırsat Yönetimi**: Potansiyel satış fırsatlarının yönetimi

**Veri Akışı**:
- Oluşturulan siparişler → Planlama Bölümü
- Müşteri bilgileri → Tüm departmanlar

### 2. Planlama Bölümü

- **Sipariş Planlama**: Gelen siparişlerin üretim planlaması
- **Üretim Rotası Yönetimi**: Farklı ürün tipleri için üretim rotalarının tanımlanması
- **Kaynak Tahsisi**: Makineler ve üretim hatlarının planlanması
- **Termin Tarihi Yönetimi**: Ürünlerin üretim sürelerinin ve termin tarihlerinin belirlenmesi

**Veri Akışı**:
- Üretim planları → Dokuma, İplik Büküm, vb. üretim bölümleri
- Termin tarihleri → Satış ve Pazarlama

### 3. Dokuma Bölümü

- **İş Emirleri**: Planlamadan gelen iş emirlerinin takibi
- **Çözgü Hazırlama**: Dokuma öncesi çözgü ipliklerinin hazırlanması
- **Taharlama**: Çözgü ipliklerinin dokuma tezgahına yerleştirilmesi
- **Dokuma Makine Yönetimi**: Dokuma makinelerinin durumlarının takibi

**Veri Akışı**:
- Üretilen ham kumaşlar → Ham Kalite Kontrol Bölümü

### 4. Ürün Geliştirme (ÜRGE) Bölümü

- **Kumaş Tasarımı**: Yeni kumaş tiplerinin tasarımı
- **Atkı ve Çözgü Planlaması**: Kumaşın yapısını oluşturan atkı ve çözgü planlaması
- **Numune Üretimi**: Yeni ürünler için numune üretimi koordinasyonu

**Veri Akışı**:
- Kumaş bilgileri → Admin (ana veri yönetimi)
- Numune talepleri → Numune Bölümü

### 5. Ham Kalite Kontrol Bölümü

- **Ham Kumaş Muayenesi**: Dokuma sonrası kumaşların ilk kalite kontrolü
- **Hata Kaydı**: Tespit edilen hataların kaydı ve raporlanması
- **Kumaş Sınıflandırma**: Kalite seviyesine göre kumaşların sınıflandırılması

**Veri Akışı**:
- Kalite kontrol sonuçları → Bir sonraki işlem bölümü (Boyahane, Terbiye, vb.)

### 6. İplik Büküm Bölümü

- **İplik Hazırlama**: İplik büküm işlemi için hazırlık
- **Büküm İşlemi**: İpliklerin büküm işlemi
- **Kalite Kontrol**: Büküm sonrası iplik kalite kontrolü

**Veri Akışı**:
- İşlenmiş iplikler → İplik Depo veya Dokuma Bölümü

### 7. Numune Bölümü

- **Numune Talepleri**: Müşterilerden veya ÜRGE bölümünden gelen numune taleplerinin takibi
- **Numune Üretimi**: Küçük ölçekli numune üretiminin koordinasyonu
- **Numune Takibi**: Üretilen numunelerin müşteriye gönderilmesi ve takibi

**Veri Akışı**:
- Numune onayları → Satış ve Pazarlama
- Numune bilgileri → Laboratuvar Bölümü

### 8. Laboratuvar Bölümü

- **İplik Testleri**: İpliklerin fiziksel ve kimyasal testleri
- **Kumaş Testleri**: Kumaşların çeşitli özelliklerinin (mukavemet, renk haslığı, vb.) testleri
- **Test Raporları**: Test sonuçlarının raporlanması

**Veri Akışı**:
- Test sonuçları → İlgili departmanlar (Kalite Kontrol, ÜRGE, vb.)

### 9. Kartela Bölümü

- **Kumaş Kartelaları**: Müşterilere sunulacak kumaş örneklerinin hazırlanması
- **Renk Kartelaları**: Renk seçeneklerinin kartelalarının hazırlanması
- **Kartela Takibi**: Müşterilere gönderilen kartelaların takibi

**Veri Akışı**:
- Kartela bilgileri → Satış ve Pazarlama

### 10. Kalite Kontrol Bölümü

- **Final Kalite Kontrolü**: Tamamlanan ürünlerin son kalite kontrolü
- **Hata Yönetimi**: Kalite sorunlarının kaydı ve çözümü
- **Kalite Raporları**: Dönemsel kalite raporlarının hazırlanması

**Veri Akışı**:
- Kalite onayları → Sevkiyat/Depo Bölümü
- Kalite sorunları → İlgili üretim bölümü

### 11. İplik Depo Bölümü

- **İplik Envanteri**: Mevcut iplik stoklarının takibi
- **İplik Hareketleri**: İplik giriş-çıkışlarının kaydı
- **Stok Yönetimi**: Minimum stok seviyelerinin takibi ve sipariş planlaması

**Veri Akışı**:
- Stok bilgileri → Planlama ve Üretim bölümleri

## Üretim Rotası Sistemi

Üretim rotası sistemi, tekstil üretiminin çeşitli aşamalarını tanımlayan temel bir yapıdır. Bu sistem aşağıdaki bileşenlerden oluşur:

### 1. Proses Tipleri

Her üretim adımı bir proses tipi ile tanımlanır. Örneğin:
- Çözgü Hazırlama
- Taharlama
- Dokuma
- Ham Kalite Kontrol
- Final Kalite Kontrol

Her proses tipi aşağıdaki özelliklere sahiptir:
- **Kod**: Benzersiz tanımlayıcı
- **Ad**: Proses adı
- **Departman**: İlgili departman
- **Süre**: Tahmini tamamlanma süresi
- **Sıra**: Süreçteki sırası
- **Renk ve İkon**: Görsel tanımlayıcılar

### 2. Rota Şablonları

Rota şablonları, belirli ürün tipleri için standart üretim yollarını tanımlar. Bir rota şablonu, proses tiplerinin belirli bir sıra ve yapıda düzenlenmiş halidir.

Örnek bir rota şablonu:
1. Çözgü Hazırlama (Dokuma Dept.)
2. Taharlama (Dokuma Dept.)
3. Dokuma (Dokuma Dept.)
4. Ham Kalite Kontrol (Kalite Dept.)
5. Final Kalite Kontrol (Kalite Dept.)

### 3. Üretim Planları

Bir sipariş onaylandığında, uygun bir rota şablonu seçilerek üretim planı oluşturulur. Üretim planı, şu bilgileri içerir:
- Bağlı sipariş
- Başlangıç ve bitiş tarihi
- Atanan personel
- Notlar

### 4. Üretim Adımları

Üretim planına bir rota şablonu uygulandığında, her bir proses tipi için üretim adımları oluşturulur. Bu adımlar şunları içerir:
- İlgili proses tipi
- Planlanan başlangıç ve bitiş tarihi
- Durum (beklemede, devam ediyor, tamamlandı, vb.)
- Atanan makine
- Notlar

## Veri İzlenebilirliği

Sistemdeki tüm veriler birbiriyle ilişkilidir, böylece uçtan uca izlenebilirlik sağlanır:

1. Müşteri → Sipariş → Üretim Planı → Üretim Adımları
2. Hammadde → İplik → Kumaş → Nihai Ürün
3. Kalite Sorunları → İlgili Üretim Adımı → Düzeltici Faaliyetler

Bu izlenebilirlik sayesinde:
- Bir siparişin hangi aşamada olduğu
- Bir kalite sorununun hangi üretim adımından kaynaklandığı
- Belirli bir makinenin üretim performansı
- Bir müşterinin sipariş geçmişi ve ürün kalitesi

gibi bilgilere kolayca erişilebilir.

## Barkod Sistemi

Sistemdeki fiziksel öğeler (iplik bobinleri, kumaş topları, vb.) barkodlarla takip edilir. Barkod sistemi şu şekilde çalışır:

1. Her fiziksel öğe için benzersiz bir barkod oluşturulur
2. Barkodlar, öğenin üretim aşamalarında taranarak izlenir
3. Her tarama, veritabanında bir hareket kaydı oluşturur
4. Bu sayede her öğenin tam geçmişi kayıt altında tutulur

## Raporlama Sistemi

ERP sistemi, çeşitli departmanların ihtiyaçlarına yönelik raporlar sunar:

1. **Yönetim Raporları**: Genel performans, sipariş durumları, vb.
2. **Üretim Raporları**: Üretim verimliliği, makine kullanımı, vb.
3. **Kalite Raporları**: Kalite sorunları, red oranları, vb.
4. **Satış Raporları**: Satış performansı, müşteri bazlı analizler, vb.
5. **Stok Raporları**: Stok durumu, kritik stok seviyeleri, vb.

## Sonuç

Tekstil ERP sistemi, tekstil üretiminin tüm aşamalarını kapsamlı bir şekilde entegre ederek:
- Departmanlar arası iletişimi ve veri akışını güçlendirir
- Üretim süreçlerinin verimli bir şekilde planlanmasını ve takibini sağlar
- Kalite sorunlarının hızlı tespitini ve çözümünü kolaylaştırır
- Müşteri memnuniyetini artıracak şekilde sipariş takibini iyileştirir
- Tüm süreçlerde tam izlenebilirlik sağlar

Bu sistem, tekstil üretiminde verimliliği, kaliteyi ve müşteri memnuniyetini artırmak için tasarlanmıştır.