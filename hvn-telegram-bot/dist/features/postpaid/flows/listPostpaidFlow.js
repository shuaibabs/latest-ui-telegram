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
exports.startListPostpaidFlow = startListPostpaidFlow;
exports.registerListPostpaidFlow = registerListPostpaidFlow;
const postpaidService_1 = require("../postpaidService");
const permissions_1 = require("../../../core/auth/permissions");
const logger_1 = require("../../../core/logger/logger");
function startListPostpaidFlow(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const isUserAdmin = yield (0, permissions_1.isAdmin)(username);
            const profile = yield (0, permissions_1.getUserProfile)(username);
            if (!isUserAdmin && !(profile === null || profile === void 0 ? void 0 : profile.displayName)) {
                yield bot.sendMessage(chatId, "❌ *Profile Incomplete*\n\nYour profile does not have a display name set in the system. Please contact an administrator.", { parse_mode: 'Markdown' });
                return;
            }
            const employeeName = isUserAdmin ? undefined : profile === null || profile === void 0 ? void 0 : profile.displayName;
            const results = yield (0, postpaidService_1.getPostpaidNumbers)(employeeName);
            if (results.length === 0) {
                yield bot.sendMessage(chatId, "📋 No postpaid records found" + (employeeName ? ` for ${employeeName}` : "") + ".");
                return;
            }
            let text = `📱 *Postpaid Records (${results.length})*\n`;
            text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
            const list = results.slice(0, 20);
            list.forEach((num, i) => {
                text += `${i + 1}. \`${num.mobile}\` | ${num.status}\n`;
                if (num.billDate)
                    text += `   └ Bill Date: ${num.billDate.toDate().toLocaleDateString()}\n`;
                text += `   └ PD Bill: ${num.pdBill || 'N/A'}\n`;
            });
            if (results.length > 20) {
                text += `\n...and ${results.length - 20} more. Use search for specific numbers.`;
            }
            text += `\n━━━━━━━━━━━━━━━━━━━━`;
            yield bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        }
        catch (error) {
            logger_1.logger.error(`Error in listPostpaidFlow: ${error.message}`);
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
    });
}
function registerListPostpaidFlow(router) { }
