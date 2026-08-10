import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../store/slices/authSlice.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.auth);

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) navigate('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-border bg-panel p-8"
      >
        <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to jump back into your rooms.</p>

        <label className="mt-6 block text-xs text-muted">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-base px-3 py-2 text-sm outline-none focus:border-accent"
        />

        <label className="mt-4 block text-xs text-muted">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-base px-3 py-2 text-sm outline-none focus:border-accent"
        />

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={status === 'loading'}
          className="mt-6 w-full rounded-lg bg-accent py-2 text-sm font-semibold text-base disabled:opacity-60"
        >
          {status === 'loading' ? 'Signing in…' : 'Sign in'}
        </motion.button>

        <p className="mt-4 text-center text-sm text-muted">
          No account?{' '}
          <Link to="/register" className="text-accent">
            Create one
          </Link>
        </p>
      </motion.form>
    </div>
  );
}
