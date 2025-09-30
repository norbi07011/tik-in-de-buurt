const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8080;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('✅ Health check requested');
  res.status(200).json({ 
    ok: true,
    db: 'mock',
    status: 'OK', 
    server: 'quick-backend',
    port: PORT,
    timestamp: new Date().toISOString(),
    environment: 'development'
  });
});

// Mock auth endpoints
app.post('/api/auth/register', (req, res) => {
  console.log('📝 Mock registration request');
  res.json({
    success: true,
    message: 'Mock registration successful',
    user: { id: 1, email: req.body.email }
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Mock login request');
  res.json({
    success: true,
    message: 'Mock login successful',
    token: 'mock-jwt-token-123',
    user: { id: 1, email: req.body.email }
  });
});

// Mock database will be initialized before endpoints

// Mock database for development
let businesses = [];
let users = [];

// GET business profile endpoint
app.get('/api/businesses/:id', (req, res) => {
  console.log('📋 Getting business profile:', req.params.id);
  
  // In real app, this would query database
  const business = businesses.find(b => b.id == req.params.id);
  
  if (!business) {
    return res.status(404).json({
      success: false,
      error: 'Business not found'
    });
  }
  
  res.json({
    success: true,
    business: business
  });
});

// GET all businesses endpoint (for browsing)
app.get('/api/businesses', (req, res) => {
  console.log('📋 Getting all businesses');
  
  const { category, city, limit = 10 } = req.query;
  let filteredBusinesses = [...businesses];
  
  if (category && category !== 'all') {
    filteredBusinesses = filteredBusinesses.filter(b => b.category === category);
  }
  
  if (city) {
    filteredBusinesses = filteredBusinesses.filter(b => 
      b.address.city.toLowerCase().includes(city.toLowerCase())
    );
  }
  
  // Sort by rating and creation date
  filteredBusinesses.sort((a, b) => {
    if (a.rating !== b.rating) return b.rating - a.rating;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  
  const paginatedBusinesses = filteredBusinesses.slice(0, parseInt(limit));
  
  res.json({
    success: true,
    businesses: paginatedBusinesses,
    total: filteredBusinesses.length,
    filters: { category, city, limit }
  });
});

// Enhanced business registration endpoint
app.post('/api/auth/register/business', (req, res) => {
  console.log('🏢 Business registration request:', req.body);
  const { 
    name, email, password, businessName, businessDescription, category,
    companyMotto, establishedYear, teamSize, spokenLanguages, paymentMethods,
    certifications, sustainabilityInfo, kvkNumber, btwNumber, iban,
    street, postalCode, city, phone, website, googleMapsUrl, otherLocations,
    instagram, facebook, twitter, linkedin, tiktokUrl, otherLinkUrl
  } = req.body;
  
  // Enhanced validation
  if (!name || !email || !password || !businessName) {
    res.status(400).json({
      success: false,
      error: 'Name, email, password and business name are required'
    });
    return;
  }

  if (!email.includes('@')) {
    res.status(400).json({
      success: false,
      error: 'Please provide a valid email address'
    });
    return;
  }

  if (!password || password.length < 6) {
    res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long'
    });
    return;
  }

  // Check if email already exists
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    res.status(400).json({
      success: false,
      error: 'Email address is already registered'
    });
    return;
  }

  // Create comprehensive business profile
  const businessId = Date.now() + 1;
  const userId = Date.now();
  
  const business = {
    id: businessId,
    nameKey: businessName,
    descriptionKey: businessDescription || '',
    category: category || 'other',
    owner: name,
    ownerId: userId,
    
    // Basic info
    companyMotto: companyMotto || '',
    establishedYear: establishedYear || null,
    teamSize: teamSize || '',
    spokenLanguages: spokenLanguages || '',
    paymentMethods: paymentMethods || '',
    certifications: certifications || '',
    sustainabilityInfo: sustainabilityInfo || '',
    
    // Legal info
    kvkNumber: kvkNumber || '',
    btwNumber: btwNumber || '',
    iban: iban || '',
    
    // Address
    address: {
      street: street || '',
      postalCode: postalCode || '',
      city: city || 'Den Haag',
      country: 'Netherlands'
    },
    
    // Contact
    phone: phone || '',
    website: website || '',
    email: email,
    googleMapsUrl: googleMapsUrl || '',
    otherLocations: otherLocations || [],
    
    // Social media
    socialMedia: {
      instagram: instagram || '',
      facebook: facebook || '',
      twitter: twitter || '',
      linkedin: linkedin || '',
      tiktokUrl: tiktokUrl || '',
      otherLinkUrl: otherLinkUrl || ''
    },
    
    // System fields
    isVerified: false,
    rating: Math.random() * 2 + 3, // Random rating between 3-5 for demo
    reviewCount: Math.floor(Math.random() * 50),
    adCount: 0,
    logoUrl: '',
    coverImageUrl: '',
    openingHours: {
      monday: '09:00-17:00',
      tuesday: '09:00-17:00',
      wednesday: '09:00-17:00',
      thursday: '09:00-17:00',
      friday: '09:00-17:00',
      saturday: '10:00-16:00',
      sunday: 'closed'
    },
    services: [],
    subscriptionStatus: 'inactive',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const user = {
    id: userId,
    name: name,
    email: email,
    businessId: businessId,
    role: 'business_owner',
    isVerified: false,
    createdAt: new Date().toISOString()
  };

  // Store in mock database
  businesses.push(business);
  users.push(user);

  console.log('✅ Business registration successful:', {
    businessName: business.nameKey,
    category: business.category,
    owner: user.name,
    email: user.email,
    totalBusinesses: businesses.length
  });
  
  res.json({
    success: true,
    message: 'Business registered successfully',
    token: `mock-business-jwt-token-${userId}`,
    user: user,
    business: business
  });
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🎯 QUICK BACKEND URUCHOMIONY!`);
  console.log(`📡 Server: http://127.0.0.1:${PORT}`);
  console.log(`🌐 CORS: http://localhost:3000`);
  console.log(`✅ Quick backend running on port ${PORT}`);
  console.log(`🕒 Started at: ${new Date().toLocaleString('pl-PL')}`);
  console.log(`💾 Mock database ready (${businesses.length} businesses, ${users.length} users)`);
});