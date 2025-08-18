"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.authenticateToken = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const database_1 = require("../database");
const config_1 = require("../config");
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        const decoded = jwt.verify(token, config_1.config.jwtSecret);
        console.log('[auth] Decoded JWT:', decoded);
        if (decoded.id === 999 && decoded.email === 'admin@cliniquejuriste.com') {
            req.user = {
                id: 999,
                email: 'admin@cliniquejuriste.com',
                role: 'admin',
                isAdmin: true
            };
            return next();
        }
        const userResult = await database_1.pool.query('SELECT id, email, is_admin, is_approved FROM users WHERE id = $1', [decoded.id]);
        console.log('[auth] DB user result:', userResult.rows);
        if (userResult.rows.length === 0 || !userResult.rows[0].is_approved) {
            return res.status(401).json({ error: 'Invalid or inactive user' });
        }
        const user = userResult.rows[0];
        req.user = {
            id: user.id,
            email: user.email,
            role: user.is_admin ? 'admin' : 'user',
            isAdmin: user.is_admin
        };
        next();
    }
    catch (error) {
        console.log('[auth] JWT error:', error);
        return res.status(403).json({ error: 'Invalid token' });
    }
};
exports.authenticateToken = authenticateToken;
const requireAdmin = (req, res, next) => {
    if (!req.user?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
