# Cursor Room — real-time collaborative code editor

MERN + Yjs (CRDT) + Monaco. Multiple users open the same room and
edit the same file at once; every keystroke syncs live to everyone
else in the room, with conflicts resolved automatically by Yjs
(no last-write-wins, no manual merge logic).

## Stack
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Redux Toolkit, Monaco Editor
- **Backend**: Node.js, Express, MongoDB (Mongoose), `ws`
- **Realtime / CRDT**: Yjs, `y-protocols` (sync + awareness), `y-monaco` — a custom
  WebSocket sync layer (`server/src/ws/yjsServer.js` + `client/src/yjs/CollabProvider.js`)
  rather than the stock `y-websocket` server, so auth (JWT) and MongoDB persistence
  are wired in directly.

## How the real-time sync works
1. Each room maps to one `Y.Doc` on the server, held in memory while anyone's connected.
2. Clients connect over a plain WebSocket (`/ws/room/:roomId?token=...`) and exchange
   two message types: **sync** (document updates) and **awareness** (who's online,
   their name/color — used for the presence avatars).
3. Monaco's text buffer is bound to a shared `Y.Text` via `y-monaco`'s `MonacoBinding`,
   so typing in the editor *is* a CRDT update — Yjs merges concurrent edits from every
   connected user without conflicts.
4. The server debounces and persists the document's binary CRDT state to MongoDB, so a
   room survives a server restart and reloads with its last content.

## Local setup

### 1. Backend
```
cd server
cp .env.example .env      # fill in MONGO_URI / JWT_SECRET
npm install
npm run dev                # http://localhost:4000
```

### 2. Frontend
```
cd client
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
```

### 3. Try it
Open the app in two browser windows (or two browsers), register two
different accounts, create a room in one, and join it by URL
(`/room/<roomId>`) in the other — or open it from the dashboard once
both users have joined. Type in either editor; changes and the live
cursor/presence list appear in both instantly.

## Project layout
```
server/
  src/
    ws/yjsServer.js      <- CRDT sync + awareness over WebSocket
    models/               Room, User (Mongoose)
    routes/, controllers/ REST API (auth, rooms)
client/
  src/
    yjs/CollabProvider.js <- client-side counterpart to yjsServer.js
    components/CodeEditor.jsx  <- Monaco + Yjs binding
    store/                 Redux Toolkit slices (auth, rooms, presence)
    pages/                 Login, Register, Dashboard, EditorPage
```

## Notes
- No Docker/CI included on purpose — plug in whatever you already use.
- `JWT_SECRET` must be a real secret in `.env`, not the placeholder.
- Extending to file trees / multiple files per room: give each file its own
  `Y.Text` inside the same `Y.Doc` (e.g. `doc.getText(filePath)`), and swap
  the model bound to Monaco when the user switches tabs.
