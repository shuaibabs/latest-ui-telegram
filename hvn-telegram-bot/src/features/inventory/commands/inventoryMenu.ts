import TelegramBot from 'node-telegram-bot-api';
import { CommandRouter } from '../../../core/router/commandRouter';
import { Guard } from '../../../core/auth/guard';
import { env } from '../../../config/env';
import { startAddNumberFlow } from '../flows/addNumberFlow';

export const inventoryMenuCommand = async (bot: TelegramBot, chatId: number | string) => {
    await bot.sendMessage(chatId, "📦 *Inventory Management Menu*\n\nWelcome! Use the buttons below to manage the number inventory.", {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '➕ Add Number', callback_data: 'inventory_add_number' }],
                // Future buttons: [{ text: '📋 View All', callback_data: 'inventory_view_all' }]
            ]
        }
    });
};

export function registerInventoryMenu(router: CommandRouter) {
    const bot = router.bot;

    // Handle /start, START, start
    router.register(/^(?:\/start|start)$/i, Guard.registeredOnlyCommand(bot, async (msg) => {
        const chatId = msg.chat.id;

        // Check if we are in the inventory group (already handled by router if passed to register, 
        // but double check here for safety or if registered globally)
        if (msg.chat.id.toString() !== env.TG_GROUP_INVENTORY) {
            // If it's a private chat or different group, we might want to ignore or redirect
            // Let's assume for now it's only called in the correct group as per router registration
        }

        await inventoryMenuCommand(bot, chatId);
    }), [env.TG_GROUP_INVENTORY || '']);

    // Handle standard Get Started button
    router.registerCallback('inventory_start', Guard.registeredOnlyCallback(bot, async (query) => {
        const chatId = query.message!.chat.id;
        await inventoryMenuCommand(bot, chatId);
    }), [env.TG_GROUP_INVENTORY || '']);

    // Handle "Add Number" button click
    router.registerCallback('inventory_add_number', Guard.registeredOnlyCallback(bot, async (query) => {
        const chatId = query.message!.chat.id;
        await startAddNumberFlow(bot, chatId);
    }), [env.TG_GROUP_INVENTORY || '']);
}
