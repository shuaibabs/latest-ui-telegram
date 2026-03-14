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
exports.startDetailPrebookFlow = startDetailPrebookFlow;
exports.registerDetailPrebookFlow = registerDetailPrebookFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const logger_1 = require("../../../core/logger/logger");
const prebookingService_1 = require("../prebookingService");
const permissions_1 = require("../../../core/auth/permissions");
function startDetailPrebookFlow(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.setSession)(chatId, 'prebookDetail', { stage: 'AWAIT_MOBILE' });
        yield bot.sendMessage(chatId, "ℹ️ *Pre-booking Details*\n\nPlease enter the mobile number to show details:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'pb_detail_cancel' }]]
            }
        });
    });
}
function registerDetailPrebookFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'prebookDetail');
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
                (0, sessionManager_1.clearSession)(chatId, 'prebookDetail');
                return;
            }
            const employeeName = isUserAdmin ? undefined : profile === null || profile === void 0 ? void 0 : profile.displayName;
            const pb = yield (0, prebookingService_1.getPrebookingDetails)(mobile, employeeName);
            if (!pb) {
                yield bot.sendMessage(chatId, `❌ No pre-booking record found for \`${mobile}\`${employeeName ? ` assigned to ${employeeName}` : ""}.`, { parse_mode: 'Markdown' });
            }
            else {
                let text = `ℹ️ *Pre-booking Details: ${mobile}*\n`;
                text += `━━━━━━━━━━━━━━━━━━━━\n`;
                text += `📅 *Pre-booking Date:* ${pb.preBookingDate.toDate().toLocaleString()}\n`;
                text += `🔢 *Digital Root (Sum):* ${pb.sum}\n`;
                text += `📡 *Type:* ${pb.originalNumberData.numberType}\n`;
                text += `🛡️ *Ownership:* ${pb.originalNumberData.ownershipType}\n`;
                text += `👤 *Assigned To:* ${pb.originalNumberData.assignedTo}\n`;
                text += `━━━━━━━━━━━━━━━━━━━━`;
                yield bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
            }
            (0, sessionManager_1.clearSession)(chatId, 'prebookDetail');
        }
        catch (error) {
            logger_1.logger.error(`Error in detailPrebookFlow: ${error.message}`);
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
    }));
    router.registerCallback('pb_detail_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'prebookDetail');
        yield bot.sendMessage(query.message.chat.id, "Operation cancelled.");
    }));
}
