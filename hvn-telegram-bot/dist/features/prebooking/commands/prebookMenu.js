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
exports.prebookMenuCommand = void 0;
exports.registerPrebookMenu = registerPrebookMenu;
const guard_1 = require("../../../core/auth/guard");
const env_1 = require("../../../config/env");
const permissions_1 = require("../../../core/auth/permissions");
const listPrebookFlow_1 = require("../flows/listPrebookFlow");
const searchPrebookFlow_1 = require("../flows/searchPrebookFlow");
const detailPrebookFlow_1 = require("../flows/detailPrebookFlow");
const cancelPrebookFlow_1 = require("../flows/cancelPrebookFlow");
const prebookMenuCommand = (bot, chatId, username) => __awaiter(void 0, void 0, void 0, function* () {
    const isUserAdmin = yield (0, permissions_1.isAdmin)(username);
    const keyboard = [
        [{ text: '📋 List Pre-booked Numbers', callback_data: 'prebook_list' }],
        [{ text: '🔍 Search Pre-bookings', callback_data: 'prebook_search' }],
        [{ text: 'ℹ️ Pre-booking Details', callback_data: 'prebook_detail' }],
        [{ text: '❌ Cancel Pre-booking', callback_data: 'prebooking_cancel' }]
    ];
    yield bot.sendMessage(chatId, "📖 *Pre-booking Management Menu*\n\nWelcome! Use the buttons below to manage pre-booked numbers.", {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: keyboard
        }
    });
});
exports.prebookMenuCommand = prebookMenuCommand;
function registerPrebookMenu(router) {
    const bot = router.bot;
    // Handle /start, START, start
    router.register(/^(?:\/start|start)$/i, guard_1.Guard.registeredOnlyCommand(bot, (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield (0, exports.prebookMenuCommand)(bot, msg.chat.id, (_a = msg.from) === null || _a === void 0 ? void 0 : _a.username);
    })), [env_1.env.TG_GROUP_PREBOOKING || '']);
    // Handle standard Get Started button
    router.registerCallback('prebooking_start', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, exports.prebookMenuCommand)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_PREBOOKING || '']);
    // List Pre-bookings
    router.registerCallback('prebook_list', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, listPrebookFlow_1.startListPrebookFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_PREBOOKING || '']);
    // Search Pre-bookings
    router.registerCallback('prebook_search', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, searchPrebookFlow_1.startSearchPrebookFlow)(bot, query.message.chat.id);
    })), [env_1.env.TG_GROUP_PREBOOKING || '']);
    // Pre-booking Details
    router.registerCallback('prebook_detail', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, detailPrebookFlow_1.startDetailPrebookFlow)(bot, query.message.chat.id);
    })), [env_1.env.TG_GROUP_PREBOOKING || '']);
    // Cancel Pre-booking
    router.registerCallback('prebooking_cancel', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, cancelPrebookFlow_1.startCancelPrebookFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_PREBOOKING || '']);
}
