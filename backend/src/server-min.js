require('dotenv').config();
const http = require('http');

const PORT = Number(process.env.PORT || 8080);
const HOST = '0.0.0.0';

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, pid: process.pid, now: Date.now() }));
    return;
  }
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('alive');
});

server.listen(PORT, HOST, () => {
  console.log(`[MIN] listening http://${HOST}:${PORT} pid=${process.pid}`);
});

// HARD: loguj wszystko co może ubić proces
process.on('exit', (code) => console.error('[MIN exit]', code));
process.on('SIGTERM', () => console.error('[MIN SIGTERM]'));
process.on('SIGINT', () => console.error('[MIN SIGINT]'));
process.on('uncaughtException', (e) => console.error('[MIN uncaughtException]', e));
process.on('unhandledRejection', (r) => console.error('[MIN unhandledRejection]', r));
server.on('close', () => console.error('[MIN server close]'));

// utrzymaj aktywne uchwyty, gdyby coś zamykało pętlę zdarzeń
setInterval(() => {}, 1 << 30);