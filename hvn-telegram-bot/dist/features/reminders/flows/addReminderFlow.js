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
exports.startAddReminderFlow = startAddReminderFlow;
exports.registerAddReminderFlow = registerAddReminderFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const logger_1 = require("../../../core/logger/logger");
const remindersService_1 = require("../remindersService");
const userService_1 = require("../../users/userService");
const activityService_1 = require("../../activities/activityService");
const ADD_REMINDER_STAGES = {
    AWAIT_NAME: 'AWAIT_NAME',
    AWAIT_DATE: 'AWAIT_DATE',
    AWAIT_ASSIGNMENT: 'AWAIT_ASSIGNMENT',
    CONFIRM: 'CONFIRM',
};
const cancelBtn = { text: '❌ Cancel', callback_data: 'add_rem_cancel' };
function startAddReminderFlow(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.setSession)(chatId, 'addReminder', {
            stage: 'AWAIT_NAME',
            data: {}
        });
        yield bot.sendMessage(chatId, "➕ *Add New Work Reminder*\n\n*Step 1:* What is the task name?", {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[cancelBtn]] }
        });
    });
}
const parseDate = (text) => {
    const d = new Date(text);
    return isNaN(d.getTime()) ? null : d;
};
function registerAddReminderFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'addReminder');
        if (!session || !msg.text || msg.text === '/cancel')
            return;
        switch (session.stage) {
            case 'AWAIT_NAME':
                session.data.taskName = msg.text.trim();
                session.stage = 'AWAIT_DATE';
                (0, sessionManager_1.setSession)(msg.chat.id, 'addReminder', session);
                yield bot.sendMessage(msg.chat.id, "*Step 2:* Enter Due Date (YYYY-MM-DD):", {
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: [[cancelBtn]] }
                });
                break;
            case 'AWAIT_DATE':
                const date = parseDate(msg.text);
                if (!date) {
                    yield bot.sendMessage(msg.chat.id, "❌ Invalid date format. Please use YYYY-MM-DD.");
                    return;
                }
                session.data.dueDate = date;
                session.stage = 'AWAIT_ASSIGNMENT';
                (0, sessionManager_1.setSession)(msg.chat.id, 'addReminder', session);
                const users = yield (0, userService_1.getAllUsers)();
                const userButtons = users.map(u => [{ text: u.displayName, callback_data: `add_rem_assign_${u.displayName}` }]);
                userButtons.push([cancelBtn]);
                yield bot.sendMessage(msg.chat.id, "*Step 3:* Assign this task to:", {
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: userButtons }
                });
                break;
        }
    }));
    router.registerCallback(/^add_rem_assign_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'addReminder');
        if (!session || session.stage !== 'AWAIT_ASSIGNMENT')
            return;
        const assignedName = (_a = query.data) === null || _a === void 0 ? void 0 : _a.split('_').pop();
        session.data.assignedTo = [assignedName];
        session.stage = 'CONFIRM';
        (0, sessionManager_1.setSession)(chatId, 'addReminder', session);
        const summary = `*Confirm New Reminder*\n\n` +
            `📝 *Task:* ${session.data.taskName}\n` +
            `📅 *Due Date:* ${session.data.dueDate.toLocaleDateString()}\n` +
            `👤 *Assigned To:* ${(_b = session.data.assignedTo) === null || _b === void 0 ? void 0 : _b.join(', ')}\n\n` +
            `Save this reminder?`;
        yield bot.sendMessage(chatId, summary, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '✅ Confirm & Save', callback_data: 'add_rem_final_confirm' }],
                    [cancelBtn]
                ]
            }
        });
    }));
    router.registerCallback('add_rem_final_confirm', (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'addReminder');
        if (!session || session.stage !== 'CONFIRM')
            return;
        try {
            yield (0, remindersService_1.addReminder)(session.data);
            yield bot.sendMessage(chatId, "✅ *Reminder Saved Successfully!*", { parse_mode: 'Markdown' });
            // Log activity
            const creator = query.from.first_name + (query.from.last_name ? ' ' + query.from.last_name : '');
            yield (0, activityService_1.logActivity)(bot, {
                employeeName: creator,
                action: 'Added Reminder',
                description: `Created task "${session.data.taskName}" assigned to ${(_a = session.data.assignedTo) === null || _a === void 0 ? void 0 : _a.join(', ')}`,
                source: 'BOT',
                createdBy: creator,
                groupName: 'WORK_REMINDERS'
            }, true);
            (0, sessionManager_1.clearSession)(chatId, 'addReminder');
        }
        catch (error) {
            logger_1.logger.error(`Error saving reminder: ${error.message}`);
            yield bot.sendMessage(chatId, "❌ Failed to save reminder. Please try again.");
            (0, sessionManager_1.clearSession)(chatId, 'addReminder');
        }
    }));
    router.registerCallback('add_rem_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'addReminder');
        yield bot.sendMessage(query.message.chat.id, "❌ Action cancelled.");
    }));
}
