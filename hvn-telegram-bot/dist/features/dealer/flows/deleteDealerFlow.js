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
exports.startDeleteDealerFlow = startDeleteDealerFlow;
exports.registerDeleteDealerFlow = registerDeleteDealerFlow;
const dealerService_1 = require("../dealerService");
const permissions_1 = require("../../../core/auth/permissions");
function startDeleteDealerFlow(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const isUserAdmin = yield (0, permissions_1.isAdmin)(username);
            const profile = yield (0, permissions_1.getUserProfile)(username);
            const purchases = yield (0, dealerService_1.getDealerPurchases)(isUserAdmin ? undefined : (profile === null || profile === void 0 ? void 0 : profile.uid) || undefined);
            if (purchases.length === 0) {
                yield bot.sendMessage(chatId, "📭 No dealer purchases found to delete.");
                return;
            }
            const buttons = purchases.slice(0, 10).map((p) => ([{ text: `${p.mobile} (${p.dealerName})`, callback_data: `dealer_del_val_${p.id}_${p.mobile}` }]));
            buttons.push([{ text: '❌ Cancel', callback_data: 'dealer_del_cancel' }]);
            yield bot.sendMessage(chatId, "🗑️ *Delete Dealer Purchase*\n\nSelect a record to delete:", {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: buttons }
            });
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
    });
}
function registerDeleteDealerFlow(router) {
    const bot = router.bot;
    router.registerCallback(/^dealer_del_val_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chatId = query.message.chat.id;
        const data = (_a = query.data) === null || _a === void 0 ? void 0 : _a.split('_'); // dealer_del_val_ID_MOBILE
        const id = data[3];
        const mobile = data[4];
        try {
            yield (0, dealerService_1.deleteDealerPurchase)(id);
            yield bot.sendMessage(chatId, `✅ Record for \`${mobile}\` has been deleted.`, { parse_mode: 'Markdown' });
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Failed to delete record: ${error.message}`);
        }
    }));
    router.registerCallback('dealer_del_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        yield bot.sendMessage(query.message.chat.id, "Operation cancelled.");
    }));
}
