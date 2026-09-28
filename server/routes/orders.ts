import { Router, Request, Response } from 'express';
import { db, Order, OrderItem, OrderStatus } from '../db.ts';
import { optionalAuth, requireAdmin, AuthRequest } from '../middleware/auth.ts';

const router = Router();

const VALID_STATUSES: OrderStatus[] = [
  'PLACED',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

// POST /api/orders - Create Order from Checkout
router.post('/', optionalAuth, (req: AuthRequest, res: Response) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    deliveryAddress,
    paymentMethod = 'Cash on Delivery',
    couponCode,
    items,
    notes,
  } = req.body;

  if (!customerName || !customerPhone || !deliveryAddress || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Customer name, phone, address, and at least one item are required' });
  }

  const productsMap = new Map(db.getData().products.map((p) => [p.id, p]));
  let subtotal = 0;

  const orderItems: OrderItem[] = items.map((it: any) => {
    const product = productsMap.get(it.productId || it.product_id);
    const basePrice = product ? (product.discount_price ?? product.price) : Number(it.unitPrice || it.unit_price || 99);

    let sizeMultiplier = 1;
    if (it.size === 'Large') sizeMultiplier = 1.35;
    else if (it.size === 'Small') sizeMultiplier = 0.85;

    const toppingsPrice = (it.toppings?.length || 0) * 20;
    const unitPrice = Math.round(basePrice * sizeMultiplier) + toppingsPrice;
    const quantity = Math.max(1, Number(it.quantity || 1));
    const totalPrice = unitPrice * quantity;

    subtotal += totalPrice;

    // Decrement stock if product exists
    if (product) {
      product.available_quantity = Math.max(0, product.available_quantity - quantity);
    }

    return {
      id: `oit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      order_id: '',
      product_id: it.productId || it.product_id,
      product_name: product ? product.name : (it.productName || 'Fresh Juice'),
      product_image: product ? product.image : '/src/assets/images/category_fresh_juices_1790231181678.jpg',
      quantity,
      size: it.size || 'Medium',
      sugar_level: it.sugarLevel || it.sugar_level || 'Normal Sugar',
      ice_level: it.iceLevel || it.ice_level || 'Normal Ice',
      toppings: Array.isArray(it.toppings) ? it.toppings : [],
      unit_price: unitPrice,
      total_price: totalPrice,
    };
  });

  // Calculate discount
  let discount = 0;
  if (couponCode) {
    const coupon = db.getData().coupons.find(
      (c) => c.code.toUpperCase() === couponCode.toUpperCase() && c.is_active
    );
    if (coupon && subtotal >= coupon.min_order_value) {
      if (coupon.discount_type === 'percentage') {
        discount = Math.round((subtotal * coupon.discount_value) / 100);
        if (coupon.max_discount && discount > coupon.max_discount) {
          discount = coupon.max_discount;
        }
      } else {
        discount = coupon.discount_value;
      }
      coupon.usage_count += 1;
    }
  }

  const deliveryFee = subtotal >= 399 ? 0 : 40;
  const tax = Math.round((subtotal - discount) * 0.05);
  const grandTotal = Math.max(0, subtotal - discount + deliveryFee + tax);

  const orderId = `ord_${Date.now()}`;
  const orderNumber = `FS-${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date().toISOString();

  // Bind orderId to orderItems
  orderItems.forEach((oi) => {
    oi.order_id = orderId;
  });

  const newOrder: Order = {
    id: orderId,
    order_number: orderNumber,
    user_id: req.user?.id,
    customer_name: customerName.trim(),
    customer_email: (customerEmail || req.user?.email || '').trim(),
    customer_phone: customerPhone.trim(),
    delivery_address: {
      street: deliveryAddress.street || deliveryAddress,
      city: deliveryAddress.city || 'Mumbai',
      state: deliveryAddress.state || 'Maharashtra',
      postal_code: deliveryAddress.postalCode || deliveryAddress.postal_code || '400001',
      instructions: deliveryAddress.instructions || notes || '',
    },
    subtotal,
    discount,
    delivery_fee: deliveryFee,
    tax,
    grand_total: grandTotal,
    payment_method: paymentMethod,
    payment_status: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
    order_status: 'PLACED',
    coupon_code: couponCode || undefined,
    notes: notes || undefined,
    status_history: [
      {
        status: 'PLACED',
        timestamp: now,
        note: 'Order placed successfully. Waiting for kitchen confirmation.',
      },
    ],
    items: orderItems,
    created_at: now,
    updated_at: now,
  };

  db.getData().orders.unshift(newOrder);

  // Clear user's cart
  const sessionId = (req.headers['x-session-id'] as string) || 'guest-session-default';
  const cart = db.getData().carts.find(
    (c) => (req.user && c.user_id === req.user.id) || (!req.user && c.session_id === sessionId)
  );
  if (cart) {
    cart.items = [];
    cart.updated_at = now;
  }

  db.save();

  return res.status(201).json({
    message: 'Order created successfully',
    order: newOrder,
  });
});

// GET /api/orders - List user orders, or all orders for Admin
router.get('/', optionalAuth, (req: AuthRequest, res: Response) => {
  const { status, search } = req.query;
  const data = db.getData();
  let orders = [...data.orders];

  // If not admin, restrict to user's orders or guest match
  if (!req.user || req.user.role !== 'admin') {
    if (req.user) {
      orders = orders.filter((o) => o.user_id === req.user!.id || o.customer_email.toLowerCase() === req.user!.email.toLowerCase());
    } else {
      const email = req.query.email as string;
      const phone = req.query.phone as string;
      if (email || phone) {
        orders = orders.filter(
          (o) =>
            (email && o.customer_email.toLowerCase() === email.toLowerCase()) ||
            (phone && o.customer_phone.includes(phone))
        );
      } else {
        orders = [];
      }
    }
  }

  // Filter by status
  if (status && status !== 'all') {
    orders = orders.filter((o) => o.order_status === status);
  }

  // Filter by search (order number, customer name, phone)
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q) ||
        o.customer_email.toLowerCase().includes(q)
    );
  }

  return res.json({ orders });
});

