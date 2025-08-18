"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactRoutes = void 0;
const express_1 = __importDefault(require("express"));
const database_1 = require("../database");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = express_1.default.Router();
exports.contactRoutes = router;
const contactLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { error: 'Too many contact requests. Please try again later.' }
});
router.post('/', contactLimit, async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (!email.includes('@')) {
            return res.status(400).json({ error: 'Invalid email address' });
        }
        if (message.length < 10) {
            return res.status(400).json({ error: 'Message must be at least 10 characters long' });
        }
        const result = await database_1.pool.query(`
      INSERT INTO contact_messages (name, email, subject, message)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at
    `, [name.trim(), email.trim(), subject.trim(), message.trim()]);
        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            id: result.rows[0].id
        });
    }
    catch (error) {
        console.error('Contact message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});
router.get('/', async (req, res) => {
    try {
        const result = await database_1.pool.query(`
      SELECT id, name, email, subject, message, is_read, created_at
      FROM contact_messages
      ORDER BY created_at DESC
    `);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Get contact messages error:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});
router.patch('/:messageId/read', async (req, res) => {
    try {
        const { messageId } = req.params;
        const result = await database_1.pool.query(`
      UPDATE contact_messages 
      SET is_read = true, replied_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, is_read
    `, [messageId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Mark message read error:', error);
        res.status(500).json({ error: 'Failed to mark message as read' });
    }
});
