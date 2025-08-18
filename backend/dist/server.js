"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const database_1 = __importDefault(require("./config/database"));
const seed_1 = __importDefault(require("./config/seed"));
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const blog_1 = __importDefault(require("./routes/blog"));
const courses_1 = __importDefault(require("./routes/courses"));
const videos_1 = __importDefault(require("./routes/videos"));
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Legal Education Platform API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: '1.0.0'
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/blog', blog_1.default);
app.use('/api/courses', courses_1.default);
app.use('/api/videos', videos_1.default);
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
async function startServer() {
    try {
        await database_1.default.initialize();
        if (process.env.NODE_ENV === 'development') {
            const userCount = await database_1.default.query('SELECT COUNT(*) FROM users');
            if (parseInt(userCount.rows[0].count) === 0) {
                await (0, seed_1.default)();
            }
        }
        app.listen(PORT, () => {
            console.log(`
🚀 Legal Education Platform API
📍 Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV}
🗄️  Database: Connected
⏰ Started at: ${new Date().toISOString()}
📧 Admin: ${process.env.DEFAULT_ADMIN_EMAIL}
      `);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await database_1.default.close();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await database_1.default.close();
    process.exit(0);
});
startServer();
exports.default = app;
