import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, User } from '../db.ts';
import { generateToken, requireAuth, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// Register
router.post('/register', (req: Request, res: Response) => {
  const { name, email, password, phone, address } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const data = db.getData();
  const existing = data.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);
  const now = new Date().toISOString();

  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    email: normalizedEmail,
    password_hash,
    phone: phone ? phone.trim() : '',
    address: address ? address.trim() : '',
    role: 'user',
    created_at: now,
    updated_at: now,
  };

  data.users.push(newUser);

  // If user provided address, create default address entry
  if (address && address.trim()) {
    data.addresses.push({
      id: `addr_${Date.now()}`,
      user_id: newUser.id,
      label: 'Home',
      street: address.trim(),
      city: 'Mumbai',
      state: 'Maharashtra',
      postal_code: '400001',
      is_default: true,
    });
  }

  db.save();

  const token = generateToken(newUser);
  const { password_hash: _, ...safeUser } = newUser;

  return res.status(201).json({
    message: 'Registration successful',
    token,
    user: safeUser,
  });
});

// Login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const data = db.getData();
  const user = data.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user);
  const { password_hash: _, ...safeUser } = user;

  return res.json({
    message: 'Login successful',
    token,
    user: safeUser,
  });
});

// Logout
router.post('/logout', (_req: Request, res: Response) => {
  return res.json({ message: 'Logged out successfully' });
});

// Forgot Password
router.post('/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const data = db.getData();
  const user = data.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    // For security, don't reveal if email exists, return success
    return res.json({ message: 'If this email is registered, password reset instructions have been sent.' });
  }

  // Provide a demo reset code so the user can easily reset password in this sandbox
  const resetToken = `reset_${user.id}_${Date.now()}`;
  return res.json({
    message: 'Password reset link and temporary verification code generated.',
    resetToken,
    instructions: 'Use this verification token with your new password to reset your account.',
  });
});

// Reset Password
router.post('/reset-password', (req: Request, res: Response) => {
  const { resetToken, newPassword, email } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const data = db.getData();
  let user: User | undefined;

  if (resetToken && resetToken.startsWith('reset_')) {
    const parts = resetToken.split('_');
    const userId = `${parts[1]}_${parts[2]}`;
    user = data.users.find((u) => u.id === userId || resetToken.includes(u.id));
  } else if (email) {
    user = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired password reset token' });
  }

  const salt = bcrypt.genSaltSync(10);
  user.password_hash = bcrypt.hashSync(newPassword, salt);
  user.updated_at = new Date().toISOString();
  db.save();

  return res.json({ message: 'Password has been successfully updated. You may now log in.' });
});

// Current User Me
router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { password_hash: _, ...safeUser } = user;
  const addresses = db.getData().addresses.filter((a) => a.user_id === user.id);

  return res.json({
    user: safeUser,
    addresses,
  });
});

export default router;
