import { db } from '../../config/firebase';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { DealerPurchaseRecord, NewDealerPurchaseData } from '../../shared/types/data';
import { logger } from '../../core/logger/logger';
import { calculateDigitalRoot } from '../../shared/utils/utils';

export async function getDealerPurchases(employeeUid?: string) {
    try {
        let query: any = db.collection('dealerPurchases');
        if (employeeUid) {
            query = query.where("createdBy", "==", employeeUid);
        }
        const snapshot = await query.get();
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as DealerPurchaseRecord));
    } catch (error: any) {
        logger.error(`Error in getDealerPurchases: ${error.message}`);
        throw error;
    }
}

export async function addDealerPurchaseStep(data: NewDealerPurchaseData, creatorUid: string) {
    try {
        const ref = db.collection('dealerPurchases');
        
        // Get next srNo
        const snapshot = await ref.orderBy('srNo', 'desc').limit(1).get();
        const srNo = snapshot.empty ? 1 : snapshot.docs[0].data().srNo + 1;

        const newPurchase: Omit<DealerPurchaseRecord, 'id'> = {
            ...data,
            srNo,
            sum: calculateDigitalRoot(data.mobile),
            createdBy: creatorUid
        };

        await ref.add(newPurchase);
        return true;
    } catch (error: any) {
        logger.error(`Error in addDealerPurchaseStep: ${error.message}`);
        throw error;
    }
}

export async function deleteDealerPurchase(id: string) {
    try {
        await db.collection('dealerPurchases').doc(id).delete();
        return true;
    } catch (error: any) {
        logger.error(`Error in deleteDealerPurchase: ${error.message}`);
        throw error;
    }
}
