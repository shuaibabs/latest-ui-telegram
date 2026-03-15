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
exports.startDetailsDealerFlow = startDetailsDealerFlow;
exports.registerDetailsDealerFlow = registerDetailsDealerFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const dealerService_1 = require("../dealerService");
const permissions_1 = require("../../../core/auth/permissions");
const logger_1 = require("../../../core/logger/logger");
function startDetailsDealerFlow(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        const profile = yield (0, permissions_1.getUserProfile)(username);
        if (!profile) {
            yield bot.sendMessage(chatId, "❌ *Access Denied*\n\nUser profile not found.", { parse_mode: 'Markdown' });
            return;
        }
        (0, sessionManager_1.setSession)(chatId, 'detailsDealer', { stage: 'AWAIT_MOBILE' });
        yield bot.sendMessage(chatId, "🔍 *Dealer Purchase Details*\n\nPlease enter the 10-digit mobile number:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'dealer_details_cancel' }]]
            }
        });
    });
}
function registerDetailsDealerFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'detailsDealer');
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
                const profile = yield (0, permissions_1.getUserProfile)((_a = msg.from) === null || _a === void 0 ? void 0 : _a.username);
                const isUserAdmin = yield (0, permissions_1.isAdmin)((_b = msg.from) === null || _b === void 0 ? void 0 : _b.username);
                const employeeUid = isUserAdmin ? undefined : profile === null || profile === void 0 ? void 0 : profile.uid;
                const result = yield (0, dealerService_1.getDealerPurchaseByMobile)(text, employeeUid);
                if (result) {
                    let textMsg = `📋 *Dealer Purchase Details:*\n`;
                    textMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
                    textMsg += `📱 *Mobile:* \`${result.mobile}\`\n`;
                    textMsg += `🤝 *Dealer:* ${result.dealerName}\n`;
                    textMsg += `💰 *Price:* ₹${result.price}\n`;
                    textMsg += `🔢 *Digital Root:* ${result.sum}\n`;
                    if (result.srNo)
                        textMsg += `🆔 *Sr No:* ${result.srNo}\n`;
                    textMsg += `━━━━━━━━━━━━━━━━━━━━`;
                    yield bot.sendMessage(chatId, textMsg, { parse_mode: 'Markdown' });
                }
                else {
                    const errorMsg = isUserAdmin
                        ? `❌ Number \`${text}\` not found in dealer purchases.`
                        : `❌ Number \`${text}\` not found in your dealer purchases.`;
                    yield bot.sendMessage(chatId, errorMsg, { parse_mode: 'Markdown' });
                }
            }
            catch (error) {
                logger_1.logger.error(`Error in detailsDealerFlow: ${error.message}`);
                yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
            }
            (0, sessionManager_1.clearSession)(chatId, 'detailsDealer');
        }
    }));
    router.registerCallback('dealer_details_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'detailsDealer');
        yield bot.sendMessage(query.message.chat.id, "Operation cancelled.");
    }));
}
