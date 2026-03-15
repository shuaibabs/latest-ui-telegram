"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.startListRemindersFlow = startListRemindersFlow;
exports.registerListRemindersFlow = registerListRemindersFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const logger_1 = require("../../../core/logger/logger");
const remindersService_1 = require("../remindersService");
const permissions_1 = require("../../../core/auth/permissions");
const activityService_1 = require("../../activities/activityService");
const PAGE_SIZE = 5;
function startListRemindersFlow(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        const isUserAdmin = yield (0, permissions_1.isAdmin)(username);
        const profile = yield (0, permissions_1.getUserProfile)(username);
        const assignedTo = isUserAdmin ? undefined : profile === null || profile === void 0 ? void 0 : profile.displayName;
        if (!isUserAdmin && !assignedTo) {
            yield bot.sendMessage(chatId, "❌ *Profile Incomplete*\n\nYour profile does not have a display name set.", { parse_mode: 'Markdown' });
            return;
        }
        (0, sessionManager_1.setSession)(chatId, 'listReminders', { page: 0, assignedTo });
        yield showRemindersPage(bot, chatId, 0, assignedTo);
    });
}
function showRemindersPage(bot, chatId, page, assignedTo) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const offset = page * PAGE_SIZE;
            const { reminders, total } = yield (0, remindersService_1.getPendingReminders)(assignedTo, PAGE_SIZE, offset);
            if (total === 0) {
                yield bot.sendMessage(chatId, "📝 *Your Task List*\n\nYou have no pending reminders. Great job! 👍", { parse_mode: 'Markdown' });
                (0, sessionManager_1.clearSession)(chatId, 'listReminders');
                return;
            }
            let text = `📅 *Pending Reminders (${total})*\n`;
            text += `_Page ${page + 1} of ${Math.ceil(total / PAGE_SIZE)}_\n`;
            text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
            const inline_keyboard = [];
            reminders.forEach((r, i) => {
                var _a;
                const date = r.dueDate instanceof Date ? r.dueDate.toLocaleDateString() : ((_a = r.dueDate) === null || _a === void 0 ? void 0 : _a.toDate) ? r.dueDate.toDate().toLocaleDateString() : 'N/A';
                text += `${offset + i + 1}. *${r.taskName}*\n`;
                text += `   📅 Due: ${date} | 👤: ${r.assignedTo.join(', ')}\n\n`;
                inline_keyboard.push([{ text: `✅ Done: ${r.taskName.substring(0, 15)}...`, callback_data: `rem_done_${r.id}` }]);
            });
            const navButtons = [];
            if (page > 0)
                navButtons.push({ text: '⬅️ Back', callback_data: `rem_page_${page - 1}` });
            if (offset + PAGE_SIZE < total)
                navButtons.push({ text: 'Next ➡️', callback_data: `rem_page_${page + 1}` });
            if (navButtons.length > 0)
                inline_keyboard.push(navButtons);
            inline_keyboard.push([{ text: '❌ Close', callback_data: 'rem_list_close' }]);
            yield bot.sendMessage(chatId, text, {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard }
            });
        }
        catch (error) {
            logger_1.logger.error(`Error in showRemindersPage: ${error.message}`);
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
    });
}
function registerListRemindersFlow(router) {
    const bot = router.bot;
    router.registerCallback(/^rem_page_/, (query) => __awaiter(this, void 0, void 0, function* () {
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'listReminders');
        if (!session)
            return;
        const page = parseInt(query.data.split('_').pop());
        session.page = page;
        (0, sessionManager_1.setSession)(chatId, 'listReminders', session);
        yield bot.deleteMessage(chatId, query.message.message_id).catch(() => { });
        yield showRemindersPage(bot, chatId, page, session.assignedTo);
    }));
    router.registerCallback(/^rem_done_/, (query) => __awaiter(this, void 0, void 0, function* () {
        const chatId = query.message.chat.id;
        const reminderId = query.data.replace('rem_done_', '');
        try {
            const { getReminderById, canMarkReminderDone } = yield Promise.resolve().then(() => __importStar(require('../remindersService')));
            const reminder = yield getReminderById(reminderId);
            if (!reminder) {
                yield bot.answerCallbackQuery(query.id, { text: "❌ Reminder not found." });
                return;
            }
            const validation = yield canMarkReminderDone(reminder);
            if (!validation.canBeDone) {
                yield bot.answerCallbackQuery(query.id, { text: "⚠️ " + validation.message, show_alert: true });
                return;
            }
            yield (0, remindersService_1.markReminderAsDone)(reminderId);
            yield bot.answerCallbackQuery(query.id, { text: "✅ Task marked as done!" });
            // Log Activity
            const creator = query.from.first_name + (query.from.last_name ? ' ' + query.from.last_name : '');
            yield (0, activityService_1.logActivity)(bot, {
                employeeName: creator,
                action: 'Marked Task Done',
                description: `Completed task: ${reminder.taskName} via Bot.`,
                source: 'BOT',
                createdBy: creator,
                groupName: 'WORK_REMINDERS'
            }, true);
            // Refresh the current page
            const session = (0, sessionManager_1.getSession)(chatId, 'listReminders');
            if (session) {
                yield bot.deleteMessage(chatId, query.message.message_id).catch(() => { });
                yield showRemindersPage(bot, chatId, session.page, session.assignedTo);
            }
        }
        catch (error) {
            logger_1.logger.error(`Error in rem_done_ callback: ${error.message}`);
            yield bot.answerCallbackQuery(query.id, { text: "❌ Failed to update task." });
        }
    }));
    router.registerCallback('rem_list_close', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'listReminders');
        yield bot.deleteMessage(query.message.chat.id, query.message.message_id).catch(() => { });
    }));
}
