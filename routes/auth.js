const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const models = require('../models');
const dotenv = require('dotenv');

dotenv.config();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Student Login
router.post('/student/login', async (req, res) => {
  const { register_number, password } = req.body;
  try {
    const student = await models.Student.findOne({ where: { register_number } });
    if (!student) return res.status(401).json({ error: 'Invalid registration number or password' });

    const isValidPassword = await bcrypt.compare(password, student.password);
    if (!isValidPassword) return res.status(401).json({ error: 'Invalid registration number or password' });

    const token = jwt.sign({ userId: student.id, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, role: 'student', name: student.name, regNumber: student.register_number, mail: student.email, studentId: student.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Admin Login
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await models.Mentor.findOne({ where: { email } });
    if (!admin) return res.status(401).json({ error: 'Invalid email or password' });

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ userId: admin.id, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, role: 'admin' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
