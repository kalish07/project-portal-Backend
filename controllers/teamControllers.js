const { Student, Mentor, Team, ProfessionalTraining1, ProfessionalTraining2, FinalYearProject, Invitation } = require("../models");
const { Op } = require("sequelize");

// ==================== STUDENT-RELATED ENDPOINTS ====================

// ✅ Fetch all students except the logged-in user
// GET /api/students

exports.getStudents = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // 1. Get current user's semester & department
    const currentStudent = await Student.findByPk(currentUserId, {
      attributes: ["current_semester", "department_name"]
    });

    if (!currentStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 2. Get all teams that are not disbanded
    const activeTeams = await Team.findAll({
      where: { status: { [Op.ne]: "disbanded" } },
      attributes: ["student1_id", "student2_id"]
    });

    // 3. Collect IDs of students already in teams
    const teamedStudentIds = new Set();
    activeTeams.forEach(team => {
      if (team.student1_id) teamedStudentIds.add(team.student1_id);
      if (team.student2_id) teamedStudentIds.add(team.student2_id);
    });

    // 4. Fetch eligible students (not in teams, same department/semester)
    const students = await Student.findAll({
      where: {
        id: {
          [Op.ne]: currentUserId,
          [Op.notIn]: Array.from(teamedStudentIds)
        },
        department_name: currentStudent.department_name,
        current_semester: currentStudent.current_semester
      },
      attributes: [
        "id",
        "student_name",
        "reg_number",
        "department_name",
        "current_semester",
        "email",
        "profile_pic_url"
      ]
    });

    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

/// solo team creation
// POST /api/team/create-solo
exports.createSoloTeam = async (req, res) => {
  const userId = req.user.id;

  try {
    const student = await Student.findByPk(userId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if the student already has a team
    const existingTeam = await Team.findOne({
      where: {
        [Op.or]: [{ student1_id: userId }, { student2_id: userId }]
      }
    });

    if (existingTeam) {
      return res.status(400).json({ message: "You already have a team" });
    }

    // Create a solo team
    const newTeam = await Team.create({
      student1_id: student.id,
      student2_id: student.id, // both members are the same
      mentor_id: null,
      current_semester: student.current_semester,
      status: "pending" // or "none" if you want
    });

    // Optional: delete any pending invites from or to this student
    await Invitation.destroy({
      where: {
        status: "pending",
        [Op.or]: [{ sender_id: userId }, { recipient_id: userId }]
      }
    });

    res.status(200).json({
      message: "Solo team created successfully",
      team: newTeam
    });

  } catch (error) {
    console.error("Error creating solo team:", error);
    res.status(500).json({ message: "Error creating solo team", error: error.message });
  }
};

// ✅ Send team invitation to another student
// POST /api/students/send-invitation
exports.sendInvitation = async (req, res) => {
  const { recipientId } = req.body;
  const senderId = req.user.id;

  try {
    // ✅ Check if recipient exists
    const recipient = await Student.findByPk(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Student not found" });
    }

    // ❌ Cannot invite self
    if (recipientId === senderId) {
      return res.status(400).json({ message: "You cannot invite yourself" });
    }

    // ✅ Check for existing pending invitations (both directions between same users)
    const existingInvitation = await Invitation.findOne({
      where: {
        [Op.or]: [
          { sender_id: senderId, recipient_id: recipientId },
          { sender_id: recipientId, recipient_id: senderId }
        ],
        status: "pending"
      }
    });

    if (existingInvitation) {
      return res.status(400).json({
        message:
          existingInvitation.sender_id === senderId
            ? "You've already sent an invitation to this student"
            : "This student has already sent you an invitation"
      });
    }

    // 🚫 Check if sender already has ANY pending invitation (outgoing only)
    const senderPending = await Invitation.findOne({
      where: {
        sender_id: senderId,
        status: "pending"
      }
    });

    if (senderPending) {
      return res.status(400).json({
        message:
          "You already have a pending invitation. Please wait until it's accepted or rejected."
      });
    }

    // ✅ Recipient can receive multiple invites, so no block here!

    // ✅ Check if users are already in a team together (except disbanded)
    const existingTeam = await Team.findOne({
      where: {
        [Op.or]: [
          { student1_id: senderId, student2_id: recipientId },
          { student1_id: recipientId, student2_id: senderId }
        ],
        status: {
          [Op.not]: "disbanded"
        }
      }
    });

    if (existingTeam) {
      return res.status(400).json({ message: "You're already in a team with this student" });
    }

    // ✅ Check if sender is already in any non-disbanded team
    const senderInTeam = await Team.findOne({
      where: {
        [Op.or]: [{ student1_id: senderId }, { student2_id: senderId }],
        status: { [Op.not]: "disbanded" }
      }
    });

    if (senderInTeam) {
      return res.status(400).json({ message: "You're already in a team" });
    }

    // ✅ Check if recipient is already in any non-disbanded team
    const recipientInTeam = await Team.findOne({
      where: {
        [Op.or]: [{ student1_id: recipientId }, { student2_id: recipientId }],
        status: { [Op.not]: "disbanded" }
      }
    });

    if (recipientInTeam) {
      return res.status(400).json({ message: "This student is already in a team" });
    }

    // ✅ Create the invitation
    const invitation = await Invitation.create({
      sender_id: senderId,
      recipient_id: recipientId,
      status: "pending"
    });

    res.status(201).json({
      message: "Invitation sent successfully",
      invitation
    });

  } catch (error) {
    console.error("Error sending invitation:", error);
    res.status(500).json({
      message: "Error sending invitation",
      error: error.message
    });
  }
};



exports.getAllInvitations = async (req, res) => {
  const userId = req.user.id;

  try {
    const [sentInvites, incomingInvites] = await Promise.all([
      Invitation.findAll({
        where: { sender_id: userId },
        include: [{
          model: Student,
          as: "recipient",
          attributes: ["id", "student_name", "email", "profile_pic_url"],
        }],
        order: [["createdAt", "DESC"]]
      }),

      Invitation.findAll({
        where: { recipient_id: userId },
        include: [{
          model: Student,
          as: "sender",
          attributes: ["id", "student_name", "email", "profile_pic_url"],
        }],
        order: [["createdAt", "DESC"]]
      })
    ]);

    const sentFormatted = sentInvites.map(invite => ({
      id: invite.id,
      recipient: invite.recipient ? {
        id: invite.recipient.id,
        name: invite.recipient.student_name,
        email: invite.recipient.email,
        profilePic: invite.recipient.profile_pic_url
      } : null,
      status: invite.status,
      createdAt: invite.createdAt
    }));

    const incomingFormatted = incomingInvites.map(invite => ({
      id: invite.id,
      sender: invite.sender ? {
        id: invite.sender.id,
        name: invite.sender.student_name,
        email: invite.sender.email,
        profilePic: invite.sender.profile_pic_url
      } : null,
      status: invite.status,
      createdAt: invite.createdAt
    }));


    res.status(200).json({
      success: true,
      data: {
        sentInvitations: sentFormatted,
        incomingInvitations: incomingFormatted
      }
    });

  } catch (error) {
    console.error("Error fetching invitations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch invitations",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};




// controllers/teamControllers.js

exports.withdrawInvitation = async (req, res) => {
  const userId = req.user.id;
  const { invitationId } = req.params;

  try {
    const invitation = await Invitation.findOne({
      where: {
        id: invitationId,
        sender_id: userId,
        status: "pending"
      }
    });

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found or already processed" });
    }

    await invitation.destroy();

    res.status(200).json({ message: "Invitation withdrawn successfully" });
  } catch (error) {
    console.error("Error withdrawing invitation:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


// ✅ Accept an invitation
// POST /api/students/invitations/:invitationId/accept
exports.acceptInvitation = async (req, res) => {
  const userId = req.user.id; // recipient
  const { invitationId } = req.params;

  try {
    // ✅ Find the invitation being accepted
    const invitation = await Invitation.findOne({
      where: {
        id: invitationId,
        recipient_id: userId,
        status: "pending"
      }
    });

    if (!invitation) {
      return res.status(404).json({
        message: "Invitation not found or already processed."
      });
    }

    // ✅ Fetch both students
    const sender = await Student.findByPk(invitation.sender_id);
    const recipient = await Student.findByPk(userId);

    if (!sender || !recipient) {
      return res.status(400).json({ message: "Sender or recipient student not found" });
    }

    // ❗ Same semester check
    if (sender.current_semester !== recipient.current_semester) {
      return res.status(400).json({
        message: "Students must be in the same semester to form a team"
      });
    }

    // ✅ Create team
    const newTeam = await Team.create({
      student1_id: sender.id,
      student2_id: recipient.id,
      mentor_id: null,
      current_semester: sender.current_semester,
      status: "pending"
    });

    // ✅ Delete all other pending invites for both sender and recipient
    await Invitation.destroy({
      where: {
        status: "pending",
        [Op.or]: [
          { sender_id: sender.id },
          { recipient_id: sender.id },
          { sender_id: recipient.id },
          { recipient_id: recipient.id }
        ]
      }
    });

    res.status(200).json({
      message: "Invitation accepted, team created, and all other pending invitations removed",
      team: newTeam
    });

  } catch (error) {
    console.error("Error accepting invitation:", error);
    res.status(500).json({
      message: "Error accepting invitation",
      error: error.message
    });
  }
};




// ✅ Reject an invitation
// POST /api/students/invitations/:invitationId/reject
exports.rejectInvitation = async (req, res) => {
  const userId = req.user.id; // The user ID from the request
  const { invitationId } = req.params; // The invitation ID from the request parameters
  console.log(userId, invitationId);
  
  try {
    // Fetch the invitation by invitationId and check if the user is the recipient
    const invitation = await Invitation.findOne({
      where: {
        id: invitationId,
        recipient_id: userId // Check if the user is the recipient
      }
    });

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found or you are not the recipient" });
    }

    // Update the status to "rejected"
    invitation.status = "rejected";
    await invitation.destroy(); // Delete the invitation record

    res.status(200).json({ message: "Invitation rejected and deleted" });
  } catch (error) {
    console.error("Error rejecting invitation:", error);
    res.status(500).json({ message: "Error rejecting invitation", error: error.message });
  }
};



// ==================== MENTOR-RELATED ENDPOINTS ====================

// ✅ Fetch all mentors
// GET /api/mentors
exports.getMentors = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Step 1: Get current student's semester
    const student = await Student.findByPk(studentId, {
      attributes: ["current_semester"]
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const semester = student.current_semester;

    // Step 2: Get all mentors
    const mentors = await Mentor.findAll({
      attributes: ["id", "name", "email", "degree", "specialized_in"],
      raw: true
    });

    // Step 3: Get mentor team counts
    let mentorTeamCounts = {};
    if (semester === 6) {
      const pt1Counts = await ProfessionalTraining1.findAll({
        attributes: ['mentor_id'],
        raw: true
      });

      pt1Counts.forEach(row => {
        mentorTeamCounts[row.mentor_id] = (mentorTeamCounts[row.mentor_id] || 0) + 1;
      });

    } else if (semester === 7) {
      const [pt2Counts, fypCounts] = await Promise.all([
        ProfessionalTraining2.findAll({ attributes: ['mentor_id'], raw: true }),
        FinalYearProject.findAll({ attributes: ['mentor_id'], raw: true })
      ]);

      pt2Counts.forEach(row => {
        mentorTeamCounts[row.mentor_id] = {
          ...(mentorTeamCounts[row.mentor_id] || {}),
          pt2: (mentorTeamCounts[row.mentor_id]?.pt2 || 0) + 1
        };
      });

      fypCounts.forEach(row => {
        mentorTeamCounts[row.mentor_id] = {
          ...(mentorTeamCounts[row.mentor_id] || {}),
          fyp: (mentorTeamCounts[row.mentor_id]?.fyp || 0) + 1
        };
      });

    } else if (semester === 8) {
      const fypCounts = await FinalYearProject.findAll({
        attributes: ['mentor_id'],
        raw: true
      });

      fypCounts.forEach(row => {
        mentorTeamCounts[row.mentor_id] = (mentorTeamCounts[row.mentor_id] || 0) + 1;
      });

    } else {
      return res.status(400).json({ message: "Mentor assignment is allowed only for semesters 6, 7, and 8." });
    }

    // Step 4: Attach availability and seats left
    const mentorsWithAvailability = mentors.map(mentor => {
      let seats_left = 8;
      let available = true;

      if (semester === 6) {
        const count = mentorTeamCounts[mentor.id] || 0;
        seats_left = 8 - count;
        available = count < 8;
      }

      if (semester === 7) {
        const pt2 = mentorTeamCounts[mentor.id]?.pt2 || 0;
        const fyp = mentorTeamCounts[mentor.id]?.fyp || 0;

        const pt2Seats = 8 - pt2;
        const fypSeats = 8 - fyp;

        available = pt2 < 8 || fyp < 8;
        seats_left = {
          pt2: pt2Seats,
          fyp: fypSeats
        };
      }

      if (semester === 8) {
        const count = mentorTeamCounts[mentor.id] || 0;
        seats_left = 8 - count;
        available = count < 8;
      }

      return {
        ...mentor,
        available,
        seats_left
      };
    });

    // Step 5: Return only available mentors
    const eligibleMentors = mentorsWithAvailability.filter(m => m.available);

    res.status(200).json(eligibleMentors);

  } catch (error) {
    console.error("Error fetching mentors:", error);
    res.status(500).json({ message: "Error fetching mentors", error: error.message });
  }
};



// ✅ Request a mentor for your team
// POST /api/team/request-mentor
exports.requestMentor = async (req, res) => {
  const { mentorId } = req.body;
  const userId = req.user.id;

  try {
    console.log("Requesting mentor by user:", userId);

    // 1. Fetch the team where the user is either student1 or student2
    const team = await Team.findOne({
      where: {
        [Op.or]: [
          { student1_id: userId },
          { student2_id: userId }
        ]
      }
    });

    // 2. Team must exist and be associated with the user
    if (!team) {
      return res.status(404).json({ message: "No team found for the user." });
    }

    // 3. Validate the mentor
    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: "Selected mentor not found." });
    }

    // 4. Assign mentor to team
    team.mentor_id = mentorId;
    await team.save();

    console.log(`Mentor ${mentorId} assigned to team ${team.id}`);
    res.status(200).json({ message: "Mentor successfully requested!", team });

  } catch (error) {
    console.error("Error requesting mentor:", error);
    res.status(500).json({ message: "Error requesting mentor", error: error.message });
  }
};


// controllers/teamControllers.js

exports.withdrawMentorRequest = async (req, res) => {
  const userId = req.user.id;

  try {
    const team = await Team.findOne({
      where: {
        [Op.or]: [
          { student1_id: userId },
          { student2_id: userId }
        ]
      }
    });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    team.mentor_id = null;
    await team.save();

    res.status(200).json({ message: "Mentor request withdrawn successfully" });
  } catch (error) {
    console.error("Error withdrawing mentor request:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};



// ==================== TEAM-RELATED ENDPOINTS ====================

// ✅ Get team details
// GET /api/team/:teamId
exports.getTeamAndProjectsByUserId = async (req, res) => {
  try {
    const userId = req.user.id;

    const teams = await Team.findAll({
      where: {
        [Op.or]: [{ student1_id: userId }, { student2_id: userId }]
      }
    });

    if (!teams.length) {
      return res.status(404).json({ message: "No teams found for this user." });
    }

    const result = {
      ProfessionalTraining1: null,
      ProfessionalTraining2: null,
      FinalYearProject: null
    };

    let currentTeam = null;

    for (const team of teams) {
      const [student1, student2, mentor] = await Promise.all([
        Student.findByPk(team.student1_id, {
          attributes: ["student_name", "department_name", "email", "reg_number", "profile_pic_url"]
        }),
        Student.findByPk(team.student2_id, {
          attributes: ["student_name", "department_name", "email", "reg_number", "profile_pic_url"]
        }),
        team.mentor_id
          ? Mentor.findByPk(team.mentor_id, {
              attributes: ["id", "name", "email", "specialized_in", "profile_pic_url"]
            })
          : null
      ]);

      const [pt1, pt2, fyp] = await Promise.all([
        ProfessionalTraining1.findOne({ where: { team_id: team.id } }),
        ProfessionalTraining2.findOne({ where: { team_id: team.id } }),
        FinalYearProject.findOne({ where: { team_id: team.id } })
      ]);

      if (pt1) {
        result.ProfessionalTraining1 = {
          team,
          students: { student1, student2 },
          project: pt1,
          mentor
        };
      }

      if (pt2) {
        result.ProfessionalTraining2 = {
          team,
          students: { student1, student2 },
          project: pt2,
          mentor
        };
      }

      if (fyp) {
        result.FinalYearProject = {
          team,
          students: { student1, student2 },
          project: fyp,
          mentor
        };
      }

      // 🟢 If this is the first approved team, assign as currentTeam (with mentor details)
      if (!currentTeam && team.status === "approved") {
        currentTeam = {
          id: team.id,
          mentor_id: team.mentor_id,
          mentor,
          student1_id: team.student1_id,
          student2_id: team.student2_id,
          status: team.status,
          current_semester: team.current_semester
        };
      }
    }

    return res.status(200).json({
      projects: result,
      current_team: currentTeam
    });
  } catch (error) {
    console.error("Error fetching user teams and projects:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



// controllers/teamController.js
exports.getUserTeams = async (req, res) => {
  const userId = req.user.id;

  try {
    const teams = await Team.findAll({
      where: {
        status: {
          [Op.not]: 'disbanded'  // Exclude disbanned teams
        },
        [Op.or]: [
          { student1_id: userId },
          { student2_id: userId }
        ]
      },
      include: [
        {
          model: Student,
          as: 'Student1',
          attributes: ['id', 'student_name', 'email', 'department_name', 'profile_pic_url', 'reg_number']
        },
        {
          model: Student,
          as: 'Student2',
          attributes: ['id', 'student_name', 'email', 'department_name', 'profile_pic_url', 'reg_number']
        },
        {
          model: Mentor,
          attributes: ['id', 'name', 'email', 'specialized_in']
        }
      ]
    });

    res.status(200).json({
      message: "User teams retrieved successfully",
      teams
    });
  } catch (error) {
    console.error("Error fetching user teams:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

