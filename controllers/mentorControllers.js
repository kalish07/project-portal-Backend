const {
  Student,
  Mentor,
  Team,
  ProfessionalTraining1,
  ProfessionalTraining2,
  FinalYearProject
} = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { Op } = require('sequelize');
const { sendEmail } = require('../middleware/mailMiddleware')



const saltRounds = 10;

// --- Register Mentor ---
const registerMentor = async (req, res) => {
  const { name, email, password, profile_pic_url, degree, specialized_in, role } = req.body;
  try {
    const existingMentor = await Mentor.findOne({ where: { email } });
    if (existingMentor) return res.status(400).json({ message: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newMentor = await Mentor.create({
      name, email, password: hashedPassword, profile_pic_url, degree, specialized_in, role
    });

    res.status(201).json({ message: 'Mentor registered successfully', mentor: newMentor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// --- Login Mentor ---
const loginMentor = async (req, res) => {
  const { email, password } = req.body;
  try {
    const mentor = await Mentor.findOne({ where: { email } });
    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

    const isMatch = await bcrypt.compare(password, mentor.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: mentor.id, email: mentor.email, role: mentor.role },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      mentor: { id: mentor.id, name: mentor.name, email: mentor.email, role: mentor.role }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// --- Get Mentor Profile ---
const getMentorProfile = async (req, res) => {
  try {
    const mentor = await Mentor.findByPk(req.mentorId, {
      attributes: ['name', 'profile_pic_url'],
    });
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });
    res.json(mentor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// --- Approve Team ---
const approveTeam = async (req, res) => {
  try {
    const { teamId } = req.body;
    const team = await Team.findByPk(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });

    team.status = "accepted";
    await team.save();

    res.status(200).json({ message: "Team approved successfully!", team });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// --- Get Mentor Teams ---
const getMentorTeams = async (req, res) => {
  try {
    const mentorId = req.mentorId;
    const teams = await Team.findAll({ where: { mentor_id: mentorId }, raw: true });

    const updatedTeams = await Promise.all(
      teams.map(async (team) => {
        const student1 = await Student.findByPk(team.student1_id, { raw: true });
        const student2 = team.student2_id ? await Student.findByPk(team.student2_id, { raw: true }) : null;

        return {
          ...team,
          members: [student1, student2].filter(Boolean),
        };
      })
    );

    const pending_teams = updatedTeams.filter(t => t.status === "pending");
    const my_teams = updatedTeams.filter(t => t.status === "approved" || t.status === "disbanded");


    res.status(200).json({ message: "Teams fetched successfully", pending_teams, my_teams });
  } catch (error) {
    res.status(500).json({ message: "Error fetching teams", error: error.message });
  }
};

// --- Get Pending Team Requests ---
const getPendingTeamRequests = async (req, res) => {
  try {
    const mentorId = req.mentorId;
    const pendingTeams = await Team.findAll({
      where: { mentor_id: mentorId, status: 'pending' },
      raw: true
    });

    const enrichedTeams = await Promise.all(
      pendingTeams.map(async (team) => {
        const student1 = await Student.findByPk(team.student1_id, { raw: true });
        const student2 = team.student2_id ? await Student.findByPk(team.student2_id, { raw: true }) : null;

        return {
          id: team.id,
          status: team.status,
          mentor_id: team.mentor_id,
          members: [student1, student2].filter(Boolean).map(s => ({
            id: s.id,
            name: s.student_name,
            email: s.email,
            department: s.department_name,
            profile_pic: s.profile_pic_url
          }))
        };
      })
    );

    res.status(200).json({ message: "Pending team requests fetched successfully", pending_teams: enrichedTeams });
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending team requests", error: error.message });
  }
};

// --- Respond to Invitation ---
const respondToInvitation = async (req, res) => {
  try {
    const { action } = req.body;
    const { id } = req.params;
    if (!["accept", "decline"].includes(action)) {
      return res.status(400).json({ message: "Invalid action." });
    }

    const team = await Team.findByPk(id);
    if (!team) return res.status(404).json({ message: "Team not found." });

    if (action === "accept") {
      team.status = "approved";
    } else if (action === "decline") {
      team.mentor_id = null;
      team.status = "pending";
    }

    await team.save();

    return res.status(200).json({ message: `Team ${action}ed successfully.` });
  } catch (error) {
    console.error("Respond to invitation error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

// --- Reset Mentor Password ---
const resetMentorPassword = async (req, res) => {
  try {
    const mentor = await Mentor.findByPk(req.mentorId);
    const { current_password, new_password } = req.body;

    const isMatch = await bcrypt.compare(current_password, mentor.password);
    if (!isMatch) return res.status(400).json({ msg: "Current password is incorrect" });

    const hashedNew = await bcrypt.hash(new_password, saltRounds);
    mentor.password = hashedNew;
    await mentor.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password", error: error.message });
  }
};

// --- Get Projects by Mentor ---
const getMentorProjects = async (req, res) => {
  const mentorId = req.mentorId;
  const tables = { ProfessionalTraining1, ProfessionalTraining2, FinalYearProject };
  const response = {};

  try {
    for (const [name, Model] of Object.entries(tables)) {
      const projects = await Model.findAll({ where: { mentor_id: mentorId } });

      const formatted = await Promise.all(projects.map(async (project) => {
        const team = await Team.findByPk(project.team_id);
        if (!team) return null;

        const students = await Student.findAll({
          where: { id: { [Op.in]: [team.student1_id, team.student2_id].filter(Boolean) } }
        });

        return {
          id: project.id,
          project_title: project.title,
          team_id: team.id,
          abstract_url: project.abstract_url ? `/uploads/${path.basename(project.abstract_url)}` : null,
          approved_status: project.approved_status,
          report_url: project.report_pdf_url,
          ppt_url: project.ppt_url,
          team_members: students.map(s => ({
            name: s.student_name,
            department: s.department_name,
            profile_pic: s.profile_pic_url
          }))
        };
      }));

      response[name] = {
        pending_projects: formatted.filter(p => p?.approved_status === "pending"),
        approved_projects: formatted.filter(p => p?.approved_status === "approved"),
      };
    }

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: `Error fetching mentor projects: ${error.message}` });
  }
};

// ✅ NEW API: Get All Projects for a Team by Mentor
const getTeamProjectsByMentor = async (req, res) => {
  const { teamId } = req.params;

  const projectTables = {
    PT1: ProfessionalTraining1,
    PT2: ProfessionalTraining2,
    FINAL: FinalYearProject,
  };

  try {
    const team = await Team.findByPk(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });

    const result = {};

    for (const [phaseKey, ProjectModel] of Object.entries(projectTables)) {
      if (!ProjectModel) continue;

      const project = await ProjectModel.findOne({ where: { team_id: teamId } });
      if (!project) continue;

      result[phaseKey] = {
        id: project.id,
        title: project.title,
        description: project.description,
        domain: project.domain,
        abstract_url: project.abstract_url,
        report_pdf_url: project.report_pdf_url,
        ppt_url: project.ppt_url,
        approved_status: project.approved_status,
        zero_review_marks: project.zero_review_marks,
        first_review_marks: project.first_review_marks,
        second_review_marks: project.second_review_marks,
        team_id: project.team_id,
        mentor_id: project.mentor_id,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Error fetching team projects:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// --- Respond to Project Request ---
const respondToProjectRequest = async (req, res) => {
  const { requestId } = req.params;
  const { action, teamId } = req.body;
  console.log(action, teamId);

  if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'." });
  }

  // Fetch the team to get the current semester
  const team = await Team.findByPk(teamId);
  if (!team) {
    return res.status(404).json({ message: "Team not found" });
  }

  const currentSemester = team.current_semester;

  // Determine the appropriate project table based on the current semester
  let Table;
  if (currentSemester === 5) {
    Table = ProfessionalTraining1;
  } else if (currentSemester === 6) {
    Table = ProfessionalTraining2;
  } else if (currentSemester === 7 || currentSemester === 8) {
    Table = FinalYearProject;
  } else {
    return res.status(400).json({ message: "Invalid semester for project requests." });
  }

  try {
    // Fetch the project based on the requestId
    const project = await Table.findByPk(requestId);
    if (!project) {
      return res.status(404).json({ message: "Project request not found" });
    }

    // Check if the project is in a pending state
    if (project.approved_status !== 'pending') {
      return res.status(403).json({ message: "Project cannot be modified as it is not in a pending state." });
    }

    // Prepare email content
    const subject = action === "approve" 
      ? `Project Approved: ${project.title}` 
      : `Project Rejected: ${project.title}`;
    
    const message = action === "approve" 
      ? `Dear Team Members,\n\nYour project "${project.title}" has been approved.\n\nBest Regards,\nYour Mentor` 
      : `Dear Team Members,\n\nYour project "${project.title}" has been rejected.\n\nBest Regards,\nYour Mentor`;

    // Fetch team members' emails
    const teamMembers = await Team.findOne({
      where: { id: teamId },
      include: [{ model: Student, as: 'Student1' }, { model: Student, as: 'Student2' }]
    });

    // Collect emails
    const emails = [
      teamMembers.Student1.email,
      teamMembers.Student2?.email // Optional chaining in case Student2 is null
    ].filter(email => email); // Filter out any undefined emails

    // Update project status and send email
    if (action === "approve") {
      project.approved_status = "approved";
      await project.save();
    } else if (action === "reject") {
      await project.destroy(); // 🔥 delete the project if rejected
    }

    // Send email notifications
    await Promise.all(emails.map(email => sendEmail(email, subject, message)));

    return res.status(200).json({ message: `Project ${action}d successfully.` });
  } catch (error) {
    return res.status(500).json({ message: "Error responding to project request", error: error.message });
  }
};



module.exports = { respondToProjectRequest };



// --- Export All ---
module.exports = {
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
  respondToProjectRequest // ✅ Add this line
};

