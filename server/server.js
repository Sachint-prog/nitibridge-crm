const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',') 
    : ['http://localhost:5173'];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());


// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nitibridge-crm';
mongoose.connect(MONGO_URI)
  .then(async () => {
      console.log('✅ Connected to MongoDB');
      // Seed initial admins if not exist
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount === 0) {
          const adminUserId = process.env.ADMIN_INITIAL_USER || 'admin1';
          const adminPass   = process.env.ADMIN_INITIAL_PASS || 'password123';
          const admin1 = new User({ role: 'admin', userId: adminUserId, password: adminPass, name: 'Super Admin' });
          const admin2 = new User({ role: 'admin', userId: 'admin2', password: 'password123', name: 'Super Admin 2' });
          await admin1.save();
          await admin2.save();
          console.log(`👤 Initial Admin Users Created (${adminUserId} & admin2)`);
      }
  })
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Routes
const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});