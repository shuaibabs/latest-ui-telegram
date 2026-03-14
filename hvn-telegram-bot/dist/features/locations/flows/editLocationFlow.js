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
exports.startEditLocationFlow = startEditLocationFlow;
exports.registerEditLocationFlow = registerEditLocationFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const locationsService_1 = require("../locationsService");
const permissions_1 = require("../../../core/auth/permissions");
function startEditLocationFlow(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        const isUserAdmin = yield (0, permissions_1.isAdmin)(username);
        const profile = yield (0, permissions_1.getUserProfile)(username);
        if (!isUserAdmin && !(profile === null || profile === void 0 ? void 0 : profile.displayName)) {
            yield bot.sendMessage(chatId, "❌ *Profile Incomplete*\n\nYour profile does not have a display name set in the system.", { parse_mode: 'Markdown' });
            return;
        }
        (0, sessionManager_1.setSession)(chatId, 'editLocation', { stage: 'AWAIT_MOBILE' });
        yield bot.sendMessage(chatId, "✏️ *CheckIn / Edit Location*\n\nPlease enter the 10-digit mobile number:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'loc_edit_cancel' }]]
            }
        });
    });
}
function registerEditLocationFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'editLocation');
        if (!session || !msg.text || msg.text.startsWith('/'))
            return;
        const chatId = msg.chat.id;
        const text = msg.text.trim();
        if (session.stage === 'AWAIT_MOBILE') {
            if (!/^\d{10}$/.test(text)) {
                yield bot.sendMessage(chatId, "❌ Invalid mobile number. Please enter 10 digits.");
                return;
            }
            session.mobile = text;
            session.stage = 'SELECT_ACTION';
            (0, sessionManager_1.setSession)(chatId, 'editLocation', session);
            yield bot.sendMessage(chatId, `📱 *Number:* \`${text}\`\n\nChoose an action:`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✅ Check In', callback_data: 'loc_act_checkin' }],
                        [{ text: '✏️ Edit Location', callback_data: 'loc_act_edit' }],
                        [{ text: '❌ Cancel', callback_data: 'loc_edit_cancel' }]
                    ]
                }
            });
        }
        else if (session.stage === 'AWAIT_NEW_LOC') {
            session.newLoc = text;
            session.stage = 'SELECT_NEW_TYPE';
            (0, sessionManager_1.setSession)(chatId, 'editLocation', session);
            yield bot.sendMessage(chatId, `📍 *New Location:* ${text}\n\nSelect New Location Type:`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🏬 Store', callback_data: 'loc_new_type_Store' }, { text: '👥 Employee', callback_data: 'loc_new_type_Employee' }],
                        [{ text: '🤝 Dealer', callback_data: 'loc_new_type_Dealer' }],
                        [{ text: '❌ Cancel', callback_data: 'loc_edit_cancel' }]
                    ]
                }
            });
        }
    }));
    router.registerCallback(/^loc_act_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'editLocation');
        if (!session)
            return;
        const action = (_a = query.data) === null || _a === void 0 ? void 0 : _a.replace('loc_act_', '');
        if (action === 'checkin') {
            try {
                const profile = yield (0, permissions_1.getUserProfile)(query.from.username);
                const isUserAdmin = yield (0, permissions_1.isAdmin)(query.from.username);
                const employeeName = isUserAdmin ? undefined : profile === null || profile === void 0 ? void 0 : profile.displayName;
                const performer = (profile === null || profile === void 0 ? void 0 : profile.displayName) || query.from.username || 'Unknown';
                const result = yield (0, locationsService_1.checkInNumber)(session.mobile, performer, employeeName);
                if (result) {
                    yield bot.sendMessage(chatId, `✅ *Success!*\n\nSIM number \`${session.mobile}\` has been checked in successfully.`, { parse_mode: 'Markdown' });
                }
                else {
                    yield bot.sendMessage(chatId, `❌ Number \`${session.mobile}\` not found or not assigned to you.`, { parse_mode: 'Markdown' });
                }
            }
            catch (error) {
                yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
            }
            (0, sessionManager_1.clearSession)(chatId, 'editLocation');
        }
        else {
            session.stage = 'AWAIT_NEW_LOC';
            (0, sessionManager_1.setSession)(chatId, 'editLocation', session);
            yield bot.sendMessage(chatId, "📍 Enter the *New Current Location* (e.g. Mumbai Store):", { parse_mode: 'Markdown' });
        }
    }));
    router.registerCallback(/^loc_new_type_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'editLocation');
        if (!session)
            return;
        const type = (_a = query.data) === null || _a === void 0 ? void 0 : _a.replace('loc_new_type_', '');
        try {
            const profile = yield (0, permissions_1.getUserProfile)(query.from.username);
            const isUserAdmin = yield (0, permissions_1.isAdmin)(query.from.username);
            const employeeName = isUserAdmin ? undefined : profile === null || profile === void 0 ? void 0 : profile.displayName;
            const performer = (profile === null || profile === void 0 ? void 0 : profile.displayName) || query.from.username || 'Unknown';
            const result = yield (0, locationsService_1.updateLocation)(session.mobile, { locationType: type, currentLocation: session.newLoc }, performer, employeeName);
            if (result) {
                yield bot.sendMessage(chatId, `✅ *Location Updated!*\n\nSIM \`${session.mobile}\` is now at *${session.newLoc}* (${type}).`, { parse_mode: 'Markdown' });
            }
            else {
                yield bot.sendMessage(chatId, `❌ Number \`${session.mobile}\` not found or not assigned to you.`, { parse_mode: 'Markdown' });
            }
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
        (0, sessionManager_1.clearSession)(chatId, 'editLocation');
    }));
    router.registerCallback('loc_edit_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'editLocation');
        yield bot.sendMessage(query.message.chat.id, "Operation cancelled.");
    }));
}
