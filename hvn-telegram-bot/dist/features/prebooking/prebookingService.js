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
exports.cancelPrebooking = exports.getPrebookingDetails = exports.searchPrebookingNumbers = exports.getPrebookingNumbers = void 0;
const firebase_1 = require("../../config/firebase");
const firestore_1 = require("firebase-admin/firestore");
const logger_1 = require("../../core/logger/logger");
/**
 * Gets pre-booked numbers with optional employee filtering.
 */
const getPrebookingNumbers = (employeeName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let query = firebase_1.db.collection('prebookings');
        if (employeeName) {
            query = query.where('originalNumberData.assignedTo', '==', employeeName);
        }
        const snapshot = yield query.get();
        const results = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        return results.sort((a, b) => (b.srNo || 0) - (a.srNo || 0));
    }
    catch (error) {
        logger_1.logger.error(`Error in getPrebookingNumbers: ${error.message}`);
        throw error;
    }
});
exports.getPrebookingNumbers = getPrebookingNumbers;
/**
 * Advanced search for pre-booked numbers.
 */
const searchPrebookingNumbers = (criteria, employeeName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let query = firebase_1.db.collection('prebookings');
        if (employeeName) {
            query = query.where('originalNumberData.assignedTo', '==', employeeName);
        }
        const snapshot = yield query.get();
        let prebookings = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        const { startWith, endWith, anywhere, mustContain, notContain, onlyContain, total, sum } = criteria;
        return prebookings.filter((pb) => {
            const mobile = pb.mobile;
            if (startWith && !mobile.startsWith(startWith))
                return false;
            if (endWith && !mobile.endsWith(endWith))
                return false;
            if (anywhere && !mobile.includes(anywhere))
                return false;
            if (mustContain) {
                const digits = mustContain.split(',').map(d => d.trim()).filter(Boolean);
                if (!digits.every(d => mobile.includes(d)))
                    return false;
            }
            if (notContain) {
                const digits = notContain.split(',').map(d => d.trim()).filter(Boolean);
                if (digits.some(d => mobile.includes(d)))
                    return false;
            }
            if (onlyContain) {
                const allowed = new Set(onlyContain.split(''));
                if (!mobile.split('').every(d => allowed.has(d)))
                    return false;
            }
            if (total) {
                const simpleSum = mobile.split('').map(Number).reduce((a, b) => a + b, 0);
                if (simpleSum.toString() !== total)
                    return false;
            }
            if (sum && pb.sum.toString() !== sum)
                return false;
            return true;
        });
    }
    catch (error) {
        logger_1.logger.error(`Error in searchPrebookingNumbers: ${error.message}`);
        throw error;
    }
});
exports.searchPrebookingNumbers = searchPrebookingNumbers;
/**
 * Gets details for a specific pre-booked number.
 */
const getPrebookingDetails = (mobile, employeeName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let query = firebase_1.db.collection('prebookings').where('mobile', '==', mobile);
        if (employeeName) {
            query = query.where('originalNumberData.assignedTo', '==', employeeName);
        }
        const snapshot = yield query.limit(1).get();
        if (snapshot.empty)
            return null;
        return Object.assign({ id: snapshot.docs[0].id }, snapshot.docs[0].data());
    }
    catch (error) {
        logger_1.logger.error(`Error in getPrebookingDetails: ${error.message}`);
        throw error;
    }
});
exports.getPrebookingDetails = getPrebookingDetails;
/**
 * Cancels a pre-booking and moves the number back to inventory.
 */
const cancelPrebooking = (prebookingId, performedBy) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pbRef = firebase_1.db.collection('prebookings').doc(prebookingId);
        const pbDoc = yield pbRef.get();
        if (!pbDoc.exists)
            return false;
        const pbData = pbDoc.data();
        const now = firestore_1.Timestamp.now();
        // Prepare history cycle
        const historyEvent = {
            id: Math.random().toString(36).substring(2, 11),
            action: 'Pre-booking Cancelled',
            description: 'Pre-booking was cancelled.',
            timestamp: now,
            performedBy
        };
        const originalData = pbData.originalNumberData;
        const numberData = Object.assign(Object.assign({}, originalData), { history: [...(originalData.history || []), historyEvent] });
        const batch = firebase_1.db.batch();
        batch.set(firebase_1.db.collection('numbers').doc(), numberData);
        batch.delete(pbRef);
        // Add activity log
        const activityRef = firebase_1.db.collection('activities').doc();
        batch.set(activityRef, {
            employeeName: performedBy,
            action: 'Cancelled Pre-Booking',
            description: `Pre-booking for number ${pbData.mobile} cancelled.`,
            timestamp: firestore_1.FieldValue.serverTimestamp(),
            createdBy: 'BOT',
            source: 'BOT',
            groupName: 'PREBOOKING'
        });
        yield batch.commit();
        return true;
    }
    catch (error) {
        logger_1.logger.error(`Error in cancelPrebooking: ${error.message}`);
        throw error;
    }
});
exports.cancelPrebooking = cancelPrebooking;
