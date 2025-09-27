import { randomBytes, createHash } from 'crypto';
import { logger } from '../utils/logger';

export interface VerificationToken {
  code: string;
  hashedCode: string;
  expiresAt: Date;
  type: 'email_verification' | 'password_reset' | 'phone_verification';
  userId?: string;
  email?: string;
  phone?: string;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  userId?: string;
  tokenData?: VerificationToken;
}

class VerificationService {
  private tokens: Map<string, VerificationToken> = new Map();
  
  // Czasy wygaśnięcia dla różnych typów tokenów
  private readonly EXPIRY_TIMES = {
    email_verification: 24 * 60 * 60 * 1000, // 24 godziny
    password_reset: 60 * 60 * 1000, // 1 godzina
    phone_verification: 10 * 60 * 1000 // 10 minut
  };

  /**
   * Generuje kod weryfikacyjny
   */
  generateVerificationCode(length: number = 6): string {
    const digits = '0123456789';
    let code = '';
    
    for (let i = 0; i < length; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }
    
    return code;
  }

  /**
   * Generuje bezpieczny token dla linków
   */
  generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Hashuje kod weryfikacyjny
   */
  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  /**
   * Tworzy token weryfikacyjny dla email
   */
  createEmailVerificationToken(userId: string, email: string): VerificationToken {
    const code = this.generateVerificationCode(6);
    const hashedCode = this.hashCode(code);
    const expiresAt = new Date(Date.now() + this.EXPIRY_TIMES.email_verification);
    
    const token: VerificationToken = {
      code,
      hashedCode,
      expiresAt,
      type: 'email_verification',
      userId,
      email
    };
    
    // Przechowuj token używając hashu jako klucza
    this.tokens.set(hashedCode, token);
    
    logger.info(`📧 Email verification token created for user ${userId}`);
    return token;
  }

  /**
   * Tworzy token resetowania hasła
   */
  createPasswordResetToken(userId: string, email: string): VerificationToken {
    const code = this.generateVerificationCode(8);
    const hashedCode = this.hashCode(code);
    const expiresAt = new Date(Date.now() + this.EXPIRY_TIMES.password_reset);
    
    const token: VerificationToken = {
      code,
      hashedCode,
      expiresAt,
      type: 'password_reset',
      userId,
      email
    };
    
    this.tokens.set(hashedCode, token);
    
    logger.info(`🔑 Password reset token created for user ${userId}`);
    return token;
  }

  /**
   * Tworzy token weryfikacji telefonu
   */
  createPhoneVerificationToken(userId: string, phone: string): VerificationToken {
    const code = this.generateVerificationCode(4);
    const hashedCode = this.hashCode(code);
    const expiresAt = new Date(Date.now() + this.EXPIRY_TIMES.phone_verification);
    
    const token: VerificationToken = {
      code,
      hashedCode,
      expiresAt,
      type: 'phone_verification',
      userId,
      phone
    };
    
    this.tokens.set(hashedCode, token);
    
    logger.info(`📱 Phone verification token created for user ${userId}`);
    return token;
  }

  /**
   * Tworzy token weryfikacji telefonu dla SMS
   */
  createSmsVerificationToken(userId: string, phone: string): VerificationToken {
    const code = this.generateVerificationCode(6); // 6 cyfr dla SMS
    const hashedCode = this.hashCode(code);
    const expiresAt = new Date(Date.now() + this.EXPIRY_TIMES.phone_verification);
    
    const token: VerificationToken = {
      code,
      hashedCode,
      expiresAt,
      type: 'phone_verification',
      userId,
      phone
    };
    
    this.tokens.set(hashedCode, token);
    
    logger.info(`📱 SMS verification token created for user ${userId}`);
    return token;
  }

  /**
   * Tworzy token resetowania hasła przez SMS
   */
  createSmsPasswordResetToken(userId: string, phone: string): VerificationToken {
    const code = this.generateVerificationCode(6); // 6 cyfr dla SMS
    const hashedCode = this.hashCode(code);
    const expiresAt = new Date(Date.now() + this.EXPIRY_TIMES.password_reset);
    
    const token: VerificationToken = {
      code,
      hashedCode,
      expiresAt,
      type: 'password_reset',
      userId,
      phone
    };
    
    this.tokens.set(hashedCode, token);
    
    logger.info(`📱 SMS password reset token created for user ${userId}`);
    return token;
  }

