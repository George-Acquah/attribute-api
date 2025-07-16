import * as admin from 'firebase-admin';
export interface IFirebaseConfig {
  projectId: string;
  privateKey: string;

  clientEmail: string;
}

export type FirebaseAdmin = admin.app.App;
