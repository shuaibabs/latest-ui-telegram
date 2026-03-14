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
exports.startSearchPostpaidFlow = startSearchPostpaidFlow;
exports.registerSearchPostpaidFlow = registerSearchPostpaidFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const logger_1 = require("../../../core/logger/logger");
const postpaidService_1 = require("../postpaidService");
const permissions_1 = require("../../../core/auth/permissions");
const SEARCH_STAGES = {
    SELECT_TYPE: 'SELECT_TYPE',
    ADV_SEARCH_MENU: 'ADV_SEARCH_MENU',
    AWAIT_CRITERIA_VAL: 'AWAIT_CRITERIA_VAL',
    AWAIT_MUST_CONTAINS: 'AWAIT_MUST_CONTAINS',
};
const cancelBtn = { text: '❌ Cancel', callback_data: 'postpaid_search_cancel' };
const criteriaLabels = {
    startWith: 'Start With',
    endWith: 'End With',
    anywhere: 'Anywhere',
    mustContain: 'Must Contain',
    notContain: 'Not Contain',
    onlyContain: 'Only Contain',
    total: 'Total (Sum)',
    sum: 'Sum (Digital Root)'
};
function startSearchPostpaidFlow(bot, chatId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        const isUserAdmin = yield (0, permissions_1.isAdmin)(username);
        const profile = yield (0, permissions_1.getUserProfile)(username);
        if (!isUserAdmin && !(profile === null || profile === void 0 ? void 0 : profile.displayName)) {
            yield bot.sendMessage(chatId, "❌ *Profile Incomplete*\n\nYour profile does not have a display name set in the system. Please contact an administrator.", { parse_mode: 'Markdown' });
            return;
        }
        (0, sessionManager_1.setSession)(chatId, 'searchPostpaid', {
            stage: 'SELECT_TYPE',
            criteria: {}
        });
        yield bot.sendMessage(chatId, "🔍 *Search Postpaid Records*\n\nChoose search type:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔍 Advanced Search', callback_data: 'postpaid_search_type_adv' }],
                    [{ text: '🔢 Must Contains (Digits Only)', callback_data: 'postpaid_search_type_must' }],
                    [cancelBtn]
                ]
            }
        });
    });
}
function getCriteriaMenu(criteria) {
    const rows = [];
    const keys = ['startWith', 'anywhere', 'endWith', 'mustContain', 'notContain', 'onlyContain', 'total', 'sum'];
    for (const key of keys) {
        const val = criteria[key] || 'Not Set';
        rows.push([{ text: `${criteriaLabels[key]}: ${val}`, callback_data: `postpaid_search_set_${key}` }]);
    }
    rows.push([{ text: '✅ Apply Search', callback_data: 'postpaid_search_apply' }]);
    rows.push([cancelBtn]);
    return { inline_keyboard: rows };
}
function registerSearchPostpaidFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'searchPostpaid');
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
            (0, sessionManager_1.setSession)(chatId, 'searchPostpaid', session);
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
            yield performSearch(bot, chatId, { mustContain: digits }, (_a = msg.from) === null || _a === void 0 ? void 0 : _a.username);
            (0, sessionManager_1.clearSession)(chatId, 'searchPostpaid');
        }
    }));
    router.registerCallback(/^postpaid_search_type_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'searchPostpaid');
        if (!session)
            return;
        const type = (_a = query.data) === null || _a === void 0 ? void 0 : _a.split('_').pop();
        if (type === 'adv') {
            session.stage = 'ADV_SEARCH_MENU';
            session.type = 'Advanced';
            (0, sessionManager_1.setSession)(chatId, 'searchPostpaid', session);
            yield bot.sendMessage(chatId, "*Advanced Postpaid Search*\nConfigure your filters:", {
                parse_mode: 'Markdown',
                reply_markup: getCriteriaMenu(session.criteria)
            });
        }
        else {
            session.stage = 'AWAIT_MUST_CONTAINS';
            session.type = 'MustContains';
            (0, sessionManager_1.setSession)(chatId, 'searchPostpaid', session);
            yield bot.sendMessage(chatId, "🔢 *Must Contain Digits*\n\nPlease enter the digits required.\n\n*Format:* Comma separated (e.g. `9,1,2`)", {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [[cancelBtn]] }
            });
        }
    }));
    router.registerCallback(/^postpaid_search_set_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'searchPostpaid');
        if (!session || session.stage !== 'ADV_SEARCH_MENU')
            return;
        const key = (_a = query.data) === null || _a === void 0 ? void 0 : _a.replace('postpaid_search_set_', '');
        session.currentSetting = key;
        session.stage = 'AWAIT_CRITERIA_VAL';
        (0, sessionManager_1.setSession)(chatId, 'searchPostpaid', session);
        yield bot.sendMessage(chatId, `Enter value for *${criteriaLabels[key]}*:\n(Type 'clear' to reset this field)`, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[cancelBtn]] }
        });
    }));
    router.registerCallback('postpaid_search_apply', (query) => __awaiter(this, void 0, void 0, function* () {
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'searchPostpaid');
        if (!session)
            return;
        yield performSearch(bot, chatId, session.criteria, query.from.username);
        (0, sessionManager_1.clearSession)(chatId, 'searchPostpaid');
    }));
    router.registerCallback('postpaid_search_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'searchPostpaid');
        yield bot.sendMessage(query.message.chat.id, "Search cancelled.");
    }));
}
function performSearch(bot, chatId, criteria, username) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const isUserAdmin = yield (0, permissions_1.isAdmin)(username);
            const profile = yield (0, permissions_1.getUserProfile)(username);
            if (!isUserAdmin && !(profile === null || profile === void 0 ? void 0 : profile.displayName)) {
                yield bot.sendMessage(chatId, "❌ *Profile Incomplete*\n\nYour profile does not have a display name set in the system. Please contact an administrator.", { parse_mode: 'Markdown' });
                return;
            }
            const employeeName = isUserAdmin ? undefined : profile === null || profile === void 0 ? void 0 : profile.displayName;
            const results = yield (0, postpaidService_1.searchPostpaidNumbers)(criteria, employeeName);
            if (results.length === 0) {
                yield bot.sendMessage(chatId, "🔍 No postpaid numbers found matching your criteria.");
            }
            else {
                const count = results.length;
                let text = `🔍 *Postpaid Search Results (${count})*\n`;
                text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
                const displayResults = results.slice(0, 15);
                displayResults.forEach((num, i) => {
                    text += `${i + 1}. \`${num.mobile}\` | ${num.status}\n`;
                    if (num.billDate)
                        text += `   └ Bill Date: ${num.billDate.toDate().toLocaleDateString()}\n`;
                });
                if (count > 15) {
                    text += `...and ${count - 15} more.`;
                }
                text += `\n━━━━━━━━━━━━━━━━━━━━`;
                yield bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
            }
        }
        catch (error) {
            logger_1.logger.error(`Error in performSearchPostpaid: ${error.message}`);
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
    });
}
