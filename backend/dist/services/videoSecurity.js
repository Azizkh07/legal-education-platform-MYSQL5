"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVideoFile = exports.verifyVideoAccess = exports.generateSecureVideoUrl = exports.generateVideoKey = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("../config");
const generateVideoKey = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
exports.generateVideoKey = generateVideoKey;
const generateSecureVideoUrl = async (videoPath, userId) => {
    const token = jsonwebtoken_1.default.sign({
        videoPath,
        userId,
        exp: Math.floor(Date.now() / 1000) + (4 * 60 * 60)
    }, config_1.config.videoSecret);
    return `${config_1.config.apiUrl}/api/videos/stream/${token}`;
};
exports.generateSecureVideoUrl = generateSecureVideoUrl;
const verifyVideoAccess = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.videoSecret);
        return {
            videoPath: decoded.videoPath,
            userId: decoded.userId
        };
    }
    catch (error) {
        throw new Error('Invalid video access token');
    }
};
exports.verifyVideoAccess = verifyVideoAccess;
const getVideoFile = (videoPath) => {
    const fullPath = path_1.default.join(__dirname, '../../', videoPath);
    if (!fs_1.default.existsSync(fullPath)) {
        throw new Error('Video file not found');
    }
    return fullPath;
};
exports.getVideoFile = getVideoFile;
