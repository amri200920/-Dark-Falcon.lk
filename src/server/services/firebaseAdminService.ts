import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  'dark-falcon-966bc';

let adminApp: admin.app.App | null = null;

try {
  if (!admin.apps.length) {
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (clientEmail && privateKey) {
      // Option 1: Explicit service-account credentials from environment
      adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        projectId,
      });

      console.log(
        '🦅 Firebase Admin SDK initialized with service account credentials.'
      );
    } else {
      // Option 2: Google Application Default Credentials
      // Uses GOOGLE_APPLICATION_CREDENTIALS on your development machine.
      adminApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
      });

      console.log(
        '🦅 Firebase Admin SDK initialized with Application Default Credentials.'
      );
    }
  } else {
    adminApp = admin.app();
  }
} catch (error) {
  console.warn(
    '⚠️ Firebase Admin SDK initialization warning:',
    error
  );
}

export interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
  emailVerified: boolean;
}

export async function verifyFirebaseIdToken(
  idToken: string
): Promise<VerifiedFirebaseUser> {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Firebase ID token is required');
  }

  if (!adminApp) {
    throw new Error('Firebase Admin SDK is not initialized');
  }

  let decoded: admin.auth.DecodedIdToken;

  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (error: any) {
    throw new Error(
      error?.message || 'Firebase ID token verification failed.'
    );
  }

  if (!decoded.email) {
    throw new Error(
      'Firebase token does not contain a valid email address'
    );
  }

  return {
    uid: decoded.uid,
    email: decoded.email.toLowerCase(),
    name: decoded.name,
    picture: decoded.picture,
    emailVerified: Boolean(decoded.email_verified),
  };
}

export const isFirebaseAdminReady = Boolean(adminApp);