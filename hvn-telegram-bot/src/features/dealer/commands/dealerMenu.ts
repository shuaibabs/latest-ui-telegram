import TelegramBot from 'node-telegram-bot-api';
import { CommandRouter } from '../../../core/router/commandRouter';
import { Guard } from '../../../core/auth/guard';
import { env } from '../../../config/env';
import { startAddDealerFlow } from '../flows/addDealerFlow';
import { startDeleteDealerFlow } from '../flows/deleteDealerFlow';

export async function dealerMenuCommand(bot: TelegramBot, chatId: number, username?: string) {
    const opts: TelegramBot.SendMessageOptions = {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '➕ Add Dealer Numbers', callback_data: 'dealer_add' }],
                [{ text: '🗑️ Delete Dealer Purchase', callback_data: 'dealer_delete' }],
                [{ text: '🔄 Get Started', callback_data: 'start' }]
            ]
        }
    };

    await bot.sendMessage(chatId, "🤝 *Dealer Purchases*\n\nManage numbers purchased from dealers.", opts);
}

export function registerDealerFeature(router: CommandRouter) {
    const bot = router.bot;

    router.register(/^(?:\/start|start)$/i, async (msg) => {
        await dealerMenuCommand(bot, msg.chat.id, msg.from?.username);
    }, [env.TG_GROUP_DEALER_PURCHASES || '']);

    router.registerCallback('dealer_purchases_start', async (query) => {
        await dealerMenuCommand(bot, query.message!.chat.id, query.from.username);
    }, [env.TG_GROUP_DEALER_PURCHASES || '']);

    router.registerCallback('dealer_add', Guard.registeredOnlyCallback(bot, async (query) => {
        await startAddDealerFlow(bot, query.message!.chat.id, query.from.username);
    }), [env.TG_GROUP_DEALER_PURCHASES || '']);

    router.registerCallback('dealer_delete', Guard.registeredOnlyCallback(bot, async (query) => {
        await startDeleteDealerFlow(bot, query.message!.chat.id, query.from.username);
    }), [env.TG_GROUP_DEALER_PURCHASES || '']);
}
