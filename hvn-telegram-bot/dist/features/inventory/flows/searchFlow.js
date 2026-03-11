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
exports.startSearchFlow = startSearchFlow;
exports.registerSearchFlow = registerSearchFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const logger_1 = require("../../../core/logger/logger");
const inventoryService_1 = require("../inventoryService");
const SEARCH_STAGES = {
    SELECT_TYPE: 'SELECT_TYPE',
    ADV_SEARCH_MENU: 'ADV_SEARCH_MENU',
    AWAIT_CRITERIA_VAL: 'AWAIT_CRITERIA_VAL',
    AWAIT_MUST_CONTAINS: 'AWAIT_MUST_CONTAINS',
};
const cancelBtn = { text: '❌ Cancel', callback_data: 'search_cancel' };
const criteriaLabels = {
    startWith: 'Start With',
    endWith: 'End With',
    anywhere: 'Anywhere',
    mustContain: 'Must Contain',
    notContain: 'Not Contain',
    onlyContain: 'Only Contain',
    total: 'Total (Sum)',
    sum: 'Sum (Digital Root)',
    maxContain: 'Max Contain',
    ownershipType: 'Ownership'
};
function startSearchFlow(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.setSession)(chatId, 'searchNumbers', {
            stage: 'SELECT_TYPE',
            criteria: {}
        });
        yield bot.sendMessage(chatId, "🔍 *Search Inventory*\n\nChoose search type:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔍 Advanced Search', callback_data: 'search_type_adv' }],
                    [{ text: '🔢 Must Contains (Digits Only)', callback_data: 'search_type_must' }],
                    [cancelBtn]
                ]
            }
        });
    });
}
function getCriteriaMenu(criteria) {
    const rows = [];
    const keys = ['startWith', 'anywhere', 'endWith', 'mustContain', 'notContain', 'onlyContain', 'total', 'sum', 'maxContain', 'ownershipType'];
    for (const key of keys) {
        const val = criteria[key] || 'Not Set';
        rows.push([{ text: `${criteriaLabels[key]}: ${val}`, callback_data: `search_set_${key}` }]);
    }
    rows.push([{ text: '✅ Apply Search', callback_data: 'search_apply' }]);
    rows.push([cancelBtn]);
    return { inline_keyboard: rows };
}
function registerSearchFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'searchNumbers');
        if (!session || !msg.text || msg.text.startsWith('/'))
            return;
        const chatId = msg.chat.id;
        if (session.stage === 'AWAIT_CRITERIA_VAL' && session.currentSetting) {
            const val = msg.text.trim();
            if (val.toLowerCase() === 'clear') {
                delete session.criteria[session.currentSetting];
            }
            else {
                session.criteria[session.currentSetting] = val;
            }
            session.stage = 'ADV_SEARCH_MENU';
            delete session.currentSetting;
            (0, sessionManager_1.setSession)(chatId, 'searchNumbers', session);
            yield bot.sendMessage(chatId, "✅ Updated search criteria.", {
                reply_markup: getCriteriaMenu(session.criteria)
            });
        }
        else if (session.stage === 'AWAIT_MUST_CONTAINS') {
            const digits = msg.text.replace(/\s/g, '');
            if (!/^\d+(,\d+)*$/.test(digits)) {
                yield bot.sendMessage(chatId, "❌ Invalid format. Please enter digits separated by comma (e.g. 9,1,5).");
                return;
            }
            yield performSearch(bot, chatId, { onlyContain: digits.replace(/,/g, '') });
            (0, sessionManager_1.clearSession)(chatId, 'searchNumbers');
        }
    }));
    router.registerCallback(/^search_type_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'searchNumbers');
        if (!session)
            return;
        const type = (_a = query.data) === null || _a === void 0 ? void 0 : _a.split('_').pop();
        if (type === 'adv') {
            session.stage = 'ADV_SEARCH_MENU';
            session.type = 'Advanced';
            (0, sessionManager_1.setSession)(chatId, 'searchNumbers', session);
            yield bot.sendMessage(chatId, "*Advanced Search*\nConfigure your filters:", {
                parse_mode: 'Markdown',
                reply_markup: getCriteriaMenu(session.criteria)
            });
        }
        else {
            session.stage = 'AWAIT_MUST_CONTAINS';
            session.type = 'MustContains';
            (0, sessionManager_1.setSession)(chatId, 'searchNumbers', session);
            yield bot.sendMessage(chatId, "🔢 *Must Only Contain Digits*\n\nPlease enter the digits allowed. The search will find numbers that consist *entirely* of combinations of these digits.\n\n*Format:* Comma separated (e.g. `9,1,2`)", {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [[cancelBtn]] }
            });
        }
    }));
    router.registerCallback(/^search_set_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'searchNumbers');
        if (!session || session.stage !== 'ADV_SEARCH_MENU')
            return;
        const key = (_a = query.data) === null || _a === void 0 ? void 0 : _a.replace('search_set_', '');
        session.currentSetting = key;
        session.stage = 'AWAIT_CRITERIA_VAL';
        (0, sessionManager_1.setSession)(chatId, 'searchNumbers', session);
        if (key === 'ownershipType') {
            yield bot.sendMessage(chatId, "Select Ownership Type:", {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Individual', callback_data: 'search_val_owner_Individual' }],
                        [{ text: 'Partnership', callback_data: 'search_val_owner_Partnership' }],
                        [{ text: 'Reset', callback_data: 'search_val_owner_all' }],
                        [cancelBtn]
                    ]
                }
            });
        }
        else {
            yield bot.sendMessage(chatId, `Enter value for *${criteriaLabels[key]}*:\n(Type 'clear' to reset this field)`, {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [[cancelBtn]] }
            });
        }
    }));
    router.registerCallback(/^search_val_owner_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'searchNumbers');
        if (!session || session.currentSetting !== 'ownershipType')
            return;
        const val = (_a = query.data) === null || _a === void 0 ? void 0 : _a.split('_').pop();
        if (val === 'all')
            delete session.criteria.ownershipType;
        else
            session.criteria.ownershipType = val;
        session.stage = 'ADV_SEARCH_MENU';
        delete session.currentSetting;
        (0, sessionManager_1.setSession)(chatId, 'searchNumbers', session);
        yield bot.sendMessage(chatId, "✅ Updated ownership filter.", {
            reply_markup: getCriteriaMenu(session.criteria)
        });
    }));
    router.registerCallback('search_apply', (query) => __awaiter(this, void 0, void 0, function* () {
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'searchNumbers');
        if (!session)
            return;
        yield performSearch(bot, chatId, session.criteria);
        (0, sessionManager_1.clearSession)(chatId, 'searchNumbers');
    }));
    router.registerCallback('search_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'searchNumbers');
        yield bot.sendMessage(query.message.chat.id, "Search cancelled.");
    }));
}
function performSearch(bot, chatId, criteria) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const results = yield (0, inventoryService_1.advancedSearchNumbers)(criteria);
            if (results.length === 0) {
                yield bot.sendMessage(chatId, "🔍 No numbers found matching your criteria.");
            }
            else {
                const count = results.length;
                // Generate criteria summary
                const activeCriteria = Object.entries(criteria)
                    .filter(([_, v]) => v)
                    .map(([k, v]) => `${criteriaLabels[k] || k}: ${v}`)
                    .join(' | ');
                let text = `🔍 *Search Results (${count})*\n`;
                if (activeCriteria)
                    text += `🎯 *Filters:* \`${activeCriteria}\`\n`;
                text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
                // Limit to top 15 for message size constraints (more details per item now)
                const displayResults = results.slice(0, 15);
                displayResults.forEach((num, i) => {
                    text += `${i + 1}. \`${num.mobile}\`\n`;
                    text += `   ├ Status: *${num.status}*\n`;
                    text += `   ├ Type: ${num.numberType}\n`;
                    text += `   ├ Sale: ₹${num.salePrice} | Pur: ₹${num.purchasePrice}\n`;
                    text += `   └ Sum: ${num.sum} | Loc: ${num.currentLocation || 'N/A'}\n\n`;
                });
                if (count > 15) {
                    text += `...and ${count - 15} more. Use more specific filters to narrow down.`;
                }
                text += `\n━━━━━━━━━━━━━━━━━━━━`;
                yield bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
            }
        }
        catch (error) {
            logger_1.logger.error(`Error in search: ${error.message}`);
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
    });
}
