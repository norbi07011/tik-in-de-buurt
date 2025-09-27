import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Ultra minimal server running on port ${PORT}`);
  console.log(`🔗 Health check: http://127.0.0.1:${PORT}/health`);
});

export default app;