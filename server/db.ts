import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string;
  address: string;
  profile_picture?: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: 'Home' | 'Work' | 'Other';
  street: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  display_order: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  price: number;
  discount_price?: number;
  image: string;
  ingredients: string[];
  available_quantity: number;
  rating: number;
  reviews_count: number;
  status: 'active' | 'out_of_stock' | 'inactive';
  is_popular: boolean;
  is_featured: boolean;
  calories?: number;
  volume_ml?: number;
  created_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  size: 'Small' | 'Medium' | 'Large';
  sugar_level: 'No Sugar' | 'Less Sugar' | 'Normal Sugar';
  ice_level: 'No Ice' | 'Less Ice' | 'Normal Ice';
  toppings: string[];
  notes?: string;
  unit_price: number;
}

export interface Cart {
  id: string;
  user_id?: string;
  session_id: string;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  size: 'Small' | 'Medium' | 'Large';
  sugar_level: string;
  ice_level: string;
  toppings: string[];
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    instructions?: string;
  };
  subtotal: number;
  discount: number;
  delivery_fee: number;
  tax: number;
  grand_total: number;
  payment_method: 'Cash on Delivery' | 'UPI' | 'Card' | 'Online payment';
  payment_status: 'Pending' | 'Paid';
  order_status: OrderStatus;
  coupon_code?: string;
  notes?: string;
  status_history: {
    status: OrderStatus;
    timestamp: string;
    note: string;
  }[];
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  review_text: string;
  is_verified_purchase: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  title: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_discount?: number;
  expiry_date: string;
  is_active: boolean;
  usage_count: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  created_at: string;
}

