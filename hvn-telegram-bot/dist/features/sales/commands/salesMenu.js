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
exports.salesMenuCommand = void 0;
exports.registerSalesMenu = registerSalesMenu;
const guard_1 = require("../../../core/auth/guard");
const env_1 = require("../../../config/env");
const permissions_1 = require("../../../core/auth/permissions");
const listSalesFlow_1 = require("../flows/listSalesFlow");
const searchSalesFlow_1 = require("../flows/searchSalesFlow");
const detailSalesFlow_1 = require("../flows/detailSalesFlow");
const vendorSalesFlow_1 = require("../flows/vendorSalesFlow");
const cancelSaleFlow_1 = require("../flows/cancelSaleFlow");
const salesMenuCommand = (bot, chatId, username) => __awaiter(void 0, void 0, void 0, function* () {
    const isUserAdmin = yield (0, permissions_1.isAdmin)(username);
    const keyboard = [
        [{ text: '📋 List Sales Numbers', callback_data: 'sales_list' }],
        [{ text: '🔍 Search Sales', callback_data: 'sales_search' }],
        [{ text: 'ℹ️ Sale Details', callback_data: 'sales_detail' }],
        [{ text: '📈 Sales by Vendor', callback_data: 'sales_vendor_list' }],
        [{ text: '❌ Cancel Sale', callback_data: 'sales_cancel' }]
    ];
    yield bot.sendMessage(chatId, "💰 *Sales Management Menu*\n\nWelcome! Use the buttons below to manage sales records.", {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: keyboard
        }
    });
});
exports.salesMenuCommand = salesMenuCommand;
function registerSalesMenu(router) {
    const bot = router.bot;
    // Handle /start, START, start
    router.register(/^(?:\/start|start)$/i, guard_1.Guard.registeredOnlyCommand(bot, (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield (0, exports.salesMenuCommand)(bot, msg.chat.id, (_a = msg.from) === null || _a === void 0 ? void 0 : _a.username);
    })), [env_1.env.TG_GROUP_SALES || '']);
    // Handle standard Get Started button
    router.registerCallback('sales_start', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, exports.salesMenuCommand)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_SALES || '']);
    // List Sales
    router.registerCallback('sales_list', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, listSalesFlow_1.startListSalesFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_SALES || '']);
    // Search Sales
    router.registerCallback('sales_search', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, searchSalesFlow_1.startSearchSalesFlow)(bot, query.message.chat.id);
    })), [env_1.env.TG_GROUP_SALES || '']);
    // Sale Details
    router.registerCallback('sales_detail', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, detailSalesFlow_1.startDetailSalesFlow)(bot, query.message.chat.id);
    })), [env_1.env.TG_GROUP_SALES || '']);
    // Sales by Vendor
    router.registerCallback('sales_vendor_list', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, vendorSalesFlow_1.startVendorSalesFlow)(bot, query.message.chat.id);
    })), [env_1.env.TG_GROUP_SALES || '']);
    // Cancel Sale
    router.registerCallback('sales_cancel', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, cancelSaleFlow_1.startCancelSaleFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_SALES || '']);
}
