import { Router } from 'express';
import { createRoom, getRoom, joinRoom, listRooms } from '../controllers/roomController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.post('/', createRoom);
router.get('/', listRooms);
router.get('/:roomId', getRoom);
router.post('/:roomId/join', joinRoom);

export default router;
