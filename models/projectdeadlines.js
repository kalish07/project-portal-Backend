module.exports = (sequelize, DataTypes) => {
    const ProjectDeadline = sequelize.define('ProjectDeadline', {
      project_type: {
        type: DataTypes.ENUM('ProfessionalTraining1', 'ProfessionalTraining2', 'FinalYearProject'),
        allowNull: false,
        comment: "Indicates the project category."
      },
      department: {
        type: DataTypes.ENUM('Cybersecurity', 'AI/ROBOTICS', 'AI/ML', 'Blockchain'),
        allowNull: false,
        comment: "Department associated with the project."
      },
      semester: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 8,
        },
        comment: "Semester (1-8) when the project is applicable."
      },
      deadline: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: "Deadline for project submission."
      }
    }, {
      tableName: 'project_deadlines',
      timestamps: true, // Adds createdAt and updatedAt fields
    });
  
    return ProjectDeadline;
  };
  