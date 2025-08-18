"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRoutes = void 0;
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = require("../database");
const router = express_1.default.Router();
exports.usersRoutes = router;
router.post('/create', async (req, res) => {
    try {
        const { name, email, password, isAdmin = false } = req.body;
        console.log('👤 Creating new user:', { name, email, isAdmin });
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }
        const existingUser = await database_1.pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        console.log('🔐 Password hashed successfully');
        const insertQuery = `
      INSERT INTO users (name, email, password, is_admin) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, name, email, is_admin, created_at
    `;
        const result = await database_1.pool.query(insertQuery, [name, email, hashedPassword, isAdmin]);
        const newUser = result.rows[0];
        console.log('✅ User created successfully:', newUser);
        res.json({
            success: true,
            message: 'User created successfully',
            user: newUser,
            credentials: {
                email: email,
                password: password
            }
        });
    }
    catch (error) {
        console.error('❌ Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating user'
        });
    }
});
router.get('/', async (req, res) => {
    try {
        console.log('📊 Fetching all users...');
        const result = await database_1.pool.query(`
      SELECT id, name, email, is_admin, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
        res.json({
            success: true,
            users: result.rows,
            count: result.rows.length
        });
    }
    catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
});
router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        console.log('🔧 Resetting password for:', email);
        if (!email || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email and new password are required'
            });
        }
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        const updateQuery = `
      UPDATE users 
      SET password = $1 
      WHERE email = $2 
      RETURNING id, name, email, is_admin
    `;
        const result = await database_1.pool.query(updateQuery, [hashedPassword, email]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        console.log('✅ Password reset successful for:', email);
        res.json({
            success: true,
            message: 'Password reset successful',
            user: result.rows[0],
            newPassword: newPassword
        });
    }
    catch (error) {
        console.error('❌ Error resetting password:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password'
        });
    }
});
