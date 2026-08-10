// Real-time collaboration layer.
//
// Each editor "room" maps to one Y.Doc (a CRDT document from Yjs).
// Every connected client exchanges Yjs sync + awareness protocol
// messages over a raw WebSocket. Yjs resolves concurrent edits from
// multiple users automatically — no manual operational-transform
// logic is needed, which is the whole point of using a CRDT here.
import jwt from 'jsonwebtoken';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync.js';
import * as awarenessProtocol from 'y-protocols/awareness.js';
import * as encoding from 'lib0/encoding.js';
import * as decoding from 'lib0/decoding.js';
import { WebSocketServer } from 'ws';
import Room from '../models/Room.js';

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

// roomId -> { doc, awareness, connections: Set<ws>, saveTimer, controlledIds: Map<ws, Set<clientID>> }
const rooms = new Map();

function getOrCreateRoom(roomId) {
  let room = rooms.get(roomId);
  if (room) return room;

  const doc = new Y.Doc();
  const awareness = new awarenessProtocol.Awareness(doc);
  room = { doc, awareness, connections: new Set(), saveTimer: null, controlledIds: new Map() };
  rooms.set(roomId, room);

  Room.findOne({ roomId })
    .then((existing) => {
      if (existing?.ydocState?.length) {
        Y.applyUpdate(doc, new Uint8Array(existing.ydocState));
      }
    })
    .catch((err) => console.error('[yjs] failed to restore room', roomId, err));

  return room;
}

function schedulePersist(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  clearTimeout(room.saveTimer);
  room.saveTimer = setTimeout(async () => {
    const state = Buffer.from(Y.encodeStateAsUpdate(room.doc));
    try {
      await Room.updateOne({ roomId }, { $set: { ydocState: state } });
    } catch (err) {
      console.error('[yjs] failed to persist room', roomId, err);
    }
  }, 2000);
}

function send(ws, buf) {
  if (ws.readyState === ws.OPEN) ws.send(buf);
}

function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export function attachYjsWebSocketServer(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/ws/room/')) return;

    const token = url.searchParams.get('token');
    const payload = verifyToken(token);
    if (!payload) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      const roomId = url.pathname.replace('/ws/room/', '');
      wss.emit('connection', ws, roomId, payload);
    });
  });

  wss.on('connection', (ws, roomId, payload) => {
    const room = getOrCreateRoom(roomId);
    room.connections.add(ws);
    // Tracks which Yjs awareness clientIDs this specific socket owns,
    // so we can remove exactly those (and nothing else) on disconnect.
    room.controlledIds.set(ws, new Set());

    const syncMsg = encoding.createEncoder();
    encoding.writeVarUint(syncMsg, MESSAGE_SYNC);
    syncProtocol.writeSyncStep1(syncMsg, room.doc);
    send(ws, encoding.toUint8Array(syncMsg));

    const states = room.awareness.getStates();
    if (states.size > 0) {
      const awMsg = encoding.createEncoder();
      encoding.writeVarUint(awMsg, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        awMsg,
        awarenessProtocol.encodeAwarenessUpdate(room.awareness, Array.from(states.keys()))
      );
      send(ws, encoding.toUint8Array(awMsg));
    }

    const onDocUpdate = (update, origin) => {
      if (origin === ws) return;
      const enc = encoding.createEncoder();
      encoding.writeVarUint(enc, MESSAGE_SYNC);
      syncProtocol.writeUpdate(enc, update);
      send(ws, encoding.toUint8Array(enc));
    };
    room.doc.on('update', onDocUpdate);

    const onAwarenessUpdate = ({ added, updated, removed }, origin) => {
      // Record which clientIDs belong to which socket, regardless of who
      // triggered this update — this is what makes disconnect cleanup exact.
      if (origin && room.controlledIds.has(origin)) {
        const ids = room.controlledIds.get(origin);
        added.forEach((id) => ids.add(id));
        removed.forEach((id) => ids.delete(id));
      }

      if (origin === ws) return;
      const changed = added.concat(updated, removed);
      const enc = encoding.createEncoder();
      encoding.writeVarUint(enc, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(enc, awarenessProtocol.encodeAwarenessUpdate(room.awareness, changed));
      send(ws, encoding.toUint8Array(enc));
    };
    room.awareness.on('update', onAwarenessUpdate);

    ws.on('message', (data) => {
      const decoder = decoding.createDecoder(new Uint8Array(data));
      const type = decoding.readVarUint(decoder);

      if (type === MESSAGE_SYNC) {
        const enc = encoding.createEncoder();
        encoding.writeVarUint(enc, MESSAGE_SYNC);
        syncProtocol.readSyncMessage(decoder, enc, room.doc, ws);
        if (encoding.length(enc) > 1) send(ws, encoding.toUint8Array(enc));
        schedulePersist(roomId);
      } else if (type === MESSAGE_AWARENESS) {
        awarenessProtocol.applyAwarenessUpdate(room.awareness, decoding.readVarUint8Array(decoder), ws);
      }
    });

    ws.on('close', () => {
      room.connections.delete(ws);
      room.doc.off('update', onDocUpdate);
      room.awareness.off('update', onAwarenessUpdate);

      // Remove exactly the awareness entries this socket owned — instant,
      // no waiting on Yjs's internal ~30s stale-client timeout, and no
      // risk of removing a different connection's entry by mistake.
      const ownedIds = room.controlledIds.get(ws);
      room.controlledIds.delete(ws);
      if (ownedIds && ownedIds.size > 0) {
        awarenessProtocol.removeAwarenessStates(room.awareness, Array.from(ownedIds), null);
      }

      if (room.connections.size === 0) {
        schedulePersist(roomId);
        setTimeout(() => {
          if (room.connections.size === 0) rooms.delete(roomId);
        }, 5000);
      }
    });
  });

  return wss;
}