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
exports.remindersMenuCommand = remindersMenuCommand;
exports.registerRemindersFeature = registerRemindersFeature;
const guard_1 = require("../../../core/auth/guard");
const env_1 = require("../../../config/env");
const addReminderFlow_1 = require("../flows/addReminderFlow");
const listRemindersFlow_1 = require("../flows/listRemindersFlow");
function remindersMenuCommand(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        const opts = {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '➕ Add Reminder', callback_data: 'reminders_add' }],
                    [{ text: '📜 List My Reminders', callback_data: 'reminders_list' }],
                ]
            }
        };
        yield bot.sendMessage(chatId, "📅 *Work Reminders Menu*\n\nManage your tasks and reminders here.", opts);
    });
}
function registerRemindersFeature(router) {
    const bot = router.bot;
    // Handle /reminders, /start, START (case insensitive)
    router.register(/\/(reminders|start)/i, guard_1.Guard.registeredOnlyCommand(bot, (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield remindersMenuCommand(bot, msg.chat.id, (_a = msg.from) === null || _a === void 0 ? void 0 : _a.username);
    })), [env_1.env.TG_GROUP_WORK_REMINDERS || '']);
    router.register(/^START$/i, guard_1.Guard.registeredOnlyCommand(bot, (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield remindersMenuCommand(bot, msg.chat.id, (_a = msg.from) === null || _a === void 0 ? void 0 : _a.username);
    })), [env_1.env.TG_GROUP_WORK_REMINDERS || '']);
    router.registerCallback('reminders_add', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, addReminderFlow_1.startAddReminderFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_WORK_REMINDERS || '']);
    router.registerCallback('reminders_list', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, listRemindersFlow_1.startListRemindersFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_WORK_REMINDERS || '']);
}
