import express from 'express';
import { VerificationController } from '../controllers/verificationController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route POST /api/verification/send-email-verification
 * @desc Wysyła kod weryfikacyjny email
 * @access Public
 */
router.post('/send-email-verification', VerificationController.sendEmailVerification);

/**
 * @route POST /api/verification/verify-email
 * @desc Weryfikuje kod email
 * @access Public
 */
router.post('/verify-email', VerificationController.verifyEmail);

/**
 * @route POST /api/verification/send-password-reset
 * @desc Wysyła kod resetowania hasła
 * @access Public
 */
router.post('/send-password-reset', VerificationController.sendPasswordReset);

/**
 * @route POST /api/verification/verify-password-reset
 * @desc Weryfikuje kod resetowania hasła i ustala nowe hasło
 * @access Public
 */
router.post('/verify-password-reset', VerificationController.verifyPasswordReset);

/**
 * @route POST /api/verification/send-sms-verification
 * @desc Wysyła kod weryfikacyjny SMS
 * @access Public
 */
router.post('/send-sms-verification', VerificationController.sendSmsVerification);

/**
 * @route POST /api/verification/verify-sms
 * @desc Weryfikuje kod SMS
 * @access Public
 */
router.post('/verify-sms', VerificationController.verifySms);

/**
 * @route POST /api/verification/send-sms-password-reset
 * @desc Wysyła kod resetowania hasła przez SMS
 * @access Public
 */
router.post('/send-sms-password-reset', VerificationController.sendSmsPasswordReset);

/**
 * @route GET /api/verification/verify-link
 * @desc Weryfikuje token z linku email (przekierowania)
 * @access Public
 */
router.get('/verify-link', VerificationController.verifyTokenLink);

/**
 * @route GET /api/verification/status/:userId
 * @desc Pobiera status weryfikacji użytkownika
 * @access Private (tylko dla zalogowanych)
 */
router.get('/status/:userId', authenticateToken, VerificationController.getVerificationStatus);

export default router;