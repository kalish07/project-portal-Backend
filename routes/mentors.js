const express = require('express');
const {
  registerMentor,
  loginMentor,
  getMentorProfile,
  approveTeam,
  getMentorTeams,
  getPendingTeamRequests,
  respondToInvitation,
  resetMentorPassword,
  getMentorProjects,
  getTeamProjectsByMentor,
  respondToProjectRequest // ✅ Add this import
} = require('../controllers/mentorControllers.js');
const { authenticateMentor } = require('../middleware/authMiddleware.js');

const router = express.Router();

// --- Auth ---
router.post('/register', registerMentor);
router.post('/login', loginMentor);

// --- Profile ---
router.get('/profile', authenticateMentor, getMentorProfile);
router.post('/reset-password', authenticateMentor, resetMentorPassword);

// --- Teams ---
router.get('/teams', authenticateMentor, getMentorTeams);
router.get('/invites', authenticateMentor, getPendingTeamRequests);
router.post('/invites/:id/respond', authenticateMentor, respondToInvitation);
router.put('/approve-team', authenticateMentor, approveTeam);

// --- Projects ---
router.get('/projects', authenticateMentor, getMentorProjects);
router.get('/team/:teamId/projects', authenticateMentor, getTeamProjectsByMentor);

// ✅ Respond to Project Request
router.post('/project-requests/:requestId/respond', authenticateMentor, respondToProjectRequest);

module.exports = router;
