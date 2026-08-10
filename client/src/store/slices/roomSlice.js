import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/axios.js';

export const fetchRooms = createAsyncThunk('rooms/fetchAll', async () => {
  const { data } = await api.get('/rooms');
  return data.rooms;
});

export const createRoom = createAsyncThunk('rooms/create', async ({ name, language }) => {
  const { data } = await api.post('/rooms', { name, language });
  return data.room;
});

export const joinRoom = createAsyncThunk('rooms/join', async (roomId) => {
  const { data } = await api.post(`/rooms/${roomId}/join`);
  return data.room;
});

const roomSlice = createSlice({
  name: 'rooms',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchRooms.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(joinRoom.fulfilled, (state, action) => {
        const exists = state.items.some((r) => r.roomId === action.payload.roomId);
        if (!exists) state.items.unshift(action.payload);
      });
  }
});

export default roomSlice.reducer;
