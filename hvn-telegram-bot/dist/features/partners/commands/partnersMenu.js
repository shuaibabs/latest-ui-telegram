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
exports.partnersMenuCommand = void 0;
exports.registerPartnersMenu = registerPartnersMenu;
const guard_1 = require("../../../core/auth/guard");
const env_1 = require("../../../config/env");
const listPartnersFlow_1 = require("../flows/listPartnersFlow");
const searchPartnersFlow_1 = require("../flows/searchPartnersFlow");
const detailPartnersFlow_1 = require("../flows/detailPartnersFlow");
const partnersMenuCommand = (bot, chatId, username) => __awaiter(void 0, void 0, void 0, function* () {
    const keyboard = [
        [{ text: '📋 List Partnership Numbers', callback_data: 'partners_list' }],
        [{ text: '🔍 Search Partnership', callback_data: 'partners_search' }],
        [{ text: 'ℹ️ Partnership Details', callback_data: 'partners_detail' }]
    ];
    yield bot.sendMessage(chatId, "🤝 *Partnership Management Menu*\n\nWelcome! Use the buttons below to manage partnership numbers.", {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: keyboard
        }
    });
});
exports.partnersMenuCommand = partnersMenuCommand;
function registerPartnersMenu(router) {
    const bot = router.bot;
    // Command: /partners
    router.register(/^(?:\/start|start)$/i, (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield (0, exports.partnersMenuCommand)(bot, msg.chat.id, (_a = msg.from) === null || _a === void 0 ? void 0 : _a.username);
    }), [env_1.env.TG_GROUP_PARTNERS || '']);
    // Callback: partners_start
    router.registerCallback('partners_start', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, exports.partnersMenuCommand)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_PARTNERS || '']);
    // List
    router.registerCallback('partners_list', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, listPartnersFlow_1.startListPartnersFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_PARTNERS || '']);
    // Search
    router.registerCallback('partners_search', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, searchPartnersFlow_1.startSearchPartnersFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_PARTNERS || '']);
    // Detail
    router.registerCallback('partners_detail', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, detailPartnersFlow_1.startDetailPartnersFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_PARTNERS || '']);
}
