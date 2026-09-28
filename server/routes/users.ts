import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, Address } from '../db.ts';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/users/profile
router.get('/profile', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const addresses = db.getData().addresses.filter((a) => a.user_id === user.id);
  const orders = db.getData().orders.filter((o) => o.user_id === user.id || o.customer_email === user.email);

  const { password_hash: _, ...safeUser } = user;
  return res.json({
    user: safeUser,
    addresses,
    ordersCount: orders.length,
  });
});

// PUT /api/users/profile
router.put('/profile', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { name, phone, address, profile_picture } = req.body;

  if (name) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (address !== undefined) user.address = address.trim();
  if (profile_picture !== undefined) user.profile_picture = profile_picture;
  user.updated_at = new Date().toISOString();

  db.save();

  const { password_hash: _, ...safeUser } = user;
  return res.json({
    message: 'Profile updated successfully',
    user: safeUser,
  });
});

// PUT /api/users/change-password
router.put('/change-password', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
  if (!isMatch) {
    return res.status(400).json({ error: 'Current password does not match' });
  }

  const salt = bcrypt.genSaltSync(10);
  user.password_hash = bcrypt.hashSync(newPassword, salt);
  user.updated_at = new Date().toISOString();
  db.save();

  return res.json({ message: 'Password changed successfully' });
});

// POST /api/users/address - Add new address
router.post('/address', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { label = 'Home', street, city, state, postal_code, is_default } = req.body;

  if (!street || !city || !postal_code) {
    return res.status(400).json({ error: 'Street, city, and postal code are required' });
  }

  const data = db.getData();
  if (is_default) {
    data.addresses.forEach((a) => {
      if (a.user_id === user.id) a.is_default = false;
    });
  }

  const newAddress: Address = {
    id: `addr_${Date.now()}`,
    user_id: user.id,
    label: label || 'Home',
    street: street.trim(),
    city: city.trim(),
    state: state ? state.trim() : 'Maharashtra',
    postal_code: postal_code.trim(),
    is_default: Boolean(is_default),
  };

  data.addresses.push(newAddress);
  db.save();

  return res.status(201).json({
    message: 'Address saved',
    address: newAddress,
    addresses: data.addresses.filter((a) => a.user_id === user.id),
  });
});

// DELETE /api/users/address/:id
router.delete('/address/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const data = db.getData();

  const index = data.addresses.findIndex((a) => a.id === id && a.user_id === user.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Address not found' });
  }

  data.addresses.splice(index, 1);
  db.save();

  return res.json({
    message: 'Address removed',
    addresses: data.addresses.filter((a) => a.user_id === user.id),
  });
});

// GET /api/users/admin/customers (Admin)
router.get('/admin/customers', requireAdmin, (_req: AuthRequest, res: Response) => {
  const users = db.getData().users.map((u) => {
    const orders = db.getData().orders.filter((o) => o.user_id === u.id || o.customer_email === u.email);
    const totalSpent = orders.reduce((acc, o) => acc + o.grand_total, 0);
    const { password_hash: _, ...safeUser } = u;
    return {
      ...safeUser,
      ordersCount: orders.length,
      totalSpent,
      lastOrderDate: orders.length ? orders[0].created_at : null,
    };
  });

  return res.json({ customers: users });
});

export default router;
