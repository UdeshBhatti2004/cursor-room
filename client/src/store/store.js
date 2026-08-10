import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import roomReducer from './slices/roomSlice.js';
import presenceReducer from './slices/presenceSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    rooms: roomReducer,
    presence: presenceReducer
  }
});
