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
exports.startMarkAsSoldFlow = startMarkAsSoldFlow;
exports.registerMarkAsSoldFlow = registerMarkAsSoldFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const inventoryService_1 = require("../inventoryService");
const activityService_1 = require("../../activities/activityService");
const MARK_AS_SOLD_STAGES = {
    AWAIT_NUMBERS: 'AWAIT_NUMBERS',
    AWAIT_SALE_PRICE: 'AWAIT_SALE_PRICE',
    AWAIT_VENDOR: 'AWAIT_VENDOR',
    AWAIT_SALE_DATE: 'AWAIT_SALE_DATE',
    CONFIRM: 'CONFIRM',
};
const cancelBtn = { text: '❌ Cancel', callback_data: 'sold_cancel' };
function startMarkAsSoldFlow(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.setSession)(chatId, 'markAsSold', {
            stage: 'AWAIT_NUMBERS',
            data: {
                numbers: [],
                salePrice: 0,
                soldTo: '',
                saleDate: new Date()
            }
        });
        yield bot.sendMessage(chatId, "💰 *Mark Number(s) as Sold*\n\n*Step 1:* Please enter one or more 10-digit mobile numbers separated by comma or new line.", {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[cancelBtn]] }
        });
    });
}
function registerMarkAsSoldFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'markAsSold');
        if (!session || !msg.text || msg.text.startsWith('/'))
            return;
        const chatId = msg.chat.id;
        switch (session.stage) {
            case 'AWAIT_NUMBERS': {
                const numbers = msg.text.split(/[\n,]+/).map(n => n.trim().replace(/\D/g, '')).filter(n => n.length === 10);
                if (numbers.length === 0) {
                    yield bot.sendMessage(chatId, "❌ No valid 10-digit numbers found. Please try again.");
                    return;
                }
                const { existing, missing } = yield (0, inventoryService_1.validateNumbersExistence)(numbers);
                if (existing.length === 0) {
                    yield bot.sendMessage(chatId, `❌ None of the provided numbers exist in the inventory.\n\n*Rejected:* ${missing.join(', ')}`, { parse_mode: 'Markdown' });
                    (0, sessionManager_1.clearSession)(chatId, 'markAsSold');
                    return;
                }
                session.data.numbers = existing;
                session.stage = 'AWAIT_SALE_PRICE';
                (0, sessionManager_1.setSession)(chatId, 'markAsSold', session);
                let statusMsg = `✅ Found ${existing.length} number(s).`;
                if (missing.length > 0)
                    statusMsg += `\n⚠️ Rejected (not found): ${missing.length}`;
                yield bot.sendMessage(chatId, `${statusMsg}\n\n*Step 2:* Enter the Sale Price (per number):`, {
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: [[cancelBtn]] }
                });
                break;
            }
            case 'AWAIT_SALE_PRICE': {
                const price = parseFloat(msg.text.trim());
                if (isNaN(price) || price < 0) {
                    yield bot.sendMessage(chatId, "❌ Invalid price. Please enter a positive number.");
                    return;
                }
                session.data.salePrice = price;
                session.stage = 'AWAIT_VENDOR';
                (0, sessionManager_1.setSession)(chatId, 'markAsSold', session);
                const vendors = yield (0, inventoryService_1.getExistingVendors)();
                const inline_keyboard = vendors.map(v => ([{ text: v, callback_data: `sold_vd_${v}` }]));
                inline_keyboard.push([{ text: '➕ Enter New Vendor Name', callback_data: 'sold_vd_new' }]);
                inline_keyboard.push([cancelBtn]);
                yield bot.sendMessage(chatId, "*Step 3:* Select or enter the Vendor (Buyer) name:", {
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard }
                });
                break;
            }
            case 'AWAIT_VENDOR': {
                session.data.soldTo = msg.text.trim();
                session.stage = 'AWAIT_SALE_DATE';
                (0, sessionManager_1.setSession)(chatId, 'markAsSold', session);
                const today = new Date().toISOString().split('T')[0];
                yield bot.sendMessage(chatId, `*Step 4:* Enter Sale Date (YYYY-MM-DD):\n(Leave blank or type 'today' for ${today})`, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `📅 Today (${today})`, callback_data: 'sold_date_today' }],
                            [cancelBtn]
                        ]
                    }
                });
                break;
            }
            case 'AWAIT_SALE_DATE': {
                let dateStr = msg.text.trim().toLowerCase();
                let date = new Date();
                if (dateStr !== 'today' && dateStr !== '') {
                    date = new Date(dateStr);
                    if (isNaN(date.getTime())) {
                        yield bot.sendMessage(chatId, "❌ Invalid date format. Use YYYY-MM-DD.");
                        return;
                    }
                }
                session.data.saleDate = date;
                session.stage = 'CONFIRM';
                (0, sessionManager_1.setSession)(chatId, 'markAsSold', session);
                yield showSoldConfirmation(bot, chatId, session);
                break;
            }
        }
    }));
    router.registerCallback(/^sold_vd_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'markAsSold');
        if (!session || session.stage !== 'AWAIT_VENDOR')
            return;
        const val = (_a = query.data) === null || _a === void 0 ? void 0 : _a.replace('sold_vd_', '');
        if (val === 'new') {
            yield bot.sendMessage(chatId, "Please type the new Vendor name:");
            return;
        }
        session.data.soldTo = val;
        session.stage = 'AWAIT_SALE_DATE';
        (0, sessionManager_1.setSession)(chatId, 'markAsSold', session);
        const today = new Date().toISOString().split('T')[0];
        yield bot.sendMessage(chatId, `*Step 4:* Enter Sale Date (YYYY-MM-DD):\n(Leave blank or type 'today' for ${today})`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: `📅 Today (${today})`, callback_data: 'sold_date_today' }],
                    [cancelBtn]
                ]
            }
        });
    }));
    router.registerCallback('sold_date_today', (query) => __awaiter(this, void 0, void 0, function* () {
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'markAsSold');
        if (!session || session.stage !== 'AWAIT_SALE_DATE')
            return;
        session.data.saleDate = new Date();
        session.stage = 'CONFIRM';
        (0, sessionManager_1.setSession)(chatId, 'markAsSold', session);
        yield showSoldConfirmation(bot, chatId, session);
    }));
    router.registerCallback('sold_confirm', (query) => __awaiter(this, void 0, void 0, function* () {
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'markAsSold');
        if (!session || session.stage !== 'CONFIRM')
            return;
        try {
            const creator = query.from.first_name + (query.from.last_name ? ' ' + query.from.last_name : '');
            const result = yield (0, inventoryService_1.markAsSoldBatch)(session.data.numbers, {
                salePrice: session.data.salePrice,
                soldTo: session.data.soldTo,
                saleDate: session.data.saleDate
            }, query.from.id.toString(), creator);
            yield bot.sendMessage(chatId, `✅ *Numbers Marked as Sold!*\n\nSuccessfully moved ${result.successCount} number(s) to Sales.`, { parse_mode: 'Markdown' });
            // Log Activity
            yield (0, activityService_1.logActivity)(bot, {
                employeeName: creator,
                action: 'MARK_AS_SOLD',
                description: `Marked ${result.successCount} numbers as Sold to ${session.data.soldTo} for ₹${session.data.salePrice} each.\nNumbers: ${session.data.numbers.join(', ')}`,
                createdBy: creator,
                source: 'BOT',
                groupName: 'INVENTORY'
            }, true);
            (0, sessionManager_1.clearSession)(chatId, 'markAsSold');
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
            (0, sessionManager_1.clearSession)(chatId, 'markAsSold');
        }
    }));
    router.registerCallback('sold_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'markAsSold');
        yield bot.sendMessage(query.message.chat.id, "❌ Mark as Sold flow cancelled.");
    }));
}
function showSoldConfirmation(bot, chatId, session) {
    return __awaiter(this, void 0, void 0, function* () {
        const summary = `*Confirm Mark as Sold*\n\n` +
            `📱 *Numbers:* ${session.data.numbers.join(', ')}\n` +
            `💰 *Sale Price:* ₹${session.data.salePrice}\n` +
            `👤 *Sold To:* ${session.data.soldTo}\n` +
            `📅 *Sale Date:* ${session.data.saleDate.toLocaleDateString()}\n\n` +
            `*Move these numbers to Sales collection?*`;
        yield bot.sendMessage(chatId, summary, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '✅ Confirm & Move to Sales', callback_data: 'sold_confirm' }],
                    [cancelBtn]
                ]
            }
        });
    });
}
