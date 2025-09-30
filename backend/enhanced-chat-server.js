const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 8080;
const JWT_SECRET = 'development-secret-key-change-in-production';

// Create HTTP server and Socket.IO
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Mock databases
let businesses = [];
let users = [];
let conversations = [];
let messages = [];
let notifications = [];

// User socket connections
const userSockets = new Map(); // userId -> socket.id

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// =====================================================
// SOCKET.IO CONFIGURATION
// =====================================================

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication token required'));
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Invalid token'));
    }
    socket.userId = decoded.id;
    next();
  });
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`👤 User ${socket.userId} connected via WebSocket`);
  
  // Store user socket connection
  userSockets.set(socket.userId, socket.id);
  
  // Join user to their personal room
  socket.join(`user_${socket.userId}`);
  
  // Join user to their conversation rooms
  const userConversations = conversations.filter(conv => 
    conv.participants.includes(socket.userId)
  );
  userConversations.forEach(conv => {
    socket.join(`conversation_${conv.id}`);
  });

  // Handle joining conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`User ${socket.userId} joined conversation ${conversationId}`);
  });

  // Handle leaving conversation room
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
    console.log(`User ${socket.userId} left conversation ${conversationId}`);
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
      userId: socket.userId,
      conversationId: data.conversationId
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_stopped_typing', {
      userId: socket.userId,
      conversationId: data.conversationId
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`👤 User ${socket.userId} disconnected`);
    userSockets.delete(socket.userId);
  });
});

// =====================================================
// AUTHENTICATION ENDPOINTS
// =====================================================

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('✅ Health check requested');
  res.status(200).json({ 
    ok: true,
    db: 'mock',
    status: 'OK', 
    server: 'enhanced-chat-backend',
    port: PORT,
    timestamp: new Date().toISOString(),
    environment: 'development',
    businesses: businesses.length,
    users: users.length,
    conversations: conversations.length,
    messages: messages.length,
    socketConnections: userSockets.size
  });
});

