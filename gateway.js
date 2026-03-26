const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;

// Block internal routes from external access
app.use((req, res, next) => {
  if (req.path.includes('/internal')) {
    return res.status(403).json({
      success: false,
      message: 'Access to internal routes is prohibited',
    });
  }
  next();
});

// Auth Service -> 3001
app.use('/api/v1/auth', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
}));

// User Service -> 3002
app.use('/api/v1/users', createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
}));

// Tutor Service -> 3003
// Handling both /tutors and /subjects for Port 3003
app.use(['/api/v1/tutors', '/api/v1/subjects'], createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
}));

app.listen(PORT, () => {
  console.log(`🚀 Gateway proxy running at http://localhost:${PORT}`);
});
