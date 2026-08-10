import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/axios.js';

export const login = createAsyncThunk('auth/login', async ({ email, password }) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
});

export const register = createAsyncThunk('auth/register', async (payload) => {
  const { data } = await api.post('/auth/register', payload);
  return data;
});

const storedUser = localStorage.getItem('user');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: localStorage.getItem('token') || null,
    status: 'idle',
    error: null
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
  extraReducers: (builder) => {
    builder
      .addMatcher((a) => a.type.endsWith('/pending') && a.type.startsWith('auth/'), (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addMatcher(
        (a) => a.type.endsWith('/fulfilled') && a.type.startsWith('auth/'),
        (state, action) => {
          state.status = 'succeeded';
          state.user = action.payload.user;
          state.token = action.payload.token;
          localStorage.setItem('token', action.payload.token);
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        }
      )
      .addMatcher((a) => a.type.endsWith('/rejected') && a.type.startsWith('auth/'), (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
