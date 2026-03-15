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
exports.getFilteredLocations = getFilteredLocations;
exports.getAllUniqueLocations = getAllUniqueLocations;
exports.checkInNumber = checkInNumber;
exports.updateLocation = updateLocation;
exports.getNumberByMobile = getNumberByMobile;
const firebase_1 = require("../../config/firebase");
const firestore_1 = require("firebase-admin/firestore");
const logger_1 = require("../../core/logger/logger");
function getFilteredLocations(filters, employeeName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let query = firebase_1.db.collection('numbers');
            if (employeeName) {
                query = query.where("assignedTo", "==", employeeName);
            }
            if (filters.type && filters.type !== 'all') {
                query = query.where("locationType", "==", filters.type);
            }
            if (filters.location && filters.location !== 'all') {
                query = query.where("currentLocation", "==", filters.location);
            }
            const snapshot = yield query.get();
            return snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        }
        catch (error) {
            logger_1.logger.error(`Error in getFilteredLocations: ${error.message}`);
            throw error;
        }
    });
}
function getAllUniqueLocations(employeeName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let query = firebase_1.db.collection('numbers');
            if (employeeName) {
                query = query.where("assignedTo", "==", employeeName);
            }
            const snapshot = yield query.get();
            const locations = snapshot.docs.map((doc) => doc.data().currentLocation).filter(Boolean);
            return [...new Set(locations)].sort();
        }
        catch (error) {
            logger_1.logger.error(`Error in getAllUniqueLocations: ${error.message}`);
            throw error;
        }
    });
}
function checkInNumber(mobile, performedBy, employeeName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let query = firebase_1.db.collection('numbers').where("mobile", "==", mobile);
            if (employeeName) {
                query = query.where("assignedTo", "==", employeeName);
            }
            const snapshot = yield query.get();
            if (snapshot.empty)
                return null;
            const docRef = snapshot.docs[0].ref;
            const numData = snapshot.docs[0].data();
            const historyEvent = {
                id: Math.random().toString(36).substring(2, 11),
                action: 'Checked In',
                description: `SIM Checked In at ${numData.currentLocation} via Bot.`,
                timestamp: firestore_1.Timestamp.now(),
                performedBy
            };
            yield docRef.update({
                checkInDate: firestore_1.Timestamp.now(),
                history: firestore_1.FieldValue.arrayUnion(historyEvent)
            });
            return mobile;
        }
        catch (error) {
            logger_1.logger.error(`Error in checkInNumber: ${error.message}`);
            throw error;
        }
    });
}
function updateLocation(mobile, data, performedBy, employeeName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let query = firebase_1.db.collection('numbers').where("mobile", "==", mobile);
            if (employeeName) {
                query = query.where("assignedTo", "==", employeeName);
            }
            const snapshot = yield query.get();
            if (snapshot.empty)
                return null;
            const docRef = snapshot.docs[0].ref;
            const historyEvent = {
                id: Math.random().toString(36).substring(2, 11),
                action: 'Location Updated',
                description: `Location changed to ${data.currentLocation} (${data.locationType}) via Bot.`,
                timestamp: firestore_1.Timestamp.now(),
                performedBy
            };
            yield docRef.update({
                locationType: data.locationType,
                currentLocation: data.currentLocation,
                history: firestore_1.FieldValue.arrayUnion(historyEvent)
            });
            return mobile;
        }
        catch (error) {
            logger_1.logger.error(`定期 updateLocation: ${error.message}`);
            throw error;
        }
    });
}
function getNumberByMobile(mobile, employeeName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let query = firebase_1.db.collection('numbers').where("mobile", "==", mobile);
            if (employeeName) {
                query = query.where("assignedTo", "==", employeeName);
            }
            const snapshot = yield query.get();
            if (snapshot.empty)
                return null;
            return Object.assign({ id: snapshot.docs[0].id }, snapshot.docs[0].data());
        }
        catch (error) {
            logger_1.logger.error(`Error in getNumberByMobile: ${error.message}`);
            throw error;
        }
    });
}
