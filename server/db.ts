import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import * as planningSchema from "@shared/schema/planning";

// WebSocket yapılandırması
neonConfig.webSocketConstructor = ws;

// Veritabanı bağlantı yönetimi geliştirmeleri
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Veritabanı hatalarını önlemek için bağlantı denemelerini yönet
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000;

// Veritabanı havuzu yapılandırması - performans ve güvenilirlik için optimize edildi
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maksimum bağlantı sayısı (daha düşük değer - daha stabil)
  idleTimeoutMillis: 30000, // Boşta kalma zaman aşımı
  connectionTimeoutMillis: 10000, // Bağlantı kurma zaman aşımı (arttırıldı)
  maxUses: 5000, // Bir bağlantının maksimum kullanılma sayısı (azaltıldı)
};

// Veritabanı havuzunu oluştur
export const pool = new Pool(poolConfig);

// Bağlantı olay dinleyicileri
pool.on('connect', (client) => {
  console.log('Yeni veritabanı bağlantısı oluşturuldu');
});

pool.on('error', (err, client) => {
  console.error('Veritabanı havuzu hatası:', err);
});

// Hata yönetimi için gelişmiş bağlantı işlevi
async function createDbConnection(attempt = 1): Promise<any> {
  try {
    // Tüm şemaları birleştir
    const mergedSchema = { ...schema, ...planningSchema };
    
    // Drizzle ORM örneği
    return drizzle({ 
      client: pool, 
      schema: mergedSchema,
      logger: {
        logQuery: (query, params) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('SQL Query:', query, 'Params:', params);
          }
        }
      }
    });
  } catch (error) {
    if (attempt <= MAX_RETRIES) {
      console.warn(`Veritabanı bağlantısı başarısız (${attempt}/${MAX_RETRIES}), yeniden deneniyor...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return createDbConnection(attempt + 1);
    } else {
      console.error('Maksimum yeniden deneme sayısına ulaşıldı, veritabanı bağlantısı başarısız!');
      throw error;
    }
  }
}

// Drizzle ORM örneği
export const db = drizzle({ 
  client: pool, 
  schema: { ...schema, ...planningSchema },
  logger: {
    logQuery: (query, params) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('SQL Query:', query, 'Params:', params);
      }
    }
  }
});

// Uygulama kapatılırken veritabanı havuzunu kapat
process.on('SIGINT', async () => {
  console.log('Uygulama kapatılıyor, veritabanı havuzu bağlantısı kesiliyor...');
  await pool.end();
  process.exit(0);
});

// Basit bir veritabanı durum kontrolü işlevi
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Veritabanı bağlantı kontrolü başarısız:', error);
    return false;
  }
}
