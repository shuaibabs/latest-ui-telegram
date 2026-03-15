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
exports.broadcast = broadcast;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const env_1 = require("../../config/env");
const logger_1 = require("../../core/logger/logger");
const botToken = env_1.env.TELEGRAM_BOT_TOKEN;
const bot = new node_telegram_bot_api_1.default(botToken); // Dedicated broadcast instance
/**
 * Escapes characters for HTML parse mode.
 */
function escapeHTML(text) {
    if (!text)
        return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
/**
 * Robust broadcast service with centralized error handling.
 */
function broadcast(groupInput_1, message_1) {
    return __awaiter(this, arguments, void 0, function* (groupInput, message, source = 'BOT') {
        const escapedSource = escapeHTML(source);
        const escapedGroupInput = escapeHTML(groupInput);
        // Note: message might contain <b>/<i> tags already if formatted by the caller, 
        // but in our case server.ts passes a string with **. 
        // Let's assume the caller provides plain text or we clean it up.
        // For now, let's transform ** to <b>.
        const htmlMessage = message.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        const formattedMasterMsg = `<b>🔔 Master Alert</b>\n<b>Source:</b> ${escapedSource}\n<b>Action Type:</b> ${escapedGroupInput}\n\n${htmlMessage}`;
        // 1. Determine Target Group ID
        let targetGroupId = groupInput;
        if (env_1.GROUPS[groupInput]) {
            targetGroupId = env_1.GROUPS[groupInput];
        }
        const results = [];
        try {
            // 2. Send to Dedicated Group (if valid)
            if (targetGroupId && targetGroupId.startsWith('-')) {
                yield bot.sendMessage(targetGroupId, htmlMessage, {
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                });
                results.push(`Sent to Group: ${targetGroupId}`);
            }
            // 3. Mirror to Master Channel (if configured)
            const masterId = env_1.GROUPS.MASTER_CHANNEL;
            if (masterId && masterId.startsWith('-')) {
                yield bot.sendMessage(masterId, formattedMasterMsg, {
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                });
                results.push(`Mirrored to Master Channel: ${masterId}`);
            }
            logger_1.logger.info(`📡 Broadcast completed: ${JSON.stringify(results)}`);
            return { success: true };
        }
        catch (err) {
            const errMsg = err.description || err.message || 'Unknown Telegram Error';
            logger_1.logger.error(`❌ Broadcast Error: ${errMsg}`);
            return { success: false, error: errMsg };
        }
    });
}
