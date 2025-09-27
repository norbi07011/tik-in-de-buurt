# 🚀 Deployment Guide - Tik in de Buurt

## ✅ GitHub Repository
Repository successfully deployed at: **https://github.com/norbi07011/tik-in-de-buurt**

## 📋 Next Steps

### 1. Environment Variables Setup
Create `.env` file in root directory:
```bash
# Copy from .env.example and fill in your values
MONGODB_URI=your_mongodb_connection_string
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

Create `backend/.env.development`:
```bash
# Copy from backend/.env.example and fill in your values
MONGODB_URI=your_mongodb_connection_string
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### 2. Local Development
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Start backend server
npm run start:stable

# In another terminal, start frontend
cd ..
npm run dev
```

### 3. Netlify Deployment
1. Connect GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard:
   - `MONGODB_URI`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `VITE_GOOGLE_MAPS_API_KEY`
   - `NODE_VERSION=20`

### 4. Database Setup (MongoDB Atlas)
1. Login to MongoDB Atlas
2. Grant proper permissions to user `servicenorbs_db_user`
3. Ensure database `tik-in-de-buurt` exists
4. Whitelist Netlify IP addresses

### 5. Stripe Configuration
1. Add webhook endpoint: `https://your-app.netlify.app/api/webhooks/stripe`
2. Enable events: `payment_intent.succeeded`, `payment_intent.payment_failed`
3. Copy webhook secret to environment variables

## 🔧 Technical Stack
- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB Atlas
- **Payment**: Stripe
- **Maps**: Google Maps API
- **Deployment**: Netlify (Frontend) + Backend hosting required
- **Version Control**: Git + GitHub

## 📁 Project Structure
```
├── src/                 # Frontend source
├── components/          # React components
├── pages/              # Application pages
├── backend/            # Backend API server
├── public/             # Static assets
├── netlify.toml        # Netlify configuration
└── .gitignore          # Git exclusions
```

## 🛠️ Available Scripts
```bash
npm run dev             # Start development server
npm run build           # Build for production
npm run preview         # Preview production build
npm test               # Run tests
```

## 🔒 Security Notes
- All sensitive data excluded from Git
- Stripe keys properly separated (test/production)
- MongoDB connection secured with authentication
- CORS configured for production domains

## 📞 Support
For issues or questions, check the repository issues section or contact the development team.

---
**Repository**: https://github.com/norbi07011/tik-in-de-buurt
**Deployment Date**: $(Get-Date -Format "yyyy-MM-dd HH:mm")