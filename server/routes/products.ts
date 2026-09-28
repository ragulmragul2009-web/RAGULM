import { Router, Request, Response } from 'express';
import { db, Product } from '../db.ts';
import { requireAdmin } from '../middleware/auth.ts';

const router = Router();

// GET all products with filtering, search, sorting
router.get('/', (req: Request, res: Response) => {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    minRating,
    sort,
    status,
    popular,
    featured,
    limit,
    page = '1',
  } = req.query;

  let products = [...db.getData().products];

  // Filter by category (by category_id or slug)
  if (category && category !== 'all') {
    const cats = db.getData().categories;
    const matchedCat = cats.find(
      (c) => c.id === category || c.slug === category || c.name.toLowerCase() === (category as string).toLowerCase()
    );
    if (matchedCat) {
      products = products.filter((p) => p.category_id === matchedCat.id);
    } else {
      products = products.filter((p) => p.category_id === category);
    }
  }

  // Filter by search query (name, description, ingredients, category name)
  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    products = products.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchIng = p.ingredients.some((ing) => ing.toLowerCase().includes(q));
      return matchName || matchDesc || matchIng;
    });
  }

  // Filter by price range
  if (minPrice) {
    products = products.filter((p) => (p.discount_price ?? p.price) >= Number(minPrice));
  }
  if (maxPrice) {
    products = products.filter((p) => (p.discount_price ?? p.price) <= Number(maxPrice));
  }

  // Filter by min rating
  if (minRating) {
    products = products.filter((p) => p.rating >= Number(minRating));
  }

  // Filter by popularity or featured
  if (popular === 'true') {
    products = products.filter((p) => p.is_popular);
  }
  if (featured === 'true') {
    products = products.filter((p) => p.is_featured);
  }

  // Filter by status (default only active for public, admin can pass status=all)
  if (status && status !== 'all') {
    products = products.filter((p) => p.status === status);
  } else if (!status) {
    products = products.filter((p) => p.status !== 'inactive');
  }

  // Sorting
  switch (sort) {
    case 'price_asc':
      products.sort((a, b) => (a.discount_price ?? a.price) - (b.discount_price ?? b.price));
      break;
    case 'price_desc':
      products.sort((a, b) => (b.discount_price ?? b.price) - (a.discount_price ?? a.price));
      break;
    case 'highest_rated':
      products.sort((a, b) => b.rating - a.rating || b.reviews_count - a.reviews_count);
      break;
    case 'popular':
    default:
      products.sort((a, b) => {
        if (a.is_popular === b.is_popular) {
          return b.rating - a.rating;
        }
        return a.is_popular ? -1 : 1;
      });
      break;
  }

  const total = products.length;
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = limit ? parseInt(limit as string, 10) : total;
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = products.slice(startIndex, startIndex + limitNum);

  // Attach category details to each product
  const categoriesMap = new Map(db.getData().categories.map((c) => [c.id, c]));
  const enrichedProducts = paginated.map((p) => ({
    ...p,
    category: categoriesMap.get(p.category_id),
  }));

  return res.json({
    products: enrichedProducts,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / (limitNum || 1)),
  });
});

// GET single product by ID or Slug
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = db.getData();
  const product = data.products.find((p) => p.id === id || p.slug === id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const category = data.categories.find((c) => c.id === product.category_id);
  const reviews = data.reviews.filter((r) => r.product_id === product.id);

  // Calculate accurate rating average
  const ratingAvg = reviews.length > 0
    ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
    : product.rating;

  return res.json({
    product: {
      ...product,
      rating: ratingAvg,
      reviews_count: reviews.length || product.reviews_count,
      category,
    },
    reviews,
  });
});

// POST create new product (Admin)
router.post('/', requireAdmin, (req: Request, res: Response) => {
  const {
    name,
    description,
    category_id,
    price,
    discount_price,
    image,
    ingredients,
    available_quantity,
    status = 'active',
    is_popular = false,
    is_featured = false,
    calories,
    volume_ml,
  } = req.body;

  if (!name || !description || !category_id || price === undefined) {
    return res.status(400).json({ error: 'Name, description, category, and price are required' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const newProduct: Product = {
    id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    slug,
    description: description.trim(),
    category_id,
    price: Number(price),
    discount_price: discount_price ? Number(discount_price) : undefined,
    image: image || '/src/assets/images/category_fresh_juices_1790231181678.jpg',
    ingredients: Array.isArray(ingredients) ? ingredients : typeof ingredients === 'string' ? ingredients.split(',').map((s) => s.trim()) : [],
    available_quantity: available_quantity !== undefined ? Number(available_quantity) : 50,
    rating: 5.0,
    reviews_count: 0,
    status: status || 'active',
    is_popular: Boolean(is_popular),
    is_featured: Boolean(is_featured),
    calories: calories ? Number(calories) : 120,
    volume_ml: volume_ml ? Number(volume_ml) : 350,
    created_at: new Date().toISOString(),
  };

  db.getData().products.unshift(newProduct);
  db.save();

  return res.status(201).json({
    message: 'Product created successfully',
    product: newProduct,
  });
});

// PUT update product (Admin)
router.put('/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const data = db.getData();
  const productIndex = data.products.findIndex((p) => p.id === id);

  if (productIndex === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const existing = data.products[productIndex];
  const {
    name,
    description,
    category_id,
    price,
    discount_price,
    image,
    ingredients,
    available_quantity,
    status,
    is_popular,
    is_featured,
    calories,
    volume_ml,
  } = req.body;

  const updated: Product = {
    ...existing,
    name: name !== undefined ? name.trim() : existing.name,
    description: description !== undefined ? description.trim() : existing.description,
    category_id: category_id || existing.category_id,
    price: price !== undefined ? Number(price) : existing.price,
    discount_price: discount_price !== undefined ? (discount_price ? Number(discount_price) : undefined) : existing.discount_price,
    image: image || existing.image,
    ingredients: Array.isArray(ingredients)
      ? ingredients
      : typeof ingredients === 'string'
      ? ingredients.split(',').map((s) => s.trim())
      : existing.ingredients,
    available_quantity: available_quantity !== undefined ? Number(available_quantity) : existing.available_quantity,
    status: status || existing.status,
    is_popular: is_popular !== undefined ? Boolean(is_popular) : existing.is_popular,
    is_featured: is_featured !== undefined ? Boolean(is_featured) : existing.is_featured,
    calories: calories !== undefined ? Number(calories) : existing.calories,
    volume_ml: volume_ml !== undefined ? Number(volume_ml) : existing.volume_ml,
  };

  data.products[productIndex] = updated;
  db.save();

  return res.json({
    message: 'Product updated successfully',
    product: updated,
  });
});

// DELETE product (Admin)
router.delete('/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const data = db.getData();
  const index = data.products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const deleted = data.products.splice(index, 1)[0];
  db.save();

  return res.json({
    message: 'Product deleted successfully',
    product: deleted,
  });
});

export default router;
