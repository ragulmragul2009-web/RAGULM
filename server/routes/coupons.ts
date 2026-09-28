import { Router, Request, Response } from 'express';
import { db, Coupon } from '../db.ts';
import { requireAdmin } from '../middleware/auth.ts';

const router = Router();

// GET all coupons (Active ones for users, all for admin)
router.get('/', (req: Request, res: Response) => {
  const isAdmin = req.query.admin === 'true';
  const coupons = db.getData().coupons;

  if (isAdmin) {
    return res.json({ coupons });
  }

  // Public offers page: only active coupons
  const activeCoupons = coupons.filter((c) => c.is_active);
  return res.json({ coupons: activeCoupons });
});

// POST validate coupon code
router.post('/validate', (req: Request, res: Response) => {
  const { code, cartSubtotal } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Coupon code is required' });
  }

  const cleanCode = code.toUpperCase().trim();
  const coupon = db.getData().coupons.find((c) => c.code.toUpperCase() === cleanCode);

  if (!coupon) {
    return res.status(404).json({ error: 'Invalid coupon code' });
  }

  if (!coupon.is_active) {
    return res.status(400).json({ error: 'This coupon is no longer active' });
  }

  const subtotal = Number(cartSubtotal || 0);
  if (subtotal < coupon.min_order_value) {
    return res.status(400).json({
      error: `Minimum order value for ${coupon.code} is ₹${coupon.min_order_value}. Add ₹${coupon.min_order_value - subtotal} more!`,
    });
  }

  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = Math.round((subtotal * coupon.discount_value) / 100);
    if (coupon.max_discount && discount > coupon.max_discount) {
      discount = coupon.max_discount;
    }
  } else {
    discount = coupon.discount_value;
  }

  return res.json({
    valid: true,
    code: coupon.code,
    title: coupon.title,
    discount,
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value,
    minOrderValue: coupon.min_order_value,
  });
});

// POST create coupon (Admin)
router.post('/', requireAdmin, (req: Request, res: Response) => {
  const { code, title, discount_type, discount_value, min_order_value, max_discount, expiry_date, is_active } = req.body;

  if (!code || !title || !discount_type || discount_value === undefined || min_order_value === undefined) {
    return res.status(400).json({ error: 'Code, title, discount type, value, and minimum order are required' });
  }

  const cleanCode = code.toUpperCase().trim();
  const existing = db.getData().coupons.find((c) => c.code.toUpperCase() === cleanCode);
  if (existing) {
    return res.status(409).json({ error: 'Coupon with this code already exists' });
  }

  const newCoupon: Coupon = {
    id: `coup_${Date.now()}`,
    code: cleanCode,
    title: title.trim(),
    discount_type,
    discount_value: Number(discount_value),
    min_order_value: Number(min_order_value),
    max_discount: max_discount ? Number(max_discount) : undefined,
    expiry_date: expiry_date || '2026-12-31',
    is_active: is_active !== undefined ? Boolean(is_active) : true,
    usage_count: 0,
  };

  db.getData().coupons.push(newCoupon);
  db.save();

  return res.status(201).json({
    message: 'Coupon created successfully',
    coupon: newCoupon,
  });
});

// PUT update coupon (Admin)
router.put('/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const data = db.getData();
  const coupon = data.coupons.find((c) => c.id === id);

  if (!coupon) {
    return res.status(404).json({ error: 'Coupon not found' });
  }

  const { code, title, discount_type, discount_value, min_order_value, max_discount, expiry_date, is_active } = req.body;

  if (code) coupon.code = code.toUpperCase().trim();
  if (title) coupon.title = title.trim();
  if (discount_type) coupon.discount_type = discount_type;
  if (discount_value !== undefined) coupon.discount_value = Number(discount_value);
  if (min_order_value !== undefined) coupon.min_order_value = Number(min_order_value);
  if (max_discount !== undefined) coupon.max_discount = max_discount ? Number(max_discount) : undefined;
  if (expiry_date) coupon.expiry_date = expiry_date;
  if (is_active !== undefined) coupon.is_active = Boolean(is_active);

  db.save();

  return res.json({
    message: 'Coupon updated successfully',
    coupon,
  });
});

// DELETE coupon (Admin)
router.delete('/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const data = db.getData();
  const index = data.coupons.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Coupon not found' });
  }

  const deleted = data.coupons.splice(index, 1)[0];
  db.save();

  return res.json({
    message: 'Coupon deleted successfully',
    coupon: deleted,
  });
});

export default router;
