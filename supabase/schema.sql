-- ===================================================================
-- FRUITSIP JUICE SHOP - COMPLETE SUPABASE DATABASE SCHEMA
-- ===================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================================================
-- 2. CATEGORIES TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===================================================================
-- 3. PRODUCTS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    stock_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===================================================================
-- 4. CUSTOMERS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===================================================================
-- 5. ORDERS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'pending',
    delivery_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===================================================================
-- 6. ORDER_ITEMS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- ===================================================================
-- 7. CART_ITEMS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===================================================================
-- 8. REVIEWS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    customer_name TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===================================================================
-- 9. CONTACT_MESSAGES TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===================================================================
-- 10. OFFERS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    discount_percentage DECIMAL(5,2) NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===================================================================
-- 11. INDEXES FOR HIGH QUERY PERFORMANCE
-- ===================================================================
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_customer_id ON public.cart_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_offers_is_active ON public.offers(is_active);

-- ===================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- 12.1 CATEGORIES POLICIES
DROP POLICY IF EXISTS "Public can view all categories" ON public.categories;
CREATE POLICY "Public can view all categories" ON public.categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 12.2 PRODUCTS POLICIES
DROP POLICY IF EXISTS "Public can view available products" ON public.products;
CREATE POLICY "Public can view available products" ON public.products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 12.3 CUSTOMERS POLICIES
DROP POLICY IF EXISTS "Customers can view their own profile" ON public.customers;
CREATE POLICY "Customers can view their own profile" ON public.customers
    FOR SELECT USING (auth.uid() = id OR auth.role() = 'service_role' OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Customers can insert their profile" ON public.customers;
CREATE POLICY "Customers can insert their profile" ON public.customers
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Customers can update their profile" ON public.customers;
CREATE POLICY "Customers can update their profile" ON public.customers
    FOR UPDATE USING (auth.uid() = id OR auth.role() = 'service_role');

-- 12.4 ORDERS POLICIES
DROP POLICY IF EXISTS "Users can view their orders" ON public.orders;
CREATE POLICY "Users can view their orders" ON public.orders
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE USING (true);

-- 12.5 ORDER_ITEMS POLICIES
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
CREATE POLICY "Public can view order items" ON public.order_items
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
CREATE POLICY "Users can insert order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

-- 12.6 CART_ITEMS POLICIES
DROP POLICY IF EXISTS "Users can view and manage their own cart" ON public.cart_items;
CREATE POLICY "Users can view and manage their own cart" ON public.cart_items
    FOR ALL USING (true);

-- 12.7 REVIEWS POLICIES
DROP POLICY IF EXISTS "Public can read reviews" ON public.reviews;
CREATE POLICY "Public can read reviews" ON public.reviews
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can submit reviews" ON public.reviews;
CREATE POLICY "Users can submit reviews" ON public.reviews
    FOR INSERT WITH CHECK (rating >= 1 AND rating <= 5);

-- 12.8 CONTACT_MESSAGES POLICIES
DROP POLICY IF EXISTS "Public can submit contact messages" ON public.contact_messages;
CREATE POLICY "Public can submit contact messages" ON public.contact_messages
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
CREATE POLICY "Admins can view contact messages" ON public.contact_messages
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 12.9 OFFERS POLICIES
DROP POLICY IF EXISTS "Public can view active offers" ON public.offers;
CREATE POLICY "Public can view active offers" ON public.offers
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage offers" ON public.offers;
CREATE POLICY "Admins can manage offers" ON public.offers
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ===================================================================
-- 13. STORAGE BUCKET: product-images
-- ===================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'product-images');

-- ===================================================================
-- 14. SEED DATA (Deterministic UUIDs)
-- ===================================================================