interface DatabaseSchema {
  users: User[];
  addresses: Address[];
  categories: Category[];
  products: Product[];
  carts: Cart[];
  orders: Order[];
  reviews: Review[];
  coupons: Coupon[];
  contact_messages: ContactMessage[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'freshsip_db.json');

class Database {
  private data: DatabaseSchema = {
    users: [],
    addresses: [],
    categories: [],
    products: [],
    carts: [],
    orders: [],
    reviews: [],
    coupons: [],
    contact_messages: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(content);
        console.log('[Database] Loaded existing database from', DB_FILE);
      } catch (err) {
        console.error('[Database] Failed to read db file, re-seeding...', err);
        this.seedInitialData();
        this.save();
      }
    } else {
      console.log('[Database] Initializing new database with seed data...');
      this.seedInitialData();
      this.save();
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Database] Error saving database:', err);
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  private seedInitialData() {
    const salt = bcrypt.genSaltSync(10);
    const adminPasswordHash = bcrypt.hashSync('admin123', salt);
    const demoPasswordHash = bcrypt.hashSync('demo123', salt);

    const now = new Date().toISOString();

    // 1. Users
    this.data.users = [
      {
        id: 'usr_admin',
        name: 'Arjun Sharma (Admin)',
        email: 'admin@freshsip.com',
        password_hash: adminPasswordHash,
        phone: '+91 98765 43210',
        address: '42 Orchard Avenue, Juice District, Mumbai 400001',
        role: 'admin',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'usr_demo',
        name: 'Priya Patel',
        email: 'demo@freshsip.com',
        password_hash: demoPasswordHash,
        phone: '+91 98234 56789',
        address: 'Flat 304, Green Haven Towers, Bandra West, Mumbai 400050',
        role: 'user',
        created_at: now,
        updated_at: now,
      },
    ];

    // 2. Addresses
    this.data.addresses = [
      {
        id: 'addr_1',
        user_id: 'usr_demo',
        label: 'Home',
        street: 'Flat 304, Green Haven Towers, Hill Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        postal_code: '400050',
        is_default: true,
      },
      {
        id: 'addr_2',
        user_id: 'usr_demo',
        label: 'Work',
        street: '8th Floor, WeWork Solitaire, BKC',
        city: 'Mumbai',
        state: 'Maharashtra',
        postal_code: '400051',
        is_default: false,
      }
    ];

    // 3. Categories
    this.data.categories = [
      {
        id: 'cat_fresh_juices',
        name: 'Fresh Juices',
        slug: 'fresh-juices',
        description: '100% pure cold-pressed unpasteurized fruit juices extracted fresh to order.',
        image: '/src/assets/images/category_fresh_juices_1790231181678.jpg',
        display_order: 1,
      },
      {
        id: 'cat_fruit_shakes',
        name: 'Fruit Shakes',
        slug: 'fruit-shakes',
        description: 'Thick creamy shakes blended with fresh seasonal fruits and rich dairy or almond milk.',
        image: '/src/assets/images/category_fruit_shakes_1790231197381.jpg',
        display_order: 2,
      },
      {
        id: 'cat_smoothies',
        name: 'Smoothies',
        slug: 'smoothies',
        description: 'Nutrient-rich power blends packed with real berries, Greek yogurt, chia seeds, and superfoods.',
        image: '/src/assets/images/category_smoothies_1790231211712.jpg',
        display_order: 3,
      },
      {
        id: 'cat_milkshakes',
        name: 'Milkshakes',
        slug: 'milkshakes',
        description: 'Indulgent artisanal milkshakes crafted with slow-churned gelato and decadent toppings.',
        image: '/src/assets/images/category_fruit_shakes_1790231197381.jpg',
        display_order: 4,
      },
      {
        id: 'cat_mocktails',
        name: 'Mocktails',
        slug: 'mocktails',
        description: 'Bubbly, refreshing fruit mocktails with muddled herbs, citrus twists, and sparkling tonic.',
        image: '/src/assets/images/hero_fruit_juice_1790231167665.jpg',
        display_order: 5,
      },
      {
        id: 'cat_healthy_drinks',
        name: 'Healthy Drinks',
        slug: 'healthy-drinks',
        description: 'Physician-curated detox cleanses, immunity shots, and vitalizing alkaline elixirs.',
        image: '/src/assets/images/category_healthy_drinks_1790231228180.jpg',
        display_order: 6,
      },
    ];

    // 4. Products (24 Products)
    this.data.products = [
      // Fresh Juices
      {
        id: 'prod_mango_juice',
        name: 'Alphonso Mango Cold-Pressed Juice',
        slug: 'alphonso-mango-cold-pressed-juice',
        description: 'Pure sun-ripened Ratnagiri Alphonso mango nectar. Naturally sweet, thick, and bursting with tropical aroma.',
        category_id: 'cat_fresh_juices',
        price: 149,
        discount_price: 129,
        image: '/src/assets/images/category_fresh_juices_1790231181678.jpg',
        ingredients: ['100% Ratnagiri Alphonso Mango', 'Touch of Valencia Orange', 'Himalayan Pink Salt'],
        available_quantity: 45,
        rating: 4.9,
        reviews_count: 84,
        status: 'active',
        is_popular: true,
        is_featured: true,
        calories: 140,
        volume_ml: 350,
        created_at: now,
      },
      {
        id: 'prod_watermelon_juice',
        name: 'Ruby Crimson Watermelon Juice',
        slug: 'ruby-crimson-watermelon-juice',
        description: 'Hydrating, crisp watermelon juice with a splash of fresh Persian lime and aromatic garden mint.',
        category_id: 'cat_fresh_juices',
        price: 99,
        image: '/src/assets/images/category_fresh_juices_1790231181678.jpg',
        ingredients: ['Fresh Seedless Watermelon', 'Persian Lime Juice', 'Fresh Mint Leaves'],
        available_quantity: 60,
        rating: 4.8,
        reviews_count: 62,
        status: 'active',
        is_popular: true,
        is_featured: false,
        calories: 85,
        volume_ml: 350,
        created_at: now,
      },
      {
        id: 'prod_orange_juice',
        name: 'Valencia Sunburst Orange Juice',
        slug: 'valencia-sunburst-orange-juice',
        description: 'Cold-pressed from hand-picked Valencia oranges with rich juicy pulp. Packed with 100% daily Vitamin C.',
        category_id: 'cat_fresh_juices',
        price: 129,
        discount_price: 115,
        image: '/src/assets/images/category_fresh_juices_1790231181678.jpg',
        ingredients: ['100% Cold-Pressed Valencia Oranges', 'Orange Blossom Pulp'],
        available_quantity: 50,
        rating: 4.9,
        reviews_count: 53,
        status: 'active',
        is_popular: true,
        is_featured: true,
        calories: 110,
        volume_ml: 350,
        created_at: now,
      },
      {
        id: 'prod_pineapple_juice',
        name: 'Hawaiian Golden Pineapple Juice',
        slug: 'hawaiian-golden-pineapple-juice',
        description: 'Sweet and tangy golden pineapple juice with natural digestive bromelain enzymes.',
        category_id: 'cat_fresh_juices',
        price: 119,
        image: '/src/assets/images/category_fresh_juices_1790231181678.jpg',
        ingredients: ['Golden Ripe Pineapple', 'Meyer Lemon Zest', 'Mineral Water'],
        available_quantity: 40,
        rating: 4.7,
        reviews_count: 39,
        status: 'active',
        is_popular: false,
        is_featured: false,
        calories: 125,
        volume_ml: 350,
        created_at: now,
      },
      {
        id: 'prod_apple_juice',
        name: 'Royal Gala Crisp Apple Juice',
        slug: 'royal-gala-crisp-apple-juice',
        description: 'Slow-pressed from Himachal Royal Gala apples. Crisp, unclouded, with delicate floral notes.',
        category_id: 'cat_fresh_juices',
        price: 139,
        discount_price: 125,
        image: '/src/assets/images/category_fresh_juices_1790231181678.jpg',
        ingredients: ['Himachal Royal Gala Apples', 'Organic Cinnamon Bark', 'Lemon Splash'],
        available_quantity: 35,
        rating: 4.8,
        reviews_count: 41,
        status: 'active',
        is_popular: false,
        is_featured: false,
        calories: 130,
        volume_ml: 350,
        created_at: now,
      },
      {
        id: 'prod_pomegranate_juice',
        name: 'Ruby Jewel Pomegranate Juice',
        slug: 'ruby-jewel-pomegranate-juice',
        description: 'Deep crimson juice pressed from premium Bhagwa pomegranates. Loaded with powerful polyphenols and antioxidants.',
        category_id: 'cat_fresh_juices',
        price: 169,
        image: '/src/assets/images/category_fresh_juices_1790231181678.jpg',
        ingredients: ['100% Bhagwa Pomegranate Arils', 'Black Salt'],
        available_quantity: 30,
        rating: 4.9,
        reviews_count: 73,
        status: 'active',
        is_popular: true,
        is_featured: true,
        calories: 135,
        volume_ml: 350,
        created_at: now,
      },
      {
        id: 'prod_grape_juice',
        name: 'Seedless Black Grape Elixir',
        slug: 'seedless-black-grape-elixir',
        description: 'Rich, velvet juice from sweet Nashik black grapes with a refreshing subtle tart finish.',
        category_id: 'cat_fresh_juices',
        price: 129,
        image: '/src/assets/images/category_fresh_juices_1790231181678.jpg',
        ingredients: ['Nashik Black Grapes', 'Rock Salt', 'Mint Sprig'],
        available_quantity: 28,
        rating: 4.6,
        reviews_count: 29,
        status: 'active',
        is_popular: false,
        is_featured: false,
        calories: 120,
        volume_ml: 350,
        created_at: now,
      },
      {
        id: 'prod_mixed_fruit_juice',
        name: 'Island Tropical Mixed Fruit Juice',
        slug: 'island-tropical-mixed-fruit-juice',
        description: 'A harmonious fiesta of ripe mango, pineapple, orange, apple, and passion fruit.',
        category_id: 'cat_fresh_juices',
        price: 139,
        image: '/src/assets/images/hero_fruit_juice_1790231167665.jpg',
        ingredients: ['Mango', 'Pineapple', 'Valencia Orange', 'Apple', 'Passion Fruit Purée'],
        available_quantity: 55,
        rating: 4.9,
        reviews_count: 91,
        status: 'active',
        is_popular: true,
        is_featured: true,
        calories: 145,
        volume_ml: 350,
        created_at: now,
      },

      // Fruit Shakes
      {
        id: 'prod_mango_shake',
        name: 'Alphonso Mango Royal Thick Shake',
        slug: 'alphonso-mango-royal-thick-shake',
        description: 'Luscious Alphonso mango pulp blended with chilled full-cream milk, saffron strands, and roasted almond slivers.',
        category_id: 'cat_fruit_shakes',
        price: 159,
        discount_price: 139,
        image: '/src/assets/images/category_fruit_shakes_1790231197381.jpg',
        ingredients: ['Alphonso Mango Pulp', 'Full Cream Milk', 'Kashmiri Saffron', 'Slivered Almonds'],
        available_quantity: 40,
        rating: 4.9,
        reviews_count: 104,
        status: 'active',
        is_popular: true,
        is_featured: true,
        calories: 260,
        volume_ml: 400,
        created_at: now,
      },
      {
        id: 'prod_banana_shake',
        name: 'Creamy Cavendish Banana Shake',
        slug: 'creamy-cavendish-banana-shake',
        description: 'Rich ripe banana shake infused with wild honey, organic ground cardamom, and toasted walnuts.',
        category_id: 'cat_fruit_shakes',
        price: 119,
        image: '/src/assets/images/category_fruit_shakes_1790231197381.jpg',
        ingredients: ['Ripe Cavendish Bananas', 'Fresh Milk', 'Organic Honey', 'Cardamom', 'Walnuts'],
        available_quantity: 50,
        rating: 4.7,
        reviews_count: 48,
        status: 'active',
        is_popular: true,
        is_featured: false,
        calories: 240,
        volume_ml: 400,
        created_at: now,
      },
      {
        id: 'prod_avocado_shake',
        name: 'Velvet Hass Avocado Honey Shake',
        slug: 'velvet-hass-avocado-honey-shake',
        description: 'Buttery Hass avocados whipped with condensed milk, honey, and crushed pistachios. Decadent & wholesome.',
        category_id: 'cat_fruit_shakes',
        price: 179,
        image: '/src/assets/images/category_fruit_shakes_1790231197381.jpg',
        ingredients: ['Hass Avocado', 'Chilled Whole Milk', 'Forest Honey', 'Pistachio Flakes'],
        available_quantity: 25,
        rating: 4.8,
        reviews_count: 36,
        status: 'active',
        is_popular: false,
        is_featured: false,
        calories: 290,
        volume_ml: 400,
        created_at: now,
      },
      {
        id: 'prod_chikoo_shake',
        name: 'Caramel Chikoo (Sapodilla) Shake',
        slug: 'caramel-chikoo-sapodilla-shake',
        description: 'Naturally malt-sweet Dahanu chikoos pureed with rich milk and a hint of vanilla bean.',
        category_id: 'cat_fruit_shakes',
        price: 139,
        image: '/src/assets/images/category_fruit_shakes_1790231197381.jpg',
        ingredients: ['Fresh Chikoo (Sapodilla)', 'Cream Milk', 'Natural Vanilla Bean', 'Cashew Crumb'],
        available_quantity: 30,
        rating: 4.6,
        reviews_count: 28,
        status: 'active',
        is_popular: false,
        is_featured: false,
        calories: 230,
        volume_ml: 400,
        created_at: now,
      },

      // Smoothies
      {
        id: 'prod_strawberry_smoothie',
        name: 'Wild Strawberry Bliss Smoothie',
        slug: 'wild-strawberry-bliss-smoothie',
        description: 'Hand-picked Mahabaleshwar strawberries churned with creamy Greek yogurt, chia seeds, and wild agave.',
        category_id: 'cat_smoothies',
        price: 169,
        discount_price: 149,
        image: '/src/assets/images/category_smoothies_1790231211712.jpg',
        ingredients: ['Mahabaleshwar Strawberries', 'Artisanal Greek Yogurt', 'Chia Seeds', 'Agave Nectar'],
        available_quantity: 42,
        rating: 4.9,
        reviews_count: 88,
        status: 'active',
        is_popular: true,
        is_featured: true,
        calories: 210,
        volume_ml: 400,
        created_at: now,
      },
      {
        id: 'prod_berry_smoothie',
        name: 'Acai & Triple Berry Antioxidant Smoothie',
        slug: 'acai-triple-berry-antioxidant-smoothie',
        description: 'Amazonian acai berries, wild blueberries, raspberries, and blackberries with almond milk and hemp hearts.',
        category_id: 'cat_smoothies',
        price: 189,
        image: '/src/assets/images/category_smoothies_1790231211712.jpg',
        ingredients: ['Organic Acai', 'Blueberries', 'Blackberries', 'Raspberries', 'Almond Milk', 'Hemp Hearts'],
        available_quantity: 35,
        rating: 5.0,
        reviews_count: 95,
        status: 'active',
        is_popular: true,
        is_featured: true,
        calories: 195,
        volume_ml: 400,
        created_at: now,
      },
      {
        id: 'prod_dragonfruit_smoothie',
        name: 'Pitaya Dragonfruit & Passion Smoothie',
        slug: 'pitaya-dragonfruit-passion-smoothie',
        description: 'Exotic magenta dragonfruit blended with tart passion fruit purée, coconut milk, and flax seeds.',
        category_id: 'cat_smoothies',
        price: 179,
        image: '/src/assets/images/category_smoothies_1790231211712.jpg',
        ingredients: ['Red Pitaya Dragonfruit', 'Passion Fruit Coulis', 'Creamy Coconut Milk', 'Flax Seeds'],
        available_quantity: 30,
        rating: 4.8,
        reviews_count: 51,
        status: 'active',
        is_popular: false,
        is_featured: false,
        calories: 180,
        volume_ml: 400,
        created_at: now,
      },
      {
        id: 'prod_blueberry_protein_smoothie',
        name: 'Blueberry Plant-Protein Power Smoothie',
        slug: 'blueberry-plant-protein-power-smoothie',
        description: 'Blueberries, organic peanut butter, rolled oats, plant pea protein (22g protein), and oat milk.',
        category_id: 'cat_smoothies',
        price: 199,
        image: '/src/assets/images/category_smoothies_1790231211712.jpg',
        ingredients: ['Blueberries', 'Plant Pea Protein (22g)', 'Rolled Oats', 'Natural Peanut Butter', 'Oat Milk'],
        available_quantity: 28,
        rating: 4.9,
        reviews_count: 67,
        status: 'active',
        is_popular: true,
        is_featured: false,
        calories: 310,
        volume_ml: 450,
        created_at: now,
      },

      // Milkshakes
      {
        id: 'prod_chocolate_milkshake',
        name: 'Belgian Dark Chocolate Silk Shake',
        slug: 'belgian-dark-chocolate-silk-shake',
        description: 'Intense 70% Callebaut Belgian chocolate ganache melted with dairy cream and cacao nib crunch.',
        category_id: 'cat_milkshakes',
        price: 169,
        discount_price: 149,
        image: '/src/assets/images/category_fruit_shakes_1790231197381.jpg',
        ingredients: ['70% Belgian Dark Chocolate', 'Fresh Dairy Milk', 'Chocolate Fudge Coulis', 'Cacao Nibs'],
        available_quantity: 40,
        rating: 4.9,
        reviews_count: 112,
        status: 'active',
        is_popular: true,
        is_featured: true,
        calories: 340,
        volume_ml: 400,
        created_at: now,
      },
      {
        id: 'prod_vanilla_milkshake',
        name: 'Madagascar Vanilla Bean Milkshake',
        slug: 'madagascar-vanilla-bean-milkshake',
        description: 'Slow-infused with genuine Madagascar bourbon vanilla caviar, whole milk, and whipped sweet cream.',
        category_id: 'cat_milkshakes',
        price: 149,
        image: '/src/assets/images/category_fruit_shakes_1790231197381.jpg',
        ingredients: ['Bourbon Vanilla Bean Pods', 'Whole Farm Milk', 'Sweetened Cream', 'White Chocolate Shavings'],
        available_quantity: 36,
        rating: 4.7,
        reviews_count: 44,
        status: 'active',
        is_popular: false,
        is_featured: false,
        calories: 280,
        volume_ml: 400,
        created_at: now,
      },
      {
        id: 'prod_pistachio_shake',
        name: 'Roasted Pistachio Kulfi Shake',
        slug: 'roasted-pistachio-kulfi-shake',
        description: 'Slow-simmered rabri kulfi notes infused with roasted green pistachios and fragrant cardamom.',
        category_id: 'cat_milkshakes',
        price: 189,
        image: '/src/assets/images/category_fruit_shakes_1790231197381.jpg',
        ingredients: ['Persian Green Pistachios', 'Reduced Condensed Milk', 'Green Cardamom', 'Edible Silver Leaf'],
        available_quantity: 24,
        rating: 4.9,
        reviews_count: 58,
        status: 'active',
        is_popular: true,
        is_featured: false,
        calories: 320,
        volume_ml: 400,
        created_at: now,
      },

      // Mocktails
      {
        id: 'prod_mint_mojito',
        name: 'Virgin Mint Lime Sparkling Mojito',
        slug: 'virgin-mint-lime-sparkling-mojito',
        description: 'Crushed garden mint, freshly squeezed key limes, raw demerara syrup, and effervescent sparkling soda.',
        category_id: 'cat_mocktails',
        price: 129,
        image: '/src/assets/images/hero_fruit_juice_1790231167665.jpg',
        ingredients: ['Fresh Spearmint', 'Key Lime Juice', 'Cane Sugar Syrup', 'Chilled Sparkling Soda'],
        available_quantity: 50,
        rating: 4.8,
        reviews_count: 76,
        status: 'active',
        is_popular: true,
        is_featured: false,
        calories: 90,
        volume_ml: 380,
        created_at: now,
      },
      {
        id: 'prod_peach_ginger_fizz',
        name: 'Spiced Peach & Ginger Fizz',
        slug: 'spiced-peach-ginger-fizz',
        description: 'Muddled ripe yellow peaches, cold-pressed ginger root, lime twist, and sparkling tonic water.',
        category_id: 'cat_mocktails',
        price: 139,
        image: '/src/assets/images/hero_fruit_juice_1790231167665.jpg',
        ingredients: ['Muddled Yellow Peaches', 'Fresh Ginger Juice', 'Lime Wheels', 'Tonic Water'],
        available_quantity: 35,
        rating: 4.7,
        reviews_count: 38,
        status: 'active',
        is_popular: false,
        is_featured: false,
        calories: 105,
        volume_ml: 380,
        created_at: now,
      },

      // Healthy Drinks
      {
        id: 'prod_green_goddess',
        name: 'Green Goddess Detox Cleanse',
        slug: 'green-goddess-detox-cleanse',
        description: 'Crisp green apple, crunchy celery stalks, English cucumber, leafy spinach, and zesty ginger root.',
        category_id: 'cat_healthy_drinks',
        price: 159,
        discount_price: 139,
        image: '/src/assets/images/category_healthy_drinks_1790231228180.jpg',
        ingredients: ['Granny Smith Apple', 'Celery Stalks', 'Cucumber', 'Spinach', 'Lemon', 'Ginger'],
        available_quantity: 45,
        rating: 4.9,
        reviews_count: 92,
        status: 'active',
        is_popular: true,
        is_featured: true,
        calories: 75,
        volume_ml: 350,
        created_at: now,
      },
      {
        id: 'prod_abc_glow',
        name: 'Pure ABC Glow Juice (Apple, Beet, Carrot)',
        slug: 'pure-abc-glow-juice',
        description: 'The miracle tonic: sweet red apples, blood-purifying beetroots, beta-carotene carrots, and fresh amla.',
        category_id: 'cat_healthy_drinks',
        price: 159,
        image: '/src/assets/images/category_healthy_drinks_1790231228180.jpg',
        ingredients: ['Himachal Apples', 'Organic Beetroot', 'Red Carrots', 'Indian Gooseberry (Amla)', 'Ginger'],
        available_quantity: 48,
        rating: 4.9,
        reviews_count: 85,
        status: 'active',
        is_popular: true,
        is_featured: true,
        calories: 115,
        volume_ml: 350,
        created_at: now,
      },
      {
        id: 'prod_immunity_booster',
        name: 'Golden Turmeric & Orange Immunity Booster',
        slug: 'golden-turmeric-orange-immunity-booster',
        description: 'Fresh pressed orange, raw lakadong turmeric with high curcumin, ginger, honey, and a pinch of black pepper.',
        category_id: 'cat_healthy_drinks',
        price: 149,
        image: '/src/assets/images/category_healthy_drinks_1790231228180.jpg',
        ingredients: ['Valencia Orange', 'Raw Lakadong Turmeric', 'Fresh Ginger', 'Wild Honey', 'Black Pepper'],
        available_quantity: 40,
        rating: 4.8,
        reviews_count: 53,
        status: 'active',
        is_popular: false,
        is_featured: false,
        calories: 95,
        volume_ml: 300,
        created_at: now,
      }
    ];

    // 5. Coupons
    this.data.coupons = [
      {
        id: 'coup_1',
        code: 'FRESH20',
        title: '20% OFF on all orders above ₹299',
        discount_type: 'percentage',
        discount_value: 20,
        min_order_value: 299,
        max_discount: 100,
        expiry_date: '2026-12-31',
        is_active: true,
        usage_count: 142,
      },
      {
        id: 'coup_2',
        code: 'BUY2GET1',
        title: 'Save ₹150 on your party order above ₹499',
        discount_type: 'fixed',
        discount_value: 150,
        min_order_value: 499,
        expiry_date: '2026-12-31',
        is_active: true,
        usage_count: 89,
      },
      {
        id: 'coup_3',
        code: 'FREESHIP',
        title: 'Free Delivery on orders above ₹399',
        discount_type: 'fixed',
        discount_value: 40,
        min_order_value: 399,
        expiry_date: '2026-12-31',
        is_active: true,
        usage_count: 215,
      },
      {
        id: 'coup_4',
        code: 'WELCOME50',
        title: 'Flat ₹50 OFF for your first refreshing sip',
        discount_type: 'fixed',
        discount_value: 50,
        min_order_value: 199,
        expiry_date: '2026-12-31',
        is_active: true,
        usage_count: 310,
      }
    ];

    // 6. Reviews (12 Verified Customer Reviews)
    this.data.reviews = [
      {
        id: 'rev_1',
        product_id: 'prod_mango_juice',
        user_id: 'usr_demo',
        user_name: 'Priya Patel',
        rating: 5,
        review_text: 'Tastes like biting straight into a chilled ripe Alphonso mango! No added sugar needed, completely authentic and rich.',
        is_verified_purchase: true,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'rev_2',
        product_id: 'prod_mango_juice',
        user_id: 'usr_user2',
        user_name: 'Vikram Joshi',
        rating: 5,
        review_text: 'Ordered 4 bottles for breakfast. Delivery arrived in 25 minutes, chilled with ice packs. Incredible quality!',
        is_verified_purchase: true,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'rev_3',
        product_id: 'prod_watermelon_juice',
        user_id: 'usr_user3',
        user_name: 'Ananya Roy',
        rating: 5,
        review_text: 'The mint and lime combination in the watermelon juice is pure genius. So cooling after my morning run.',
        is_verified_purchase: true,
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
      {
        id: 'rev_4',
        product_id: 'prod_orange_juice',
        user_id: 'usr_demo',
        user_name: 'Priya Patel',
        rating: 5,
        review_text: 'Real pulp, perfectly balanced tart and sweet notes. Far superior to packaged juices with preservatives.',
        is_verified_purchase: true,
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
      {
        id: 'rev_5',
        product_id: 'prod_mango_shake',
        user_id: 'usr_user4',
        user_name: 'Karan Mehra',
        rating: 5,
        review_text: 'The thickest mango shake in town. Generous almond slivers on top and the saffron flavor is exquisite.',
        is_verified_purchase: true,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: 'rev_6',
        product_id: 'prod_strawberry_smoothie',
        user_id: 'usr_user5',
        user_name: 'Sunita Menon',
        rating: 5,
        review_text: 'Creamy Greek yogurt with fresh strawberries is unbeatable. Chia seeds give it a wonderful crunch.',
        is_verified_purchase: true,
        created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      },
      {
        id: 'rev_7',
        product_id: 'prod_berry_smoothie',
        user_id: 'usr_demo',
        user_name: 'Priya Patel',
        rating: 5,
        review_text: 'Deep purple color, full of flavor and antioxidant punch. My daily morning ritual!',
        is_verified_purchase: true,
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id: 'rev_8',
        product_id: 'prod_chocolate_milkshake',
        user_id: 'usr_user6',
        user_name: 'Rohan Deshmukh',
        rating: 5,
        review_text: 'Genuinely rich Belgian dark chocolate, not overly sweet. It satisfies my chocolate cravings completely.',
        is_verified_purchase: true,
        created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
      },
      {
        id: 'rev_9',
        product_id: 'prod_green_goddess',
        user_id: 'usr_user7',
        user_name: 'Dr. Neha Kapoor',
        rating: 5,
        review_text: 'Extremely clean green juice. The ginger adds the right kick without overpowering the celery and cucumber.',
        is_verified_purchase: true,
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      },
      {
        id: 'rev_10',
        product_id: 'prod_abc_glow',
        user_id: 'usr_user8',
        user_name: 'Tanvi Shah',
        rating: 5,
        review_text: 'Noticeable skin radiance after drinking this for two weeks straight. Love FreshSip!',
        is_verified_purchase: true,
        created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
      },
    ];

    // 7. Seed Sample Orders with timeline
    const orderDate1 = new Date(Date.now() - 1000 * 60 * 45).toISOString(); // 45 mins ago
    const orderDate2 = new Date(Date.now() - 86400000 * 1).toISOString(); // yesterday
    const orderDate3 = new Date(Date.now() - 86400000 * 3).toISOString(); // 3 days ago

    this.data.orders = [
      {
        id: 'ord_1001',
        order_number: 'FS-98421',
        user_id: 'usr_demo',
        customer_name: 'Priya Patel',
        customer_email: 'demo@freshsip.com',
        customer_phone: '+91 98234 56789',
        delivery_address: {
          street: 'Flat 304, Green Haven Towers, Hill Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          postal_code: '400050',
          instructions: 'Please ring bell twice and leave at doorstep.',
        },
        subtotal: 397,
        discount: 79,
        delivery_fee: 0,
        tax: 16,
        grand_total: 334,
        payment_method: 'UPI',
        payment_status: 'Paid',
        order_status: 'OUT_FOR_DELIVERY',
        coupon_code: 'FRESH20',
        status_history: [
          { status: 'PLACED', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), note: 'Order placed successfully by customer.' },
          { status: 'CONFIRMED', timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(), note: 'Kitchen team accepted and scheduled preparation.' },
          { status: 'PREPARING', timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), note: 'Cold-pressing fresh mangoes and preparing smoothies.' },
          { status: 'READY', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), note: 'Bottled, packed in thermal insulated cooling bag.' },
          { status: 'OUT_FOR_DELIVERY', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), note: 'Delivery partner Suresh is en route with your fresh order.' },
        ],
        items: [
          {
            id: 'ord_item_1',
            order_id: 'ord_1001',
            product_id: 'prod_mango_juice',
            product_name: 'Alphonso Mango Cold-Pressed Juice',
            product_image: '/src/assets/images/category_fresh_juices_1790231181678.jpg',
            quantity: 2,
            size: 'Medium',
            sugar_level: 'Normal Sugar',
            ice_level: 'Normal Ice',
            toppings: ['Chia Seeds'],
            unit_price: 129,
            total_price: 258,
          },
          {
            id: 'ord_item_2',
            order_id: 'ord_1001',
            product_id: 'prod_strawberry_smoothie',
            product_name: 'Wild Strawberry Bliss Smoothie',
            product_image: '/src/assets/images/category_smoothies_1790231211712.jpg',
            quantity: 1,
            size: 'Medium',
            sugar_level: 'Less Sugar',
            ice_level: 'Less Ice',
            toppings: ['Honey Drizzle'],
            unit_price: 149,
            total_price: 149,
          }
        ],
        created_at: orderDate1,
        updated_at: now,
      },
      {
        id: 'ord_1002',
        order_number: 'FS-98319',
        user_id: 'usr_demo',
        customer_name: 'Priya Patel',
        customer_email: 'demo@freshsip.com',
        customer_phone: '+91 98234 56789',
        delivery_address: {
          street: 'Flat 304, Green Haven Towers, Hill Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          postal_code: '400050',
        },
        subtotal: 318,
        discount: 50,
        delivery_fee: 30,
        tax: 15,
        grand_total: 313,
        payment_method: 'Card',
        payment_status: 'Paid',
        order_status: 'DELIVERED',
        coupon_code: 'WELCOME50',
        status_history: [
          { status: 'PLACED', timestamp: orderDate2, note: 'Order placed.' },
          { status: 'CONFIRMED', timestamp: orderDate2, note: 'Order confirmed.' },
          { status: 'PREPARING', timestamp: orderDate2, note: 'Juices freshly extracted.' },
          { status: 'READY', timestamp: orderDate2, note: 'Juices sealed and chilled.' },
          { status: 'OUT_FOR_DELIVERY', timestamp: orderDate2, note: 'Dispatched for delivery.' },
          { status: 'DELIVERED', timestamp: orderDate2, note: 'Delivered securely to customer.' },
        ],
        items: [
          {
            id: 'ord_item_3',
            order_id: 'ord_1002',
            product_id: 'prod_green_goddess',
            product_name: 'Green Goddess Detox Cleanse',
            product_image: '/src/assets/images/category_healthy_drinks_1790231228180.jpg',
            quantity: 2,
            size: 'Large',
            sugar_level: 'No Sugar',
            ice_level: 'No Ice',
            toppings: [],
            unit_price: 159,
            total_price: 318,
          }
        ],
        created_at: orderDate2,
        updated_at: orderDate2,
      },
      {
        id: 'ord_1003',
        order_number: 'FS-97880',
        user_id: 'usr_user4',
        customer_name: 'Karan Mehra',
        customer_email: 'karan@example.com',
        customer_phone: '+91 97654 32190',
        delivery_address: {
          street: 'Penthouse 12, Sky Deck, Worli',
          city: 'Mumbai',
          state: 'Maharashtra',
          postal_code: '400018',
        },
        subtotal: 517,
        discount: 100,
        delivery_fee: 0,
        tax: 21,
        grand_total: 438,
        payment_method: 'Cash on Delivery',
        payment_status: 'Paid',
        order_status: 'DELIVERED',
        status_history: [
          { status: 'PLACED', timestamp: orderDate3, note: 'Order placed.' },
          { status: 'DELIVERED', timestamp: orderDate3, note: 'Delivered successfully.' },
        ],
        items: [
          {
            id: 'ord_item_4',
            order_id: 'ord_1003',
            product_id: 'prod_mango_shake',
            product_name: 'Alphonso Mango Royal Thick Shake',
            product_image: '/src/assets/images/category_fruit_shakes_1790231197381.jpg',
            quantity: 2,
            size: 'Large',
            sugar_level: 'Normal Sugar',
            ice_level: 'Normal Ice',
            toppings: ['Nuts & Dry Fruits'],
            unit_price: 179,
            total_price: 358,
          },
          {
            id: 'ord_item_5',
            order_id: 'ord_1003',
            product_id: 'prod_chocolate_milkshake',
            product_name: 'Belgian Dark Chocolate Silk Shake',
            product_image: '/src/assets/images/category_fruit_shakes_1790231197381.jpg',
            quantity: 1,
            size: 'Medium',
            sugar_level: 'Normal Sugar',
            ice_level: 'Normal Ice',
            toppings: ['Chocolate Chips'],
            unit_price: 159,
            total_price: 159,
          }
        ],
        created_at: orderDate3,
        updated_at: orderDate3,
      }
    ];

    // 8. Contact Messages
    this.data.contact_messages = [
      {
        id: 'msg_1',
        name: 'Ritu Sen',
        email: 'ritu@example.com',
        phone: '+91 99887 76655',
        message: 'Do you offer custom bulk juice catering for corporate wellness workshops in BKC?',
        status: 'read',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'msg_2',
        name: 'Amitabh Verma',
        email: 'amitabh@example.com',
        phone: '+91 98771 22334',
        message: 'Can I request 100% glass bottle packaging and bottle return recycling in Mumbai?',
        status: 'unread',
        created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      }
    ];
  }
}

export const db = new Database();
