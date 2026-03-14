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
exports.startCancelSaleFlow = startCancelSaleFlow;
exports.registerCancelSaleFlow = registerCancelSaleFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const logger_1 = require("../../../core/logger/logger");
const salesService_1 = require("../salesService");
const permissions_1 = require("../../../core/auth/permissions");
function startCancelSaleFlow(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.setSession)(chatId, 'cancelSale', { stage: 'AWAIT_MOBILE' });
        yield bot.sendMessage(chatId, "❌ *Cancel Sale*\n\nPlease enter the mobile number of the sale you want to cancel:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'sales_cancel_cancel_op' }]]
            }
        });
    });
}
function registerCancelSaleFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'cancelSale');
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
                    (0, sessionManager_1.clearSession)(chatId, 'cancelSale');
                    return;
                }
                const employeeName = isUserAdmin ? undefined : profile === null || profile === void 0 ? void 0 : profile.displayName;
                const sale = yield (0, salesService_1.getSaleDetails)(mobile, employeeName);
                if (!sale) {
                    yield bot.sendMessage(chatId, `❌ No sale record found for \`${mobile}\`${employeeName ? ` assigned to ${employeeName}` : ""}.`, { parse_mode: 'Markdown' });
                    (0, sessionManager_1.clearSession)(chatId, 'cancelSale');
                    return;
                }
                session.stage = 'CONFIRM_CANCEL';
                session.saleId = sale.id;
                session.mobile = mobile;
                (0, sessionManager_1.setSession)(chatId, 'cancelSale', session);
                yield bot.sendMessage(chatId, `⚠️ *Confirm Cancellation*\n\nAre you sure you want to cancel the sale for \`${mobile}\`?\n\nThe number will be moved back to Inventory.`, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '✅ Yes, Cancel Sale', callback_data: 'sales_cancel_confirm' }],
                            [{ text: '❌ No', callback_data: 'sales_cancel_cancel_op' }]
                        ]
                    }
                });
            }
            catch (error) {
                logger_1.logger.error(`Error in cancelSaleFlow: ${error.message}`);
                yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
                (0, sessionManager_1.clearSession)(chatId, 'cancelSale');
            }
        }
    }));
    router.registerCallback('sales_cancel_confirm', (query) => __awaiter(this, void 0, void 0, function* () {
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'cancelSale');
        if (!session || session.stage !== 'CONFIRM_CANCEL')
            return;
        try {
            const profile = yield (0, permissions_1.getUserProfile)(query.from.username);
            const performedBy = (profile === null || profile === void 0 ? void 0 : profile.displayName) || query.from.username || 'Unknown';
            const success = yield (0, salesService_1.cancelSale)(session.saleId, performedBy);
            if (success) {
                yield bot.sendMessage(chatId, `✅ Sale for \`${session.mobile}\` has been cancelled and moved back to inventory.`, { parse_mode: 'Markdown' });
            }
            else {
                yield bot.sendMessage(chatId, `❌ Failed to cancel sale. It may have already been removed.`);
            }
        }
        catch (error) {
            logger_1.logger.error(`Error in cancelSale confirmation: ${error.message}`);
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
        finally {
            (0, sessionManager_1.clearSession)(chatId, 'cancelSale');
        }
    }));
    router.registerCallback('sales_cancel_cancel_op', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'cancelSale');
        yield bot.sendMessage(query.message.chat.id, "Operation cancelled.");
    }));
}
