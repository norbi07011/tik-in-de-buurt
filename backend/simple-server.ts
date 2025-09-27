import express from 'express';

const app = express();
const PORT = 8081;

app.get('/', (req, res) => {
  res.json({ message: 'Simple server works!' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Simple server running on port ${PORT}`);
});