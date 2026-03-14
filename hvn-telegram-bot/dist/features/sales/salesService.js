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
exports.getVendorSalesStats = exports.getSalesVendors = exports.cancelSale = exports.getSaleDetails = exports.searchSalesNumbers = exports.getSalesNumbers = void 0;
const firebase_1 = require("../../config/firebase");
const firestore_1 = require("firebase-admin/firestore");
const logger_1 = require("../../core/logger/logger");
/**
 * Gets sales numbers with optional employee filtering.
 */
const getSalesNumbers = (employeeName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let query = firebase_1.db.collection('sales');
        if (employeeName) {
            query = query.where('originalNumberData.assignedTo', '==', employeeName);
        }
        const snapshot = yield query.get();
        const results = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        return results.sort((a, b) => (b.srNo || 0) - (a.srNo || 0));
    }
    catch (error) {
        logger_1.logger.error(`Error in getSalesNumbers: ${error.message}`);
        throw error;
    }
});
exports.getSalesNumbers = getSalesNumbers;
/**
 * Advanced search for sales numbers.
 */
const searchSalesNumbers = (criteria, employeeName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let query = firebase_1.db.collection('sales');
        if (employeeName) {
            query = query.where('originalNumberData.assignedTo', '==', employeeName);
        }
        const snapshot = yield query.get();
        let sales = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        const { startWith, endWith, anywhere, mustContain, notContain, onlyContain, total, sum } = criteria;
        return sales.filter((sale) => {
            const mobile = sale.mobile;
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
            if (sum && sale.sum.toString() !== sum)
                return false;
            return true;
        });
    }
    catch (error) {
        logger_1.logger.error(`Error in searchSalesNumbers: ${error.message}`);
        throw error;
    }
});
exports.searchSalesNumbers = searchSalesNumbers;
/**
 * Gets details for a specific sales number.
 */
const getSaleDetails = (mobile, employeeName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let query = firebase_1.db.collection('sales').where('mobile', '==', mobile);
        if (employeeName) {
            query = query.where('originalNumberData.assignedTo', '==', employeeName);
        }
        const snapshot = yield query.limit(1).get();
        if (snapshot.empty)
            return null;
        return Object.assign({ id: snapshot.docs[0].id }, snapshot.docs[0].data());
    }
    catch (error) {
        logger_1.logger.error(`Error in getSaleDetails: ${error.message}`);
        throw error;
    }
});
exports.getSaleDetails = getSaleDetails;
/**
 * Cancels a sale and moves the number back to inventory.
 */
const cancelSale = (saleId, performedBy) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const saleRef = firebase_1.db.collection('sales').doc(saleId);
        const saleDoc = yield saleRef.get();
        if (!saleDoc.exists)
            return false;
        const saleData = saleDoc.data();
        const now = firestore_1.Timestamp.now();
        // Prepare history cycle
        const historyEvent = {
            id: Math.random().toString(36).substring(2, 11),
            action: 'Sale Cancelled',
            description: 'Sale cancelled and number returned to inventory.',
            timestamp: now,
            performedBy
        };
        const originalData = saleData.originalNumberData;
        const numberData = Object.assign(Object.assign({}, originalData), { assignedTo: 'Unassigned', name: 'Unassigned', history: [...(originalData.history || []), historyEvent] });
        const batch = firebase_1.db.batch();
        const numberRef = firebase_1.db.collection('numbers').doc(); // Create new ID or use original if possible
        // The original ID is not explicitly stored in SaleRecord according to the interface, 
        // but originalNumberData contains all fields. 
        // In the UI, addActivity logs 'Cancelled Sale'.
        batch.set(firebase_1.db.collection('numbers').doc(), numberData);
        batch.delete(saleRef);
        // Add activity log
        const activityRef = firebase_1.db.collection('activities').doc();
        batch.set(activityRef, {
            employeeName: performedBy,
            action: 'Cancelled Sale',
            description: `Sale for number ${saleData.mobile} cancelled.`,
            timestamp: firestore_1.FieldValue.serverTimestamp(),
            createdBy: 'BOT', // Or actual UID if available, but service doesn't always have it
            source: 'BOT',
            groupName: 'SALES'
        });
        yield batch.commit();
        return true;
    }
    catch (error) {
        logger_1.logger.error(`Error in cancelSale: ${error.message}`);
        throw error;
    }
});
exports.cancelSale = cancelSale;
/**
 * Fetches all sales vendors.
 */
const getSalesVendors = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const snapshot = yield firebase_1.db.collection('salesVendors').orderBy('name', 'asc').get();
        return snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    }
    catch (error) {
        logger_1.logger.error(`Error in getSalesVendors: ${error.message}`);
        throw error;
    }
});
exports.getSalesVendors = getSalesVendors;
/**
 * Calculates sales statistics for a specific vendor.
 */
const getVendorSalesStats = (vendorName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch all sales for this vendor
        const salesSnapshot = yield firebase_1.db.collection('sales')
            .where('soldTo', '==', vendorName)
            .get();
        const sales = salesSnapshot.docs.map((doc) => doc.data());
        // Fetch all payments for this vendor
        const paymentsSnapshot = yield firebase_1.db.collection('payments')
            .where('vendorName', '==', vendorName)
            .get();
        const payments = paymentsSnapshot.docs.map((doc) => doc.data());
        const totalBilled = sales.reduce((sum, s) => sum + (s.salePrice || 0), 0);
        const totalPurchaseAmount = sales.reduce((sum, s) => { var _a; return sum + (((_a = s.originalNumberData) === null || _a === void 0 ? void 0 : _a.purchasePrice) || 0); }, 0);
        const profitLoss = totalBilled - totalPurchaseAmount;
        const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const amountRemaining = totalBilled - totalPaid;
        return {
            vendorName,
            totalBilled,
            totalPurchaseAmount,
            profitLoss,
            totalPaid,
            amountRemaining,
            totalRecords: sales.length
        };
    }
    catch (error) {
        logger_1.logger.error(`Error in getVendorSalesStats for ${vendorName}: ${error.message}`);
        throw error;
    }
});
exports.getVendorSalesStats = getVendorSalesStats;
