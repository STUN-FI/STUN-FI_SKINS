require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./src/config/db');

const app = express();
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options(/.*/, cors());
app.use(express.json({ limit: '20mb' }));

app.use((req, res, next) => {
  console.log(`REQ ${req.method} ${req.originalUrl}`);
  next();
});

connectDB();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', brand: 'STUN-FI SKINS' });
});

// Mount orders routes
const orderRoutes = require('./src/routes/orderRoutes');
app.use('/api/orders', orderRoutes);

const journalRoutes = require('./src/routes/journalRoutes');
app.use('/api/journal', journalRoutes);

app.get('/api/orders/debug', (req, res) => {
  res.json({ success: true, message: 'debug route active' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
