require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

const app = express();

/* ═══════════════════════════════════════════
   TRUST PROXY (for Render / Heroku / etc.)
   ═══════════════════════════════════════════ */
app.set('trust proxy', 1);    

/* ═══════════════════════════════════════════
   MIDDLEWARE
   ═══════════════════════════════════════════ */
app.use(cors());
app.use(express.json({ limit: '10mb' }));

/* ═══════════════════════════════════════════
   STATIC FILES — UPLOADS FOLDER
   ═══════════════════════════════════════════ */
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads folder');
}
app.use('/uploads', express.static(uploadsDir));

/* ═══════════════════════════════════════════
   RATE LIMITING
   ═══════════════════════════════════════════ */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

/* ═══════════════════════════════════════════
   ROUTES
   ═══════════════════════════════════════════ */
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.json({
    status: 'AURA AI Backend Running ✅',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

/* ═══════════════════════════════════════════
   STARTUP LOGS
   ═══════════════════════════════════════════ */
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔑 Groq key :', process.env.GROQ_API_KEY?.substring(0, 8) + '...');
console.log('🔑 Mongo URI:', process.env.MONGODB_URI?.substring(0, 30) + '...');
console.log('🔑 JWT Secret:', process.env.JWT_SECRET ? 'loaded ✅' : 'MISSING ❌');
console.log('📁 Uploads   :', uploadsDir);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

/* ═══════════════════════════════════════════
   DATABASE
   ═══════════════════════════════════════════ */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB error:', err.message);
    console.error('Full details:', err);
  });

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err);
});

/* ═══════════════════════════════════════════
   START SERVER
   ═══════════════════════════════════════════ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server on http://localhost:${PORT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});