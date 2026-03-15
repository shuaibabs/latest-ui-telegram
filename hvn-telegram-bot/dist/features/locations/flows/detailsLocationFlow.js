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
exports.startDetailsLocationFlow = startDetailsLocationFlow;
exports.registerDetailsLocationFlow = registerDetailsLocationFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const locationsService_1 = require("../locationsService");
const permissions_1 = require("../../../core/auth/permissions");
const logger_1 = require("../../../core/logger/logger");
const date_fns_1 = require("date-fns");
function startDetailsLocationFlow(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        const isUserAdmin = yield (0, permissions_1.isAdmin)(username);
        const profile = yield (0, permissions_1.getUserProfile)(username);
        if (!isUserAdmin && !(profile === null || profile === void 0 ? void 0 : profile.displayName)) {
            yield bot.sendMessage(chatId, "❌ *Profile Incomplete*\n\nYour profile does not have a display name set in the system.", { parse_mode: 'Markdown' });
            return;
        }
        (0, sessionManager_1.setSession)(chatId, 'detailsLocation', { stage: 'AWAIT_MOBILE' });
        yield bot.sendMessage(chatId, "🔍 *SIM Location Details*\n\nPlease enter the 10-digit mobile number:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'loc_details_cancel' }]]
            }
        });
    });
}
function registerDetailsLocationFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'detailsLocation');
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
                const employeeName = isUserAdmin ? undefined : profile === null || profile === void 0 ? void 0 : profile.displayName;
                const result = yield (0, locationsService_1.getNumberByMobile)(text, employeeName);
                if (result) {
                    let textMsg = `📋 *SIM Details:*\n`;
                    textMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
                    textMsg += `📱 *Mobile:* \`${result.mobile}\`\n`;
                    textMsg += `📍 *Location:* ${result.currentLocation} (${result.locationType})\n`;
                    textMsg += `👤 *Assigned To:* ${result.assignedTo || 'Unassigned'}\n`;
                    textMsg += `📈 *Status:* ${result.status}\n`;
                    textMsg += `🔢 *Digital Root:* ${result.sum}\n`;
                    if (result.purchaseFrom)
                        textMsg += `🛒 *Purchased From:* ${result.purchaseFrom}\n`;
                    if (result.purchasePrice)
                        textMsg += `💰 *Purchase Price:* ₹${result.purchasePrice}\n`;
                    if (result.checkInDate) {
                        textMsg += `🕒 *Last Check-In:* ${(0, date_fns_1.format)(result.checkInDate.toDate(), 'PPP p')}\n`;
                    }
                    textMsg += `━━━━━━━━━━━━━━━━━━━━`;
                    yield bot.sendMessage(chatId, textMsg, { parse_mode: 'Markdown' });
                }
                else {
                    const errorMsg = isUserAdmin
                        ? `❌ Number \`${text}\` not found in inventory.`
                        : `❌ Number \`${text}\` not found or not assigned to you.`;
                    yield bot.sendMessage(chatId, errorMsg, { parse_mode: 'Markdown' });
                }
            }
            catch (error) {
                logger_1.logger.error(`Error in detailsLocationFlow: ${error.message}`);
                yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
            }
            (0, sessionManager_1.clearSession)(chatId, 'detailsLocation');
        }
    }));
    router.registerCallback('loc_details_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'detailsLocation');
        yield bot.sendMessage(query.message.chat.id, "Operation cancelled.");
    }));
}
