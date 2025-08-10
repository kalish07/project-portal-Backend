// models/invitation.js
module.exports = (sequelize, DataTypes) => {
  const Invitation = sequelize.define("Invitation", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    recipient_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "rejected"),
      defaultValue: "pending"
    }
  }, {
    tableName: "invitations",
    timestamps: true
  });

  Invitation.associate = (models) => {
    Invitation.belongsTo(models.Student, {
      foreignKey: "sender_id",
      as: "sender"
    });

    Invitation.belongsTo(models.Student, {
      foreignKey: "recipient_id",
      as: "recipient"
    });
  };

  return Invitation;
};
