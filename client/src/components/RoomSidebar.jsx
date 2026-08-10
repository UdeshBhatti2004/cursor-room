import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, LogOut, Menu, X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/slices/authSlice.js';

const STATUS_COLOR = {
  connected: 'bg-accent',
  connecting: 'bg-yellow-400',
  disconnected: 'bg-red-400'
};

export default function RoomSidebar({ open, onToggle, room, roomId, connectionStatus, peers, self }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  return (
    <>
      {/* Hamburger toggle — always visible, floats over the editor when collapsed */}
      <button
        onClick={onToggle}
        className="absolute left-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-panel/90 text-muted backdrop-blur transition hover:text-white"
      >
        {open ? <X size={16} /> : <Menu size={16} />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="relative z-10 flex h-full w-72 flex-shrink-0 flex-col border-r border-border bg-panel"
          >
            <div className="flex flex-col gap-1 border-b border-border px-5 pb-4 pt-16">
              <h1 className="font-display text-base font-semibold leading-tight">
                {room?.name || 'Loading room…'}
              </h1>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted">#{roomId}</span>
                <button
                  onClick={() => navigator.clipboard?.writeText(roomId)}
                  className="text-[11px] text-accent2 hover:underline"
                >
                  copy
                </button>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                <span className={`h-2 w-2 rounded-full ${STATUS_COLOR[connectionStatus]}`} />
                {connectionStatus}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted">
                In this room ({peers.length + 1})
              </p>

              <div className="flex flex-col gap-2">
                {self && (
                  <div className="flex items-center gap-3 rounded-lg bg-base px-3 py-2">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-base"
                      style={{ backgroundColor: self.color }}
                    >
                      {self.username?.[0]?.toUpperCase()}
                    </span>
                    <span className="text-sm">{self.username} (you)</span>
                  </div>
                )}

                <AnimatePresence>
                  {peers.map((peer) => (
                    <motion.div
                      key={peer.clientId}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-base"
                    >
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-base"
                        style={{ backgroundColor: peer.color }}
                      >
                        {peer.name?.[0]?.toUpperCase() || '?'}
                      </span>
                      <span className="text-sm text-white/90">{peer.name}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {peers.length === 0 && (
                  <p className="mt-2 text-xs text-muted">Nobody else here yet — share the room code above.</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-white"
              >
                <ArrowLeft size={14} /> Dashboard
              </button>
              <button
                onClick={() => {
                  dispatch(logout());
                  navigate('/login');
                }}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-white"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
