const db = require('./models');

// { force: false } ensures you don't delete your data every time you restart
db.sequelize.sync({ force: false }).then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
});

const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const { connectDB, sequelize } = require('./config/database');
require('./routes/auth'); // Runs your Passport strategy logic

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Session config (needed for Passport)
app.use(session({
  secret: 'secret_key_change_this',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Connect and Sync Database
connectDB();
sequelize.sync({ force: false }).then(() => {
  console.log("Database tables synced!");
});

// Routes
app.use('/auth', require('./routes/auth'));
// app.use('/api/subjects', require('./routes/subjects'));

app.listen(5000, () => console.log('🚀 Server running on port 5000'));