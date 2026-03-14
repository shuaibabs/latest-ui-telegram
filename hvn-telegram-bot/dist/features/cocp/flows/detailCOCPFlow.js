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
exports.startDetailCOCPFlow = startDetailCOCPFlow;
exports.registerDetailCOCPFlow = registerDetailCOCPFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const logger_1 = require("../../../core/logger/logger");
const cocpService_1 = require("../cocpService");
const permissions_1 = require("../../../core/auth/permissions");
function startDetailCOCPFlow(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        const isUserAdmin = yield (0, permissions_1.isAdmin)(username);
        const profile = yield (0, permissions_1.getUserProfile)(username);
        if (!isUserAdmin && !(profile === null || profile === void 0 ? void 0 : profile.displayName)) {
            yield bot.sendMessage(chatId, "❌ *Profile Incomplete*\n\nYour profile does not have a display name set in the system. Please contact an administrator.", { parse_mode: 'Markdown' });
            return;
        }
        (0, sessionManager_1.setSession)(chatId, 'cocpDetail', { stage: 'AWAIT_MOBILE' });
        yield bot.sendMessage(chatId, "ℹ️ *COCP Details*\n\nPlease enter the mobile number to show details:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'cocp_detail_cancel' }]]
            }
        });
    });
}
function registerDetailCOCPFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'cocpDetail');
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
                (0, sessionManager_1.clearSession)(chatId, 'cocpDetail');
                return;
            }
            const employeeName = isUserAdmin ? undefined : profile === null || profile === void 0 ? void 0 : profile.displayName;
            const num = yield (0, cocpService_1.getCOCPDetails)(mobile, employeeName);
            if (!num) {
                yield bot.sendMessage(chatId, `❌ No COCP record found for \`${mobile}\`${employeeName ? ` assigned to ${employeeName}` : ""}.`, { parse_mode: 'Markdown' });
            }
            else {
                let text = `🏢 *COCP Details: ${mobile}*\n`;
                text += `━━━━━━━━━━━━━━━━━━━━\n`;
                text += `📅 *Safe Custody Date:* ${num.safeCustodyDate ? num.safeCustodyDate.toDate().toLocaleDateString() : 'N/A'}\n`;
                text += `👤 *Account Name:* ${num.accountName || 'N/A'}\n`;
                text += `💰 *Purchase Price:* ₹${num.purchasePrice}\n`;
                text += `📍 *Current Location:* ${num.currentLocation}\n`;
                text += `📡 *Type:* ${num.numberType}\n`;
                text += `🛡️ *Ownership:* ${num.ownershipType}\n`;
                text += `👤 *Assigned To:* ${num.assignedTo}\n`;
                text += `📅 *Purchase Date:* ${num.purchaseDate.toDate().toLocaleDateString()}\n`;
                text += `━━━━━━━━━━━━━━━━━━━━`;
                yield bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
            }
            (0, sessionManager_1.clearSession)(chatId, 'cocpDetail');
        }
        catch (error) {
            logger_1.logger.error(`Error in detailCOCPFlow: ${error.message}`);
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
    }));
    router.registerCallback('cocp_detail_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'cocpDetail');
        yield bot.sendMessage(query.message.chat.id, "Operation cancelled.");
    }));
}
