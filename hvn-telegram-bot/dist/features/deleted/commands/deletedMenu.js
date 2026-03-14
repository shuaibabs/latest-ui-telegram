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
exports.deletedMenuCommand = deletedMenuCommand;
exports.registerDeletedFeature = registerDeletedFeature;
const guard_1 = require("../../../core/auth/guard");
const env_1 = require("../../../config/env");
const listDeletedFlow_1 = require("../flows/listDeletedFlow");
const restoreDeletedFlow_1 = require("../flows/restoreDeletedFlow");
function deletedMenuCommand(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        const opts = {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📜 List Deleted Numbers', callback_data: 'deleted_list' }],
                    [{ text: '♻️ Restore Number', callback_data: 'deleted_restore' }],
                    [{ text: '🔄 Get Started', callback_data: 'start' }]
                ]
            }
        };
        yield bot.sendMessage(chatId, "🗑️ *Deleted Numbers*\n\nView and restore numbers that were previously deleted.", opts);
    });
}
function registerDeletedFeature(router) {
    const bot = router.bot;
    router.register(/^(?:\/start|start)$/i, (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield deletedMenuCommand(bot, msg.chat.id, (_a = msg.from) === null || _a === void 0 ? void 0 : _a.username);
    }), [env_1.env.TG_GROUP_DELETED_NUMBERS || '']);
    router.registerCallback('deleted_numbers_start', (query) => __awaiter(this, void 0, void 0, function* () {
        yield deletedMenuCommand(bot, query.message.chat.id, query.from.username);
    }), [env_1.env.TG_GROUP_DELETED_NUMBERS || '']); // Use Dealer for routing group check? No, use Deleted.
    router.registerCallback('deleted_list', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, listDeletedFlow_1.startListDeletedFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_DELETED_NUMBERS || '']);
    router.registerCallback('deleted_restore', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, restoreDeletedFlow_1.startRestoreDeletedFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_DELETED_NUMBERS || '']);
}
