/**
 * Bluetooth Thermal Printer Service for Web / Android browsers
 * Supports 58mm and 80mm ESC/POS mini thermal printers over Web Bluetooth API.
 * Follows real-world POS safeguards: 12-second watchdog timeout and 400ms flush delay.
 */

export interface BluetoothPrintResult {
  success: boolean;
  messageUrdu: string;
  messageEn: string;
  errorType?: 'unsupported' | 'permission_denied' | 'timeout' | 'not_found' | 'disconnected' | 'unknown';
}

// Well-known thermal printer service UUIDs and SPP UUIDs
export const THERMAL_PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard printer service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Common BLE ESC/POS printer
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent serial
  '0000ae00-0000-1000-8000-00805f9b34fb', // PT-210 / MPT-II thermal printers
  '0000af00-0000-1000-8000-00805f9b34fb',
];

// Characteristic UUIDs used for writing ESC/POS data
export const THERMAL_PRINTER_CHARACTERISTIC_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  '0000ae01-0000-1000-8000-00805f9b34fb',
  '0000af01-0000-1000-8000-00805f9b34fb',
];

class BluetoothPrinterService {
  private activeDevice: any = null;
  private activeServer: any = null;
  private writeCharacteristic: any = null;

  /**
   * Check if the current browser environment supports the Web Bluetooth API
   */
  public isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Request Bluetooth printer pairing dialog from browser
   */
  public async requestPrinter(): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    if (!this.isBluetoothSupported()) {
      return {
        success: false,
        error: 'آپ کا براؤزر بلوٹوتھ کو سپورٹ نہیں کرتا۔ براہ کرم گوگل کروم یا اینڈرائیڈ ڈیوائس استعمال کریں۔',
      };
    }

    try {
      const navBluetooth = (navigator as any).bluetooth;
      const device = await navBluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          ...THERMAL_PRINTER_SERVICE_UUIDS,
          '000018f0-0000-1000-8000-00805f9b34fb',
          '0000ae00-0000-1000-8000-00805f9b34fb',
          'generic_access',
        ],
      });

      this.activeDevice = device;
      return {
        success: true,
        deviceName: device.name || 'Bluetooth Thermal Printer',
      };
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        return { success: false, error: 'کوئی پرنٹر منتخب نہیں کیا گیا۔' };
      }
      return { success: false, error: err.message || 'بلوٹوتھ پرنٹر سے کنکشن نہ بن سکا۔' };
    }
  }

  /**
   * Send raw byte buffer to connected thermal printer with 12s timeout & 400ms flush
   */
  public async printBytes(bytes: Uint8Array): Promise<BluetoothPrintResult> {
    if (!this.isBluetoothSupported()) {
      return {
        success: false,
        errorType: 'unsupported',
        messageUrdu: 'اس براؤزر میں بلوٹوتھ سپورٹ موجود نہیں ہے۔ آپ سسٹم پرنٹ استعمال کر سکتے ہیں۔',
        messageEn: 'Web Bluetooth is not supported in this browser. Use System Print instead.',
      };
    }

    let watchdogTimer: any = null;

    try {
      // 1. If device is not paired yet, request user selection
      if (!this.activeDevice) {
        const pairResult = await this.requestPrinter();
        if (!pairResult.success) {
          return {
            success: false,
            errorType: 'not_found',
            messageUrdu: pairResult.error || 'پرنٹر سلیکٹ نہیں کیا گیا۔',
            messageEn: pairResult.error || 'No printer selected.',
          };
        }
      }

      // 2. Setup 12-second connection watchdog
      const connectPromise = (async () => {
        if (!this.activeDevice.gatt.connected) {
          this.activeServer = await this.activeDevice.gatt.connect();
        } else {
          this.activeServer = this.activeDevice.gatt;
        }

        // Search primary services
        const services = await this.activeServer.getPrimaryServices();
        let targetChar: any = null;

        for (const service of services) {
          try {
            const characteristics = await service.getCharacteristics();
            for (const char of characteristics) {
              if (char.properties.write || char.properties.writeWithoutResponse) {
                targetChar = char;
                break;
              }
            }
            if (targetChar) break;
          } catch {
            continue;
          }
        }

        if (!targetChar) {
          throw new Error('پرنٹر کی پرنٹنگ سروس نہیں ملی۔ پرنٹر بند کر کے دوبارہ آن کریں۔');
        }

        this.writeCharacteristic = targetChar;

        // 3. Chunk transmission (standard MTU for thermal BLE is ~20 to 100 bytes)
        const CHUNK_SIZE = 64;
        for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
          const chunk = bytes.slice(i, i + CHUNK_SIZE);
          if (this.writeCharacteristic.writeValueWithoutResponse) {
            await this.writeCharacteristic.writeValueWithoutResponse(chunk);
          } else {
            await this.writeCharacteristic.writeValue(chunk);
          }
          // Micro delay between chunks to avoid buffer overrun
          await new Promise((r) => setTimeout(r, 20));
        }

        // 4. Critical POS rule: wait 400ms before disconnect so printer buffer drains
        await new Promise((r) => setTimeout(r, 400));
      })();

      const timeoutPromise = new Promise((_, reject) => {
        watchdogTimer = setTimeout(() => {
          if (this.activeDevice?.gatt?.connected) {
            this.activeDevice.gatt.disconnect();
          }
          reject(new Error('TIMEOUT_EXCEEDED'));
        }, 12000);
      });

      await Promise.race([connectPromise, timeoutPromise]);
      clearTimeout(watchdogTimer);

      return {
        success: true,
        messageUrdu: 'رسید کامیابی سے پرنٹ ہو گئی۔',
        messageEn: 'Receipt printed successfully.',
      };
    } catch (err: any) {
      if (watchdogTimer) clearTimeout(watchdogTimer);

      if (err.message === 'TIMEOUT_EXCEEDED') {
        return {
          success: false,
          errorType: 'timeout',
          messageUrdu: 'پرنٹر سے رابطہ نہیں ہوا — چیک کریں کہ پرنٹر آن ہے اور موبائل/لیپ ٹاپ کے پاس ہے؟',
          messageEn: 'Printer did not respond within 12 seconds. Make sure it is turned ON and nearby.',
        };
      }

      return {
        success: false,
        errorType: 'unknown',
        messageUrdu: `پرنٹنگ میں مسئلہ: ${err.message || 'پرنٹر چیک کریں'}`,
        messageEn: `Printing issue: ${err.message || 'Check printer connection.'}`,
      };
    }
  }

  /**
   * Disconnect current printer
   */
  public disconnect() {
    try {
      if (this.activeDevice?.gatt?.connected) {
        this.activeDevice.gatt.disconnect();
      }
    } catch {
      // ignore
    }
    this.activeDevice = null;
    this.activeServer = null;
    this.writeCharacteristic = null;
  }
}

export const bluetoothPrinter = new BluetoothPrinterService();
