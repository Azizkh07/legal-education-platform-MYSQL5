"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const auth_1 = require("./routes/auth");
const admin_1 = require("./routes/admin");
const courses_1 = require("./routes/courses");
const blog_1 = require("./routes/blog");
const videos_1 = require("./routes/videos");
const users_1 = require("./routes/users");
const contact_1 = require("./routes/contact");
const auth_2 = require("./middleware/auth");
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            mediaSrc: ["'self'", "data:", "blob:"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: config_1.config.frontendUrl,
    credentials: true,
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use('/uploads', (req, res, next) => {
    console.log(`📁 File access: ${req.path}`);
    next();
});
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/admin', auth_2.authenticateToken, admin_1.adminRoutes);
app.use('/api/courses', courses_1.coursesRoutes);
app.use('/api/blog', blog_1.blogRoutes);
app.use('/api/videos', auth_2.authenticateToken, videos_1.videosRoutes);
app.use('/api/user', auth_2.authenticateToken, users_1.usersRoutes);
app.use('/api/contact', contact_1.contactRoutes);
app.get('/api/placeholder/:width/:height', (req, res) => {
    const { width, height } = req.params;
    res.redirect(`https://via.placeholder.com/${width}x${height}/06B6D4/ffffff?text=Legal+Education`);
});
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        storage: 'local'
    });
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
