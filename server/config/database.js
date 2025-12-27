const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use the connection string from your .env file
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres', // or 'mysql'
  logging: false,      // keeps the terminal clean
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Required for most cloud DB providers like Render/AWS
    }
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connection to the relational database has been established.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

module.exports = { sequelize, connectDB };