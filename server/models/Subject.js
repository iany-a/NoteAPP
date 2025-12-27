module.exports = (sequelize, DataTypes) => {
  const Subject = sequelize.define('Subject', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });

  Subject.associate = (models) => {
    // Links the folder to the specific student
    Subject.belongsTo(models.User);
    // If folder is deleted, notes go with it
    Subject.hasMany(models.Note, { onDelete: 'CASCADE' });
  };

  return Subject;
};