// Enhanced business registration endpoint
app.post('/api/auth/register/business', async (req, res) => {
  console.log('🏢 Business registration request received');
  
  try {
    const {
      name, email, password, businessName, businessDescription, category,
      services, operatingHours, pricing, images, socialMedia,
      certifications, sustainabilityInfo, kvkNumber, btwNumber, iban,
      street, postalCode, city, phone, website, googleMapsUrl, otherLocations,
      targetAudience, specialOffers, languages, accessibilityFeatures,
      bookingInfo, paymentMethods, deliveryOptions
    } = req.body;

    // Enhanced validation
    if (!name || !email || !password || !businessName || !category) {
      console.log('❌ Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, password, businessName, category'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Validation failed - invalid email');
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Password validation
    if (password.length < 6) {
      console.log('❌ Validation failed - weak password');
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if email already exists
    const existingBusiness = businesses.find(b => b.email === email);
    if (existingBusiness) {
      return res.status(409).json({
        success: false,
        message: 'Business with this email already exists'
      });
    }

    // Create business object with all 27 fields
    const newBusiness = {
      id: `business_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      
      // Owner info
      name: name,
      email: email,
      password: password, // In production, this should be hashed
      
      // Business basic info
      businessName: businessName,
      category: category,
      descriptionKey: businessDescription || '',
      
      // Business details
      services: services || [],
      operatingHours: operatingHours || {},
      pricing: pricing || {},
      images: images || [],
      socialMedia: socialMedia || {},
      
      // Legal & certifications
      certifications: certifications || '',
      sustainabilityInfo: sustainabilityInfo || '',
      kvkNumber: kvkNumber || '',
      btwNumber: btwNumber || '',
      iban: iban || '',
      
      // Location info
      street: street || '',
      postalCode: postalCode || '',
      city: city || '',
      phone: phone || '',
      website: website || '',
      googleMapsUrl: googleMapsUrl || '',
      otherLocations: otherLocations || [],
      
      // Marketing & customer info
      targetAudience: targetAudience || '',
      specialOffers: specialOffers || [],
      languages: languages || ['nl'],
      accessibilityFeatures: accessibilityFeatures || [],
      
      // Service options
      bookingInfo: bookingInfo || {},
      paymentMethods: paymentMethods || [],
      deliveryOptions: deliveryOptions || {},
      
      // System fields
      verified: false,
      subscription: 'free',
      subscriptionStatus: 'inactive',
      rating: 0,
      reviewCount: 0,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
      
      // Status fields
      isActive: true,
      featured: false,
      promoted: false
    };

    // Add to mock database
    businesses.push(newBusiness);

    // Create user account for business owner
    const businessUser = {
      id: newBusiness.id,
      name: name,
      email: email,
      type: 'business',
      businessId: newBusiness.id,
      verified: false,
      createdAt: new Date().toISOString()
    };
    users.push(businessUser);

    console.log('✅ Business registration successful:', {
      businessId: newBusiness.id,
      businessName: newBusiness.businessName,
      email: newBusiness.email,
      category: newBusiness.category
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: businessUser.id, 
        email: businessUser.email, 
        type: 'business',
        businessId: newBusiness.id 
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    // Create welcome notification
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: businessUser.id,
      type: 'welcome',
      title: 'Witamy w Tik in de Buurt!',
      message: `Dziękujemy za rejestrację ${businessName}. Twoje konto zostało utworzone pomyślnie.`,
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(notification);

    // Send real-time notification if user is connected
    const userSocketId = userSockets.get(businessUser.id);
    if (userSocketId) {
      io.to(userSocketId).emit('notification', notification);
    }

    res.status(201).json({
      success: true,
      message: 'Business registered successfully',
      data: {
        token,
        user: businessUser,
        business: {
          id: newBusiness.id,
          businessName: newBusiness.businessName,
          category: newBusiness.category,
          email: newBusiness.email,
          verified: newBusiness.verified
        }
      }
    });

  } catch (error) {
    console.error('❌ Business registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: error.message
    });
  }
});


// =====================================================
// CHAT ENDPOINTS
// =====================================================

// Get user's conversations
app.get('/api/chat/conversations', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    const userConversations = conversations.filter(conv => 
      conv.participants.includes(userId)
    ).map(conv => {
      const lastMsg = messages
        .filter(msg => msg.conversationId === conv.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      
      const unreadCount = messages.filter(msg => 
        msg.conversationId === conv.id && 
        msg.senderId !== userId && 
        !msg.read
      ).length;

      return {
        ...conv,
        lastMessage: lastMsg ? lastMsg.content : null,
        lastMessageAt: lastMsg ? lastMsg.createdAt : conv.createdAt,
        unreadCount
      };
    });

    res.json({
      success: true,
      data: userConversations
    });
  } catch (error) {
    console.error('❌ Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
});

// Create new conversation
app.post('/api/chat/conversations', authenticateToken, (req, res) => {
  try {
    const { participants, type, title } = req.body;
    const userId = req.user.id;

    if (!participants || !participants.length) {
      return res.status(400).json({
        success: false,
        message: 'Participants are required'
      });
    }

    // Add current user to participants if not already included
    const allParticipants = [...new Set([userId, ...participants])];

    // Check if conversation already exists (for direct conversations)
    if (type !== 'group' && allParticipants.length === 2) {
      const existingConv = conversations.find(conv => 
        conv.type !== 'group' &&
        conv.participants.length === 2 &&
        conv.participants.every(p => allParticipants.includes(p))
      );

      if (existingConv) {
        return res.json({
          success: true,
          data: existingConv,
          message: 'Conversation already exists'
        });
      }
    }

    const newConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      participants: allParticipants,
      type: type || 'direct',
      title: title || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    conversations.push(newConversation);

    // Notify all participants via Socket.IO
    allParticipants.forEach(participantId => {
      const socketId = userSockets.get(participantId);
      if (socketId) {
        io.to(socketId).emit('conversation_created', newConversation);
      }
    });

    res.status(201).json({
      success: true,
      data: newConversation
    });
  } catch (error) {
    console.error('❌ Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation'
    });
  }
});

// Get conversation messages
app.get('/api/chat/conversations/:id/messages', authenticateToken, (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    // Check if user is participant
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this conversation'
      });
    }

    const conversationMessages = messages
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice((page - 1) * limit, page * limit)
      .reverse(); // Return in chronological order

    res.json({
      success: true,
      data: conversationMessages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: messages.filter(msg => msg.conversationId === conversationId).length
      }
    });
  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// Send message
app.post('/api/chat/conversations/:id/messages', authenticateToken, (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;
    const { content, type = 'text', mediaUrl } = req.body;

    if (!content && !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Message content or media URL is required'
      });
    }

    // Check if user is participant
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this conversation'
      });
    }

    // Get sender info
    const sender = users.find(u => u.id === userId);
    
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      senderId: userId,
      senderName: sender ? sender.name : 'Unknown User',
      content: content || '',
      type,
      mediaUrl,
      read: false,
      createdAt: new Date().toISOString()
    };

    messages.push(newMessage);

    // Update conversation
    conversation.updatedAt = new Date().toISOString();

    // Send real-time message to all participants
    io.to(`conversation_${conversationId}`).emit('new_message', newMessage);

    // Send push notifications to offline users
    conversation.participants.forEach(participantId => {
      if (participantId !== userId) {
        const notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: participantId,
          type: 'message',
          title: `Nowa wiadomość od ${newMessage.senderName}`,
          message: content.substring(0, 100),
          data: {
            conversationId,
            messageId: newMessage.id
          },
          read: false,
          createdAt: new Date().toISOString()
        };
        notifications.push(notification);

        // Send notification via Socket.IO if user is online
        const socketId = userSockets.get(participantId);
        if (socketId) {
          io.to(socketId).emit('notification', notification);
        }
      }
    });

    res.status(201).json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    console.error('❌ Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// Mark messages as read
app.patch('/api/chat/conversations/:id/read', authenticateToken, (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;

    // Check if user is participant
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this conversation'
      });
    }

    // Mark messages as read
    const updatedMessages = messages.filter(msg => 
      msg.conversationId === conversationId && 
      msg.senderId !== userId && 
      !msg.read
    );

    updatedMessages.forEach(msg => {
      msg.read = true;
      msg.readAt = new Date().toISOString();
    });

    // Notify other participants about read status
    io.to(`conversation_${conversationId}`).emit('messages_read', {
      conversationId,
      userId,
      messageIds: updatedMessages.map(msg => msg.id)
    });

    res.json({
      success: true,
      data: {
        markedAsRead: updatedMessages.length
      }
    });
  } catch (error) {
    console.error('❌ Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
});

// =====================================================
// NOTIFICATION ENDPOINTS
// =====================================================

// Get user notifications
app.get('/api/notifications', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const userNotifications = notifications
      .filter(notif => notif.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice((page - 1) * limit, page * limit);

    const unreadCount = notifications.filter(notif => 
      notif.userId === userId && !notif.read
    ).length;

    res.json({
      success: true,
      data: userNotifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: notifications.filter(notif => notif.userId === userId).length
      }
    });
  } catch (error) {
    console.error('❌ Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', authenticateToken, (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const notification = notifications.find(notif => 
      notif.id === notificationId && notif.userId === userId
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;
    notification.readAt = new Date().toISOString();

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('❌ Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// =====================================================
// EXISTING BUSINESS ENDPOINTS
// =====================================================

// Get all businesses
app.get('/api/businesses', (req, res) => {
  console.log('📋 Businesses list requested');
  
  const { category, city, search, page = 1, limit = 10 } = req.query;
  let filteredBusinesses = [...businesses];

  // Apply filters
  if (category && category !== 'all') {
    filteredBusinesses = filteredBusinesses.filter(b => 
      b.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (city) {
    filteredBusinesses = filteredBusinesses.filter(b => 
      b.city && b.city.toLowerCase().includes(city.toLowerCase())
    );
  }

  if (search) {
    filteredBusinesses = filteredBusinesses.filter(b => 
      b.businessName.toLowerCase().includes(search.toLowerCase()) ||
      (b.descriptionKey && b.descriptionKey.toLowerCase().includes(search.toLowerCase()))
    );
  }

  // Sort by rating and creation date
  filteredBusinesses.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedBusinesses = filteredBusinesses.slice(startIndex, endIndex);

  console.log(`📊 Returning ${paginatedBusinesses.length} businesses (page ${page})`);

  res.json({
    success: true,
    data: paginatedBusinesses,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredBusinesses.length,
      totalPages: Math.ceil(filteredBusinesses.length / limit)
    }
  });
});

// Get business by ID
app.get('/api/businesses/:id', (req, res) => {
  const businessId = req.params.id;
  const business = businesses.find(b => b.id === businessId);
  
  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  // Increment view count
  business.views = (business.views || 0) + 1;
  business.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    data: business
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🎯 ENHANCED CHAT BACKEND URUCHOMIONY!`);
  console.log(`📡 Server: http://127.0.0.1:${PORT}`);
  console.log(`🌐 CORS: http://localhost:3000`);
  console.log(`✅ Enhanced chat backend running on port ${PORT}`);
  console.log(`🕒 Started at: ${new Date().toLocaleString('pl-PL')}`);
  console.log(`💾 Mock database ready (${businesses.length} businesses, ${users.length} users)`);
  console.log(`🔌 Socket.IO server ready for real-time communication`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   POST /api/auth/register/business`);
  console.log(`   GET  /api/businesses`);
  console.log(`   GET  /api/businesses/:id`);
  console.log(`   GET  /api/chat/conversations`);
  console.log(`   POST /api/chat/conversations`);
  console.log(`   GET  /api/chat/conversations/:id/messages`);
  console.log(`   POST /api/chat/conversations/:id/messages`);
  console.log(`   PATCH /api/chat/conversations/:id/read`);
  console.log(`   GET  /api/notifications`);
  console.log(`   PATCH /api/notifications/:id/read`);
});

module.exports = { app, server, io };