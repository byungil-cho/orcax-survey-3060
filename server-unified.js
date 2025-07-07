// server-unified.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3060;

// Middleware
app.use(cors());
app.use(express.json());

// DB Connection
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Unified route registration
const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes');
fs.readdirSync(routesDir).forEach(file => {
  const routePath = path.join(routesDir, file);
  if (fs.statSync(routePath).isFile() && file.endsWith('.js')) {
    const route = require(routePath);
    const routeName = file.replace('.js', '');
    app.use(`/api/${routeName}`, route);
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
