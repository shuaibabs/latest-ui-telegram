import { initializeBot } from './core/bot/bot';
import { startServer } from './core/server/server';
import { logger } from './core/logger/logger';

async function main() {
    try {
        logger.info("Starting the Telegram bot...");
        const bot = initializeBot();
        logger.info("Bot is now running.");

        // Start the notification server
        logger.info("Starting the Telegram Server...");
        await startServer(bot);
        logger.info("Server is now running.");

    } catch (error: any) {
        logger.error("Failed to start the bot or server: " + error.message);
    }
}

main();
