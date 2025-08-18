"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path_1.default.join(__dirname, '../../uploads/videos');
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path_1.default.extname(file.originalname);
        cb(null, `video-${uniqueSuffix}${fileExtension}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /\.(mp4|avi|mov|wmv|mkv|webm|m4v)$/i;
        const allowedMimes = /^video\//;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedMimes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Seuls les fichiers vidéo sont autorisés'));
        }
    },
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '500') * 1024 * 1024
    }
});
router.post('/upload', auth_1.authenticateToken, auth_1.requireAdmin, (req, res) => {
    upload.single('video')(req, res, async (err) => {
        try {
            if (err instanceof multer_1.default.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'Fichier trop volumineux'
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: 'Erreur de téléchargement: ' + err.message
                });
            }
            else if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Aucun fichier vidéo téléchargé'
                });
            }
            const { title, course_id } = req.body;
            if (!title || !course_id) {
                fs_1.default.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'Titre et ID de cours requis'
                });
            }
            const courseResult = await database_1.default.query('SELECT id FROM courses WHERE id = $1 AND is_active = TRUE', [course_id]);
            if (courseResult.rows.length === 0) {
                fs_1.default.unlinkSync(req.file.path);
                return res.status(404).json({
                    success: false,
                    message: 'Cours non trouvé'
                });
            }
            const result = await database_1.default.query(`
        INSERT INTO videos (title, course_id, file_path, file_size, mime_type) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING *
      `, [
                title.trim(),
                course_id,
                req.file.filename,
                req.file.size,
                req.file.mimetype
            ]);
            res.status(201).json({
                success: true,
                message: 'Vidéo téléchargée avec succès',
                data: {
                    id: result.rows[0].id,
                    title: result.rows[0].title,
                    file_size: result.rows[0].file_size,
                    created_at: result.rows[0].created_at
                }
            });
        }
        catch (error) {
            console.error('Video upload error:', error);
            if (req.file && fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
            res.status(500).json({
                success: false,
                message: 'Erreur serveur'
            });
        }
    });
});
router.get('/stream/:id', auth_1.authenticateToken, auth_1.requireApproved, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Utilisateur non authentifié'
            });
            return;
        }
        const videoId = parseInt(req.params.id);
        if (isNaN(videoId)) {
            res.status(400).json({
                success: false,
                message: 'ID de vidéo invalide'
            });
            return;
        }
        const videoResult = await database_1.default.query('SELECT * FROM videos WHERE id = $1 AND is_active = TRUE', [videoId]);
        if (videoResult.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: 'Vidéo non trouvée'
            });
            return;
        }
        const video = videoResult.rows[0];
        if (!req.user.is_admin) {
            const accessResult = await database_1.default.query('SELECT 1 FROM user_courses WHERE user_id = $1 AND course_id = $2 AND is_active = TRUE', [req.user.id, video.course_id]);
            if (accessResult.rows.length === 0) {
                res.status(403).json({
                    success: false,
                    message: 'Accès refusé à cette vidéo'
                });
                return;
            }
        }
        const videoPath = path_1.default.join(__dirname, '../../uploads/videos', video.file_path);
        if (!fs_1.default.existsSync(videoPath)) {
            res.status(404).json({
                success: false,
                message: 'Fichier vidéo non trouvé'
            });
            return;
        }
        const stat = fs_1.default.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs_1.default.createReadStream(videoPath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': video.mime_type || 'video/mp4',
                'Cache-Control': 'private, max-age=3600',
                'X-Content-Type-Options': 'nosniff'
            };
            res.writeHead(206, head);
            file.pipe(res);
        }
        else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': video.mime_type || 'video/mp4',
                'Cache-Control': 'private, max-age=3600',
                'X-Content-Type-Options': 'nosniff'
            };
            res.writeHead(200, head);
            fs_1.default.createReadStream(videoPath).pipe(res);
        }
    }
    catch (error) {
        console.error('Video streaming error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
exports.default = router;
