# 🇳🇱 Nederlandse Betalingssysteem - Documentatie

## Overzicht
Het Nederlandse betalingssysteem is volledig geïntegreerd met EUR als primaire valuta en ondersteunt alle populaire betaalmethoden in Nederland.

## ✨ Ondersteunde Betaalmethoden

### 1. iDEAL (Primaire keuze)
- **Kosten**: 0.29% per transactie
- **Ondersteunde banken**:
  - 🟢 ABN AMRO (ABNANL2A)
  - 🧡 ING Bank (INGBNL2A) 
  - 🔵 Rabobank (RABONL2U)
  - 💜 SNS Bank (SNSBNL2A)
  - 🌱 ASN Bank (ASNBNL21)
  - 🌈 Bunq (BUNQNL2A)
  - ⚡ Knab (KNABNL2H)
  - 🔄 Revolut (REVOLT21)
  - 🎯 N26 (NTSBDEB1)

### 2. Credit Card
- **Kosten**: 1.4% + €0.25
- **Ondersteunde kaarten**: Visa, Mastercard, American Express

### 3. Bancontact
- **Kosten**: 0.5% per transactie
- **Voor**: Belgische klanten

### 4. SOFORT Überweisung
- **Kosten**: 0.9% + €0.25
- **Voor**: Duitse/Oostenrijkse klanten

### 5. SEPA Overboeking
- **Kosten**: 0.8% per transactie
- **Vereist**: Geldig IBAN nummer

### 6. PayPal
- **Kosten**: 2.9% + €0.35
- **Voor**: Internationale klanten

## 🔧 Technische Implementatie

### Backend Routes
```typescript
// Locatie: backend/src/routes/payments.ts
POST /api/payments/create-payment-intent
POST /api/payments/confirm-payment
GET /api/payments/methods
```

### Frontend Componenten
```typescript
// DutchBankSelector.tsx - Bank selectie voor iDEAL
// PaymentMethodSelector.tsx - Hoofd betaalmethod selector
// dutchPaymentService.ts - Service voor betaalverwerking
```

### Valuta Ondersteuning
- **Primaire valuta**: EUR (Euro)
- **Formattering**: Nederlandse locale (€99,99)
- **BTW**: Automatisch berekend voor Nederlandse markt

## 🚀 Demo
Bekijk de demo op: `http://localhost:3333/dutch-payments-demo.html`

## 📋 Installatie en Setup

### Backend Dependencies
```bash
cd backend
npm install stripe express cors dotenv
```

### Frontend Dependencies
```bash
npm install lucide-react
```

### Environment Variables
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🔐 Beveiliging
- SSL-versleuteling voor alle transacties
- IBAN validatie voor SEPA betalingen
- Stripe PCI DSS compliance
- iDEAL beveiligingsstandaarden

## 📊 Kosten Vergelijking
| Methode | Kosten | Beste voor |
|---------|---------|-----------|
| iDEAL | €0.29 | Nederlandse klanten |
| SEPA | 0.8% | Grote bedragen |
| Bancontact | 0.5% | Belgische klanten |
| SOFORT | 0.9% + €0.25 | Duitse klanten |
| Credit Card | 1.4% + €0.25 | Internationale klanten |
| PayPal | 2.9% + €0.35 | Online shoppers |

## 🌍 Internationalisatie
- Nederlandse taal interface
- EUR valuta formatting
- Lokale betaalvoorkeuren
- Nederlandse bankintegratie

## 📞 Support
Voor technische vragen over het betalingssysteem, raadpleeg de documentatie of neem contact op met het development team.

---
*Laatste update: Januar 2025*
*Versie: 1.0 - Nederlandse Markt*