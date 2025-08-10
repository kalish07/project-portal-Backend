const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.PGDATABASE,
  process.env.PGUSER,
  process.env.PGPASSWORD,
  {
    host: process.env.PGHOST,
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  }
);

// Import models
const models = {
  Student: require('./student')(sequelize, Sequelize),
  Mentor: require('./mentor')(sequelize, Sequelize),
  Team: require('./team')(sequelize, Sequelize),
  ProfessionalTraining1: require('./professionalTraining1')(sequelize, Sequelize),
  ProfessionalTraining2: require('./professionalTraining2')(sequelize, Sequelize),
  FinalYearProject: require('./finalYearProject')(sequelize, Sequelize),
  Announcement: require('./announcement')(sequelize, Sequelize),
  DocumentFormats: require('./documentformats')(sequelize, Sequelize),
  ProjectDeadlines: require('./projectdeadlines')(sequelize, Sequelize), // ✅ fixed
  Invitation: require('./invitations')(sequelize, Sequelize) // ✅ fixed
};

// Setup associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Attach sequelize instance
models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;
