import { ed25519, x25519, edwardsToMontgomeryPub, edwardsToMontgomeryPriv } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';

export const MULTICODEC_ED25519_HEADER = new Uint8Array([0xed, 0x01]);
const B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * Pure Base58 Encoder
 */
export function base58Encode(bytes) {
  let zeroes = 0;
  while (zeroes < bytes.length && bytes[zeroes] === 0) zeroes++;

  let n = 0n;
  for (let i = 0; i < bytes.length; i++) {
    n = (n << 8n) + BigInt(bytes[i]);
  }

  let encoded = '';
  while (n > 0n) {
    const mod = Number(n % 58n);
    encoded = B58_ALPHABET[mod] + encoded;
    n = n / 58n;
  }

  return '1'.repeat(zeroes) + encoded;
}

/**
 * Pure Base58 Decoder
 */
export function base58Decode(str) {
  let zeroes = 0;
  while (zeroes < str.length && str[zeroes] === '1') zeroes++;

  let n = 0n;
  for (let i = 0; i < str.length; i++) {
    const idx = B58_ALPHABET.indexOf(str[i]);
    if (idx === -1) throw new Error(`Invalid base58 character: ${str[i]}`);
    n = n * 58n + BigInt(idx);
  }

  const bytes = [];
  while (n > 0n) {
    bytes.unshift(Number(n & 0xffn));
    n >>= 8n;
  }

  const res = new Uint8Array(zeroes + bytes.length);
  res.set(bytes, zeroes);
  return res;
}

/**
 * Base64URL encoder without padding
 */
