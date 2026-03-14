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
exports.postpaidMenuCommand = void 0;
exports.registerPostpaidMenu = registerPostpaidMenu;
const guard_1 = require("../../../core/auth/guard");
const env_1 = require("../../../config/env");
const listPostpaidFlow_1 = require("../flows/listPostpaidFlow");
const searchPostpaidFlow_1 = require("../flows/searchPostpaidFlow");
const detailPostpaidFlow_1 = require("../flows/detailPostpaidFlow");
const editPostpaidFlow_1 = require("../flows/editPostpaidFlow");
const postpaidMenuCommand = (bot, chatId, username) => __awaiter(void 0, void 0, void 0, function* () {
    const keyboard = [
        [{ text: '📋 List Postpaid Numbers', callback_data: 'postpaid_list' }],
        [{ text: '🔍 Search Postpaid', callback_data: 'postpaid_search' }],
        [{ text: 'ℹ️ Postpaid Details', callback_data: 'postpaid_detail' }],
        [{ text: '✏️ Edit Postpaid Details', callback_data: 'postpaid_edit' }]
    ];
    yield bot.sendMessage(chatId, "📱 *Postpaid Management Menu*\n\nWelcome! Use the buttons below to manage postpaid numbers.", {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: keyboard
        }
    });
});
exports.postpaidMenuCommand = postpaidMenuCommand;
function registerPostpaidMenu(router) {
    const bot = router.bot;
    // Command: /postpaid
    router.register(/^(?:\/postpaid|postpaid)$/i, (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield (0, exports.postpaidMenuCommand)(bot, msg.chat.id, (_a = msg.from) === null || _a === void 0 ? void 0 : _a.username);
    }), [env_1.env.TG_GROUP_POSTPAID_NUMBERS || '']);
    // Callback: postpaid_start
    router.registerCallback('postpaid_start', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, exports.postpaidMenuCommand)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_POSTPAID_NUMBERS || '']);
    // List
    router.registerCallback('postpaid_list', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, listPostpaidFlow_1.startListPostpaidFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_POSTPAID_NUMBERS || '']);
    // Search
    router.registerCallback('postpaid_search', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, searchPostpaidFlow_1.startSearchPostpaidFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_POSTPAID_NUMBERS || '']);
    // Detail
    router.registerCallback('postpaid_detail', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, detailPostpaidFlow_1.startDetailPostpaidFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_POSTPAID_NUMBERS || '']);
    // Edit
    router.registerCallback('postpaid_edit', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, editPostpaidFlow_1.startEditPostpaidFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_POSTPAID_NUMBERS || '']);
}
