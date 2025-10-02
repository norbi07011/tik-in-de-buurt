// 1) ENV
require('dotenv').config();

// 2) Importy
const express = require('express');
const cors = require('cors');

// 3) App
const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5178',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

// 4) MOCK / REAL przełącznik (bez łączenia do DB w MOCK)
const USE_MOCK = String(process.env.USE_MOCK_DATABASE).toLowerCase() === 'true';

// 5) Ping/health
app.get('/health', (_req, res) => {
  res.json({ ok: true, mode: USE_MOCK ? 'MOCK' : 'REAL' });
});

// 6) Prosta trasa login MOCK (na test)
if (USE_MOCK) {
  app.post('/auth/login', (req, res) => {
    const { email = '', password = '' } = req.body || {};
    const user = { _id: '1', id: '1', email, name: 'Mock User', businessId: '2' };
    const token = 'mock-token';
    res.json({ user, token });
  });

  app.post('/auth/register', (req, res) => {
    const { name = 'New User', email = '', password = '' } = req.body || {};
    const user = { _id: '99', id: '99', email, name, businessId: null };
    const token = 'mock-register-token';
    res.json({ user, token });
  });

  app.post('/auth/register/business', (req, res) => {
    const { name = 'Business Owner', email = '', businessName = 'New Business' } = req.body || {};
    const user = { _id: '100', id: '100', email, name, businessId: '200' };
    const business = { id: '200', name: businessName, ownerId: '100' };
    const token = 'mock-business-token';
    res.json({ user, business, token });
  });

  app.get('/auth/me', (req, res) => {
    // Mock auth verification - always return same user
    const user = { _id: '1', id: '1', email: 'test@example.com', name: 'Mock User', businessId: '2' };
    res.json({ user, token: 'mock-token' });
  });
}

// 7) Słuchanie
const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.BIND_HOST || '127.0.0.1';

const server = app.listen(PORT, HOST, () => {
  console.log(`[API] Listening on http://${HOST}:${PORT} (MOCK=${USE_MOCK})`);
});

// 8) Diagnostyka – złap wszystko co ubija proces
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('exit', (code) => {
  console.error('[process exit]', code);
});
server.on('error', (err) => {
  console.error('[server error]', err);
});