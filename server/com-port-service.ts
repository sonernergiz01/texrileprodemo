/**
 * COM-Port İletişim Servisi
 * 
 * Bu servis, seri portlar üzerinden bağlanan ölçüm cihazlarıyla iletişim kurmak için kullanılır.
 * Özellikle kalite kontrol sürecinde metre ve tartı cihazlarından veri almak amacıyla kullanılır.
 */

import { EventEmitter } from 'events';
import { SerialPort, SerialPortOpenOptions } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

// Bildirim fonksiyonu tipi (sendNotificationToUser fonksiyonu için)
export type NotificationSender = (userId: number, notification: {
  title: string;
  content: string;
  type: string;
  entityId?: number | null;
  entityType?: string | null;
}) => Promise<any>;

/**
 * COM Port Servisi
 * Seri portlarla iletişim için temel sınıf
 */
export class ComPortService extends EventEmitter {
  private ports: Map<string, SerialPort> = new Map();
  private parsers: Map<string, ReadlineParser> = new Map();
  private connected: Map<string, boolean> = new Map();
  private logger: (message: string) => void;

  constructor(logger: (message: string) => void = console.log) {
    super();
    this.logger = logger;
  }

  /**
   * Kullanılabilir seri portları listeler
   */
  async listPorts(): Promise<{ path: string, manufacturer?: string, pnpId?: string, vendorId?: string, productId?: string }[]> {
    try {
      const ports = await SerialPort.list();
      this.logger(`Bulunan portlar: ${JSON.stringify(ports)}`);
      return ports;
    } catch (error) {
      this.logger(`Portlar listelenirken hata oluştu: ${error}`);
      return [];
    }
  }

  /**
   * Belirtilen COM portuna bağlanır
   * @param portName COM port adı (örn. COM1, COM2)
   * @param baudRate Baud rate (varsayılan: 9600)
   * @param dataBits Veri bitleri (varsayılan: 8)
   * @param stopBits Stop bitleri (varsayılan: 1)
   * @param parity Parite kontrolü (varsayılan: 'none')
   * @returns Bağlantı başarılı ise true, değilse false
   */
  async connect(
    portName: string,
    baudRate: number = 9600,
    dataBits: number = 8,
    stopBits: number = 1,
    parity: 'none' | 'even' | 'odd' | 'mark' | 'space' = 'none'
  ): Promise<boolean> {
    if (this.isConnected(portName)) {
      this.logger(`${portName} zaten bağlı`);
      return true;
    }

    try {
      const options: SerialPortOpenOptions<any> = {
        path: portName,
        baudRate,
        dataBits,
        stopBits,
        parity,
        autoOpen: false
      };

      const port = new SerialPort(options);
      const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

      // Olayları dinle
      parser.on('data', (data: string) => {
        this.logger(`${portName} üzerinden veri alındı: ${data}`);
        this.emit('data', portName, data);
      });

      port.on('error', (err) => {
        this.logger(`${portName} üzerinde hata: ${err.message}`);
        this.connected.set(portName, false);
        this.emit('error', portName, err);
      });

      port.on('close', () => {
        this.logger(`${portName} üzerindeki bağlantı kapandı`);
        this.connected.set(portName, false);
        this.emit('close', portName);
      });

      // Portu aç
      return new Promise<boolean>((resolve) => {
        port.open((err) => {
          if (err) {
            this.logger(`${portName} açılırken hata: ${err.message}`);
            resolve(false);
            return;
          }

          this.logger(`${portName} başarıyla açıldı`);
          this.ports.set(portName, port);
          this.parsers.set(portName, parser);
          this.connected.set(portName, true);
          this.emit('connected', portName);
          resolve(true);
        });
      });
    } catch (error) {
      this.logger(`${portName} bağlantısı sırasında hata: ${error}`);
      return false;
    }
  }

  /**
   * Belirtilen COM portunu kapatır
   * @param portName Kapatılacak port adı
   * @returns İşlem başarılı ise true, değilse false
   */
  async disconnect(portName: string): Promise<boolean> {
    if (!this.isConnected(portName)) {
      this.logger(`${portName} zaten bağlı değil`);
      return true;
    }

    const port = this.ports.get(portName);
    if (!port) {
      this.logger(`${portName} bulunamadı`);
      return false;
    }

    return new Promise<boolean>((resolve) => {
      port.close((err) => {
        if (err) {
          this.logger(`${portName} kapatılırken hata: ${err.message}`);
          resolve(false);
          return;
        }

        this.logger(`${portName} başarıyla kapatıldı`);
        this.ports.delete(portName);
        this.parsers.delete(portName);
        this.connected.set(portName, false);
        this.emit('disconnected', portName);
        resolve(true);
      });
    });
  }

  /**
   * Tüm açık COM portlarını kapatır
   */
  async disconnectAll(): Promise<void> {
    const promises: Promise<boolean>[] = [];
    
    for (const portName of this.ports.keys()) {
      promises.push(this.disconnect(portName));
    }

    await Promise.all(promises);
    this.logger('Tüm portlar kapatıldı');
  }

