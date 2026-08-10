import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { logout } from '../store/slices/authSlice.js';

export default function Navbar() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <nav className="flex items-center justify-between border-b border-border bg-panel/60 px-6 py-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
        <span className="font-display text-lg font-semibold tracking-tight">Cursor Room</span>
      </div>

      {user && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-base"
              style={{ backgroundColor: user.color }}
            >
              {user.username?.[0]?.toUpperCase()}
            </span>
            {user.username}
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              dispatch(logout());
              navigate('/login');
            }}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition hover:border-accent/40 hover:text-white"
          >
            Sign out
          </motion.button>
        </div>
      )}
    </nav>
  );
}
