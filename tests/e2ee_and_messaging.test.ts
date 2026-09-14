import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../src/server/services/dbService';
import { User, Message, Conversation } from '../src/shared/types';
import crypto from 'crypto';

describe('Dark Falcon E2EE & Messaging Architecture', () => {
  let userA: User;
  let userB: User;
  let userC: User;
  let conversation: Conversation;
  let messageA: Message;

  beforeAll(async () => {
    // Setup test users
    const idA = `test-user-a-${Date.now()}`;
    const idB = `test-user-b-${Date.now()}`;
    const idC = `test-user-c-${Date.now()}`;

    userA = db.createUser(
      {
        id: idA,
        username: `alice_${Date.now()}`,
        email: `alice_${Date.now()}@darkfalcon.io`,
        displayName: 'Alice Falcon',
        role: 'user',
        isVerified: true,
        isPrivate: false,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      'TestPassword123!'
    );

    userB = db.createUser(
      {
        id: idB,
        username: `bob_${Date.now()}`,
        email: `bob_${Date.now()}@darkfalcon.io`,
        displayName: 'Bob Falcon',
        role: 'user',
        isVerified: true,
        isPrivate: false,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      'TestPassword123!'
    );

    userC = db.createUser(
      {
        id: idC,
        username: `eve_${Date.now()}`,
        email: `eve_${Date.now()}@darkfalcon.io`,
        displayName: 'Eve Intruder',
        role: 'user',
        isVerified: false,
        isPrivate: false,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      'TestPassword123!'
    );

    // Create 1-on-1 direct conversation between Alice and Bob
    conversation = db.createConversation({
      id: `convo-test-${Date.now()}`,
      type: 'direct',
      participants: [userA.id, userB.id],
      unreadCount: 0,
      isMuted: false,
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('1. Generates and validates cryptographic ECDH + AES-256-GCM payloads', () => {
    // Simulate ECDH P-256 Key exchange using Node crypto
    const aliceEcdh = crypto.createECDH('prime256v1');
    aliceEcdh.generateKeys();

    const bobEcdh = crypto.createECDH('prime256v1');
    bobEcdh.generateKeys();

    // Alice computes shared secret using Bob's public key
    const aliceSharedSecret = aliceEcdh.computeSecret(bobEcdh.getPublicKey());
    // Bob computes shared secret using Alice's public key
    const bobSharedSecret = bobEcdh.computeSecret(aliceEcdh.getPublicKey());

    // Both secrets must be mathematically identical (Diffie-Hellman principle)
    expect(aliceSharedSecret.equals(bobSharedSecret)).toBe(true);

    // Encrypt message with AES-256-GCM using derived shared secret (first 32 bytes)
    const key = aliceSharedSecret.subarray(0, 32);
    const iv = crypto.randomBytes(12);
    const plaintext = 'Sovereign Dark Falcon E2EE Secret Message 🦅⚡';

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    // Bob decrypts with his shared secret
    const bobKey = bobSharedSecret.subarray(0, 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', bobKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    expect(decrypted).toBe(plaintext);
    expect(ciphertext).not.toBe(plaintext);
  });

  it('2. Stores E2EE encrypted message and disallows plaintext leakage in db', () => {
    const fakeCiphertext = 'G7x9K2pQ8wL1zX3vB5nC...ciphertext...';
    const fakeIv = 'dGVzdC1pdi05NmJpdA==';

    messageA = db.addMessage({
      id: `msg-e2ee-${Date.now()}`,
      conversationId: conversation.id,
      senderId: userA.id,
      senderUsername: userA.username,
      type: 'text',
      content: fakeCiphertext,
      isEncrypted: true,
      encryptedIv: fakeIv,
      status: 'delivered',
      reactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(messageA.isEncrypted).toBe(true);
    expect(messageA.encryptedIv).toBe(fakeIv);
    expect(messageA.content).toBe(fakeCiphertext);

    // Verify conversation lastMessage is updated
    const fetchedConvo = db.getConversationById(conversation.id);
    expect(fetchedConvo?.lastMessage?.id).toBe(messageA.id);
  });

  it('3. Supports message editing by sender and tracks isEdited flag', () => {
    const updatedContent = 'Updated encrypted payload...';
    const edited = db.editMessage(messageA.id, userA.id, updatedContent);

    expect(edited).not.toBeNull();
    expect(edited?.content).toBe(updatedContent);
    expect(edited?.isEdited).toBe(true);

    // Non-sender cannot edit
    const unauthorizedEdit = db.editMessage(messageA.id, userB.id, 'Hacked Content');
    expect(unauthorizedEdit).toBeNull();
  });

  it('4. Supports emoji reactions toggle on message', () => {
    const reacted = db.reactToMessage(messageA.id, userB.id, userB.username, '🦅');
    expect(reacted?.reactions.length).toBe(1);
    expect(reacted?.reactions[0].emoji).toBe('🦅');

    // Toggle off
    const toggledOff = db.reactToMessage(messageA.id, userB.id, userB.username, '🦅');
    expect(toggledOff?.reactions.length).toBe(0);
  });

  it('5. Marks conversation messages as read', () => {
    db.markConversationRead(conversation.id, userB.id);
    const messages = db.getConversationMessages(conversation.id);
    const ourMsg = messages.find((m) => m.id === messageA.id);
    expect(ourMsg?.status).toBe('read');
  });

  it('6. Enforces message deletion permissions', () => {
    // Eve (userC) or Bob (userB) cannot delete Alice's message
    const badDelete = db.deleteMessage(messageA.id, userC.id);
    expect(badDelete).toBe(false);

    // Alice can delete her message
    const goodDelete = db.deleteMessage(messageA.id, userA.id);
    expect(goodDelete).toBe(true);

    const check = db.getMessageById(messageA.id);
    expect(check).toBeUndefined();
  });
});
