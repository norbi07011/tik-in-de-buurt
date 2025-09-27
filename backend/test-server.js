const http = require('http');

const server = http.createServer((req, res) => {
  console.log('Request received:', req.url);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'OK', test: true }));
});

server.listen(5001, () => {
  console.log('Test server running on port 5001');
});

console.log('Script started');