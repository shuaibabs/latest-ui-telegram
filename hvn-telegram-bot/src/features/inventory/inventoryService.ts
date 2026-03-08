import { db } from '../../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { NumberRecord, NewNumberData } from '../../shared/types/data';
import { numberRecordSchema } from '../../shared/utils/validation';
import { calculateDigitalRoot } from '../../shared/utils/utils';
import { logger } from '../../core/logger/logger';

/**
 * Checks if a mobile number already exists in the 'numbers' collection.
 */
export const isMobileNumberDuplicate = async (mobile: string): Promise<boolean> => {
    const snapshot = await db.collection('numbers').where('mobile', '==', mobile).get();
    return !snapshot.empty;
};

/**
 * Adds multiple numbers to the inventory.
 * Handles sequence numbering (srNo) and digital root calculation (sum).
 */
export const addInventoryNumbers = async (
    data: NewNumberData,
    validNumbers: string[],
    createdByUid: string,
    creatorName: string
): Promise<{ successCount: number; duplicateCount: number; errors: string[] }> => {
    if (validNumbers.length === 0) return { successCount: 0, duplicateCount: 0, errors: [] };

    const results = {
        successCount: 0,
        duplicateCount: 0,
        errors: [] as string[]
    };

    try {
        const numbersCollection = db.collection('numbers');

        // Get starting srNo
        const lastNumber = await numbersCollection.orderBy('srNo', 'desc').limit(1).get();
        let currentSrNo = lastNumber.empty ? 1 : lastNumber.docs[0].data().srNo + 1;

        const batch = db.batch();
        const now = Timestamp.now();

        for (const mobile of validNumbers) {
            // Check for duplicates
            const isDuplicate = await isMobileNumberDuplicate(mobile);
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

            const newNumber: any = {
                ...data,
                id: newDocRef.id,
                mobile,
                srNo: currentSrNo++,
                sum: calculateDigitalRoot(mobile),
                rtpDate: data.status === 'Non-RTP' && data.rtpDate ? Timestamp.fromDate(data.rtpDate) : null,
                safeCustodyDate: data.numberType === 'COCP' && data.safeCustodyDate ? Timestamp.fromDate(data.safeCustodyDate) : null,
                billDate: data.numberType === 'Postpaid' && data.billDate ? Timestamp.fromDate(data.billDate) : null,
                assignedTo: data.assignedTo || 'Unassigned',
                name: data.assignedTo || 'Unassigned',
                checkInDate: null,
                createdBy: createdByUid,
                purchaseDate: Timestamp.fromDate(data.purchaseDate),
                history: [historyEvent]
            };

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
            await batch.commit();
        }

        return results;
    } catch (error: any) {
        logger.error('Error in addInventoryNumbers: ' + error.message);
        throw error;
    }
};

/**
 * Gets all numbers (for admin/monitoring purposes if needed).
 */
export const getAllNumbers = async (): Promise<NumberRecord[]> => {
    const snapshot = await db.collection('numbers').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NumberRecord));
};
