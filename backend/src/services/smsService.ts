import twilio from 'twilio';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export interface SmsConfig {
  to: string;
  message: string;
}

export interface SmsVerificationData {
  username: string;
  verificationCode: string;
  appName: string;
}

class SmsService {
  private twilioClient: twilio.Twilio | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeTwilio();
  }

  private initializeTwilio(): void {
    try {
      if (!config.SMS_ENABLED) {
        logger.info('📱 SMS service disabled in configuration');
        return;
      }

      if (!config.TWILIO_ACCOUNT_SID || !config.TWILIO_AUTH_TOKEN) {
        logger.warn('📱 Twilio credentials not configured - SMS will run in mock mode');
        return;
      }

      this.twilioClient = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
      this.isConfigured = true;
      logger.info('✅ SMS service initialized successfully with Twilio');

    } catch (error) {
      logger.error('❌ Failed to initialize SMS service:', error);
      this.isConfigured = false;

      if (config.NODE_ENV === 'development') {
        logger.warn('🔧 SMS service will run in mock mode for development');
      }
    }
  }

  async sendSms(smsConfig: SmsConfig): Promise<boolean> {
    try {
      if (!this.isConfigured || !this.twilioClient) {
        return this.mockSms(smsConfig);
      }

      if (!config.TWILIO_PHONE_NUMBER) {
        logger.error('❌ Twilio phone number not configured');
        return this.mockSms(smsConfig);
      }

      // Walidacja numeru telefonu
      if (!this.validatePhoneNumber(smsConfig.to)) {
        logger.error(`❌ Invalid phone number format: ${smsConfig.to}`);
        return false;
      }

      const result = await this.twilioClient.messages.create({
        body: smsConfig.message,
        from: config.TWILIO_PHONE_NUMBER,
        to: this.formatPhoneNumber(smsConfig.to)
      });

      logger.info(`📤 SMS sent successfully to ${smsConfig.to}:`, result.sid);
      return true;

    } catch (error: any) {
      logger.error(`❌ Failed to send SMS to ${smsConfig.to}:`, error);

      // Twilio specific error handling
      if (error.code === 21211) {
        logger.error('Invalid phone number provided to Twilio');
      } else if (error.code === 21614) {
        logger.error('Phone number is not verified (Twilio trial account)');
      }

      // Fallback do mock mode w przypadku błędu
      if (config.NODE_ENV === 'development') {
        return this.mockSms(smsConfig);
      }

      return false;
    }
  }

  async sendVerificationSms(phone: string, data: SmsVerificationData): Promise<boolean> {
    const message = this.generateVerificationMessage(data);

    return this.sendSms({
      to: phone,
      message
    });
  }

  async sendPasswordResetSms(phone: string, data: SmsVerificationData): Promise<boolean> {
    const message = this.generatePasswordResetMessage(data);

    return this.sendSms({
      to: phone,
      message
    });
  }

  private mockSms(smsConfig: SmsConfig): boolean {
    logger.info('📱 MOCK SMS SERVICE - SMS would be sent:');
    logger.info(`   To: ${smsConfig.to}`);
    logger.info(`   Message: ${smsConfig.message}`);

    // Symulacja czasu wysyłania
    setTimeout(() => {
      logger.info('✅ MOCK: SMS "sent" successfully');
    }, 300);

    return true;
  }

  private validatePhoneNumber(phone: string): boolean {
    // Usuń wszystkie znaki specjalne i sprawdź format
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    
    // Sprawdź czy zawiera tylko cyfry i ma odpowiednią długość
    const phoneRegex = /^[\d]{8,15}$/;
    return phoneRegex.test(cleanPhone);
  }

  private formatPhoneNumber(phone: string): string {
    // Usuń wszystkie znaki specjalne
    let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Dodaj kod kraju jeśli brakuje
    if (!cleanPhone.startsWith('+')) {
      // Domyślnie Holandia (+31) dla "Tik in de Buurt"
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '+31' + cleanPhone.substring(1);
      } else if (cleanPhone.length === 9 && !cleanPhone.startsWith('31')) {
        cleanPhone = '+31' + cleanPhone;
      } else if (!cleanPhone.startsWith('31')) {
        cleanPhone = '+31' + cleanPhone;
      } else {
        cleanPhone = '+' + cleanPhone;
      }
    }
    
    return cleanPhone;
  }

  private generateVerificationMessage(data: SmsVerificationData): string {
    return `Hallo ${data.username}! Je verificatiecode voor ${data.appName} is: ${data.verificationCode}. Deze code is 10 minuten geldig. Deel deze code nooit met anderen.`;
  }

  private generatePasswordResetMessage(data: SmsVerificationData): string {
    return `Hallo ${data.username}! Je wachtwoord reset code voor ${data.appName} is: ${data.verificationCode}. Deze code is 1 uur geldig. Als je dit niet hebt aangevraagd, ignoreer dit bericht.`;
  }

  // Metody pomocnicze do testowania
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.twilioClient) {
      return false;
    }

    try {
      // Test Twilio connection przez pobranie account info
      await this.twilioClient.api.accounts(config.TWILIO_ACCOUNT_SID).fetch();
      return true;
    } catch (error) {
      logger.error('SMS service connection test failed:', error);
      return false;
    }
  }

  isAvailable(): boolean {
    return this.isConfigured && this.twilioClient !== null;
  }

  // Pobierz informacje o koncie Twilio (do debugowania)
  async getAccountInfo(): Promise<any> {
    if (!this.isConfigured || !this.twilioClient) {
      return { error: 'SMS service not configured' };
    }

    try {
      const account = await this.twilioClient.api.accounts(config.TWILIO_ACCOUNT_SID).fetch();
      return {
        sid: account.sid,
        friendlyName: account.friendlyName,
        status: account.status,
        type: account.type
      };
    } catch (error) {
      logger.error('Error getting Twilio account info:', error);
      return { error: 'Failed to get account info' };
    }
  }

  // Pobierz dostępne numery telefonów Twilio
  async getPhoneNumbers(): Promise<string[]> {
    if (!this.isConfigured || !this.twilioClient) {
      return [];
    }

    try {
      const phoneNumbers = await this.twilioClient.incomingPhoneNumbers.list();
      return phoneNumbers.map(number => number.phoneNumber);
    } catch (error) {
      logger.error('Error getting Twilio phone numbers:', error);
      return [];
    }
  }
}

export const smsService = new SmsService();
export default smsService;