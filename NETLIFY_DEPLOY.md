# 🚀 Netlify Deployment Guide for Tik-in-de-Buurt

## 📋 Quick Setup

### 1. Repository Connection
1. Connect your GitHub repository to Netlify
2. Set build settings:
   - **Build command**: `npm ci && npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `20`

### 2. Environment Variables
Set these in Netlify Dashboard → Site settings → Environment variables:

#### Required Variables:
```
VITE_API_URL=https://your-backend-domain.com/api
VITE_USE_MOCK_API=false
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

#### Optional Variables:
```
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_DEFAULT_LAT=52.3676
VITE_DEFAULT_LNG=4.9041
VITE_DEFAULT_ZOOM=12
VITE_MAPS_DEFAULT_RADIUS=5000
VITE_ENABLE_LOCATION_TRACKING=true
```

### 3. Backend Configuration
- Deploy your backend separately (Railway, Heroku, etc.)
- Update `VITE_API_URL` with your backend URL
- Ensure CORS is configured for your Netlify domain

### 4. Custom Domain (Optional)
1. Add your custom domain in Netlify
2. Update environment variables if needed
3. Configure DNS records

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 File Structure

```
├── netlify.toml          # Netlify configuration
├── public/
│   ├── _redirects        # SPA routing rules
│   └── _headers          # Security headers
├── .env.netlify.example  # Environment variables template
└── NETLIFY_DEPLOY.md     # This guide
```

## 🚨 Important Notes

1. **API Backend**: Make sure your backend is deployed and accessible
2. **Environment Variables**: Never commit real API keys to git
3. **CORS**: Configure your backend to allow requests from Netlify domain
4. **Stripe**: Use test keys for staging, live keys for production
5. **Google Maps**: Restrict API key to your domain for security

## 🐛 Troubleshooting

### Build Fails
- Check Node version (should be 20)
- Verify all dependencies are in package.json
- Check for TypeScript errors

### API Not Working
- Verify `VITE_API_URL` environment variable
- Check CORS configuration on backend
- Test API endpoints directly

### Maps Not Loading
- Verify `VITE_GOOGLE_MAPS_API_KEY` is set
- Check API key restrictions
- Ensure Maps JavaScript API is enabled

## 📞 Support

For deployment issues, check:
1. Netlify build logs
2. Browser console for errors
3. Network tab for failed requests
4. Backend logs for API issues