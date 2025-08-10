module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define('Student', {
      student_name: { 
          type: DataTypes.STRING, 
          allowNull: false 
      },
      reg_number: { 
          type: DataTypes.STRING, 
          unique: true, 
          allowNull: false 
      },
      department_name: { 
          type: DataTypes.ENUM('Cyber-Security', 'AI/ROBOTICS', 'AI/ML', 'BLOCKCHAIN'), 
          allowNull: false 
      },
      current_semester: { 
          type: DataTypes.INTEGER, // Use INTEGER for semesters
          allowNull: false,
          validate: {
              isIn: {
                  args: [[5,6,7,8]], // Restrict to these values
                  msg: "Current semester must be 5,6,7 or 8."
              }
          }
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
      profile_pic_url: { 
          type: DataTypes.STRING, 
          allowNull: true // Assuming this can be optional
      }
  }, {
      // Adding timestamps
      timestamps: true,
  });

  // Define associations
  Student.associate = (models) => {
      Student.hasMany(models.Team, { foreignKey: 'student1_id', as: 'TeamsAsStudent1' });
      Student.hasMany(models.Team, { foreignKey: 'student2_id', as: 'TeamsAsStudent2' });
  };

  return Student;
};