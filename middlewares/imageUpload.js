const multer = require("multer");
const ErrorHandler = require("../utils/errorHandler");

const generateUniqueFilename = (file) => {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const fileExtension = file.originalname.split(".").pop();
  return uniqueSuffix + "." + fileExtension;
};
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/kyc/"); // Define your destination folder
  },
  filename: function (req, file, cb) {
    cb(null, generateUniqueFilename(file));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new ErrorHandler("Invalid file type. Only images are allowed.", 401));
  }
};

const imageUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5 MB file size limit
});

module.exports = {
  imageUpload,
};
