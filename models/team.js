module.exports = (sequelize, DataTypes) => {
  const Team = sequelize.define('Team', {
    student1_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Students',
        key: 'id'
      },
      allowNull: false
    },
    student2_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Students',
        key: 'id'
      },
      allowNull: true
    },
    mentor_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Mentors',
        key: 'id'
      },
      allowNull: true
    },
    current_semester: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    }
  });

  Team.associate = (models) => {
    Team.belongsTo(models.Student, { foreignKey: 'student1_id', as: 'Student1' });
    Team.belongsTo(models.Student, { foreignKey: 'student2_id', as: 'Student2' });
    Team.belongsTo(models.Mentor, { foreignKey: 'mentor_id' });

    Team.hasMany(models.ProfessionalTraining1, { foreignKey: 'team_id', as: 'ProfessionalTrainings1' });
    Team.hasMany(models.ProfessionalTraining2, { foreignKey: 'team_id', as: 'ProfessionalTrainings2' });
    Team.hasMany(models.FinalYearProject, { foreignKey: 'team_id', as: 'FinalYearProjects' });
  };

  // Sync semester when team is created
  Team.beforeCreate(async (team, options) => {
    const Student = sequelize.models.Student;
    const student1 = await Student.findByPk(team.student1_id);
    team.current_semester = student1?.current_semester || 5;
  });

  return Team;
};
