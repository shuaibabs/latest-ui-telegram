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
exports.historyMenuCommand = void 0;
exports.registerHistoryMenu = registerHistoryMenu;
const guard_1 = require("../../../core/auth/guard");
const env_1 = require("../../../config/env");
const detailHistoryFlow_1 = require("../flows/detailHistoryFlow");
const historyMenuCommand = (bot, chatId, username) => __awaiter(void 0, void 0, void 0, function* () {
    const keyboard = [
        [{ text: 'ℹ️ Show Number History', callback_data: 'history_detail' }]
    ];
    yield bot.sendMessage(chatId, "📜 *Global History Management Menu*\n\nWelcome! Use the button below to view the full lifecycle history of any number.", {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: keyboard
        }
    });
});
exports.historyMenuCommand = historyMenuCommand;
function registerHistoryMenu(router) {
    const bot = router.bot;
    // Command: /history
    router.register(/^(?:\/start|start)$/i, (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield (0, exports.historyMenuCommand)(bot, msg.chat.id, (_a = msg.from) === null || _a === void 0 ? void 0 : _a.username);
    }), [env_1.env.TG_GROUP_GLOBAL_HISTORY || '']);
    // Callback: history_start
    router.registerCallback('history_start', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, exports.historyMenuCommand)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_GLOBAL_HISTORY || '']);
    // Detail Flow
    router.registerCallback('history_detail', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, detailHistoryFlow_1.startDetailHistoryFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_GLOBAL_HISTORY || '']);
}
