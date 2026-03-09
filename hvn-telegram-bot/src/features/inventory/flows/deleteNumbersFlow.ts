import TelegramBot from 'node-telegram-bot-api';
import { getSession, setSession, clearSession } from '../../../core/bot/sessionManager';
import { logger } from '../../../core/logger/logger';
import { validateNumbersExistence, softDeleteNumbers } from '../inventoryService';
import { logActivity } from '../../activities/activityService';
import { CommandRouter } from '../../../core/router/commandRouter';

const DELETE_NUMBERS_STAGES = {
    AWAIT_NUMBERS: 'AWAIT_NUMBERS',
    CONFIRM: 'CONFIRM',
} as const;

type DeleteNumbersSession = {
    stage: keyof typeof DELETE_NUMBERS_STAGES;
    data: {
        numbers: string[];
    };
};

const cancelBtn = { text: '❌ Cancel', callback_data: 'delete_numbers_cancel' };

export async function startDeleteNumbersFlow(bot: TelegramBot, chatId: number) {
    setSession(chatId, 'deleteNumbers', {
        stage: 'AWAIT_NUMBERS',
        data: {
            numbers: []
        }
    });

    await bot.sendMessage(chatId, "🗑 *Soft Delete Number(s)*\n\n*Step 1:* Please enter one or more 10-digit mobile numbers separated by comma or new line.", {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[cancelBtn]] }
    });
}

export function registerDeleteNumbersFlow(router: CommandRouter) {
    const bot = router.bot;

    bot.on('message', async (msg: TelegramBot.Message) => {
        const session = getSession(msg.chat.id, 'deleteNumbers') as DeleteNumbersSession | undefined;
        if (!session || !msg.text || msg.text.startsWith('/')) return;

        const chatId = msg.chat.id;

        if (session.stage === 'AWAIT_NUMBERS') {
            const numbers = msg.text.split(/[\n,]+/).map(n => n.trim().replace(/\D/g, '')).filter(n => n.length === 10);
            if (numbers.length === 0) {
                await bot.sendMessage(chatId, "❌ No valid 10-digit numbers found. Please try again.");
                return;
            }

            // Validate existence
            const { existing, missing } = await validateNumbersExistence(numbers);
            if (existing.length === 0) {
                await bot.sendMessage(chatId, `❌ None of the provided numbers exist in the inventory.\n\n*Rejected:* ${missing.join(', ')}`, { parse_mode: 'Markdown' });
                clearSession(chatId, 'deleteNumbers');
                return;
            }

            session.data.numbers = existing;
            session.stage = 'CONFIRM';
            setSession(chatId, 'deleteNumbers', session);

            let statusMsg = `🔍 *Validation Results*\n\n✅ *Found:* ${existing.length}\n`;
            if (missing.length > 0) statusMsg += `⚠️ *Not Found (skipped):* ${missing.length}\n`;
            statusMsg += `\n*The following numbers will be moved to deleted collection:* \n${existing.join(', ')}\n\n*Confirm deletion?*`;

            await bot.sendMessage(chatId, statusMsg, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🗑 Confirm Delete', callback_data: 'del_num_confirm' }],
                        [cancelBtn]
                    ]
                }
            });
        }
    });

    router.registerCallback('del_num_confirm', async (query) => {
        const chatId = query.message!.chat.id;
        const session = getSession(chatId, 'deleteNumbers') as DeleteNumbersSession | undefined;
        if (!session || session.stage !== 'CONFIRM') return;

        try {
            const creator = query.from.first_name + (query.from.last_name ? ' ' + query.from.last_name : '');
            const result = await softDeleteNumbers(session.data.numbers, creator);

            await bot.sendMessage(chatId, `✅ *Deletion Successful!*\n\nSuccessfully deleted ${result.successCount} number(s).`, { parse_mode: 'Markdown' });

            // Log Activity
            await logActivity(bot, {
                employeeName: creator,
                action: 'DELETE_NUMBERS',
                description: `Soft deleted ${result.successCount} numbers from inventory:\n${session.data.numbers.join(', ')}`,
                createdBy: creator,
                source: 'BOT',
                groupName: 'INVENTORY'
            }, true);

            clearSession(chatId, 'deleteNumbers');
        } catch (error: any) {
            await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
            clearSession(chatId, 'deleteNumbers');
        }
    });

    router.registerCallback('delete_numbers_cancel', async (query) => {
        clearSession(query.message!.chat.id, 'deleteNumbers');
        await bot.sendMessage(query.message!.chat.id, "❌ Deletion flow cancelled.");
    });
}
