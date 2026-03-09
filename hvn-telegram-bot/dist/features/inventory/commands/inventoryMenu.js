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
exports.inventoryMenuCommand = void 0;
exports.registerInventoryMenu = registerInventoryMenu;
const guard_1 = require("../../../core/auth/guard");
const env_1 = require("../../../config/env");
const permissions_1 = require("../../../core/auth/permissions");
const addNumberFlow_1 = require("../flows/addNumberFlow");
const updateStatusFlow_1 = require("../flows/updateStatusFlow");
const assignToUserFlow_1 = require("../flows/assignToUserFlow");
const deleteNumbersFlow_1 = require("../flows/deleteNumbersFlow");
const markAsSoldFlow_1 = require("../flows/markAsSoldFlow");
const prebookFlow_1 = require("../flows/prebookFlow");
const searchFlow_1 = require("../flows/searchFlow");
const detailNumberFlow_1 = require("../flows/detailNumberFlow");
const inventoryMenuCommand = (bot, chatId, username) => __awaiter(void 0, void 0, void 0, function* () {
    const isUserAdmin = yield (0, permissions_1.isAdmin)(username);
    const keyboard = [
        [{ text: '➕ Add Number', callback_data: 'inv_add' }],
        [{ text: '🔄 Update Status', callback_data: 'inv_upd_stat' }],
        [{ text: '💰 Mark as Sold', callback_data: 'inv_sold' }],
        [{ text: '📖 Prebook Number', callback_data: 'inv_prebook' }],
        [{ text: '🔍 Search Numbers', callback_data: 'inv_search' }],
        [{ text: 'ℹ️ Number Details', callback_data: 'inv_detail' }]
    ];
    if (isUserAdmin) {
        keyboard.push([{ text: '👤 Assign to User (Admin)', callback_data: 'inv_assign' }]);
        keyboard.push([{ text: '🗑 Delete Numbers (Admin)', callback_data: 'inv_del' }]);
    }
    yield bot.sendMessage(chatId, "📦 *Inventory Management Menu*\n\nWelcome! Use the buttons below to manage the number inventory.", {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: keyboard
        }
    });
});
exports.inventoryMenuCommand = inventoryMenuCommand;
function registerInventoryMenu(router) {
    const bot = router.bot;
    // Handle /start, START, start
    router.register(/^(?:\/start|start)$/i, guard_1.Guard.registeredOnlyCommand(bot, (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield (0, exports.inventoryMenuCommand)(bot, msg.chat.id, (_a = msg.from) === null || _a === void 0 ? void 0 : _a.username);
    })), [env_1.env.TG_GROUP_INVENTORY || '']);
    // Handle standard Get Started button
    router.registerCallback('inventory_start', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, exports.inventoryMenuCommand)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_INVENTORY || '']);
    // Handle "Add Number" button click
    router.registerCallback('inv_add', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, addNumberFlow_1.startAddNumberFlow)(bot, query.message.chat.id);
    })), [env_1.env.TG_GROUP_INVENTORY || '']);
    // Handle "Update Status" button click
    router.registerCallback('inv_upd_stat', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, updateStatusFlow_1.startUpdateStatusFlow)(bot, query.message.chat.id);
    })), [env_1.env.TG_GROUP_INVENTORY || '']);
    // Handle "Mark as Sold" button click
    router.registerCallback('inv_sold', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, markAsSoldFlow_1.startMarkAsSoldFlow)(bot, query.message.chat.id);
    })), [env_1.env.TG_GROUP_INVENTORY || '']);
    // Handle "Prebook Number" button click
    router.registerCallback('inv_prebook', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, prebookFlow_1.startPrebookFlow)(bot, query.message.chat.id);
    })), [env_1.env.TG_GROUP_INVENTORY || '']);
    // Handle "Search Numbers" button click
    router.registerCallback('inv_search', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, searchFlow_1.startSearchFlow)(bot, query.message.chat.id);
    })), [env_1.env.TG_GROUP_INVENTORY || '']);
    // Handle "Number Details" button click
    router.registerCallback('inv_detail', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, detailNumberFlow_1.startDetailNumberFlow)(bot, query.message.chat.id);
    })), [env_1.env.TG_GROUP_INVENTORY || '']);
    // Handle "Assign to User" button click (Admin Only)
    router.registerCallback('inv_assign', guard_1.Guard.adminOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, assignToUserFlow_1.startAssignToUserFlow)(bot, query.message.chat.id);
    })), [env_1.env.TG_GROUP_INVENTORY || '']);
    router.registerCallback('inv_del', guard_1.Guard.adminOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, deleteNumbersFlow_1.startDeleteNumbersFlow)(bot, query.message.chat.id);
    })), [env_1.env.TG_GROUP_INVENTORY || '']);
}
