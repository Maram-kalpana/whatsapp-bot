const fs = require("fs");
const path = require("path");
const multer = require("multer");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

const logoDir = path.join(__dirname, "../../uploads/logos");
const mediaDir = path.join(__dirname, "../../uploads/media");
const csvDir = path.join(__dirname, "../../uploads/csv");
ensureDir(logoDir);
ensureDir(mediaDir);
ensureDir(csvDir);

function disk(dir, prefix) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase() || "";
      cb(null, `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });
}

const uploadLogo = multer({
  storage: disk(logoDir, "logo"),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) {
      cb(new Error("Logo must be an image (png, jpg, webp, gif)"));
      return;
    }
    cb(null, true);
  },
});

const uploadMedia = multer({
  storage: disk(mediaDir, "media"),
  limits: { fileSize: 16 * 1024 * 1024 },
});

const uploadCsv = multer({
  storage: disk(csvDir, "csv"),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/\.(csv|txt)$/i.test(file.originalname || "") && file.mimetype !== "text/csv") {
      cb(new Error("Please upload a CSV file"));
      return;
    }
    cb(null, true);
  },
});

const productDir = path.join(__dirname, "../../uploads/products");
ensureDir(productDir);

const uploadProduct = multer({
  storage: disk(productDir, "product"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) {
      cb(new Error("Product image must be png, jpg, webp, or gif"));
      return;
    }
    cb(null, true);
  },
});

module.exports = { uploadLogo, uploadMedia, uploadCsv, uploadProduct, logoDir, mediaDir, productDir };
