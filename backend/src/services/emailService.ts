import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export interface EmailConfig {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface VerificationEmailData {
  username: string;
  verificationCode: string;
  verificationLink: string;
}

export interface WelcomeEmailData {
  username: string;
  loginLink: string;
}

export interface PasswordResetData {
  username: string;
  resetLink: string;
  resetCode: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter(): Promise<void> {
    try {
      if (!config.email.enabled) {
        logger.info('📧 Email service disabled in configuration');
        return;
      }

      // Konfiguracja SMTP
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: config.email.auth.user ? {
          user: config.email.auth.user,
          pass: config.email.auth.pass,
        } : undefined,
        tls: {
          rejectUnauthorized: false // Dla środowiska rozwojowego
        }
      });

      // Test połączenia
      await this.transporter!.verify();
      this.isConfigured = true;
      logger.info('✅ Email service initialized successfully');
      
    } catch (error) {
      logger.error('❌ Failed to initialize email service:', error);
      this.isConfigured = false;
      
      if (config.env === 'development') {
        logger.warn('🔧 Email service will run in mock mode for development');
      }
    }
  }

  async sendEmail(emailConfig: EmailConfig): Promise<boolean> {
    try {
      if (!this.isConfigured || !this.transporter) {
        return this.mockEmail(emailConfig);
      }

      const mailOptions = {
        from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
        to: emailConfig.to,
        subject: emailConfig.subject,
        html: emailConfig.html,
        text: emailConfig.text || this.stripHtml(emailConfig.html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`📤 Email sent successfully to ${emailConfig.to}:`, result.messageId);
      return true;

    } catch (error) {
      logger.error(`❌ Failed to send email to ${emailConfig.to}:`, error);
      
      // Fallback do mock mode w przypadku błędu
      if (config.env === 'development') {
        return this.mockEmail(emailConfig);
      }
      
      return false;
    }
  }

  async sendVerificationEmail(email: string, data: VerificationEmailData): Promise<boolean> {
    const subject = 'Potwierdź swoje konto - Tik in de Buurt';
    const html = this.generateVerificationEmail(data);

    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  async sendWelcomeEmail(email: string, data: WelcomeEmailData): Promise<boolean> {
    const subject = 'Witamy w Tik in de Buurt!';
    const html = this.generateWelcomeEmail(data);

    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  async sendPasswordResetEmail(email: string, data: PasswordResetData): Promise<boolean> {
    const subject = 'Resetuj hasło - Tik in de Buurt';
    const html = this.generatePasswordResetEmail(data);

    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  private mockEmail(emailConfig: EmailConfig): boolean {
    logger.info('📧 MOCK EMAIL SERVICE - Email would be sent:');
    logger.info(`   To: ${emailConfig.to}`);
    logger.info(`   Subject: ${emailConfig.subject}`);
    logger.info(`   HTML Preview: ${this.stripHtml(emailConfig.html).substring(0, 100)}...`);
    
    // Symulacja czasu wysyłania
    setTimeout(() => {
      logger.info('✅ MOCK: Email "sent" successfully');
    }, 500);
    
    return true;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  private generateVerificationEmail(data: VerificationEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Potwierdź swoje konto</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .code-box { background: #f8f9fa; border: 2px dashed #dee2e6; padding: 20px; margin: 30px 0; text-align: center; border-radius: 8px; }
          .code { font-size: 32px; font-weight: bold; color: #495057; letter-spacing: 4px; font-family: 'Courier New', monospace; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 14px; color: #6c757d; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏘️ Tik in de Buurt</div>
            <h1>Potwierdź swoje konto</h1>
          </div>
          
          <div class="content">
            <p>Cześć <strong>${data.username}</strong>!</p>
            
            <p>Dziękujemy za rejestrację w Tik in de Buurt. Aby aktywować swoje konto, użyj poniższego kodu weryfikacyjnego:</p>
            
            <div class="code-box">
              <div class="code">${data.verificationCode}</div>
              <p style="margin: 10px 0 0 0; color: #6c757d;">Kod weryfikacyjny</p>
            </div>
            
            <p>Możesz także kliknąć poniższy przycisk, aby potwierdzić konto automatycznie:</p>
            
            <div style="text-align: center;">
              <a href="${data.verificationLink}" class="button">Potwierdź konto</a>
            </div>
            
            <p><small>Kod jest ważny przez 24 godziny. Jeśli nie rejestrowałeś się w naszym serwisie, zignoruj ten email.</small></p>
          </div>
          
          <div class="footer">
            <p>© 2024 Tik in de Buurt. Wszystkie prawa zastrzeżone.</p>
            <p>Ten email został wysłany automatycznie. Nie odpowiadaj na niego.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeEmail(data: WelcomeEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Witamy w Tik in de Buurt!</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 14px; color: #6c757d; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .feature { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏘️ Tik in de Buurt</div>
            <h1>Witamy w społeczności!</h1>
          </div>
          
          <div class="content">
            <p>Cześć <strong>${data.username}</strong>!</p>
            
            <p>🎉 Gratulacje! Twoje konto zostało pomyślnie aktywowane. Jesteś teraz częścią społeczności Tik in de Buurt!</p>
            
            <div class="feature">
              <h3>🎥 Co możesz robić:</h3>
              <ul>
                <li>Publikować krótkie filmy i zdjęcia</li>
                <li>Odkrywać lokalne biznesy i usługi</li>
                <li>Łączyć się z sąsiadami</li>
                <li>Znajdować pracę freelancerską</li>
                <li>Przeglądać oferty nieruchomości</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.loginLink}" class="button">Zacznij korzystać</a>
            </div>
            
            <p>Jeśli masz pytania, skontaktuj się z nami. Jesteśmy tutaj, aby Ci pomóc!</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Tik in de Buurt. Wszystkie prawa zastrzeżone.</p>
            <p>Potrzebujesz pomocy? <a href="mailto:support@tikindebuurt.com">Skontaktuj się z nami</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePasswordResetEmail(data: PasswordResetData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resetuj hasło - Tik in de Buurt</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .code-box { background: #f8f9fa; border: 2px dashed #dee2e6; padding: 20px; margin: 30px 0; text-align: center; border-radius: 8px; }
          .code { font-size: 24px; font-weight: bold; color: #495057; letter-spacing: 2px; font-family: 'Courier New', monospace; }
          .button { display: inline-block; background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 14px; color: #6c757d; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏘️ Tik in de Buurt</div>
            <h1>Resetuj hasło</h1>
          </div>
          
          <div class="content">
            <p>Cześć <strong>${data.username}</strong>!</p>
            
            <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta. Użyj poniższego kodu, aby ustawić nowe hasło:</p>
            
            <div class="code-box">
              <div class="code">${data.resetCode}</div>
              <p style="margin: 10px 0 0 0; color: #6c757d;">Kod resetowania hasła</p>
            </div>
            
            <p>Możesz także kliknąć poniższy przycisk, aby przejść bezpośrednio do formularza resetowania:</p>
            
            <div style="text-align: center;">
              <a href="${data.resetLink}" class="button">Resetuj hasło</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Ważne:</strong> Kod jest ważny przez 1 godzinę. Jeśli nie prosiłeś o reset hasła, zignoruj ten email lub skontaktuj się z nami.
            </div>
          </div>
          
          <div class="footer">
            <p>© 2024 Tik in de Buurt. Wszystkie prawa zastrzeżone.</p>
            <p>Problemy z bezpieczeństwem? <a href="mailto:security@tikindebuurt.com">Zgłoś je tutaj</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Metody pomocnicze do testowania
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      return false;
    }

    try {
      await this.transporter!.verify();
      return true;
    } catch (error) {
      logger.error('Email service connection test failed:', error);
      return false;
    }
  }

  isAvailable(): boolean {
    return this.isConfigured && this.transporter !== null;
  }
}

export const emailService = new EmailService();
export default emailService;