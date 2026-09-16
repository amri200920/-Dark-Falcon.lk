import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  'dark-falcon-966bc';

let adminApp: admin.app.App | null = null;

/**
 * Safely sanitizes and formats a PEM private key from environment variables.
 * Handles:
 * - Surrounding single or double quotes
 * - Escaped newlines (\n or \\n)
 * - Base64 encoded keys
 * - Full service account JSON strings pasted into the private key field
 * - Missing or malformed PEM header/footer boundaries
 */
export function formatPrivateKey(rawKey?: string): string {
  if (!rawKey || typeof rawKey !== 'string') return '';
  let key = rawKey.trim();

  // 1. JSON string detection (if the user pasted the entire service account JSON into FIREBASE_PRIVATE_KEY)
  if (key.startsWith('{') && key.endsWith('}')) {
    try {
      const parsed = JSON.parse(key);
      if (parsed.private_key) {
        return formatPrivateKey(parsed.private_key);
      }
    } catch {}
  }

  // 2. Base64 check (if it doesn't contain PEM markers)
  if (!key.includes('-----BEGIN') && !key.includes('PRIVATE KEY')) {
    try {
      const decoded = Buffer.from(key, 'base64').toString('utf-8');
      if (decoded.includes('PRIVATE KEY')) {
        return formatPrivateKey(decoded);
      }
    } catch {}
  }

  // 3. Strip wrapping quotes (single and double quotes)
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }

  // 4. Normalize newlines (escaped \n, \r\n, and carriage returns)
  key = key
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // 5. Standardize PEM boundaries and format
  const isRsa = key.includes('RSA PRIVATE KEY');
  const header = isRsa ? '-----BEGIN RSA PRIVATE KEY-----' : '-----BEGIN PRIVATE KEY-----';
  const footer = isRsa ? '-----END RSA PRIVATE KEY-----' : '-----END PRIVATE KEY-----';

  if (key.includes('-----BEGIN') && key.includes('-----END')) {
    const bodyMatch = key.match(/-----BEGIN [A-Z ]+-----\s*([\s\S]*?)\s*-----END [A-Z ]+-----/);
    if (bodyMatch && bodyMatch[1]) {
      const body = bodyMatch[1].replace(/\s+/g, '');
      const chunked = body.match(/.{1,64}/g)?.join('\n') || body;
      return `${header}\n${chunked}\n${footer}\n`;
    }
  } else if (key.trim().length > 0) {
    const body = key.replace(/\s+/g, '');
    const chunked = body.match(/.{1,64}/g)?.join('\n') || body;
    return `${header}\n${chunked}\n${footer}\n`;
  }

  return key;
}

try {
  if (!admin.apps.length) {
    let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

    // Check if full service account JSON was provided in alternative env vars
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountJson) {
      try {
        const parsed = JSON.parse(serviceAccountJson);
        if (parsed.client_email && !clientEmail) clientEmail = parsed.client_email;
        if (parsed.private_key && !privateKeyRaw) privateKeyRaw = parsed.private_key;
        if (parsed.project_id && !process.env.FIREBASE_PROJECT_ID) projectId = parsed.project_id;
      } catch {}
    }

    const formattedKey = formatPrivateKey(privateKeyRaw);

    if (clientEmail && formattedKey) {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formattedKey,
        }),
        projectId,
      });

      console.log('🦅 Firebase Admin SDK initialized successfully with service account credentials.');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      adminApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
      });

      console.log('🦅 Firebase Admin SDK initialized with Application Default Credentials.');
    } else {
      console.warn(
        '⚠️ Firebase Admin SDK: Service account credentials not provided (FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY missing). Google token verification will be unavailable until credentials are set.'
      );
    }
  } else {
    adminApp = admin.app();
  }
} catch (error: any) {
  console.error(
    '❌ Firebase Admin SDK initialization failed:',
    error?.message || error
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
    throw new Error(
      'Firebase Admin SDK is not initialized on the server. Please verify FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in the environment.'
    );
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