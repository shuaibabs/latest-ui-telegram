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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Guard = void 0;
const permissions_1 = require("./permissions");
const firebase_1 = require("../../config/firebase");
const logger_1 = require("../logger/logger");
class Guard {
    /**
     * Protector for callback queries.
     * Ensures only admins can trigger the wrapped handler.
     */
    static adminOnlyCallback(bot, handler) {
        return (query) => __awaiter(this, void 0, void 0, function* () {
            const username = query.from.username;
            if (!username) {
                yield bot.answerCallbackQuery(query.id, { text: "No Telegram username set", show_alert: true });
                return;
            }
            try {
                const allowed = yield (0, permissions_1.isAdmin)(username);
                if (!allowed) {
                    yield this.handleDenial(bot, query, "admin");
                    return;
                }
            }
            catch (error) {
                logger_1.logger.error(`Error in adminOnlyCallback: ${error}`);
                try {
                    yield bot.answerCallbackQuery(query.id, { text: "⚠️ Database service unavailable. Please try later.", show_alert: true });
                }
                catch (ansErr) {
                    logger_1.logger.warn(`Failed to answer callback query in error path: ${ansErr}`);
                }
                return;
            }
            yield handler(query);
        });
    }
    /**
     * Protector for text commands.
     * Ensures only admins can trigger the wrapped handler.
     */
    static adminOnlyCommand(bot, handler) {
        return (msg, match) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const username = (_a = msg.from) === null || _a === void 0 ? void 0 : _a.username;
            if (!username) {
                yield bot.sendMessage(msg.chat.id, "❌ Error: You need a Telegram username for this command.");
                return;
            }
            try {
                const allowed = yield (0, permissions_1.isAdmin)(username);
                if (!allowed) {
                    yield this.handleDenialCommand(bot, msg, "admin");
                    return;
                }
            }
            catch (error) {
                logger_1.logger.error(`Error in adminOnlyCommand: ${error}`);
                yield bot.sendMessage(msg.chat.id, "⚠️ Database service unavailable. Please try later.");
                return;
            }
            yield handler(msg, match);
        });
    }
    /**
     * Protector for callback queries.
     * Ensures only registered users (admin or employee) can trigger.
     */
    static registeredOnlyCallback(bot, handler) {
        return (query) => __awaiter(this, void 0, void 0, function* () {
            const username = query.from.username;
            if (!username) {
                yield bot.answerCallbackQuery(query.id, { text: "No Telegram username set", show_alert: true });
                return;
            }
            try {
                const isRegistered = yield (0, permissions_1.hasRole)(username, 'employee'); // hasRole('employee') returns true for admins too
                if (!isRegistered) {
                    yield this.handleDenial(bot, query, "registered");
                    return;
                }
            }
            catch (error) {
                logger_1.logger.error(`Error in registeredOnlyCallback: ${error}`);
                try {
                    yield bot.answerCallbackQuery(query.id, { text: "⚠️ Database service unavailable. Please try later.", show_alert: true });
                }
                catch (ansErr) {
                    logger_1.logger.warn(`Failed to answer callback query in error path: ${ansErr}`);
                }
                return;
            }
            yield handler(query);
        });
    }
    /**
     * Protector for text commands.
     * Ensures only registered users (admin or employee) can trigger.
     */
    static registeredOnlyCommand(bot, handler) {
        return (msg, match) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const username = (_a = msg.from) === null || _a === void 0 ? void 0 : _a.username;
            if (!username) {
                yield bot.sendMessage(msg.chat.id, "❌ Error: You need a Telegram username for this command.");
                return;
            }
            try {
                const isRegistered = yield (0, permissions_1.hasRole)(username, 'employee');
                if (!isRegistered) {
                    yield this.handleDenialCommand(bot, msg, "registered");
                    return;
                }
            }
            catch (error) {
                logger_1.logger.error(`Error in registeredOnlyCommand: ${error}`);
                yield bot.sendMessage(msg.chat.id, "⚠️ Database service unavailable. Please try later.");
                return;
            }
            yield handler(msg, match);
        });
    }
    static handleDenial(bot, query, requiredRole) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const username = query.from.username;
                const usersRef = firebase_1.db.collection('users');
                const querySnapshot = yield usersRef.where('telegramUsername', '==', username).get();
                const message = querySnapshot.empty
                    ? `❌ Access Denied: Your account (@${username}) is not registered.`
                    : `❌ Permission Denied: This action requires ${requiredRole} privileges.`;
                try {
                    yield bot.answerCallbackQuery(query.id, { text: "Permission Denied", show_alert: true });
                }
                catch (ansErr) {
                    if (!((_a = ansErr.message) === null || _a === void 0 ? void 0 : _a.includes('query is too old'))) {
                        logger_1.logger.warn(`Failed to answer permission denial callback: ${ansErr.message}`);
                    }
                }
                if (query.message) {
                    yield bot.sendMessage(query.message.chat.id, message);
                }
            }
            catch (error) {
                logger_1.logger.error(`Error in handleDenial: ${error}`);
                try {
                    yield bot.answerCallbackQuery(query.id, { text: "❌ Permission check failed (Database error).", show_alert: true });
                }
                catch (ansErr) {
                    logger_1.logger.warn(`Failed to answer handleDenial error callback: ${ansErr}`);
                }
            }
        });
    }
    static handleDenialCommand(bot, msg, requiredRole) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const username = (_a = msg.from) === null || _a === void 0 ? void 0 : _a.username;
                const usersRef = firebase_1.db.collection('users');
                const querySnapshot = yield usersRef.where('telegramUsername', '==', username).get();
                const message = querySnapshot.empty
                    ? `❌ Access Denied: Your account (@${username}) is not registered.`
                    : `❌ Permission Denied: This command requires ${requiredRole} privileges.`;
                yield bot.sendMessage(msg.chat.id, message);
            }
            catch (error) {
                logger_1.logger.error(`Error in handleDenialCommand: ${error}`);
                yield bot.sendMessage(msg.chat.id, "❌ Permission check failed due to a database error.");
            }
        });
    }
}
exports.Guard = Guard;
