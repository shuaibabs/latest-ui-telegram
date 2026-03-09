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
exports.startDeleteNumbersFlow = startDeleteNumbersFlow;
exports.registerDeleteNumbersFlow = registerDeleteNumbersFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const inventoryService_1 = require("../inventoryService");
const activityService_1 = require("../../activities/activityService");
const DELETE_NUMBERS_STAGES = {
    AWAIT_NUMBERS: 'AWAIT_NUMBERS',
    CONFIRM: 'CONFIRM',
};
const cancelBtn = { text: '❌ Cancel', callback_data: 'delete_numbers_cancel' };
function startDeleteNumbersFlow(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.setSession)(chatId, 'deleteNumbers', {
            stage: 'AWAIT_NUMBERS',
            data: {
                numbers: []
            }
        });
        yield bot.sendMessage(chatId, "🗑 *Soft Delete Number(s)*\n\n*Step 1:* Please enter one or more 10-digit mobile numbers separated by comma or new line.", {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[cancelBtn]] }
        });
    });
}
function registerDeleteNumbersFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'deleteNumbers');
        if (!session || !msg.text || msg.text.startsWith('/'))
            return;
        const chatId = msg.chat.id;
        if (session.stage === 'AWAIT_NUMBERS') {
            const numbers = msg.text.split(/[\n,]+/).map(n => n.trim().replace(/\D/g, '')).filter(n => n.length === 10);
            if (numbers.length === 0) {
                yield bot.sendMessage(chatId, "❌ No valid 10-digit numbers found. Please try again.");
                return;
            }
            // Validate existence
            const { existing, missing } = yield (0, inventoryService_1.validateNumbersExistence)(numbers);
            if (existing.length === 0) {
                yield bot.sendMessage(chatId, `❌ None of the provided numbers exist in the inventory.\n\n*Rejected:* ${missing.join(', ')}`, { parse_mode: 'Markdown' });
                (0, sessionManager_1.clearSession)(chatId, 'deleteNumbers');
                return;
            }
            session.data.numbers = existing;
            session.stage = 'CONFIRM';
            (0, sessionManager_1.setSession)(chatId, 'deleteNumbers', session);
            let statusMsg = `🔍 *Validation Results*\n\n✅ *Found:* ${existing.length}\n`;
            if (missing.length > 0)
                statusMsg += `⚠️ *Not Found (skipped):* ${missing.length}\n`;
            statusMsg += `\n*The following numbers will be moved to deleted collection:* \n${existing.join(', ')}\n\n*Confirm deletion?*`;
            yield bot.sendMessage(chatId, statusMsg, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🗑 Confirm Delete', callback_data: 'del_num_confirm' }],
                        [cancelBtn]
                    ]
                }
            });
        }
    }));
    router.registerCallback('del_num_confirm', (query) => __awaiter(this, void 0, void 0, function* () {
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'deleteNumbers');
        if (!session || session.stage !== 'CONFIRM')
            return;
        try {
            const creator = query.from.first_name + (query.from.last_name ? ' ' + query.from.last_name : '');
            const result = yield (0, inventoryService_1.softDeleteNumbers)(session.data.numbers, creator);
            yield bot.sendMessage(chatId, `✅ *Deletion Successful!*\n\nSuccessfully deleted ${result.successCount} number(s).`, { parse_mode: 'Markdown' });
            // Log Activity
            yield (0, activityService_1.logActivity)(bot, {
                employeeName: creator,
                action: 'DELETE_NUMBERS',
                description: `Soft deleted ${result.successCount} numbers from inventory:\n${session.data.numbers.join(', ')}`,
                createdBy: creator,
                source: 'BOT',
                groupName: 'INVENTORY'
            }, true);
            (0, sessionManager_1.clearSession)(chatId, 'deleteNumbers');
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
            (0, sessionManager_1.clearSession)(chatId, 'deleteNumbers');
        }
    }));
    router.registerCallback('delete_numbers_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'deleteNumbers');
        yield bot.sendMessage(query.message.chat.id, "❌ Deletion flow cancelled.");
    }));
}
