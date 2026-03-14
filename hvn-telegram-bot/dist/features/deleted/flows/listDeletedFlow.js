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
exports.startListDeletedFlow = startListDeletedFlow;
const deletedService_1 = require("../deletedService");
const permissions_1 = require("../../../core/auth/permissions");
const logger_1 = require("../../../core/logger/logger");
function startListDeletedFlow(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const isUserAdmin = yield (0, permissions_1.isAdmin)(username);
            const profile = yield (0, permissions_1.getUserProfile)(username);
            const employeeName = isUserAdmin ? undefined : profile === null || profile === void 0 ? void 0 : profile.displayName;
            const results = yield (0, deletedService_1.getDeletedNumbers)(employeeName);
            if (results.length === 0) {
                yield bot.sendMessage(chatId, "🔍 No deleted numbers found.");
                return;
            }
            const count = results.length;
            let text = `📜 *Deleted Numbers (${count})*\n`;
            text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
            results.slice(0, 15).forEach((num, i) => {
                text += `${i + 1}. \`${num.mobile}\` | Deleted By: ${num.deletedBy}\n   Reason: ${num.deletionReason}\n\n`;
            });
            if (count > 15)
                text += `...and ${count - 15} more records.`;
            text += `\n━━━━━━━━━━━━━━━━━━━━`;
            yield bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        }
        catch (error) {
            logger_1.logger.error(`Error in listDeletedFlow: ${error.message}`);
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
    });
}
