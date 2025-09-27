<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Tik in de Buurt - Local Community Platform

A modern platform connecting local businesses and community members in the Netherlands.

View your app in AI Studio: https://ai.studio/apps/drive/1USJI04_WaLm3ioUinIMeh68vCDbLaciS

## Quick Start

**Prerequisites:** Node.js 16+, MongoDB (optional - can run in mock mode)

### Frontend Setup
1. Install dependencies: `npm install`
2. Set environment variables in `.env`:
   ```env
   VITE_API_URL=http://127.0.0.1:8080/api
   VITE_GEMINI_API_KEY=your-gemini-key-here
   ```
3. Run frontend: `npm run dev` (runs on http://localhost:3000)

### Backend Setup  
1. Go to backend: `cd backend`
2. Install dependencies: `npm install` 
3. Copy environment: `cp .env.example .env`
4. Run backend: `npm run dev` (runs on http://127.0.0.1:8080)

## MongoDB Atlas - Quick Setup (Manual for Developers)

1. Go to https://www.mongodb.com/cloud/atlas and create a free Free Tier account
2. Create a database user (username/password) and whitelist your IP (for dev you can temporarily use 0.0.0.0/0)
3. Copy the connection string from Atlas, e.g.:
   ```
   mongodb+srv://<USER>:<PASS>@<CLUSTER>.mongodb.net/tik-in-de-buurt?retryWrites=true&w=majority
   ```
4. In `/backend/.env` set:
   ```env
   DATABASE_URL=mongodb+srv://<USER>:<PASS>@<CLUSTER>.mongodb.net/tik-in-de-buurt
   ```
5. Start backend:
   ```bash
   npm install
   npm run dev
   ```
6. Check server health:
   ```bash
   curl.exe http://127.0.0.1:8080/health
   ```
   Expected: `{"ok":true,"db":"connected"}`
7. Seed sample data:
   ```bash
   npm run seed
   ```
8. Frontend `.env` should have:
   ```env
   VITE_API_URL=http://127.0.0.1:8080/api
   ```
9. Verify in browser DevTools that requests go to backend (200/JSON responses)

## Connection Tests

Test backend health:
```bash
curl.exe http://127.0.0.1:8080/health
```

Test port connectivity:
```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 8080
```

When database works, optionally connect with MongoDB shell:
```bash
mongosh "mongodb+srv://<USER>:<PASS>@<CLUSTER>.mongodb.net/tik-in-de-buurt"
```

Seed sample data:
```bash
cd backend
npm run seed
```
