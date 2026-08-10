import { customAlphabet } from '../utils/nanoid.js';
import Room from '../models/Room.js';

const genId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

export async function createRoom(req, res) {
  try {
    const { name, language } = req.body;
    if (!name) return res.status(400).json({ message: 'Room name is required' });

    const room = await Room.create({
      roomId: genId(),
      name,
      language: language || 'javascript',
      createdBy: req.userId,
      participants: [req.userId]
    });

    res.status(201).json({ room });
  } catch (err) {
    res.status(500).json({ message: 'Could not create room', error: err.message });
  }
}

export async function listRooms(req, res) {
  const rooms = await Room.find({ participants: req.userId })
    .sort({ updatedAt: -1 })
    .select('-ydocState');
  res.json({ rooms });
}

export async function getRoom(req, res) {
  const room = await Room.findOne({ roomId: req.params.roomId }).select('-ydocState');
  if (!room) return res.status(404).json({ message: 'Room not found' });
  res.json({ room });
}

export async function joinRoom(req, res) {
  const room = await Room.findOne({ roomId: req.params.roomId });
  if (!room) return res.status(404).json({ message: 'Room not found' });

  if (!room.participants.some((p) => p.toString() === req.userId)) {
    room.participants.push(req.userId);
    await room.save();
  }

  const { ydocState, ...rest } = room.toObject();
  res.json({ room: rest });
}
