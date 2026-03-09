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
exports.startDetailNumberFlow = startDetailNumberFlow;
exports.registerDetailNumberFlow = registerDetailNumberFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const logger_1 = require("../../../core/logger/logger");
const inventoryService_1 = require("../inventoryService");
const DETAIL_STAGES = {
    AWAIT_NUMBER: 'AWAIT_NUMBER',
};
const cancelBtn = { text: '❌ Close', callback_data: 'detail_cancel' };
function startDetailNumberFlow(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.setSession)(chatId, 'detailNumber', {
            stage: 'AWAIT_NUMBER'
        });
        yield bot.sendMessage(chatId, "ℹ️ *Number Details*\n\n*Step 1:* Please enter a 10-digit mobile number to check:", {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[cancelBtn]] }
        });
    });
}
function registerDetailNumberFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'detailNumber');
        if (!session || !msg.text || msg.text.startsWith('/'))
            return;
        const chatId = msg.chat.id;
        const mobile = msg.text.trim().replace(/\D/g, '');
        if (mobile.length !== 10) {
            yield bot.sendMessage(chatId, "❌ Please enter a valid 10-digit mobile number.");
            return;
        }
        try {
            const { found, location, data } = yield (0, inventoryService_1.getNumberDetails)(mobile);
            if (!found) {
                yield bot.sendMessage(chatId, `❌ *Number Not Found*\n\nThe number \`${mobile}\` is not in our system.`, { parse_mode: 'Markdown' });
            }
            else {
                let response = `ℹ️ *Details for ${mobile}*\n\n`;
                response += `📍 *Current Location:* ${location}\n`;
                if (location === 'Inventory') {
                    response += `📋 *Status:* ${data.status}\n`;
                    response += `📤 *Upload Status:* ${data.uploadStatus}\n`;
                    response += `💰 *Purchase Price:* ₹${data.purchasePrice}\n`;
                    response += `📈 *Sale Price:* ₹${data.salePrice}\n`;
                    response += `👤 *Ownership:* ${data.ownershipType}\n`;
                    response += `🏢 *Location Type:* ${data.locationType}\n`;
                    response += `📍 *Current Location:* ${data.currentLocation}\n`;
                    response += `👤 *Assigned To:* ${data.assignedTo}\n`;
                }
                else if (location === 'Sales') {
                    response += `💰 *Sale Price:* ₹${data.salePrice}\n`;
                    response += `👤 *Sold To:* ${data.soldTo}\n`;
                    response += `📅 *Sale Date:* ${(_b = (_a = data.saleDate) === null || _a === void 0 ? void 0 : _a.toDate()) === null || _b === void 0 ? void 0 : _b.toLocaleDateString()}\n`;
                    response += `📤 *Upload Status:* ${data.uploadStatus}\n`;
                }
                else if (location === 'Prebooked') {
                    response += `📅 *Prebooked On:* ${(_d = (_c = data.preBookingDate) === null || _c === void 0 ? void 0 : _c.toDate()) === null || _d === void 0 ? void 0 : _d.toLocaleDateString()}\n`;
                    response += `📤 *Upload Status:* ${data.uploadStatus}\n`;
                }
                else if (location === 'Deleted') {
                    response += `🗑 *Deleted By:* ${data.deletedBy}\n`;
                    response += `📅 *Deleted At:* ${(_f = (_e = data.deletedAt) === null || _e === void 0 ? void 0 : _e.toDate()) === null || _f === void 0 ? void 0 : _f.toLocaleDateString()}\n`;
                    response += `📝 *Reason:* ${data.deletionReason}\n`;
                }
                yield bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
            }
            (0, sessionManager_1.clearSession)(chatId, 'detailNumber');
        }
        catch (error) {
            logger_1.logger.error(`Error in DetailNumberFlow: ${error.message}`);
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
            (0, sessionManager_1.clearSession)(chatId, 'detailNumber');
        }
    }));
    router.registerCallback('detail_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'detailNumber');
        yield bot.sendMessage(query.message.chat.id, "Detail check closed.");
    }));
}
