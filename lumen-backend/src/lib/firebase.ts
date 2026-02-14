import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function getCredential(): admin.credential.Credential {
  const keyPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyPath) {
    const path = resolve(keyPath);
    const key = JSON.parse(readFileSync(path, 'utf8'));
    return admin.credential.cert(key);
  }
  // Use Application Default Credentials. Locally: run `gcloud auth application-default login`
  // (works when org policy blocks service account key creation). On GCP: uses metadata server.
  return admin.credential.applicationDefault();
}

if (!admin.apps.length) {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    throw new Error(
      'FIREBASE_PROJECT_ID or GOOGLE_CLOUD_PROJECT must be set when not using a service account file'
    );
  }
  admin.initializeApp({
    credential: getCredential(),
    projectId,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export const db = admin.firestore();
export const storage: admin.storage.Storage = admin.storage();
export const auth: admin.auth.Auth = admin.auth();
