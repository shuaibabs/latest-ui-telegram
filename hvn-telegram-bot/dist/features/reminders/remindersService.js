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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReminderById = getReminderById;
exports.getNumberById = getNumberById;
exports.getPrebookingById = getPrebookingById;
exports.canMarkReminderDone = canMarkReminderDone;
exports.getPendingReminders = getPendingReminders;
exports.addReminder = addReminder;
exports.markReminderAsDone = markReminderAsDone;
const firebase_1 = require("../../config/firebase");
const logger_1 = require("../../core/logger/logger");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const date_fns_1 = require("date-fns");
function getReminderById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const doc = yield firebase_1.db.collection('reminders').doc(id).get();
            if (!doc.exists)
                return null;
            return Object.assign({ id: doc.id }, doc.data());
        }
        catch (error) {
            logger_1.logger.error(`Error in getReminderById: ${error.message}`);
            throw error;
        }
    });
}
function getNumberById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const doc = yield firebase_1.db.collection('numbers').doc(id).get();
            if (!doc.exists)
                return null;
            return doc.data();
        }
        catch (error) {
            logger_1.logger.error(`Error in getNumberById: ${error.message}`);
            throw error;
        }
    });
}
function getPrebookingById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const doc = yield firebase_1.db.collection('prebookings').doc(id).get();
            if (!doc.exists)
                return null;
            return doc.data();
        }
        catch (error) {
            logger_1.logger.error(`Error in getPrebookingById: ${error.message}`);
            throw error;
        }
    });
}
function canMarkReminderDone(reminder) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!reminder.taskId) {
            return { canBeDone: true, message: "" };
        }
        if (reminder.taskId.startsWith('cocp-safecustody-')) {
            const numberId = reminder.taskId.replace('cocp-safecustody-', '');
            const number = yield getNumberById(numberId);
            if (number && number.safeCustodyDate) {
                const custodyDate = number.safeCustodyDate.toDate();
                if ((0, date_fns_1.isToday)(custodyDate) || (0, date_fns_1.isPast)(custodyDate)) {
                    return {
                        canBeDone: false,
                        message: `The Safe Custody Date for ${number.mobile} has not been updated to a future date.`
                    };
                }
            }
        }
        else if (reminder.taskId.startsWith('prebooked-rtp-')) {
            const preBookingId = reminder.taskId.replace('prebooked-rtp-', '');
            const preBooking = yield getPrebookingById(preBookingId);
            if (preBooking) {
                return {
                    canBeDone: false,
                    message: `The Pre-Booked number ${preBooking.mobile} has not been marked as sold yet.`
                };
            }
        }
        return { canBeDone: true, message: "" };
    });
}
function getPendingReminders(assignedTo_1) {
    return __awaiter(this, arguments, void 0, function* (assignedTo, limit = 5, offset = 0) {
        try {
            let query = firebase_1.db.collection('reminders').where('status', '==', 'Pending');
            if (assignedTo) {
                query = query.where('assignedTo', 'array-contains', assignedTo);
            }
            const snapshot = yield query.get();
            const allPending = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
            // Sort in-memory to avoid composite index requirement
            allPending.sort((a, b) => {
                const timeA = a.dueDate instanceof firebase_admin_1.default.firestore.Timestamp ? a.dueDate.toMillis() : new Date(a.dueDate).getTime();
                const timeB = b.dueDate instanceof firebase_admin_1.default.firestore.Timestamp ? b.dueDate.toMillis() : new Date(b.dueDate).getTime();
                return timeA - timeB;
            });
            return {
                reminders: allPending.slice(offset, offset + limit),
                total: allPending.length
            };
        }
        catch (error) {
            logger_1.logger.error(`Error in getPendingReminders: ${error.message}`);
            throw error;
        }
    });
}
function addReminder(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const remindersRef = firebase_1.db.collection('reminders');
            const snapshot = yield remindersRef.orderBy('srNo', 'desc').limit(1).get();
            const lastSrNo = snapshot.empty ? 0 : snapshot.docs[0].data().srNo || 0;
            const dueDate = data.dueDate instanceof Date
                ? firebase_admin_1.default.firestore.Timestamp.fromDate(data.dueDate)
                : data.dueDate;
            const newReminder = Object.assign(Object.assign({}, data), { dueDate, srNo: lastSrNo + 1, status: 'Pending', createdAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp() });
            const docRef = yield remindersRef.add(newReminder);
            return Object.assign({ id: docRef.id }, newReminder);
        }
        catch (error) {
            logger_1.logger.error(`Error in addReminder: ${error.message}`);
            throw error;
        }
    });
}
function markReminderAsDone(id, note) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const docRef = firebase_1.db.collection('reminders').doc(id);
            const updateData = {
                status: 'Done',
                completionDate: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
            };
            if (note) {
                updateData.notes = note;
            }
            yield docRef.update(updateData);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error in markReminderAsDone: ${error.message}`);
            throw error;
        }
    });
}
