require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const { connectDB, sequelize } = require('./config/database');
const db = require('./models');
const app = express();

// 1. GLOBAL MIDDLEWARE
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// 2. SESSION SETUP (Must be before Passport)
app.use(session({
  secret: 'secret_key_change_this',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true only if using HTTPS/Production
}));

// 3. PASSPORT INITIALIZATION
app.use(passport.initialize());
app.use(passport.session());

// 4. ROUTES (Must be after Passport/Session)
app.use('/auth', require('./routes/auth'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/notes', require('./routes/notes'));

// 5. DATABASE & SERVER START
connectDB();
sequelize.sync({ alter: true }).then(() => {
  console.log("Database tables synced!");
  app.listen(5000, () => console.log('🚀 Server running on port 5000'));
});

//6. Image uploads
app.use('/uploads', express.static('uploads'));