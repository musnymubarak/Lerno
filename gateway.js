const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS for frontend
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
}));

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

// Auth Service -> 3011 (Moved from 3001 to avoid conflict with frontend)
app.use('/api/v1/auth', createProxyMiddleware({
  target: 'http://localhost:3011',
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

// Booking Service -> 3004
app.use('/api/v1/bookings', createProxyMiddleware({
  target: 'http://localhost:3004',
  changeOrigin: true,
}));

// Payment Service -> 3005
app.use('/api/v1/payments', createProxyMiddleware({
  target: 'http://localhost:3005',
  changeOrigin: true,
}));

// Notification Service -> 3006
app.use('/api/v1/notifications', createProxyMiddleware({
  target: 'http://localhost:3006',
  changeOrigin: true,
}));

// Review Service -> 3007
app.use('/api/v1/reviews', createProxyMiddleware({
  target: 'http://localhost:3007',
  changeOrigin: true,
}));

// Message Service -> 3008
app.use('/api/v1/messages', createProxyMiddleware({
  target: 'http://localhost:3008',
  changeOrigin: true,
}));

app.listen(PORT, () => {
  console.log(`🚀 Gateway proxy running at http://localhost:${PORT}`);
});
