"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const zod_1 = require("zod");
const env_1 = require("../../config/env");
const broadcastService_1 = require("../../features/broadcast/broadcastService");
const logger_1 = require("../logger/logger");
const firebase_1 = require("../../config/firebase");
const userService_1 = require("../../features/users/userService");
const NotifySchema = zod_1.z.object({
    groupName: zod_1.z.string().optional(),
    action: zod_1.z.string().min(1, 'Action is required'),
    employeeName: zod_1.z.string().min(1, 'Employee name is required'),
    description: zod_1.z.string().min(1, 'Description is required'),
    source: zod_1.z.enum(['UI', 'BOT']).default('UI'),
});
const DeleteUserSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, 'User ID is required'),
});
/**
 * Limit incoming requests to 100 per 15 minutes per IP to prevent DDoS.
 */
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
/**
 * Middleware for authentication between UI and Bot using X-API-Key.
 */
const apiKeyGuard = (req, res, next) => {
    const incomingKey = req.headers['x-api-key'];
    if (incomingKey !== env_1.env.NOTIFY_API_KEY) {
        logger_1.logger.warn(`[SECURITY] Unauthorized API access attempt from IP: ${req.ip}`);
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }
    next();
};
function startServer(bot) {
    const app = (0, express_1.default)();
    // Apply Security Middlewares
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)()); // Enable CORS for UI App access
    app.use(express_1.default.json({ limit: '10kb' })); // Limit body size to prevent memory-filling attacks
    app.use(limiter);
    // Health check (Publicly accessible but rate-limited)
    app.get('/health', (req, res) => res.json({ status: 'ok', uptime: Math.floor(process.uptime()) }));
    // Secure API Notification Endpoint
    app.post('/api/notify', apiKeyGuard, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            const parseResult = NotifySchema.safeParse(req.body);
            if (!parseResult.success) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: parseResult.error.format()
                });
            }
            const { groupName, action, employeeName, description, source } = parseResult.data;
            // Format message consistently
            const message = `**Action:** ${action}\n**Performed By:** ${employeeName}\n**Details:** ${description}`;
            // Route to correct group if not provided (though UI sends it)
            const userActions = ['Updated User', 'Deleted User', 'Added User'];
            const targetGroup = groupName || (userActions.includes(action) ? 'USERS' : 'ACTIVITY');
            const result = yield (0, broadcastService_1.broadcast)(targetGroup, message, source);
            if (result.success) {
                return res.status(200).json({ success: true });
            }
            else {
                return res.status(500).json({ error: result.error });
            }
        }
        catch (error) {
            next(error); // Forward to global error handler
        }
    }));
    // Secure Admin Delete User Endpoint
    app.post('/api/admin/delete-user', apiKeyGuard, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            const parseResult = DeleteUserSchema.safeParse(req.body);
            if (!parseResult.success) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: parseResult.error.format()
                });
            }
            const { userId } = parseResult.data;
            try {
                // Get user details before deletion for the notification message
                const userSnapshot = yield firebase_1.db.collection('users').doc(userId).get();
                const userData = userSnapshot.data();
                const userName = (userData === null || userData === void 0 ? void 0 : userData.displayName) || (userData === null || userData === void 0 ? void 0 : userData.email) || 'Unknown User';
                yield (0, userService_1.deleteUser)(userId);
                // Log Activity to Firestore with source: 'BOT'
                const activityDescription = `Deleted the user account for ${userName} (${(userData === null || userData === void 0 ? void 0 : userData.email) || 'No email'}).`;
                yield firebase_1.db.collection('activities').add({
                    employeeName: 'System (Bot)',
                    action: 'Deleted User',
                    description: activityDescription,
                    timestamp: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                    createdBy: 'BOT_SERVER',
                    source: 'BOT',
                    groupName: 'USERS'
                });
                // Broadcast the deletion
                yield (0, broadcastService_1.broadcast)('USERS', `🗑️ **User Account Deleted**\n\n**Action:** Deleted User\n**Performed By:** System (Bot)\n**Details:** ${activityDescription}`, 'UI' // Pass UI to trigger broadcast (broadcast service usually filters by source)
                );
                return res.status(200).json({ success: true });
            }
            catch (error) {
                logger_1.logger.error(`[ADMIN ERROR]: Failed to delete user ${userId}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }
        }
        catch (error) {
            next(error);
        }
    }));
    // Global Error Handler (Prevents stack trace leaks)
    app.use((err, req, res, next) => {
        logger_1.logger.error(`[CRITICAL ERROR]: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Security Incident tracked.' });
    });
    const PORT = env_1.env.PORT;
    app.listen(PORT, () => {
        logger_1.logger.info(`🚀 [SHIELDED] Notification server active on Port ${PORT}`);
    });
    return app;
}
