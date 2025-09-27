# Frontend API Configuration

## ✅ AKTUALIZACJA: Email System & Verification

**FAZA 1 DZIEŃ 2 - ZAKOŃCZONA**
- ✅ Email Service z nodemailer
- ✅ Verification Service z kodami i tokenami  
- ✅ Verification Controller z pełnym API
- ✅ Mock mode dla developmentu
- ✅ HTML email templates (weryfikacja, powitalny, reset hasła)
- ✅ API endpoints: `/api/verification/*`

## ✅ AKTUALIZACJA: MongoDB Atlas Integration

**FAZA 1 DZIEŃ 3 - W TRAKCIE**
- ✅ MongoDB Atlas cluster utworzony (FREE M0)
- ✅ Database users i Network Access skonfigurowane
- ✅ Connection string dodany do backend/.env
- ✅ Retry logic z fallback na local data
- ⚠️ Authentication issue - do dalszej pracy
- ✅ Server działa poprawnie na porcie 8080

**Dostępne endpointy:**
- `POST /api/verification/send-email-verification` - wysyłanie kodu
- `POST /api/verification/verify-email` - weryfikacja emaila
- `POST /api/verification/send-password-reset` - reset hasła
- `POST /api/verification/verify-password-reset` - weryfikacja resetu
- `GET /api/verification/verify-link` - linki z emaili
- `GET /api/verification/status/:userId` - status weryfikacji

**Dokumentacja:** `backend/EMAIL_VERIFICATION_API.md`

## Przełączenie z Mock na Real API

### 1. Konfiguracja środowiska

Upewnij się, że plik `.env` w głównym katalogu projektu zawiera:

```env
# Frontend API Configuration  
VITE_API_URL=http://localhost:5000/api
VITE_USE_MOCK_API=false

# API Keys
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

### 2. Backend Configuration

Sprawdź, czy backend jest uruchomiony na porcie 8080:

```bash
cd backend
npm run dev
```

Backend health check: http://127.0.0.1:8080/health

**MongoDB Atlas Setup:**
1. Wybierz "Kierowcy" w Atlas dashboard
2. Utwórz FREE cluster M0
3. Dodaj connection string do `backend/.env`:
   ```env
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/tik-in-de-buurt
   ```

### 3. Nowe funkcje API

Zaimplementowano następujące funkcje real API:

#### Autentyfikacja
- ✅ `api.login(email, password)` - logowanie użytkownika
- ✅ `api.register(name, email, password)` - rejestracja użytkownika  
- ✅ `api.logout()` - wylogowanie użytkownika
- ✅ `api.refresh()` - odświeżenie tokenu

#### Biznes
- ✅ `api.getBusinesses(filters)` - pobieranie listy biznesów z filtrowaniem

#### Video Feed
- ✅ `api.getFeed(page)` - pobieranie feed'a wideo z paginacją
- ✅ `api.uploadVideo(formData)` - upload plików wideo

### 4. Komponenty z obsługą błędów

#### Toast Notifications
Wszystkie funkcje API używają systemu powiadomień Toast:

```tsx
import { useStore } from '../src/store';

const { showToast } = useStore();
showToast('Message', 'success'); // lub 'error'
```

#### Loading States
Wszystkie komponenty mają wbudowane loading states:

- AuthPage: `isLoginLoading`, `isSignupLoading`
- VideoFeed: `isLoading` z spinner
- VideoUploader: `isUploading` z progress bar

### 5. Nowe komponenty

#### VideoFeed.tsx
```tsx
import VideoFeed from '../components/VideoFeed';

<VideoFeed className="my-feed" />
```

#### VideoUploader.tsx
```tsx  
import VideoUploader from '../components/VideoUploader';

<VideoUploader 
  onUploadSuccess={(data) => console.log('Uploaded:', data)}
  className="uploader"
/>
```

### 6. Testowanie połączenia

1. Uruchom backend: `cd backend && npm run dev`
2. Uruchom frontend: `npm run dev` 
3. Sprawdź DevTools Network tab przy logowaniu/rejestracji
4. Sprawdź czy requesty trafiają do `http://localhost:5000/api/*`

### 7. Fallback na Mock Data

Jeśli backend nie działa, system automatycznie przełączy się na mock data. 
Status można sprawdzić w health endpoincie:

```json
{
  "status": "OK",
  "database": {
    "isConnected": false,
    "connectionState": "disconnected"
  }
}
```

### 8. Debugowanie

Sprawdź w DevTools Console:
- Błędy połączenia: `Failed to fetch` 
- Błędy API: `API Error: 404 Not Found`
- Błędy autentyfikacji: `Authorization header missing`

### 9. Endpoint Mapping

| Frontend Function | Backend Endpoint | Method |
|------------------|------------------|---------|
| `api.login()` | `/api/auth/login` | POST |
| `api.register()` | `/api/auth/register` | POST |
| `api.logout()` | `/api/auth/logout` | POST |
| `api.refresh()` | `/api/auth/refresh` | POST |
| `api.getBusinesses()` | `/api/businesses` | GET |
| `api.getFeed()` | `/api/videos/feed` | GET |
| `api.uploadVideo()` | `/api/videos/upload` | POST |