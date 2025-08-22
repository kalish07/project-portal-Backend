const express = require('express');
const router = express.Router();

// ==================== CONTROLLERS ====================
const {
  // Student controllers
  registerStudent,
  loginStudent,
  getStudentTeam,
  getStudentProjects,
  addProjectDetails,
  deleteProject,
  getStudentProfile,
  getStudentAnnouncements,
  submitReport,
  submitPPT,
  verifyCurrentPassword,
  changePassword,
  updateStudentPassword,
  updateProfilePic,
  ppu
} = require('../controllers/studentControllers');



const {
  // Team controllers
  getStudents,
  getMentors,
  requestMentor,
  getTeamDetails,
  sendInvitation,
  getAllInvitations,
  acceptInvitation,
  getUserTeams,
  rejectInvitation,
  getTeamAndProjectsByUserId,
  withdrawInvitation,
  withdrawMentorRequest
} = require('../controllers/teamControllers');

const {
  // Project controllers
  requestProject,
  withdrawProjectRequest,
  submitDocumentLink
} = require('../controllers/projectControllers');

// ==================== MIDDLEWARE ====================
const upload = require('../middleware/uploadMiddleware');
const { authenticate, authorize} = require('../middleware/authMiddleware');

// ==================== AUTH ROUTES ====================
router.post('/register', registerStudent);
router.post('/login', loginStudent);

// ==================== STUDENT PROFILE ====================
router.get('/profile/:id', authenticate, getStudentProfile);
router.get('/announcements', authenticate, getStudentAnnouncements);
router.post('/change-password', updateStudentPassword);
router.post("/profile-pic", authenticate, ppu.single("profile_pic"), updateProfilePic);

// ==================== STUDENT PROJECT ROUTES ====================
router.get('/projects/:studentId', authenticate, getStudentProjects);
router.post('/projects', authenticate, upload.single('abstract'), addProjectDetails);
router.delete('/projects/:projectId', authenticate, deleteProject);

// Submit Google Drive document link (abstract/report/ppt)
router.post('/documents/:id/submit-link', authenticate, submitDocumentLink);

// Project idea request
router.post('/request-project', authenticate, authorize(['student']), requestProject);

// Withdraw a project request
router.delete('/projects/:projectId/withdraw', authenticate, authorize(['student']), withdrawProjectRequest);

// ==================== TEAM MANAGEMENT ====================
router.get('/team/:studentId', authenticate, getStudentTeam);
router.get('/getstudents', authenticate, getStudents);
router.post('/send-invitation', authenticate, sendInvitation);
router.get('/invitations', authenticate, getAllInvitations);
router.post('/invitations/:invitationId/accept', authenticate, acceptInvitation);
router.post('/invitations/:invitationId/reject', authenticate, rejectInvitation);
router.delete('/invitations/:invitationId/withdraw', authenticate, withdrawInvitation);
router.get('/teams', authenticate, getUserTeams);
router.get('/team-projects/user', authenticate, getTeamAndProjectsByUserId);

// ==================== MENTOR MANAGEMENT ====================
router.get('/mentors', authenticate, getMentors);
router.post('/request-mentor', authenticate, requestMentor);
router.delete('/mentor-request/withdraw', authenticate, withdrawMentorRequest);

module.exports = router;
