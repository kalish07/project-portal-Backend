const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profile_pics/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Keep original name (e.g., 43612001-Name.jpg)
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
    cb(null, true);
  } else {
    cb(new Error("Only .jpg, .jpeg, .png files are allowed"));
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;