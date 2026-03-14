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
exports.advancedSearchNumbers = exports.getNumberDetails = exports.addNewVendor = exports.getExistingVendors = exports.prebookNumbersBatch = exports.markAsSoldBatch = exports.getAllNumbers = exports.softDeleteNumbers = exports.assignNumbersToUser = exports.updateNumbersStatusBatch = exports.validateNumbersExistence = exports.addInventoryNumbers = exports.isMobileNumberDuplicate = void 0;
const firebase_1 = require("../../config/firebase");
const firestore_1 = require("firebase-admin/firestore");
const utils_1 = require("../../shared/utils/utils");
const logger_1 = require("../../core/logger/logger");
/**
 * Checks if a mobile number already exists in the 'numbers' collection.
 */
const isMobileNumberDuplicate = (mobile) => __awaiter(void 0, void 0, void 0, function* () {
    const snapshot = yield firebase_1.db.collection('numbers').where('mobile', '==', mobile).get();
    return !snapshot.empty;
});
exports.isMobileNumberDuplicate = isMobileNumberDuplicate;
/**
 * Adds multiple numbers to the inventory.
 * Handles sequence numbering (srNo) and digital root calculation (sum).
 */
const addInventoryNumbers = (data, validNumbers, createdByUid, creatorName) => __awaiter(void 0, void 0, void 0, function* () {
    if (validNumbers.length === 0)
        return { successCount: 0, duplicateCount: 0, errors: [] };
    const results = {
        successCount: 0,
        duplicateCount: 0,
        errors: []
    };
    try {
        const numbersCollection = firebase_1.db.collection('numbers');
        // Get starting srNo
        const lastNumber = yield numbersCollection.orderBy('srNo', 'desc').limit(1).get();
        let currentSrNo = lastNumber.empty ? 1 : lastNumber.docs[0].data().srNo + 1;
        const batch = firebase_1.db.batch();
        const now = firestore_1.Timestamp.now();
        for (const mobile of validNumbers) {
            // Check for duplicates
            const isDuplicate = yield (0, exports.isMobileNumberDuplicate)(mobile);
            if (isDuplicate) {
                results.duplicateCount++;
                continue;
            }
            const newDocRef = numbersCollection.doc();
            // Construct Lifecycle Event
            const historyEvent = {
                id: Math.random().toString(36).substring(2, 11),
                action: 'Created',
                description: `Number added to inventory by ${creatorName} (BOT).`,
                timestamp: now,
                performedBy: creatorName
            };
            const newNumber = Object.assign(Object.assign({}, data), { id: newDocRef.id, mobile, srNo: currentSrNo++, sum: (0, utils_1.calculateDigitalRoot)(mobile), rtpDate: data.status === 'Non-RTP' && data.rtpDate ? firestore_1.Timestamp.fromDate(data.rtpDate) : null, safeCustodyDate: data.numberType === 'COCP' && data.safeCustodyDate ? firestore_1.Timestamp.fromDate(data.safeCustodyDate) : null, billDate: data.numberType === 'Postpaid' && data.billDate ? firestore_1.Timestamp.fromDate(data.billDate) : null, assignedTo: data.assignedTo || 'Unassigned', name: data.assignedTo || 'Unassigned', checkInDate: null, createdBy: createdByUid, purchaseDate: firestore_1.Timestamp.fromDate(data.purchaseDate), history: [historyEvent] });
            // Cleanup based on type (consistent with UI logic)
            if (data.ownershipType !== 'Partnership') {
                newNumber.partnerName = '';
            }
            if (data.numberType !== 'COCP') {
                delete newNumber.accountName;
                delete newNumber.safeCustodyDate;
            }
            if (data.numberType !== 'Postpaid') {
                delete newNumber.billDate;
                delete newNumber.pdBill;
            }
            // Simple validation check before batch
            // Note: numberRecordSchema might fail on srNo or id if not handled correctly
            // but we are constructing it here.
            batch.set(newDocRef, newNumber);
            results.successCount++;
        }
        if (results.successCount > 0) {
            yield batch.commit();
        }
        return results;
    }
    catch (error) {
        logger_1.logger.error('Error in addInventoryNumbers: ' + error.message);
        throw error;
    }
});
exports.addInventoryNumbers = addInventoryNumbers;
/**
 * Checks which mobile numbers exist in the 'numbers' collection.
 */
