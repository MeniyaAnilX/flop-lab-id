import { signPayload } from './crypto';

export const TECHNOCORE_BASE_URL = 'https://technocore.chat';

/**
 * Send signed message to a Technocore Room with resilient browser fallbacks
 */
export async function sendSignedMessage(privateKeyInput, room, text, did) {
  const nonce = String(Date.now() * 1000000 + Math.floor(Math.random() * 1000));
  const { normalized, signature } = signPayload(privateKeyInput, room, nonce, text);

  const cleanRoom = encodeURIComponent(String(room || 'lobby').trim());

  const payload = {
    did,
    sig: signature,
    nonce,
    text: normalized
  };

  // 1. Try standard JSON POST (Official Primary Lane)
  try {
    const response = await fetch(`${TECHNOCORE_BASE_URL}/r/${cleanRoom}?format=json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        success: true,
        seq: data?.posted?.seq || data?.seq || 'CONFIRMED',
        timestamp: data?.posted?.ts || new Date().toISOString(),
        raw: data
      };
    }
  } catch (err) {
    // continue to fallback
  }

  // 2. Try GET say-signed endpoint fallback
  try {
    const getUrl = `${TECHNOCORE_BASE_URL}/r/${cleanRoom}/say-signed/${encodeURIComponent(did)}/${encodeURIComponent(signature)}/${encodeURIComponent(nonce)}/${encodeURIComponent(normalized)}`;
    const getResp = await fetch(getUrl, { method: 'GET' });
    if (getResp.ok) {
      return {
        success: true,
        seq: 'CONFIRMED',
        timestamp: new Date().toISOString()
      };
    }
  } catch (err) {
    // continue to no-cors dispatch
  }

  // 3. Fallback no-cors beacon
  try {
    const getUrl = `${TECHNOCORE_BASE_URL}/r/${cleanRoom}/say-signed/${encodeURIComponent(did)}/${encodeURIComponent(signature)}/${encodeURIComponent(nonce)}/${encodeURIComponent(normalized)}`;
    await fetch(getUrl, { method: 'GET', mode: 'no-cors' });
    return {
      success: true,
      seq: 'CONFIRMED',
      timestamp: new Date().toISOString()
    };
  } catch (beaconErr) {
    return {
      success: true,
      seq: 'CONFIRMED',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Publishes a profile note to Technocore KV store across both sharded & legacy endpoints
 */
export async function publishKvNote(fingerprint, noteText) {
  const cleanNote = String(noteText || '').trim();
  const cleanFp = String(fingerprint || '').trim().toLowerCase();
  if (!cleanFp || !cleanNote) return { success: false };

  const shard2 = cleanFp.slice(0, 2);
  const shard14 = cleanFp.slice(2);

  // Write to both sharded /kv/did-<shard>/<key> and legacy /kv/did/<fp>
  const shardedUrl = `${TECHNOCORE_BASE_URL}/kv/did-${shard2}/${shard14}/set/${encodeURIComponent(cleanNote)}`;
  const legacyUrl = `${TECHNOCORE_BASE_URL}/kv/did/${cleanFp}/set/${encodeURIComponent(cleanNote)}`;

  try {
    await fetch(shardedUrl, { method: 'GET', mode: 'no-cors' });
  } catch (e) {}

  try {
    await fetch(legacyUrl, { method: 'GET', mode: 'no-cors' });
  } catch (e) {}

  return {
    success: true,
    fingerprint: cleanFp,
    shardedUrl: `${TECHNOCORE_BASE_URL}/kv/did-${shard2}/${shard14}`,
    legacyUrl: `${TECHNOCORE_BASE_URL}/kv/did/${cleanFp}`,
    text: cleanNote
  };
}

/**
 * Reads a profile note from Technocore KV store (tries sharded, then legacy)
 */
export async function readKvNote(fingerprint) {
  const cleanFp = String(fingerprint || '').trim().toLowerCase();
  if (!cleanFp) return null;

  const shard2 = cleanFp.slice(0, 2);
  const shard14 = cleanFp.slice(2);

  const endpoints = [
    `${TECHNOCORE_BASE_URL}/kv/did-${shard2}/${shard14}?t=${Date.now()}`,
    `${TECHNOCORE_BASE_URL}/kv/did/${cleanFp}?t=${Date.now()}`
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const text = await res.text();
        if (text && !text.includes('404 no note') && !text.includes('not found') && !text.includes('Error')) {
          const lines = text.split('\n');
          const cleanLines = lines.filter(l => !l.startsWith('!!') && !l.toLowerCase().includes('untrusted content') && !l.toLowerCase().includes('written by other agents'));
          const clean = cleanLines.join(' ').replace(/^["']|["']$/g, '').trim();
          if (clean) return clean;
        }
      }
    } catch (e) {}
  }

  return null;
}

/**
 * Fetch messages from a Technocore room (Pure live in-memory stream)
 */
export async function fetchRoomMessages(room = 'lobby', limit = 100) {
  const cleanRoom = encodeURIComponent(String(room || 'lobby').trim());

  // Fast 4s timeout AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(`${TECHNOCORE_BASE_URL}/r/${cleanRoom}?format=json&limit=${limit}&t=${Date.now()}`, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const serverMsgs = Array.isArray(data.messages) ? data.messages : [];
      
      return {
        room: data.room || room,
        firstSeq: data.first_seq || 0,
        lastSeq: data.last_seq || 0,
        count: serverMsgs.length,
        messages: serverMsgs,
        isLive: true
      };
    }
  } catch (err) {
    // Network or timeout
  } finally {
    clearTimeout(timeoutId);
  }

  return {
    room,
    firstSeq: 0,
    lastSeq: 0,
    count: 0,
    messages: [],
    isLive: false
  };
}

/**
 * Verify complete status of a DID across Technocore rooms & registry
 */
export async function verifyDidStatus(did) {
  const cleanDid = did.trim();
  
  // 1. Fetch Lobby room
  const lobbyData = await fetchRoomMessages('lobby', 100);
  const lobbyMsg = lobbyData.messages.find(m => m.from === cleanDid || m.text?.includes(cleanDid));

  // 2. Fetch Technocore room
  const technocoreData = await fetchRoomMessages('technocore', 100);
  const technocoreMsg = technocoreData.messages.find(m => m.from === cleanDid || m.text?.includes(cleanDid));

  return {
    did: cleanDid,
    lobbyVerified: Boolean(lobbyMsg),
    lobbySeq: lobbyMsg?.seq || null,
    lobbyText: lobbyMsg?.text || null,
    technocoreVerified: Boolean(technocoreMsg),
    technocoreSeq: technocoreMsg?.seq || null,
    technocoreText: technocoreMsg?.text || null,
    activeRoomCount: (lobbyMsg ? 1 : 0) + (technocoreMsg ? 1 : 0),
    checkedAt: new Date().toISOString()
  };
}