-- Categories
INSERT INTO public.categories (id, name, image_url)
VALUES
    ('11111111-1111-4111-8111-111111111111', 'Fresh Juices', '/src/assets/images/category_fresh_juices_1790231181678.jpg'),
    ('22222222-2222-4222-8222-222222222222', 'Fruit Shakes', '/src/assets/images/category_fruit_shakes_1790231197381.jpg'),
    ('33333333-3333-4333-8333-333333333333', 'Smoothies', '/src/assets/images/category_smoothies_1790231211712.jpg'),
    ('44444444-4444-4444-8444-444444444444', 'Milkshakes', '/src/assets/images/category_fruit_shakes_1790231197381.jpg'),
    ('55555555-5555-4555-8555-555555555555', 'Mocktails', '/src/assets/images/hero_fruit_juice_1790231167665.jpg'),
    ('66666666-6666-4666-8666-666666666666', 'Healthy Drinks', '/src/assets/images/category_healthy_drinks_1790231228180.jpg')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, image_url = EXCLUDED.image_url;

-- Products
INSERT INTO public.products (id, name, description, price, image_url, category_id, stock_quantity, is_available)
VALUES
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Ratnagiri Alphonso Mango Juice', 'Pure cold-pressed Alphonso mango pulp with zero added sugar and a touch of wild honey.', 149.00, '/src/assets/images/category_fresh_juices_1790231181678.jpg', '11111111-1111-4111-8111-111111111111', 45, true),
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Hydrating Watermelon Lime Cooler', 'Fresh seedless organic watermelon cold-pressed with Himalayan rock salt and key lime twist.', 119.00, '/src/assets/images/category_fresh_juices_1790231181678.jpg', '11111111-1111-4111-8111-111111111111', 50, true),
    ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Valencia Orange Sunlight Juice', '100% pure cold-pressed Valencia oranges. Bursting with natural bioflavonoids and immune Vitamin C.', 139.00, '/src/assets/images/category_fresh_juices_1790231181678.jpg', '11111111-1111-4111-8111-111111111111', 35, true),
    ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Hawaiian Golden Pineapple Juice', 'Sweet and tangy golden pineapple juice with natural digestive bromelain enzymes.', 119.00, '/src/assets/images/category_fresh_juices_1790231181678.jpg', '11111111-1111-4111-8111-111111111111', 40, true),
    ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Royal Gala Crisp Apple Juice', 'Slow-pressed from Himachal Royal Gala apples. Crisp, unclouded, with delicate floral notes.', 139.00, '/src/assets/images/category_fresh_juices_1790231181678.jpg', '11111111-1111-4111-8111-111111111111', 35, true),
    ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'Ruby Jewel Pomegranate Juice', 'Deep crimson juice pressed from premium Bhagwa pomegranates. Loaded with powerful polyphenols.', 169.00, '/src/assets/images/category_fresh_juices_1790231181678.jpg', '11111111-1111-4111-8111-111111111111', 30, true),
    ('10101010-1010-4010-8010-101010101010', 'Seedless Black Grape Elixir', 'Rich, velvet juice from sweet Nashik black grapes with a refreshing subtle tart finish.', 129.00, '/src/assets/images/category_fresh_juices_1790231181678.jpg', '11111111-1111-4111-8111-111111111111', 28, true),
    ('20202020-2020-4020-8020-202020202020', 'Seven Island Mixed Fruit Punch', 'Vibrant blend of papaya, orange, apple, pineapple, watermelon, and fresh pomegranate seeds.', 149.00, '/src/assets/images/hero_fruit_juice_1790231167665.jpg', '11111111-1111-4111-8111-111111111111', 40, true),
    ('30303030-3030-4030-8030-303030303030', 'Royal Alphonso Mango Thick Shake', 'Luscious mango pulp hand-blended with chilled farm milk, saffron strands, and roasted almond slivers.', 159.00, '/src/assets/images/category_fruit_shakes_1790231197381.jpg', '22222222-2222-4222-8222-222222222222', 40, true),
    ('40404040-4040-4040-8040-404040404040', 'Creamy Banana & Nut Butter Shake', 'Ripe Robusta bananas whipped with organic peanut butter, full cream milk, and crushed walnuts.', 139.00, '/src/assets/images/category_fruit_shakes_1790231197381.jpg', '22222222-2222-4222-8222-222222222222', 45, true),
    ('50505050-5050-4050-8050-505050505050', 'Wild Strawberry Bliss Smoothie', 'Mahabaleshwar strawberries blended with Greek probiotic yogurt, chia seeds, and raw agave nectar.', 169.00, '/src/assets/images/category_smoothies_1790231211712.jpg', '33333333-3333-4333-8333-333333333333', 35, true),
    ('60606060-6060-4060-8060-606060606060', 'Antioxidant Triple Berry Smoothie', 'Wild blueberries, dark blackberries, raspberries, açai extract, and chilled coconut water.', 189.00, '/src/assets/images/category_smoothies_1790231211712.jpg', '33333333-3333-4333-8333-333333333333', 30, true),
    ('70707070-7070-4070-8070-707070707070', 'Belgian Dark Chocolate Silk Shake', 'Dutch processed cocoa, 70% dark Belgian chocolate ganache, rich milk, and chocolate chips.', 159.00, '/src/assets/images/category_fruit_shakes_1790231197381.jpg', '44444444-4444-4444-8444-444444444444', 40, true),
    ('80808080-8080-4080-8080-808080808080', 'Madagascar Vanilla Bean Milkshake', 'Slow-infused with genuine Madagascar bourbon vanilla caviar, whole milk, and whipped sweet cream.', 149.00, '/src/assets/images/category_fruit_shakes_1790231197381.jpg', '44444444-4444-4444-8444-444444444444', 36, true),
    ('90909090-9090-4090-8090-909090909090', 'Green Goddess Detox Cold-Press', 'Hydraulic cold-pressed English cucumber, crisp celery, green apple, spinach, ginger, and lime.', 159.00, '/src/assets/images/category_healthy_drinks_1790231228180.jpg', '66666666-6666-4666-8666-666666666666', 35, true),
    ('a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1', 'Virgin Mojito Mint Sparkle', 'Freshly muddled Persian lime wedges, garden spearmint, turbinado cane juice, and bubbly soda.', 129.00, '/src/assets/images/hero_fruit_juice_1790231167665.jpg', '55555555-5555-4555-8555-555555555555', 40, true)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    price = EXCLUDED.price, 
    stock_quantity = EXCLUDED.stock_quantity,
    is_available = EXCLUDED.is_available;