const validateNumbersExistence = (mobiles) => __awaiter(void 0, void 0, void 0, function* () {
    if (mobiles.length === 0)
        return { existing: [], missing: [] };
    const existing = [];
    const missing = [];
    // Query in chunks of 10 because Firestore 'in' query has a limit of 10-30 depending on version
    // But here we might have many numbers, so let's check one by one or in small batches
    // For simplicity and reliability with common comma-separated inputs (usually < 50), we can check existence.
    const numbersCollection = firebase_1.db.collection('numbers');
    for (const mobile of mobiles) {
        const snapshot = yield numbersCollection.where('mobile', '==', mobile).limit(1).get();
        if (!snapshot.empty) {
            existing.push(mobile);
        }
        else {
            missing.push(mobile);
        }
    }
    return { existing, missing };
});
exports.validateNumbersExistence = validateNumbersExistence;
/**
 * Updates status, upload status, or location for multiple numbers.
 */
const updateNumbersStatusBatch = (mobiles, updates, performedBy) => __awaiter(void 0, void 0, void 0, function* () {
    const results = { successCount: 0, errors: [] };
    const batch = firebase_1.db.batch();
    const now = firestore_1.Timestamp.now();
    try {
        const numbersCollection = firebase_1.db.collection('numbers');
        for (const mobile of mobiles) {
            const snapshot = yield numbersCollection.where('mobile', '==', mobile).limit(1).get();
            if (snapshot.empty)
                continue;
            const doc = snapshot.docs[0];
            const oldData = doc.data();
            const historyEvent = {
                id: Math.random().toString(36).substring(2, 11),
                action: 'Updated',
                description: `Manual update via BOT: ${Object.keys(updates).join(', ')}`,
                timestamp: now,
                performedBy
            };
            const finalUpdates = Object.assign({}, updates);
            if (updates.status === 'Non-RTP' && updates.rtpDate) {
                finalUpdates.rtpDate = firestore_1.Timestamp.fromDate(updates.rtpDate);
            }
            else if (updates.status === 'RTP') {
                finalUpdates.rtpDate = null;
            }
            batch.update(doc.ref, Object.assign(Object.assign({}, finalUpdates), { history: [...(oldData.history || []), historyEvent] }));
            results.successCount++;
        }
        if (results.successCount > 0) {
            yield batch.commit();
        }
        return results;
    }
    catch (error) {
        logger_1.logger.error('Error in updateNumbersStatusBatch: ' + error.message);
        throw error;
    }
});
exports.updateNumbersStatusBatch = updateNumbersStatusBatch;
/**
 * Assigns numbers to a specific user.
 */
const assignNumbersToUser = (mobiles, assignedTo, performedBy) => __awaiter(void 0, void 0, void 0, function* () {
    const batch = firebase_1.db.batch();
    const now = firestore_1.Timestamp.now();
    let successCount = 0;
    const numbersCollection = firebase_1.db.collection('numbers');
    for (const mobile of mobiles) {
        const snapshot = yield numbersCollection.where('mobile', '==', mobile).limit(1).get();
        if (snapshot.empty)
            continue;
        const doc = snapshot.docs[0];
        const oldData = doc.data();
        const historyEvent = {
            id: Math.random().toString(36).substring(2, 11),
            action: 'Assigned',
            description: `Assigned to ${assignedTo} via BOT.`,
            timestamp: now,
            performedBy
        };
        batch.update(doc.ref, {
            assignedTo,
            name: assignedTo, // Keeping name synced with assignedTo as per existing logic
            history: [...(oldData.history || []), historyEvent]
        });
        successCount++;
    }
    if (successCount > 0) {
        yield batch.commit();
    }
    return { successCount };
});
exports.assignNumbersToUser = assignNumbersToUser;
/**
 * Soft deletes numbers by moving them to deletedNumbers collection.
 */
const softDeleteNumbers = (mobiles_1, performedBy_1, ...args_1) => __awaiter(void 0, [mobiles_1, performedBy_1, ...args_1], void 0, function* (mobiles, performedBy, deletionReason = 'Deleted via BOT') {
    const batch = firebase_1.db.batch();
    const now = firestore_1.Timestamp.now();
    let successCount = 0;
    const numbersCollection = firebase_1.db.collection('numbers');
    const deletedCollection = firebase_1.db.collection('deletedNumbers');
    for (const mobile of mobiles) {
        const snapshot = yield numbersCollection.where('mobile', '==', mobile).limit(1).get();
        if (snapshot.empty)
            continue;
        const doc = snapshot.docs[0];
        const data = doc.data();
        const deletedDocRef = deletedCollection.doc();
        const deletedRecord = {
            id: deletedDocRef.id,
            originalId: doc.id,
            originalSrNo: data.srNo,
            mobile: data.mobile,
            sum: data.sum,
            deletionReason,
            deletedBy: performedBy,
            deletedAt: now,
            originalNumberData: data
        };
        batch.set(deletedDocRef, deletedRecord);
        batch.delete(doc.ref);
        successCount++;
    }
    if (successCount > 0) {
        yield batch.commit();
    }
    return { successCount };
});
exports.softDeleteNumbers = softDeleteNumbers;
/**
 * Gets all numbers (for admin/monitoring purposes if needed).
 */
