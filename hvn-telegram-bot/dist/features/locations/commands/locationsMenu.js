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
exports.locationsMenuCommand = locationsMenuCommand;
exports.registerLocationsFeature = registerLocationsFeature;
const guard_1 = require("../../../core/auth/guard");
const env_1 = require("../../../config/env");
const listLocationsFlow_1 = require("../flows/listLocationsFlow");
const editLocationFlow_1 = require("../flows/editLocationFlow");
const detailsLocationFlow_1 = require("../flows/detailsLocationFlow");
function locationsMenuCommand(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        const opts = {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📍 List SIM Locations', callback_data: 'locations_list' }],
                    [{ text: '✏️ CheckIn / Edit Location', callback_data: 'locations_edit' }],
                    [{ text: '🔍 View Details', callback_data: 'locations_details' }]
                ]
            }
        };
        yield bot.sendMessage(chatId, "📍 *SIM Location Tracking*\n\nTrack and manage the current location of all SIMs.", opts);
    });
}
function registerLocationsFeature(router) {
    const bot = router.bot;
    // Command: /start or start in this group
    router.register(/^(?:\/start|start)$/i, (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield locationsMenuCommand(bot, msg.chat.id, (_a = msg.from) === null || _a === void 0 ? void 0 : _a.username);
    }), [env_1.env.TG_GROUP_SIM_LOCATIONS || '']);
    // Callbacks
    router.registerCallback('sim_locations_start', (query) => __awaiter(this, void 0, void 0, function* () {
        yield locationsMenuCommand(bot, query.message.chat.id, query.from.username);
    }), [env_1.env.TG_GROUP_SIM_LOCATIONS || '']);
    router.registerCallback('locations_list', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, listLocationsFlow_1.startListLocationsFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_SIM_LOCATIONS || '']);
    router.registerCallback('locations_edit', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, editLocationFlow_1.startEditLocationFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_SIM_LOCATIONS || '']);
    router.registerCallback('locations_details', guard_1.Guard.registeredOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield (0, detailsLocationFlow_1.startDetailsLocationFlow)(bot, query.message.chat.id, query.from.username);
    })), [env_1.env.TG_GROUP_SIM_LOCATIONS || '']);
}
