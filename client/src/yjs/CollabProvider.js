// Thin client-side counterpart to server/src/ws/yjsServer.js.
// Speaks the same tiny two-message wire protocol (sync + awareness)
// so it doesn't need the full y-websocket package.
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync.js';
import * as awarenessProtocol from 'y-protocols/awareness.js';
import * as encoding from 'lib0/encoding.js';
import * as decoding from 'lib0/decoding.js';

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

export class CollabProvider {
  constructor({ url, roomId, token, doc, onStatusChange }) {
    this.doc = doc || new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.doc);
    this.onStatusChange = onStatusChange || (() => {});
    this.ws = null;
    this.shouldReconnect = true;
    this.url = `${url}/ws/room/${roomId}?token=${encodeURIComponent(token)}`;

    this.doc.on('update', (update, origin) => {
      if (origin === this) return;
      this._send(this._encode(MESSAGE_SYNC, (enc) => syncProtocol.writeUpdate(enc, update)));
    });

    this.awareness.on('update', ({ added, updated, removed }, origin) => {
      if (origin === this) return;
      const changed = added.concat(updated, removed);
      this._send(
        this._encode(MESSAGE_AWARENESS, (enc) =>
          encoding.writeVarUint8Array(enc, awarenessProtocol.encodeAwarenessUpdate(this.awareness, changed))
        )
      );
    });

    this._connect();
  }

  _encode(type, writeBody) {
    const enc = encoding.createEncoder();
    encoding.writeVarUint(enc, type);
    writeBody(enc);
    return encoding.toUint8Array(enc);
  }

  _send(buf) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(buf);
  }

  _connect() {
    this.onStatusChange('connecting');
    const ws = new WebSocket(this.url);
    ws.binaryType = 'arraybuffer';
    this.ws = ws;

    ws.onopen = () => {
  this.onStatusChange('connected');
  this._send(this._encode(MESSAGE_SYNC, (enc) => syncProtocol.writeSyncStep1(enc, this.doc)));
};

    ws.onmessage = (event) => {
      const decoder = decoding.createDecoder(new Uint8Array(event.data));
      const type = decoding.readVarUint(decoder);

      if (type === MESSAGE_SYNC) {
        const enc = encoding.createEncoder();
        encoding.writeVarUint(enc, MESSAGE_SYNC);
        syncProtocol.readSyncMessage(decoder, enc, this.doc, this);
        if (encoding.length(enc) > 1) this._send(encoding.toUint8Array(enc));
      } else if (type === MESSAGE_AWARENESS) {
        awarenessProtocol.applyAwarenessUpdate(this.awareness, decoding.readVarUint8Array(decoder), this);
      }
    };

    ws.onclose = () => {
      this.onStatusChange('disconnected');
      if (this.shouldReconnect) setTimeout(() => this._connect(), 1500);
    };

    ws.onerror = () => ws.close();
  }

  destroy() {
    this.shouldReconnect = false;
    this.ws?.close();
    this.awareness.destroy();
  }
}
