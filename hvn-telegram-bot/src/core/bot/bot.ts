
import TelegramBot from 'node-telegram-bot-api';
import { env } from '../../config/env';
import { logger } from '../logger/logger';
import { CommandRouter } from '../router/commandRouter';
import { registerGeneralCommands } from '../../commands/general';
import { registerUsersFeature } from '../../features/users';
import { registerActivitiesFeature } from '../../features/activities';
import { registerInventoryFeature } from '../../features/inventory';

let bot: TelegramBot | null = null;
let commandRouter: CommandRouter | null = null;

export function initializeBot(): TelegramBot {
    if (env.TELEGRAM_BOT_TOKEN) {
        bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: true });
        logger.info("Bot has been initialized.");

        commandRouter = new CommandRouter(bot);

        // Register Features
        registerGeneralCommands(commandRouter);
        registerUsersFeature(commandRouter);
        registerActivitiesFeature(commandRouter);
        registerInventoryFeature(commandRouter);

        // Start listening for commands
        commandRouter.listen();

        // Generic error handling
        bot.on('polling_error', (error) => {
            logger.error(`Polling error: ${error.message}`);
        });

        return bot;

    } else {
        logger.error("Telegram bot token is not defined.");
        throw new Error("Telegram bot token is not defined.");
    }
}

export function getBot() {
    if (!bot) {
        throw new Error("Bot is not initialized.");
    }
    return bot;
}
