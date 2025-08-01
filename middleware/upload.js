const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "team_uploads",
    allowed_formats: ["jpg", "png", "pdf", "docx", "pptx"],
  },
});

const upload = multer({ storage });

module.exports = upload;
