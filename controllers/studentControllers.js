const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { Student, Team, Mentor, ProfessionalTraining1, ProfessionalTraining2, FinalYearProject, Announcement } = require("../models");
const team = require("../models/team");
const { doesNotMatch } = require("assert");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

// Student Registration
exports.registerStudent = async (req, res) => {
  try {
      const { student_name, reg_number, department_name, current_semester, email, password, profile_pic_url } = req.body;

      console.log(req.body);

      if (!student_name || !reg_number || !department_name || !current_semester || !email || !password) {
          return res.status(400).json({ error: "All fields are required." });
      }

      const existingStudent = await Student.findOne({ where: { email } });
      if (existingStudent) {
          return res.status(400).json({ error: "Student already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const student = await Student.create({
          student_name,
          reg_number,
          department_name,
          current_semester,
          email,
          password: hashedPassword,
          profile_pic_url,
      });

      res.status(201).json({ message: "Registration successful", student });
  } catch (error) {
      res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Student Login
exports.loginStudent = async (req, res) => {
  const { register_number, password } = req.body;
  console.log(register_number, password);
  
  try {
    // Find the student by registration number
    const student = await Student.findOne({ where: { reg_number:register_number } });
    if (!student) {
      return res.status(401).json({ error: 'Invalid registration number or password' });
    }

    // Compare the provided password with the stored hashed password
    const isValidPassword = await bcrypt.compare(password, student.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid registration number or password' });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: student.id, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });

    // Respond with the token and student details
    res.json({
      token,
      role: 'student',
      name: student.student_name, // Ensure this matches your model
      regNumber: student.reg_number, // Ensure this matches your model
      mail: student.email,
      studentId: student.id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStudentTeam = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Fetch the team details where the student is part of the team
    const team = await Team.findOne({
      where: {
        [Op.or]: [{ student1_id: studentId }, { student2_id: studentId }]
      }
    });

    if (!team) {
      return res.status(404).json({ message: "No team found for this student." });
    }

    // Fetch student1 and student2 details
    const student1 = await Student.findByPk(team.student1_id, {
      attributes: ["id", "student_name", "email", "reg_number", "department_name"]
    });

    const student2 = team.student1_id !== team.student2_id 
      ? await Student.findByPk(team.student2_id, {
          attributes: ["id", "student_name", "email", "reg_number", "department_name"]
        }) 
      : null; // If IDs are the same, don't fetch student2

    // Fetch mentor details
    const mentor = await Mentor.findByPk(team.mentor_id, {
      attributes: ["id", "name", "email"]
    });

    const [training1, training2, finalProject] = await Promise.all([
        ProfessionalTraining1.findOne({ where: { team_id: team.id } }),
        ProfessionalTraining2.findOne({ where: { team_id: team.id } }),
        FinalYearProject.findOne({ where: { team_id: team.id } })
      ]);

    // Construct the response
    const response = {
      id: team.id,
      status: team.status,
      members: student2 ? [student1, student2] : [student1], // If student2 is null, only send student1
      mentor: mentor || null,
      projects: {
        ProfessionalTraining1: training1 || null,
        ProfessionalTraining2: training2 || null,
        FinalYearProject: finalProject || null
      }
    };

    res.status(200).json ({ team: response });
  } catch (error) {
    console.error("Error fetching student team:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.getStudentProjects = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Fetch the student's current semester
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Find teams where the student is part of (either student1 or student2)
    const teams = await Team.findAll({
      where: {
        [Op.or]: [
          { student1_id: studentId },
          { student2_id: studentId }
        ]
      },
    });

    if (!teams.length) {
      return res.status(404).json({ message: 'No teams found for this student.' });
    }

    // Extract team IDs
    const teamIds = teams.map(team => team.id);
    const teamStatus = teams.map(team => team.status);

    // Fetch projects from all three models
    const professionalTraining1Projects = await ProfessionalTraining1.findAll({
      where: { team_id: teamIds }
    });

    const professionalTraining2Projects = await ProfessionalTraining2.findAll({
      where: { team_id: teamIds }
    });

    const finalYearProjects = await FinalYearProject.findAll({
      where: { team_id: teamIds }
    });

    res.json({
      current_semester: student.current_semester, // Include the current semester in the response
      professionalTraining1Projects,
      professionalTraining2Projects,
      finalYearProjects,
      teamStatus: teamStatus[0]
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addProjectDetails = async (req, res) => {
  try {
    const { studentId, title, description, project_type } = req.body;

    // Ensure required fields exist; description can be optional if needed
    if (!studentId || !title || !req.file || !project_type) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Extract uploaded file URL and normalize path
    const abstract_url = req.file.path.replace(/\\/g, "/");

    // Check if the student is in a team
    const team = await Team.findOne({
      where: {
        [Op.or]: [{ student1_id: studentId }, { student2_id: studentId }],
      },
    });

    if (!team) {
      return res.status(404).json({ message: "Team not found for this student." });
    }

    const { id, mentor_id } = team;
    let newProject;

    // Save the project based on its type
    if (project_type === "pt1") {
      newProject = await ProfessionalTraining1.create({
        title,           // Updated field name to match model
        description,     // Added description field
        team_id: id,
        mentor_id,
        abstract_url,
        report_pdf_url: null,
        ppt_url: null,
        approved_status: "pending",
      });
    } else if (project_type === "pt2") {
      newProject = await ProfessionalTraining2.create({
        title,
        description,     // Added description field
        team_id: id,
        mentor_id,
        abstract_url,
        report_pdf_url: null,
        ppt_url: null,
        approved_status: "pending",
      });
    } else if (project_type === "fYear") {
      newProject = await FinalYearProject.create({
        title,
        description,     // Added description field
        team_id: id,
        mentor_id,
        abstract_url,
        report_pdf_url: null,
        ppt_url: null,
        approved_status: "pending",
      });
    } else {
      return res.status(400).json({ message: "Invalid project type." });
    }

    res.status(201).json({ message: "Project details added successfully.", project: newProject });
  } catch (error) {
    console.error("Error adding project details:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};


exports.deleteProject = async (req, res) => {
  const projectId = req.params.projectId;
  const projectType = req.query.projectType;

  try {
      let project;

      // Determine which model to use based on the project type
      if (projectType === 'pt1') {
          project = await ProfessionalTraining1.findByPk(projectId);
      } else if (projectType === 'pt2') {
          project = await ProfessionalTraining2.findByPk(projectId);
      } else if (projectType === 'fYear') {
          project = await FinalYearProject.findByPk(projectId);
      } else {
          return res.status(400).json({ message: 'Invalid project type' });
      }

      // Check if the project exists
      if (!project) {
          return res.status(404).json({ message: 'Project not found' });
      }

      // Delete the project
      await project.destroy();

      // Respond with a success message res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: 'Error deleting project' });
  }
};



exports.getStudentProfile = async (req, res) => {
  try {
    const studentId = req.params.id; 
    const student = await Student.findByPk(studentId); // Fetch the student from the database

    if (!student) {
      return res.status(404).json({ message: 'Student not found' }); // Handle case where student is not found
    }

    // Return only the necessary fields
    res.json({
      student_name: student.student_name,
      email: student.email,
      profile_pic_url: student.profile_pic_url,
      reg_number: student.reg_number,
      department_name: student.department_name,
      current_semester: student.current_semester,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' }); // Handle server errors
  }
};


exports.getStudentAnnouncements = async (req, res) => {
  const { semester, department } = req.query; // Get semester and department from query parameters

  try {
    const announcements = await Announcement.findAll({
      where: {
        semester: semester,
        department: department,
      },
    });
    res.json(announcements);
  } catch (error) {
    console.error("Error retrieving announcements:", error);
    res.status(500).json({ error: 'Failed to retrieve announcements' });
  }
};


// Controller to handle report submission
exports.submitReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(406).json({ message: 'No file uploaded. Please upload a PDF report.' });
    }

    const { projectId } = req.params;
    const reportPath = `/uploads/reports/${req.file.filename}`;
    const { projectType, team_id } = req.body; // Get project_type and team_id from the request body

    let project;

    // Determine which project type to update
    if (projectType === 'fYear') {
      project = await FinalYearProject.findOne({ where: { id: projectId, team_id } });
    } else if (projectType === 'pt1') {
      project = await ProfessionalTraining1.findOne({ where: { id: projectId, team_id } });
    } else if (projectType === 'pt2') {
      project = await ProfessionalTraining2.findOne({ where: { id: projectId, team_id } });
    } else {
      return res.status(400).json({ message: 'Invalid project type.' });
    }

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Update the report_pdf_url field
    project.report_pdf_url = reportPath;
    await project.save();

    res.status(200).json({ message: 'Report uploaded successfully', filePath: reportPath });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading report', error: error.message });
  }
};

exports.submitPPT = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(406).json({ message: 'No file uploaded. Please upload a PPT file.' });
    }

    const { projectId } = req.params;
    const pptPath = `/uploads/ppt/${req.file.filename}`;
    const { projectType, team_id } = req.body; // Get project_type and team_id from the request body

    let project;

    // Determine which project type to update
    if (projectType === 'fYear') {
      project = await FinalYearProject.findOne({ where: { id: projectId, team_id } });
    } else if (projectType === 'pt1') {
      project = await ProfessionalTraining1.findOne({ where: { id: projectId, team_id } });
    } else if (projectType === 'pt2') {
      project = await ProfessionalTraining2.findOne({ where: { id: projectId, team_id } });
    } else {
      return res.status(400).json({ message: 'Invalid project type.' });
    }

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Update the ppt_url field
    project.ppt_url = pptPath;
    await project.save();

    res.status(200).json({ message: 'PPT uploaded successfully', filePath: pptPath });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading PPT', error: error.message });
  }
};

exports.updateStudentPassword = async (req, res) => {
  const { email, currentPassword, newPassword, confirmPassword } = req.body;

  try {
    // 1. Find student by email
    const student = await Student.findOne({ where: { email } });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // 2. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, student.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // 3. Validate new password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    // 4. Hash and update the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await student.update({ password: hashedPassword });

    return res.status(200).json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};