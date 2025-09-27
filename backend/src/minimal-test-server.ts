import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8080;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('[Health] Check requested');
  res.status(200).json({ 
    ok: true,
    db: 'mock',
    status: 'OK', 
    server: 'running',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎯 MINIMAL SERWER DZIAŁA NA PORCIE ${PORT}!`);
  console.log(`[Server] listening on http://127.0.0.1:${PORT}`);
  console.log(`✅ Minimal server is running on port ${PORT}`);
});

// Keep server alive
console.log('🔄 Server staying alive...');
setInterval(() => {
  console.log('❤️ Server heartbeat:', new Date().toLocaleTimeString());
}, 30000);

process.on('SIGINT', () => {
  console.log('🔴 Server shutting down...');
  process.exit(0);
});