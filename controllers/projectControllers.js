const { ProfessionalTraining1, ProfessionalTraining2, FinalYearProject,Team } = require('../models');
const { Op } = require('sequelize'); // Ensure you import Op from Sequelize
const { sendEmail } = require('../middleware/mailMiddleware')
// Choose the correct table
const getProjectModel = (projectType) => {
    const models = {
        'ProfessionalTraining1': ProfessionalTraining1,
        'ProfessionalTraining2': ProfessionalTraining2,
        'FinalYearProject': FinalYearProject,
    };
    return models[projectType] || null;
};

// ===================== Student submits project =====================


exports.requestProject = async (req, res) => {
  try {
    const { title, description, abstract_url, domain, project_type } = req.body;

    // Check for required fields
    if (!title || !abstract_url || !domain || !project_type || !description) {
      return res.status(422).json({ error: 'All fields are required' });
    }

    const ProjectModel = getProjectModel(project_type);
    if (!ProjectModel) {
      return res.status(400).json({ error: 'Invalid project type' });
    }

    // Fetch all teams associated with the user
    const teams = await Team.findAll({
      where: {
        [Op.or]: [
          { student1_id: req.user.id },
          { student2_id: req.user.id }
        ]
      }
    });

    // Find the first approved team
    const approvedTeam = teams.find(team => team.status === 'approved');

    if (!approvedTeam) {
      return res.status(403).json({ error: 'No approved team found' });
    }

    // Check if the mentor is assigned to the approved team
    if (!approvedTeam.mentor_id) {
      return res.status(400).json({ error: 'Mentor not assigned to your team' });
    }

    // Create the project using the approved team's ID
    const project = await ProjectModel.create({
      title,
      abstract_url,
      description,
      domain,
      zero_review_marks: 0,
      first_review_marks: 0,
      second_review_marks: 0,
      team_id: approvedTeam.id, // Use the approved team's ID
      mentor_id: approvedTeam.mentor_id, // Use the mentor ID from the approved team
      status: 'pending' // Set the initial status of the project
    });

    res.status(201).json({ message: 'Project request submitted successfully', project });
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};



// ===================== Withdraw project request =====================
exports.withdrawProjectRequest = async (req, res) => {
    try {
        const { projectType } = req.query;
        const { projectId } = req.params;
        console.log(projectType,projectId)

        if (!projectType) {
            return res.status(400).json({ error: 'Project type is required' });
        }

        const ProjectModel = getProjectModel(projectType);
        if (!ProjectModel) {
            return res.status(400).json({ error: 'Invalid project type' });
        }

        const project = await ProjectModel.findByPk(projectId);
        console.log(project);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Only allow withdrawal if project is still pending
        if (project.approved_status !== 'pending') {
            return res.status(403).json({ error: 'Project cannot be withdrawn after approval or rejection' });
        }
        console.log("passed project approval status");

        // Ensure student belongs to the team
        if (project.team_id !== req.user.team_id) {
            return res.status(403).json({ error: 'Unauthorized to withdraw this project' });
        }

        await project.destroy();

        res.json({ message: 'Project request withdrawn successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
};

// ===================== Approve/Reject project =====================
exports.approveProject = async (req, res) => {
    try {
        const {
            status,
            mentor_id,
            project_type,
            zero_review_marks,
            first_review_marks,
            second_review_marks
        } = req.body;

        if (!status || !project_type) {
            return res.status(422).json({ error: 'Status and project type are required' });
        }

        const ProjectModel = getProjectModel(project_type);
        if (!ProjectModel) return res.status(400).json({ error: 'Invalid project type' });

        const project = await ProjectModel.findByPk(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        project.status = status;
        project.mentor_id = mentor_id || req.user.id;

        if (zero_review_marks !== undefined) project.zero_review_marks = zero_review_marks;
        if (first_review_marks !== undefined) project.first_review_marks = first_review_marks;
        if (second_review_marks !== undefined) project.second_review_marks = second_review_marks;

        await project.save();

        res.json({ message: `Project ${status} successfully`, project });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
};

// ===================== View projects =====================
exports.viewProjects = async (req, res) => {
    try {
        const { project_type } = req.query;
        if (!project_type) return res.status(422).json({ error: 'Project type is required' });

        const ProjectModel = getProjectModel(project_type);
        if (!ProjectModel) return res.status(400).json({ error: 'Invalid project type' });

        const projects = await ProjectModel.findAll();
        res.json({ projects });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
};

// ===================== Submit report & PPT =====================
exports.submitDocumentLink = async (req, res) => {
  try {
    // CORRECTED: Access fields directly from req.body, not req.body.link
    const { project_type, link, doc_type } = req.body;
    const { id: projectId } = req.params;

    // Validate required fields
    if (!project_type || !link || !doc_type) {
      return res.status(400).json({ 
        error: 'Missing required fields: project_type, link, or doc_type',
        received: req.body // This will help debug what's actually being received
      });
    }

    if (typeof link !== 'string' || !link.startsWith("https://")) {
      return res.status(400).json({ error: 'Invalid or missing Google Drive link' });
    }

    const ProjectModel = getProjectModel(project_type);
    if (!ProjectModel) {
      return res.status(400).json({ error: 'Invalid project type' });
    }

    const project = await ProjectModel.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.approved_status !== 'approved') {
      return res.status(400).json({ error: 'Project must be approved before submitting documents' });
    }

    const docTypeMap = {
      'Abstract': 'abstract_url',
      'Report': 'report_pdf_url',
      'Slide Deck': 'ppt_url',
      'Demo Video': 'demo_video_url'
    };

    const backendField = docTypeMap[doc_type];
    if (!backendField) {
      return res.status(400).json({ 
        error: 'Invalid document type',
        validTypes: Object.keys(docTypeMap)
      });
    }

    // Update document link field
    project[backendField] = link;
    await project.save();

    return res.status(200).json({
      message: 'Document link submitted successfully',
      updatedField: backendField,
      projectId: projectId,
      project: {
        id: project.id,
        title: project.title,
        [backendField]: link,
        approved_status: project.approved_status
      }
    });
  } catch (err) {
    console.error('Document submission failed:', err);
    return res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
};


