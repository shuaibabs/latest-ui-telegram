import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json';
import { logger } from '../core/logger/logger';

admin.initializeApp({
  credential: admin.credential.cert(
    serviceAccount as admin.ServiceAccount
  )
  // databaseURL: process.env.FIREBASE_DATABASE_URL,
});

logger.info('Firebase Admin SDK initialized successfully.');

export const db = admin.firestore();
export const auth = admin.auth();