  /**
   * Belirtilen porta veri gönderir
   * @param portName Veri gönderilecek port adı 
   * @param data Gönderilecek veri
   * @returns İşlem başarılı ise true, değilse false
   */
  async write(portName: string, data: string): Promise<boolean> {
    if (!this.isConnected(portName)) {
      this.logger(`${portName} bağlı değil, veri gönderilemiyor`);
      return false;
    }

    const port = this.ports.get(portName);
    if (!port) {
      this.logger(`${portName} bulunamadı`);
      return false;
    }

    return new Promise<boolean>((resolve) => {
      port.write(data, (err) => {
        if (err) {
          this.logger(`${portName} üzerine yazılırken hata: ${err.message}`);
          resolve(false);
          return;
        }

        port.drain((err) => {
          if (err) {
            this.logger(`${portName} drain sırasında hata: ${err.message}`);
            resolve(false);
            return;
          }

          this.logger(`${portName} üzerine veri başarıyla yazıldı: ${data}`);
          resolve(true);
        });
      });
    });
  }

  /**
   * Port bağlantı durumunu kontrol eder
   * @param portName Kontrol edilecek port adı
   * @returns Bağlı ise true, değilse false
   */
  isConnected(portName: string): boolean {
    return this.connected.get(portName) === true;
  }

  /**
   * Tüm bağlı portların durumunu getirir
   * @returns Bağlı portların durumu
   */
  getStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    
    for (const [portName, connected] of this.connected.entries()) {
      status[portName] = connected;
    }
    
    return status;
  }
}

/**
 * Ölçüm Cihazları Servisi
 * Metre ve tartı cihazlarından veri okumak için özelleştirilmiş servis
 */
export class MeasurementDeviceService {
  private comPortService: ComPortService;
  private lastWeightValue: string = '0.0';
  private lastMeterValue: string = '0.0';
  private weightPort: string | null = null;
  private meterPort: string | null = null;
  private weightRegex: RegExp;
  private meterRegex: RegExp;
  private deviceListeners: Map<string, (value: string) => void> = new Map();
  private sendNotification: NotificationSender | null = null;
  
  // Bildirim gönderme durumu (cihaz bağlantı problemlerinde aşırı bildirim göndermemek için)
  private lastWeightConnectionStatus: boolean = false;
  private lastMeterConnectionStatus: boolean = false;

  constructor(
    comPortService: ComPortService, 
    weightRegex: RegExp = /(\d+\.\d+)/, 
    meterRegex: RegExp = /(\d+\.\d+)/,
    notificationSender: NotificationSender | null = null
  ) {
    this.comPortService = comPortService;
    this.weightRegex = weightRegex;
    this.meterRegex = meterRegex;
    this.sendNotification = notificationSender;

    // COM port servisinden gelen verileri dinle
    this.comPortService.on('data', (port: string, data: string) => {
      this.processData(port, data);
    });

    // Bağlantı kesintilerini dinle
    this.comPortService.on('close', (port: string) => {
      if (port === this.weightPort) {
        this.weightPort = null;
      }
      if (port === this.meterPort) {
        this.meterPort = null;
      }
    });
  }

  /**
   * Tartı cihazına bağlanır
   * @param portName Tartı cihazının bağlı olduğu port adı
   * @returns Bağlantı başarılı ise true, değilse false
   */
  async connectWeightDevice(portName: string): Promise<boolean> {
    // Eğer önceden başka bir port tartı cihazı olarak atanmış ise, onu kaldır
    if (this.weightPort && this.weightPort !== portName) {
      // Cihazın bağlantısını kesme (portu kapatma)
      await this.comPortService.disconnect(this.weightPort);
      this.weightPort = null;
    }

    // Yeni portu tartı cihazı olarak ata
    this.weightPort = portName;
    return true;
  }

  /**
   * Metre cihazına bağlanır
   * @param portName Metre cihazının bağlı olduğu port adı
   * @returns Bağlantı başarılı ise true, değilse false
   */
  async connectMeterDevice(portName: string): Promise<boolean> {
    // Eğer önceden başka bir port metre cihazı olarak atanmış ise, onu kaldır
    if (this.meterPort && this.meterPort !== portName) {
      // Cihazın bağlantısını kesme (portu kapatma)
      await this.comPortService.disconnect(this.meterPort);
      this.meterPort = null;
    }

    // Yeni portu metre cihazı olarak ata
    this.meterPort = portName;
    return true;
  }

  /**
   * Belirtilen cihaz tipine veri değişikliği dinleyicisi ekler
   * @param deviceType Cihaz tipi ('weight' veya 'meter')
   * @param listener Veri değiştiğinde çağrılacak fonksiyon
   */
  addListener(deviceType: 'weight' | 'meter', listener: (value: string) => void): void {
    this.deviceListeners.set(deviceType, listener);
  }

  /**
   * Belirtilen cihazın dinleyicisini kaldırır
   * @param deviceType Cihaz tipi ('weight' veya 'meter')
   */
  removeListener(deviceType: 'weight' | 'meter'): void {
    this.deviceListeners.delete(deviceType);
  }

