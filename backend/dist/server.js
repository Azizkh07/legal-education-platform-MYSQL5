"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const database_1 = require("./database");
const users_1 = require("./routes/users");
const startServer = async () => {
    try {
        await database_1.pool.query('SELECT NOW()');
        console.log('✅ Database connected successfully');
        const adminCheck = await database_1.pool.query('SELECT email, is_admin, is_approved FROM users WHERE is_admin = true');
        console.log('👑 Admin users found:', adminCheck.rows.length);
        if (adminCheck.rows.length > 0) {
            console.log('👑 Admin details:', adminCheck.rows.map(u => ({
                email: u.email,
                is_admin: u.is_admin,
                is_approved: u.is_approved
            })));
        }
        app_1.default.use('/api/users', users_1.usersRoutes);
        app_1.default.listen(config_1.config.port, () => {
            console.log(`🚀 Server running on port ${config_1.config.port}`);
            console.log(`🌍 Environment: ${config_1.config.nodeEnv}`);
            console.log(`📡 API URL: ${config_1.config.apiUrl}`);
            console.log(`📁 Uploads path: ${config_1.config.storage.uploadsPath}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
