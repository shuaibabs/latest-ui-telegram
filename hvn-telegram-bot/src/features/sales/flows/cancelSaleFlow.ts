import TelegramBot from 'node-telegram-bot-api';
import { getSession, setSession, clearSession } from '../../../core/bot/sessionManager';
import { logger } from '../../../core/logger/logger';
import { getSaleDetails, cancelSale } from '../salesService';
import { CommandRouter } from '../../../core/router/commandRouter';
import { getUserProfile, isAdmin } from '../../../core/auth/permissions';

export async function startCancelSaleFlow(bot: TelegramBot, chatId: number, username?: string) {
    setSession(chatId, 'cancelSale', { stage: 'AWAIT_MOBILE' });
    await bot.sendMessage(chatId, "❌ *Cancel Sale*\n\nPlease enter the mobile number of the sale you want to cancel:", {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'sales_cancel_cancel_op' }]]
        }
    });
}

export function registerCancelSaleFlow(router: CommandRouter) {
    const bot = router.bot;

    bot.on('message', async (msg: TelegramBot.Message) => {
        const session = getSession(msg.chat.id, 'cancelSale');
        if (!session || !msg.text || msg.text.startsWith('/')) return;

        const chatId = msg.chat.id;

        if (session.stage === 'AWAIT_MOBILE') {
            const mobile = msg.text.trim();
            if (!/^\d{10}$/.test(mobile)) {
                await bot.sendMessage(chatId, "❌ Invalid mobile number. Please enter a 10-digit number.");
                return;
            }

            try {
                const isUserAdmin = await isAdmin(msg.from?.username);
                const profile = await getUserProfile(msg.from?.username);
                const employeeName = isUserAdmin ? undefined : profile?.displayName;

                const sale = await getSaleDetails(mobile, employeeName);

                if (!sale) {
                    await bot.sendMessage(chatId, `❌ No sale record found for \`${mobile}\`${employeeName ? ` assigned to ${employeeName}` : ""}.`, { parse_mode: 'Markdown' });
                    clearSession(chatId, 'cancelSale');
                    return;
                }

                session.stage = 'CONFIRM_CANCEL';
                session.saleId = sale.id;
                session.mobile = mobile;
                setSession(chatId, 'cancelSale', session);

                await bot.sendMessage(chatId, `⚠️ *Confirm Cancellation*\n\nAre you sure you want to cancel the sale for \`${mobile}\`?\n\nThe number will be moved back to Inventory.`, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '✅ Yes, Cancel Sale', callback_data: 'sales_cancel_confirm' }],
                            [{ text: '❌ No', callback_data: 'sales_cancel_cancel_op' }]
                        ]
                    }
                });
            } catch (error: any) {
                logger.error(`Error in cancelSaleFlow: ${error.message}`);
                await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
                clearSession(chatId, 'cancelSale');
            }
        }
    });

    router.registerCallback('sales_cancel_confirm', async (query) => {
        const chatId = query.message!.chat.id;
        const session = getSession(chatId, 'cancelSale');
        if (!session || session.stage !== 'CONFIRM_CANCEL') return;

        try {
            const profile = await getUserProfile(query.from.username);
            const performedBy = profile?.displayName || query.from.username || 'Unknown';

            const success = await cancelSale(session.saleId, performedBy);

            if (success) {
                await bot.sendMessage(chatId, `✅ Sale for \`${session.mobile}\` has been cancelled and moved back to inventory.`, { parse_mode: 'Markdown' });
            } else {
                await bot.sendMessage(chatId, `❌ Failed to cancel sale. It may have already been removed.`);
            }
        } catch (error: any) {
            logger.error(`Error in cancelSale confirmation: ${error.message}`);
            await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        } finally {
            clearSession(chatId, 'cancelSale');
        }
    });

    router.registerCallback('sales_cancel_cancel_op', async (query) => {
        clearSession(query.message!.chat.id, 'cancelSale');
        await bot.sendMessage(query.message!.chat.id, "Operation cancelled.");
    });
}
