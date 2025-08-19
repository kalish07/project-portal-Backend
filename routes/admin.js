const express = require('express');
const {
  createStudent,
  editStudent,
  deleteStudent,
  createMentor,
  editMentor,
  deleteMentor,
  getAllStudents,
  getAllMentors,
  getAllProjects,
  addAnnouncement,
  shiftStudents,
  getAllAnnouncements,
  deleteAnnouncement,
  changeMentorPassword,
  clearProjectFiles,
  deleteProject,
  getAllTeamsWithProgress,
  unassignAllTeamsInSemester,
  unassignTeam,
  getUnassignedStudents,
  forcePairStudents,
  getAvailableMentors,
  getTeamsWithoutMentors,
  assignMentorToTeam,
  resetStudentPassword,
  updateMentorCapacity,
  bulkUpdateMentorCapacities,
  changeMentorForTeam,
  updateAdminPassword,
  getDashboardStats,
  bulkUploadFromExcel,
  uploadProfilePictures,
  uploadProfileZipHandler
  
} = require('../controllers/adminControllers.js');

const { authenticateAdmin, authorize } = require('../middleware/authMiddleware.js');
const uploadpp = require("../middleware/uploadProfilePics");
const upload = require("../utils/upload.js");
const uploadZip = require("../middleware/uploadZip");
const router = express.Router();



//change password 
router.post('/update-password',authenticateAdmin, authorize(['admin']),updateAdminPassword);

//dashboard stats

router.get('/dashboard/stats', authenticateAdmin, authorize(['admin']), getDashboardStats);

// Student routes
router.get('/students', authenticateAdmin, authorize(['admin']), getAllStudents);
router.post('/createstudent', authenticateAdmin, authorize(['admin']), createStudent);
router.put('/students/:id', authenticateAdmin, authorize(['admin']), editStudent);
router.delete('/students/:id', authenticateAdmin, authorize(['admin']), deleteStudent);
router.put('/students/:id/reset-password', authenticateAdmin, authorize(['admin']), resetStudentPassword);

// Mentor routes
router.get('/mentors', authenticateAdmin, authorize(['admin']), getAllMentors);
router.post('/creatementor', authenticateAdmin, authorize(['admin']), createMentor);
router.put('/mentors/:id', authenticateAdmin, authorize(['admin']), editMentor);
router.delete('/mentors/:id', authenticateAdmin, authorize(['admin']), deleteMentor);
router.put('/mentors/:id/password', authenticateAdmin, authorize(['admin']), changeMentorPassword);
router.put("/mentors/:mentorId/capacity",authenticateAdmin,authorize(["admin"]), updateMentorCapacity);
router.put("/mentors/capacity/update-all",authenticateAdmin,authorize(["admin"]),bulkUpdateMentorCapacities);


//team routes
router.get("/all-teams", authenticateAdmin, authorize(["admin"]), getAllTeamsWithProgress);
router.patch('/team/:id/unassign', authenticateAdmin, authorize(['admin']), unassignTeam);
router.patch('/teams/unassign-all', authenticateAdmin, authorize(['admin']), unassignAllTeamsInSemester);
router.post('/teams/force-pair', authenticateAdmin, authorize(['admin']), forcePairStudents);
router.get('/unassigned-students', authenticateAdmin, authorize(['admin']), getUnassignedStudents);
router.get('/mentors/available', authenticateAdmin, authorize(['admin']), getAvailableMentors);
router.get('/teams/unassigned', authenticateAdmin, authorize(['admin']), getTeamsWithoutMentors);
router.post('/teams/:teamId/assign-mentor', authenticateAdmin, authorize(['admin']), assignMentorToTeam);
router.post('/teams/:teamId/change-mentor', authenticateAdmin, authorize(['admin']), changeMentorForTeam);






// Project routes
router.get('/projects', authenticateAdmin, authorize(['admin']), getAllProjects);
router.patch('/projects/:type/:id/clear-files', authenticateAdmin, authorize(['admin']), clearProjectFiles);
router.delete('/projects/:type/:id', authenticateAdmin, authorize(['admin']), deleteProject);

// Announcement routes
router.post('/add-announcements', authenticateAdmin, authorize(['admin']), addAnnouncement);
router.get('/announcements', authenticateAdmin, authorize(['admin']), getAllAnnouncements);
router.delete('/delete-announcement/:id', authenticateAdmin, authorize(['admin']), deleteAnnouncement);

// Shift students route
router.put('/shift/students', authenticateAdmin, authorize(['admin']), shiftStudents);

// Bulk upload from Excel
router.post("/students/upload-excel", upload.single("file"), authenticateAdmin, authorize(['admin']), bulkUploadFromExcel);

// Profile picture upload route
router.post("/students/upload-profile-pictures",authenticateAdmin,authorize(["admin"]),uploadpp.array("profilePics", 100),uploadProfilePictures);

// ZIP file upload route
router.post(
  "/students/upload-profile-zip",
  uploadZip.single("file"),
  authenticateAdmin,
  authorize(["admin"]),
  uploadProfileZipHandler
);


module.exports = router;