// GET /api/orders/:id - Single order details with tracking timeline
router.get('/:id', optionalAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const order = db.getData().orders.find((o) => o.id === id || o.order_number === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  return res.json({ order });
});

// PUT /api/orders/:id/status - Update order status (Admin)
router.put('/:id/status', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}` });
  }

  const order = db.getData().orders.find((o) => o.id === id || o.order_number === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const now = new Date().toISOString();
  order.order_status = status;
  order.updated_at = now;

  let defaultNote = `Status changed to ${status}`;
  switch (status) {
    case 'CONFIRMED':
      defaultNote = 'Kitchen accepted order. Ingredients verified.';
      break;
    case 'PREPARING':
      defaultNote = 'Cold-pressing fresh fruits and preparing custom drinks.';
      break;
    case 'READY':
      defaultNote = 'Packed securely with insulated thermal pack for dispatch.';
      break;
    case 'OUT_FOR_DELIVERY':
      defaultNote = 'Dispatched with delivery partner. Reaching you shortly.';
      break;
    case 'DELIVERED':
      defaultNote = 'Delivered fresh and cold to customer.';
      order.payment_status = 'Paid';
      break;
  }

  order.status_history.push({
    status,
    timestamp: now,
    note: note || defaultNote,
  });

  db.save();

  return res.json({
    message: 'Order status updated',
    order,
  });
});

// DELETE /api/orders/:id - Cancel/Delete order (Admin)
router.delete('/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const data = db.getData();
  const index = data.orders.findIndex((o) => o.id === id || o.order_number === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const deleted = data.orders.splice(index, 1)[0];
  db.save();

  return res.json({
    message: 'Order deleted successfully',
    order: deleted,
  });
});

export default router;
