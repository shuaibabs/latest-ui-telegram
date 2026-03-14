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
exports.startVendorSalesFlow = startVendorSalesFlow;
exports.registerVendorSalesFlow = registerVendorSalesFlow;
const salesService_1 = require("../salesService");
const logger_1 = require("../../../core/logger/logger");
function startVendorSalesFlow(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const vendors = yield (0, salesService_1.getSalesVendors)();
            if (vendors.length === 0) {
                yield bot.sendMessage(chatId, "📋 No sales vendors found.");
                return;
            }
            const keyboard = vendors.map(v => ([{
                    text: v.name,
                    callback_data: `sales_vendor_stat:${v.name}`
                }]));
            yield bot.sendMessage(chatId, "📈 *Sales by Vendor*\n\nPlease select a vendor to view their sales statistics:", {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: keyboard
                }
            });
        }
        catch (error) {
            logger_1.logger.error(`Error in startVendorSalesFlow: ${error.message}`);
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
    });
}
function registerVendorSalesFlow(router) {
    const bot = router.bot;
    router.registerCallback(/^sales_vendor_stat:(.+)$/, (query) => __awaiter(this, void 0, void 0, function* () {
        const data = query.data || '';
        const match = /^sales_vendor_stat:(.+)$/.exec(data);
        if (!match)
            return;
        const chatId = query.message.chat.id;
        const vendorName = match[1];
        try {
            yield bot.sendChatAction(chatId, 'typing');
            const stats = yield (0, salesService_1.getVendorSalesStats)(vendorName);
            let text = `📊 *Vendor Sales Report: ${vendorName}*\n`;
            text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
            text += `💰 *Total Billed:* ₹${stats.totalBilled.toLocaleString()}\n`;
            text += `📉 *Total Purchase:* ₹${stats.totalPurchaseAmount.toLocaleString()}\n`;
            const profitLabel = stats.profitLoss >= 0 ? "📈 *Profit:*" : "📉 *Loss:*";
            text += `${profitLabel} ₹${Math.abs(stats.profitLoss).toLocaleString()}\n\n`;
            text += `✅ *Total Paid:* ₹${stats.totalPaid.toLocaleString()}\n`;
            const remainingLabel = stats.amountRemaining > 0 ? "⚠️ *Amount Remaining:*" : "✅ *Amount Remaining:*";
            text += `${remainingLabel} ₹${stats.amountRemaining.toLocaleString()}\n\n`;
            text += `📝 *Total Records:* ${stats.totalRecords}\n`;
            text += `━━━━━━━━━━━━━━━━━━━━`;
            yield bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        }
        catch (error) {
            logger_1.logger.error(`Error fetching vendor stats for ${vendorName}: ${error.message}`);
            yield bot.sendMessage(chatId, `❌ Error fetching statistics: ${error.message}`);
        }
    }));
}
