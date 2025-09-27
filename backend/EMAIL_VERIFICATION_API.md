# API Documentation - Email & Verification System

## Overview
System weryfikacji email i resetowania haseł dla platformy Tik in de Buurt.

## Endpoints

### 1. Wysyłanie kodu weryfikacyjnego email
```
POST /api/verification/send-email-verification
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "userId": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kod weryfikacyjny został wysłany na adres email",
  "expiresAt": "2024-01-01T12:00:00.000Z"
}
```

### 2. Weryfikacja kodu email
```
POST /api/verification/verify-email
```

**Request Body:**
```json
{
  "code": "123456",
  "userId": "60f7b3b3b3b3b3b3b3b3b3b3" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email został pomyślnie zweryfikowany",
  "user": {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "username": "JanKowalski",
    "email": "user@example.com",
    "isEmailVerified": true
  }
}
```

### 3. Wysyłanie kodu resetowania hasła
```
POST /api/verification/send-password-reset
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kod resetowania hasła został wysłany na adres email",
  "expiresAt": "2024-01-01T01:00:00.000Z"
}
```

### 4. Weryfikacja kodu resetowania hasła
```
POST /api/verification/verify-password-reset
```

**Request Body:**
```json
{
  "code": "12345678",
  "newPassword": "newSecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Hasło zostało pomyślnie zaktualizowane"
}
```

### 5. Weryfikacja linku z email (GET redirect)
```
GET /api/verification/verify-link?token=abc123&code=123456&type=email_verification
```

**Response:**
- Redirect do frontendu z odpowiednim statusem
- `/verify-success?type=email` - sukces weryfikacji email
- `/reset-password?code=123456&verified=true` - reset hasła
- `/verify-error?message=error` - błąd weryfikacji

### 6. Pobieranie statusu weryfikacji
```
GET /api/verification/status/:userId
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "verification": {
    "email": {
      "verified": true,
      "verifiedAt": "2024-01-01T10:00:00.000Z"
    }
  }
}
```

## Email Templates

### 1. Email weryfikacyjny
- **Subject:** "Potwierdź swoje konto - Tik in de Buurt"
- **Zawiera:** Kod 6-cyfrowy + link weryfikacyjny
- **Ważność:** 24 godziny

### 2. Email powitalny
- **Subject:** "Witamy w Tik in de Buurt!"
- **Wysyłany:** Po pomyślnej weryfikacji
- **Zawiera:** Przegląd funkcji + link do logowania

### 3. Email resetowania hasła
- **Subject:** "Resetuj hasło - Tik in de Buurt"
- **Zawiera:** Kod 8-cyfrowy + link resetowania
- **Ważność:** 1 godzina

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | "Nieprawidłowy kod weryfikacyjny" | Kod nie istnieje lub błędny |
| 400 | "Kod weryfikacyjny wygasł" | Kod przekroczył czas ważności |
| 429 | "Poczekaj przed wysłaniem kolejnego kodu" | Rate limiting aktywny |
| 404 | "Użytkownik nie został znaleziony" | User ID nie istnieje |
| 500 | "Nie udało się wysłać kodu" | Błąd SMTP |

## Rate Limiting

### Email weryfikacyjny
- **Interwał:** 5 minut między kolejnymi kodami
- **Maximum:** 1 aktywny kod na użytkownika

### Reset hasła
- **Interwał:** 5 minut między kolejnymi kodami
- **Maximum:** 1 aktywny kod na użytkownika

## Configuration

### Environment Variables
```bash
# Email Configuration
EMAIL_ENABLED=false          # true for production
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false           # true for port 465
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM_NAME=Tik in de Buurt
EMAIL_FROM_EMAIL=noreply@tikindebuurt.com
```

### Development Mode
- Gdy `EMAIL_ENABLED=false` lub brak SMTP - używany mock service
- Mock service loguje zawartość emaili do konsoli
- Wszystkie funkcje działają bez prawdziwego wysyłania

### Production Setup
1. Skonfiguruj SMTP (Gmail, SendGrid, AWS SES, etc.)
2. Ustaw `EMAIL_ENABLED=true`
3. Skonfiguruj zmienne środowiskowe
4. Przetestuj połączenie SMTP

## Security Features

### Token Security
- Kody są hashowane SHA-256 przed przechowaniem
- Jednorazowe użycie - token usuwany po weryfikacji
- Automatyczne czyszczenie wygasłych tokenów

### Rate Limiting
- Zapobiega spam-owaniu
- Inteligentne interwały między kodami
- Anulowanie poprzednich tokenów

### Link Security
- Bezpieczne tokeny 64-znakowe dla linków
- Walidacja typu tokenu
- Przekierowania tylko do zaufanych domen

## Integration Examples

### Frontend Integration
```typescript
// Wysyłanie kodu weryfikacyjnego
const sendVerification = async (email: string, userId: string) => {
  const response = await fetch('/api/verification/send-email-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, userId })
  });
  return response.json();
};

// Weryfikacja kodu
const verifyCode = async (code: string) => {
  const response = await fetch('/api/verification/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  return response.json();
};
```

### Error Handling
```typescript
try {
  const result = await sendVerification(email, userId);
  if (!result.success) {
    // Handle specific errors
    switch (result.message) {
      case 'Poczekaj przed wysłaniem kolejnego kodu':
        showRateLimitMessage();
        break;
      default:
        showGenericError(result.message);
    }
  }
} catch (error) {
  showNetworkError();
}
```