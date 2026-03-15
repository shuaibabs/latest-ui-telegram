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
exports.dealerMenuCommand = dealerMenuCommand;
exports.registerDealerFeature = registerDealerFeature;
const guard_1 = require("../../../core/auth/guard");
const env_1 = require("../../../config/env");
const addDealerFlow_1 = require("../flows/addDealerFlow");
const deleteDealerFlow_1 = require("../flows/deleteDealerFlow");
const detailsDealerFlow_1 = require("../flows/detailsDealerFlow");
function dealerMenuCommand(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        const opts = {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '➕ Add Dealer Numbers', callback_data: 'dealer_add' }],
                    [{ text: '🗑️ Delete Dealer Purchase', callback_data: 'dealer_delete' }],
                    [{ text: '🔍 View Details', callback_data: 'dealer_details' }]
                ]
            }
        };
        yield bot.sendMessage(chatId, "🤝 *Dealer Purchases*\n\nManage numbers purchased from dealers.", opts);
    });
}
function registerDealerFeature(router) {
    const bot = router.bot;
    router.register(/^(?:\/start|start)$/i, (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield dealerMenuCommand(bot, msg.chat.id, (_a = msg.from) === null || _a === void 0 ? void 0 : _a.username);
    }), [env_1.env.TG_GROUP_DEALER_PURCHASES || '']);
    router.registerCallback('dealer_purchases_start', (query) => __awaiter(this, void 0, void 0, function* () {
        yield dealerMenuCommand(bot, query.message.chat.id, query.from.username);
    }), [env_1.env.TG_GROUP_DEALER_PURCHASES || '']);
    router.registerCallback('dealer_add', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, addDealerFlow_1.startAddDealerFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_DEALER_PURCHASES || '']);
    router.registerCallback('dealer_delete', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, deleteDealerFlow_1.startDeleteDealerFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_DEALER_PURCHASES || '']);
    router.registerCallback('dealer_details', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, detailsDealerFlow_1.startDetailsDealerFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_DEALER_PURCHASES || '']);
}
