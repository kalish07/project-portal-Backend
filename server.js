const express = require('express');
const cors = require('cors');
const models = require('./models'); 
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const mentorRoutes = require('./routes/mentors');
const adminRoutes = require('./routes/admin');
const teamRoutes = require('./routes/teamRoutes');
const projectRoutes = require('./routes/projectRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));
app.use("/uploads/profile_pics", express.static("uploads/profile_pics"));

app.use('/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/admins', adminRoutes);
app.use('/api/team', teamRoutes);
app.use('/projects', projectRoutes);
app.use('/api/admin',adminRoutes);

const PORT = process.env.PORT || 3000;

models.sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection successful');
    return models.sequelize.sync(); // Sync models with the database
  })
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
  });