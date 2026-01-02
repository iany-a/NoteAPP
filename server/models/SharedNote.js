module.exports = (sequelize, DataTypes) => {
  const SharedNote = sequelize.define('SharedNote', {
    permission: {
      type: DataTypes.ENUM('read', 'write'),
      defaultValue: 'read'
    }
  });

  SharedNote.associate = (models) => {
    // Links the note to the colleague it was shared with
    SharedNote.belongsTo(models.User, { as: 'SharedWithUser' });
    SharedNote.belongsTo(models.Note);
  };

  return SharedNote;
};