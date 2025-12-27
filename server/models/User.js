module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    microsoftId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true }
    },
    name: DataTypes.STRING
  });

  User.associate = (models) => {
    User.hasMany(models.Subject);
    User.hasMany(models.Note);
  };

  return User;
};