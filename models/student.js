const { Op, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
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
      type: DataTypes.ENUM(
        'Cyber Security',
        'AI/Robotics',
        'Blockchain',
        'AI/ML',
        'Data Science',
        'IoT',
        'AI'
      ),
      allowNull: false
    },
    current_semester: { 
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isIn: {
          args: [[5, 6, 7, 8, 9, 10]],
          msg: "Current semester must be 5, 6, 7 or 8."
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
      allowNull: true 
    }
  }, {
    timestamps: true
  });

  Student.associate = (models) => {
    Student.hasMany(models.Team, { foreignKey: 'student1_id', as: 'TeamsAsStudent1' });
    Student.hasMany(models.Team, { foreignKey: 'student2_id', as: 'TeamsAsStudent2' });
  };

  // Auto-sync team semester if student's semester changes
  Student.afterUpdate(async (student, options) => {
    const { Team, Student: StudentModel } = student.sequelize.models;

    const teams = await Team.findAll({
      where: {
        [Op.or]: [
          { student1_id: student.id },
          { student2_id: student.id }
        ]
      },
      include: [
        { model: StudentModel, as: 'Student1' },
        { model: StudentModel, as: 'Student2' }
      ]
    });

    for (const team of teams) {
      const s1 = team.Student1?.current_semester;
      const s2 = team.Student2?.current_semester;

      if (s1 === s2 && team.current_semester !== s1) {
        await team.update({ current_semester: s1 });
      } else if (s1 !== s2) {
        console.warn(`⚠️ Semester mismatch in team ${team.id}: ${s1} ≠ ${s2}`);
      }
    }
  });

  return Student;
};