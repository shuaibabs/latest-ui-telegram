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
exports.startEditPostpaidFlow = startEditPostpaidFlow;
exports.registerEditPostpaidFlow = registerEditPostpaidFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const logger_1 = require("../../../core/logger/logger");
const postpaidService_1 = require("../postpaidService");
const permissions_1 = require("../../../core/auth/permissions");
const date_fns_1 = require("date-fns");
const EDIT_STAGES = {
    AWAIT_MOBILE: 'AWAIT_MOBILE',
    SELECT_FIELD: 'SELECT_FIELD',
    AWAIT_DATE: 'AWAIT_DATE',
    AWAIT_PD_BILL: 'AWAIT_PD_BILL'
};
const cancelBtn = { text: '❌ Cancel', callback_data: 'postpaid_edit_cancel' };
function startEditPostpaidFlow(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        const isUserAdmin = yield (0, permissions_1.isAdmin)(username);
        const profile = yield (0, permissions_1.getUserProfile)(username);
        if (!isUserAdmin && !(profile === null || profile === void 0 ? void 0 : profile.displayName)) {
            yield bot.sendMessage(chatId, "❌ *Profile Incomplete*\n\nYour profile does not have a display name set in the system. Please contact an administrator.", { parse_mode: 'Markdown' });
            return;
        }
        (0, sessionManager_1.setSession)(chatId, 'postpaidEdit', { stage: 'AWAIT_MOBILE', chatId });
        yield bot.sendMessage(chatId, "✏️ *Edit Postpaid Details*\n\nPlease enter the 10-digit mobile number you want to edit:", {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[cancelBtn]] }
        });
    });
}
function registerEditPostpaidFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'postpaidEdit');
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
                const num = yield (0, postpaidService_1.getPostpaidDetails)(text, employeeName);
                if (!num) {
                    yield bot.sendMessage(chatId, `❌ No postpaid record found for \`${text}\`${employeeName ? ` assigned to ${employeeName}` : ""}.`, { parse_mode: 'Markdown' });
                    (0, sessionManager_1.clearSession)(chatId, 'postpaidEdit');
                    return;
                }
                session.mobile = text;
                session.stage = 'SELECT_FIELD';
                (0, sessionManager_1.setSession)(chatId, 'postpaidEdit', session);
                yield bot.sendMessage(chatId, `📱 *Selected:* \`${text}\`\n\nWhat would you like to update?`, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '📅 Bill Date', callback_data: 'postpaid_edit_field_date' }],
                            [{ text: '✅ PD Bill Status', callback_data: 'postpaid_edit_field_pd' }],
                            [cancelBtn]
                        ]
                    }
                });
            }
            catch (error) {
                logger_1.logger.error(`Error in editPostpaidFlow (Mobile): ${error.message}`);
                yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
                (0, sessionManager_1.clearSession)(chatId, 'postpaidEdit');
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
                yield (0, postpaidService_1.updatePostpaidDetails)(session.mobile, { billDate: parsedDate }, creator);
                yield bot.sendMessage(chatId, `✅ *Updated!*\n\nBill Date for \`${session.mobile}\` has been set to ${dateStr}.`, { parse_mode: 'Markdown' });
                (0, sessionManager_1.clearSession)(chatId, 'postpaidEdit');
            }
            catch (error) {
                yield bot.sendMessage(chatId, `❌ Error updating date: ${error.message}`);
            }
        }
    }));
    router.registerCallback(/^postpaid_edit_field_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'postpaidEdit');
        if (!session || session.stage !== 'SELECT_FIELD')
            return;
        const field = (_a = query.data) === null || _a === void 0 ? void 0 : _a.split('_').pop();
        if (field === 'date') {
            session.stage = 'AWAIT_DATE';
            (0, sessionManager_1.setSession)(chatId, 'postpaidEdit', session);
            yield bot.sendMessage(chatId, "📅 *Enter Bill Date*\n\nPlease enter the date in *DD/MM/YYYY* format:", {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [[cancelBtn]] }
            });
        }
        else if (field === 'pd') {
            session.stage = 'AWAIT_PD_BILL';
            (0, sessionManager_1.setSession)(chatId, 'postpaidEdit', session);
            yield bot.sendMessage(chatId, "✅ *PD Bill Status*\n\nIs the PD Bill status Yes or No?", {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✅ Yes', callback_data: 'postpaid_edit_pd_val_Yes' }],
                        [{ text: '❌ No', callback_data: 'postpaid_edit_pd_val_No' }],
                        [cancelBtn]
                    ]
                }
            });
        }
    }));
    router.registerCallback(/^postpaid_edit_pd_val_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'postpaidEdit');
        if (!session || session.stage !== 'AWAIT_PD_BILL')
            return;
        const val = (_a = query.data) === null || _a === void 0 ? void 0 : _a.split('_').pop();
        try {
            const creator = query.from.first_name + (query.from.last_name ? ' ' + query.from.last_name : '');
            yield (0, postpaidService_1.updatePostpaidDetails)(session.mobile, { pdBill: val }, creator);
            yield bot.sendMessage(chatId, `✅ *Updated!*\n\nPD Bill status for \`${session.mobile}\` has been set to *${val}*.`, { parse_mode: 'Markdown' });
            (0, sessionManager_1.clearSession)(chatId, 'postpaidEdit');
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Error updating PD Bill: ${error.message}`);
            (0, sessionManager_1.clearSession)(chatId, 'postpaidEdit');
        }
    }));
    router.registerCallback('postpaid_edit_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'postpaidEdit');
        yield bot.sendMessage(query.message.chat.id, "Edit operation cancelled.");
    }));
}
