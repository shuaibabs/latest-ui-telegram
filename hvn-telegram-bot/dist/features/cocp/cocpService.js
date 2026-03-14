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
exports.updateCOCPDetails = exports.getCOCPDetails = exports.searchCOCPNumbers = exports.getCOCPNumbers = void 0;
const firebase_1 = require("../../config/firebase");
const firestore_1 = require("firebase-admin/firestore");
const logger_1 = require("../../core/logger/logger");
/**
 * Gets numbers where numberType is 'COCP' with optional employee filtering.
 */
const getCOCPNumbers = (employeeName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let query = firebase_1.db.collection('numbers').where('numberType', '==', 'COCP');
        if (employeeName) {
            query = query.where('assignedTo', '==', employeeName);
        }
        const snapshot = yield query.get();
        const results = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        return results.sort((a, b) => (b.srNo || 0) - (a.srNo || 0));
    }
    catch (error) {
        logger_1.logger.error(`Error in getCOCPNumbers: ${error.message}`);
        throw error;
    }
});
exports.getCOCPNumbers = getCOCPNumbers;
/**
 * Advanced search for COCP numbers.
 */
const searchCOCPNumbers = (criteria, employeeName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let query = firebase_1.db.collection('numbers').where('numberType', '==', 'COCP');
        if (employeeName) {
            query = query.where('assignedTo', '==', employeeName);
        }
        const snapshot = yield query.get();
        let numbers = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        const { startWith, endWith, anywhere, mustContain, notContain, onlyContain, total, sum } = criteria;
        return numbers.filter((num) => {
            const mobile = num.mobile;
            if (startWith && !mobile.startsWith(startWith))
                return false;
            if (endWith && !mobile.endsWith(endWith))
                return false;
            if (anywhere && !mobile.includes(anywhere))
                return false;
            if (mustContain) {
                const digits = mustContain.split(',').map((d) => d.trim()).filter(Boolean);
                if (!digits.every((d) => mobile.includes(d)))
                    return false;
            }
            if (notContain) {
                const digits = notContain.split(',').map((d) => d.trim()).filter(Boolean);
                if (digits.some((d) => mobile.includes(d)))
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
            if (sum && num.sum.toString() !== sum)
                return false;
            return true;
        });
    }
    catch (error) {
        logger_1.logger.error(`Error in searchCOCPNumbers: ${error.message}`);
        throw error;
    }
});
exports.searchCOCPNumbers = searchCOCPNumbers;
/**
 * Gets details for a specific COCP number.
 */
const getCOCPDetails = (mobile, employeeName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let queryClient = firebase_1.db.collection('numbers')
            .where('mobile', '==', mobile)
            .where('numberType', '==', 'COCP');
        if (employeeName) {
            queryClient = queryClient.where('assignedTo', '==', employeeName);
        }
        const snapshot = yield queryClient.limit(1).get();
        if (snapshot.empty)
            return null;
        return Object.assign({ id: snapshot.docs[0].id }, snapshot.docs[0].data());
    }
    catch (error) {
        logger_1.logger.error(`Error in getCOCPDetails: ${error.message}`);
        throw error;
    }
});
exports.getCOCPDetails = getCOCPDetails;
/**
 * Updates COCP safe custody date.
 */
const updateCOCPDetails = (mobile, updates, performedBy) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const snapshot = yield firebase_1.db.collection('numbers')
            .where('mobile', '==', mobile)
            .where('numberType', '==', 'COCP')
            .limit(1)
            .get();
        if (snapshot.empty)
            return false;
        const doc = snapshot.docs[0];
        const oldData = doc.data();
        const now = firestore_1.Timestamp.now();
        const historyEvent = {
            id: Math.random().toString(36).substring(2, 11),
            action: 'COCP Details Updated',
            description: `Updated Safe Custody Date via BOT.`,
            timestamp: now,
            performedBy
        };
        const finalUpdates = Object.assign({}, updates);
        if (updates.safeCustodyDate) {
            finalUpdates.safeCustodyDate = firestore_1.Timestamp.fromDate(updates.safeCustodyDate);
        }
        yield doc.ref.update(Object.assign(Object.assign({}, finalUpdates), { history: [...(oldData.history || []), historyEvent] }));
        return true;
    }
    catch (error) {
        logger_1.logger.error(`Error in updateCOCPDetails: ${error.message}`);
        throw error;
    }
});
exports.updateCOCPDetails = updateCOCPDetails;
