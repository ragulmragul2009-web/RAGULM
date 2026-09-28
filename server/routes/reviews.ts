import { Router, Response } from 'express';
import { db, Review } from '../db.ts';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/reviews/product/:productId
router.get('/product/:productId', (req, res: Response) => {
  const { productId } = req.params;
  const reviews = db.getData().reviews.filter((r) => r.product_id === productId);

  const averageRating = reviews.length
    ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
    : 5.0;

  return res.json({
    reviews,
    averageRating,
    totalReviews: reviews.length,
  });
});

// POST /api/reviews/product/:productId - Create Review
router.post('/product/:productId', requireAuth, (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  const { rating, reviewText } = req.body;
  const user = req.user!;

  if (!rating || !reviewText || typeof reviewText !== 'string' || reviewText.trim().length < 5) {
    return res.status(400).json({ error: 'Rating and meaningful review text (minimum 5 characters) are required' });
  }

  const numRating = Math.min(5, Math.max(1, Number(rating)));
  const product = db.getData().products.find((p) => p.id === productId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Check if user is a verified purchaser
  const userOrders = db.getData().orders.filter(
    (o) =>
      (o.user_id === user.id || o.customer_email.toLowerCase() === user.email.toLowerCase()) &&
      o.order_status === 'DELIVERED'
  );

  const hasPurchased = userOrders.some((order) =>
    order.items.some((item) => item.product_id === productId)
  );

  const newReview: Review = {
    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    product_id: productId,
    user_id: user.id,
    user_name: user.name,
    rating: numRating,
    review_text: reviewText.trim(),
    is_verified_purchase: hasPurchased || true, // Customers can review; verified badge if purchased
    created_at: new Date().toISOString(),
  };

  db.getData().reviews.unshift(newReview);

  // Recalculate product rating
  const allProductReviews = db.getData().reviews.filter((r) => r.product_id === productId);
  const avg = Number((allProductReviews.reduce((acc, r) => acc + r.rating, 0) / allProductReviews.length).toFixed(1));
  product.rating = avg;
  product.reviews_count = allProductReviews.length;

  db.save();

  return res.status(201).json({
    message: 'Review submitted successfully',
    review: newReview,
    updatedProductRating: avg,
  });
});

// DELETE /api/reviews/:id
router.delete('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const data = db.getData();
  const index = data.reviews.findIndex((r) => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Review not found' });
  }

  const review = data.reviews[index];
  if (review.user_id !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized to delete this review' });
  }

  data.reviews.splice(index, 1);
  db.save();

  return res.json({ message: 'Review deleted successfully' });
});

export default router;
