import { Router, Response } from 'express';
import { db } from '../db.ts';
import { requireAdmin, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/admin/stats
router.get('/stats', requireAdmin, (_req: AuthRequest, res: Response) => {
  const data = db.getData();
  const orders = data.orders;
  const products = data.products;
  const users = data.users;

  const totalSales = orders.reduce((sum, o) => sum + (o.order_status !== 'DELIVERED' && o.payment_status === 'Pending' && o.payment_method === 'Cash on Delivery' ? 0 : o.grand_total), 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o) => o.created_at.startsWith(todayStr)).length;

  const totalCustomers = users.filter((u) => u.role === 'user').length;
  const totalProducts = products.length;

  const pendingOrders = orders.filter(
    (o) => o.order_status === 'PLACED' || o.order_status === 'CONFIRMED' || o.order_status === 'PREPARING' || o.order_status === 'OUT_FOR_DELIVERY'
  ).length;

  const completedOrders = orders.filter((o) => o.order_status === 'DELIVERED').length;

  // Recent 6 orders
  const recentOrders = orders.slice(0, 6);

  // Sales by category
  const categorySalesMap: Record<string, number> = {};
  orders.forEach((o) => {
    o.items.forEach((it) => {
      const prod = products.find((p) => p.id === it.product_id);
      const catId = prod?.category_id || 'other';
      categorySalesMap[catId] = (categorySalesMap[catId] || 0) + it.total_price;
    });
  });

  const categories = data.categories.map((c) => ({
    id: c.id,
    name: c.name,
    sales: categorySalesMap[c.id] || 0,
  }));

  // Top 5 selling products
  const productSalesMap: Record<string, { count: number; name: string; revenue: number }> = {};
  orders.forEach((o) => {
    o.items.forEach((it) => {
      if (!productSalesMap[it.product_id]) {
        productSalesMap[it.product_id] = { count: 0, name: it.product_name, revenue: 0 };
      }
      productSalesMap[it.product_id].count += it.quantity;
      productSalesMap[it.product_id].revenue += it.total_price;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return res.json({
    totalSales,
    todayOrders,
    totalCustomers,
    totalProducts,
    pendingOrders,
    completedOrders,
    recentOrders,
    categories,
    topProducts,
  });
});

export default router;
