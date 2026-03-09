import TelegramBot from 'node-telegram-bot-api';
import { getSession, setSession, clearSession } from '../../../core/bot/sessionManager';
import { logger } from '../../../core/logger/logger';
import { getNumberDetails } from '../inventoryService';
import { CommandRouter } from '../../../core/router/commandRouter';

const DETAIL_STAGES = {
    AWAIT_NUMBER: 'AWAIT_NUMBER',
} as const;

type DetailSession = {
    stage: keyof typeof DETAIL_STAGES;
};

const cancelBtn = { text: '❌ Close', callback_data: 'detail_cancel' };

export async function startDetailNumberFlow(bot: TelegramBot, chatId: number) {
    setSession(chatId, 'detailNumber', {
        stage: 'AWAIT_NUMBER'
    });

    await bot.sendMessage(chatId, "ℹ️ *Number Details*\n\n*Step 1:* Please enter a 10-digit mobile number to check:", {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[cancelBtn]] }
    });
}

export function registerDetailNumberFlow(router: CommandRouter) {
    const bot = router.bot;

    bot.on('message', async (msg: TelegramBot.Message) => {
        const session = getSession(msg.chat.id, 'detailNumber') as DetailSession | undefined;
        if (!session || !msg.text || msg.text.startsWith('/')) return;

        const chatId = msg.chat.id;
        const mobile = msg.text.trim().replace(/\D/g, '');

        if (mobile.length !== 10) {
            await bot.sendMessage(chatId, "❌ Please enter a valid 10-digit mobile number.");
            return;
        }

        try {
            const { found, location, data } = await getNumberDetails(mobile);

            if (!found) {
                await bot.sendMessage(chatId, `❌ *Number Not Found*\n\nThe number \`${mobile}\` is not in our system.`, { parse_mode: 'Markdown' });
            } else {
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
                } else if (location === 'Sales') {
                    response += `💰 *Sale Price:* ₹${data.salePrice}\n`;
                    response += `👤 *Sold To:* ${data.soldTo}\n`;
                    response += `📅 *Sale Date:* ${data.saleDate?.toDate()?.toLocaleDateString()}\n`;
                    response += `📤 *Upload Status:* ${data.uploadStatus}\n`;
                } else if (location === 'Prebooked') {
                    response += `📅 *Prebooked On:* ${data.preBookingDate?.toDate()?.toLocaleDateString()}\n`;
                    response += `📤 *Upload Status:* ${data.uploadStatus}\n`;
                } else if (location === 'Deleted') {
                    response += `🗑 *Deleted By:* ${data.deletedBy}\n`;
                    response += `📅 *Deleted At:* ${data.deletedAt?.toDate()?.toLocaleDateString()}\n`;
                    response += `📝 *Reason:* ${data.deletionReason}\n`;
                }

                await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
            }

            clearSession(chatId, 'detailNumber');
        } catch (error: any) {
            logger.error(`Error in DetailNumberFlow: ${error.message}`);
            await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
            clearSession(chatId, 'detailNumber');
        }
    });

    router.registerCallback('detail_cancel', async (query) => {
        clearSession(query.message!.chat.id, 'detailNumber');
        await bot.sendMessage(query.message!.chat.id, "Detail check closed.");
    });
}
