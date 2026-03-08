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
exports.getUserByTelegramUsername = exports.updateUserDisplayName = exports.updateUserTelegramUsername = exports.getAllUsers = exports.deleteUser = exports.addUser = void 0;
const firebase_1 = require("../../config/firebase");
const validation_1 = require("../../shared/utils/validation");
const logger_1 = require("../../core/logger/logger");
const addUser = (userData, password) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate data structure
    const validation = validation_1.userSchema.partial().safeParse(userData);
    if (!validation.success) {
        throw new Error(`Data validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`);
    }
    const usersRef = firebase_1.db.collection('users');
    // 1. Robust email uniqueness check (traversing if necessary, though where() is efficient)
    if (userData.email) {
        const existingEmail = yield usersRef.where('email', '==', userData.email.toLowerCase()).get();
        if (!existingEmail.empty)
            throw new Error('User with this email already exists.');
    }
    if (userData.telegramUsername) {
        const existingTelegram = yield usersRef.where('telegramUsername', '==', userData.telegramUsername.replace(/^@/, '')).get();
        if (!existingTelegram.empty)
            throw new Error('User with this Telegram username already exists.');
    }
    let uid = '';
    // 2. Create user in Firebase Authentication if password is provided
    if (password) {
        try {
            const authUser = yield firebase_1.auth.createUser({
                email: userData.email,
                password: password,
                displayName: userData.displayName,
            });
            uid = authUser.uid;
            logger_1.logger.info(`Firebase Auth user created for ${userData.email} with UID: ${uid}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to create Firebase Auth user: ${error.message}`);
            throw new Error(`Auth Error: ${error.message}`);
        }
    }
    // 3. Save to Firestore
    const newUserRef = uid ? usersRef.doc(uid) : usersRef.doc();
    const newUser = Object.assign(Object.assign({}, userData), { uid: uid || newUserRef.id, id: uid || newUserRef.id, email: userData.email.toLowerCase() });
    yield newUserRef.set(newUser);
    logger_1.logger.info(`User ${userData.displayName} saved to Firestore.`);
    return newUser;
});
exports.addUser = addUser;
const deleteUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const userRef = firebase_1.db.collection('users').doc(userId);
    const userDoc = yield userRef.get();
    if (!userDoc.exists)
        throw new Error('User not found in database.');
    const userData = userDoc.data();
    // 1. Delete from Firebase Authentication if UID exists
    if (userData.uid) {
        try {
            yield firebase_1.auth.deleteUser(userData.uid);
            logger_1.logger.info(`User ${userData.email} deleted from Firebase Auth.`);
        }
        catch (error) {
            // If user doesn't exist in Auth, just log and continue to delete from Firestore
            if (error.code === 'auth/user-not-found') {
                logger_1.logger.warn(`User ${userData.email} not found in Firebase Auth during deletion.`);
            }
            else {
                logger_1.logger.error(`Failed to delete user from Firebase Auth: ${error.message}`);
                throw new Error(`Auth Deletion Error: ${error.message}`);
            }
        }
    }
    // 2. Delete from Firestore
    yield userRef.delete();
    logger_1.logger.info(`User document ${userId} deleted from Firestore.`);
});
exports.deleteUser = deleteUser;
const getAllUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    const snapshot = yield firebase_1.db.collection('users').get();
    return snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
});
exports.getAllUsers = getAllUsers;
const updateUserTelegramUsername = (userId, telegramUsername) => __awaiter(void 0, void 0, void 0, function* () {
    const userRef = firebase_1.db.collection('users').doc(userId);
    const userDoc = yield userRef.get();
    if (!userDoc.exists)
        throw new Error('User not found.');
    yield userRef.update({ telegramUsername });
});
exports.updateUserTelegramUsername = updateUserTelegramUsername;
const updateUserDisplayName = (userId, displayName) => __awaiter(void 0, void 0, void 0, function* () {
    const userRef = firebase_1.db.collection('users').doc(userId);
    const userDoc = yield userRef.get();
    if (!userDoc.exists)
        throw new Error('User not found.');
    yield userRef.update({ displayName });
});
exports.updateUserDisplayName = updateUserDisplayName;
const getUserByTelegramUsername = (telegramUsername) => __awaiter(void 0, void 0, void 0, function* () {
    const usersRef = firebase_1.db.collection('users');
    const querySnapshot = yield usersRef.where('telegramUsername', '==', telegramUsername).get();
    if (querySnapshot.empty) {
        return null;
    }
    // Assuming telegramUsername is unique, return the first found user
    const userDoc = querySnapshot.docs[0];
    return Object.assign({ id: userDoc.id }, userDoc.data());
});
exports.getUserByTelegramUsername = getUserByTelegramUsername;
