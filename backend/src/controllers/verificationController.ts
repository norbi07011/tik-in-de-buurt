import { Request, Response } from 'express';
import { emailService } from '../services/emailService';
import { smsService } from '../services/smsService';
import { verificationService } from '../services/verificationService';
import User from '../models/User';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export class VerificationController {
  /**
   * Wysyła kod weryfikacyjny email
   */
  static async sendEmailVerification(req: Request, res: Response): Promise<void> {
    try {
      const { email, userId } = req.body;
      
      if (!email || !userId) {
        res.status(400).json({
          success: false,
          message: 'Email i ID użytkownika są wymagane'
        });
        return;
      }

      // Sprawdź czy użytkownik istnieje
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Użytkownik nie został znaleziony'
        });
        return;
      }

      // Sprawdź czy można wysłać nowy kod
      if (!verificationService.canSendNewCode(userId, 'email_verification')) {
        res.status(429).json({
          success: false,
          message: 'Poczekaj przed wysłaniem kolejnego kodu weryfikacyjnego'
        });
        return;
      }

      // Anuluj poprzednie tokeny
      verificationService.revokeUserTokens(userId, 'email_verification');

      // Utwórz nowy token
      const token = verificationService.createEmailVerificationToken(userId, email);
      const verificationLink = verificationService.generateVerificationLink(
        token, 
        config.FRONTEND_URL
      );

      // Wyślij email
      const emailSent = await emailService.sendVerificationEmail(email, {
        username: user.name,
        verificationCode: token.code,
        verificationLink
      });

      if (!emailSent) {
        res.status(500).json({
          success: false,
          message: 'Nie udało się wysłać kodu weryfikacyjnego'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Kod weryfikacyjny został wysłany na adres email',
        expiresAt: token.expiresAt
      });

    } catch (error) {
      logger.error('Error sending email verification:', error);
      res.status(500).json({
        success: false,
        message: 'Błąd serwera podczas wysyłania kodu weryfikacyjnego'
      });
    }
  }

  /**
   * Weryfikuje kod email
   */
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { code, userId } = req.body;
      
      if (!code) {
        res.status(400).json({
          success: false,
          message: 'Kod weryfikacyjny jest wymagany'
        });
        return;
      }

      // Weryfikuj kod
      const result = verificationService.verifyCode(code, 'email_verification');
      
      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      // Sprawdź czy userId się zgadza (jeśli podany)
      if (userId && result.userId !== userId) {
        res.status(400).json({
          success: false,
          message: 'Nieprawidłowy kod dla tego użytkownika'
        });
        return;
      }

      // Aktualizuj status weryfikacji użytkownika
      const user = await User.findById(result.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Użytkownik nie został znaleziony'
        });
        return;
      }

      user.isVerified = true;
      user.emailVerifiedAt = new Date();
      await user.save();

      // Wyślij email powitalny
      if (emailService.isAvailable()) {
        await emailService.sendWelcomeEmail(user.email, {
          username: user.name,
          loginLink: `${config.FRONTEND_URL}/login`
        });
      }

      logger.info(`✅ Email verified for user ${user.name}`);

      res.status(200).json({
        success: true,
        message: 'Email został pomyślnie zweryfikowany',
        user: {
          id: user._id,
          username: user.name,
          email: user.email,
          isEmailVerified: user.isVerified
        }
      });

    } catch (error) {
      logger.error('Error verifying email:', error);
      res.status(500).json({
        success: false,
        message: 'Błąd serwera podczas weryfikacji email'
      });
    }
  }

  /**
   * Wysyła kod resetowania hasła
   */
  static async sendPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      
      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Adres email jest wymagany'
        });
        return;
      }

      // Znajdź użytkownika
      const user = await User.findOne({ email });
      if (!user) {
        // Ze względów bezpieczeństwa nie ujawniamy czy email istnieje
        res.status(200).json({
          success: true,
          message: 'Jeśli konto z tym emailem istnieje, kod resetowania został wysłany'
        });
        return;
      }

      // Sprawdź czy można wysłać nowy kod
      if (!verificationService.canSendNewCode(user._id.toString(), 'password_reset')) {
        res.status(429).json({
          success: false,
          message: 'Poczekaj przed wysłaniem kolejnego kodu resetowania'
        });
        return;
      }

      // Anuluj poprzednie tokeny
      verificationService.revokeUserTokens(user._id.toString(), 'password_reset');

      // Utwórz nowy token
      const token = verificationService.createPasswordResetToken(user._id.toString(), email);
      const resetLink = verificationService.generateVerificationLink(
        token, 
        config.FRONTEND_URL
      );

      // Wyślij email
      const emailSent = await emailService.sendPasswordResetEmail(email, {
        username: user.name,
        resetCode: token.code,
        resetLink
      });

      if (!emailSent) {
        res.status(500).json({
          success: false,
          message: 'Nie udało się wysłać kodu resetowania hasła'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Kod resetowania hasła został wysłany na adres email',
        expiresAt: token.expiresAt
      });

    } catch (error) {
      logger.error('Error sending password reset:', error);
      res.status(500).json({
        success: false,
        message: 'Błąd serwera podczas wysyłania kodu resetowania'
      });
    }
  }

  /**
   * Weryfikuje kod resetowania hasła
   */
  static async verifyPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { code, newPassword } = req.body;
      
      if (!code || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Kod i nowe hasło są wymagane'
        });
        return;
      }

      // Weryfikuj kod
      const result = verificationService.verifyCode(code, 'password_reset');
      
      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      // Znajdź użytkownika i zaktualizuj hasło
      const user = await User.findById(result.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Użytkownik nie został znaleziony'
        });
        return;
      }

      // Zaktualizuj hasło (będzie zahashowane w pre-save hook)
      user.password = newPassword;
      user.passwordResetAt = new Date();
      await user.save();

      logger.info(`🔑 Password reset completed for user ${user.name}`);

      res.status(200).json({
        success: true,
        message: 'Hasło zostało pomyślnie zaktualizowane'
      });

    } catch (error) {
      logger.error('Error verifying password reset:', error);
      res.status(500).json({
        success: false,
        message: 'Błąd serwera podczas resetowania hasła'
      });
    }
  }

  /**
   * Weryfikuje token z linku (GET endpoint)
   */
  static async verifyTokenLink(req: Request, res: Response): Promise<void> {
    try {
      const { token, code, type } = req.query;
      
      if (!token || !code || !type) {
        res.status(400).json({
          success: false,
          message: 'Brakujące parametry weryfikacji'
        });
        return;
      }

      const verifyType = type as 'email_verification' | 'password_reset';
      
      // Weryfikuj kod bezpośrednio
      const result = verificationService.verifyCode(code as string, verifyType);
      
      if (!result.success) {
        // Przekieruj do frontendu z błędem
        res.redirect(`${config.FRONTEND_URL}/verify-error?message=${encodeURIComponent(result.message)}`);
        return;
      }

      // W przypadku weryfikacji email, zaktualizuj użytkownika
      if (verifyType === 'email_verification') {
        const user = await User.findById(result.userId);
        if (user) {
          user.isVerified = true;
          user.emailVerifiedAt = new Date();
          await user.save();
          
          // Wyślij email powitalny
          if (emailService.isAvailable()) {
            await emailService.sendWelcomeEmail(user.email, {
              username: user.name,
              loginLink: `${config.FRONTEND_URL}/login`
            });
          }
        }
        
        // Przekieruj do strony sukcesu
        res.redirect(`${config.FRONTEND_URL}/verify-success?type=email`);
      } else {
        // Przekieruj do formularza resetowania hasła
        res.redirect(`${config.FRONTEND_URL}/reset-password?code=${code}&verified=true`);
      }

    } catch (error) {
      logger.error('Error verifying token link:', error);
      res.redirect(`${config.FRONTEND_URL}/verify-error?message=${encodeURIComponent('Błąd serwera')}`);
    }
  }

  /**
   * Pobiera status weryfikacji użytkownika
   */
  static async getVerificationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId).select('isVerified emailVerifiedAt');
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Użytkownik nie został znaleziony'
        });
        return;
      }

      res.status(200).json({
        success: true,
        verification: {
          email: {
            verified: user.isVerified,
            verifiedAt: user.emailVerifiedAt
          }
        }
      });

    } catch (error) {
      logger.error('Error getting verification status:', error);
      res.status(500).json({
        success: false,
        message: 'Błąd serwera podczas pobierania statusu weryfikacji'
      });
    }
  }

  /**
   * Wysyła kod weryfikacyjny SMS
   */
  static async sendSmsVerification(req: Request, res: Response): Promise<void> {
    try {
      const { phone, userId } = req.body;
      
      if (!phone || !userId) {
        res.status(400).json({
          success: false,
          message: 'Numer telefonu i ID użytkownika są wymagane'
        });
        return;
      }

      // Sprawdź czy użytkownik istnieje
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Użytkownik nie został znaleziony'
        });
        return;
      }

      // Sprawdź czy można wysłać nowy kod
      if (!verificationService.canSendNewCode(userId, 'phone_verification')) {
        res.status(429).json({
          success: false,
          message: 'Poczekaj przed wysłaniem kolejnego kodu SMS'
        });
        return;
      }

      // Anuluj poprzednie tokeny
      verificationService.revokeUserTokens(userId, 'phone_verification');

      // Utwórz nowy token
      const token = verificationService.createSmsVerificationToken(userId, phone);

      // Wyślij SMS
      const smsSent = await smsService.sendVerificationSms(phone, {
        username: user.name,
        verificationCode: token.code,
        appName: 'Tik in de Buurt'
      });

      if (!smsSent) {
        res.status(500).json({
          success: false,
          message: 'Nie udało się wysłać kodu SMS'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Kod weryfikacyjny został wysłany przez SMS',
        expiresAt: token.expiresAt
      });

    } catch (error) {
      logger.error('Error sending SMS verification:', error);
      res.status(500).json({
        success: false,
        message: 'Błąd serwera podczas wysyłania kodu SMS'
      });
    }
  }

  /**
   * Weryfikuje kod SMS
   */
  static async verifySms(req: Request, res: Response): Promise<void> {
    try {
      const { code, userId } = req.body;
      
      if (!code) {
        res.status(400).json({
          success: false,
          message: 'Kod weryfikacyjny jest wymagany'
        });
        return;
      }

      // Weryfikuj kod
      const result = verificationService.verifyCode(code, 'phone_verification');
      
      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      // Sprawdź czy userId się zgadza (jeśli podany)
      if (userId && result.userId !== userId) {
        res.status(400).json({
          success: false,
          message: 'Nieprawidłowy kod dla tego użytkownika'
        });
        return;
      }

      // Aktualizuj status weryfikacji użytkownika
      const user = await User.findById(result.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Użytkownik nie został znaleziony'
        });
        return;
      }

      // Aktualizuj dane weryfikacji telefonu
      user.phone = result.tokenData?.phone;
      user.isPhoneVerified = true;
      user.phoneVerifiedAt = new Date();
      await user.save();

      logger.info(`✅ SMS verified for user ${user.name}`);

      res.status(200).json({
        success: true,
        message: 'Numer telefonu został pomyślnie zweryfikowany',
        user: {
          id: user._id,
          username: user.name,
          phone: result.tokenData?.phone,
          isPhoneVerified: true
        }
      });

    } catch (error) {
      logger.error('Error verifying SMS:', error);
      res.status(500).json({
        success: false,
        message: 'Błąd serwera podczas weryfikacji SMS'
      });
    }
  }

  /**
   * Wysyła kod resetowania hasła przez SMS
   */
  static async sendSmsPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        res.status(400).json({
          success: false,
          message: 'Numer telefonu jest wymagany'
        });
        return;
      }

      // Znajdź użytkownika po numerze telefonu
      const user = await User.findOne({ phone });
      if (!user) {
        // Ze względów bezpieczeństwa nie ujawniamy czy numer istnieje
        res.status(200).json({
          success: true,
          message: 'Jeśli konto z tym numerem istnieje, kod resetowania został wysłany'
        });
        return;
      }

      // Sprawdź czy można wysłać nowy kod
      if (!verificationService.canSendNewCode(user._id.toString(), 'password_reset')) {
        res.status(429).json({
          success: false,
          message: 'Poczekaj przed wysłaniem kolejnego kodu resetowania'
        });
        return;
      }

      // Anuluj poprzednie tokeny
      verificationService.revokeUserTokens(user._id.toString(), 'password_reset');

      // Utwórz nowy token
      const token = verificationService.createSmsPasswordResetToken(user._id.toString(), phone);

      // Wyślij SMS
      const smsSent = await smsService.sendPasswordResetSms(phone, {
        username: user.name,
        verificationCode: token.code,
        appName: 'Tik in de Buurt'
      });

      if (!smsSent) {
        res.status(500).json({
          success: false,
          message: 'Nie udało się wysłać kodu resetowania SMS'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Kod resetowania hasła został wysłany przez SMS',
        expiresAt: token.expiresAt
      });

    } catch (error) {
      logger.error('Error sending SMS password reset:', error);
      res.status(500).json({
        success: false,
        message: 'Błąd serwera podczas wysyłania kodu resetowania SMS'
      });
    }
  }
}