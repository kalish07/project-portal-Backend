module.exports = (sequelize, DataTypes) => {
  const ProfessionalTraining2 = sequelize.define('ProfessionalTraining2', {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    team_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Teams',
        key: 'id'
      },
      allowNull: false
    },
    mentor_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Mentors',
        key: 'id'
      },
      allowNull: true
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: false
    },
    abstract_url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    report_pdf_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ppt_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    demo_video_url: {  // Newly added field
      type: DataTypes.STRING,
      allowNull: true
    },
    approved_status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
      allowNull: false
    },
    zero_review_marks: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    first_review_marks: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    second_review_marks: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  });

  ProfessionalTraining2.associate = (models) => {
    ProfessionalTraining2.belongsTo(models.Team, { foreignKey: 'team_id' });
    ProfessionalTraining2.belongsTo(models.Mentor, { foreignKey: 'mentor_id' });
  };

  return ProfessionalTraining2;
};