const getAllNumbers = () => __awaiter(void 0, void 0, void 0, function* () {
    const snapshot = yield firebase_1.db.collection('numbers').get();
    return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
});
exports.getAllNumbers = getAllNumbers;
/**
 * Moves numbers from inventory to sales collection.
 */
const markAsSoldBatch = (mobiles, details, createdByUid, creatorName) => __awaiter(void 0, void 0, void 0, function* () {
    const batch = firebase_1.db.batch();
    const now = firestore_1.Timestamp.now();
    let successCount = 0;
    const numbersCollection = firebase_1.db.collection('numbers');
    const salesCollection = firebase_1.db.collection('sales');
    // Get starting srNo for sales
    const lastSale = yield salesCollection.orderBy('srNo', 'desc').limit(1).get();
    let currentSrNo = lastSale.empty ? 1 : lastSale.docs[0].data().srNo + 1;
    for (const mobile of mobiles) {
        const snapshot = yield numbersCollection.where('mobile', '==', mobile).limit(1).get();
        if (snapshot.empty)
            continue;
        const doc = snapshot.docs[0];
        const numberData = doc.data();
        const historyEvent = {
            id: Math.random().toString(36).substring(2, 11),
            action: 'Sold',
            description: `Sold to ${details.soldTo} for ₹${details.salePrice} via BOT.`,
            timestamp: now,
            performedBy: creatorName
        };
        const newSale = {
            srNo: currentSrNo++,
            mobile: numberData.mobile,
            sum: (0, utils_1.calculateDigitalRoot)(numberData.mobile),
            salePrice: details.salePrice,
            soldTo: details.soldTo,
            uploadStatus: numberData.uploadStatus || 'Pending',
            saleDate: firestore_1.Timestamp.fromDate(details.saleDate),
            createdBy: createdByUid,
            originalNumberData: Object.assign(Object.assign({}, numberData), { history: [...(numberData.history || []), historyEvent] })
        };
        const saleDocRef = salesCollection.doc();
        batch.set(saleDocRef, newSale);
        batch.delete(doc.ref);
        successCount++;
    }
    if (successCount > 0) {
        yield batch.commit();
    }
    return { successCount };
});
exports.markAsSoldBatch = markAsSoldBatch;
/**
 * Moves numbers from inventory to prebookings collection.
 */
const prebookNumbersBatch = (mobiles, createdByUid, creatorName) => __awaiter(void 0, void 0, void 0, function* () {
    const batch = firebase_1.db.batch();
    const now = firestore_1.Timestamp.now();
    let successCount = 0;
    const numbersCollection = firebase_1.db.collection('numbers');
    const prebookingsCollection = firebase_1.db.collection('prebookings');
    // Get starting srNo for prebookings
    const lastPrebook = yield prebookingsCollection.orderBy('srNo', 'desc').limit(1).get();
    let currentSrNo = lastPrebook.empty ? 1 : lastPrebook.docs[0].data().srNo + 1;
    for (const mobile of mobiles) {
        const snapshot = yield numbersCollection.where('mobile', '==', mobile).limit(1).get();
        if (snapshot.empty)
            continue;
        const doc = snapshot.docs[0];
        const numberData = doc.data();
        const historyEvent = {
            id: Math.random().toString(36).substring(2, 11),
            action: 'Pre-Booked',
            description: `Moved to pre-booking list via BOT.`,
            timestamp: now,
            performedBy: creatorName
        };
        const newPrebooking = {
            srNo: currentSrNo++,
            mobile: numberData.mobile,
            sum: numberData.sum,
            uploadStatus: numberData.uploadStatus,
            preBookingDate: now,
            createdBy: createdByUid,
            originalNumberData: Object.assign(Object.assign({}, numberData), { history: [...(numberData.history || []), historyEvent] })
        };
        const prebookDocRef = prebookingsCollection.doc();
        batch.set(prebookDocRef, newPrebooking);
        batch.delete(doc.ref);
        successCount++;
    }
    if (successCount > 0) {
        yield batch.commit();
    }
    return { successCount };
});
exports.prebookNumbersBatch = prebookNumbersBatch;
/**
 * Gets unique vendors from the 'salesVendors' collection.
 */
