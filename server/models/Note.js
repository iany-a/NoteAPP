module.exports = (sequelize, DataTypes) => {
  const Note = sequelize.define('Note', {
    title: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Untitled Note'
    },
    content: {
      type: DataTypes.TEXT, // Using TEXT allows for long Markdown strings
      allowNull: true
    }
  });

  Note.associate = (models) => {
    Note.belongsTo(models.Subject);
    Note.belongsTo(models.User);
    Note.belongsTo(models.Groups);
  };

  return Note;
};