  /**
   * COM portlarından gelen verileri işler
   * @param port Veri gelen port adı
   * @param data Gelen veri
   */
  private processData(port: string, data: string): void {
    // Tartı cihazından gelen veriyi işle
    if (port === this.weightPort) {
      const match = this.weightRegex.exec(data);
      if (match && match[1]) {
        this.lastWeightValue = match[1];
        
        // Dinleyicileri bilgilendir
        const listener = this.deviceListeners.get('weight');
        if (listener) {
          listener(this.lastWeightValue);
        }
      }
    }
    
    // Metre cihazından gelen veriyi işle
    if (port === this.meterPort) {
      const match = this.meterRegex.exec(data);
      if (match && match[1]) {
        this.lastMeterValue = match[1];
        
        // Dinleyicileri bilgilendir
        const listener = this.deviceListeners.get('meter');
        if (listener) {
          listener(this.lastMeterValue);
        }
      }
    }
  }

  /**
   * Son tartı değerini getirir
   * @returns Son okunan tartı değeri
   */
  getLastWeightValue(): string {
    return this.lastWeightValue;
  }

  /**
   * Son metre değerini getirir
   * @returns Son okunan metre değeri
   */
  getLastMeterValue(): string {
    return this.lastMeterValue;
  }

  /**
   * Bildirim gönderme fonksiyonunu ayarlar
   * @param notificationSender Bildirim gönderme fonksiyonu
   */
  setNotificationSender(notificationSender: NotificationSender): void {
    this.sendNotification = notificationSender;
  }
  
  /**
   * Cihaz bağlantı durumu değiştinde bildirim gönderir
   * @param deviceType Cihaz tipi ('weight' veya 'meter')
   * @param connected Bağlantı durumu
   * @param userId Bildirim gönderilecek kullanıcı ID'si
   */
  private async sendConnectionStatusNotification(deviceType: 'weight' | 'meter', connected: boolean, userId: number): Promise<void> {
    if (!this.sendNotification) return;
    
    try {
      const deviceName = deviceType === 'weight' ? 'Tartı Cihazı' : 'Metre Cihazı';
      const status = connected ? 'bağlandı' : 'bağlantısı kesildi';
      
      await this.sendNotification(userId, {
        title: `${deviceName} Bağlantı Durumu Değişti`,
        content: `${deviceName} ${status}. ${connected ? 'Şimdi ölçüm yapabilirsiniz.' : 'Lütfen cihaz bağlantısını kontrol edin.'}`,
        type: connected ? 'device_connect' : 'device_disconnect',
        entityType: 'device',
        entityId: deviceType === 'weight' ? 1 : 2 // ID'ler cihaz tipine göre
      });
      
      console.log(`${deviceName} ${status} bildirimi gönderildi - Kullanıcı: ${userId}`);
    } catch (error) {
      console.error(`Bildirim gönderirken hata: ${error}`);
    }
  }

  /**
   * Cihaz bağlantılarını kontrol eder ve durumu döndürür
   * Bağlantı durumu değişiklikleri için bildirim gönderir
   * @param userId İşlemi yapan kullanıcı ID'si
   * @returns Cihaz bağlantı durumları
   */
  getDeviceStatus(userId?: number): { weightConnected: boolean, meterConnected: boolean } {
    const weightConnected = this.weightPort !== null && this.comPortService.isConnected(this.weightPort);
    const meterConnected = this.meterPort !== null && this.comPortService.isConnected(this.meterPort);
    
    // Eğer kullanıcı ID'si verilmişse ve bildirim fonksiyonu tanımlıysa bağlantı değişikliklerini bildir
    if (userId && this.sendNotification) {
      // Tartı bağlantı durumu değiştiyse bildirim gönder
      if (weightConnected !== this.lastWeightConnectionStatus) {
        this.sendConnectionStatusNotification('weight', weightConnected, userId);
        this.lastWeightConnectionStatus = weightConnected;
      }
      
      // Metre bağlantı durumu değiştiyse bildirim gönder
      if (meterConnected !== this.lastMeterConnectionStatus) {
        this.sendConnectionStatusNotification('meter', meterConnected, userId);
        this.lastMeterConnectionStatus = meterConnected;
      }
    }
    
    return {
      weightConnected,
      meterConnected
    };
  }

  /**
   * Cihaz bağlantılarını kapatır
   */
  async disconnectDevices(): Promise<void> {
    if (this.weightPort) {
      await this.comPortService.disconnect(this.weightPort);
      this.weightPort = null;
    }

    if (this.meterPort) {
      await this.comPortService.disconnect(this.meterPort);
      this.meterPort = null;
    }
  }
}

// Singleton instance'ları oluştur
export const comPortService = new ComPortService();
export const measurementDeviceService = new MeasurementDeviceService(comPortService);

// İleride bildirim mekanizmasını ayarlamak için kullanılacak
export function setDeviceNotificationSender(notificationSender: NotificationSender): void {
  measurementDeviceService.setNotificationSender(notificationSender);
}