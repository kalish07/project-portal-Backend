const jwt = require("jsonwebtoken");
const { Student,Team,Sequelize } = require("../models"); // Ensure correct model import
const { Op } = Sequelize; 

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({ message: "Unauthorized: Invalid token data" });
    }

    const student = await Student.findByPk(decoded.userId);
    if (!student) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔍 Find the student's team using either student1_id or student2_id
    const team = await Team.findOne({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { student1_id: student.id },
              { student2_id: student.id }
            ]
          },
          { status: 'approved' } // Ensure the team status is approved
        ]
      }
    });

    req.user = {
      id: student.id,
      role: decoded.role,
      team_id: team?.id || null,
      mentor_id: team?.mentor_id || null
    };

    next();
  } catch (error) {
    console.error("Auth Error:", error.message);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

const authenticateMentor = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Assuming the token is sent as "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use your secret key
    req.mentorId = decoded.id; // Assuming the token contains the mentor's ID as "id"
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};



const authorize = (roles) => (req, res, next) => {
  const role = req.user?.role || (req.adminId && 'admin');
  if (!role || !roles.includes(role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

const authenticateAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token has correct role
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Not an admin" });
    }

    req.adminId = decoded.userId; // Attach admin ID from token
    next(); // Move to next middleware
  } catch (error) {
    console.error("Admin Auth Error:", error.message);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = { authenticate, authorize, authenticateMentor,authenticateAdmin };
