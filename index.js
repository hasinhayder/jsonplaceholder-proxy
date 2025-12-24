const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: '*',
    methods: ['GET'],
  })
);

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'jsonplaceholder-proxy',
  });
});

// Helper functions
function cacheKey(url) {
  return crypto.createHash('sha256').update(url).digest('hex');
}

function getCached(key, ttlSeconds = 60) {
  const row = db
    .prepare('SELECT response, created_at FROM cache WHERE key = ?')
    .get(key);

  if (!row) return null;

  const age = (Date.now() - row.created_at) / 1000;
  if (age > ttlSeconds) return null;

  return JSON.parse(row.response);
}

function setCache(key, data) {
  db.prepare(`
    INSERT OR REPLACE INTO cache (key, response, created_at)
    VALUES (?, ?, ?)
  `).run(key, JSON.stringify(data), Date.now());
}

// Generic proxy with cache
app.get('/:resource/:id?', async (req, res) => {
  const { resource, id } = req.params;

  const upstreamUrl = id
    ? `https://jsonplaceholder.typicode.com/${resource}/${id}`
    : `https://jsonplaceholder.typicode.com/${resource}`;

  const key = cacheKey(upstreamUrl);

  // 1️⃣ Try cache
  const cached = getCached(key, 120);
  if (cached) {
    return res.json({
      source: 'cache',
      data: cached,
    });
  }

  // 2️⃣ Fetch upstream
  const response = await fetch(upstreamUrl);
  const data = await response.json();

  // 3️⃣ Save cache
  setCache(key, data);

  res.json({
    source: 'upstream',
    data,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
