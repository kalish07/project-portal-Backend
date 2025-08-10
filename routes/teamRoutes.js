const express = require("express");
const { 
  getStudents, 
  getMentors, 
  requestMentor, 
  getTeamDetails,
  sendInvitation,
  getIncomingInvitations,
  acceptInvitation,
  rejectInvitation,
  getUserTeams,
  getTeamAndProjectsByUserId // Import the new function
} = require("../controllers/teamControllers");
const { authenticate, authenticateMentor } = require("../middleware/authMiddleware");

const router = express.Router();

// ==================== STUDENT-RELATED ROUTES ====================

// ✅ Route to fetch students
router.get("/students", authenticate, getStudents);

// ✅ Route to send team invitation
router.post("/send-invitation", authenticate, sendInvitation);

// ✅ Route to accept an invitation
router.post("/invitations/:invitationId/accept", authenticate, acceptInvitation);

// ✅ Route to reject an invitation
router.post("/invitations/:invitationId/reject", authenticate, rejectInvitation);

// ==================== MENTOR-RELATED ROUTES ====================

// ✅ Route to fetch mentors
router.get("/mentors", authenticate, getMentors);

// ✅ Route to request a mentor
router.post("/request-mentor", authenticate, requestMentor);

// ==================== TEAM-RELATED ROUTES ====================

// ✅ Route to fetch team details and associated projects
router.get('/team-projects/user', authenticate, getTeamAndProjectsByUserId);


// ✅ Route to fetch teams for the authenticated user
router.get("/teams", authenticate, getUserTeams); // New route for fetching user teams

module.exports = router;
