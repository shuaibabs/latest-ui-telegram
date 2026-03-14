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
exports.startAddDealerFlow = startAddDealerFlow;
exports.registerAddDealerFlow = registerAddDealerFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const dealerService_1 = require("../dealerService");
const permissions_1 = require("../../../core/auth/permissions");
function startAddDealerFlow(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.setSession)(chatId, 'addDealer', { stage: 'AWAIT_NUMBERS' });
        yield bot.sendMessage(chatId, "➕ *Add Dealer Purchase*\n\nPlease enter the mobile number(s). You can enter a single number or multiple numbers separated by commas:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'dealer_add_cancel' }]]
            }
        });
    });
}
function registerAddDealerFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'addDealer');
        if (!session || !msg.text || msg.text.startsWith('/'))
            return;
        const chatId = msg.chat.id;
        const text = msg.text.trim();
        if (session.stage === 'AWAIT_NUMBERS') {
            const numbers = text.split(',').map(n => n.trim()).filter(n => /^\d{10}$/.test(n));
            if (numbers.length === 0) {
                yield bot.sendMessage(chatId, "❌ Invalid input. Please enter 10-digit mobile numbers separated by commas.");
                return;
            }
            session.mobiles = numbers;
            session.stage = 'AWAIT_DEALER_NAME';
            (0, sessionManager_1.setSession)(chatId, 'addDealer', session);
            yield bot.sendMessage(chatId, `✅ Received ${numbers.length} numbers.\n\nEnter *Dealer Name*:`, { parse_mode: 'Markdown' });
        }
        else if (session.stage === 'AWAIT_DEALER_NAME') {
            session.dealerName = text;
            session.stage = 'AWAIT_PRICE';
            (0, sessionManager_1.setSession)(chatId, 'addDealer', session);
            yield bot.sendMessage(chatId, `👤 Dealer: *${text}*\n\nEnter *Purchase Price* per number:`, { parse_mode: 'Markdown' });
        }
        else if (session.stage === 'AWAIT_PRICE') {
            const price = parseFloat(text);
            if (isNaN(price)) {
                yield bot.sendMessage(chatId, "❌ Invalid price. Please enter a number.");
                return;
            }
            session.price = price;
            session.stage = 'CONFIRMATION';
            (0, sessionManager_1.setSession)(chatId, 'addDealer', session);
            let confirmText = `🔔 *Confirm Dealer Purchase*\n\n`;
            confirmText += `📱 Numbers: ${session.mobiles.join(', ')}\n`;
            confirmText += `👤 Dealer: ${session.dealerName}\n`;
            confirmText += `💰 Price: ₹${price} each\n`;
            confirmText += `💵 Total: ₹${price * session.mobiles.length}\n\n`;
            confirmText += `Do you want to add these records?`;
            yield bot.sendMessage(chatId, confirmText, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✅ Confirm & Add', callback_data: 'dealer_add_confirm' }],
                        [{ text: '❌ Cancel', callback_data: 'dealer_add_cancel' }]
                    ]
                }
            });
        }
    }));
    router.registerCallback('dealer_add_confirm', (query) => __awaiter(this, void 0, void 0, function* () {
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'addDealer');
        if (!session)
            return;
        try {
            const profile = yield (0, permissions_1.getUserProfile)(query.from.username);
            if (!(profile === null || profile === void 0 ? void 0 : profile.uid))
                throw new Error("Could not find your user ID.");
            yield bot.sendMessage(chatId, "⏳ Processing... Please wait.");
            for (const mobile of session.mobiles) {
                yield (0, dealerService_1.addDealerPurchaseStep)({
                    mobile,
                    dealerName: session.dealerName,
                    price: session.price
                }, profile.uid);
            }
            yield bot.sendMessage(chatId, `✅ *Success!*\n\n${session.mobiles.length} dealer purchase records have been added.`, { parse_mode: 'Markdown' });
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
        (0, sessionManager_1.clearSession)(chatId, 'addDealer');
    }));
    router.registerCallback('dealer_add_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'addDealer');
        yield bot.sendMessage(query.message.chat.id, "Operation cancelled.");
    }));
}
