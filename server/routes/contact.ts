import { Router, Request, Response } from 'express';
import { db, ContactMessage } from '../db.ts';
import { requireAdmin } from '../middleware/auth.ts';

const router = Router();

// POST /api/contact - Submit inquiry
router.post('/', (req: Request, res: Response) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  const newMessage: ContactMessage = {
    id: `msg_${Date.now()}`,
    name: name.trim(),
    email: email.trim(),
    phone: phone ? phone.trim() : '',
    message: message.trim(),
    status: 'unread',
    created_at: new Date().toISOString(),
  };

  db.getData().contact_messages.unshift(newMessage);
  db.save();

  return res.status(201).json({
    message: 'Thank you! Your message has been received. Our team will contact you shortly.',
    id: newMessage.id,
  });
});

// GET /api/contact - List messages (Admin)
router.get('/', requireAdmin, (_req: Request, res: Response) => {
  const messages = db.getData().contact_messages;
  return res.json({ messages });
});

// PUT /api/contact/:id/status - Update message status (Admin)
router.put('/:id/status', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const msg = db.getData().contact_messages.find((m) => m.id === id);
  if (!msg) {
    return res.status(404).json({ error: 'Message not found' });
  }

  if (status) msg.status = status;
  db.save();

  return res.json({ message: 'Message status updated', contactMessage: msg });
});

export default router;
