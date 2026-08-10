import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    language: { type: String, default: 'javascript' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Persisted Yjs document state (binary CRDT update), used to restore
    // the document when the room has no active connections.
    ydocState: { type: Buffer, default: null }
  },
  { timestamps: true }
);

export default mongoose.model('Room', roomSchema);