-- Offers
INSERT INTO public.offers (id, title, description, discount_percentage, image_url, is_active, start_date, end_date)
VALUES
    ('ffffffff-0000-4000-8000-000000000001', 'Fresh Start Welcome Offer', 'Get 20% off on all cold-pressed juices and seasonal fruit shakes!', 20.00, '/src/assets/images/hero_fruit_juice_1790231167665.jpg', true, now() - INTERVAL '10 days', now() + INTERVAL '30 days'),
    ('ffffffff-0000-4000-8000-000000000002', 'Smoothie Weekend Bonanza', 'Special 15% discount on all berry smoothies and detox cleanses.', 15.00, '/src/assets/images/category_smoothies_1790231211712.jpg', true, now() - INTERVAL '5 days', now() + INTERVAL '25 days')
ON CONFLICT (id) DO NOTHING;

-- Sample Reviews
INSERT INTO public.reviews (id, product_id, customer_name, rating, review_text)
VALUES
    ('99999999-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Priya Patel', 5, 'The Alphonso Mango juice is unbelievable. Tastes like freshly sliced Ratnagiri mangoes in a chilled bottle!'),
    ('99999999-2222-4222-8222-222222222222', '90909090-9090-4090-8090-909090909090', 'Dr. Neha Kapoor', 5, 'The Green Goddess Cleanse has zero bitterness and pure celery crispness. Morning vitality on point!'),
    ('99999999-3333-4333-8333-333333333333', '50505050-5050-4050-8050-505050505050', 'Vikram Joshi', 5, 'Wild Strawberry Bliss is the best post-workout refreshment. Thick, creamy and authentic!')
ON CONFLICT (id) DO NOTHING;
