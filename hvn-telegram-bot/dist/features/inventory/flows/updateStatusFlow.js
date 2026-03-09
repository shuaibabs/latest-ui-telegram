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
exports.startUpdateStatusFlow = startUpdateStatusFlow;
exports.registerUpdateStatusFlow = registerUpdateStatusFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const inventoryService_1 = require("../inventoryService");
const activityService_1 = require("../../activities/activityService");
const UPDATE_STATUS_STAGES = {
    AWAIT_UPDATE_TYPE: 'AWAIT_UPDATE_TYPE',
    AWAIT_NUMBERS: 'AWAIT_NUMBERS',
    AWAIT_RTP_STATUS: 'AWAIT_RTP_STATUS',
    AWAIT_RTP_DATE: 'AWAIT_RTP_DATE',
    AWAIT_UPLOAD_STATUS: 'AWAIT_UPLOAD_STATUS',
    AWAIT_LOCATION_TYPE: 'AWAIT_LOCATION_TYPE',
    AWAIT_NEW_LOCATION: 'AWAIT_NEW_LOCATION',
    AWAIT_SALE_PRICE: 'AWAIT_SALE_PRICE',
    CONFIRM: 'CONFIRM',
};
const cancelBtn = { text: '❌ Cancel', callback_data: 'update_status_cancel' };
function startUpdateStatusFlow(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.setSession)(chatId, 'updateStatus', {
            stage: 'AWAIT_UPDATE_TYPE',
            data: {
                numbers: [],
                updates: {}
            }
        });
        yield bot.sendMessage(chatId, "🔄 *Update Number(s) Status*\n\n*Step 1:* What would you like to update?", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Update RTP status', callback_data: 'upd_stat_type_RTP' }],
                    [{ text: 'Edit Upload status', callback_data: 'upd_stat_type_Upload' }],
                    [{ text: 'Edit Location', callback_data: 'upd_stat_type_Location' }],
                    [{ text: 'Update Sale Price', callback_data: 'upd_stat_type_SalePrice' }],
                    [cancelBtn]
                ]
            }
        });
    });
}
const parseDate = (text) => {
    const d = new Date(text);
    return isNaN(d.getTime()) ? null : d;
};
function registerUpdateStatusFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'updateStatus');
        if (!session || !msg.text || msg.text.startsWith('/'))
            return;
        const chatId = msg.chat.id;
        switch (session.stage) {
            case 'AWAIT_NUMBERS': {
                const numbers = msg.text.split(/[\n,]+/).map(n => n.trim().replace(/\D/g, '')).filter(n => n.length === 10);
                if (numbers.length === 0) {
                    yield bot.sendMessage(chatId, "❌ No valid 10-digit numbers found. Please try again.");
                    return;
                }
                // Validate existence
                const { existing, missing } = yield (0, inventoryService_1.validateNumbersExistence)(numbers);
                if (existing.length === 0) {
                    yield bot.sendMessage(chatId, `❌ None of the provided numbers exist in the inventory.\n\n*Rejected:* ${missing.join(', ')}`, { parse_mode: 'Markdown' });
                    (0, sessionManager_1.clearSession)(chatId, 'updateStatus');
                    return;
                }
                session.data.numbers = existing;
                let statusMsg = `✅ Found ${existing.length} number(s).`;
                if (missing.length > 0) {
                    statusMsg += `\n⚠️ Rejected (not found): ${missing.length}`;
                }
                yield bot.sendMessage(chatId, statusMsg, { parse_mode: 'Markdown' });
                // Go to next sub-stage based on updateType
                if (session.data.updateType === 'RTP') {
                    session.stage = 'AWAIT_RTP_STATUS';
                    (0, sessionManager_1.setSession)(chatId, 'updateStatus', session);
                    yield bot.sendMessage(chatId, "*Update RTP status:* Select new status:", {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: 'RTP', callback_data: 'upd_stat_rtp_RTP' }, { text: 'Non-RTP', callback_data: 'upd_stat_rtp_Non-RTP' }],
                                [cancelBtn]
                            ]
                        }
                    });
                }
                else if (session.data.updateType === 'Upload') {
                    session.stage = 'AWAIT_UPLOAD_STATUS';
                    (0, sessionManager_1.setSession)(chatId, 'updateStatus', session);
                    yield bot.sendMessage(chatId, "*Edit Upload status:* Select new status:", {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: 'Pending', callback_data: 'upd_stat_upload_Pending' }, { text: 'Done', callback_data: 'upd_stat_upload_Done' }],
                                [cancelBtn]
                            ]
                        }
                    });
                }
                else if (session.data.updateType === 'Location') {
                    session.stage = 'AWAIT_LOCATION_TYPE';
                    (0, sessionManager_1.setSession)(chatId, 'updateStatus', session);
                    yield bot.sendMessage(chatId, "*Edit Location:* Select location type:", {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: 'Store', callback_data: 'upd_stat_loc_Store' },
                                    { text: 'Employee', callback_data: 'upd_stat_loc_Employee' },
                                    { text: 'Dealer', callback_data: 'upd_stat_loc_Dealer' }
                                ],
                                [cancelBtn]
                            ]
                        }
                    });
                }
                else if (session.data.updateType === 'SalePrice') {
                    session.stage = 'AWAIT_SALE_PRICE';
                    (0, sessionManager_1.setSession)(chatId, 'updateStatus', session);
                    yield bot.sendMessage(chatId, "*Update Sale Price:* Please enter the new sale price:", {
                        parse_mode: 'Markdown',
                        reply_markup: { inline_keyboard: [[cancelBtn]] }
                    });
                }
                break;
            }
            case 'AWAIT_RTP_DATE': {
                const rDate = parseDate(msg.text);
                if (!rDate) {
                    yield bot.sendMessage(chatId, "❌ Invalid date format. Use YYYY-MM-DD.");
                    return;
                }
                session.data.updates.rtpDate = rDate;
                session.stage = 'CONFIRM';
                (0, sessionManager_1.setSession)(chatId, 'updateStatus', session);
                yield showConfirmation(bot, chatId, session);
                break;
            }
            case 'AWAIT_NEW_LOCATION': {
                session.data.updates.currentLocation = msg.text.trim();
                session.stage = 'CONFIRM';
                (0, sessionManager_1.setSession)(chatId, 'updateStatus', session);
                yield showConfirmation(bot, chatId, session);
                break;
            }
            case 'AWAIT_SALE_PRICE': {
                const price = parseFloat(msg.text.trim());
                if (isNaN(price) || price < 0) {
                    yield bot.sendMessage(chatId, "❌ Invalid price. Please enter a positive number.");
                    return;
                }
                session.data.updates.salePrice = price;
                session.stage = 'CONFIRM';
                (0, sessionManager_1.setSession)(chatId, 'updateStatus', session);
                yield showConfirmation(bot, chatId, session);
                break;
            }
        }
    }));
    router.registerCallback(/^upd_stat_type_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'updateStatus');
        if (!session || session.stage !== 'AWAIT_UPDATE_TYPE')
            return;
        const type = (_a = query.data) === null || _a === void 0 ? void 0 : _a.split('_').pop();
        session.data.updateType = type;
        session.stage = 'AWAIT_NUMBERS';
        (0, sessionManager_1.setSession)(chatId, 'updateStatus', session);
        const typeLabels = {
            'RTP': 'RTP Status',
            'Upload': 'Upload Status',
            'Location': 'Location',
            'SalePrice': 'Sale Price'
        };
        yield bot.sendMessage(chatId, `🔄 Selected: *${typeLabels[type]} Update*\n\n*Step 2:* Please enter one or more 10-digit mobile numbers separated by comma or new line.`, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[cancelBtn]] }
        });
    }));
    router.registerCallback(/^upd_stat_rtp_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'updateStatus');
        if (!session || session.stage !== 'AWAIT_RTP_STATUS')
            return;
        const val = (_a = query.data) === null || _a === void 0 ? void 0 : _a.split('_').pop();
        session.data.updates.status = val;
        if (val === 'Non-RTP') {
            session.stage = 'AWAIT_RTP_DATE';
            (0, sessionManager_1.setSession)(chatId, 'updateStatus', session);
            yield bot.sendMessage(chatId, "Please enter RTP Date (YYYY-MM-DD):", {
                reply_markup: { inline_keyboard: [[cancelBtn]] }
            });
        }
        else {
            session.stage = 'CONFIRM';
            (0, sessionManager_1.setSession)(chatId, 'updateStatus', session);
            yield showConfirmation(bot, chatId, session);
        }
    }));
    router.registerCallback(/^upd_stat_upload_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'updateStatus');
        if (!session || session.stage !== 'AWAIT_UPLOAD_STATUS')
            return;
        session.data.updates.uploadStatus = (_a = query.data) === null || _a === void 0 ? void 0 : _a.split('_').pop();
        session.stage = 'CONFIRM';
        (0, sessionManager_1.setSession)(chatId, 'updateStatus', session);
        yield showConfirmation(bot, chatId, session);
    }));
    router.registerCallback(/^upd_stat_loc_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'updateStatus');
        if (!session || session.stage !== 'AWAIT_LOCATION_TYPE')
            return;
        session.data.updates.locationType = (_a = query.data) === null || _a === void 0 ? void 0 : _a.split('_').pop();
        session.stage = 'AWAIT_NEW_LOCATION';
        (0, sessionManager_1.setSession)(chatId, 'updateStatus', session);
        yield bot.sendMessage(chatId, "Please enter the New Current Location:", {
            reply_markup: { inline_keyboard: [[cancelBtn]] }
        });
    }));
    router.registerCallback('upd_stat_confirm', (query) => __awaiter(this, void 0, void 0, function* () {
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'updateStatus');
        if (!session || session.stage !== 'CONFIRM')
            return;
        try {
            const creator = query.from.first_name + (query.from.last_name ? ' ' + query.from.last_name : '');
            const result = yield (0, inventoryService_1.updateNumbersStatusBatch)(session.data.numbers, session.data.updates, creator);
            yield bot.sendMessage(chatId, `✅ *Update Successful!*\n\nSuccessfully updated ${result.successCount} number(s).`, { parse_mode: 'Markdown' });
            // Log Activity
            yield (0, activityService_1.logActivity)(bot, {
                employeeName: creator,
                action: 'UPDATE_INVENTORY',
                description: `Updated properties for ${result.successCount} numbers:\n${session.data.numbers.join(', ')}\nChanges: ${JSON.stringify(session.data.updates)}`,
                createdBy: creator,
                source: 'BOT',
                groupName: 'INVENTORY'
            }, true);
            (0, sessionManager_1.clearSession)(chatId, 'updateStatus');
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
            (0, sessionManager_1.clearSession)(chatId, 'updateStatus');
        }
    }));
    router.registerCallback('update_status_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'updateStatus');
        yield bot.sendMessage(query.message.chat.id, "❌ Status update flow cancelled.");
    }));
}
function showConfirmation(bot, chatId, session) {
    return __awaiter(this, void 0, void 0, function* () {
        const updates = session.data.updates;
        let updateSummary = "";
        if (updates.status)
            updateSummary += `🔹 RTP Status: ${updates.status}\n`;
        if (updates.rtpDate)
            updateSummary += `🔹 RTP Date: ${updates.rtpDate.toLocaleDateString()}\n`;
        if (updates.uploadStatus)
            updateSummary += `🔹 Upload Status: ${updates.uploadStatus}\n`;
        if (updates.locationType)
            updateSummary += `🔹 Location Type: ${updates.locationType}\n`;
        if (updates.currentLocation)
            updateSummary += `🔹 Current Location: ${updates.currentLocation}\n`;
        if (updates.salePrice !== undefined)
            updateSummary += `🔹 Sale Price: ₹${updates.salePrice}\n`;
        const summary = `*Confirm Updates*\n\n` +
            `📱 *Numbers:* ${session.data.numbers.join(', ')}\n\n` +
            `*Changes:*\n${updateSummary}\n` +
            `*Apply these changes?*`;
        yield bot.sendMessage(chatId, summary, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '✅ Confirm & Update', callback_data: 'upd_stat_confirm' }],
                    [cancelBtn]
                ]
            }
        });
    });
}
