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
exports.startPrebookFlow = startPrebookFlow;
exports.registerPrebookFlow = registerPrebookFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const inventoryService_1 = require("../inventoryService");
const activityService_1 = require("../../activities/activityService");
const PREBOOK_STAGES = {
    AWAIT_NUMBERS: 'AWAIT_NUMBERS',
    CONFIRM: 'CONFIRM',
};
const cancelBtn = { text: '❌ Cancel', callback_data: 'prebook_cancel' };
function startPrebookFlow(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.setSession)(chatId, 'prebook', {
            stage: 'AWAIT_NUMBERS',
            data: {
                numbers: []
            }
        });
        yield bot.sendMessage(chatId, "📖 *Prebook Number(s)*\n\n*Step 1:* Please enter one or more 10-digit mobile numbers separated by comma or new line.", {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[cancelBtn]] }
        });
    });
}
function registerPrebookFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'prebook');
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
                    (0, sessionManager_1.clearSession)(chatId, 'prebook');
                    return;
                }
                session.data.numbers = existing;
                session.stage = 'CONFIRM';
                (0, sessionManager_1.setSession)(chatId, 'prebook', session);
                let statusMsg = `✅ Found ${existing.length} number(s).`;
                if (missing.length > 0)
                    statusMsg += `\n⚠️ Rejected (not found): ${missing.length}`;
                const summary = `${statusMsg}\n\n*Confirm Prebook*\n\n` +
                    `📱 *Numbers:* ${existing.join(', ')}\n\n` +
                    `*Move these numbers to Prebooking list?*`;
                yield bot.sendMessage(chatId, summary, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '✅ Confirm & Prebook', callback_data: 'prebook_confirm' }],
                            [cancelBtn]
                        ]
                    }
                });
                break;
            }
        }
    }));
    router.registerCallback('prebook_confirm', (query) => __awaiter(this, void 0, void 0, function* () {
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'prebook');
        if (!session || session.stage !== 'CONFIRM')
            return;
        try {
            const creator = query.from.first_name + (query.from.last_name ? ' ' + query.from.last_name : '');
            const result = yield (0, inventoryService_1.prebookNumbersBatch)(session.data.numbers, query.from.id.toString(), creator);
            yield bot.sendMessage(chatId, `✅ *Numbers Prebooked!*\n\nSuccessfully moved ${result.successCount} number(s) to Prebookings.`, { parse_mode: 'Markdown' });
            // Log Activity
            yield (0, activityService_1.logActivity)(bot, {
                employeeName: creator,
                action: 'PREBOOK_NUMBER',
                description: `Prebooked ${result.successCount} numbers:\n${session.data.numbers.join(', ')}`,
                createdBy: creator,
                source: 'BOT',
                groupName: 'INVENTORY'
            }, true);
            (0, sessionManager_1.clearSession)(chatId, 'prebook');
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
            (0, sessionManager_1.clearSession)(chatId, 'prebook');
        }
    }));
    router.registerCallback('prebook_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'prebook');
        yield bot.sendMessage(query.message.chat.id, "❌ Prebook flow cancelled.");
    }));
}
