const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Base directory for uploads
const uploadBaseDir = path.join(__dirname, '../uploads');

// Ensure base directories exist
const folders = ['abstracts', 'reports', 'ppt'];
folders.forEach(folder => {
    const dir = path.join(uploadBaseDir, folder);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadDir;
        console.log(req.body);

        // Choose folder based on fileType in request body
        const fileType = req.body.fileType;
        console.log(fileType); // Expecting fileType to be sent in the request body
        if (fileType === 'abstract') {
            uploadDir = path.join(uploadBaseDir, 'abstracts');
        } else if (fileType === 'report') {
            uploadDir = path.join(uploadBaseDir, 'reports');
        } else if (fileType === 'ppt') {
            uploadDir = path.join(uploadBaseDir, 'ppt');
        } else {
            return cb(new Error('Invalid file upload type'), false);
        }

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const { team_id } = req.body; // Ensure team_id is retrieved from the request body
        if (!team_id) {
            return cb(new Error('team ID is required'), false);
        }

        // Sanitize team_id for filename
        const sanitizedTeamId = team_id.trim().replace(/\s+/g, '_');
        const uniqueSuffix = Date.now();
        cb(null, `${sanitizedTeamId}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// File filter: Allow only PDFs & PPTs
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and PPT are allowed.'), false);
    }
};

// Multer upload middleware
const upload = multer({ storage, fileFilter });

module.exports = upload;