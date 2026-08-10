import { createSlice } from '@reduxjs/toolkit';

// Tracks the live list of collaborators in the currently open room,
// driven by Yjs awareness updates (see CodeEditor.jsx). This is
// ephemeral UI state, not persisted anywhere.
const presenceSlice = createSlice({
  name: 'presence',
  initialState: { connectionStatus: 'disconnected', peers: [] },
  reducers: {
    setConnectionStatus(state, action) {
      state.connectionStatus = action.payload;
    },
    setPeers(state, action) {
      state.peers = action.payload;
    }
  }
});

export const { setConnectionStatus, setPeers } = presenceSlice.actions;
export default presenceSlice.reducer;