const getExistingVendors = () => __awaiter(void 0, void 0, void 0, function* () {
    const snapshot = yield firebase_1.db.collection('salesVendors').select('name').get();
    const vendorsSet = new Set();
    snapshot.docs.forEach(doc => {
        const name = doc.data().name;
        if (name)
            vendorsSet.add(name);
    });
    return Array.from(vendorsSet).sort();
});
exports.getExistingVendors = getExistingVendors;
/**
 * Adds a new vendor to the 'salesVendors' collection if it doesn't already exist.
 */
const addNewVendor = (vendorName, createdByUid) => __awaiter(void 0, void 0, void 0, function* () {
    const trimmedName = vendorName.trim();
    if (!trimmedName)
        return;
    const existing = yield (0, exports.getExistingVendors)();
    const exists = existing.some(v => v.toLowerCase() === trimmedName.toLowerCase());
    if (!exists) {
        yield firebase_1.db.collection('salesVendors').add({
            name: trimmedName,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            createdBy: createdByUid
        });
    }
});
exports.addNewVendor = addNewVendor;
/**
 * Searches for a number across all relevant collections to provide full history/details.
 */
const getNumberDetails = (mobile) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Check Inventory
    const invSnapshot = yield firebase_1.db.collection('numbers').where('mobile', '==', mobile).limit(1).get();
    if (!invSnapshot.empty)
        return { found: true, location: 'Inventory', data: invSnapshot.docs[0].data() };
    // 2. Check Sales
    const salesSnapshot = yield firebase_1.db.collection('sales').where('mobile', '==', mobile).limit(1).get();
    if (!salesSnapshot.empty)
        return { found: true, location: 'Sales', data: salesSnapshot.docs[0].data() };
    // 3. Check Prebookings
    const preSnapshot = yield firebase_1.db.collection('prebookings').where('mobile', '==', mobile).limit(1).get();
    if (!preSnapshot.empty)
        return { found: true, location: 'Prebooked', data: preSnapshot.docs[0].data() };
    // 4. Check Deleted
    const delSnapshot = yield firebase_1.db.collection('deletedNumbers').where('mobile', '==', mobile).limit(1).get();
    if (!delSnapshot.empty)
        return { found: true, location: 'Deleted', data: delSnapshot.docs[0].data() };
    return { found: false, location: 'None', data: null };
});
exports.getNumberDetails = getNumberDetails;
const calculateSimpleSum = (mobile) => {
    return mobile.split('').map(Number).reduce((acc, digit) => acc + digit, 0);
};
/**
 * Performs advanced search on the 'numbers' collection (Inventory).
 */
const advancedSearchNumbers = (criteria) => __awaiter(void 0, void 0, void 0, function* () {
    let query = firebase_1.db.collection('numbers');
    // Basic Firestore filtering where possible (Equality)
    if (criteria.ownershipType && criteria.ownershipType !== 'all') {
        query = query.where('ownershipType', '==', criteria.ownershipType);
    }
    // Fetch and filter in-memory for complex logic (RegEx-like)
    const snapshot = yield query.get();
    let numbers = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    const { startWith, endWith, anywhere, mustContain, notContain, onlyContain, total, sum, maxContain } = criteria;
    return numbers.filter((num) => {
        if (startWith && !num.mobile.startsWith(startWith))
            return false;
        if (endWith && !num.mobile.endsWith(endWith))
            return false;
        if (anywhere && !num.mobile.includes(anywhere))
            return false;
        if (mustContain) {
            const digits = mustContain.split(',').map(d => d.trim()).filter(Boolean);
            if (!digits.every(d => num.mobile.includes(d)))
                return false;
        }
        if (notContain) {
            const digits = notContain.split(',').map(d => d.trim()).filter(Boolean);
            if (digits.some(d => num.mobile.includes(d)))
                return false;
        }
        if (onlyContain) {
            const allowed = new Set(onlyContain.split(''));
            if (!num.mobile.split('').every(d => allowed.has(d)))
                return false;
        }
        if (total) {
            if (calculateSimpleSum(num.mobile).toString() !== total)
                return false;
        }
        if (sum && num.sum.toString() !== sum)
            return false;
        if (maxContain) {
            const counts = {};
            for (const d of num.mobile)
                counts[d] = (counts[d] || 0) + 1;
            if (Math.max(...Object.values(counts)) > parseInt(maxContain))
                return false;
        }
        return true;
    });
});
exports.advancedSearchNumbers = advancedSearchNumbers;
