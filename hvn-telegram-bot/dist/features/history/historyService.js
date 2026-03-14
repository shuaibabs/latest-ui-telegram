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
exports.getGlobalNumberHistory = void 0;
const firebase_1 = require("../../config/firebase");
const logger_1 = require("../../core/logger/logger");
/**
 * Searches for a number across all collections and returns details/history.
 * Role-based filtering: employees only see numbers assigned to them.
 */
const getGlobalNumberHistory = (mobile, employeeName) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Collections to search in order
        const collections = [
            { name: 'Inventory', id: 'numbers' },
            { name: 'Sales', id: 'sales' },
            { name: 'Prebooked', id: 'prebookings' },
            { name: 'Deleted', id: 'deletedNumbers' }
        ];
        for (const coll of collections) {
            let query = firebase_1.db.collection(coll.id).where('mobile', '==', mobile);
            // If employee, they must be assigned to the number
            // Note: For 'Sales', 'Prebooked', 'Deleted', the original assignedTo is inside originalNumberData
            const snapshot = yield query.limit(1).get();
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                // Check assignment for employees
                if (employeeName) {
                    const assignedTo = data.assignedTo || ((_a = data.originalNumberData) === null || _a === void 0 ? void 0 : _a.assignedTo);
                    if (assignedTo !== employeeName) {
                        continue; // Keep searching or stop? User requirement says "for employee users list numbers only assigned to them"
                    }
                }
                return { found: true, location: coll.name, data };
            }
        }
        return { found: false, location: 'None', data: null };
    }
    catch (error) {
        logger_1.logger.error(`Error in getGlobalNumberHistory: ${error.message}`);
        throw error;
    }
});
exports.getGlobalNumberHistory = getGlobalNumberHistory;
