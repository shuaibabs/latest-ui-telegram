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
exports.startDetailHistoryFlow = startDetailHistoryFlow;
exports.registerDetailHistoryFlow = registerDetailHistoryFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const logger_1 = require("../../../core/logger/logger");
const historyService_1 = require("../historyService");
const permissions_1 = require("../../../core/auth/permissions");
function startDetailHistoryFlow(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.setSession)(chatId, 'historyDetail', { stage: 'AWAIT_MOBILE' });
        yield bot.sendMessage(chatId, "ℹ️ *Global History Details*\n\nPlease enter the mobile number to show its full history:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'history_detail_cancel' }]]
            }
        });
    });
}
function registerDetailHistoryFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'historyDetail');
        if (!session || !msg.text || msg.text.startsWith('/'))
            return;
        const chatId = msg.chat.id;
        const mobile = msg.text.trim();
        if (!/^\d{10}$/.test(mobile)) {
            yield bot.sendMessage(chatId, "❌ Invalid mobile number. Please enter a 10-digit number.");
            return;
        }
        try {
            const isUserAdmin = yield (0, permissions_1.isAdmin)((_a = msg.from) === null || _a === void 0 ? void 0 : _a.username);
            const profile = yield (0, permissions_1.getUserProfile)((_b = msg.from) === null || _b === void 0 ? void 0 : _b.username);
            if (!isUserAdmin && !(profile === null || profile === void 0 ? void 0 : profile.displayName)) {
                yield bot.sendMessage(chatId, "❌ *Profile Incomplete*\n\nYour profile does not have a display name set in the system. Please contact an administrator.", { parse_mode: 'Markdown' });
                (0, sessionManager_1.clearSession)(chatId, 'historyDetail');
                return;
            }
            const employeeName = isUserAdmin ? undefined : profile === null || profile === void 0 ? void 0 : profile.displayName;
            const result = yield (0, historyService_1.getGlobalNumberHistory)(mobile, employeeName);
            if (!result.found) {
                yield bot.sendMessage(chatId, `❌ No history record found for \`${mobile}\`${employeeName ? ` assigned to you` : ""}.`, { parse_mode: 'Markdown' });
            }
            else {
                const history = result.data.history || ((_c = result.data.originalNumberData) === null || _c === void 0 ? void 0 : _c.history) || [];
                let text = `📜 *Global History: ${mobile}*\n`;
                text += `━━━━━━━━━━━━━━━━━━━━\n`;
                text += `📍 *Current Status:* ${result.location}\n`;
                text += `👤 *Assigned To:* ${result.data.assignedTo || ((_d = result.data.originalNumberData) === null || _d === void 0 ? void 0 : _d.assignedTo) || 'Unassigned'}\n\n`;
                if (history.length === 0) {
                    text += "_No history events recorded._";
                }
                else {
                    history.forEach((event, i) => {
                        text += `*${i + 1}. ${event.action}*\n`;
                        text += `📅 ${event.timestamp.toDate().toLocaleString()}\n`;
                        text += `👤 By: ${event.performedBy}\n`;
                        text += `📝 ${event.description}\n\n`;
                    });
                }
                text += `━━━━━━━━━━━━━━━━━━━━`;
                yield bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
            }
            (0, sessionManager_1.clearSession)(chatId, 'historyDetail');
        }
        catch (error) {
            logger_1.logger.error(`Error in detailHistoryFlow: ${error.message}`);
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
    }));
    router.registerCallback('history_detail_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'historyDetail');
        yield bot.sendMessage(query.message.chat.id, "Operation cancelled.");
    }));
}
