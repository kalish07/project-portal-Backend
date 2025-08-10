const { Student, Mentor,ProfessionalTraining1,ProfessionalTraining2,FinalYearProject, Team, Announcement, sequelize } = require('../models'); // Adjust the path as necessary
const bcrypt = require("bcryptjs");
const { Op, Sequelize } = require("sequelize");

// Function to create a new student
const createStudent = async (req, res) => {
  try {
    const { student_name, reg_number, department_name, current_semester, email } = req.body;

    // Check if reg_number already exists
    const existing = await Student.findOne({ where: { reg_number } });
    if (existing) {
      return res.status(400).json({ error: `Registration number ${reg_number} already exists.` });
    }

    const password = 'password' + reg_number.slice(-4);
    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = await Student.create({
      student_name,
      reg_number,
      department_name,
      current_semester,
      email,
      password: hashedPassword,
      profile_pic_url: null
    });

    res.status(201).json(newStudent);
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({ error: "Failed to create student" });
  }
};

// Function to edit a student
const editStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const studentData = req.body;
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    await student.update(studentData);
    res.json(student);
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ error: 'Failed to update student' });
  }
};

// Function to delete a student
const deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    await student.destroy();
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
};

// Function to create a new mentor
const createMentor = async (req, res) => {
  try {
    const { name, email, profile_pic_url, degree, specialized_in, role } = req.body;

    // Check if email already exists
    const existingMentor = await Mentor.findOne({ where: { email } });
    if (existingMentor) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Use default password and hash it
    const defaultPassword = 'mentor@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const newMentor = await Mentor.create({
      name,
      email,
      password: hashedPassword,
      profile_pic_url,
      degree,
      specialized_in,
      role: role || 'mentor'
    });

    res.status(201).json(newMentor);
  } catch (error) {
    console.error("Error creating mentor:", error);
    res.status(500).json({ error: 'Failed to create mentor' });
  }
};

// Function to edit a mentor
const editMentor = async (req, res) => {
  try {
    const mentorId = req.params.id;
    const mentorData = req.body;
    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }
    await mentor.update(mentorData);
    res.json(mentor);
  } catch (error) {
    console.error("Error updating mentor:", error);
    res.status(500).json({ error: 'Failed to update mentor' });
  }
};

// Function to delete a mentor
const deleteMentor = async (req, res) => {
  try {
    const mentorId = req.params.id;
    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }
    await mentor.destroy();
    res.json({ message: 'Mentor deleted successfully' });
  } catch (error) {
    console.error("Error deleting mentor:", error);
    res.status(500).json({ error: 'Failed to delete mentor' });
  }
};

// PUT /students/:id/reset-password
const resetStudentPassword = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(404).json({ error: "Student not found." });
    }

    const reg = student.reg_number || "";
    const last4 = reg.slice(-4) || "0000";
    const defaultPassword = `Password@${last4}`;

    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    student.password = hashedPassword;
    await student.save();

    res.status(200).json({
      message: "Student password reset to default successfully.",
      defaultPassword,
    });
  } catch (error) {
    console.error("Error resetting student password:", error);
    res.status(500).json({ error: "Failed to reset student password." });
  }
};




// PUT /mentors/:id/password
const changeMentorPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const mentor = await Mentor.findByPk(id);
    if (!mentor) {
      return res.status(404).json({ error: "Mentor not found." });
    }

    mentor.password = hashedPassword;
    await mentor.save();

    res.status(200).json({ message: "Mentor password updated successfully." });
  } catch (error) {
    console.error("Error updating mentor password:", error);
    res.status(500).json({ error: "Failed to update mentor password." });
  }
};


// Function to retrieve all students from the database
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.findAll();
    res.json(students);
  } catch (error) {
    console.error("Error retrieving students:", error);
    res.status(500).json({ error: 'Failed to retrieve students' });
  }
};

// Function to retrieve all mentors from the database
const getAllMentors = async (req, res) => {
  try {
    const mentors = await Mentor.findAll();
    res.json(mentors);
  } catch (error) {
    console.error("Error retrieving mentors:", error);
    res.status(500).json({ error: 'Failed to retrieve mentors' });
  }
};

