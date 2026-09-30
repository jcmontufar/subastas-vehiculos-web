import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const databaseURL = process.env.FIREBASE_DATABASE_URL;

export const isFirebaseAdminConfigured = Boolean(
  projectId && clientEmail && privateKey && databaseURL,
);

let adminApp: App | null = null;

if (isFirebaseAdminConfigured) {
  adminApp =
    getApps()[0] ??
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      databaseURL,
    });
}

export const adminAuth = adminApp ? getAuth(adminApp) : null;
export const adminDatabase = adminApp ? getDatabase(adminApp) : null;
