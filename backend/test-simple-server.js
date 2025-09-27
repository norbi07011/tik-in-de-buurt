// Simple test server to verify port binding
import express from 'express';

const app = express();
const PORT = 8080;

app.get('/', (req, res) => {
  res.json({ message: 'Simple test server works', port: PORT });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, db: 'mock' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Test] Server running on http://0.0.0.0:${PORT}`);
  console.log(`[Test] Server address:`, server.address());
});

server.on('error', (error) => {
  console.error('[Test] Server error:', error);
});

process.on('SIGINT', () => {
  console.log('\n[Test] Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});