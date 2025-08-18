"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err);
    if (err.code === '23505') {
        return res.status(400).json({
            success: false,
            message: 'Duplicate entry detected'
        });
    }
    if (err.code === '23503') {
        return res.status(400).json({
            success: false,
            message: 'Referenced record not found'
        });
    }
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
};
exports.errorHandler = errorHandler;
const notFound = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`
    });
};
exports.notFound = notFound;
