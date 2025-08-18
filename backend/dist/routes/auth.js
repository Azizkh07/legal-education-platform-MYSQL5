"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const createJWTOptions = () => {
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    let expirationValue = expiresIn;
    if (typeof expiresIn === 'string') {
        if (expiresIn.endsWith('h')) {
            expirationValue = expiresIn;
        }
        else if (expiresIn.endsWith('d')) {
            expirationValue = expiresIn;
        }
        else {
            expirationValue = '24h';
        }
    }
    return {
        expiresIn: 3600
    };
};
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: 'Email et mot de passe requis'
            });
            return;
        }
        const clientIP = req.ip || req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';
        const userResult = await database_1.default.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
        if (userResult.rows.length === 0) {
            res.status(401).json({
                success: false,
                message: 'Identifiants invalides'
            });
            return;
        }
        const user = userResult.rows[0];
        const validPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!validPassword) {
            res.status(401).json({
                success: false,
                message: 'Identifiants invalides'
            });
            return;
        }
        if (!user.is_approved) {
            res.status(403).json({
                success: false,
                message: 'Votre compte est en attente d\'approbation'
            });
            return;
        }
        await database_1.default.query('DELETE FROM sessions WHERE user_id = $1', [user.id]);
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined');
        }
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            isAdmin: user.is_admin,
            iat: Math.floor(Date.now() / 1000)
        };
        const signOptions = createJWTOptions();
        const token = jsonwebtoken_1.default.sign(tokenPayload, jwtSecret, signOptions);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        await database_1.default.query('INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at) VALUES ($1, $2, $3, $4, $5)', [user.id, token, clientIP, userAgent, expiresAt]);
        await database_1.default.query('UPDATE users SET last_ip = $1, updated_at = NOW() WHERE id = $2', [clientIP, user.id]);
        res.json({
            success: true,
            message: 'Connexion réussie',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    is_admin: user.is_admin,
                    is_approved: user.is_approved
                }
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la connexion'
        });
    }
});
router.post('/logout', auth_1.authenticateToken, async (req, res) => {
    try {
        const authRequest = req;
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            await database_1.default.query('DELETE FROM sessions WHERE token = $1', [token]);
        }
        res.json({
            success: true,
            message: 'Déconnexion réussie'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la déconnexion'
        });
    }
});
router.get('/me', auth_1.authenticateToken, async (req, res) => {
    try {
        const authRequest = req;
        if (!authRequest.user) {
            res.status(401).json({
                success: false,
                message: 'Utilisateur non authentifié'
            });
            return;
        }
        res.json({
            success: true,
            data: {
                user: {
                    id: authRequest.user.id,
                    name: authRequest.user.name,
                    email: authRequest.user.email,
                    is_admin: authRequest.user.is_admin,
                    is_approved: authRequest.user.is_approved,
                    created_at: authRequest.user.created_at
                }
            }
        });
    }
    catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
router.post('/refresh', auth_1.authenticateToken, async (req, res) => {
    try {
        const authRequest = req;
        if (!authRequest.user) {
            res.status(401).json({
                success: false,
                message: 'Utilisateur non authentifié'
            });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined');
        }
        const tokenPayload = {
            userId: authRequest.user.id,
            email: authRequest.user.email,
            isAdmin: authRequest.user.is_admin,
            iat: Math.floor(Date.now() / 1000)
        };
        const signOptions = createJWTOptions();
        const newToken = jsonwebtoken_1.default.sign(tokenPayload, jwtSecret, signOptions);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        await database_1.default.query('UPDATE sessions SET token = $1, expires_at = $2 WHERE user_id = $3', [newToken, expiresAt, authRequest.user.id]);
        res.json({
            success: true,
            message: 'Token actualisé',
            data: { token: newToken }
        });
    }
    catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
exports.default = router;
