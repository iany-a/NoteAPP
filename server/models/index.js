const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const db = {};

// Import Models
db.User = require('./User')(sequelize, DataTypes);
db.Subject = require('./Subject')(sequelize, DataTypes);
db.Note = require('./Note')(sequelize, DataTypes);
db.SharedNote = require('./SharedNote')(sequelize, DataTypes);
db.Group = require('./Group')(sequelize, DataTypes);

// Run associations (This connects the Foreign Keys)
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;