//---------------update mentor capacity---------------------
const updateMentorCapacity = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { type, value } = req.body;

    const allowedFields = {
      pt1: "max_pt1",
      pt2: "max_pt2",
      final_year: "max_final_year"
    };

    if (!allowedFields[type]) {
      return res.status(400).json({ success: false, message: "Invalid capacity type." });
    }

    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor) {
      return res.status(404).json({ success: false, message: "Mentor not found." });
    }

    mentor[allowedFields[type]] = value;
    await mentor.save();

    res.json({ success: true, message: `Mentor ${allowedFields[type]} updated successfully.` });
  } catch (error) {
    console.error("Error updating mentor capacity:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

///--------------------------change all mentor capacity - ----    --------------------
const bulkUpdateMentorCapacities = async (req, res) => {
  try {
    const { type, value } = req.body;

    const validTypes = {
      pt1: "max_pt1",
      pt2: "max_pt2",
      final_year: "max_final_year",
    };

    const fieldToUpdate = validTypes[type];
    if (!fieldToUpdate || typeof value !== "number") {
      return res.status(400).json({
        success: false,
        message: "Invalid project type or capacity value",
      });
    }

    await Mentor.update({ [fieldToUpdate]: value }, { where: {} });

    res.json({
      success: true,
      message: `All mentors updated: ${fieldToUpdate} set to ${value}`,
    });
  } catch (err) {
    console.error("Bulk update error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};












//----------------team Management_______________________________________________________________________________________________________

//----------------------team details------------------
const calculateProgress = ({ abstract_url, ppt_url, report_pdf_url } = {}) => {
  let filled = 0;
  if (abstract_url) filled++;
  if (ppt_url) filled++;
  if (report_pdf_url) filled++;
  return Math.round((filled / 3) * 100);
};

const getMentorTeamCount = async (mentorId, type) => {
  const semesters = {
    pt1: [5],
    pt2: [6],
    final_year: [7, 8],
  }[type] || [];

  return await Team.count({
    where: {
      mentor_id: mentorId,
      current_semester: semesters,
      status: { [Op.ne]: 'disbanded' }
    },
  });
};

const formatTeamData = async (team, type) => {
  const mentorTeamCount = team.Mentor
    ? await getMentorTeamCount(team.Mentor.id, type)
    : 0;

  const project =
    (type === "pt1" && team.ProfessionalTrainings1?.[0]) ||
    (type === "pt2" && team.ProfessionalTrainings2?.[0]) ||
    (type === "final_year" && team.FinalYearProjects?.[0]) ||
    {};

  return {
    id: team.id,
    name: `${type.toUpperCase()} Team ${team.id}`,
    created: team.createdAt,
    type,
    project_title: project?.title,
    members: [team.Student1, team.Student2].filter(Boolean).map((s) => ({
      id: s.id,
      name: s.student_name,
      role: "Student",
      department: s.department_name,
      semester: s.current_semester,
    })),
    mentor: team.Mentor
      ? {
          id: team.Mentor.id,
          name: team.Mentor.name,
          teamCount: mentorTeamCount,
        }
      : null,
    progress: calculateProgress(project),
    lastActivity: project.updatedAt || team.updatedAt,
  };
};

const getAllTeamsWithProgress = async (req, res) => {
  try {
    const [pt1Teams, pt2Teams, finalYearTeams] = await Promise.all([
      Team.findAll({
        where: {
          current_semester: 5,
          status: { [Op.ne]: 'disbanded' }
        },
        include: [
          { model: Student, as: "Student1" },
          { model: Student, as: "Student2" },
          { model: Mentor },
          { model: ProfessionalTraining1, as: "ProfessionalTrainings1", required: false },
        ],
      }),
      Team.findAll({
        where: {
          current_semester: 6,
          status: { [Op.ne]: 'disbanded' }
        },
        include: [
          { model: Student, as: "Student1" },
          { model: Student, as: "Student2" },
          { model: Mentor },
          { model: ProfessionalTraining2, as: "ProfessionalTrainings2", required: false },
        ],
      }),
      Team.findAll({
        where: {
          current_semester: { [Op.in]: [7, 8] },
          status: { [Op.ne]: 'disbanded' }
        },
        include: [
          { model: Student, as: "Student1" },
          { model: Student, as: "Student2" },
          { model: Mentor },
          { model: FinalYearProject, as: "FinalYearProjects", required: false },
        ],
      }),
    ]);

    const buildTeamList = async (teams, type) =>
      await Promise.all(teams.map((t) => formatTeamData(t, type)));

    const [pt1Formatted, pt2Formatted, finalYearFormatted] = await Promise.all([
      buildTeamList(pt1Teams, "pt1"),
      buildTeamList(pt2Teams, "pt2"),
      buildTeamList(finalYearTeams, "final_year"),
    ]);

    res.json({
      success: true,
      teams: {
        pt1: pt1Formatted,
        pt2: pt2Formatted,
        final_year: finalYearFormatted,
      },
    });
  } catch (err) {
    console.error("Error fetching team data:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};



//------------------------change mentor--------------------------
const changeMentorForTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { newMentorId } = req.body;

    if (!newMentorId) {
      return res.status(400).json({ success: false, message: "New mentor ID is required" });
    }

    const oldTeam = await Team.findByPk(teamId);
    if (!oldTeam || oldTeam.status === 'disbanded') {
      return res.status(404).json({ success: false, message: "Original team not found or already disbanded" });
    }

    // Step 1: Disband old team and set mentor_unassigned_at timestamp
    await oldTeam.update({
      status: 'disbanded',
      mentor_unassigned_at: new Date('2025-07-06T19:27:31.136Z') // UTC timestamp
    });

    // Step 2: Delete project data related to current_semester
    const semester = oldTeam.current_semester;

    if (semester === 5) {
      await ProfessionalTraining1.destroy({ where: { team_id: oldTeam.id } });
    } else if (semester === 6) {
      await ProfessionalTraining2.destroy({ where: { team_id: oldTeam.id } });
    } else if ([7, 8].includes(semester)) {
      await FinalYearProject.destroy({ where: { team_id: oldTeam.id } });
    }

    // Step 3: Create new team with same students but new mentor
    const newTeam = await Team.create({
      student1_id: oldTeam.student1_id,
      student2_id: oldTeam.student2_id,
      mentor_id: newMentorId,
      current_semester: oldTeam.current_semester,
      status: 'approved',
    });

    return res.status(200).json({
      success: true,
      message: "Mentor changed and new team created",
      newTeamId: newTeam.id,
    });

  } catch (err) {
    console.error("Error in mentor change:", err);
    res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
  }
};



//_______________________________________________Unassign team_________________________________________
const unassignTeam = async (req, res) => {
  const { id } = req.params;
  const { removeStudent1, removeStudent2, removeMentor } = req.body;

  try {
    const team = await Team.findByPk(id);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const semester = team.current_semester;

    // 🗑 Delete from project table based on semester
    if (semester === 5) {
      await ProfessionalTraining1.destroy({ where: { team_id: team.id } });
    } else if (semester === 6) {
      await ProfessionalTraining2.destroy({ where: { team_id: team.id } });
    } else if ([7, 8].includes(semester)) {
      await FinalYearProject.destroy({ where: { team_id: team.id } });
    }

    // 🔁 Unassign students/mentor
    if (removeStudent1) team.student1_unassigned_at = new Date();
    if (removeStudent2) team.student2_unassigned_at = new Date();
    if (removeMentor) team.mentor_unassigned_at = new Date();

    team.status = 'disbanded';

    await team.save();

    res.json({ success: true, message: 'Team unassigned and project removed.' });
  } catch (error) {
    console.error('Error unassigning team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


//-----------------------------------------UNASSIGN ALL TEAMS --------------------------------------
const unassignAllTeamsInSemester = async (req, res) => {
  const { semester } = req.body;

  if (![5, 6, 7, 8].includes(semester)) {
    return res.status(400).json({ error: 'Invalid semester' });
  }

  try {
    const teams = await Team.findAll({
      where: {
        current_semester: semester,
        status: { [Op.ne]: 'disbanded' }
      }
    });

    for (const team of teams) {
      // Delete project based on semester
      if (semester === 5) {
        await ProfessionalTraining1.destroy({ where: { team_id: team.id } });
      } else if (semester === 6) {
        await ProfessionalTraining2.destroy({ where: { team_id: team.id } });
      } else if ([7, 8].includes(semester)) {
        await FinalYearProject.destroy({ where: { team_id: team.id } });
      }

      // Mark unassigned and disbanded
      const now = new Date();
      await team.update({
        student1_unassigned_at: now,
        student2_unassigned_at: now,
        mentor_unassigned_at: now,
        status: 'disbanded'
      });
    }

    res.json({ success: true, message: `${teams.length} teams unassigned and cleared.` });
  } catch (error) {
    console.error("Error unassigning all teams:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


//-----------------------fetch all unassigned students-----------------------------------
const getUnassignedStudents = async (req, res) => {
  try {
    // Get all student IDs who are assigned in active (non-disbanded) teams
    const assignedStudents = await Team.findAll({
      where: {
        status: { [Op.ne]: 'disbanded' } // Optional: Exclude disbanded teams
      },
      attributes: ['student1_id', 'student2_id']
    });

    const assignedIds = new Set();
    assignedStudents.forEach(team => {
      if (team.student1_id) assignedIds.add(team.student1_id);
      if (team.student2_id) assignedIds.add(team.student2_id);
    });

    const unassignedStudents = await Student.findAll({
      where: {
        id: { [Op.notIn]: Array.from(assignedIds) }
      },
      attributes: ['id', 'student_name', 'reg_number', 'department_name', 'current_semester', 'email', 'profile_pic_url']
    });

    res.json({ success: true, students: unassignedStudents });
  } catch (error) {
    console.error("Error fetching unassigned students:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};



//---------------------------force pair team-----------------------------------
const forcePairStudents = async (req, res) => {
  const { student1_id, student2_id } = req.body;

  if (!student1_id || !student2_id) {
    return res.status(400).json({ error: "Both student IDs are required" });
  }

  try {
    const student1 = await Student.findByPk(student1_id);
    const student2 = await Student.findByPk(student2_id);

    if (!student1 || !student2) {
      return res.status(404).json({ error: "One or both students not found" });
    }

    if (student1.current_semester !== student2.current_semester) {
      return res.status(400).json({ error: "Students must be in the same semester" });
    }

    // Check if they are already in teams
    const existingTeams = await Team.findAll({
      where: {
        [Op.or]: [
          { student1_id: student1_id },
          { student2_id: student1_id },
          { student1_id: student2_id },
          { student2_id: student2_id },
        ],
        status: { [Op.ne]: 'disbanded' }
      }
    });

    if (existingTeams.length > 0) {
      return res.status(400).json({ error: "One or both students are already assigned to a team" });
    }

    const newTeam = await Team.create({
      student1_id,
      student2_id,
      current_semester: student1.current_semester,
      mentor_id: null,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: "Team created successfully",
      team: newTeam
    });
  } catch (error) {
    console.error("Error in forcePairStudents:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


//------------------------------------------get available mentors-----------------------
const getAvailableMentors = async (req, res) => {
  try {
    const { projectType } = req.query; // pt1, pt2, final_year

    const typeToSemesters = {
      pt1: [5],
      pt2: [6],
      final_year: [7, 8],
    };

    const typeToField = {
      pt1: 'max_pt1',
      pt2: 'max_pt2',
      final_year: 'max_final_year',
    };

    if (!projectType || !typeToSemesters[projectType]) {
      return res.status(400).json({ success: false, message: "Invalid projectType" });
    }

    const semesters = typeToSemesters[projectType];

    const mentors = await Mentor.findAll({
      attributes: [
        'id',
        'name',
        'email',
        'profile_pic_url',
        'specialized_in',
        'max_pt1',
        'max_pt2',
        'max_final_year'
      ]
    });

    const result = await Promise.all(mentors.map(async (mentor) => {
      const teamCount = await Team.count({
        where: {
          mentor_id: mentor.id,
          current_semester: semesters,
          status: { [Op.not]: 'disbanded' }
        }
      });

      const maxTeams = mentor[typeToField[projectType]] || 0;
      const available = teamCount < maxTeams;

      
      return {
        id: mentor.id,
        name: mentor.name,
        email: mentor.email,
        specialized_in: mentor.specialized_in,
        profile_pic_url: mentor.profile_pic_url,
        currentTeamCount: teamCount,
        maxTeams,
        available
      };
    }));

    const filtered = result.filter(m => m.available);

    res.json({ success: true, mentors: filtered });
  } catch (err) {
    console.error("Error fetching mentors:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};



//---------------------------getTeams has No Mentors ---------------------------------
const getTeamsWithoutMentors = async (req, res) => {
  try {
    const { projectType } = req.query;

    const typeToSemesters = {
      pt1: [5],
      pt2: [6],
      final_year: [7, 8],
    };

    if (!projectType || !typeToSemesters[projectType]) {
      return res.status(400).json({ success: false, message: "Invalid or missing projectType" });
    }

    const semesters = typeToSemesters[projectType];

    const teams = await Team.findAll({
      where: {
        mentor_id: null,
        current_semester: { [Op.in]: semesters },
        status: { [Op.not]: 'disbanded' }
      },
      include: [
        { model: Student, as: 'Student1' },
        { model: Student, as: 'Student2' }
      ]
    });

    const formatted = teams.map(team => ({
      id: team.id,
      name: `Team ${team.id}`,
      project_title: `PT-${team.current_semester}`,
      current_semester: team.current_semester,
      members: [team.Student1, team.Student2].filter(Boolean).map(s => ({
        id: s.id,
        name: s.student_name,
        reg_number: s.reg_number,
        email: s.email,
        department: s.department_name,
        semester: s.current_semester,
      }))
    }));

    res.json({ success: true, teams: formatted });
  } catch (err) {
    console.error("Error fetching teams without mentors:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};



//----------------------------------- force assign mentors ---------------------------
const assignMentorToTeam = async (req, res) => {
  try {
    const { teamId } = req.params;      // ✅ from route param
    const { mentorId } = req.body;      // ✅ from request body

    if (!teamId || !mentorId) {
      return res.status(400).json({ success: false, message: "teamId and mentorId are required" });
    }

    const team = await Team.findByPk(teamId);
    if (!team || team.status === 'disbanded') {
      return res.status(404).json({ success: false, message: "Team not found or disbanded" });
    }

    const mentor = await Mentor.findByPk(mentorId);
    if (!mentor) {
      return res.status(404).json({ success: false, message: "Mentor not found" });
    }

    await team.update({ mentor_id: mentorId ,status: 'approved'});

    res.json({ success: true, message: "Mentor assigned successfully", teamId, mentorId });
  } catch (err) {
    console.error("Error assigning mentor:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};



//function to getallprojects
const getAllProjects = async (req, res) => {
  try {
    const pt1Projects = await ProfessionalTraining1.findAll({
      where: { approved_status: { [Op.ne]: 'completed' } },
      include: [{
        model: Team,
        include: [
          {
            model: Student,
            as: 'Student1',
            attributes: ['id', 'student_name', 'reg_number', 'profile_pic_url']
          },
          {
            model: Student,
            as: 'Student2',
            attributes: ['id', 'student_name', 'reg_number', 'profile_pic_url']
          },
          {
            model: Mentor,
            attributes: ['id', 'name']
          }
        ]
      }]
    });

    const pt2Projects = await ProfessionalTraining2.findAll({
      where: { approved_status: { [Op.ne]: 'completed' } },
      include: [{
        model: Team,
        include: [
          {
            model: Student,
            as: 'Student1',
            attributes: ['id', 'student_name', 'reg_number', 'profile_pic_url']
          },
          {
            model: Student,
            as: 'Student2',
            attributes: ['id', 'student_name', 'reg_number', 'profile_pic_url']
          },
          {
            model: Mentor,
            attributes: ['id', 'name']
          }
        ]
      }]
    });

    const finalYearProjects = await FinalYearProject.findAll({
      where: { approved_status: { [Op.ne]: 'completed' } },
      include: [{
        model: Team,
        include: [
          {
            model: Student,
            as: 'Student1',
            attributes: ['id', 'student_name', 'reg_number', 'profile_pic_url']
          },
          {
            model: Student,
            as: 'Student2',
            attributes: ['id', 'student_name', 'reg_number', 'profile_pic_url']
          },
          {
            model: Mentor,
            attributes: ['id', 'name']
          }
        ]
      }]
    });

    res.json({
      success: true,
      data: {
        ProfessionalTraining1: pt1Projects,
        ProfessionalTraining2: pt2Projects,
        FinalYearProject: finalYearProjects,
      }
    });
  } catch (error) {
    console.error("Error retrieving projects:", error);
    res.status(500).json({ success: false, error: 'Failed to retrieve projects' });
  }
};
  

  //---------------delete selected Project files-----------------------------
  const clearProjectFiles = async (req, res) => {
    const { type, id } = req.params;
    const { abstract = false, ppt = false, report = false, demo = false } = req.body || {};
  
    const modelMap = {
      "ProfessionalTraining1": ProfessionalTraining1,
      "ProfessionalTraining2": ProfessionalTraining2,
      "FinalYearProject": FinalYearProject,
    };
  
    const ProjectModel = modelMap[type];
    if (!ProjectModel) return res.status(400).json({ error: "Invalid project type" });
  
    try {
      const project = await ProjectModel.findByPk(id);
      if (!project) return res.status(404).json({ error: "Project not found" });
  
      if (abstract) project.abstract_url = null;
      if (ppt) project.ppt_url = null;
      if (report) project.report_pdf_url = null;
      if (demo) project.demo_video_url = null;
  
      await project.save();
      res.json({ success: true, message: "Links cleared successfully" });
    } catch (error) {
      console.error("Error clearing project files:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  //----------------------------- Remove Entire Project-------------------
  const deleteProject = async (req, res) => {
    const { type, id } = req.params;
  
    const modelMap = {
      "ProfessionalTraining1": ProfessionalTraining1,
      "ProfessionalTraining2": ProfessionalTraining2,
      "FinalYearProject": FinalYearProject,
    };
  
    const ProjectModel = modelMap[type];
  
    if (!ProjectModel) return res.status(400).json({ error: "Invalid project type" });
  
    try {
      const project = await ProjectModel.findByPk(id);
      if (!project) return res.status(404).json({ error: "Project not found" });
  
      await project.destroy();
      res.json({ success: true, message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };







  
  //--------------------------------- Announcements -------------------------------------
  const addAnnouncement = async (req, res) => {
    const { title, description, role, semester, department } = req.body;
  
    try {
      // Create a new announcement
      const newAnnouncement = await Announcement.create({
        title,
        description,
        role,
        semester,
        department,
      });
  
      return res.status(201).json({ message: 'Announcement added successfully.', announcement: newAnnouncement });
    } catch (error) {
      console.error('Error adding announcement:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  };

  const shiftStudents = async (req, res) => {
    try {
      // Step 1: Fetch all students
      const students = await Student.findAll();
  
      if (students.length === 0) {
        return res.status(404).json({ message: "No students found" });
      }
  
      // Step 2: Increment each student's semester (even beyond 8)
      for (const student of students) {
        const newSemester = student.current_semester - 1;
        await student.update({ current_semester: newSemester });
      }
  
      // Step 3: Update teams where both students are now in the same semester
      const teams = await Team.findAll({
        include: [
          { model: Student, as: "Student1" },
          { model: Student, as: "Student2" }
        ]
      });
  
      let updatedTeams = 0;
  
      for (const team of teams) {
        const s1 = team.Student1?.current_semester;
        const s2 = team.Student2?.current_semester;
  
        if (s1 === s2 && team.current_semester !== s1) {
          await team.update({ current_semester: s1 });
          updatedTeams++;
        }
      }
  
      res.json({
        message: `All students incremented by 1 semester`,
        studentsUpdated: students.length,
        teamsUpdated: updatedTeams
      });
    } catch (error) {
      console.error("❌ Error incrementing semesters:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  const getAllAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.findAll();
        res.json(announcements);
    } catch (error) {
        console.error("Error retrieving announcements:", error);
        res.status(500).json({ error: 'Failed to retrieve announcements' });
    }
};

const deleteAnnouncement = async (req, res) => {
    const announcementId = req.params.id; // Get the announcement ID from the request parameters
    
    try {
        const announcement = await Announcement.findByPk(announcementId);
        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        await announcement.destroy(); // Delete the announcement
        res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error("Error deleting announcement:", error);
        res.status(500).json({ error: 'Failed to delete announcement' });
    }
};




const updateAdminPassword = async (req, res) => {
  const { email, currentPassword, newPassword, confirmPassword } = req.body;

  try {
    // 1. Find the admin by email
    const admin = await Mentor.findOne({ where: { email } });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // 2. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // 3. Check if new passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    // 4. Hash and update the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await admin.update({ password: hashedPassword });

    return res.status(200).json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error('Error updating admin password:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};



const getDashboardStats = async (req, res) => {
  try {
    // 1. Count total students and mentors
    const [totalStudents, totalMentors] = await Promise.all([
      Student.count(),
      Mentor.count({ where: { role: 'mentor' } }),
    ]);

    // 2. Count active teams
    const activeTeams = await Team.count({
      where: {
        status: { [Op.not]: 'disbanded' },
        mentor_id: { [Op.ne]: null }
      },
    });

    // 3. Count unassigned students using raw SQL (fixes the bug)
    const [unassignedStudentsRaw] = await sequelize.query(`
      SELECT COUNT(*) FROM "Students"
      WHERE "id" NOT IN (
        SELECT DISTINCT "student1_id" FROM "Teams" WHERE "status" != 'disbanded' AND "student1_id" IS NOT NULL
        UNION
        SELECT DISTINCT "student2_id" FROM "Teams" WHERE "status" != 'disbanded' AND "student2_id" IS NOT NULL
      )
    `);
    const unassignedStudents = parseInt(unassignedStudentsRaw[0].count || 0);

    // 4. Available mentors based on capacity and teams assigned
    const mentors = await Mentor.findAll({
      where: { role: 'mentor' },
      attributes: ['id', 'max_pt1', 'max_pt2', 'max_final_year']
    });

    const availableMentors = await Promise.all(
      mentors.map(async (mentor) => {
        const [pt1, pt2, final] = await Promise.all([
          Team.count({
            where: {
              mentor_id: mentor.id,
              current_semester: 5,
              status: { [Op.not]: 'disbanded' }
            }
          }),
          Team.count({
            where: {
              mentor_id: mentor.id,
              current_semester: 6,
              status: { [Op.not]: 'disbanded' }
            }
          }),
          Team.count({
            where: {
              mentor_id: mentor.id,
              current_semester: { [Op.in]: [7, 8] },
              status: { [Op.not]: 'disbanded' }
            }
          }),
        ]);

        return (pt1 < mentor.max_pt1 || pt2 < mentor.max_pt2 || final < mentor.max_final_year) ? 1 : 0;
      })
    );

    const availableMentorCount = availableMentors.reduce((sum, v) => sum + v, 0);

    // 5. Project stats
    const [pt1Projects, pt2Projects, fyProjects] = await Promise.all([
      ProfessionalTraining1.findAll(),
      ProfessionalTraining2.findAll(),
      FinalYearProject.findAll(),
    ]);

    const allProjects = [...pt1Projects, ...pt2Projects, ...fyProjects];
    const activeProjects = allProjects.length;
    const submissionsApproved = allProjects.filter(p => p.approved_status === 'approved').length;
    const pendingReviews = allProjects.filter(p => p.approved_status === 'pending').length;

    // 6. Final response
    res.json({
      success: true,
      data: {
        totalStudents,
        totalMentors,
        activeTeams,
        projectSubmissions: activeProjects,
        unassignedStudents,
        availableMentors: availableMentorCount,
        activeProjects,
        submissionsApproved,
        pendingReviews
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: err.message
    });
  }
};






module.exports = {
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
  getDashboardStats


  
};
