const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;

// Local Development Proxy
// Auth Service -> 3001
app.use('/api/v1/auth', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
}));

// Placeholder for other services
// app.use('/api/v1/users', createProxyMiddleware({ target: 'http://localhost:3002', changeOrigin: true }));

app.listen(PORT, () => {
  console.log(`🚀 Gateway proxy running at http://localhost:${PORT}`);
});
