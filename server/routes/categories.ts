import { Router, Request, Response } from 'express';
import { db, Category } from '../db.ts';
import { requireAdmin } from '../middleware/auth.ts';

const router = Router();

// GET all categories
router.get('/', (_req: Request, res: Response) => {
  const categories = [...db.getData().categories].sort((a, b) => a.display_order - b.display_order);
  const products = db.getData().products;

  // Add product count to each category
  const categoriesWithCount = categories.map((cat) => ({
    ...cat,
    product_count: products.filter((p) => p.category_id === cat.id && p.status !== 'inactive').length,
  }));

  return res.json({ categories: categoriesWithCount });
});

// POST new category (Admin)
router.post('/', requireAdmin, (req: Request, res: Response) => {
  const { name, description, image, display_order } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const newCat: Category = {
    id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    slug,
    description: description ? description.trim() : '',
    image: image || '/src/assets/images/category_fresh_juices_1790231181678.jpg',
    display_order: display_order ? Number(display_order) : db.getData().categories.length + 1,
  };

  db.getData().categories.push(newCat);
  db.save();

  return res.status(201).json({
    message: 'Category created successfully',
    category: newCat,
  });
});

// PUT update category (Admin)
router.put('/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const data = db.getData();
  const cat = data.categories.find((c) => c.id === id);

  if (!cat) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const { name, description, image, display_order } = req.body;
  if (name) cat.name = name.trim();
  if (description !== undefined) cat.description = description.trim();
  if (image) cat.image = image;
  if (display_order !== undefined) cat.display_order = Number(display_order);

  db.save();

  return res.json({
    message: 'Category updated successfully',
    category: cat,
  });
});

// DELETE category (Admin)
router.delete('/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const data = db.getData();
  const index = data.categories.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const deleted = data.categories.splice(index, 1)[0];
  db.save();

  return res.json({
    message: 'Category deleted successfully',
    category: deleted,
  });
});

export default router;
