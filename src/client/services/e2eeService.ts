/**
 * Dark Falcon 🦅 Sovereign Cryptographic Engine
 * Genuine Client-Side End-to-End Encryption (E2EE)
 * 
 * Standards:
 * - Key Agreement: ECDH (Elliptic Curve Diffie-Hellman) over NIST curve P-256
 * - Symmetric Encryption: Authenticated AES-GCM with 256-bit keys
 * - IV: 96-bit (12-byte) cryptographically secure pseudorandom number generator (CSPRNG)
 * - Server Role: Zero-knowledge blind transit (ciphertext + IV only)
 */

import { api } from './api';

const E2EE_KEY_PREFIX = 'df_e2ee_keys_';

interface StoredKeyPair {
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
}

export class E2EEService {
  private static instance: E2EEService;
  private localKeyPair: CryptoKeyPair | null = null;
  private localPublicKeyJwk: JsonWebKey | null = null;
  private derivedSharedKeyCache: Map<string, CryptoKey> = new Map();
  private initializedForUserId: string | null = null;

  public static getInstance(): E2EEService {
    if (!E2EEService.instance) {
      E2EEService.instance = new E2EEService();
    }
    return E2EEService.instance;
  }

  /**
   * Initialize or retrieve the cryptographic identity keypair for the active user.
   */
  public async initIdentity(userId: string): Promise<string> {
    if (this.initializedForUserId === userId && this.localKeyPair && this.localPublicKeyJwk) {
      return JSON.stringify(this.localPublicKeyJwk);
    }

    const storageKey = `${E2EE_KEY_PREFIX}${userId}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        const parsed: StoredKeyPair = JSON.parse(stored);
        const publicKey = await window.crypto.subtle.importKey(
          'jwk',
          parsed.publicKeyJwk,
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          []
        );
        const privateKey = await window.crypto.subtle.importKey(
          'jwk',
          parsed.privateKeyJwk,
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          ['deriveKey', 'deriveBits']
        );

        this.localKeyPair = { publicKey, privateKey };
        this.localPublicKeyJwk = parsed.publicKeyJwk;
        this.initializedForUserId = userId;
        return JSON.stringify(this.localPublicKeyJwk);
      } catch (err) {
        console.warn('Could not restore existing E2EE keys, generating new pair:', err);
      }
    }

    // Generate fresh P-256 ECDH keypair
    const keyPair = await window.crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );

    const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

    const storedData: StoredKeyPair = { publicKeyJwk, privateKeyJwk };
    localStorage.setItem(storageKey, JSON.stringify(storedData));

    this.localKeyPair = keyPair;
    this.localPublicKeyJwk = publicKeyJwk;
    this.initializedForUserId = userId;
    this.derivedSharedKeyCache.clear();

    const exportedString = JSON.stringify(publicKeyJwk);

    // Sync public key to server profile so peers can retrieve it
    try {
      await api.put('/users/profile', { e2eePublicKey: exportedString });
    } catch (e) {
      console.warn('Failed to publish E2EE public key to profile:', e);
    }

    return exportedString;
  }

  /**
   * Derives a symmetric AES-GCM 256-bit encryption key using ECDH between
   * local private key and peer's public key JWK.
   */
  public async getSharedKey(peerUserId: string, peerPublicKeyJwkStr: string): Promise<CryptoKey | null> {
    if (!this.localKeyPair?.privateKey) return null;

    if (this.derivedSharedKeyCache.has(peerUserId)) {
      return this.derivedSharedKeyCache.get(peerUserId)!;
    }

    try {
      const peerJwk: JsonWebKey = JSON.parse(peerPublicKeyJwkStr);
      const peerPublicKey = await window.crypto.subtle.importKey(
        'jwk',
        peerJwk,
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        []
      );

      const sharedKey = await window.crypto.subtle.deriveKey(
        {
          name: 'ECDH',
          public: peerPublicKey,
        },
        this.localKeyPair.privateKey,
        {
          name: 'AES-GCM',
          length: 256,
        },
        false,
        ['encrypt', 'decrypt']
      );

      this.derivedSharedKeyCache.set(peerUserId, sharedKey);
      return sharedKey;
    } catch (err) {
      console.warn('Failed to derive shared key with peer:', peerUserId, err);
      return null;
    }
  }

  /**
   * Encrypts plaintext message into base64 ciphertext and base64 IV using AES-GCM-256.
   */
  public async encryptMessage(
    plaintext: string,
    peerUserId: string,
    peerPublicKeyStr: string
  ): Promise<{ ciphertext: string; iv: string } | null> {
    try {
      const sharedKey = await this.getSharedKey(peerUserId, peerPublicKeyStr);
      if (!sharedKey) return null;

      // 12 bytes = 96 bits standard IV for AES-GCM
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encodedPlaintext = new TextEncoder().encode(plaintext);

      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        sharedKey,
        encodedPlaintext
      );

      return {
        ciphertext: this.bufferToBase64(new Uint8Array(encryptedBuffer)),
        iv: this.bufferToBase64(iv),
      };
    } catch (err) {
      console.error('E2EE Encryption failure:', err);
      return null;
    }
  }

  /**
   * Decrypts base64 ciphertext using shared key and base64 IV.
   */
  public async decryptMessage(
    ciphertextBase64: string,
    ivBase64: string,
    peerUserId: string,
    peerPublicKeyStr: string
  ): Promise<string | null> {
    try {
      const sharedKey = await this.getSharedKey(peerUserId, peerPublicKeyStr);
      if (!sharedKey) return null;

      const ciphertextBytes = this.base64ToBuffer(ciphertextBase64);
      const ivBytes = this.base64ToBuffer(ivBase64);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBytes as unknown as BufferSource,
        },
        sharedKey,
        ciphertextBytes as unknown as BufferSource
      );

      return new TextDecoder().decode(decryptedBuffer);
    } catch (err) {
      console.warn('E2EE Decryption failure (key mismatch or corrupt data):', err);
      return null;
    }
  }

  // Utilities
  private bufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return window.btoa(binary);
  }

  private base64ToBuffer(base64: string): Uint8Array {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

export const e2ee = E2EEService.getInstance();
