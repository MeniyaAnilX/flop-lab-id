import { ed25519 } from '@noble/curves/ed25519';
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
export function signPayload(privateKeyBytes, room, nonce, text) {
  const normalized = normalizeText(text);
  const rawPayload = utf8ToBytes(`${room}|${nonce}|${normalized}`);
  const signature = ed25519.sign(rawPayload, privateKeyBytes);
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
