// middleware/uploadZip.js
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Store ZIP temporarily
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const zipFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".zip") {
    cb(null, true);
  } else {
    cb(new Error("Only ZIP files are allowed."));
  }
};

const uploadZip = multer({ storage, fileFilter: zipFileFilter });

module.exports = uploadZip;