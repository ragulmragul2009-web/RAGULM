export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: 'user' | 'admin';
  profile_picture?: string;
  created_at: string;
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
  product_count?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  category?: Category;
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
  product?: Partial<Product> | null;
  quantity: number;
  size: 'Small' | 'Medium' | 'Large';
  sugar_level: 'No Sugar' | 'Less Sugar' | 'Normal Sugar';
  ice_level: 'No Ice' | 'Less Ice' | 'Normal Ice';
  toppings: string[];
  notes?: string;
  unit_price: number;
  total_price: number;
}

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED';

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
  user_id?: string;
  user_name: string;
  rating: number;
  review_text?: string;
  comment?: string;
  is_verified_purchase?: boolean;
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

export interface AdminStats {
  totalSales: number;
  todayOrders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  completedOrders: number;
  recentOrders: Order[];
  categories: { id: string; name: string; sales: number }[];
  topProducts: { count: number; name: string; revenue: number }[];
}
