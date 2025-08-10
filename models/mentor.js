module.exports = (sequelize, DataTypes) => {
  const Mentor = sequelize.define('Mentor', {
      name: { 
          type: DataTypes.STRING, 
          allowNull: false 
      },
      email: { 
          type: DataTypes.STRING, 
          unique: true, 
          allowNull: false 
      },
      password: { 
          type: DataTypes.STRING, 
          allowNull: false 
      },
      role: { 
          type: DataTypes.STRING, 
          defaultValue: 'mentor' 
      },
      profile_pic_url: { 
          type: DataTypes.STRING, 
          allowNull: true // Assuming this can be optional
      },
      degree: { 
          type: DataTypes.STRING, 
          allowNull: true // Assuming this can be optional
      },
      specialized_in: { 
          type: DataTypes.STRING, 
          allowNull: true // Assuming this can be optional
      }
  });

  // Define associations
  Mentor.associate = (models) => {
      Mentor.hasMany(models.Team, { foreignKey: 'mentor_id', as: 'Teams' });
  };

  return Mentor;
};