import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const PALETTE = ['#7CFFB2', '#5EEAD4', '#8B9DFF', '#F5A97F', '#F58CBA', '#FFD166'];

function sign(user) {
  return jwt.sign({ sub: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function serialize(user) {
  return { id: user._id, username: user.username, email: user.email, color: user.color };
}

export async function register(req, res) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email and password are required' });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(409).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const user = await User.create({ username, email, password: hashed, color });

    res.status(201).json({ token: sign(user), user: serialize(user) });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ token: sign(user), user: serialize(user) });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
}

export async function me(req, res) {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user: serialize(user) });
}
