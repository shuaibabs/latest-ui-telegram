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
exports.startAddNumberFlow = startAddNumberFlow;
exports.registerAddNumberFlow = registerAddNumberFlow;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const inventoryService_1 = require("../inventoryService");
const userService_1 = require("../../users/userService");
const activityService_1 = require("../../activities/activityService");
const ADD_NUMBER_STAGES = {
    AWAIT_NUMBERS: 'AWAIT_NUMBERS',
    AWAIT_TYPE: 'AWAIT_TYPE',
    AWAIT_POSTPAID_BILL_DATE: 'AWAIT_POSTPAID_BILL_DATE',
    AWAIT_POSTPAID_PD_BILL: 'AWAIT_POSTPAID_PD_BILL',
    AWAIT_COCP_ACCOUNT: 'AWAIT_COCP_ACCOUNT',
    AWAIT_COCP_SAFE_CUSTODY: 'AWAIT_COCP_SAFE_CUSTODY',
    AWAIT_PURCHASE_VENDOR: 'AWAIT_PURCHASE_VENDOR',
    AWAIT_PURCHASE_DATE: 'AWAIT_PURCHASE_DATE',
    AWAIT_PURCHASE_PRICE: 'AWAIT_PURCHASE_PRICE',
    AWAIT_SALE_PRICE: 'AWAIT_SALE_PRICE',
    AWAIT_OWNERSHIP: 'AWAIT_OWNERSHIP',
    AWAIT_PARTNER_NAME: 'AWAIT_PARTNER_NAME',
    AWAIT_RTP_STATUS: 'AWAIT_RTP_STATUS',
    AWAIT_RTP_DATE: 'AWAIT_RTP_DATE',
    AWAIT_UPLOAD_STATUS: 'AWAIT_UPLOAD_STATUS',
    AWAIT_CURRENT_LOCATION: 'AWAIT_CURRENT_LOCATION',
    AWAIT_LOCATION_TYPE: 'AWAIT_LOCATION_TYPE',
    AWAIT_ASSIGNMENT: 'AWAIT_ASSIGNMENT',
    CONFIRM: 'CONFIRM',
};
const cancelBtn = { text: '❌ Cancel', callback_data: 'add_num_cancel' };
function startAddNumberFlow(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.setSession)(chatId, 'addNumber', {
            stage: 'AWAIT_NUMBERS',
            data: {
                status: 'RTP', // default
                uploadStatus: 'Pending',
                locationType: 'Store',
                ownershipType: 'Individual',
                pdBill: 'No'
            }
        });
        yield bot.sendMessage(chatId, "🚀 *Add New Number(s)*\n\n*Step 1:* Please enter one or more 10-digit mobile numbers separated by comma or new line.", {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[cancelBtn]] }
        });
    });
}
// Handler functions for each stage...
function handleNumbersInput(bot, msg, session) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const text = (_a = msg.text) === null || _a === void 0 ? void 0 : _a.trim();
        if (!text)
            return;
        const numbers = text.split(/[\n,]+/).map(n => n.trim().replace(/\D/g, '')).filter(n => n.length === 10);
        if (numbers.length === 0) {
            yield bot.sendMessage(msg.chat.id, "❌ No valid 10-digit numbers found. Please try again.");
            return;
        }
        session.data.rawNumbers = numbers;
        session.stage = 'AWAIT_TYPE';
        (0, sessionManager_1.setSession)(msg.chat.id, 'addNumber', session);
        yield bot.sendMessage(msg.chat.id, `✅ Received ${numbers.length} number(s).\n\n*Step 2:* Select Number Type:`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Prepaid', callback_data: 'add_num_type_Prepaid' },
                        { text: 'Postpaid', callback_data: 'add_num_type_Postpaid' },
                        { text: 'COCP', callback_data: 'add_num_type_COCP' }
                    ],
                    [cancelBtn]
                ]
            }
        });
    });
}
function handleTypeSelection(bot, query, session) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const type = (_a = query.data) === null || _a === void 0 ? void 0 : _a.split('_').pop();
        session.data.numberType = type;
        if (type === 'Prepaid') {
            session.stage = 'AWAIT_PURCHASE_VENDOR';
            (0, sessionManager_1.setSession)(query.message.chat.id, 'addNumber', session);
            yield bot.sendMessage(query.message.chat.id, "*Step 4:* Enter Purchase From (Vendor Name):", {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [[cancelBtn]] }
            });
        }
        else if (type === 'Postpaid') {
            session.stage = 'AWAIT_POSTPAID_BILL_DATE';
            (0, sessionManager_1.setSession)(query.message.chat.id, 'addNumber', session);
            yield bot.sendMessage(query.message.chat.id, "*Step 3:* Enter Bill Date (YYYY-MM-DD):", {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [[cancelBtn]] }
            });
        }
        else if (type === 'COCP') {
            session.stage = 'AWAIT_COCP_ACCOUNT';
            (0, sessionManager_1.setSession)(query.message.chat.id, 'addNumber', session);
            yield bot.sendMessage(query.message.chat.id, "*Step 3:* Enter Account Name:", {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [[cancelBtn]] }
            });
        }
    });
}
// Helper for date parsing
const parseDate = (text) => {
    const d = new Date(text);
    return isNaN(d.getTime()) ? null : d;
};
// ... more handlers ...
// (I will implement the rest in the final file writing)
function registerAddNumberFlow(router) {
    const bot = router.bot;
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        const session = (0, sessionManager_1.getSession)(msg.chat.id, 'addNumber');
        if (!session || !msg.text || msg.text === '/cancel')
            return;
        switch (session.stage) {
            case 'AWAIT_NUMBERS':
                yield handleNumbersInput(bot, msg, session);
                break;
            case 'AWAIT_POSTPAID_BILL_DATE':
                const bDate = parseDate(msg.text);
                if (!bDate) {
                    yield bot.sendMessage(msg.chat.id, "❌ Invalid date format. Use YYYY-MM-DD.");
                    return;
                }
                session.data.billDate = bDate;
                session.stage = 'AWAIT_POSTPAID_PD_BILL';
                (0, sessionManager_1.setSession)(msg.chat.id, 'addNumber', session);
                yield bot.sendMessage(msg.chat.id, "Is this a PD Bill?", {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Yes', callback_data: 'add_num_pdbill_Yes' }, { text: 'No', callback_data: 'add_num_pdbill_No' }],
                            [cancelBtn]
                        ]
                    }
                });
                break;
            case 'AWAIT_COCP_ACCOUNT':
                session.data.accountName = msg.text.trim();
                session.stage = 'AWAIT_COCP_SAFE_CUSTODY';
                (0, sessionManager_1.setSession)(msg.chat.id, 'addNumber', session);
                yield bot.sendMessage(msg.chat.id, "Enter Safe Custody Date (YYYY-MM-DD):", {
                    reply_markup: { inline_keyboard: [[cancelBtn]] }
                });
                break;
            case 'AWAIT_COCP_SAFE_CUSTODY':
                const scDate = parseDate(msg.text);
                if (!scDate) {
                    yield bot.sendMessage(msg.chat.id, "❌ Invalid date format. Use YYYY-MM-DD.");
                    return;
                }
                session.data.safeCustodyDate = scDate;
                session.stage = 'AWAIT_PURCHASE_VENDOR';
                (0, sessionManager_1.setSession)(msg.chat.id, 'addNumber', session);
                yield bot.sendMessage(msg.chat.id, "*Step 4:* Enter Purchase From (Vendor Name):", {
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: [[cancelBtn]] }
                });
                break;
            case 'AWAIT_PURCHASE_VENDOR':
                session.data.purchaseFrom = msg.text.trim();
                session.stage = 'AWAIT_PURCHASE_DATE';
                (0, sessionManager_1.setSession)(msg.chat.id, 'addNumber', session);
                yield bot.sendMessage(msg.chat.id, "Enter Purchase Date (YYYY-MM-DD):", {
                    reply_markup: { inline_keyboard: [[cancelBtn]] }
                });
                break;
            case 'AWAIT_PURCHASE_DATE':
                const pDate = parseDate(msg.text);
                if (!pDate) {
                    yield bot.sendMessage(msg.chat.id, "❌ Invalid date format. Use YYYY-MM-DD.");
                    return;
                }
                session.data.purchaseDate = pDate;
                session.stage = 'AWAIT_PURCHASE_PRICE';
                (0, sessionManager_1.setSession)(msg.chat.id, 'addNumber', session);
                yield bot.sendMessage(msg.chat.id, "Enter Purchase Price (₹):", {
                    reply_markup: { inline_keyboard: [[cancelBtn]] }
                });
                break;
            case 'AWAIT_PURCHASE_PRICE':
                const pPrice = parseFloat(msg.text);
                if (isNaN(pPrice)) {
                    yield bot.sendMessage(msg.chat.id, "❌ Invalid price. Enter a number.");
                    return;
                }
                session.data.purchasePrice = pPrice;
                session.stage = 'AWAIT_SALE_PRICE';
                (0, sessionManager_1.setSession)(msg.chat.id, 'addNumber', session);
                yield bot.sendMessage(msg.chat.id, "Enter Intended Sale Price (₹) (or type 0 for none):", {
                    reply_markup: { inline_keyboard: [[cancelBtn]] }
                });
                break;
            case 'AWAIT_SALE_PRICE':
                const sPrice = parseFloat(msg.text);
                if (isNaN(sPrice)) {
                    yield bot.sendMessage(msg.chat.id, "❌ Invalid price. Enter a number.");
                    return;
                }
                session.data.salePrice = sPrice;
                session.stage = 'AWAIT_OWNERSHIP';
                (0, sessionManager_1.setSession)(msg.chat.id, 'addNumber', session);
                yield bot.sendMessage(msg.chat.id, "*Step 5:* Ownership Type:", {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Individual', callback_data: 'add_num_owner_Individual' }, { text: 'Partnership', callback_data: 'add_num_owner_Partnership' }],
                            [cancelBtn]
                        ]
                    }
                });
                break;
            case 'AWAIT_PARTNER_NAME':
                session.data.partnerName = msg.text.trim();
                session.stage = 'AWAIT_RTP_STATUS';
                (0, sessionManager_1.setSession)(msg.chat.id, 'addNumber', session);
                yield bot.sendMessage(msg.chat.id, "*Step 7:* RTP Status:", {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'RTP', callback_data: 'add_num_rtp_RTP' }, { text: 'Non-RTP', callback_data: 'add_num_rtp_Non-RTP' }],
                            [cancelBtn]
                        ]
                    }
                });
                break;
            case 'AWAIT_RTP_DATE':
                const rDate = parseDate(msg.text);
                if (!rDate) {
                    yield bot.sendMessage(msg.chat.id, "❌ Invalid date format. Use YYYY-MM-DD.");
                    return;
                }
                session.data.rtpDate = rDate;
                session.stage = 'AWAIT_UPLOAD_STATUS';
                (0, sessionManager_1.setSession)(msg.chat.id, 'addNumber', session);
                yield bot.sendMessage(msg.chat.id, "*Step 8:* Upload Status:", {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Pending', callback_data: 'add_num_upload_Pending' }, { text: 'Done', callback_data: 'add_num_upload_Done' }],
                            [cancelBtn]
                        ]
                    }
                });
                break;
            case 'AWAIT_CURRENT_LOCATION':
                session.data.currentLocation = msg.text.trim();
                session.stage = 'AWAIT_LOCATION_TYPE';
                (0, sessionManager_1.setSession)(msg.chat.id, 'addNumber', session);
                yield bot.sendMessage(msg.chat.id, "Select Location Type:", {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: 'Store', callback_data: 'add_num_loctype_Store' },
                                { text: 'Employee', callback_data: 'add_num_loctype_Employee' },
                                { text: 'Dealer', callback_data: 'add_num_loctype_Dealer' }
                            ],
                            [cancelBtn]
                        ]
                    }
                });
                break;
        }
    }));
    // Callback handlers...
    router.registerCallback(/^add_num_type_/, (query) => __awaiter(this, void 0, void 0, function* () {
        const session = (0, sessionManager_1.getSession)(query.message.chat.id, 'addNumber');
        if (!session || session.stage !== 'AWAIT_TYPE')
            return;
        yield handleTypeSelection(bot, query, session);
    }));
    router.registerCallback(/^add_num_pdbill_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const session = (0, sessionManager_1.getSession)(query.message.chat.id, 'addNumber');
        if (!session || session.stage !== 'AWAIT_POSTPAID_PD_BILL')
            return;
        session.data.pdBill = (_a = query.data) === null || _a === void 0 ? void 0 : _a.split('_').pop();
        session.stage = 'AWAIT_PURCHASE_VENDOR';
        (0, sessionManager_1.setSession)(query.message.chat.id, 'addNumber', session);
        yield bot.sendMessage(query.message.chat.id, "*Step 4:* Enter Purchase From (Vendor Name):", {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[cancelBtn]] }
        });
    }));
    router.registerCallback(/^add_num_owner_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const session = (0, sessionManager_1.getSession)(query.message.chat.id, 'addNumber');
        if (!session || session.stage !== 'AWAIT_OWNERSHIP')
            return;
        const owner = (_a = query.data) === null || _a === void 0 ? void 0 : _a.split('_').pop();
        session.data.ownershipType = owner;
        if (owner === 'Partnership') {
            session.stage = 'AWAIT_PARTNER_NAME';
            (0, sessionManager_1.setSession)(query.message.chat.id, 'addNumber', session);
            yield bot.sendMessage(query.message.chat.id, "*Step 6:* Enter Partner Name:", {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [[cancelBtn]] }
            });
        }
        else {
            session.stage = 'AWAIT_RTP_STATUS';
            (0, sessionManager_1.setSession)(query.message.chat.id, 'addNumber', session);
            yield bot.sendMessage(query.message.chat.id, "*Step 7:* RTP Status:", {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'RTP', callback_data: 'add_num_rtp_RTP' }, { text: 'Non-RTP', callback_data: 'add_num_rtp_Non-RTP' }],
                        [cancelBtn]
                    ]
                }
            });
        }
    }));
    router.registerCallback(/^add_num_rtp_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const session = (0, sessionManager_1.getSession)(query.message.chat.id, 'addNumber');
        if (!session || session.stage !== 'AWAIT_RTP_STATUS')
            return;
        const rtp = (_a = query.data) === null || _a === void 0 ? void 0 : _a.split('_').pop();
        session.data.status = rtp;
        if (rtp === 'Non-RTP') {
            session.stage = 'AWAIT_RTP_DATE';
            (0, sessionManager_1.setSession)(query.message.chat.id, 'addNumber', session);
            yield bot.sendMessage(query.message.chat.id, "*Step 8:* Enter Schedule RTP Date (YYYY-MM-DD):", {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [[cancelBtn]] }
            });
        }
        else {
            session.stage = 'AWAIT_UPLOAD_STATUS';
            (0, sessionManager_1.setSession)(query.message.chat.id, 'addNumber', session);
            yield bot.sendMessage(query.message.chat.id, "*Step 8:* Upload Status:", {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Pending', callback_data: 'add_num_upload_Pending' }, { text: 'Done', callback_data: 'add_num_upload_Done' }],
                        [cancelBtn]
                    ]
                }
            });
        }
    }));
    router.registerCallback(/^add_num_upload_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const session = (0, sessionManager_1.getSession)(query.message.chat.id, 'addNumber');
        if (!session || session.stage !== 'AWAIT_UPLOAD_STATUS')
            return;
        session.data.uploadStatus = (_a = query.data) === null || _a === void 0 ? void 0 : _a.split('_').pop();
        session.stage = 'AWAIT_CURRENT_LOCATION';
        (0, sessionManager_1.setSession)(query.message.chat.id, 'addNumber', session);
        yield bot.sendMessage(query.message.chat.id, "*Step 9:* Enter Current Location:", {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[cancelBtn]] }
        });
    }));
    router.registerCallback(/^add_num_loctype_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const session = (0, sessionManager_1.getSession)(query.message.chat.id, 'addNumber');
        if (!session || session.stage !== 'AWAIT_LOCATION_TYPE')
            return;
        session.data.locationType = (_a = query.data) === null || _a === void 0 ? void 0 : _a.split('_').pop();
        // Next Step: Assignment
        session.stage = 'AWAIT_ASSIGNMENT';
        (0, sessionManager_1.setSession)(query.message.chat.id, 'addNumber', session);
        const users = yield (0, userService_1.getAllUsers)();
        const userButtons = users.map(u => [{ text: u.displayName, callback_data: `add_num_assign_${u.uid}` }]);
        userButtons.push([{ text: '🔓 Unassigned', callback_data: 'add_num_assign_Unassigned' }]);
        userButtons.push([cancelBtn]);
        yield bot.sendMessage(query.message.chat.id, "*Step 10:* Assign To:", {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: userButtons }
        });
    }));
    router.registerCallback(/^add_num_assign_/, (query) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const session = (0, sessionManager_1.getSession)(query.message.chat.id, 'addNumber');
        if (!session || session.stage !== 'AWAIT_ASSIGNMENT')
            return;
        const assignValue = (_a = query.data) === null || _a === void 0 ? void 0 : _a.split('_').pop();
        if (assignValue === 'Unassigned') {
            session.data.assignedTo = 'Unassigned';
        }
        else {
            const users = yield (0, userService_1.getAllUsers)();
            const user = users.find(u => u.uid === assignValue);
            session.data.assignedTo = (user === null || user === void 0 ? void 0 : user.displayName) || 'Unassigned';
        }
        session.stage = 'CONFIRM';
        (0, sessionManager_1.setSession)(query.message.chat.id, 'addNumber', session);
        // Final Confirmation
        const d = session.data;
        const summary = `*Summary of New Number(s)*\n\n` +
            `📱 *Numbers:* ${(_b = d.rawNumbers) === null || _b === void 0 ? void 0 : _b.join(', ')}\n` +
            `📝 *Type:* ${d.numberType}\n` +
            (d.numberType === 'Postpaid' ? `📅 *Bill Date:* ${(_c = d.billDate) === null || _c === void 0 ? void 0 : _c.toLocaleDateString()}\n📊 *PD Bill:* ${d.pdBill}\n` : '') +
            (d.numberType === 'COCP' ? `🏢 *Account:* ${d.accountName}\n📅 *Custody Date:* ${(_d = d.safeCustodyDate) === null || _d === void 0 ? void 0 : _d.toLocaleDateString()}\n` : '') +
            `👤 *Ownership:* ${d.ownershipType}${d.ownershipType === 'Partnership' ? ` (Partner: ${d.partnerName})` : ''}\n` +
            `💰 *Purchase:* From ${d.purchaseFrom} on ${(_e = d.purchaseDate) === null || _e === void 0 ? void 0 : _e.toLocaleDateString()} for ₹${d.purchasePrice}\n` +
            `📈 *Intended Sale:* ₹${d.salePrice}\n` +
            `📍 *Status/Loc:* ${d.status} | ${d.uploadStatus} | ${d.currentLocation} (${d.locationType})\n` +
            `👷 *Assigned To:* ${d.assignedTo}\n\n` +
            `*Confirm to save?*`;
        yield bot.sendMessage(query.message.chat.id, summary, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '✅ Confirm & Save', callback_data: 'add_num_final_confirm' }],
                    [{ text: '🔄 Restart', callback_data: 'add_num_restart' }],
                    [cancelBtn]
                ]
            }
        });
    }));
    // Final Final Confirm
    router.registerCallback('add_num_final_confirm', (query) => __awaiter(this, void 0, void 0, function* () {
        const chatId = query.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'addNumber');
        if (!session || session.stage !== 'CONFIRM')
            return;
        try {
            const creator = query.from.first_name + (query.from.last_name ? ' ' + query.from.last_name : '');
            const result = yield (0, inventoryService_1.addInventoryNumbers)(session.data, session.data.rawNumbers, query.from.id.toString(), // Simplified check, should use UID from users collection if possible
            creator);
            let msg = `✅ *Success!*\n\n` +
                `🔹 Added: ${result.successCount}\n` +
                `🔹 Duplicates skipped: ${result.duplicateCount}`;
            yield bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
            // Log Activity
            yield (0, activityService_1.logActivity)(bot, {
                employeeName: creator,
                action: 'ADD_NUMBERS',
                description: `Added ${result.successCount} numbers to inventory:\n${session.data.rawNumbers.join(', ')}\n(Skipped ${result.duplicateCount} duplicates).`,
                createdBy: creator,
                source: 'BOT',
                groupName: 'INVENTORY'
            }, true);
            (0, sessionManager_1.clearSession)(chatId, 'addNumber');
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
            (0, sessionManager_1.clearSession)(chatId, 'addNumber');
        }
    }));
    router.registerCallback('add_num_cancel', (query) => __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.clearSession)(query.message.chat.id, 'addNumber');
        yield bot.sendMessage(query.message.chat.id, "❌ Registration flow cancelled.");
    }));
    router.registerCallback('add_num_restart', (query) => __awaiter(this, void 0, void 0, function* () {
        yield startAddNumberFlow(bot, query.message.chat.id);
    }));
}
