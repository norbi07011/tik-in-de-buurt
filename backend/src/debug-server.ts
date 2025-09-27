import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

console.log('🚀 Starting debug server...');

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

try {
  // Basic middleware
  app.use(cors());
  app.use(express.json());

  console.log('✅ Middleware configured');

  // Simple health check
  app.get('/health', (req, res) => {
    console.log('🔍 Health check requested');
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      port: PORT 
    });
  });

  console.log('✅ Routes configured');

  // Start server
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Debug server listening on port ${PORT}`);
    console.log(`🔗 Health check: http://127.0.0.1:${PORT}/health`);
  });

  server.on('error', (error) => {
    console.error('❌ Server error:', error);
  });

  console.log('✅ Server setup complete');
} catch (error) {
  console.error('❌ Error during setup:', error);
}

export default app;