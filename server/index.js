require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const { connectDB, sequelize } = require('./config/database');
const db = require('./models');
const app = express();

// 1. GLOBAL MIDDLEWARE
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// 2. SESSION SETUP (Must be before Passport)
app.use(session({
  secret: 'process.env.SESSION_SECRET',
  resave: false,
  saveUninitialized: false,
  cookie: {
<<<<<<< HEAD
    secure: true,      // Must be true for HTTPS (Render)
    sameSite: 'lax',  // CRITICAL: allows cookie to work between different .onrender.com URLs
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 
  }
=======
    // This is a safety switch for when you host it
    secure: process.env.NODE_ENV === "production", 
    sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax'
  } // Set to true only if using HTTPS/Production
>>>>>>> parent of 6426452 (connectivity hotfix)
}));

// 3. PASSPORT INITIALIZATION
app.use(passport.initialize());
app.use(passport.session());

// 4. ROUTES (Must be after Passport/Session)
app.use('/auth', require('./routes/auth'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/share', require('./routes/shareRoutes'));

// 5. DATABASE & SERVER START
connectDB();
sequelize.sync({ alter: true }).then(() => {
  console.log("Database tables synced!");
  app.listen(5000, () => console.log('🚀 Server running on port 5000'));
});

//6. Image uploads
app.use('/uploads', express.static('uploads'));