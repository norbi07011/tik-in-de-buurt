# 🧹 NETLIFY CLEANUP REPORT

**Date**: October 5, 2025, 20:00  
**Branch**: master-clean  
**Purpose**: Remove Netlify artifacts and prepare for clean deploy later

---

## 📋 INWENTARYZACJA PLIKÓW NETLIFY

### Pliki znalezione:

#### 1. `netlify.toml` (2020 bytes)
**Lokalizacja**: `/netlify.toml`  
**Zawartość**:
- Build command: `npm ci && npm run build`
- Publish dir: `dist`
- Node version: 20
- Environment vars: VITE_API_URL, VITE_USE_MOCK_API
- Redirects dla SPA routing
- Security headers (CSP, X-Frame-Options, etc.)
- Cache headers dla static assets
- API proxy do backend

**Decyzja**: 🗑️ **DELETE** - Utworzymy nowy czysty plik przed deployem

---

#### 2. `public/_headers` (566 bytes)
**Lokalizacja**: `/public/_headers`  
**Zawartość**:
```
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/*.png
  Cache-Control: public, max-age=31536000, immutable

/*.jpg
  Cache-Control: public, max-age=31536000, immutable

/*.svg
  Cache-Control: public, max-age=31536000, immutable

/index.html
  Cache-Control: public, max-age=0, must-revalidate
```

**Decyzja**: 🗑️ **DELETE** - Duplikuje konfigurację z netlify.toml, stworzymy nową przed deployem

---

#### 3. `public/_redirects` (639 bytes)
**Lokalizacja**: `/public/_redirects`  
**Zawartość**:
```
/*    /index.html   200

# Handle client-side routing
/discover    /index.html   200
/businesses    /index.html   200
/deals    /index.html   200
/wall    /index.html   200
/jobs    /index.html   200
/real-estate    /index.html   200
/auth    /index.html   200
/account    /index.html   200
/dashboard    /index.html   200
/business/*    /index.html   200
/freelancer/*    /index.html   200
/property/*    /index.html   200

# API redirects to backend (if needed)
/api/*    https://your-backend-url.com/api/:splat  200

# 404 fallback
/404    /index.html   404
```

**Decyzja**: 🗑️ **DELETE** - Duplikuje redirects z netlify.toml, zbędne dla lokalnego devu

---

#### 4. `.env.netlify.example` (661 bytes)
**Lokalizacja**: `/.env.netlify.example`  
**Decyzja**: ✅ **KEEP** - Przykładowy plik env, może być przydatny jako template

---

#### 5. `NETLIFY_DEPLOY.md` (2704 bytes)
**Lokalizacja**: `/NETLIFY_DEPLOY.md`  
**Decyzja**: ✅ **KEEP** - Dokumentacja może być przydatna, ale zaktualizujemy

---

### Pliki NIE znalezione (OK):
- ✅ `.netlify/` directory - nie istnieje
- ✅ `netlify/` directory - nie istnieje
- ✅ Skrypty netlify w package.json - brak

---

## 📊 PODSUMOWANIE

### Do usunięcia (3 pliki):
1. 🗑️ `netlify.toml` - zastąpimy czystym przed deployem
2. 🗑️ `public/_headers` - duplikat konfiguracji
3. 🗑️ `public/_redirects` - duplikat konfiguracji

### Do zachowania (2 pliki):
1. ✅ `.env.netlify.example` - template dla przyszłego deployu
2. ✅ `NETLIFY_DEPLOY.md` - dokumentacja (zaktualizowana)

### Całkowity rozmiar do usunięcia: ~3.2 KB

---

## 🔧 DIFF PLIKÓW DO USUNIĘCIA

### public/_headers vs netlify.toml
**Overlapping configuration:**
- Security headers: X-Frame-Options, X-XSS-Protection, X-Content-Type-Options, Referrer-Policy
- Cache headers: max-age dla JS/CSS/images
- **Wniosek**: netlify.toml ma bardziej szczegółową konfigurację CSP, _headers jest zbędny

### public/_redirects vs netlify.toml
**Overlapping configuration:**
- SPA fallback: `/* → /index.html 200`
- API proxy: `/api/* → backend`
- **Wniosek**: netlify.toml ma również te redirecty, _redirects jest zbędny

---

## ✅ AKCJE DO WYKONANIA

### 1. Aktualizacja .gitignore
Dodać:
```gitignore
# Netlify
netlify.toml
.netlify/
netlify/
```

### 2. Usunięcie plików
```powershell
Remove-Item netlify.toml
Remove-Item public\_headers
Remove-Item public\_redirects
```

### 3. Build test
```powershell
# Frontend
npm run build

# Backend
cd backend
npm run dev
# Test: curl http://localhost:8080/api/health
```

### 4. Aktualizacja README.md
Dodać sekcję "Deploy na Netlify" z checklist:
- [ ] Ustawić VITE_API_URL w panelu Netlify
- [ ] Dodać czysty netlify.toml (Wariant A z VITE_API_URL)
- [ ] Trigger deploy
- [ ] Zweryfikować health check

---

## 📝 CZYSTY netlify.toml (DO UŻYCIA PRZED DEPLOYEM)

```toml
# netlify.toml — DODAĆ DOPIERO PRZED DEPLOYEM

[build]
  command = "npm ci && npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

# Single Page App fallback
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# CSP – zezwól na połączenia HTTPS (backend ustawisz w VITE_API_URL)
[[headers]]
  for = "/*"
  [headers.values]
  Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self';"
```

**W Netlify Panel → Environment variables:**
```
VITE_API_URL = https://twoj-backend.example.com/api
```

---

**Status**: 📋 Raport gotowy  
**Następny krok**: Wykonaj usunięcie plików i testy
