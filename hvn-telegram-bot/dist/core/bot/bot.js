"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeBot = initializeBot;
exports.getBot = getBot;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const env_1 = require("../../config/env");
const logger_1 = require("../logger/logger");
const commandRouter_1 = require("../router/commandRouter");
const general_1 = require("../../commands/general");
const users_1 = require("../../features/users");
const activities_1 = require("../../features/activities");
const inventory_1 = require("../../features/inventory");
const sales_1 = require("../../features/sales");
const prebooking_1 = require("../../features/prebooking");
const partners_1 = require("../../features/partners");
const postpaid_1 = require("../../features/postpaid");
const cocp_1 = require("../../features/cocp");
const history_1 = require("../../features/history");
const locations_1 = require("../../features/locations");
const dealer_1 = require("../../features/dealer");
const deleted_1 = require("../../features/deleted");
let bot = null;
let commandRouter = null;
function initializeBot() {
    if (env_1.env.TELEGRAM_BOT_TOKEN) {
        bot = new node_telegram_bot_api_1.default(env_1.env.TELEGRAM_BOT_TOKEN, { polling: true });
        logger_1.logger.info("Bot has been initialized.");
        commandRouter = new commandRouter_1.CommandRouter(bot);
        // Register Features
        (0, general_1.registerGeneralCommands)(commandRouter);
        (0, users_1.registerUsersFeature)(commandRouter);
        (0, activities_1.registerActivitiesFeature)(commandRouter);
        (0, inventory_1.registerInventoryFeature)(commandRouter);
        (0, sales_1.registerSalesFeature)(commandRouter);
        (0, prebooking_1.registerPrebookingFeature)(commandRouter);
        (0, partners_1.registerPartnersFeature)(commandRouter);
        (0, postpaid_1.registerPostpaidFeature)(commandRouter);
        (0, cocp_1.registerCOCPFeature)(commandRouter);
        (0, history_1.registerHistoryFeature)(commandRouter);
        (0, locations_1.registerLocationsFeature)(commandRouter);
        (0, dealer_1.registerDealerFeature)(commandRouter);
        (0, deleted_1.registerDeletedFeature)(commandRouter);
        // Start listening for commands
        commandRouter.listen();
        // Generic error handling
        bot.on('polling_error', (error) => {
            logger_1.logger.error(`Polling error: ${error.message}`);
        });
        return bot;
    }
    else {
        logger_1.logger.error("Telegram bot token is not defined.");
        throw new Error("Telegram bot token is not defined.");
    }
}
function getBot() {
    if (!bot) {
        throw new Error("Bot is not initialized.");
    }
    return bot;
}