  /**
   * Weryfikuje kod
   */
  verifyCode(code: string, type: VerificationToken['type']): VerificationResult {
    const hashedCode = this.hashCode(code);
    const token = this.tokens.get(hashedCode);
    
    if (!token) {
      return {
        success: false,
        message: 'Nieprawidłowy kod weryfikacyjny'
      };
    }
    
    if (token.type !== type) {
      return {
        success: false,
        message: 'Nieprawidłowy typ kodu weryfikacyjnego'
      };
    }
    
    if (token.expiresAt < new Date()) {
      this.tokens.delete(hashedCode);
      return {
        success: false,
        message: 'Kod weryfikacyjny wygasł'
      };
    }
    
    // Usuń token po pomyślnej weryfikacji (jednorazowe użycie)
    this.tokens.delete(hashedCode);
    
    logger.info(`✅ Code verified successfully for user ${token.userId}`);
    return {
      success: true,
      message: 'Kod został pomyślnie zweryfikowany',
      userId: token.userId,
      tokenData: token
    };
  }

  /**
   * Weryfikuje token z linku (URL)
   */
  verifyTokenLink(token: string, type: VerificationToken['type']): VerificationResult {
    // Szukamy token w mapie
    for (const [hashedCode, tokenData] of this.tokens.entries()) {
      if (tokenData.type === type && hashedCode.includes(token.substring(0, 16))) {
        if (tokenData.expiresAt < new Date()) {
          this.tokens.delete(hashedCode);
          return {
            success: false,
            message: 'Link weryfikacyjny wygasł'
          };
        }
        
        // Usuń token po użyciu
        this.tokens.delete(hashedCode);
        
        logger.info(`✅ Token link verified successfully for user ${tokenData.userId}`);
        return {
          success: true,
          message: 'Link został pomyślnie zweryfikowany',
          userId: tokenData.userId,
          tokenData
        };
      }
    }
    
    return {
      success: false,
      message: 'Nieprawidłowy lub wygasły link weryfikacyjny'
    };
  }

  /**
   * Anuluje wszystkie tokeny dla użytkownika
   */
  revokeUserTokens(userId: string, type?: VerificationToken['type']): number {
    let revokedCount = 0;
    
    for (const [hashedCode, token] of this.tokens.entries()) {
      if (token.userId === userId && (!type || token.type === type)) {
        this.tokens.delete(hashedCode);
        revokedCount++;
      }
    }
    
    if (revokedCount > 0) {
      logger.info(`🗑️ Revoked ${revokedCount} tokens for user ${userId}`);
    }
    
    return revokedCount;
  }

  /**
   * Czyści wygasłe tokeny
   */
  cleanupExpiredTokens(): number {
    let cleanedCount = 0;
    const now = new Date();
    
    for (const [hashedCode, token] of this.tokens.entries()) {
      if (token.expiresAt < now) {
        this.tokens.delete(hashedCode);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      logger.info(`🧹 Cleaned up ${cleanedCount} expired tokens`);
    }
    
    return cleanedCount;
  }

  /**
   * Generuje link weryfikacyjny
   */
  generateVerificationLink(token: VerificationToken, baseUrl: string): string {
    const secureToken = this.generateSecureToken();
    
    switch (token.type) {
      case 'email_verification':
        return `${baseUrl}/verify-email?token=${secureToken}&code=${token.code}`;
      case 'password_reset':
        return `${baseUrl}/reset-password?token=${secureToken}&code=${token.code}`;
      case 'phone_verification':
        return `${baseUrl}/verify-phone?token=${secureToken}&code=${token.code}`;
      default:
        return `${baseUrl}/verify?token=${secureToken}`;
    }
  }

  /**
   * Sprawdza czy użytkownik może otrzymać nowy kod
   */
  canSendNewCode(userId: string, type: VerificationToken['type']): boolean {
    for (const token of this.tokens.values()) {
      if (token.userId === userId && token.type === type) {
        // Jeśli istnieje aktywny token, sprawdź czy minęło wystarczająco czasu
        const timeSinceCreation = Date.now() - (token.expiresAt.getTime() - this.EXPIRY_TIMES[type]);
        const minInterval = type === 'phone_verification' ? 60000 : 300000; // 1 min dla SMS, 5 min dla email
        
        return timeSinceCreation > minInterval;
      }
    }
    
    return true; // Brak aktywnych tokenów, można wysłać nowy
  }

  /**
   * Pobiera statystyki tokenów (do debugowania)
   */
  getTokenStats(): {
    total: number;
    byType: Record<string, number>;
    expired: number;
  } {
    const stats = {
      total: this.tokens.size,
      byType: {} as Record<string, number>,
      expired: 0
    };
    
    const now = new Date();
    
    for (const token of this.tokens.values()) {
      stats.byType[token.type] = (stats.byType[token.type] || 0) + 1;
      
      if (token.expiresAt < now) {
        stats.expired++;
      }
    }
    
    return stats;
  }
}

// Singleton instance
export const verificationService = new VerificationService();

// Automatyczne czyszczenie wygasłych tokenów co godzinę
setInterval(() => {
  verificationService.cleanupExpiredTokens();
}, 60 * 60 * 1000);

export default verificationService;