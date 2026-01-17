module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define('Group', {
    name: { type: DataTypes.STRING, allowNull: false },
    inviteCode: { type: DataTypes.STRING, unique: true } // For colleagues to join
  });

  Group.associate = (models) => {
    Group.belongsTo(models.User, { as: 'Creator' }); // The student who made the group
    Group.hasMany(models.Note, { onDelete: 'CASCADE' });
    Group.belongsToMany(models.User, { through: 'GroupMember' });
  };

  return Group;
};