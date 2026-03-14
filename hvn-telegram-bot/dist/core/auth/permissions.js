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
exports.hasRole = hasRole;
exports.isAdmin = isAdmin;
exports.getUserProfile = getUserProfile;
const firebase_1 = require("../../config/firebase");
const logger_1 = require("../logger/logger");
/**
 * Checks if a Telegram user (by username) has a specific role in Firestore.
 */
function hasRole(telegramUsername, role) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!telegramUsername) {
            logger_1.logger.warn(`Permission check failed: No Telegram username provided.`);
            return false;
        }
        try {
            const usersRef = firebase_1.db.collection('users');
            const querySnapshot = yield usersRef.where('telegramUsername', '==', telegramUsername.replace(/^@/, '')).get();
            if (querySnapshot.empty) {
                logger_1.logger.warn(`Permission check failed: User @${telegramUsername} not found in database.`);
                return false;
            }
            const userData = querySnapshot.docs[0].data();
            // Admin has access to everything
            if (userData.role === 'admin')
                return true;
            // If checking for employee, and they are employee, return true
            if (role === 'employee' && userData.role === 'employee')
                return true;
            logger_1.logger.warn(`Permission denied: User @${telegramUsername} has role '${userData.role}', but '${role}' is required.`);
            return false;
        }
        catch (error) {
            logger_1.logger.error(`Error in permission check for @${telegramUsername}: ${error.message}`);
            return false;
        }
    });
}
/**
 * Specialized check for admin-only commands.
 */
function isAdmin(telegramUsername) {
    return __awaiter(this, void 0, void 0, function* () {
        return hasRole(telegramUsername, 'admin');
    });
}
/**
 * Gets the full user profile from Firestore based on Telegram username.
 */
function getUserProfile(telegramUsername) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!telegramUsername)
            return null;
        try {
            const usersRef = firebase_1.db.collection('users');
            const querySnapshot = yield usersRef.where('telegramUsername', '==', telegramUsername.replace(/^@/, '')).get();
            if (querySnapshot.empty)
                return null;
            return querySnapshot.docs[0].data();
        }
        catch (error) {
            logger_1.logger.error(`Error fetching profile for @${telegramUsername}: ${error.message}`);
            return null;
        }
    });
}
