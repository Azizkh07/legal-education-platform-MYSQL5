"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRateLimit = exports.loginRateLimit = exports.createRateLimit = exports.requireApproved = exports.requireAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Token d\'accès requis'
            });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET is not defined');
            res.status(500).json({
                success: false,
                message: 'Configuration serveur manquante'
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const sessionResult = await database_1.default.query(`SELECT s.*, u.id, u.name, u.email, u.is_approved, u.is_admin, u.created_at, u.updated_at
       FROM sessions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.token = $1 AND s.expires_at > NOW()`, [token]);
        if (sessionResult.rows.length === 0) {
            res.status(401).json({
                success: false,
                message: 'Session invalide ou expirée'
            });
            return;
        }
        const session = sessionResult.rows[0];
        const clientIP = req.ip || req.socket.remoteAddress;
        if (session.ip_address !== clientIP) {
            console.warn(`⚠️ IP mismatch for user ${session.email}: ${session.ip_address} vs ${clientIP}`);
        }
        const authRequest = req;
        authRequest.user = {
            id: session.id,
            name: session.name,
            email: session.email,
            is_approved: session.is_approved,
            is_admin: session.is_admin,
            password: '',
            last_ip: session.ip_address,
            created_at: session.created_at,
            updated_at: session.updated_at
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        if (error && typeof error === 'object') {
            if (error.name === 'JsonWebTokenError') {
                res.status(401).json({
                    success: false,
                    message: 'Token invalide'
                });
            }
            else if (error.name === 'TokenExpiredError') {
                res.status(401).json({
                    success: false,
                    message: 'Token expiré'
                });
            }
            else if (error.name === 'NotBeforeError') {
                res.status(401).json({
                    success: false,
                    message: 'Token pas encore valide'
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Erreur d\'authentification'
                });
            }
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Erreur d\'authentification inconnue'
            });
        }
    }
};
exports.authenticateToken = authenticateToken;
const requireAdmin = (req, res, next) => {
    const authRequest = req;
    if (!authRequest.user?.is_admin) {
        res.status(403).json({
            success: false,
            message: 'Accès administrateur requis'
        });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireApproved = (req, res, next) => {
    const authRequest = req;
    if (!authRequest.user?.is_approved) {
        res.status(403).json({
            success: false,
            message: 'Compte en attente d\'approbation'
        });
        return;
    }
    next();
};
exports.requireApproved = requireApproved;
const createRateLimit = (windowMs, max) => {
    const rateLimit = require('express-rate-limit');
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message: 'Trop de tentatives. Veuillez réessayer plus tard.'
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
};
exports.createRateLimit = createRateLimit;
exports.loginRateLimit = (0, exports.createRateLimit)(15 * 60 * 1000, 5);
exports.apiRateLimit = (0, exports.createRateLimit)(15 * 60 * 1000, 100);
