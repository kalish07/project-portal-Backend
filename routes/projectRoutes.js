const express = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { requestProject, approveProject, viewProjects} = require('../controllers/projectControllers');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Student submits a project request
router.post('/request-project', authenticate, authorize(['student']), requestProject);

// Mentor approves/rejects a project
router.patch('/approve-project/:id', authenticate, authorize(['mentor']), approveProject);

// Mentor views projects (filtered by project type)
router.get('/view-projects', authenticate, authorize(['mentor']), viewProjects);

module.exports = router;
