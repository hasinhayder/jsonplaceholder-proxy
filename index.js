const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * CORS configuration
 * - Allow all origins (OK for a public proxy)
 * - Restrict methods
 */
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

// Proxy routes
// Generic proxy for JSONPlaceholder
app.get('/:resource/:id?', async (req, res) => {
  const { resource, id } = req.params;

  const url = id
    ? `https://jsonplaceholder.typicode.com/${resource}/${id}`
    : `https://jsonplaceholder.typicode.com/${resource}`;

  const response = await fetch(url);
  const data = await response.json();

  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
