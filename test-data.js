// Üretim Rotaları ve Refakat Kartları için test verileri oluşturma script'i
const { default: fetch } = require('node-fetch');

// API endpoint'leri
const API_BASE = 'http://localhost:5000/api';
const ROUTE_TEMPLATES_URL = `${API_BASE}/planning/route-templates`;
const ROUTE_TEMPLATE_STEPS_URL = `${API_BASE}/planning/route-template-steps`;
const PRODUCTION_CARDS_URL = `${API_BASE}/planning/production-cards`;

// Örnek veriler
const routeTemplates = [
  {
    name: 'Pamuklu Dokuma Standart Rotası',
    code: 'COTTON-RTM-001',
    description: 'Pamuklu dokuma kumaşlar için standart üretim rotası',
    isActive: true,
    createdBy: 1
  },
  {
    name: 'Polyester Dokuma Standart Rotası',
    code: 'POLY-RTM-001',
    description: 'Polyester dokuma kumaşlar için standart üretim rotası',
    isActive: true,
    createdBy: 1
  }
];

// Ana fonksiyon
async function createTestData() {
  console.log('Test verileri oluşturuluyor...');
  
  try {
    // 1. Üretim Rotaları oluşturma
    console.log('1. Üretim Rotaları oluşturuluyor...');
    const routeTemplateResponses = [];
    
    for (const template of routeTemplates) {
      const response = await fetch(ROUTE_TEMPLATES_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(template)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Rota şablonu oluşturma hatası (${response.status}):`, errorText);
        continue;
      }
      
      const data = await response.json();
      routeTemplateResponses.push(data);
      console.log(`Rota şablonu oluşturuldu: ${data.name} (ID: ${data.id})`);
    }
    
    if (routeTemplateResponses.length === 0) {
      console.error('Hiçbir rota şablonu oluşturulamadı!');
      return;
    }
    
    // 2. Pamuklu dokuma rotası için adımlar oluşturma
    console.log('\n2. Rota adımları oluşturuluyor...');
    const pamukluRotaId = routeTemplateResponses[0].id;
    
    const pamukluRotaAdimlar = [
      {
        routeTemplateId: pamukluRotaId,
        processTypeId: 1, // İplik Hazırlama
        departmentId: 11, // İplik Büküm
        stepOrder: 1,
        estimatedDuration: 24, // 24 saat
        description: 'İplik büküm işlemi',
        requiresQualityCheck: false
      },
      {
        routeTemplateId: pamukluRotaId,
        processTypeId: 2, // Çözgü Hazırlama
        departmentId: 12, // Dokuma
        stepOrder: 2,
        estimatedDuration: 8, // 8 saat
        description: 'Çözgü telleri hazırlama',
        requiresQualityCheck: false
      },
      {
        routeTemplateId: pamukluRotaId,
        processTypeId: 3, // Dokuma
        departmentId: 12, // Dokuma
        stepOrder: 3,
        estimatedDuration: 48, // 48 saat
        description: 'Dokuma işlemi',
        requiresQualityCheck: false
      },
      {
        routeTemplateId: pamukluRotaId,
        processTypeId: 4, // Ham Kontrol
        departmentId: 13, // Ham Kalite
        stepOrder: 4,
        estimatedDuration: 8, // 8 saat
        description: 'Ham kumaş kalite kontrolü',
        requiresQualityCheck: true
      }
    ];
    
    for (const step of pamukluRotaAdimlar) {
      const response = await fetch(ROUTE_TEMPLATE_STEPS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(step)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Rota adımı oluşturma hatası (${response.status}):`, errorText);
        continue;
      }
      
      const data = await response.json();
      console.log(`Rota adımı oluşturuldu: ${data.description} (ID: ${data.id})`);
    }
    
    // 3. Refakat kartı oluşturma
    console.log('\n3. Refakat kartları oluşturuluyor...');
    
    const refakatKarti = {
      cardNo: 'REF-2023-0001',
      productionPlanId: 2, // Mevcut bir üretim planı ID'si
      orderId: 1, // Mevcut bir sipariş ID'si
      fabricTypeId: 1, // Pamuklu dokuma
      width: 140, // 140 cm
      length: 100, // 100 metre
      weight: 150, // 150 kg
      color: 'Beyaz',
      barcode: 'REF-2023-0001-BAR',
      currentDepartmentId: 11, // İplik Büküm departmanı
      status: 'created',
      notes: 'Test refakat kartı'
    };
    
    const response = await fetch(PRODUCTION_CARDS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(refakatKarti)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Refakat kartı oluşturma hatası (${response.status}):`, errorText);
    } else {
      const data = await response.json();
      console.log(`Refakat kartı oluşturuldu: ${data.cardNo} (ID: ${data.id})`);
    }
    
    console.log('\nTest verileri oluşturma işlemi tamamlandı.');
    
  } catch (error) {
    console.error('Test verileri oluşturulurken bir hata oluştu:', error);
  }
}

// Script'i çalıştır
createTestData();