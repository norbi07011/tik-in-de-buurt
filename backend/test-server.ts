// Basic test server
import express from 'express';

const app = express();
const PORT = 8080;

app.use(express.json());

app.get('/health', (req, res) => {
    console.log('Health check requested');
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

app.get('/api/videos/analytics/trending', (req, res) => {
    console.log('Trending videos requested');
    res.json([
        {
            id: '1',
            title: 'Sample Video 1',
            views: 1500,
            likes: 150,
            category: 'entertainment'
        }
    ]);
});

app.post('/api/videos/:videoId/view', (req, res) => {
    const { videoId } = req.params;
    console.log(`View recorded for video ${videoId}`);
    res.json({ success: true, videoId });
});

app.post('/api/videos/:videoId/like', (req, res) => {
    const { videoId } = req.params;
    console.log(`Like recorded for video ${videoId}`);
    res.json({ success: true, videoId });
});

const server = app.listen(PORT, '127.0.0.1', () => {
    console.log(`\n🔥 TEST SERVER RUNNING!`);
    console.log(`🌍 URL: http://127.0.0.1:${PORT}`);
    console.log(`💚 Health: http://127.0.0.1:${PORT}/health`);
    console.log(`📊 Trending: http://127.0.0.1:${PORT}/api/videos/analytics/trending\n`);
});

server.on('error', (error) => {
    console.error('❌ Server error:', error);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});