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
exports.cocpMenuCommand = void 0;
exports.registerCOCPMenu = registerCOCPMenu;
const guard_1 = require("../../../core/auth/guard");
const env_1 = require("../../../config/env");
const listCOCPFlow_1 = require("../flows/listCOCPFlow");
const searchCOCPFlow_1 = require("../flows/searchCOCPFlow");
const detailCOCPFlow_1 = require("../flows/detailCOCPFlow");
const editCOCPFlow_1 = require("../flows/editCOCPFlow");
const cocpMenuCommand = (bot, chatId, username) => __awaiter(void 0, void 0, void 0, function* () {
    const keyboard = [
        [{ text: '📋 List COCP Numbers', callback_data: 'cocp_list' }],
        [{ text: '🔍 Search COCP', callback_data: 'cocp_search' }],
        [{ text: 'ℹ️ COCP Details', callback_data: 'cocp_detail' }],
        [{ text: '✏️ Edit Safe Custody Date', callback_data: 'cocp_edit' }]
    ];
    yield bot.sendMessage(chatId, "🏢 *COCP Management Menu*\n\nWelcome! Use the buttons below to manage COCP numbers.", {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: keyboard
        }
    });
});
exports.cocpMenuCommand = cocpMenuCommand;
function registerCOCPMenu(router) {
    const bot = router.bot;
    // Command: /cocp
    router.register(/^(?:\/start|start)$/i, (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield (0, exports.cocpMenuCommand)(bot, msg.chat.id, (_a = msg.from) === null || _a === void 0 ? void 0 : _a.username);
    }), [env_1.env.TG_GROUP_COCP || '']);
    // Callback: cocp_start
    router.registerCallback('cocp_start', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, exports.cocpMenuCommand)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_COCP || '']);
    // List
    router.registerCallback('cocp_list', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, listCOCPFlow_1.startListCOCPFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_COCP || '']);
    // Search
    router.registerCallback('cocp_search', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, searchCOCPFlow_1.startSearchCOCPFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_COCP || '']);
    // Detail
    router.registerCallback('cocp_detail', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, detailCOCPFlow_1.startDetailCOCPFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_COCP || '']);
    // Edit
    router.registerCallback('cocp_edit', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, editCOCPFlow_1.startEditCOCPFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_COCP || '']);
}
