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
exports.startListLocationsFlow = startListLocationsFlow;
exports.registerListLocationsFlow = registerListLocationsFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const locationsService_1 = require("../locationsService");
const permissions_1 = require("../../../core/auth/permissions");
const logger_1 = require("../../../core/logger/logger");
function startListLocationsFlow(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        const isUserAdmin = yield (0, permissions_1.isAdmin)(username);
        const profile = yield (0, permissions_1.getUserProfile)(username);
        if (!isUserAdmin && !(profile === null || profile === void 0 ? void 0 : profile.displayName)) {
            yield bot.sendMessage(chatId, "❌ *Profile Incomplete*\n\nYour profile does not have a display name set in the system.", { parse_mode: 'Markdown' });
            return;
        }
        (0, sessionManager_1.setSession)(chatId, 'listLocations', { stage: 'SELECT_TYPE', filters: {} });
        yield bot.sendMessage(chatId, "📍 *List SIM Locations*\n\nSelect Location Type Filter:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🏬 Store', callback_data: 'loc_type_Store' }, { text: '👥 Employee', callback_data: 'loc_type_Employee' }],
                    [{ text: '🤝 Dealer', callback_data: 'loc_type_Dealer' }, { text: '🌐 All Types', callback_data: 'loc_type_all' }],
                    [{ text: '❌ Cancel', callback_data: 'loc_list_cancel' }]
                ]
            }
        });
    });
}
function registerListLocationsFlow(router) {
    const bot = router.bot;
    router.registerCallback(/^loc_type_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'listLocations');
        if (!session)
            return;
        const type = (_a = query.data) === null || _a === void 0 ? void 0 : _a.replace('loc_type_', '');
        session.filters.type = type;
        session.stage = 'SELECT_LOCATION';
        (0, sessionManager_1.setSession)(chatId, 'listLocations', session);
        const employeeName = (yield (0, permissions_1.isAdmin)(query.from.username)) ? undefined : (_b = (yield (0, permissions_1.getUserProfile)(query.from.username))) === null || _b === void 0 ? void 0 : _b.displayName;
        const locations = yield (0, locationsService_1.getAllUniqueLocations)(employeeName);
        if (locations.length === 0) {
            yield bot.sendMessage(chatId, "⚠️ No locations found. Listing all numbers for chosen type...");
            yield performList(bot, chatId, session.filters, query.from.username);
            (0, sessionManager_1.clearSession)(chatId, 'listLocations');
            return;
        }
        const buttons = locations.map(loc => ([{ text: String(loc), callback_data: `loc_val_${loc}` }]));
        buttons.push([{ text: '🌐 All Locations', callback_data: 'loc_val_all' }]);
        buttons.push([{ text: '❌ Cancel', callback_data: 'loc_list_cancel' }]);
        yield bot.sendMessage(chatId, "📍 *Select Current Location:*", {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons }
        });
    }));
    router.registerCallback(/^loc_val_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'listLocations');
        if (!session)
            return;
        const location = (_a = query.data) === null || _a === void 0 ? void 0 : _a.replace('loc_val_', '');
        session.filters.location = location;
        yield performList(bot, chatId, session.filters, query.from.username);
        (0, sessionManager_1.clearSession)(chatId, 'listLocations');
    }));
    router.registerCallback('loc_list_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'listLocations');
        yield bot.sendMessage(query.message.chat.id, "Operation cancelled.");
    }));
}
function performList(bot, chatId, filters, username) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const isUserAdmin = yield (0, permissions_1.isAdmin)(username);
            const profile = yield (0, permissions_1.getUserProfile)(username);
            const employeeName = isUserAdmin ? undefined : profile === null || profile === void 0 ? void 0 : profile.displayName;
            const results = yield (0, locationsService_1.getFilteredLocations)(filters, employeeName);
            if (results.length === 0) {
                yield bot.sendMessage(chatId, "🔍 No SIMs found matching your filters.");
            }
            else {
                const count = results.length;
                let text = `📍 *SIM Locations (${count})*\n`;
                text += `Type: ${filters.type === 'all' ? 'All' : filters.type} | Location: ${filters.location === 'all' ? 'All' : filters.location}\n`;
                text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
                results.slice(0, 15).forEach((num, i) => {
                    text += `${i + 1}. \`${num.mobile}\` | ${num.currentLocation} (${num.locationType})\n`;
                });
                if (count > 15)
                    text += `\n...and ${count - 15} more.`;
                text += `\n━━━━━━━━━━━━━━━━━━━━`;
                yield bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
            }
        }
        catch (error) {
            logger_1.logger.error(`Error in performListLocations: ${error.message}`);
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
    });
}
