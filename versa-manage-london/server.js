const express = require('express');
const https   = require('https');
const http    = require('http');
const path    = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Target API — set this to your main Railway URL ──────────────
// e.g. https://versa-london-production.up.railway.app
const API_BASE = process.env.MAIN_API_URL || 'https://versa-london-production.up.railway.app';

// Proxy all /api/* requests through to the main server
app.all('/api/*', (req, res) => {
  const url = new URL(API_BASE + req.path);
  if (req.query && Object.keys(req.query).length) {
    Object.entries(req.query).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const isHttps = url.protocol === 'https:';
  const lib = isHttps ? https : http;

  const options = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname + url.search,
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  };

  const proxyReq = lib.request(options, proxyRes => {
    res.status(proxyRes.statusCode);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', err => {
    console.error('Proxy error:', err.message);
    res.status(502).json({ error: 'Could not reach main server. Check MAIN_API_URL.' });
  });

  if (req.body && Object.keys(req.body).length) {
    proxyReq.write(JSON.stringify(req.body));
  }
  proxyReq.end();
});

// Serve manage.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manage.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Versa Manage running on port ${PORT}`));