export function base64UrlEncode(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Derives W3C `did:key:z6Mk...` from an Ed25519 public key
 */
export function didFromPublicKey(publicKeyBytes) {
  const prefixed = new Uint8Array(2 + publicKeyBytes.length);
  prefixed.set(MULTICODEC_ED25519_HEADER, 0);
  prefixed.set(publicKeyBytes, 2);
  
  const multibase = 'z' + base58Encode(prefixed);
  return `did:key:${multibase}`;
}

/**
 * Extracts public key bytes from a valid `did:key:z6Mk...`
 */
export function parseDid(didString) {
  const did = String(didString || '').trim();
  if (!did.startsWith('did:key:')) {
    throw new Error('DID must start with did:key:');
  }
  const multibase = did.slice(8);
  if (!multibase.startsWith('z6Mk')) {
    throw new Error('Invalid Ed25519 DID. Expected multibase prefix z6Mk');
  }
  if (multibase.length !== 48) {
    throw new Error(`Invalid DID length (expected 48 chars after did:key:, got ${multibase.length})`);
  }
  const decoded = base58Decode(multibase.slice(1));
  if (decoded.length !== 34 || decoded[0] !== 0xed || decoded[1] !== 0x01) {
    throw new Error('Invalid Ed25519 multicodec header');
  }
  return {
    did,
    publicKey: decoded.slice(2),
    fingerprint: bytesToHex(sha256(utf8ToBytes(did))).slice(0, 16)
  };
}

/**
 * Normalizes message text by replacing control characters with single space
 */
export function normalizeText(text) {
  return String(text || '')
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Signs a payload with an Ed25519 private key
 */
export function signPayload(privateKeyInput, room, nonce, text) {
  let privKeyBytes;
  if (typeof privateKeyInput === 'string') {
    privKeyBytes = hexToBytes(privateKeyInput.trim());
  } else if (privateKeyInput instanceof Uint8Array) {
    privKeyBytes = privateKeyInput;
  } else if (privateKeyInput && typeof privateKeyInput === 'object') {
    privKeyBytes = new Uint8Array(Object.values(privateKeyInput));
  } else {
    throw new Error('Invalid private key format');
  }

  const normalized = normalizeText(text);
  const rawPayload = utf8ToBytes(`${room}|${nonce}|${normalized}`);
  const signature = ed25519.sign(rawPayload, privKeyBytes);
  const sigBase64Url = base64UrlEncode(signature);
  return {
    normalized,
    signature: sigBase64Url
  };
}

/**
 * Generates a fresh random Ed25519 Identity
 */
export function generateIdentity() {
  const privKey = ed25519.utils.randomPrivateKey();
  const pubKey = ed25519.getPublicKey(privKey);
  const did = didFromPublicKey(pubKey);
  const seed64Hex = bytesToHex(privKey);
  const fingerprint = bytesToHex(sha256(utf8ToBytes(did))).slice(0, 16);

  return {
    did,
    seed64Hex,
    privateKey: privKey,
    publicKey: pubKey,
    fingerprint,
    createdAt: new Date().toISOString()
  };
}

/**
 * Restores an identity from a 64-hex seed
 */
export function restoreFromSeed(hexSeed) {
  const cleanHex = hexSeed.trim().toLowerCase();
  if (cleanHex.length !== 64 || !/^[0-9a-f]{64}$/.test(cleanHex)) {
    throw new Error('Seed must be exactly 64 hexadecimal characters');
  }
  const privKey = hexToBytes(cleanHex);
  const pubKey = ed25519.getPublicKey(privKey);
  const did = didFromPublicKey(pubKey);
  const fingerprint = bytesToHex(sha256(utf8ToBytes(did))).slice(0, 16);

  return {
    did,
    seed64Hex: cleanHex,
    privateKey: privKey,
    publicKey: pubKey,
    fingerprint,
    restored: true
  };
}

/**
 * Generates visual avatar gradients and identifier metrics from DID
 */
export function getAgentVisuals(did) {
  const hash = bytesToHex(sha256(utf8ToBytes(did || 'did:key:default')));
  const hue1 = parseInt(hash.slice(0, 3), 16) % 360;
  const hue2 = (hue1 + 45) % 360;
  const hue3 = (hue1 + 180) % 360;
  
  return {
    gradient: `linear-gradient(135deg, hsl(${hue1}, 85%, 55%), hsl(${hue2}, 95%, 45%), hsl(${hue3}, 75%, 25%))`,
    accent: `hsl(${hue1}, 90%, 60%)`,
    shortDid: did ? `${did.slice(0, 14)}...${did.slice(-8)}` : 'did:key:...',
    badgeNumber: parseInt(hash.slice(4, 8), 16) % 10000
  };
}

/**
 * KeySeal AES-GCM 256-Bit + PBKDF2 (100,000 rounds) Key Encryption
 */
export async function encryptKeyWithPassphrase(seed64Hex, passphrase, did) {
  if (!passphrase || passphrase.length < 6) {
    throw new Error('Passphrase must be at least 6 characters (8+ recommended).');
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 100000;

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    utf8ToBytes(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    utf8ToBytes(seed64Hex)
  );

  return {
    version: 1,
    format: 'flop_keyseal_v1',
    did: did || didFromPublicKey(ed25519.getPublicKey(hexToBytes(seed64Hex))),
    salt: base64UrlEncode(salt),
    iv: base64UrlEncode(iv),
    ciphertext: base64UrlEncode(new Uint8Array(encrypted)),
    iterations: iterations,
    createdAt: new Date().toISOString()
  };
}

/**
 * KeySeal AES-GCM 256-Bit + PBKDF2 Key Decryption
 */
export async function decryptKeyWithPassphrase(encryptedPackage, passphrase) {
  if (!passphrase) {
    throw new Error('Please enter your passphrase.');
  }

  const pkg = typeof encryptedPackage === 'string' ? JSON.parse(encryptedPackage) : encryptedPackage;
  
  if (!pkg.ciphertext || !pkg.iv || !pkg.salt) {
    throw new Error('Invalid KeySeal encrypted backup format.');
  }

  const salt = base64UrlDecode(pkg.salt);
  const iv = base64UrlDecode(pkg.iv);
  const ciphertext = base64UrlDecode(pkg.ciphertext);
  const iterations = pkg.iterations || 100000;

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    utf8ToBytes(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      ciphertext
    );

    const seed64Hex = new TextDecoder().decode(decrypted);
    return restoreFromSeed(seed64Hex);
  } catch (err) {
    throw new Error('Incorrect passphrase or corrupted encrypted backup.');
  }
}

/**
 * Base64URL decoder helper
 */
export function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Extract 32-byte Ed25519 Public Key from did:key
 */
export function extractPublicKeyFromDid(did) {
  if (!did) throw new Error('DID is required');
  let clean = did.trim();
  if (clean.startsWith('did:key:')) {
    clean = clean.replace('did:key:', '');
  }
  if (clean.startsWith('z')) {
    clean = clean.slice(1);
  }
  const decoded = base58Decode(clean);
  if (decoded[0] === 0xed && decoded[1] === 0x01) {
    return decoded.slice(2, 34);
  }
  return decoded.slice(0, 32);
}

/**
 * Encrypt a Direct Message between 2 Agents using X25519 ECDH + AES-GCM-256
 */
export async function encryptDirectMessage(senderSeed64Hex, recipientDid, plaintext) {
  if (!senderSeed64Hex || !recipientDid || !plaintext) {
    throw new Error('Sender seed, recipient DID, and message text are required.');
  }

  // 1. Get sender private key & convert to X25519
  const senderPriv = hexToBytes(senderSeed64Hex);
  const senderXPriv = edwardsToMontgomeryPriv(senderPriv);

  // 2. Extract recipient Ed25519 pubkey & convert to X25519
  const recipientEdPub = extractPublicKeyFromDid(recipientDid);
  const recipientXPub = edwardsToMontgomeryPub(recipientEdPub);

  // 3. Compute Diffie-Hellman Shared Secret (32 bytes)
  const sharedSecret = x25519.getSharedSecret(senderXPriv, recipientXPub);

  // 4. Derive AES-GCM-256 Key
  const aesKey = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // 5. Generate 12-byte IV & Encrypt
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    aesKey,
    utf8ToBytes(plaintext)
  );

  return {
    format: 'flop_e2ee_v1',
    recipientDid: recipientDid.trim(),
    iv: base64UrlEncode(iv),
    ciphertext: base64UrlEncode(new Uint8Array(encryptedBuf)),
    timestamp: new Date().toISOString()
  };
}

/**
 * Decrypt a Direct Message between 2 Agents using X25519 ECDH + AES-GCM-256
 */
export async function decryptDirectMessage(recipientSeed64Hex, senderDid, e2eePayload) {
  if (!recipientSeed64Hex || !senderDid || !e2eePayload) {
    throw new Error('Recipient seed, sender DID, and encrypted payload are required.');
  }

  const payload = typeof e2eePayload === 'string' ? JSON.parse(e2eePayload) : e2eePayload;
  if (!payload.ciphertext || !payload.iv) {
    throw new Error('Invalid E2EE payload.');
  }

  // 1. Get recipient private key & convert to X25519
  const recipientPriv = hexToBytes(recipientSeed64Hex);
  const recipientXPriv = edwardsToMontgomeryPriv(recipientPriv);

  // 2. Extract sender Ed25519 pubkey & convert to X25519
  const senderEdPub = extractPublicKeyFromDid(senderDid);
  const senderXPub = edwardsToMontgomeryPub(senderEdPub);

  // 3. Compute Diffie-Hellman Shared Secret (32 bytes)
  const sharedSecret = x25519.getSharedSecret(recipientXPriv, senderXPub);

  // 4. Derive AES-GCM-256 Key
  const aesKey = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const iv = base64UrlDecode(payload.iv);
  const ciphertext = base64UrlDecode(payload.ciphertext);

  const decryptedBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    aesKey,
    ciphertext
  );

  return new TextDecoder().decode(decryptedBuf);
}
