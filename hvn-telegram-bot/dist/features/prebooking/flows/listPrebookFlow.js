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
exports.startListPrebookFlow = startListPrebookFlow;
exports.registerListPrebookFlow = registerListPrebookFlow;
const prebookingService_1 = require("../prebookingService");
const permissions_1 = require("../../../core/auth/permissions");
const logger_1 = require("../../../core/logger/logger");
function startListPrebookFlow(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const isUserAdmin = yield (0, permissions_1.isAdmin)(username);
            const profile = yield (0, permissions_1.getUserProfile)(username);
            if (!isUserAdmin && !(profile === null || profile === void 0 ? void 0 : profile.displayName)) {
                yield bot.sendMessage(chatId, "❌ *Profile Incomplete*\n\nYour profile does not have a display name set in the system. Please contact an administrator.", { parse_mode: 'Markdown' });
                return;
            }
            const employeeName = isUserAdmin ? undefined : profile === null || profile === void 0 ? void 0 : profile.displayName;
            const results = yield (0, prebookingService_1.getPrebookingNumbers)(employeeName);
            if (results.length === 0) {
                yield bot.sendMessage(chatId, "📋 No pre-booking records found" + (employeeName ? ` for ${employeeName}` : "") + ".");
                return;
            }
            let text = `📋 *Pre-booking Records (${results.length})*\n`;
            text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
            // Limit to top 20
            const list = results.slice(0, 20);
            list.forEach((pb, i) => {
                text += `${i + 1}. \`${pb.mobile}\` | ${pb.preBookingDate.toDate().toLocaleDateString()}\n`;
                text += `   └ Type: ${pb.originalNumberData.numberType}\n`;
            });
            if (results.length > 20) {
                text += `\n...and ${results.length - 20} more. Use search for specific numbers.`;
            }
            text += `\n━━━━━━━━━━━━━━━━━━━━`;
            yield bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        }
        catch (error) {
            logger_1.logger.error(`Error in listPrebookFlow: ${error.message}`);
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
    });
}
function registerListPrebookFlow(router) {
}
