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
        allowNull: true 
      },
      degree: { 
        type: DataTypes.STRING, 
        allowNull: true 
      },
      specialized_in: { 
        type: DataTypes.STRING, 
        allowNull: true 
      },
      max_pt1: {
        type: DataTypes.INTEGER,
        defaultValue: 8,
        allowNull: false
      },
      max_pt2: {
        type: DataTypes.INTEGER,
        defaultValue: 8,
        allowNull: false
      },
      max_final_year: {
        type: DataTypes.INTEGER,
        defaultValue: 8,
        allowNull: false
      }
    });
  
    Mentor.associate = (models) => {
      Mentor.hasMany(models.Team, { foreignKey: 'mentor_id', as: 'Teams' });
    };
  
    return Mentor;
  };