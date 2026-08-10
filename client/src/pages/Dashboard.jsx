import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import RoomCard from '../components/RoomCard.jsx';
import { createRoom, fetchRooms, joinRoom } from '../store/slices/roomSlice.js';

const LANGUAGES = ['javascript', 'typescript', 'python', 'go', 'rust', 'cpp'];

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, status } = useSelector((s) => s.rooms);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    dispatch(fetchRooms());
  }, [dispatch]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await dispatch(createRoom({ name, language }));
    setName('');
  }

  async function handleJoin(e) {
    e.preventDefault();
    const code = joinCode.trim().toLowerCase();
    if (!code) return;
    setJoinError('');
    const result = await dispatch(joinRoom(code));
    if (joinRoom.fulfilled.match(result)) {
      navigate(`/room/${code}`);
    } else {
      setJoinError('No room found with that code');
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-panel p-5 sm:flex-row sm:items-center"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name this room, e.g. 'Sprint bug bash'"
            className="flex-1 rounded-lg border border-border bg-base px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-lg border border-border bg-base px-3 py-2 text-sm outline-none focus:border-accent"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-base"
          >
            New room
          </motion.button>
        </motion.form>

        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onSubmit={handleJoin}
          className="mt-4 flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-panel/50 p-5 sm:flex-row sm:items-center"
        >
          <span className="text-sm text-muted sm:whitespace-nowrap">Have a room code?</span>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="e.g. a1b2c3d4"
            className="flex-1 rounded-lg border border-border bg-base px-3 py-2 font-mono text-sm outline-none focus:border-accent2"
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="rounded-lg border border-accent2/50 px-4 py-2 text-sm font-semibold text-accent2 transition hover:bg-accent2/10"
          >
            Join room
          </motion.button>
          {joinError && <span className="text-sm text-red-400">{joinError}</span>}
        </motion.form>

        <h2 className="mt-10 font-display text-lg font-semibold">Your rooms</h2>

        {status === 'loading' && <p className="mt-4 text-sm text-muted">Loading rooms…</p>}
        {status === 'succeeded' && items.length === 0 && (
          <p className="mt-4 text-sm text-muted">No rooms yet — create one above to get started.</p>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((room) => (
            <RoomCard key={room.roomId} room={room} />
          ))}
        </div>
      </main>
    </div>
  );
}
