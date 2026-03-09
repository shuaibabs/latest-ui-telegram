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
exports.startAssignToUserFlow = startAssignToUserFlow;
exports.registerAssignToUserFlow = registerAssignToUserFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const inventoryService_1 = require("../inventoryService");
const userService_1 = require("../../users/userService");
const activityService_1 = require("../../activities/activityService");
const ASSIGN_USER_STAGES = {
    AWAIT_NUMBERS: 'AWAIT_NUMBERS',
    AWAIT_USER_SELECTION: 'AWAIT_USER_SELECTION',
    CONFIRM: 'CONFIRM',
};
const cancelBtn = { text: '❌ Cancel', callback_data: 'assign_user_cancel' };
function startAssignToUserFlow(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.setSession)(chatId, 'assignToUser', {
            stage: 'AWAIT_NUMBERS',
            data: {
                numbers: []
            }
        });
        yield bot.sendMessage(chatId, "👤 *Assign Number(s) to User*\n\n*Step 1:* Please enter one or more 10-digit mobile numbers separated by comma or new line.", {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[cancelBtn]] }
        });
    });
}
function registerAssignToUserFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'assignToUser');
        if (!session || !msg.text || msg.text.startsWith('/'))
            return;
        const chatId = msg.chat.id;
        switch (session.stage) {
            case 'AWAIT_NUMBERS': {
                const numbers = msg.text.split(/[\n,]+/).map(n => n.trim().replace(/\D/g, '')).filter(n => n.length === 10);
                if (numbers.length === 0) {
                    yield bot.sendMessage(chatId, "❌ No valid 10-digit numbers found. Please try again.");
                    return;
                }
                // Validate existence
                const { existing, missing } = yield (0, inventoryService_1.validateNumbersExistence)(numbers);
                if (existing.length === 0) {
                    yield bot.sendMessage(chatId, `❌ None of the provided numbers exist in the inventory.\n\n*Rejected:* ${missing.join(', ')}`, { parse_mode: 'Markdown' });
                    (0, sessionManager_1.clearSession)(chatId, 'assignToUser');
                    return;
                }
                session.data.numbers = existing;
                session.stage = 'AWAIT_USER_SELECTION';
                (0, sessionManager_1.setSession)(chatId, 'assignToUser', session);
                const users = yield (0, userService_1.getAllUsers)();
                const userButtons = users.map(u => [{ text: u.displayName, callback_data: `assn_usr_uid_${u.uid}` }]);
                userButtons.push([{ text: '🔓 Unassigned', callback_data: 'assn_usr_uid_Unassigned' }]);
                userButtons.push([cancelBtn]);
                let statusMsg = `✅ Found ${existing.length} number(s).`;
                if (missing.length > 0)
                    statusMsg += `\n⚠️ Rejected (not found): ${missing.length}`;
                yield bot.sendMessage(chatId, `${statusMsg}\n\n*Step 2:* Select user to assign these numbers:`, {
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: userButtons }
                });
                break;
            }
        }
    }));
    router.registerCallback(/^assn_usr_uid_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'assignToUser');
        if (!session || session.stage !== 'AWAIT_USER_SELECTION')
            return;
        const val = (_a = query.data) === null || _a === void 0 ? void 0 : _a.split('_').pop();
        if (val === 'Unassigned') {
            session.data.assignedTo = 'Unassigned';
        }
        else {
            const users = yield (0, userService_1.getAllUsers)();
            const user = users.find(u => u.uid === val);
            session.data.assignedTo = (user === null || user === void 0 ? void 0 : user.displayName) || 'Unassigned';
        }
        session.stage = 'CONFIRM';
        (0, sessionManager_1.setSession)(chatId, 'assignToUser', session);
        const summary = `*Confirm Assignment*\n\n` +
            `📱 *Numbers:* ${session.data.numbers.join(', ')}\n` +
            `👤 *Assign To:* ${session.data.assignedTo}\n\n` +
            `*Proceed with assignment?*`;
        yield bot.sendMessage(chatId, summary, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '✅ Confirm & Assign', callback_data: 'assn_usr_confirm' }],
                    [cancelBtn]
                ]
            }
        });
    }));
    router.registerCallback('assn_usr_confirm', (query) => __awaiter(this, void 0, void 0, function* () {
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'assignToUser');
        if (!session || session.stage !== 'CONFIRM')
            return;
        try {
            const creator = query.from.first_name + (query.from.last_name ? ' ' + query.from.last_name : '');
            const result = yield (0, inventoryService_1.assignNumbersToUser)(session.data.numbers, session.data.assignedTo, creator);
            yield bot.sendMessage(chatId, `✅ *Assignment Successful!*\n\nSuccessfully assigned ${result.successCount} number(s) to *${session.data.assignedTo}*.`, { parse_mode: 'Markdown' });
            // Log Activity
            yield (0, activityService_1.logActivity)(bot, {
                employeeName: creator,
                action: 'ASSIGN_INVENTORY',
                description: `Assigned ${result.successCount} numbers to ${session.data.assignedTo}:\n${session.data.numbers.join(', ')}`,
                createdBy: creator,
                source: 'BOT',
                groupName: 'INVENTORY'
            }, true);
            (0, sessionManager_1.clearSession)(chatId, 'assignToUser');
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
            (0, sessionManager_1.clearSession)(chatId, 'assignToUser');
        }
    }));
    router.registerCallback('assign_user_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'assignToUser');
        yield bot.sendMessage(query.message.chat.id, "❌ Assignment flow cancelled.");
    }));
}
