import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function RoomCard({ room }) {
  const navigate = useNavigate();

  return (
    <motion.button
      layout
      whileHover={{ y: -3, borderColor: 'rgba(124,255,178,0.4)' }}
      onClick={() => navigate(`/room/${room.roomId}`)}
      className="group flex w-full flex-col gap-3 rounded-2xl border border-border bg-panel p-5 text-left transition"
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-base font-semibold text-white">{room.name}</span>
        <span className="rounded-full bg-base px-2 py-1 font-mono text-[11px] text-muted">
          {room.language}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="font-mono">#{room.roomId}</span>
        <span className="opacity-0 transition group-hover:opacity-100">Enter →</span>
      </div>
    </motion.button>
  );
}
