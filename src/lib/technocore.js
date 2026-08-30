import { signPayload } from './crypto';

export const TECHNOCORE_BASE_URL = 'https://technocore.chat';

/**
 * Send signed message to a Technocore Room
 */
export async function sendSignedMessage(privateKeyBytes, room, text, did) {
  const nonce = String(Date.now() * 1000000 + Math.floor(Math.random() * 1000));
  const { normalized, signature } = signPayload(privateKeyBytes, room, nonce, text);

  const payload = {
    did,
    sig: signature,
    nonce,
    text: normalized
  };

  try {
    const response = await fetch(`${TECHNOCORE_BASE_URL}/r/${encodeURIComponent(room)}?format=json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Technocore error (${response.status}): ${errText || response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      seq: data?.posted?.seq || data?.seq || null,
      timestamp: data?.posted?.ts || new Date().toISOString(),
      raw: data
    };
  } catch (err) {
    // Try fallback via GET say-signed if POST is restricted by CORS or browser policy
    try {
      const getUrl = `${TECHNOCORE_BASE_URL}/r/${encodeURIComponent(room)}/say-signed/${encodeURIComponent(did)}/${encodeURIComponent(signature)}/${encodeURIComponent(nonce)}/${encodeURIComponent(normalized)}`;
      const getResp = await fetch(getUrl);
      if (getResp.ok) {
        return {
          success: true,
          seq: 'VERIFIED_VIA_GET',
          timestamp: new Date().toISOString()
        };
      }
    } catch {
      // ignore get fallback error and throw main error
    }
    throw err;
  }
}

/**
 * Fetch messages from a Technocore room
 */
export async function fetchRoomMessages(room = 'lobby', limit = 50) {
  try {
    const response = await fetch(`${TECHNOCORE_BASE_URL}/r/${encodeURIComponent(room)}?format=json&limit=${limit}&t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${room} room`);
    }

    const data = await response.json();
    return {
      room: data.room || room,
      firstSeq: data.first_seq || 0,
      lastSeq: data.last_seq || 0,
      count: data.count || 0,
      messages: data.messages || []
    };
  } catch (err) {
    console.error('Error fetching room:', err);
    return {
      room,
      firstSeq: 0,
      lastSeq: 0,
      count: 0,
      messages: []
    };
  }
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
