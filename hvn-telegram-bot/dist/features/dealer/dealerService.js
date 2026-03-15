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
exports.getDealerPurchases = getDealerPurchases;
exports.addDealerPurchaseStep = addDealerPurchaseStep;
exports.deleteDealerPurchase = deleteDealerPurchase;
exports.getDealerPurchaseByMobile = getDealerPurchaseByMobile;
const firebase_1 = require("../../config/firebase");
const logger_1 = require("../../core/logger/logger");
const utils_1 = require("../../shared/utils/utils");
function getDealerPurchases(employeeUid) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let query = firebase_1.db.collection('dealerPurchases');
            if (employeeUid) {
                query = query.where("createdBy", "==", employeeUid);
            }
            const snapshot = yield query.get();
            return snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        }
        catch (error) {
            logger_1.logger.error(`Error in getDealerPurchases: ${error.message}`);
            throw error;
        }
    });
}
function addDealerPurchaseStep(data, creatorUid) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ref = firebase_1.db.collection('dealerPurchases');
            // Get next srNo
            const snapshot = yield ref.orderBy('srNo', 'desc').limit(1).get();
            const srNo = snapshot.empty ? 1 : snapshot.docs[0].data().srNo + 1;
            const newPurchase = Object.assign(Object.assign({}, data), { srNo, sum: (0, utils_1.calculateDigitalRoot)(data.mobile), createdBy: creatorUid });
            yield ref.add(newPurchase);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error in addDealerPurchaseStep: ${error.message}`);
            throw error;
        }
    });
}
function deleteDealerPurchase(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield firebase_1.db.collection('dealerPurchases').doc(id).delete();
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error in deleteDealerPurchase: ${error.message}`);
            throw error;
        }
    });
}
function getDealerPurchaseByMobile(mobile, employeeUid) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let query = firebase_1.db.collection('dealerPurchases').where("mobile", "==", mobile);
            if (employeeUid) {
                query = query.where("createdBy", "==", employeeUid);
            }
            const snapshot = yield query.get();
            if (snapshot.empty)
                return null;
            return Object.assign({ id: snapshot.docs[0].id }, snapshot.docs[0].data());
        }
        catch (error) {
            logger_1.logger.error(`Error in getDealerPurchaseByMobile: ${error.message}`);
            throw error;
        }
    });
}
