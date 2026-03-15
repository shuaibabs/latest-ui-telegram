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
exports.getDeletedNumbers = getDeletedNumbers;
exports.restoreNumber = restoreNumber;
exports.getDeletedNumberByMobile = getDeletedNumberByMobile;
const firebase_1 = require("../../config/firebase");
const firestore_1 = require("firebase-admin/firestore");
const logger_1 = require("../../core/logger/logger");
function getDeletedNumbers(employeeName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let query = firebase_1.db.collection('deletedNumbers');
            if (employeeName) {
                query = query.where("originalNumberData.assignedTo", "==", employeeName);
            }
            const snapshot = yield query.get();
            return snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        }
        catch (error) {
            logger_1.logger.error(`Error in getDeletedNumbers: ${error.message}`);
            throw error;
        }
    });
}
function restoreNumber(deletedNumberId, performedBy) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const docRef = firebase_1.db.collection('deletedNumbers').doc(deletedNumberId);
            const snapshot = yield docRef.get();
            if (!snapshot.exists)
                return false;
            const data = snapshot.data();
            const historyEvent = {
                id: Math.random().toString(36).substring(2, 11),
                action: 'Restored',
                description: `Number restored to inventory via Bot.`,
                timestamp: firestore_1.Timestamp.now(),
                performedBy
            };
            const restoredData = Object.assign(Object.assign({}, data.originalNumberData), { history: [...(data.originalNumberData.history || []), historyEvent] });
            const batch = firebase_1.db.batch();
            const numberDocRef = firebase_1.db.collection('numbers').doc(data.originalId);
            batch.set(numberDocRef, restoredData);
            batch.delete(docRef);
            yield batch.commit();
            return data.mobile;
        }
        catch (error) {
            logger_1.logger.error(`Error in restoreNumber: ${error.message}`);
            throw error;
        }
    });
}
function getDeletedNumberByMobile(mobile, employeeName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let query = firebase_1.db.collection('deletedNumbers').where("mobile", "==", mobile);
            if (employeeName) {
                query = query.where("originalNumberData.assignedTo", "==", employeeName);
            }
            const snapshot = yield query.get();
            if (snapshot.empty)
                return null;
            return Object.assign({ id: snapshot.docs[0].id }, snapshot.docs[0].data());
        }
        catch (error) {
            logger_1.logger.error(`Error in getDeletedNumberByMobile: ${error.message}`);
            throw error;
        }
    });
}
