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
exports.startCancelPrebookFlow = startCancelPrebookFlow;
exports.registerCancelPrebookFlow = registerCancelPrebookFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const logger_1 = require("../../../core/logger/logger");
const prebookingService_1 = require("../prebookingService");
const permissions_1 = require("../../../core/auth/permissions");
function startCancelPrebookFlow(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.setSession)(chatId, 'cancelPrebook', { stage: 'AWAIT_MOBILE' });
        yield bot.sendMessage(chatId, "❌ *Cancel Pre-booking*\n\nPlease enter the mobile number of the pre-booking you want to cancel:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'pb_cancel_cancel_op' }]]
            }
        });
    });
}
function registerCancelPrebookFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'cancelPrebook');
        if (!session || !msg.text || msg.text.startsWith('/'))
            return;
        const chatId = msg.chat.id;
        if (session.stage === 'AWAIT_MOBILE') {
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
                    (0, sessionManager_1.clearSession)(chatId, 'cancelPrebook');
                    return;
                }
                const employeeName = isUserAdmin ? undefined : profile === null || profile === void 0 ? void 0 : profile.displayName;
                const pb = yield (0, prebookingService_1.getPrebookingDetails)(mobile, employeeName);
                if (!pb) {
                    yield bot.sendMessage(chatId, `❌ No pre-booking record found for \`${mobile}\`${employeeName ? ` assigned to ${employeeName}` : ""}.`, { parse_mode: 'Markdown' });
                    (0, sessionManager_1.clearSession)(chatId, 'cancelPrebook');
                    return;
                }
                session.stage = 'CONFIRM_CANCEL';
                session.prebookId = pb.id;
                session.mobile = mobile;
                (0, sessionManager_1.setSession)(chatId, 'cancelPrebook', session);
                yield bot.sendMessage(chatId, `⚠️ *Confirm Cancellation*\n\nAre you sure you want to cancel the pre-booking for \`${mobile}\`?\n\nThe number will be moved back to Inventory.`, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '✅ Yes, Cancel Pre-booking', callback_data: 'pb_cancel_confirm' }],
                            [{ text: '❌ No', callback_data: 'pb_cancel_cancel_op' }]
                        ]
                    }
                });
            }
            catch (error) {
                logger_1.logger.error(`Error in cancelPrebookFlow: ${error.message}`);
                yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
                (0, sessionManager_1.clearSession)(chatId, 'cancelPrebook');
            }
        }
    }));
    router.registerCallback('pb_cancel_confirm', (query) => __awaiter(this, void 0, void 0, function* () {
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'cancelPrebook');
        if (!session || session.stage !== 'CONFIRM_CANCEL')
            return;
        try {
            const profile = yield (0, permissions_1.getUserProfile)(query.from.username);
            const performedBy = (profile === null || profile === void 0 ? void 0 : profile.displayName) || query.from.username || 'Unknown';
            const success = yield (0, prebookingService_1.cancelPrebooking)(session.prebookId, performedBy);
            if (success) {
                yield bot.sendMessage(chatId, `✅ Pre-booking for \`${session.mobile}\` has been cancelled and moved back to inventory.`, { parse_mode: 'Markdown' });
            }
            else {
                yield bot.sendMessage(chatId, `❌ Failed to cancel pre-booking. It may have already been removed.`);
            }
        }
        catch (error) {
            logger_1.logger.error(`Error in cancelPrebook confirmation: ${error.message}`);
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
        finally {
            (0, sessionManager_1.clearSession)(chatId, 'cancelPrebook');
        }
    }));
    router.registerCallback('pb_cancel_cancel_op', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'cancelPrebook');
        yield bot.sendMessage(query.message.chat.id, "Operation cancelled.");
    }));
}
