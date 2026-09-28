import { Router, Response } from 'express';
import { db, Cart, CartItem } from '../db.ts';
import { optionalAuth, AuthRequest } from '../middleware/auth.ts';

const router = Router();

function getOrCreateCart(userId?: string, sessionId?: string): Cart {
  const data = db.getData();
  const effectiveSession = sessionId || 'guest-session-default';

  let cart = data.carts.find(
    (c) => (userId && c.user_id === userId) || (!userId && c.session_id === effectiveSession)
  );

  if (!cart) {
    cart = {
      id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      session_id: effectiveSession,
      items: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    data.carts.push(cart);
    db.save();
  } else if (userId && !cart.user_id) {
    cart.user_id = userId;
    cart.updated_at = new Date().toISOString();
    db.save();
  }

  return cart;
}

function calculateCartTotals(cart: Cart) {
  const productsMap = new Map(db.getData().products.map((p) => [p.id, p]));

  let subtotal = 0;
  const enrichedItems = cart.items.map((item) => {
    const product = productsMap.get(item.product_id);
    const basePrice = product ? (product.discount_price ?? product.price) : item.unit_price;

    // Size multiplier
    let sizeMultiplier = 1;
    if (item.size === 'Large') sizeMultiplier = 1.35;
    else if (item.size === 'Small') sizeMultiplier = 0.85;

    // Toppings pricing (₹20 per extra topping)
    const toppingsPrice = (item.toppings?.length || 0) * 20;

    const unitPrice = Math.round(basePrice * sizeMultiplier) + toppingsPrice;
    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;

    return {
      ...item,
      unit_price: unitPrice,
      total_price: itemTotal,
      product: product
        ? {
            id: product.id,
            name: product.name,
            image: product.image,
            category_id: product.category_id,
            status: product.status,
            available_quantity: product.available_quantity,
          }
        : null,
    };
  });

  const deliveryFee = subtotal === 0 || subtotal >= 399 ? 0 : 40;
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const grandTotal = subtotal + deliveryFee + tax;

  return {
    items: enrichedItems,
    itemCount: cart.items.reduce((acc, it) => acc + it.quantity, 0),
    subtotal,
    deliveryFee,
    tax,
    grandTotal,
  };
}

// GET /api/cart
router.get('/', optionalAuth, (req: AuthRequest, res: Response) => {
  const sessionId = (req.headers['x-session-id'] as string) || 'guest-session-default';
  const cart = getOrCreateCart(req.user?.id, sessionId);
  const totals = calculateCartTotals(cart);

  return res.json({
    cartId: cart.id,
    ...totals,
  });
});

// POST /api/cart - Add item
router.post('/', optionalAuth, (req: AuthRequest, res: Response) => {
  const sessionId = (req.headers['x-session-id'] as string) || 'guest-session-default';
  const {
    productId,
    quantity = 1,
    size = 'Medium',
    sugarLevel = 'Normal Sugar',
    iceLevel = 'Normal Ice',
    toppings = [],
    notes = '',
  } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  const product = db.getData().products.find((p) => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const cart = getOrCreateCart(req.user?.id, sessionId);

  // Check if identical customization already exists in cart
  const sortedToppings = [...toppings].sort().join(',');
  const existingItemIndex = cart.items.findIndex(
    (it) =>
      it.product_id === productId &&
      it.size === size &&
      it.sugar_level === sugarLevel &&
      it.ice_level === iceLevel &&
      [...it.toppings].sort().join(',') === sortedToppings
  );

  const basePrice = product.discount_price ?? product.price;

  if (existingItemIndex > -1) {
    cart.items[existingItemIndex].quantity += Number(quantity);
    if (notes) cart.items[existingItemIndex].notes = notes;
  } else {
    const newItem: CartItem = {
      id: `ci_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      cart_id: cart.id,
      product_id: productId,
      quantity: Math.max(1, Number(quantity)),
      size,
      sugar_level: sugarLevel,
      ice_level: iceLevel,
      toppings: Array.isArray(toppings) ? toppings : [],
      notes: notes || '',
      unit_price: basePrice,
    };
    cart.items.push(newItem);
  }

  cart.updated_at = new Date().toISOString();
  db.save();

  const totals = calculateCartTotals(cart);
  return res.status(201).json({
    message: 'Item added to cart',
    cartId: cart.id,
    ...totals,
  });
});

// PUT /api/cart/:id - Update item
router.put('/:id', optionalAuth, (req: AuthRequest, res: Response) => {
  const sessionId = (req.headers['x-session-id'] as string) || 'guest-session-default';
  const { id } = req.params;
  const { quantity, size, sugarLevel, iceLevel, toppings, notes } = req.body;

  const cart = getOrCreateCart(req.user?.id, sessionId);
  const item = cart.items.find((it) => it.id === id);

  if (!item) {
    return res.status(404).json({ error: 'Cart item not found' });
  }

  if (quantity !== undefined) {
    const q = Number(quantity);
    if (q <= 0) {
      cart.items = cart.items.filter((it) => it.id !== id);
    } else {
      item.quantity = q;
    }
  }

  if (size) item.size = size;
  if (sugarLevel) item.sugar_level = sugarLevel;
  if (iceLevel) item.ice_level = iceLevel;
  if (toppings) item.toppings = Array.isArray(toppings) ? toppings : [];
  if (notes !== undefined) item.notes = notes;

  cart.updated_at = new Date().toISOString();
  db.save();

  const totals = calculateCartTotals(cart);
  return res.json({
    message: 'Cart updated',
    ...totals,
  });
});

// DELETE /api/cart/:id - Remove item
router.delete('/:id', optionalAuth, (req: AuthRequest, res: Response) => {
  const sessionId = (req.headers['x-session-id'] as string) || 'guest-session-default';
  const { id } = req.params;

  const cart = getOrCreateCart(req.user?.id, sessionId);
  cart.items = cart.items.filter((it) => it.id !== id);
  cart.updated_at = new Date().toISOString();
  db.save();

  const totals = calculateCartTotals(cart);
  return res.json({
    message: 'Item removed from cart',
    ...totals,
  });
});

// DELETE /api/cart - Clear cart
router.delete('/', optionalAuth, (req: AuthRequest, res: Response) => {
  const sessionId = (req.headers['x-session-id'] as string) || 'guest-session-default';
  const cart = getOrCreateCart(req.user?.id, sessionId);
  cart.items = [];
  cart.updated_at = new Date().toISOString();
  db.save();

  return res.json({
    message: 'Cart cleared',
    itemCount: 0,
    subtotal: 0,
    deliveryFee: 0,
    tax: 0,
    grandTotal: 0,
    items: [],
  });
});

export default router;
