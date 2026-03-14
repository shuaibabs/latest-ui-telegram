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
exports.startRestoreDeletedFlow = startRestoreDeletedFlow;
exports.registerRestoreDeletedFlow = registerRestoreDeletedFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const deletedService_1 = require("../deletedService");
const permissions_1 = require("../../../core/auth/permissions");
function startRestoreDeletedFlow(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        const isUserAdmin = yield (0, permissions_1.isAdmin)(username);
        if (!isUserAdmin) {
            yield bot.sendMessage(chatId, "⛔ *Access Denied*\n\nOnly administrators can restore deleted numbers.", { parse_mode: 'Markdown' });
            return;
        }
        (0, sessionManager_1.setSession)(chatId, 'restoreNumber', { stage: 'AWAIT_MOBILE' });
        yield bot.sendMessage(chatId, "♻️ *Restore Number*\n\nPlease enter the 10-digit mobile number to restore:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'restore_cancel' }]]
            }
        });
    });
}
function registerRestoreDeletedFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'restoreNumber');
        if (!session || !msg.text || msg.text.startsWith('/'))
            return;
        const chatId = msg.chat.id;
        const text = msg.text.trim();
        if (session.stage === 'AWAIT_MOBILE') {
            if (!/^\d{10}$/.test(text)) {
                yield bot.sendMessage(chatId, "❌ Invalid mobile number. Please enter 10 digits.");
                return;
            }
            try {
                const deletedList = yield (0, deletedService_1.getDeletedNumbers)();
                const record = deletedList.find((d) => d.mobile === text);
                if (!record) {
                    yield bot.sendMessage(chatId, `❌ Number \`${text}\` not found in deleted records.`, { parse_mode: 'Markdown' });
                    (0, sessionManager_1.clearSession)(chatId, 'restoreNumber');
                    return;
                }
                session.recordId = record.id;
                session.mobile = text;
                session.stage = 'CONFIRMATION';
                (0, sessionManager_1.setSession)(chatId, 'restoreNumber', session);
                let confirmText = `♻️ *Confirm Restoration*\n\n`;
                confirmText += `📱 Number: \`${text}\`\n`;
                confirmText += `🗑️ Deleted By: ${record.deletedBy}\n`;
                confirmText += `💬 Reason: ${record.deletionReason}\n\n`;
                confirmText += `Are you sure you want to restore this number to the master inventory?`;
                yield bot.sendMessage(chatId, confirmText, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '✅ Restore Now', callback_data: 'restore_confirm' }],
                            [{ text: '❌ Cancel', callback_data: 'restore_cancel' }]
                        ]
                    }
                });
            }
            catch (error) {
                yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
                (0, sessionManager_1.clearSession)(chatId, 'restoreNumber');
            }
        }
    }));
    router.registerCallback('restore_confirm', (query) => __awaiter(this, void 0, void 0, function* () {
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'restoreNumber');
        if (!session)
            return;
        try {
            const profile = yield (0, permissions_1.getUserProfile)(query.from.username);
            const performer = (profile === null || profile === void 0 ? void 0 : profile.displayName) || query.from.username || 'Admin';
            const result = yield (0, deletedService_1.restoreNumber)(session.recordId, performer);
            if (result) {
                yield bot.sendMessage(chatId, `✅ *Success!*\n\nNumber \`${session.mobile}\` has been restored to inventory.`, { parse_mode: 'Markdown' });
            }
            else {
                yield bot.sendMessage(chatId, "❌ Restoration failed. Record might have already been restored.");
            }
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
        (0, sessionManager_1.clearSession)(chatId, 'restoreNumber');
    }));
    router.registerCallback('restore_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'restoreNumber');
        yield bot.sendMessage(query.message.chat.id, "Operation cancelled.");
    }));
}
