const express = require('express');
const proxy   = require('express-http-proxy');
const path    = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

// Set MAIN_API_URL in Railway environment variables
// e.g. https://versa-manchester-production.up.railway.app
const API_BASE = process.env.MAIN_API_URL || '';

if (!API_BASE) {
  console.warn('WARNING: MAIN_API_URL environment variable not set. API calls will fail.');
}

// Proxy /api/* to the main server
app.use('/api', proxy(API_BASE, {
  proxyReqPathResolver: req => '/api' + req.url
}));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manage.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Versa Manage running on port ' + PORT));
