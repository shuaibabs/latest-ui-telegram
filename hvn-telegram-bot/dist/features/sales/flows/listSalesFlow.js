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
exports.startListSalesFlow = startListSalesFlow;
exports.registerListSalesFlow = registerListSalesFlow;
const salesService_1 = require("../salesService");
const permissions_1 = require("../../../core/auth/permissions");
const logger_1 = require("../../../core/logger/logger");
function startListSalesFlow(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const isUserAdmin = yield (0, permissions_1.isAdmin)(username);
            const profile = yield (0, permissions_1.getUserProfile)(username);
            if (!isUserAdmin && !(profile === null || profile === void 0 ? void 0 : profile.displayName)) {
                yield bot.sendMessage(chatId, "❌ *Profile Incomplete*\n\nYour profile does not have a display name set in the system. Please contact an administrator.", { parse_mode: 'Markdown' });
                return;
            }
            const employeeName = isUserAdmin ? undefined : profile === null || profile === void 0 ? void 0 : profile.displayName;
            const results = yield (0, salesService_1.getSalesNumbers)(employeeName);
            if (results.length === 0) {
                yield bot.sendMessage(chatId, "📋 No sales records found" + (employeeName ? ` for ${employeeName}` : "") + ".");
                return;
            }
            let text = `📋 *Sales Records (${results.length})*\n`;
            text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
            // Limit to top 20 for message size constraints
            const list = results.slice(0, 20);
            list.forEach((sale, i) => {
                text += `${i + 1}. \`${sale.mobile}\` | ₹${sale.salePrice}\n`;
                text += `   └ Sold to: ${sale.soldTo}\n`;
            });
            if (results.length > 20) {
                text += `\n...and ${results.length - 20} more. Use search for specific numbers.`;
            }
            text += `\n━━━━━━━━━━━━━━━━━━━━`;
            yield bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        }
        catch (error) {
            logger_1.logger.error(`Error in listSalesFlow: ${error.message}`);
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
    });
}
function registerListSalesFlow(router) {
    // No specific callbacks needed if it's just a direct call from menu
}
