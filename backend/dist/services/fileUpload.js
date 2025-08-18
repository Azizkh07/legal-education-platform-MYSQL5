"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldFiles = exports.getSecureVideoUrl = exports.uploadVideo = exports.uploadImage = exports.upload = exports.fileFilter = exports.storage = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const uploadsDir = path_1.default.join(__dirname, '../../uploads');
const imagesDir = path_1.default.join(uploadsDir, 'images');
const videosDir = path_1.default.join(uploadsDir, 'videos');
[uploadsDir, imagesDir, videosDir].forEach(dir => {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
});
exports.storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'video') {
            cb(null, videosDir);
        }
        else if (file.fieldname === 'cover_image' || file.fieldname === 'image') {
            cb(null, imagesDir);
        }
        else {
            cb(null, uploadsDir);
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = `${crypto_1.default.randomUUID()}-${Date.now()}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
const fileFilter = (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
    if (file.fieldname === 'video') {
        if (allowedVideoTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid video format. Only MP4, AVI, MOV, WMV, WEBM allowed.'));
        }
    }
    else if (file.fieldname === 'cover_image' || file.fieldname === 'image') {
        if (allowedImageTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid image format. Only JPG, PNG, WEBP allowed.'));
        }
    }
    else {
        cb(new Error('Unknown file field.'));
    }
};
exports.fileFilter = fileFilter;
exports.upload = (0, multer_1.default)({
    storage: exports.storage,
    fileFilter: exports.fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024,
    }
});
const uploadImage = async (file) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/uploads/images/${file.filename}`;
};
exports.uploadImage = uploadImage;
const uploadVideo = async (file, videoKey) => {
    return `uploads/videos/${file.filename}`;
};
exports.uploadVideo = uploadVideo;
const getSecureVideoUrl = async (videoPath) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/${videoPath}`;
};
exports.getSecureVideoUrl = getSecureVideoUrl;
const cleanupOldFiles = (maxAgeHours = 24) => {
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    [imagesDir, videosDir].forEach(dir => {
        fs_1.default.readdir(dir, (err, files) => {
            if (err)
                return;
            files.forEach(file => {
                const filePath = path_1.default.join(dir, file);
                fs_1.default.stat(filePath, (err, stats) => {
                    if (err)
                        return;
                    if (now - stats.mtime.getTime() > maxAge) {
                        fs_1.default.unlink(filePath, (err) => {
                            if (!err)
                                console.log(`🗑️ Cleaned up old file: ${file}`);
                        });
                    }
                });
            });
        });
    });
};
exports.cleanupOldFiles = cleanupOldFiles;
