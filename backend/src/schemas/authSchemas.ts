import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Custom sanitization transform
const sanitizeString = (value: string) => DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });

// Base validation schemas
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .transform(sanitizeString);

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
  .transform(sanitizeString);

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name cannot exceed 50 characters')
  .regex(/^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u, 'Name contains invalid characters')
  .transform(sanitizeString);

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .transform(sanitizeString);

// Authentication schemas
export const registerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  userType: z.enum(['user', 'business']).optional().default('user'),
  phone: phoneSchema.optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').transform(sanitizeString)
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required')
});

export const forgotPasswordSchema = z.object({
  email: emailSchema
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Business registration schema
export const businessRegisterSchema = z.object({
  businessName: z.string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name cannot exceed 100 characters')
    .transform(sanitizeString),
  description: z.string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .transform(sanitizeString)
    .optional(),
  category: z.string()
    .min(1, 'Category is required')
    .transform(sanitizeString),
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address cannot exceed 200 characters')
    .transform(sanitizeString),
  phone: phoneSchema,
  website: z.string()
    .url('Invalid website URL')
    .transform(sanitizeString)
    .optional(),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Video upload schema
export const videoUploadSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title cannot exceed 100 characters')
    .transform(sanitizeString),
  description: z.string()
    .max(500, 'Description cannot exceed 500 characters')
    .transform(sanitizeString)
    .optional(),
  category: z.string()
    .min(1, 'Category is required')
    .transform(sanitizeString),
  tags: z.array(z.string().transform(sanitizeString)).optional()
});

// Export types for TypeScript
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type BusinessRegisterInput = z.infer<typeof businessRegisterSchema>;
export type VideoUploadInput = z.infer<typeof videoUploadSchema>;