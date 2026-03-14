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
exports.CommandRouter = void 0;
const sessionManager_1 = require("../bot/sessionManager");
const logger_1 = require("../logger/logger");
const env_1 = require("../../config/env");
class CommandRouter {
    constructor(bot) {
        this.commands = [];
        this.callbacks = [];
        this.fallbackHandler = null;
        this.bot = bot;
    }
    register(pattern, callback, allowedGroupIds) {
        this.commands.push({ pattern, callback, allowedGroupIds });
    }
    registerCallback(data, callback, allowedGroupIds) {
        this.callbacks.push({ data, callback, allowedGroupIds });
    }
    setFallbackHandler(handler) {
        this.fallbackHandler = handler;
    }
    listen() {
        // Handle text commands
        this.bot.on('message', (msg) => {
            const user = msg.from;
            const userName = user ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}` : 'Unknown';
            const userHandle = (user === null || user === void 0 ? void 0 : user.username) ? ` (@${user.username})` : '';
            logger_1.logger.info(`[MESSAGE] From: ${userName}${userHandle} [ID: ${user === null || user === void 0 ? void 0 : user.id}] | Text: ${msg.text || '[No Text]'}`);
            this.handleMessage(msg).catch(err => {
                logger_1.logger.error(`[FATAL] Error in handleMessage promise: ${err.stack || err}`);
            });
        });
        // Handle inline button clicks (callback queries)
        this.bot.on('callback_query', (query) => {
            const user = query.from;
            const userName = user.first_name + (user.last_name ? ' ' + user.last_name : '');
            const userHandle = user.username ? ` (@${user.username})` : '';
            logger_1.logger.info(`[CALLBACK] From: ${userName}${userHandle} [ID: ${user.id}] | Data: ${query.data}`);
            this.handleCallbackQuery(query).catch(err => {
                logger_1.logger.error(`[FATAL] Error in handleCallbackQuery promise: ${err.stack || err}`);
            });
        });
    }
    handleMessage(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!msg.text)
                return;
            const chatId = msg.chat.id.toString();
            const text = msg.text.trim();
            const startRegex = /^(?:\/start|start)$/i;
            const isStart = startRegex.test(text);
            let matched = false;
            for (const cmd of this.commands) {
                const patternToUse = isStart && cmd.pattern.source.includes('start') ? startRegex : cmd.pattern;
                const match = patternToUse.exec(text);
                if (match) {
                    if (cmd.allowedGroupIds && cmd.allowedGroupIds.length > 0) {
                        if (cmd.allowedGroupIds.indexOf(chatId) === -1)
                            continue;
                    }
                    try {
                        yield cmd.callback(msg, match);
                    }
                    catch (error) {
                        yield this.handleError(error, msg);
                    }
                    matched = true;
                    break;
                }
            }
            if (matched)
                return;
            // If not a command, check if user is in a session
            if ((0, sessionManager_1.hasAnySession)(msg.chat.id)) {
                return;
            }
            if (this.fallbackHandler) {
                try {
                    yield this.fallbackHandler(msg);
                }
                catch (error) {
                    yield this.handleError(error, msg);
                }
            }
        });
    }
    handleCallbackQuery(query) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!query.data)
                return;
            const chatId = (_a = query.message) === null || _a === void 0 ? void 0 : _a.chat.id.toString();
            const data = query.data;
            for (const cb of this.callbacks) {
                let isMatch = false;
                if (typeof cb.data === 'string') {
                    isMatch = cb.data === data;
                }
                else if (cb.data instanceof RegExp) {
                    isMatch = cb.data.test(data);
                }
                if (isMatch) {
                    // Check group permissions if chatId is available
                    if (chatId && cb.allowedGroupIds && cb.allowedGroupIds.length > 0) {
                        if (cb.allowedGroupIds.indexOf(chatId) === -1)
                            continue;
                    }
                    try {
                        yield cb.callback(query);
                        // Answer callback query to stop the loading icon in Telegram
                        try {
                            yield this.bot.answerCallbackQuery(query.id);
                        }
                        catch (ansErr) {
                            // Ignore harmless "query too old" errors
                            if (!((_b = ansErr.message) === null || _b === void 0 ? void 0 : _b.includes('query is too old'))) {
                                logger_1.logger.warn(`Failed to answer callback query: ${ansErr.message}`);
                            }
                        }
                    }
                    catch (error) {
                        yield this.handleError(error, query);
                    }
                    return;
                }
            }
        });
    }
    handleError(error, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const isCallback = 'data' in context;
            const msg = isCallback ? context.message : context;
            const chatId = msg === null || msg === void 0 ? void 0 : msg.chat.id;
            const userId = (_a = context.from) === null || _a === void 0 ? void 0 : _a.id;
            const username = ((_b = context.from) === null || _b === void 0 ? void 0 : _b.username) || 'Unknown';
            logger_1.logger.error(`[CRASH PREVENTION] Error triggered by @${username} (ID: ${userId}): ${error.message || error}`);
            if (error.stack)
                logger_1.logger.error(error.stack);
            let userMessage = "❌ *An unexpected error occurred.*";
            // Detect Firestore Quota Exhaustion (Code 8)
            if (((_c = error.message) === null || _c === void 0 ? void 0 : _c.includes('RESOURCE_EXHAUSTED')) || error.code === 8 || ((_d = error.details) === null || _d === void 0 ? void 0 : _d.includes('Quota exceeded'))) {
                userMessage = "⏳ *Service Temporarily Overloaded*\n\nThe database has reached its temporary limit. Please try again in 5-10 minutes. We apologize for the inconvenience.";
            }
            else {
                userMessage += "\nThe developers have been notified. Please try again later.";
            }
            if (chatId) {
                try {
                    yield this.bot.sendMessage(chatId, userMessage, { parse_mode: 'Markdown' });
                }
                catch (err) {
                    logger_1.logger.error(`Failed to send error message to user: ${err}`);
                }
            }
            // Notify Master Channel if configured
            if (env_1.env.TG_MASTER_CHANNEL) {
                const errorReport = `🚨 *Bot Error Report*\n` +
                    `👤 *User:* @${username} (${userId})\n` +
                    `💭 *Context:* ${isCallback ? 'Callback: ' + context.data : 'Message: ' + context.text}\n` +
                    `❌ *Error:* \`${error.message || error}\`\n` +
                    `📍 *Time:* ${new Date().toISOString()}`;
                try {
                    yield this.bot.sendMessage(env_1.env.TG_MASTER_CHANNEL, errorReport, { parse_mode: 'Markdown' });
                }
                catch (err) {
                    logger_1.logger.error(`Failed to send report to master channel: ${err}`);
                }
            }
        });
    }
}
exports.CommandRouter = CommandRouter;
