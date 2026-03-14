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
exports.startEditCOCPFlow = startEditCOCPFlow;
exports.registerEditCOCPFlow = registerEditCOCPFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const logger_1 = require("../../../core/logger/logger");
const cocpService_1 = require("../cocpService");
const permissions_1 = require("../../../core/auth/permissions");
const date_fns_1 = require("date-fns");
const EDIT_STAGES = {
    AWAIT_MOBILE: 'AWAIT_MOBILE',
    AWAIT_DATE: 'AWAIT_DATE'
};
const cancelBtn = { text: '❌ Cancel', callback_data: 'cocp_edit_cancel' };
function startEditCOCPFlow(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        const isUserAdmin = yield (0, permissions_1.isAdmin)(username);
        const profile = yield (0, permissions_1.getUserProfile)(username);
        if (!isUserAdmin && !(profile === null || profile === void 0 ? void 0 : profile.displayName)) {
            yield bot.sendMessage(chatId, "❌ *Profile Incomplete*\n\nYour profile does not have a display name set in the system. Please contact an administrator.", { parse_mode: 'Markdown' });
            return;
        }
        (0, sessionManager_1.setSession)(chatId, 'cocpEdit', { stage: 'AWAIT_MOBILE', chatId });
        yield bot.sendMessage(chatId, "✏️ *Edit Safe Custody Date*\n\nPlease enter the 10-digit mobile number:", {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[cancelBtn]] }
        });
    });
}
function registerEditCOCPFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'cocpEdit');
        if (!session || !msg.text || msg.text.startsWith('/'))
            return;
        const chatId = msg.chat.id;
        const text = msg.text.trim();
        if (session.stage === 'AWAIT_MOBILE') {
            if (!/^\d{10}$/.test(text)) {
                yield bot.sendMessage(chatId, "❌ Invalid mobile number. Please enter a 10-digit number.");
                return;
            }
            try {
                const isUserAdmin = yield (0, permissions_1.isAdmin)((_a = msg.from) === null || _a === void 0 ? void 0 : _a.username);
                const profile = yield (0, permissions_1.getUserProfile)((_b = msg.from) === null || _b === void 0 ? void 0 : _b.username);
                const employeeName = isUserAdmin ? undefined : profile === null || profile === void 0 ? void 0 : profile.displayName;
                const num = yield (0, cocpService_1.getCOCPDetails)(text, employeeName);
                if (!num) {
                    yield bot.sendMessage(chatId, `❌ No COCP record found for \`${text}\`${employeeName ? ` assigned to ${employeeName}` : ""}.`, { parse_mode: 'Markdown' });
                    (0, sessionManager_1.clearSession)(chatId, 'cocpEdit');
                    return;
                }
                session.mobile = text;
                session.stage = 'AWAIT_DATE';
                (0, sessionManager_1.setSession)(chatId, 'cocpEdit', session);
                yield bot.sendMessage(chatId, `🏢 *Selected:* \`${text}\`\n\nPlease enter the new *Safe Custody Date* (DD/MM/YYYY):`, {
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: [[cancelBtn]] }
                });
            }
            catch (error) {
                logger_1.logger.error(`Error in editCOCPFlow (Mobile): ${error.message}`);
                yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
                (0, sessionManager_1.clearSession)(chatId, 'cocpEdit');
            }
        }
        else if (session.stage === 'AWAIT_DATE') {
            const dateStr = text;
            const parsedDate = (0, date_fns_1.parse)(dateStr, 'dd/MM/yyyy', new Date());
            if (!(0, date_fns_1.isValid)(parsedDate)) {
                yield bot.sendMessage(chatId, "❌ Invalid date format. Please use *DD/MM/YYYY* (e.g. 25/12/2024).", { parse_mode: 'Markdown' });
                return;
            }
            try {
                const creator = ((_c = msg.from) === null || _c === void 0 ? void 0 : _c.first_name) + (((_d = msg.from) === null || _d === void 0 ? void 0 : _d.last_name) ? ' ' + ((_e = msg.from) === null || _e === void 0 ? void 0 : _e.last_name) : '');
                yield (0, cocpService_1.updateCOCPDetails)(session.mobile, { safeCustodyDate: parsedDate }, creator);
                yield bot.sendMessage(chatId, `✅ *Updated!*\n\nSafe Custody Date for \`${session.mobile}\` has been set to ${dateStr}.`, { parse_mode: 'Markdown' });
                (0, sessionManager_1.clearSession)(chatId, 'cocpEdit');
            }
            catch (error) {
                yield bot.sendMessage(chatId, `❌ Error updating date: ${error.message}`);
            }
        }
    }));
    router.registerCallback('cocp_edit_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'cocpEdit');
        yield bot.sendMessage(query.message.chat.id, "Operation cancelled.");
    }));
}
